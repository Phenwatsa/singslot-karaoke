import { Router, Request, Response } from 'express';
import { Role } from '@prisma/client';
import { verifyToken, requireRole } from '../middlewares/auth';

export const bookingRouter = Router();

/**
 * GET /api/bookings/master
 * Staff-only master schedule inspection route.
 * In Sprint 1 Issue #2, this route enforces RBAC guard (verifyToken + requireRole('STAFF')).
 * Full booking query implementation will be activated in Issue #6.
 */
bookingRouter.get(
  '/master',
  verifyToken,
  requireRole(Role.STAFF),
  (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      message: 'Staff master schedule authorized',
      bookings: []
    });
  }
);
