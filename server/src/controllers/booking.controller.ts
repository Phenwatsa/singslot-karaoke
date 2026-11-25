import { Request, Response, NextFunction } from 'express';
import { Prisma, Role } from '@prisma/client';
import { prisma } from '../prisma';
import { isValidDateString, isSlotWithinOnlineCutoff } from './availability.controller';

export const PEAK_HOUR_SLOTS = new Set([8, 9, 10, 11]); // 18:00 - 22:00 ICT
export const MAX_PEAK_DURATION_HOURS = 3;
export const MAX_DAILY_CUSTOMER_HOURS = 6;

/**
 * Returns true if [startSlot, startSlot + durationHours - 1] overlaps any Peak Hour slot (8..11).
 */
export const hasPeakHourOverlap = (startSlot: number, durationHours: number): boolean => {
  for (let i = 0; i < durationHours; i++) {
    if (PEAK_HOUR_SLOTS.has(startSlot + i)) {
      return true;
    }
  }
  return false;
};

/**
 * Verifies BR-11 daily 6-hour customer quota inside an active Prisma transaction.
 * Supports optional excludeBookingId so Sprint 2 F-08 rescheduling does not double-count itself.
 */
export const checkCustomerDailyQuota = async (
  tx: Prisma.TransactionClient,
  userId: string,
  bookingDate: string,
  additionalHours: number,
  excludeBookingId?: string
): Promise<{ allowed: boolean; currentHours: number }> => {
  const existing = await tx.booking.aggregate({
    _sum: { durationHours: true },
    where: {
      userId,
      bookingDate,
      status: 'CONFIRMED',
      ...(excludeBookingId ? { id: { not: excludeBookingId } } : {})
    }
  });
  const currentHours = existing._sum.durationHours ?? 0;
  return {
    allowed: currentHours + additionalHours <= MAX_DAILY_CUSTOMER_HOURS,
    currentHours
  };
};

/**
 * Generates a human-readable, unique booking code.
 * Format: BK-YYYYMMDD-XXXX (e.g., BK-20261110-A1B2)
 */
