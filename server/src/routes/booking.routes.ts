import { Router } from 'express';
import { Role } from '@prisma/client';
import { verifyToken, requireRole } from '../middlewares/auth';
import {
  createOnlineBooking,
  getMyBookings,
  getBookingById,
  getMasterSchedule
} from '../controllers/booking.controller';

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
 * GET /api/bookings/my (FR-05, AC-05)
 * Customer personal booking history route.
 * Returns strictly the reservations belonging to the authenticated user.
 */
bookingRouter.get(
  '/my',
  verifyToken,
  getMyBookings
);

/**
 * GET /api/bookings/master?date=YYYY-MM-DD (FR-06, AC-06, BR-08)
 * Staff master schedule query route across all 9 rooms for a target calendar date.
 * Restricted strictly to STAFF role.
 */
bookingRouter.get(
  '/master',
  verifyToken,
  requireRole(Role.STAFF),
  getMasterSchedule
);

/**
 * GET /api/bookings/:id (FR-05, AC-05b, BR-07)
 * Booking detail inspection route enforcing strict ownership.
 * Grants access if caller is the booking owner OR has role STAFF; returns 403 otherwise.
 */
bookingRouter.get(
  '/:id',
  verifyToken,
  getBookingById
);
