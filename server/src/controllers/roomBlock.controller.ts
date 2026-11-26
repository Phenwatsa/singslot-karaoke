import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';
import { isValidDateString } from './availability.controller';

/**
 * GET /api/room-blocks?date=YYYY-MM-DD (FR-08, BR-08)
 * Lists active maintenance room blocks (optional date filter). Restricted to STAFF role.
 */
export const getRoomBlocks = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { date } = req.query;

    if (date !== undefined) {
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
    }

    const blocks = await prisma.roomBlock.findMany({
      where: date ? { blockDate: date } : undefined,
      include: {
        room: {
          select: {
            id: true,
            roomNumber: true,
            type: true
          }
        }
      },
      orderBy: [{ blockDate: 'asc' }, { roomId: 'asc' }, { slotIndex: 'asc' }]
    });

    res.status(200).json({
      success: true,
      blocks: blocks.map((b) => ({
        id: b.id,
        roomId: b.roomId,
        roomNumber: b.room.roomNumber,
        roomType: b.room.type,
        blockDate: b.blockDate,
        slotIndex: b.slotIndex,
        reason: b.reason,
        createdAt: b.createdAt
      }))
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/room-blocks (FR-08, BR-02, BR-03, BR-08, BR-10, NFR-03)
 * Creates one or more maintenance room blocks atomically under a Room row lock.
 * Rejects entire request with 409 BLOCK_CONFLICT if any slot overlaps a CONFIRMED booking,
 * or 409 BLOCK_ALREADY_EXISTS if any slot is already blocked.
 */
export const createRoomBlocks = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { roomId, blockDate, slotIndex, slotIndices, reason } = req.body;

    if (!roomId || typeof roomId !== 'string' || !blockDate || typeof blockDate !== 'string') {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Required fields roomId and blockDate (YYYY-MM-DD) must be provided.'
        }
      });
      return;
    }

    if (!isValidDateString(blockDate)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Invalid blockDate format. Expected YYYY-MM-DD calendar date.'
        }
      });
      return;
    }

    // Parse single slotIndex or array slotIndices (must be unique integers in 0..13)
    let targetSlots: number[] = [];
    if (slotIndices !== undefined) {
      if (!Array.isArray(slotIndices) || slotIndices.length === 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'slotIndices must be a non-empty array of unique integers between 0 and 13.'
          }
        });
        return;
      }
      const seen = new Set<number>();
      for (const s of slotIndices) {
        if (typeof s !== 'number' || !Number.isInteger(s) || s < 0 || s > 13 || seen.has(s)) {
          res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_INPUT',
              message: 'slotIndices must contain unique integers between 0 and 13.'
            }
          });
          return;
        }
        seen.add(s);
        targetSlots.push(s);
      }
      targetSlots.sort((a, b) => a - b);
    } else if (slotIndex !== undefined) {
      if (typeof slotIndex !== 'number' || !Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex > 13) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'slotIndex must be an integer between 0 and 13.'
          }
        });
        return;
      }
      targetSlots = [slotIndex];
    } else {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Either slotIndex or slotIndices must be provided.'
        }
      });
      return;
    }

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

    const blockReason = typeof reason === 'string' && reason.trim().length > 0 ? reason.trim() : null;

    try {
      const createdBlocks = await prisma.$transaction(async (tx) => {
        // Acquire exclusive Room row lock to serialize against concurrent bookings & blocks (BR-02, BR-10)
        await tx.$queryRaw`SELECT "id" FROM "rooms" WHERE "id" = ${room.id} FOR UPDATE`;

        const [conflictingBookings, existingBlocks] = await Promise.all([
          tx.bookingSlot.findMany({
            where: {
              roomId: room.id,
              bookingDate: blockDate,
              slotIndex: { in: targetSlots },
              booking: { status: 'CONFIRMED' }
            }
          }),
          tx.roomBlock.findMany({
            where: {
              roomId: room.id,
              blockDate,
              slotIndex: { in: targetSlots }
            }
          })
        ]);

        if (conflictingBookings.length > 0) {
          const err: any = new Error('Cannot block a slot with an existing confirmed booking.');
          err.code = 'TX_BLOCK_CONFLICT';
          throw err;
        }

        if (existingBlocks.length > 0) {
          const err: any = new Error('One or more requested slots are already blocked.');
          err.code = 'TX_BLOCK_ALREADY_EXISTS';
          throw err;
        }

        const results = [];
        for (const s of targetSlots) {
          const created = await tx.roomBlock.create({
            data: {
              roomId: room.id,
              blockDate,
              slotIndex: s,
              reason: blockReason
            }
          });
          results.push(created);
        }
        return results;
      });

      res.status(201).json({
        success: true,
        blocks: createdBlocks.map((b) => ({
          id: b.id,
          roomId: b.roomId,
          roomNumber: room.roomNumber,
          blockDate: b.blockDate,
          slotIndex: b.slotIndex,
          reason: b.reason,
          createdAt: b.createdAt
        }))
      });
    } catch (txError: any) {
      if (txError.code === 'TX_BLOCK_CONFLICT') {
        res.status(409).json({
          success: false,
          error: {
            code: 'BLOCK_CONFLICT',
            message: 'Cannot block a slot with an existing confirmed booking.'
          }
        });
        return;
      }
      if (txError.code === 'TX_BLOCK_ALREADY_EXISTS' || txError.code === 'P2002') {
        res.status(409).json({
          success: false,
          error: {
            code: 'BLOCK_ALREADY_EXISTS',
            message: 'One or more requested slots are already blocked.'
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
 * DELETE /api/room-blocks/:id (FR-08, BR-08)
 * Removes a maintenance room block and restores slot availability. Restricted to STAFF role.
 */
export const deleteRoomBlock = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const existing = await prisma.roomBlock.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Room block not found.'
        }
      });
      return;
    }

    await prisma.roomBlock.delete({ where: { id } });

    res.status(200).json({
      success: true,
      deletedId: id
    });
  } catch (error) {
    next(error);
  }
};
