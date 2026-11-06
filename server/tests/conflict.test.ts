import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/prisma';

describe('Feature F-04: Conflict Prevention & Concurrency Protection Suite (Issue #5)', () => {
  // Compute dynamic future date string (30 days ahead) in Asia/Bangkok timezone
  const getFutureBangkokDateString = (daysAhead = 30): string => {
    const now = new Date();
    const future = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(future);
  };

  const TEST_DATE = getFutureBangkokDateString(30);
  const CONCURRENCY_DATE = getFutureBangkokDateString(35);
  const FIXTURE_SLOT3_CODE = `TEST-05-FIX-SLOT3-${Date.now()}`;

  let customer1Token: string;
  let customer2Token: string;
  let customer1Id: string;
  let customer2Id: string;
  let roomS01: { id: string; roomNumber: string; capacity: number };
  let roomM01: { id: string; roomNumber: string; capacity: number };
  const createdBookingIds: string[] = [];

  beforeAll(async () => {
    // 1. Authenticate customer1 and customer2
    const [c1Login, c2Login] = await Promise.all([
      request(app)
        .post('/api/auth/login')
        .send({ email: 'customer1@singslot.local', password: 'Pass1234!' }),
      request(app)
        .post('/api/auth/login')
        .send({ email: 'customer2@singslot.local', password: 'Pass1234!' })
    ]);

    expect(c1Login.status).toBe(200);
    expect(c2Login.status).toBe(200);
    customer1Token = c1Login.body.token;
    customer2Token = c2Login.body.token;
    customer1Id = c1Login.body.user.id;
    customer2Id = c2Login.body.user.id;

    // 2. Fetch seeded rooms S01 and M01
    const [s01, m01] = await Promise.all([
      prisma.room.findUnique({ where: { roomNumber: 'S01' } }),
      prisma.room.findUnique({ where: { roomNumber: 'M01' } })
    ]);

    if (!s01 || !m01) {
      throw new Error('Database prerequisite missing: S01 or M01 not found.');
    }
    roomS01 = s01;
    roomM01 = m01;

    // 3. Pre-clean strictly scoped to this test suite's deterministic fixture
    await prisma.bookingSlot.deleteMany({
      where: {
        roomId: roomS01.id,
        bookingDate: TEST_DATE,
        booking: {
          bookingCode: FIXTURE_SLOT3_CODE,
          userId: customer1Id
        }
      }
    });
    await prisma.booking.deleteMany({
      where: {
        bookingCode: FIXTURE_SLOT3_CODE,
        roomId: roomS01.id,
        bookingDate: TEST_DATE,
        userId: customer1Id
      }
    });

    // 4. Create deterministic test fixture: S01 Slot 3 occupied on TEST_DATE (BR-01 / TEST-04b)
    const slot3Booking = await prisma.booking.create({
      data: {
        bookingCode: FIXTURE_SLOT3_CODE,
        userId: customer1Id,
        roomId: roomS01.id,
        bookingDate: TEST_DATE,
        startSlot: 3, // 13:00 - 14:00
        durationHours: 1,
        partySize: 2,
        channel: 'ONLINE',
        customerName: 'Customer 1',
        status: 'CONFIRMED',
        slots: {
          create: [
            {
              roomId: roomS01.id,
              bookingDate: TEST_DATE,
              slotIndex: 3
            }
          ]
        }
      }
    });

    createdBookingIds.push(slot3Booking.id);
  });

  afterAll(async () => {
    // Clean up strictly test-owned fixtures and bookings created during this suite
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
   * TEST-04b (AC-04b, BR-01):
   * Contiguous Slot Rule (TDD Verification).
   * Customer attempting to book 3 contiguous hours (slots 2..4) where slot 3 is already occupied
   * must be rejected with HTTP 409 SLOT_CONFLICT with zero data modifications.
   */
  it('TEST-04b: booking across occupied Slot 3 returns HTTP 409 SLOT_CONFLICT with zero data modifications (AC-04b)', async () => {
    // Count existing bookings and slots before attempt
    const initialBookingCount = await prisma.booking.count({
      where: { roomId: roomS01.id, bookingDate: TEST_DATE }
    });
    const initialSlotCount = await prisma.bookingSlot.count({
      where: { roomId: roomS01.id, bookingDate: TEST_DATE }
    });

    // Request 3 hours starting at Slot 2 (12:00 - 15:00, slots 2, 3, 4)
    // Slot 3 is occupied by test fixture created in beforeAll -> must reject
    const res = await request(app)
      .post('/api/bookings/online')
      .set('Authorization', `Bearer ${customer2Token}`)
      .send({
        roomId: roomS01.id,
        bookingDate: TEST_DATE,
        startSlot: 2, // 12:00 - 15:00 (slots 2, 3, 4)
        durationHours: 3,
        partySize: 3
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('SLOT_CONFLICT');
    expect(res.body.error.message).toContain('already occupied');

    // Assert zero side-effects in PostgreSQL database
    const postBookingCount = await prisma.booking.count({
      where: { roomId: roomS01.id, bookingDate: TEST_DATE }
    });
    const postSlotCount = await prisma.bookingSlot.count({
      where: { roomId: roomS01.id, bookingDate: TEST_DATE }
    });

    expect(postBookingCount).toBe(initialBookingCount);
    expect(postSlotCount).toBe(initialSlotCount);
  });

  /**
   * TEST-04e (AC-04e, BR-02, BR-06):
   * Concurrency Collision Suite (Parallel Request Simulation).
   * Two customers simultaneously submit booking requests for the exact same room and slot interval.
   * Exactly ONE request succeeds (HTTP 201) and the competing request returns HTTP 409 Conflict.
   */
  it('TEST-04e: competing concurrent booking attempts produce strictly one confirmed booking and one 409 Conflict (AC-04e)', async () => {
    const targetSlot = 6; // 16:00 - 18:00
    const duration = 2; // slots 6, 7

    // Simulate simultaneous requests targeting the same room-date-slot
    const [res1, res2] = await Promise.all([
      request(app)
        .post('/api/bookings/online')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          roomId: roomM01.id,
          bookingDate: CONCURRENCY_DATE,
          startSlot: targetSlot,
          durationHours: duration,
          partySize: 4
        }),
      request(app)
        .post('/api/bookings/online')
        .set('Authorization', `Bearer ${customer2Token}`)
        .send({
          roomId: roomM01.id,
          bookingDate: CONCURRENCY_DATE,
          startSlot: targetSlot,
          durationHours: duration,
          partySize: 4
        })
    ]);

    // Collect ID of any created booking BEFORE status assertions to ensure cleanup even on test failure
    if (res1.body?.booking?.id) createdBookingIds.push(res1.body.booking.id);
    if (res2.body?.booking?.id) createdBookingIds.push(res2.body.booking.id);

    // Check status codes: exactly one 201 and exactly one 409
    const statuses = [res1.status, res2.status].sort();
    expect(statuses).toEqual([201, 409]);

    // Identify the winning response and track its ID for cleanup
    const winningRes = res1.status === 201 ? res1 : res2;
    const losingRes = res1.status === 409 ? res1 : res2;
    const expectedWinningUserId = res1.status === 201 ? customer1Id : customer2Id;

    expect(winningRes.body.success).toBe(true);
    expect(winningRes.body.booking).toBeDefined();
    expect(winningRes.body.booking.status).toBe('CONFIRMED');

    expect(losingRes.body.success).toBe(false);
    expect(losingRes.body.error.code).toBe('SLOT_CONFLICT');

    // Database verification: Exactly one booking created in PostgreSQL and belongs to winning customer
    const confirmedBookings = await prisma.booking.findMany({
      where: { roomId: roomM01.id, bookingDate: CONCURRENCY_DATE }
    });
    expect(confirmedBookings).toHaveLength(1);
    expect(confirmedBookings[0].id).toBe(winningRes.body.booking.id);
    expect(confirmedBookings[0].userId).toBe(expectedWinningUserId);

    // Database verification: Exactly 2 slots (6, 7) persisted, no duplicate slots, and both reference winning booking
    const persistedSlots = await prisma.bookingSlot.findMany({
      where: { roomId: roomM01.id, bookingDate: CONCURRENCY_DATE }
    });
    expect(persistedSlots).toHaveLength(2);
    const persistedIndices = persistedSlots.map((s) => s.slotIndex).sort((a, b) => a - b);
    expect(persistedIndices).toEqual([6, 7]);
    expect(persistedSlots.every((s) => s.bookingId === winningRes.body.booking.id)).toBe(true);
  });

  /**
   * Database-Level Composite Constraint Integrity (BR-01, NFR-03, Schema Audit):
   * Directly proves that PostgreSQL @@unique([roomId, bookingDate, slotIndex]) rejects
   * duplicate slot insertions at the database engine level with Prisma P2002,
   * completely independent of application-level interval checks.
   */
  it('Database Constraint: PostgreSQL directly rejects duplicate slot insertion with Prisma P2002', async () => {
    const directTestDate = getFutureBangkokDateString(40);
    const targetSlotIndex = 8;

    // 1. First booking takes Slot 8
    const firstBooking = await prisma.booking.create({
      data: {
        bookingCode: `TEST-05-DIRECT-1-${Date.now()}`,
        userId: customer1Id,
        roomId: roomS01.id,
        bookingDate: directTestDate,
        startSlot: targetSlotIndex,
        durationHours: 1,
        partySize: 2,
        channel: 'ONLINE',
        customerName: 'Customer 1',
        status: 'CONFIRMED',
        slots: {
          create: [
            {
              roomId: roomS01.id,
              bookingDate: directTestDate,
              slotIndex: targetSlotIndex
            }
          ]
        }
      }
    });
    createdBookingIds.push(firstBooking.id);

    // 2. Second booking attempts to directly insert another BookingSlot for the EXACT SAME roomId, bookingDate, slotIndex
    const secondBooking = await prisma.booking.create({
      data: {
        bookingCode: `TEST-05-DIRECT-2-${Date.now()}`,
        userId: customer2Id,
        roomId: roomS01.id,
        bookingDate: directTestDate,
        startSlot: targetSlotIndex,
        durationHours: 1,
        partySize: 2,
        channel: 'ONLINE',
        customerName: 'Customer 2',
        status: 'CONFIRMED'
      }
    });
    createdBookingIds.push(secondBooking.id);

    // 3. Attempt direct insert of colliding slot -> PostgreSQL engine must reject with P2002
    let caughtError: any = null;
    try {
      await prisma.bookingSlot.create({
        data: {
          bookingId: secondBooking.id,
          roomId: roomS01.id,
          bookingDate: directTestDate,
          slotIndex: targetSlotIndex
        }
      });
    } catch (err: any) {
      caughtError = err;
    }

    expect(caughtError).not.toBeNull();
    expect(caughtError.code).toBe('P2002');
    const target = caughtError.meta?.target;
    // Composite constraint @@unique([roomId, bookingDate, slotIndex]) validation
    const isCompositeConstraint =
      (Array.isArray(target) &&
        target.includes('roomId') &&
        target.includes('bookingDate') &&
        target.includes('slotIndex')) ||
      (typeof target === 'string' &&
        (target.includes('roomId_bookingDate_slotIndex') ||
          (target.includes('roomId') &&
            target.includes('bookingDate') &&
            target.includes('slotIndex'))));
    expect(isCompositeConstraint).toBe(true);
  });
});

