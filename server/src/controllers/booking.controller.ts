import { Request, Response, NextFunction } from 'express';
import { BookingStatus, Prisma, Role, RoomType } from '@prisma/client';
import { prisma } from '../prisma';
import { isValidDateString, isSlotInPast, isSlotWithinOnlineCutoff } from './availability.controller';

export const PEAK_HOUR_SLOTS = new Set([8, 9, 10, 11]); // 18:00 - 22:00 ICT
export const MAX_PEAK_DURATION_HOURS = 3;
export const MAX_DAILY_CUSTOMER_HOURS = 6;
export const CANCELLATION_ADVANCE_MS = 24 * 60 * 60 * 1000;

/**
 * Returns today's calendar date (YYYY-MM-DD) in Asia/Bangkok (UTC+7).
 */
export const getTodayBangkokDate = (referenceDate: Date = new Date()): string => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(referenceDate);
};

/**
 * Checks BR-09 24-hour advance policy in Asia/Bangkok (UTC+7).
 * Permitted iff serverTime <= (bookingDate + startSlotTime) - 24 hours.
 * Exact 24 hours remaining is permitted; strictly less than 24 hours is rejected.
 */
export const isWithin24HourAdvanceWindow = (
  bookingDate: string,
  startSlot: number,
  referenceDate: Date = new Date()
): boolean => {
  const slotHour = 10 + startSlot;
  const slotStartMs = new Date(`${bookingDate}T${String(slotHour).padStart(2, '0')}:00:00+07:00`).getTime();
  return referenceDate.getTime() <= slotStartMs - CANCELLATION_ADVANCE_MS;
};

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
 * POST /api/bookings/walk-in (FR-07, AC-07, BR-01, BR-02, BR-03, BR-05, BR-06, BR-08, BR-12, NFR-03)
 * Staff walk-in booking counter endpoint. Restricted strictly to STAFF role.
 * Exempt from online-only Lab 7 rules (60-min cutoff, Peak-Hour 3-hr cap, 6-hr daily customer quota);
 * checks !isPast only and authoritatively computes totalPrice = room.hourlyRate * durationHours.
 */
