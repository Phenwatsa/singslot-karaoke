import { Router } from 'express';
import { Role } from '@prisma/client';
import { verifyToken, requireRole } from '../middlewares/auth';
import {
  createOnlineBooking,
  createWalkInBooking,
  cancelBooking,
  rescheduleBooking,
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
 * POST /api/bookings/walk-in (FR-07, AC-07, BR-08)
 * Staff walk-in booking counter route. Restricted strictly to STAFF role.
 */
bookingRouter.post(
  '/walk-in',
  verifyToken,
  requireRole(Role.STAFF),
  createWalkInBooking
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
 * GET /api/bookings/master (FR-06, FR-11, AC-06, AC-11, BR-08)
 * Staff master schedule & multi-criteria search route across all 9 rooms.
 * Restricted strictly to STAFF role.
 */
bookingRouter.get(
  '/master',
  verifyToken,
  requireRole(Role.STAFF),
  getMasterSchedule
);

/**
 * PATCH /api/bookings/:id/cancel (FR-09, AC-09, AC-09a, BR-07, BR-09)
 * Cancels a CONFIRMED booking (Owner or Staff, >= 24 hours prior to start).
 */
bookingRouter.patch(
  '/:id/cancel',
  verifyToken,
  cancelBooking
);

/**
 * PATCH /api/bookings/:id/reschedule (FR-10, AC-10, BR-07, BR-09, BR-11, BR-12)
 * Atomically reschedules a CONFIRMED booking (Owner or Staff, >= 24 hours prior to start).
 */
bookingRouter.patch(
  '/:id/reschedule',
  verifyToken,
  rescheduleBooking
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
