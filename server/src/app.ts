import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authRouter } from './routes/auth.routes';
import { bookingRouter } from './routes/booking.routes';

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

// Domain Routes
app.use('/api/auth', authRouter);
app.use('/api/bookings', bookingRouter);

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