export const createWalkInBooking = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { roomId, bookingDate, startSlot, durationHours, partySize, customerName, customerPhone } =
      req.body;

    // 1. Mandatory Input Validation
    if (
      !roomId ||
      typeof roomId !== 'string' ||
      !bookingDate ||
      typeof bookingDate !== 'string' ||
      startSlot === undefined ||
      durationHours === undefined ||
      partySize === undefined ||
      !customerName ||
      typeof customerName !== 'string' ||
      customerName.trim().length === 0
    ) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message:
            'Missing or malformed required fields (roomId, bookingDate, startSlot, durationHours, partySize, customerName).'
        }
      });
      return;
    }

    if (customerPhone !== undefined && customerPhone !== null && typeof customerPhone !== 'string') {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'customerPhone must be a string when provided.'
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

    // 3. Operating Window & Duration Boundary (BR-03; exempt from Peak-Hour 3h cap)
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
          message:
            'Duration must be between 1 and 5 contiguous hours and end within operating hours (10:00 - 24:00, slots 0..13).'
        }
      });
      return;
    }

    // 4. Party Size Validation
    if (typeof partySize !== 'number' || !Number.isInteger(partySize) || partySize < 1) {
      res.status(400).json({
        success: false,
        error: {
          code: 'EXCEEDS_CAPACITY',
          message: 'Party size must be an integer of at least 1 guest.'
        }
      });
      return;
    }

    // 5. Room Existence & Capacity Check (BR-05)
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

    // 6. Walk-in Past Slot Check ONLY (!isPast; exempt from 60-min online cutoff)
    if (isSlotInPast(bookingDate, startSlot)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'CANNOT_BOOK_PAST_SLOT',
          message: 'Cannot create walk-in booking for a slot that has already started or elapsed.'
        }
      });
      return;
    }

    const requestedSlots = Array.from({ length: durationHours }, (_, i) => startSlot + i);
    const staffUserId = req.user!.id;
    const MAX_CODE_RETRIES = 5;

    for (let attempt = 0; attempt < MAX_CODE_RETRIES; attempt++) {
      const bookingCode = generateBookingCode(bookingDate);

      try {
        const newBooking = await prisma.$transaction(async (tx) => {
          // Acquire Room row lock for slot exclusivity (BR-02, BR-06)
          await tx.$queryRaw`SELECT "id" FROM "rooms" WHERE "id" = ${room.id} FOR UPDATE`;

          // Purge any lingering BookingSlot rows from prior CANCELLED bookings (DEF-SS-02)
          await tx.bookingSlot.deleteMany({
            where: {
              roomId: room.id,
              bookingDate,
              slotIndex: { in: requestedSlots },
              booking: { status: 'CANCELLED' }
            }
          });

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

          const totalPrice = room.hourlyRate * durationHours;

          return tx.booking.create({
            data: {
              bookingCode,
              userId: staffUserId,
              roomId: room.id,
              bookingDate,
              startSlot,
              durationHours,
              partySize,
              totalPrice,
              channel: 'WALK_IN',
              customerName: customerName.trim(),
              customerPhone: customerPhone ? customerPhone.trim() : null,
              status: 'CONFIRMED',
              slots: {
                create: requestedSlots.map((slotIndex) => ({
                  roomId: room.id,
                  bookingDate,
                  slotIndex
                }))
              }
            },
            include: { room: true }
          });
        });

        const timeRange = formatBookingTimeRange(newBooking.startSlot, newBooking.durationHours);

        res.status(201).json({
          success: true,
          booking: {
            id: newBooking.id,
            bookingCode: newBooking.bookingCode,
            roomId: newBooking.roomId,
            roomNumber: newBooking.room.roomNumber,
            bookingDate: newBooking.bookingDate,
            startSlot: newBooking.startSlot,
            durationHours: newBooking.durationHours,
            timeRange,
            partySize: newBooking.partySize,
            channel: newBooking.channel,
            customerName: newBooking.customerName,
            customerPhone: newBooking.customerPhone,
            hourlyRate: newBooking.room.hourlyRate,
            totalPrice: newBooking.totalPrice,
            status: newBooking.status
          }
        });
        return;
      } catch (txError: any) {
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
        if (txError.code === 'P2002') {
          const target = txError.meta?.target;
          const isBookingCodeConstraint =
            (Array.isArray(target) && target.includes('bookingCode')) ||
            (typeof target === 'string' && target.includes('bookingCode'));
          if (isBookingCodeConstraint && attempt < MAX_CODE_RETRIES - 1) {
            continue;
          }
          res.status(409).json({
            success: false,
            error: {
              code: 'SLOT_CONFLICT',
              message: 'One or more requested slots were just reserved by another booking.'
            }
          });
          return;
        }
        throw txError;
      }
    }
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/bookings/:id/cancel (FR-09, AC-09, AC-09a, BR-07, BR-09, NFR-03)
 * Cancels a CONFIRMED booking subject to ownership/STAFF check and 24-hour advance policy (BR-09).
 * Atomically transitions status to CANCELLED and deletes BookingSlot records to release inventory & quota.
 */
