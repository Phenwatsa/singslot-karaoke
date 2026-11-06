import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';

/**
 * GET /api/rooms
 * Returns all 9 active rooms sorted and grouped by capacity tier:
 * Small (4 pax, S01-S03), Medium (8 pax, M01-M03), Large (12 pax, L01-L03).
 * Conforms to AC-02, In-Scope, and TEST-02.
 */
export const getRooms = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rooms = await prisma.room.findMany({
      where: { isActive: true },
      orderBy: [
        { capacity: 'asc' },
        { roomNumber: 'asc' }
      ],
      select: {
        id: true,
        roomNumber: true,
        type: true,
        capacity: true,
        description: true,
        isActive: true
      }
    });

    // Group rooms by capacity tier (Small: 4, Medium: 8, Large: 12) per In-Scope
    const tiers = {
      SMALL: {
        tier: 'SMALL',
        displayName: 'Small Rooms',
        capacity: 4,
        rooms: rooms.filter((r) => r.type === 'SMALL')
      },
      MEDIUM: {
        tier: 'MEDIUM',
        displayName: 'Medium Rooms',
        capacity: 8,
        rooms: rooms.filter((r) => r.type === 'MEDIUM')
      },
      LARGE: {
        tier: 'LARGE',
        displayName: 'Large Rooms',
        capacity: 12,
        rooms: rooms.filter((r) => r.type === 'LARGE')
      }
    };

    res.status(200).json({
      success: true,
      rooms,
      tiers
    });
  } catch (error) {
    next(error);
  }
};