export const generateBookingCode = (bookingDate: string): string => {
  const cleanDate = bookingDate.replace(/-/g, '');
  const randomSuffix = (Math.random().toString(36) + '0000').substring(2, 6).toUpperCase();
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
 * Transactional service helper for creating a RoomBlock under the shared Room row lock (BR-02, DEF-SS-01).
 * Acquires the identical `SELECT "id" FROM "rooms" WHERE "id" = ... FOR UPDATE` lock used by
 * `createOnlineBooking` and verifies that no active CONFIRMED `BookingSlot` or existing `RoomBlock`
 * occupies the target (roomId, blockDate, slotIndex) before committing.
 */
export const createMaintenanceRoomBlock = async (params: {
  roomId: string;
  blockDate: string;
  slotIndex: number;
  reason?: string;
}) => {
  const { roomId, blockDate, slotIndex, reason } = params;

  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "rooms" WHERE "id" = ${roomId} FOR UPDATE`;

    const [conflictingBookings, conflictingBlocks] = await Promise.all([
      tx.bookingSlot.findMany({
        where: {
          roomId,
          bookingDate: blockDate,
          slotIndex,
          booking: { status: 'CONFIRMED' }
        }
      }),
      tx.roomBlock.findMany({
        where: {
          roomId,
          blockDate,
          slotIndex
        }
      })
    ]);

    if (conflictingBookings.length > 0 || conflictingBlocks.length > 0) {
      const conflictErr: any = new Error('Cannot block a slot that is already occupied by a confirmed booking or block.');
      conflictErr.code = 'SLOT_CONFLICT';
      conflictErr.status = 409;
      throw conflictErr;
    }

    return tx.roomBlock.create({
      data: {
        roomId,
        blockDate,
        slotIndex,
        reason: reason || 'Maintenance block'
      }
    });
  });
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

    // 3b. Peak-Hour Online Duration Cap (BR-01 v1.3.0: 18:00-22:00 ICT slots 8..11 capped at 3 hours)
    if (hasPeakHourOverlap(startSlot, durationHours) && durationHours > MAX_PEAK_DURATION_HOURS) {
      res.status(400).json({
        success: false,
        error: {
          code: 'PEAK_DURATION_EXCEEDED',
          message: 'Online bookings overlapping Peak Hours (18:00 - 22:00) are limited to 3 hours maximum.'
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

    // 6. 60-Minute Advance Online Cutoff in Asia/Bangkok (BR-04 v1.3.0)
    if (isSlotWithinOnlineCutoff(bookingDate, startSlot)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'CANNOT_BOOK_PAST_SLOT',
          message: 'Cannot book past slots or slots within the 60-minute advance online cutoff.'
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

    // 8. Atomic Booking Creation inside Transaction with Row Lock & Code Retry (NFR-03, BR-02, BR-06)
    const userId = req.user!.id;
    const MAX_CODE_RETRIES = 5;

    for (let attempt = 0; attempt < MAX_CODE_RETRIES; attempt++) {
      const bookingCode = generateBookingCode(bookingDate);

      try {
        const newBooking = await prisma.$transaction(async (tx) => {
          // Deterministic lock order: users -> rooms FOR UPDATE to serialize both daily quota (BR-11) and slot exclusivity (BR-02)
          await tx.$queryRaw`SELECT "id" FROM "users" WHERE "id" = ${userId} FOR UPDATE`;
          await tx.$queryRaw`SELECT "id" FROM "rooms" WHERE "id" = ${room.id} FOR UPDATE`;

          // BR-11: Enforce 6-hour daily customer quota across all rooms
          const quotaCheck = await checkCustomerDailyQuota(tx, userId, bookingDate, durationHours);
          if (!quotaCheck.allowed) {
            const quotaErr: any = new Error('Daily customer booking quota of 6 hours exceeded.');
            quotaErr.code = 'TX_DAILY_QUOTA_EXCEEDED';
            throw quotaErr;
          }

          // DEF-SS-02 (FR-03, FR-04): Purge any lingering BookingSlot rows from prior CANCELLED bookings
          await tx.bookingSlot.deleteMany({
            where: {
              roomId: room.id,
              bookingDate,
              slotIndex: { in: requestedSlots },
              booking: { status: 'CANCELLED' }
            }
          });

          // DEF-SS-01 (BR-01, BR-02): Re-verify both BookingSlot and RoomBlock inside the locked transaction
          const [txConflictingBookings, txConflictingBlocks] = await Promise.all([
            tx.bookingSlot.findMany({
              where: {
                roomId: room.id,
                bookingDate,
                slotIndex: { in: requestedSlots },
                booking: { status: 'CONFIRMED' }
              }
            }),
            tx.roomBlock.findMany({
              where: {
                roomId: room.id,
                blockDate: bookingDate,
                slotIndex: { in: requestedSlots }
              }
            })
          ]);

          if (txConflictingBookings.length > 0 || txConflictingBlocks.length > 0) {
            const slotConflictErr: any = new Error('One or more requested slots are already occupied.');
            slotConflictErr.code = 'TX_SLOT_CONFLICT';
            throw slotConflictErr;
          }

          const user = await tx.user.findUnique({ where: { id: userId } });
          const customerName = user?.fullName || req.user!.email;
          const customerPhone = user?.phone || null;
          const totalPrice = room.hourlyRate * durationHours;

          const booking = await tx.booking.create({
            data: {
              bookingCode,
              userId,
              roomId: room.id,
              bookingDate,
              startSlot,
              durationHours,
              partySize,
              totalPrice,
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
            hourlyRate: newBooking.room.hourlyRate,
            totalPrice: newBooking.totalPrice,
            status: newBooking.status
          }
        });
        return;
      } catch (txError: any) {
        if (txError.code === 'TX_DAILY_QUOTA_EXCEEDED') {
          res.status(409).json({
            success: false,
            error: {
              code: 'DAILY_QUOTA_EXCEEDED',
              message: 'Daily limit of 6 confirmed booking hours per customer exceeded.'
            }
          });
          return;
        }

        if (txError.code === 'TX_SLOT_CONFLICT') {
          res.status(409).json({
            success: false,
            error: {
              code: 'SLOT_CONFLICT',
              message: 'One or more requested slots are already occupied.'
            }
          });
          return;
        }

        // Catch concurrent collision via PostgreSQL composite unique constraint @@unique([roomId, bookingDate, slotIndex])
        // or retry automatically on bookingCode unique constraint collision (DEF-SS-03)
        if (txError.code === 'P2002') {
          const target = txError.meta?.target;
          const isSlotConstraint =
            (Array.isArray(target) &&
              target.includes('roomId') &&
              target.includes('bookingDate') &&
              target.includes('slotIndex')) ||
            (typeof target === 'string' &&
              (target.includes('roomId_bookingDate_slotIndex') ||
                (target.includes('roomId') &&
                  target.includes('bookingDate') &&
                  target.includes('slotIndex'))));

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

          const isBookingCodeConstraint =
            (Array.isArray(target) && target.includes('bookingCode')) ||
            (typeof target === 'string' && target.includes('bookingCode'));

          if (isBookingCodeConstraint && attempt < MAX_CODE_RETRIES - 1) {
            continue;
          }
        }
        throw txError;
      }
    }
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/bookings/my (FR-05, AC-05)
 * Customer personal booking history endpoint.
 * Returns strictly the reservations belonging to the authenticated user (userId == req.user.id).
 */
export const getMyBookings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;

    const bookings = await prisma.booking.findMany({
      where: { userId },
      include: {
        room: {
          select: {
            id: true,
            roomNumber: true,
            type: true,
            capacity: true,
            hourlyRate: true,
            description: true
          }
        },
        slots: {
          orderBy: { slotIndex: 'asc' }
        }
      },
      orderBy: [{ bookingDate: 'desc' }, { startSlot: 'asc' }]
    });

    const enrichedBookings = bookings.map((b) => ({
      ...b,
      timeRange: formatBookingTimeRange(b.startSlot, b.durationHours)
    }));

    res.status(200).json({
      success: true,
      count: enrichedBookings.length,
      bookings: enrichedBookings
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/bookings/:id (FR-05, AC-05b, BR-07)
 * Booking detail inspection endpoint enforcing strict ownership.
 * Grants access if caller is the booking owner (userId == req.user.id) OR has role STAFF.
 * Otherwise returns HTTP 403 FORBIDDEN.
 */
export const getBookingById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        room: {
          select: {
            id: true,
            roomNumber: true,
            type: true,
            capacity: true,
            hourlyRate: true,
            description: true
          }
        },
        slots: {
          orderBy: { slotIndex: 'asc' }
        }
      }
    });

    if (!booking) {
      res.status(404).json({
        success: false,
        error: {
          code: 'BOOKING_NOT_FOUND',
          message: 'Booking not found.'
        }
      });
      return;
    }

    // Ownership Guard (BR-07, AC-05b): Owner OR Staff role
    if (booking.userId !== req.user!.id && req.user!.role !== Role.STAFF) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You are not authorized to view this booking.'
        }
      });
      return;
    }

    res.status(200).json({
      success: true,
      booking: {
        ...booking,
        timeRange: formatBookingTimeRange(booking.startSlot, booking.durationHours)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/bookings/master?date=YYYY-MM-DD (FR-06, AC-06, BR-08)
 * Staff master schedule query across all 9 rooms for a target calendar date.
 * Restricted strictly to STAFF role.
 */
export const getMasterSchedule = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { date } = req.query;

    if (!date || typeof date !== 'string' || !isValidDateString(date)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Valid date query parameter (YYYY-MM-DD) is required.'
        }
      });
      return;
    }

    const bookings = await prisma.booking.findMany({
      where: {
        bookingDate: date,
        status: 'CONFIRMED'
      },
      include: {
        room: {
          select: {
            id: true,
            roomNumber: true,
            type: true,
            capacity: true,
            hourlyRate: true,
            description: true
          }
        },
        slots: {
          orderBy: { slotIndex: 'asc' }
        }
      },
      orderBy: [{ roomId: 'asc' }, { startSlot: 'asc' }]
    });

    const enrichedBookings = bookings.map((b) => ({
      ...b,
      timeRange: formatBookingTimeRange(b.startSlot, b.durationHours)
    }));

    res.status(200).json({
      success: true,
      date,
      totalBookings: enrichedBookings.length,
      bookings: enrichedBookings
    });
  } catch (error) {
    next(error);
  }
};