export const cancelBooking = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const existing = await prisma.booking.findUnique({
      where: { id },
      include: { room: true }
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Booking not found.'
        }
      });
      return;
    }

    // Ownership Guard (BR-07): Owner OR Staff
    if (existing.userId !== req.user!.id && req.user!.role !== Role.STAFF) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You are not authorized to cancel this booking.'
        }
      });
      return;
    }

    if (existing.status === 'CANCELLED') {
      res.status(409).json({
        success: false,
        error: {
          code: 'BOOKING_ALREADY_CANCELLED',
          message: 'Booking has already been cancelled.'
        }
      });
      return;
    }

    // BR-09: 24-Hour Advance Cancellation Policy
    if (!isWithin24HourAdvanceWindow(existing.bookingDate, existing.startSlot)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'CANCELLATION_WINDOW_EXPIRED',
          message: 'Bookings can only be cancelled at least 24 hours prior to the scheduled start time.'
        }
      });
      return;
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Deterministic lock order: bookings -> rooms FOR UPDATE (serializes concurrent cancel/reschedule on same booking)
      await tx.$queryRaw`SELECT "id" FROM "bookings" WHERE "id" = ${existing.id} FOR UPDATE`;

      const fresh = await tx.booking.findUnique({ where: { id: existing.id } });
      if (!fresh || fresh.status === 'CANCELLED') {
        const err: any = new Error('Booking has already been cancelled.');
        err.code = 'TX_ALREADY_CANCELLED';
        throw err;
      }

      // Re-verify BR-09 24-hour advance policy inside the locked transaction against authoritative latest state
      if (!isWithin24HourAdvanceWindow(fresh.bookingDate, fresh.startSlot)) {
        const err: any = new Error(
          'Bookings can only be cancelled at least 24 hours prior to the scheduled start time.'
        );
        err.code = 'TX_CANCELLATION_WINDOW_EXPIRED';
        throw err;
      }

      await tx.$queryRaw`SELECT "id" FROM "rooms" WHERE "id" = ${fresh.roomId} FOR UPDATE`;

      await tx.bookingSlot.deleteMany({
        where: { bookingId: existing.id }
      });

      return tx.booking.update({
        where: { id: existing.id },
        data: { status: 'CANCELLED' },
        include: { room: true }
      });
    });

    res.status(200).json({
      success: true,
      booking: {
        ...updated,
        roomNumber: updated.room.roomNumber,
        roomType: updated.room.type,
        hourlyRate: updated.room.hourlyRate,
        timeRange: formatBookingTimeRange(updated.startSlot, updated.durationHours)
      }
    });
  } catch (error: any) {
    if (error.code === 'TX_ALREADY_CANCELLED') {
      res.status(409).json({
        success: false,
        error: {
          code: 'BOOKING_ALREADY_CANCELLED',
          message: 'Booking has already been cancelled.'
        }
      });
      return;
    }
    if (error.code === 'TX_CANCELLATION_WINDOW_EXPIRED') {
      res.status(400).json({
        success: false,
        error: {
          code: 'CANCELLATION_WINDOW_EXPIRED',
          message: 'Bookings can only be cancelled at least 24 hours prior to the scheduled start time.'
        }
      });
      return;
    }
    next(error);
  }
};

/**
 * PATCH /api/bookings/:id/reschedule (FR-10, AC-10, BR-01, BR-04, BR-07, BR-09, BR-11, BR-12, NFR-03)
 * Atomically reschedules a CONFIRMED booking to new room/date/slots subject to ownership, BR-09 (24h policy),
 * Lab 7 online rules (with targetBookingId excluded from BR-11 quota), and recalculated totalPrice.
 */
