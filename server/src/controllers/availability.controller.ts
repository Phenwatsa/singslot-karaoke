import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';

export const OPERATING_SLOTS: Array<{ slotIndex: number; timeRange: string }> = [
  { slotIndex: 0, timeRange: '10:00 - 11:00' },
  { slotIndex: 1, timeRange: '11:00 - 12:00' },
  { slotIndex: 2, timeRange: '12:00 - 13:00' },
  { slotIndex: 3, timeRange: '13:00 - 14:00' },
  { slotIndex: 4, timeRange: '14:00 - 15:00' },
  { slotIndex: 5, timeRange: '15:00 - 16:00' },
  { slotIndex: 6, timeRange: '16:00 - 17:00' },
  { slotIndex: 7, timeRange: '17:00 - 18:00' },
  { slotIndex: 8, timeRange: '18:00 - 19:00' },
  { slotIndex: 9, timeRange: '19:00 - 20:00' },
  { slotIndex: 10, timeRange: '20:00 - 21:00' },
  { slotIndex: 11, timeRange: '21:00 - 22:00' },
  { slotIndex: 12, timeRange: '22:00 - 23:00' },
  { slotIndex: 13, timeRange: '23:00 - 24:00' }
];

/**
 * Validates whether input is a legitimate YYYY-MM-DD calendar date.
 */
export const isValidDateString = (dateStr?: string): boolean => {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return false;
  }
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

/**
 * Helper to check if a slot on a given date has already started or elapsed in Asia/Bangkok (UTC+7).
 * Per SRS BR-04: currentServerTime >= slotStartTime
 */
export const isSlotInPast = (dateStr: string, slotIndex: number, referenceDate: Date = new Date()): boolean => {
  const slotHour = 10 + slotIndex;
  const slotIso = `${dateStr}T${String(slotHour).padStart(2, '0')}:00:00+07:00`;
  const slotStartTime = new Date(slotIso).getTime();
  return referenceDate.getTime() >= slotStartTime;
};

/**
 * GET /api/availability?date=YYYY-MM-DD
 * Server-calculated availability across 14 hourly slots per room.
 * Conforms to AC-03, TEST-03, and BR-04 past-time rejection.
 */
export const getAvailability = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { date } = req.query;

    if (typeof date !== 'string' || !isValidDateString(date)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Invalid date format. Expected YYYY-MM-DD calendar date.'
        }
      });
      return;
    }

    // 1. Query all active rooms
    const rooms = await prisma.room.findMany({
      where: { isActive: true },
      orderBy: { roomNumber: 'asc' },
      select: {
        id: true,
        roomNumber: true,
        type: true,
        capacity: true,
        description: true
      }
    });

    // 2. Query occupied booking slots for CONFIRMED bookings on this date
    const bookedSlots = await prisma.bookingSlot.findMany({
      where: {
        bookingDate: date,
        booking: {
          status: 'CONFIRMED'
        }
      },
      select: {
        roomId: true,
        slotIndex: true
      }
    });

    // 3. Query room blocks on this date
    const blockedSlots = await prisma.roomBlock.findMany({
      where: {
        blockDate: date
      },
      select: {
        roomId: true,
        slotIndex: true
      }
    });

    // Create lookup sets for fast O(1) occupancy checks: `${roomId}:${slotIndex}`
    const occupiedSet = new Set<string>();
    for (const b of bookedSlots) {
      occupiedSet.add(`${b.roomId}:${b.slotIndex}`);
    }
    for (const blk of blockedSlots) {
      occupiedSet.add(`${blk.roomId}:${blk.slotIndex}`);
    }

    const now = new Date();

    // 4. Map each room to 14 discrete slots (BR-03, BR-04)
    const availabilityByRoom = rooms.map((room) => {
      const slots = OPERATING_SLOTS.map((slot) => {
        const isOccupied = occupiedSet.has(`${room.id}:${slot.slotIndex}`);
        const isPast = isSlotInPast(date, slot.slotIndex, now);
        // Slot is available if and only if it is unoccupied and not in the past
        const isAvailable = !isOccupied && !isPast;

        return {
          slotIndex: slot.slotIndex,
          timeRange: slot.timeRange,
          isAvailable,
          isPast,
          isOccupied
        };
      });

      return {
        id: room.id,
        roomNumber: room.roomNumber,
        type: room.type,
        capacity: room.capacity,
        description: room.description,
        slots
      };
    });

    res.status(200).json({
      success: true,
      date,
      rooms: availabilityByRoom
    });
  } catch (error) {
    next(error);
  }
};
