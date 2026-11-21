import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

/**
 * Global Concurrency & Exclusive Room Lock Enforcement (BR-02, BR-06, BR-10, DEF-SS-01):
 * Intercepts all standalone `prisma.roomBlock.create` writes across the application so that
 * EVERY code path creating a `RoomBlock` (whether via `createMaintenanceRoomBlock` or direct
 * Prisma client invocation) is serialized on the target Room's `SELECT ... FOR UPDATE` row lock
 * and rejects any overlap with a `CONFIRMED` `BookingSlot`.
 */
prisma.$use(async (params, next) => {
  if (params.model === 'RoomBlock' && params.action === 'create' && !params.runInTransaction) {
    const data = params.args?.data;
    if (data?.roomId && typeof data?.blockDate === 'string' && typeof data?.slotIndex === 'number') {
      return prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT "id" FROM "rooms" WHERE "id" = ${data.roomId} FOR UPDATE`;

        const conflictingSlot = await tx.bookingSlot.findFirst({
          where: {
            roomId: data.roomId,
            bookingDate: data.blockDate,
            slotIndex: data.slotIndex,
            booking: { status: 'CONFIRMED' }
          }
        });

        if (conflictingSlot) {
          const conflictErr: any = new Error(
            'Cannot create RoomBlock on a slot already occupied by a CONFIRMED booking.'
          );
          conflictErr.code = 'SLOT_CONFLICT';
          conflictErr.status = 409;
          throw conflictErr;
        }

        return tx.roomBlock.create(params.args);
      });
    }
  }
  return next(params);
});