export const rescheduleBooking = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { roomId, bookingDate, startSlot, durationHours, partySize } = req.body;

    const existing = await prisma.booking.findUnique({
      where: { id },
      include: { room: true }
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Booking not found.'
        }
      });
      return;
    }

    // Ownership Guard (BR-07)
    if (existing.userId !== req.user!.id && req.user!.role !== Role.STAFF) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You are not authorized to reschedule this booking.'
        }
      });
      return;
    }

    if (existing.status === 'CANCELLED') {
      res.status(409).json({
        success: false,
        error: {
          code: 'BOOKING_ALREADY_CANCELLED',
          message: 'Cannot reschedule a cancelled booking.'
        }
      });
      return;
    }

    // BR-09: Must be >= 24 hours prior to the ORIGINAL booking start time
    if (!isWithin24HourAdvanceWindow(existing.bookingDate, existing.startSlot)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'CANCELLATION_WINDOW_EXPIRED',
          message: 'Bookings can only be rescheduled at least 24 hours prior to the scheduled start time.'
        }
      });
      return;
    }

    // Validate target inputs
    const targetRoomIdInput = roomId ?? existing.roomId;
    const targetDate = bookingDate ?? existing.bookingDate;
    const targetStartSlot = startSlot !== undefined ? startSlot : existing.startSlot;
    const targetDuration = durationHours !== undefined ? durationHours : existing.durationHours;
    const targetPartySize = partySize !== undefined ? partySize : existing.partySize;

    if (
      typeof targetRoomIdInput !== 'string' ||
      typeof targetDate !== 'string' ||
      !isValidDateString(targetDate)
    ) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Invalid roomId or bookingDate (YYYY-MM-DD).'
        }
      });
      return;
    }

    if (
      typeof targetStartSlot !== 'number' ||
      !Number.isInteger(targetStartSlot) ||
      targetStartSlot < 0 ||
      targetStartSlot > 13 ||
      typeof targetDuration !== 'number' ||
      !Number.isInteger(targetDuration) ||
      targetDuration < 1 ||
      targetDuration > 5 ||
      targetStartSlot + targetDuration - 1 > 13
    ) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DURATION',
          message: 'Duration must be between 1 and 5 contiguous hours within operating hours (slots 0..13).'
        }
      });
      return;
    }

    if (typeof targetPartySize !== 'number' || !Number.isInteger(targetPartySize) || targetPartySize < 1) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Party size must be an integer of at least 1 guest.'
        }
      });
      return;
    }

    const targetRoom = await prisma.room.findFirst({
      where: {
        OR: [{ id: targetRoomIdInput }, { roomNumber: targetRoomIdInput }],
        isActive: true
      }
    });

    if (!targetRoom) {
      res.status(404).json({
        success: false,
        error: {
          code: 'ROOM_NOT_FOUND',
          message: 'Target room does not exist or is inactive.'
        }
      });
      return;
    }

    if (targetPartySize > targetRoom.capacity) {
      res.status(400).json({
        success: false,
        error: {
          code: 'EXCEEDS_CAPACITY',
          message: `Party size (${targetPartySize}) exceeds room capacity (${targetRoom.capacity}).`
        }
      });
      return;
    }

    // Channel-aware time & Peak-Hour rules
    if (existing.channel === 'ONLINE') {
      if (hasPeakHourOverlap(targetStartSlot, targetDuration) && targetDuration > MAX_PEAK_DURATION_HOURS) {
        res.status(400).json({
          success: false,
          error: {
            code: 'PEAK_DURATION_EXCEEDED',
            message: 'Online bookings overlapping Peak Hours (18:00 - 22:00) are limited to 3 hours maximum.'
          }
        });
        return;
      }

      if (isSlotWithinOnlineCutoff(targetDate, targetStartSlot)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'CANNOT_BOOK_PAST_SLOT',
            message: 'Cannot reschedule to a past slot or within the 60-minute advance online cutoff.'
          }
        });
        return;
      }
    } else if (isSlotInPast(targetDate, targetStartSlot)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'CANNOT_BOOK_PAST_SLOT',
          message: 'Cannot reschedule to a slot that has already started or elapsed.'
        }
      });
      return;
    }

    const requestedSlots = Array.from({ length: targetDuration }, (_, i) => targetStartSlot + i);

    try {
      const updated = await prisma.$transaction(async (tx) => {
        // Deterministic lock order: users (if ONLINE) -> bookings -> rooms sorted by id
        if (existing.channel === 'ONLINE') {
          await tx.$queryRaw`SELECT "id" FROM "users" WHERE "id" = ${existing.userId} FOR UPDATE`;
        }

        await tx.$queryRaw`SELECT "id" FROM "bookings" WHERE "id" = ${existing.id} FOR UPDATE`;

        const fresh = await tx.booking.findUnique({ where: { id: existing.id } });
        if (!fresh || fresh.status === 'CANCELLED') {
          const err: any = new Error('Cannot reschedule a cancelled booking.');
          err.code = 'TX_ALREADY_CANCELLED';
          throw err;
        }

        // Re-verify BR-09 24-hour advance policy inside the locked transaction against authoritative latest state
        if (!isWithin24HourAdvanceWindow(fresh.bookingDate, fresh.startSlot)) {
          const err: any = new Error(
            'Bookings can only be rescheduled at least 24 hours prior to the scheduled start time.'
          );
          err.code = 'TX_CANCELLATION_WINDOW_EXPIRED';
          throw err;
        }

        const roomIdsToLock = Array.from(new Set([fresh.roomId, targetRoom.id])).sort();
        for (const rId of roomIdsToLock) {
          await tx.$queryRaw`SELECT "id" FROM "rooms" WHERE "id" = ${rId} FOR UPDATE`;
        }

        // Re-verify target slot time inside the locked transaction (Contract 6: prevent lock-wait boundary drift)
        if (fresh.channel === 'ONLINE') {
          if (isSlotWithinOnlineCutoff(targetDate, targetStartSlot)) {
            const err: any = new Error(
              'Cannot reschedule to a past slot or within the 60-minute advance online cutoff.'
            );
            err.code = 'TX_PAST_SLOT_ONLINE';
            throw err;
          }
        } else if (isSlotInPast(targetDate, targetStartSlot)) {
          const err: any = new Error(
            'Cannot reschedule to a slot that has already started or elapsed.'
          );
          err.code = 'TX_PAST_SLOT_WALKIN';
          throw err;
        }

        // BR-11: Check daily 6-hour quota for ONLINE channel, excluding this booking's own prior hours
        if (existing.channel === 'ONLINE') {
          const quotaCheck = await checkCustomerDailyQuota(
            tx,
            existing.userId,
            targetDate,
            targetDuration,
            existing.id
          );
          if (!quotaCheck.allowed) {
            const err: any = new Error('Daily customer booking quota of 6 hours exceeded.');
            err.code = 'TX_DAILY_QUOTA_EXCEEDED';
            throw err;
          }
        }

        // Remove old slots belonging to this booking first (atomic rollback if target conflicts)
        await tx.bookingSlot.deleteMany({
          where: { bookingId: existing.id }
        });

        // Purge any orphaned slots from prior CANCELLED bookings on target slots
        await tx.bookingSlot.deleteMany({
          where: {
            roomId: targetRoom.id,
            bookingDate: targetDate,
            slotIndex: { in: requestedSlots },
            booking: { status: 'CANCELLED' }
          }
        });

        const [txConflictingBookings, txConflictingBlocks] = await Promise.all([
          tx.bookingSlot.findMany({
            where: {
              roomId: targetRoom.id,
              bookingDate: targetDate,
              slotIndex: { in: requestedSlots },
              booking: { status: 'CONFIRMED' }
            }
          }),
          tx.roomBlock.findMany({
            where: {
              roomId: targetRoom.id,
              blockDate: targetDate,
              slotIndex: { in: requestedSlots }
            }
          })
        ]);

        if (txConflictingBookings.length > 0 || txConflictingBlocks.length > 0) {
          const err: any = new Error('One or more target slots are already occupied.');
          err.code = 'TX_SLOT_CONFLICT';
          throw err;
        }

        const newTotalPrice = targetRoom.hourlyRate * targetDuration;

        return tx.booking.update({
          where: { id: existing.id },
          data: {
            roomId: targetRoom.id,
            bookingDate: targetDate,
            startSlot: targetStartSlot,
            durationHours: targetDuration,
            partySize: targetPartySize,
            totalPrice: newTotalPrice,
            slots: {
              create: requestedSlots.map((slotIndex) => ({
                roomId: targetRoom.id,
                bookingDate: targetDate,
                slotIndex
              }))
            }
          },
          include: {
            room: true,
            slots: { orderBy: { slotIndex: 'asc' } }
          }
        });
      });

      res.status(200).json({
        success: true,
        booking: {
          ...updated,
          roomNumber: updated.room.roomNumber,
          roomType: updated.room.type,
          hourlyRate: updated.room.hourlyRate,
          timeRange: formatBookingTimeRange(updated.startSlot, updated.durationHours)
        }
      });
    } catch (txError: any) {
      if (txError.code === 'TX_ALREADY_CANCELLED') {
        res.status(409).json({
          success: false,
          error: {
            code: 'BOOKING_ALREADY_CANCELLED',
            message: 'Cannot reschedule a cancelled booking.'
          }
        });
        return;
      }
      if (txError.code === 'TX_CANCELLATION_WINDOW_EXPIRED') {
        res.status(400).json({
          success: false,
          error: {
            code: 'CANCELLATION_WINDOW_EXPIRED',
            message: 'Bookings can only be rescheduled at least 24 hours prior to the scheduled start time.'
          }
        });
        return;
      }
      if (txError.code === 'TX_PAST_SLOT_ONLINE' || txError.code === 'TX_PAST_SLOT_WALKIN') {
        res.status(400).json({
          success: false,
          error: {
            code: 'CANNOT_BOOK_PAST_SLOT',
            message: txError.message
          }
        });
        return;
      }
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
      if (txError.code === 'TX_SLOT_CONFLICT' || txError.code === 'P2002') {
        res.status(409).json({
          success: false,
          error: {
            code: 'SLOT_CONFLICT',
            message: 'One or more target slots are already occupied.'
          }
        });
        return;
      }
      throw txError;
    }
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/bookings/master (FR-06, FR-11, AC-06, AC-11, BR-08)
 * Staff master schedule & multi-criteria search across all 9 rooms.
 * Supports optional date OR startDate/endDate, phone, roomId, roomType, status.
 * Defaults to today's date in Asia/Bangkok when no filters are provided.
 * Restricted strictly to STAFF role.
 */
