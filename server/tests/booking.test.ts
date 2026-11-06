import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/prisma';

describe('Feature F-04: Online Booking Engine & Contiguous Validation Suite (Issue #4)', () => {
  // Compute dynamic future date string in Asia/Bangkok timezone
  const getFutureBangkokDateString = (daysAhead = 20): string => {
    const now = new Date();
    const future = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(future);
  };

  const getBangkokTodayString = (): string => {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date());
  };

  const getBangkokCurrentHour = (): number => {
    const hourStr = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Bangkok',
      hour: 'numeric',
      hour12: false
    }).format(new Date());
    return parseInt(hourStr, 10);
  };

  const TEST_DATE = getFutureBangkokDateString(20);
  let customerToken: string;
  let staffToken: string;
  let roomS01: { id: string; roomNumber: string; capacity: number };
  const createdBookingIds: string[] = [];

  beforeAll(async () => {
    // 1. Authenticate as seeded customer1 to obtain customer Bearer token
    const customerLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'customer1@singslot.local',
        password: 'Pass1234!'
      });

    expect(customerLoginRes.status).toBe(200);
    expect(customerLoginRes.body.token).toBeDefined();
    customerToken = customerLoginRes.body.token;

    // 2. Authenticate as seeded staff to obtain staff Bearer token (for RBAC test)
    const staffLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'staff@singslot.local',
        password: 'Pass1234!'
      });

    expect(staffLoginRes.status).toBe(200);
    expect(staffLoginRes.body.token).toBeDefined();
    staffToken = staffLoginRes.body.token;

    // 3. Fetch seeded room S01
    const s01 = await prisma.room.findUnique({
      where: { roomNumber: 'S01' }
    });
    if (!s01) {
      throw new Error('Database prerequisite missing: Room S01 not found.');
    }
    roomS01 = s01;

    // Note: We do NOT delete existing database records indiscriminately in beforeAll().
    // Tests strictly manage and track their own created fixtures in createdBookingIds.
  });

  afterAll(async () => {
    // Clean up strictly the bookings created by this test suite
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
   * TEST-04a (AC-04a, FR-04, BR-01):
   * Valid 1–5 hour booking confirmed and persisted.
   * Customer reserving contiguous open slots receives HTTP 201 Created and unique bookingCode.
   */
  it('TEST-04a: valid 3-hour contiguous online booking confirmed and persisted (AC-04a)', async () => {
    const res = await request(app)
      .post('/api/bookings/online')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        roomId: roomS01.id,
        bookingDate: TEST_DATE,
        startSlot: 1, // 11:00 - 12:00
        durationHours: 3, // 11:00 - 14:00 (slots 1, 2, 3)
        partySize: 3
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.booking).toBeDefined();
    expect(res.body.booking.id).toBeDefined();
    expect(res.body.booking.bookingCode).toMatch(/^BK-\d{8}-[A-Z0-9]{4}$/);
    expect(res.body.booking.roomNumber).toBe('S01');
    expect(res.body.booking.bookingDate).toBe(TEST_DATE);
    expect(res.body.booking.timeRange).toBe('11:00 - 14:00');
    expect(res.body.booking.durationHours).toBe(3);
    expect(res.body.booking.partySize).toBe(3);
    expect(res.body.booking.status).toBe('CONFIRMED');

    createdBookingIds.push(res.body.booking.id);

    // Assert persistence in PostgreSQL database
    const dbBooking = await prisma.booking.findUnique({
      where: { id: res.body.booking.id },
      include: { slots: true }
    });
    expect(dbBooking).not.toBeNull();
    expect(dbBooking?.bookingCode).toBe(res.body.booking.bookingCode);
    expect(dbBooking?.durationHours).toBe(3);
    expect(dbBooking?.slots).toHaveLength(3);

    const slotIndices = dbBooking?.slots.map((s) => s.slotIndex).sort((a, b) => a - b);
    expect(slotIndices).toEqual([1, 2, 3]);
  });

  /**
   * TEST-04a (1-hour boundary):
   * Valid 1-hour booking (minimum duration).
   */
  it('TEST-04a: valid 1-hour booking succeeds with single slot persisted', async () => {
    const res = await request(app)
      .post('/api/bookings/online')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        roomId: roomS01.id,
        bookingDate: TEST_DATE,
        startSlot: 5, // 15:00 - 16:00
        durationHours: 1,
        partySize: 2
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.booking.timeRange).toBe('15:00 - 16:00');
    createdBookingIds.push(res.body.booking.id);

    const dbSlots = await prisma.bookingSlot.findMany({
      where: { bookingId: res.body.booking.id }
    });
    expect(dbSlots).toHaveLength(1);
    expect(dbSlots[0].slotIndex).toBe(5);
  });

  /**
   * TEST-04a (5-hour boundary):
   * Valid 5-hour booking (maximum duration).
   */
  it('TEST-04a: valid 5-hour booking succeeds with 5 slots persisted', async () => {
    const res = await request(app)
      .post('/api/bookings/online')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        roomId: roomS01.id,
        bookingDate: TEST_DATE,
        startSlot: 7, // 17:00 - 22:00 (slots 7, 8, 9, 10, 11)
        durationHours: 5,
        partySize: 4
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.booking.timeRange).toBe('17:00 - 22:00');
    createdBookingIds.push(res.body.booking.id);

    const dbSlots = await prisma.bookingSlot.findMany({
      where: { bookingId: res.body.booking.id }
    });
    expect(dbSlots).toHaveLength(5);
  });

  /**
   * TEST-04c (AC-04c, BR-04):
   * Past date/slot reservation request is rejected with HTTP 400 CANNOT_BOOK_PAST_SLOT.
   */
  it('TEST-04c: past calendar date request is rejected with HTTP 400 CANNOT_BOOK_PAST_SLOT (AC-04c)', async () => {
    const PAST_DATE = '2020-01-01';

    const res = await request(app)
      .post('/api/bookings/online')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        roomId: roomS01.id,
        bookingDate: PAST_DATE,
        startSlot: 0,
        durationHours: 2,
        partySize: 2
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('CANNOT_BOOK_PAST_SLOT');
    expect(res.body.error.message).toMatch(/past/i);
  });

  /**
   * TEST-04c (Same-Day Elapsed Slot):
   * Evaluates Asia/Bangkok time to ensure elapsed slots on today's date are rejected.
   */
  it('TEST-04c: elapsed slot on current date in Asia/Bangkok is rejected with HTTP 400 CANNOT_BOOK_PAST_SLOT', async () => {
    const todayBangkok = getBangkokTodayString();
    const currentHour = getBangkokCurrentHour();

    if (currentHour >= 10) {
      // Slot 0 (10:00 - 11:00) has already elapsed if Bangkok current hour >= 10
      const res = await request(app)
        .post('/api/bookings/online')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          roomId: roomS01.id,
          bookingDate: todayBangkok,
          startSlot: 0,
          durationHours: 1,
          partySize: 2
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CANNOT_BOOK_PAST_SLOT');
      expect(res.body.error.message).toMatch(/past/i);
    } else {
      // If executed before 10:00 AM Bangkok, yesterday's late slot has definitely elapsed
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const yesterdayStr = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Bangkok',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(yesterday);

      const res = await request(app)
        .post('/api/bookings/online')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          roomId: roomS01.id,
          bookingDate: yesterdayStr,
          startSlot: 13,
          durationHours: 1,
          partySize: 2
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('CANNOT_BOOK_PAST_SLOT');
    }
  });

  /**
   * TEST-04d (AC-04d, BR-05):
   * Party size exceeding room capacity is rejected with HTTP 400 EXCEEDS_CAPACITY.
   */
  it('TEST-04d: party size exceeding room capacity is rejected with HTTP 400 EXCEEDS_CAPACITY (AC-04d)', async () => {
    // S01 capacity is 4; attempting to book for 5 guests
    const res = await request(app)
      .post('/api/bookings/online')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        roomId: roomS01.id,
        bookingDate: TEST_DATE,
        startSlot: 0,
        durationHours: 1,
        partySize: 5
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('EXCEEDS_CAPACITY');
    expect(res.body.error.message).toContain('Party size (5) exceeds room capacity (4)');
  });

  /**
   * TEST-04f (AC-04f, NFR-03):
   * Multi-slot booking failure leaves zero orphaned Booking or BookingSlot records (Atomic Rollback).
   * Verified by asserting specific HTTP 500 error response from injected failure and asserting zero orphaned rows.
   */
  it('TEST-04f: multi-slot booking fault-injection rolls back atomically leaving zero orphaned records (AC-04f)', async () => {
    const FAULT_DATE = getFutureBangkokDateString(25);
    const targetSlot = 0;

    // Execute booking with simulated runtime failure header
    const res = await request(app)
      .post('/api/bookings/online')
      .set('Authorization', `Bearer ${customerToken}`)
      .set('x-simulate-failure', 'true')
      .send({
        roomId: roomS01.id,
        bookingDate: FAULT_DATE,
        startSlot: targetSlot,
        durationHours: 3,
        partySize: 2
      });

    // Explicitly assert that the failure is the simulated runtime failure inside the transaction
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('INTERNAL_SERVER_ERROR');
    expect(res.body.error.message).toContain('Simulated transaction failure for TEST-04f');

    // Verify 100% rollback: Zero orphaned Booking and zero orphaned BookingSlot rows exist in database
    const orphanedSlots = await prisma.bookingSlot.findMany({
      where: { roomId: roomS01.id, bookingDate: FAULT_DATE }
    });
    expect(orphanedSlots).toHaveLength(0);

    const orphanedBookings = await prisma.booking.findMany({
      where: { roomId: roomS01.id, bookingDate: FAULT_DATE }
    });
    expect(orphanedBookings).toHaveLength(0);
  });

  /**
   * RBAC Authorization Guards (BR-08):
   */
  describe('RBAC Authorization Guards (CUSTOMER vs STAFF)', () => {
    it('rejects staff user from customer online booking endpoint with HTTP 403 FORBIDDEN', async () => {
      const res = await request(app)
        .post('/api/bookings/online')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          roomId: roomS01.id,
          bookingDate: TEST_DATE,
          startSlot: 0,
          durationHours: 1,
          partySize: 2
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('rejects unauthenticated booking requests with HTTP 401 UNAUTHENTICATED', async () => {
      const res = await request(app)
        .post('/api/bookings/online')
        .send({
          roomId: roomS01.id,
          bookingDate: TEST_DATE,
          startSlot: 0,
          durationHours: 1,
          partySize: 2
        });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHENTICATED');
    });
  });

  /**
   * Operating Hours & Duration Boundaries (BR-03):
   */
  describe('Operating Window & Duration Boundaries (BR-03)', () => {
    it('rejects duration > 5 hours with HTTP 400 INVALID_DURATION', async () => {
      const res = await request(app)
        .post('/api/bookings/online')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          roomId: roomS01.id,
          bookingDate: TEST_DATE,
          startSlot: 0,
          durationHours: 6,
          partySize: 2
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_DURATION');
    });

    it('rejects duration < 1 hour with HTTP 400 INVALID_DURATION', async () => {
      const res = await request(app)
        .post('/api/bookings/online')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          roomId: roomS01.id,
          bookingDate: TEST_DATE,
          startSlot: 0,
          durationHours: 0,
          partySize: 2
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_DURATION');
    });

    it('rejects booking that extends past operating hours (slot 14) with HTTP 400 INVALID_DURATION', async () => {
      // startSlot: 11 (21:00-22:00) with duration: 4 ends at 25:00 (slot 14)
      const res = await request(app)
        .post('/api/bookings/online')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          roomId: roomS01.id,
          bookingDate: TEST_DATE,
          startSlot: 11,
          durationHours: 4,
          partySize: 2
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_DURATION');
    });

    it('rejects negative startSlot with HTTP 400 INVALID_DURATION', async () => {
      const res = await request(app)
        .post('/api/bookings/online')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          roomId: roomS01.id,
          bookingDate: TEST_DATE,
          startSlot: -1,
          durationHours: 2,
          partySize: 2
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_DURATION');
    });

    it('rejects startSlot > 13 with HTTP 400 INVALID_DURATION', async () => {
      const res = await request(app)
        .post('/api/bookings/online')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          roomId: roomS01.id,
          bookingDate: TEST_DATE,
          startSlot: 14,
          durationHours: 1,
          partySize: 2
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_DURATION');
    });
  });

  /**
   * Input Validation & Error Envelopes:
   */
  describe('Input Validation & Error Envelopes', () => {
    it('rejects non-existent room with HTTP 404 ROOM_NOT_FOUND', async () => {
      const res = await request(app)
        .post('/api/bookings/online')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          roomId: 'non-existent-room-uuid',
          bookingDate: TEST_DATE,
          startSlot: 0,
          durationHours: 1,
          partySize: 2
        });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('ROOM_NOT_FOUND');
    });

    it('rejects partySize < 1 with HTTP 400 INVALID_INPUT', async () => {
      const res = await request(app)
        .post('/api/bookings/online')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          roomId: roomS01.id,
          bookingDate: TEST_DATE,
          startSlot: 0,
          durationHours: 1,
          partySize: 0
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_INPUT');
    });

    it('rejects invalid date format with HTTP 400 INVALID_INPUT', async () => {
      const res = await request(app)
        .post('/api/bookings/online')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          roomId: roomS01.id,
          bookingDate: 'not-a-date',
          startSlot: 0,
          durationHours: 1,
          partySize: 2
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_INPUT');
    });

    it('rejects missing required fields with HTTP 400 INVALID_INPUT', async () => {
      const res = await request(app)
        .post('/api/bookings/online')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_INPUT');
    });
  });
});
