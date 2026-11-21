import { describe, it, expect, beforeAll, afterAll, afterEach, jest } from '@jest/globals';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/prisma';
import { generateBookingCode, createMaintenanceRoomBlock } from '../src/controllers/booking.controller';

describe('Lab 6 Part D: Partner-Reported Defect Reproduction & Regression Suite (Issue #34 / Issue #35)', () => {
  const getFutureBangkokDateString = (daysAhead: number): string => {
    const now = new Date();
    const future = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(future);
  };

  const CUSTOMER_PASSWORD = process.env.CUSTOMER_PASSWORD || 'Pass1234!';
  const DEF01_DATE = getFutureBangkokDateString(45);
  const DEF02_DATE = getFutureBangkokDateString(46);
  const DEF03_DATE = getFutureBangkokDateString(47);

  let customer1Token: string;
  let customer2Token: string;
  let customer1Id: string;
  let roomS01: { id: string; roomNumber: string; capacity: number };
  let roomM01: { id: string; roomNumber: string; capacity: number };

  const createdBookingIds: string[] = [];
  const createdBlockIds: string[] = [];

  beforeAll(async () => {
    const [c1Login, c2Login] = await Promise.all([
      request(app)
        .post('/api/auth/login')
        .send({ email: 'customer1@singslot.local', password: CUSTOMER_PASSWORD }),
      request(app)
        .post('/api/auth/login')
        .send({ email: 'customer2@singslot.local', password: CUSTOMER_PASSWORD })
    ]);

    expect(c1Login.status).toBe(200);
    expect(c2Login.status).toBe(200);
    customer1Token = c1Login.body.token;
    customer2Token = c2Login.body.token;
    customer1Id = c1Login.body.user.id;

    const [s01, m01] = await Promise.all([
      prisma.room.findUnique({ where: { roomNumber: 'S01' } }),
      prisma.room.findUnique({ where: { roomNumber: 'M01' } })
    ]);

    if (!s01 || !m01) {
      throw new Error('Database prerequisite missing: seeded rooms S01 or M01 not found.');
    }

    roomS01 = s01;
    roomM01 = m01;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    if (createdBlockIds.length > 0) {
      await prisma.roomBlock.deleteMany({
        where: { id: { in: createdBlockIds } }
      });
    }
    if (createdBookingIds.length > 0) {
      await prisma.bookingSlot.deleteMany({
        where: { bookingId: { in: createdBookingIds } }
      });
      await prisma.booking.deleteMany({
        where: { id: { in: createdBookingIds } }
      });
    }
    await prisma.$disconnect();
  });

  /**
   * DEF-SS-01 (Critical — BR-01, BR-02, BR-06, NFR-03):
   * TOCTOU Race Condition Between Online Booking (BookingSlot) and Maintenance Block (RoomBlock).
   * If a RoomBlock is committed concurrently after any non-transactional pre-check and before
   * the booking transaction commits, the transaction MUST re-verify RoomBlock vacancy under lock
   * and reject the booking with HTTP 409 SLOT_CONFLICT so BookingSlot and RoomBlock never coexist.
   */
  it('DEF-SS-01: rejects online booking with HTTP 409 SLOT_CONFLICT when a RoomBlock is inserted concurrently before transaction commit (BR-02, BR-06)', async () => {
    const targetSlot = 4; // 14:00 - 15:00
    const origFindMany = prisma.roomBlock.findMany.bind(prisma.roomBlock);
    let injectedConcurrentBlock = false;

    // Simulate TOCTOU window: the initial outer pre-check sees zero RoomBlocks,
    // and immediately afterward a concurrent maintenance block is committed on (roomS01, DEF01_DATE, Slot 4)
    // before the booking transaction executes its write.
    (jest.spyOn(prisma.roomBlock, 'findMany') as any).mockImplementation(async (args?: any) => {
      const result = await origFindMany(args);
      if (!injectedConcurrentBlock) {
        injectedConcurrentBlock = true;
        const concurrentBlock = await prisma.roomBlock.create({
          data: {
            roomId: roomS01.id,
            blockDate: DEF01_DATE,
            slotIndex: targetSlot,
            reason: 'DEF-SS-01 concurrent maintenance block during TOCTOU window'
          }
        });
        createdBlockIds.push(concurrentBlock.id);
      }
      return result;
    });

    const res = await request(app)
      .post('/api/bookings/online')
      .set('Authorization', `Bearer ${customer1Token}`)
      .send({
        roomId: roomS01.id,
        bookingDate: DEF01_DATE,
        startSlot: targetSlot,
        durationHours: 1,
        partySize: 2
      });

    if (res.body?.booking?.id) {
      createdBookingIds.push(res.body.booking.id);
    }

    // Must reject with 409 SLOT_CONFLICT; must NOT allow BookingSlot and RoomBlock to coexist
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error?.code).toBe('SLOT_CONFLICT');

    const coexistingSlots = await prisma.bookingSlot.count({
      where: {
        roomId: roomS01.id,
        bookingDate: DEF01_DATE,
        slotIndex: targetSlot
      }
    });
    expect(coexistingSlots).toBe(0);
  });

  /**
   * DEF-SS-01b (Critical — Two-Transaction Concurrency Race Between Booking & RoomBlock — BR-02, BR-06):
   * Executes two real concurrent database transactions simultaneously via Promise.all:
   * - Transaction A: POST /api/bookings/online
   * - Transaction B: createMaintenanceRoomBlock (using the shared Room FOR UPDATE locking protocol)
   * Proves that PostgreSQL serializes both transactions on the Room row lock and permits strictly
   * ONE claim to commit while rejecting the competing transaction with 409 SLOT_CONFLICT.
   */
  it('DEF-SS-01b: concurrent two-transaction race between online booking and createMaintenanceRoomBlock serializes on Room FOR UPDATE lock and prevents coexistence (BR-02, BR-06)', async () => {
    const raceSlot = 11; // 21:00 - 22:00

    const [bookingOutcome, blockOutcome] = await Promise.allSettled([
      request(app)
        .post('/api/bookings/online')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          roomId: roomS01.id,
          bookingDate: DEF01_DATE,
          startSlot: raceSlot,
          durationHours: 1,
          partySize: 2
        }),
      createMaintenanceRoomBlock({
        roomId: roomS01.id,
        blockDate: DEF01_DATE,
        slotIndex: raceSlot,
        reason: 'Concurrent maintenance block transaction'
      })
    ]);

    expect(bookingOutcome.status).toBe('fulfilled');
    const bookingRes = (bookingOutcome as PromiseFulfilledResult<any>).value;
    if (bookingRes.body?.booking?.id) {
      createdBookingIds.push(bookingRes.body.booking.id);
    }
    if (blockOutcome.status === 'fulfilled' && blockOutcome.value?.id) {
      createdBlockIds.push(blockOutcome.value.id);
    }

    const bookingSucceeded = bookingRes.status === 201;
    const blockSucceeded = blockOutcome.status === 'fulfilled';

    // Strictly one transaction wins and the competing transaction is rejected with 409 SLOT_CONFLICT
    expect(bookingSucceeded !== blockSucceeded).toBe(true);

    if (bookingSucceeded) {
      expect(blockOutcome.status).toBe('rejected');
      const blockErr = (blockOutcome as PromiseRejectedResult).reason;
      expect(blockErr.code).toBe('SLOT_CONFLICT');
    } else {
      expect(bookingRes.status).toBe(409);
      expect(bookingRes.body.error?.code).toBe('SLOT_CONFLICT');
    }

    const [persistedSlotsCount, persistedBlocksCount] = await Promise.all([
      prisma.bookingSlot.count({
        where: { roomId: roomS01.id, bookingDate: DEF01_DATE, slotIndex: raceSlot }
      }),
      prisma.roomBlock.count({
        where: { roomId: roomS01.id, blockDate: DEF01_DATE, slotIndex: raceSlot }
      })
    ]);

    // Total claims across both tables for (roomS01, DEF01_DATE, Slot 11) must be strictly 1 (never 2)
    expect(persistedSlotsCount + persistedBlocksCount).toBe(1);
  });

  /**
   * DEF-SS-02 (Major — FR-03, FR-04, BR-01, AC-03, AC-04a):
   * Latent "Zombie Slot" Permanent Lockout When Booking Status Transitions to CANCELLED.
   * When a CANCELLED booking has lingering BookingSlot rows in PostgreSQL, GET /api/availability
   * reports the slot as available (isAvailable: true), so POST /api/bookings/online MUST succeed
   * with HTTP 201 Created rather than failing with a permanent 409 SLOT_CONFLICT on P2002.
   */
  it('DEF-SS-02: allows booking a slot shown as available when a prior CANCELLED booking left an orphaned BookingSlot row (FR-03, FR-04)', async () => {
    const zombieSlot = 9; // 19:00 - 20:00

    // 1. Seed a CANCELLED booking that still has a lingering BookingSlot row on (roomS01, DEF02_DATE, Slot 9)
    const cancelledBooking = await prisma.booking.create({
      data: {
        bookingCode: `BK-ZOMBIE-${Date.now().toString(36).slice(-4).toUpperCase()}`,
        userId: customer1Id,
        roomId: roomS01.id,
        bookingDate: DEF02_DATE,
        startSlot: zombieSlot,
        durationHours: 1,
        partySize: 2,
        channel: 'ONLINE',
        customerName: 'Alice Customer',
        status: 'CANCELLED',
        slots: {
          create: [
            {
              roomId: roomS01.id,
              bookingDate: DEF02_DATE,
              slotIndex: zombieSlot
            }
          ]
        }
      }
    });
    createdBookingIds.push(cancelledBooking.id);

    // 2. Verify GET /api/availability advertises Slot 9 as available (isAvailable: true)
    const availRes = await request(app).get(`/api/availability?date=${DEF02_DATE}`);
    expect(availRes.status).toBe(200);
    const s01Avail = availRes.body.rooms.find((r: any) => r.roomNumber === 'S01');
    const slot9Avail = s01Avail.slots.find((s: any) => s.slotIndex === zombieSlot);
    expect(slot9Avail.isAvailable).toBe(true);

    // 3. Customer 2 books the available Slot 9 -> must succeed with HTTP 201 Created (not 409 zombie lockout)
    const bookRes = await request(app)
      .post('/api/bookings/online')
      .set('Authorization', `Bearer ${customer2Token}`)
      .send({
        roomId: roomS01.id,
        bookingDate: DEF02_DATE,
        startSlot: zombieSlot,
        durationHours: 1,
        partySize: 2
      });

    if (bookRes.body?.booking?.id) {
      createdBookingIds.push(bookRes.body.booking.id);
    }

    expect(bookRes.status).toBe(201);
    expect(bookRes.body.success).toBe(true);
    expect(bookRes.body.booking.status).toBe('CONFIRMED');
  });

  /**
   * DEF-SS-03 (Major — FR-04, AC-04a, NFR-03):
   * Unhandled P2002 Crash (HTTP 500) on bookingCode Collision.
   * If generateBookingCode produces a 4-char suffix that collides with an existing bookingCode,
   * POST /api/bookings/online MUST automatically retry with a fresh bookingCode and succeed with
   * HTTP 201 Created rather than crashing with HTTP 500 INTERNAL_SERVER_ERROR.
   */
  it('DEF-SS-03: automatically retries and returns HTTP 201 Created when an initial bookingCode collision (P2002) occurs (FR-04, AC-04a)', async () => {
    const fixedRandomValue = 0.28687331; // Deterministically yields 4-char suffix 'ABSD'

    // 1. Pre-create a booking on Room M01 Slot 1 that holds the deterministic colliding bookingCode
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValueOnce(fixedRandomValue);
    const collidingCode = generateBookingCode(DEF03_DATE);
    randomSpy.mockRestore();

    const existingBooking = await prisma.booking.create({
      data: {
        bookingCode: collidingCode,
        userId: customer1Id,
        roomId: roomM01.id,
        bookingDate: DEF03_DATE,
        startSlot: 1,
        durationHours: 1,
        partySize: 2,
        channel: 'ONLINE',
        customerName: 'Alice Customer',
        status: 'CONFIRMED',
        slots: {
          create: [
            {
              roomId: roomM01.id,
              bookingDate: DEF03_DATE,
              slotIndex: 1
            }
          ]
        }
      }
    });
    createdBookingIds.push(existingBooking.id);

    // 2. Force the first generateBookingCode call during POST /api/bookings/online to collide with collidingCode,
    // while subsequent retry calls use normal Math.random()
    jest.spyOn(Math, 'random').mockReturnValueOnce(fixedRandomValue);

    const res = await request(app)
      .post('/api/bookings/online')
      .set('Authorization', `Bearer ${customer2Token}`)
      .send({
        roomId: roomM01.id,
        bookingDate: DEF03_DATE,
        startSlot: 5, // Completely different open slot on Room M01
        durationHours: 2,
        partySize: 4
      });

    if (res.body?.booking?.id) {
      createdBookingIds.push(res.body.booking.id);
    }

    // Must recover via retry and return HTTP 201 Created (not HTTP 500 crash)
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.booking.bookingCode).toMatch(/^BK-\d{8}-[A-Z0-9]{4}$/);
    expect(res.body.booking.bookingCode).not.toBe(collidingCode);
  });
});
