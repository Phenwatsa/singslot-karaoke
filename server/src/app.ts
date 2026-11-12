import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { prisma } from './prisma';
import { authRouter } from './routes/auth.routes';
import { bookingRouter } from './routes/booking.routes';
import { roomRouter } from './routes/room.routes';
import { availabilityRouter } from './routes/availability.routes';

dotenv.config();

export const app: Application = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Basic health check route
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'UP',
      service: 'SingSlot API',
      timestamp: new Date().toISOString()
    }
  });
});

// Shared in-flight database check promise to prevent connection pool exhaustion
let activeDbCheck: Promise<void> | null = null;
const READINESS_TIMEOUT_MS = 3000;

// Exported exclusively for testing isolation (resets in-flight state between test cases)
export function _resetActiveDbCheck(): void {
  activeDbCheck = null;
}

// Readiness probe route for container orchestration and health monitoring (R-02)
app.get('/api/ready', async (_req: Request, res: Response) => {
  if (!activeDbCheck) {
    // Bind activeDbCheck strictly to the actual Prisma Query Promise
    // Clears strictly when the underlying driver query settles (resolves or rejects)
    activeDbCheck = (async () => {
      await prisma.$queryRaw`SELECT 1`;
    })().finally(() => {
      activeDbCheck = null;
    });
  }

  let timer: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error('READINESS_TIMEOUT'));
    }, READINESS_TIMEOUT_MS);
    if (typeof timer.unref === 'function') {
      timer.unref();
    }
  });

  try {
    await Promise.race([activeDbCheck, timeoutPromise]);
    return res.status(200).json({
      status: 'ready',
      db: 'connected'
    });
  } catch {
    return res.status(503).json({
      status: 'not_ready',
      error: 'Database unreachable'
    });
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
});

// Domain Routes
app.use('/api/auth', authRouter);
app.use('/api/bookings', bookingRouter);
app.use('/api/rooms', roomRouter);
app.use('/api/availability', availabilityRouter);

// Static assets serving in production container (Single-Origin Cloud Run deployment)
const clientDist = process.env.CLIENT_DIST_PATH || path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api/')) {
      return next();
    }
    const indexHtml = path.join(clientDist, 'index.html');
    if (fs.existsSync(indexHtml)) {
      return res.sendFile(indexHtml);
    }
    next();
  });
}

// Unmatched route 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'The requested API route was not found'
    }
  });
});

// Centralized error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || 500;
  const code = err.code || 'INTERNAL_SERVER_ERROR';
  const message = err.message || 'An unexpected error occurred';

  res.status(status).json({
    success: false,
    error: {
      code,
      message
    }
  });
});
