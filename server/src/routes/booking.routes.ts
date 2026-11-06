import { Router, Request, Response } from 'express';
import { Role } from '@prisma/client';
import { verifyToken, requireRole } from '../middlewares/auth';
import { createOnlineBooking } from '../controllers/booking.controller';

export const bookingRouter = Router();

/**
 * POST /api/bookings/online
 * Customer online booking route.
 * Enforces authentication via verifyToken and restricts access strictly to CUSTOMER role
 * via requireRole(Role.CUSTOMER). Validates contiguous slots, duration, capacity, past-slot rules,
 * and executes creation inside an atomic Prisma transaction.
 */
bookingRouter.post(
  '/online',
  verifyToken,
  requireRole(Role.CUSTOMER),
  createOnlineBooking
);

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