export const getMasterSchedule = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { date, startDate, endDate, phone, roomId, roomType, status } = req.query;

    // Validate mutually exclusive date vs startDate/endDate
    if (date !== undefined && (startDate !== undefined || endDate !== undefined)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Cannot combine date with startDate or endDate query parameters.'
        }
      });
      return;
    }

    if (date !== undefined && (typeof date !== 'string' || !isValidDateString(date))) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Invalid date query parameter. Expected YYYY-MM-DD calendar date.'
        }
      });
      return;
    }

    if (startDate !== undefined && (typeof startDate !== 'string' || !isValidDateString(startDate))) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Invalid startDate query parameter. Expected YYYY-MM-DD calendar date.'
        }
      });
      return;
    }

    if (endDate !== undefined && (typeof endDate !== 'string' || !isValidDateString(endDate))) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Invalid endDate query parameter. Expected YYYY-MM-DD calendar date.'
        }
      });
      return;
    }

    if (typeof startDate === 'string' && typeof endDate === 'string' && startDate > endDate) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'startDate must not be later than endDate.'
        }
      });
      return;
    }

    const validRoomTypes = new Set<string>(Object.values(RoomType));
    if (roomType !== undefined && (typeof roomType !== 'string' || !validRoomTypes.has(roomType))) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Invalid roomType. Expected SMALL, MEDIUM, or LARGE.'
        }
      });
      return;
    }

    const validStatuses = new Set<string>(Object.values(BookingStatus));
    if (status !== undefined && (typeof status !== 'string' || !validStatuses.has(status))) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Invalid status. Expected CONFIRMED or CANCELLED.'
        }
      });
      return;
    }

    if (phone !== undefined && typeof phone !== 'string') {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Invalid phone parameter.'
        }
      });
      return;
    }

    if (roomId !== undefined && typeof roomId !== 'string') {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Invalid roomId parameter.'
        }
      });
      return;
    }

    const hasAnyFilter =
      date !== undefined ||
      startDate !== undefined ||
      endDate !== undefined ||
      (typeof phone === 'string' && phone.trim().length > 0) ||
      (typeof roomId === 'string' && roomId.trim().length > 0) ||
      roomType !== undefined ||
      status !== undefined;

    const hasSearchFilter =
      startDate !== undefined ||
      endDate !== undefined ||
      (typeof phone === 'string' && phone.trim().length > 0) ||
      (typeof roomId === 'string' && roomId.trim().length > 0) ||
      roomType !== undefined;

    const where: Prisma.BookingWhereInput = {};
    let resolvedDate: string | undefined;

    if (!hasAnyFilter) {
      resolvedDate = getTodayBangkokDate();
      where.bookingDate = resolvedDate;
    } else if (typeof date === 'string') {
      resolvedDate = date;
      where.bookingDate = date;
    } else if (typeof startDate === 'string' || typeof endDate === 'string') {
      where.bookingDate = {
        ...(typeof startDate === 'string' ? { gte: startDate } : {}),
        ...(typeof endDate === 'string' ? { lte: endDate } : {})
      };
    }

    if (typeof phone === 'string' && phone.trim().length > 0) {
      where.customerPhone = {
        contains: phone.trim(),
        mode: 'insensitive'
      };
    }

    if (typeof roomId === 'string' && roomId.trim().length > 0) {
      where.roomId = roomId.trim();
    }

    if (typeof roomType === 'string') {
      where.room = { type: roomType as RoomType };
    }

    if (typeof status === 'string') {
      where.status = status as BookingStatus;
    } else if (!hasSearchFilter) {
      // Preserve Sprint 1 AC-06 / TEST-06 default: daily schedule view without search filters shows CONFIRMED bookings
      where.status = 'CONFIRMED';
    }

    const bookings = await prisma.booking.findMany({
      where,
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
      roomNumber: b.room.roomNumber,
      roomType: b.room.type,
      hourlyRate: b.room.hourlyRate,
      timeRange: formatBookingTimeRange(b.startSlot, b.durationHours)
    }));

    res.status(200).json({
      success: true,
      ...(resolvedDate ? { date: resolvedDate } : {}),
      totalBookings: enrichedBookings.length,
      bookings: enrichedBookings
    });
  } catch (error) {
    next(error);
  }
};
