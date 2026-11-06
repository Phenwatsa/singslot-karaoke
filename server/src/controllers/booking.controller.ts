import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../prisma';
import { isValidDateString, isSlotInPast } from './availability.controller';

/**
 * Generates a human-readable, unique booking code.
 * Format: BK-YYYYMMDD-XXXX (e.g., BK-20261110-A1B2)
 */
export const generateBookingCode = (bookingDate: string): string => {
  const cleanDate = bookingDate.replace(/-/g, '');
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `BK-${cleanDate}-${randomSuffix}`;
};

/**
 * Computes human-readable time range string from start slot and duration.
 * E.g., startSlot: 0, duration: 3 -> "10:00 - 13:00"
 * E.g., startSlot: 13, duration: 1 -> "23:00 - 24:00"
 */
export const formatBookingTimeRange = (startSlot: number, durationHours: number): string => {
  const startHour = 10 + startSlot;
  const endHour = startHour + durationHours;
  return `${String(startHour).padStart(2, '0')}:00 - ${String(endHour).padStart(2, '0')}:00`;
};

/**
 * POST /api/bookings/online
 * Customer online booking endpoint with strict ACID transactional guarantees.
 * Enforces BR-01 (Contiguous Slots), BR-03 (Operating Window), BR-04 (Past Slot Rejection),
 * BR-05 (Capacity Limit), BR-06 (Concurrency Safety), and NFR-03 (Transaction Rollback).
 */
export const createOnlineBooking = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { roomId, bookingDate, startSlot, durationHours, partySize } = req.body;

    // 1. Mandatory Input Existence Check
    if (
      !roomId ||
      typeof roomId !== 'string' ||
      !bookingDate ||
      typeof bookingDate !== 'string' ||
      startSlot === undefined ||
      durationHours === undefined ||
      partySize === undefined
    ) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Missing or malformed required fields (roomId, bookingDate, startSlot, durationHours, partySize).'
        }
      });
      return;
    }

    // 2. Calendar Date Format Validation
    if (!isValidDateString(bookingDate)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Invalid booking date. Expected YYYY-MM-DD calendar date.'
        }
      });
      return;
    }

    // 3. Operating Window & Duration Boundary (BR-03)
    if (
      typeof startSlot !== 'number' ||
      !Number.isInteger(startSlot) ||
      startSlot < 0 ||
      startSlot > 13 ||
      typeof durationHours !== 'number' ||
      !Number.isInteger(durationHours) ||
      durationHours < 1 ||
      durationHours > 5 ||
      startSlot + durationHours - 1 > 13
    ) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DURATION',
          message: 'Duration must be between 1 and 5 contiguous hours and end within operating hours (10:00 - 24:00, slots 0..13).'
        }
      });
      return;
    }

    // 4. Party Size Lower Boundary Validation
    if (typeof partySize !== 'number' || !Number.isInteger(partySize) || partySize < 1) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Party size must be an integer of at least 1 guest.'
        }
      });
      return;
    }

    // 5. Room Existence & Capacity Verification (BR-05)
    const room = await prisma.room.findFirst({
      where: {
        OR: [{ id: roomId }, { roomNumber: roomId }],
        isActive: true
      }
    });

    if (!room) {
      res.status(404).json({
        success: false,
        error: {
          code: 'ROOM_NOT_FOUND',
          message: 'Target room does not exist or is inactive.'
        }
      });
      return;
    }

    if (partySize > room.capacity) {
      res.status(400).json({
        success: false,
        error: {
          code: 'EXCEEDS_CAPACITY',
          message: `Party size (${partySize}) exceeds room capacity (${room.capacity}).`
        }
      });
      return;
    }

    // 6. Past-Time Slot Rejection in Asia/Bangkok (BR-04)
    if (isSlotInPast(bookingDate, startSlot)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'CANNOT_BOOK_PAST_SLOT',
          message: 'Cannot book slots in the past or currently in progress.'
        }
      });
      return;
    }

    // 7. Contiguous Vacancy Validation (BR-01, BR-02)
    // Validate that every requested slot in the contiguous interval [startSlot .. startSlot + duration - 1] is vacant
    const requestedSlots = Array.from(
      { length: durationHours },
      (_, i) => startSlot + i
    );

    const [conflictingBookings, conflictingBlocks] = await Promise.all([
      prisma.bookingSlot.findMany({
        where: {
          roomId: room.id,
          bookingDate,
          slotIndex: { in: requestedSlots },
          booking: { status: 'CONFIRMED' }
        }
      }),
      prisma.roomBlock.findMany({
        where: {
          roomId: room.id,
          blockDate: bookingDate,
          slotIndex: { in: requestedSlots }
        }
      })
    ]);

    if (conflictingBookings.length > 0 || conflictingBlocks.length > 0) {
      res.status(409).json({
        success: false,
        error: {
          code: 'SLOT_CONFLICT',
          message: 'One or more requested slots are already occupied.'
        }
      });
      return;
    }

    // 8. Atomic Booking Creation inside Transaction (NFR-03, BR-06)
    const bookingCode = generateBookingCode(bookingDate);
    const userId = req.user!.id;

    try {
      const newBooking = await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({ where: { id: userId } });
        const customerName = user?.fullName || req.user!.email;
        const customerPhone = user?.phone || null;

        const booking = await tx.booking.create({
          data: {
            bookingCode,
            userId,
            roomId: room.id,
            bookingDate,
            startSlot,
            durationHours,
            partySize,
            channel: 'ONLINE',
            customerName,
            customerPhone,
            status: 'CONFIRMED',
            slots: {
              create: requestedSlots.map((slotIndex) => ({
                roomId: room.id,
                bookingDate,
                slotIndex
              }))
            }
          },
          include: {
            room: true
          }
        });

        // Fault Injection hook for NFR-03 / TEST-04f
        if (
          process.env.NODE_ENV === 'test' &&
          req.headers['x-simulate-failure'] === 'true'
        ) {
          throw new Error('Simulated transaction failure for TEST-04f');
        }

        return booking;
      });

      const timeRange = formatBookingTimeRange(newBooking.startSlot, newBooking.durationHours);

      res.status(201).json({
        success: true,
        booking: {
          id: newBooking.id,
          bookingCode: newBooking.bookingCode,
          roomNumber: newBooking.room.roomNumber,
          bookingDate: newBooking.bookingDate,
          timeRange,
          durationHours: newBooking.durationHours,
          partySize: newBooking.partySize,
          status: newBooking.status
        }
      });
    } catch (txError: any) {
      // Catch concurrent collision via PostgreSQL composite unique constraint @@unique([roomId, bookingDate, slotIndex])
      // Strictly verify that the collision target is the slot composite constraint and not an unrelated unique field (e.g. bookingCode)
      if (txError.code === 'P2002') {
        const target = txError.meta?.target;
        const isSlotConstraint =
          (Array.isArray(target) && target.includes('slotIndex')) ||
          (typeof target === 'string' &&
            (target.includes('slotIndex') || target.includes('booking_slots') || target.includes('roomId_bookingDate_slotIndex')));

        if (isSlotConstraint) {
          res.status(409).json({
            success: false,
            error: {
              code: 'SLOT_CONFLICT',
              message: 'One or more requested slots were just reserved by another booking.'
            }
          });
          return;
        }
      }
      throw txError;
    }
  } catch (error) {
    next(error);
  }
};
