import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';

/**
 * GET /api/rooms
 * Returns all active rooms grouped/sorted by roomNumber.
 * Conforms to AC-02 and TEST-02.
 */
export const getRooms = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rooms = await prisma.room.findMany({
      where: { isActive: true },
      orderBy: { roomNumber: 'asc' },
      select: {
        id: true,
        roomNumber: true,
        type: true,
        capacity: true,
        description: true,
        isActive: true
      }
    });

    res.status(200).json({
      success: true,
      rooms
    });
  } catch (error) {
    next(error);
  }
};
