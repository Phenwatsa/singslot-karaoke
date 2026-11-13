import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/prisma';

describe('Feature F-05 & F-06: Customer My Bookings, Detail & Master Schedule Suite (Issue #6)', () => {
  const getFutureBangkokDateString = (daysAhead = 25): string => {
    const now = new Date();
    const future = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(future);
  };

  const TEST_DATE = getFutureBangkokDateString(25);
  const OTHER_DATE = getFutureBangkokDateString(26);
  const STAFF_PASSWORD = process.env.STAFF_PASSWORD || 'Pass1234!';
  const CUSTOMER_PASSWORD = process.env.CUSTOMER_PASSWORD || 'Pass1234!';
  let customer1Token: string;
  let customer2Token: string;
  let staffToken: string;
  let customer1Id: string;
  let customer2Id: string;
  let staffId: string;
  let roomS01: { id: string; roomNumber: string; capacity: number };
  let roomM01: { id: string; roomNumber: string; capacity: number };
  let c1BookingId: string;
  let c2BookingId: string;
  let otherDateBookingId: string;
  let cancelledBookingId: string;
  const createdBookingIds: string[] = [];

  beforeAll(async () => {
    // 1. Authenticate users
    const [c1Login, c2Login, staffLogin] = await Promise.all([
      request(app)
        .post('/api/auth/login')
        .send({ email: 'customer1@singslot.local', password: CUSTOMER_PASSWORD }),
      request(app)
        .post('/api/auth/login')
        .send({ email: 'customer2@singslot.local', password: CUSTOMER_PASSWORD }),
      request(app)
        .post('/api/auth/login')
        .send({ email: 'staff@singslot.local', password: STAFF_PASSWORD })
    ]);

    expect(c1Login.status).toBe(200);
    expect(c2Login.status).toBe(200);
    expect(staffLogin.status).toBe(200);

    customer1Token = c1Login.body.token;
    customer2Token = c2Login.body.token;
    staffToken = staffLogin.body.token;
    customer1Id = c1Login.body.user.id;
    customer2Id = c2Login.body.user.id;
    staffId = staffLogin.body.user.id;

    // 2. Fetch all seeded rooms
    const allRooms = await prisma.room.findMany({ orderBy: { roomNumber: 'asc' } });
    if (allRooms.length < 9) {
      throw new Error(`Database prerequisite missing: expected 9 rooms, found ${allRooms.length}`);
    }

    const s01 = allRooms.find((r) => r.roomNumber === 'S01');
    const m01 = allRooms.find((r) => r.roomNumber === 'M01');
    if (!s01 || !m01) {
      throw new Error('Database prerequisite missing: S01 or M01 not found.');
    }
    roomS01 = s01;
    roomM01 = m01;

    // 3. Create test reservation for Customer 1 (S01, slots 2..3)
    const c1Booking = await prisma.booking.create({
      data: {
        bookingCode: `TEST-06-C1-${Date.now()}`,
        userId: customer1Id,
        roomId: roomS01.id,
        bookingDate: TEST_DATE,
        startSlot: 2,
        durationHours: 2,
        partySize: 3,
        channel: 'ONLINE',
        customerName: 'Customer One',
        customerPhone: '0812345678',
        status: 'CONFIRMED',
        slots: {
          create: [
            { roomId: roomS01.id, bookingDate: TEST_DATE, slotIndex: 2 },
            { roomId: roomS01.id, bookingDate: TEST_DATE, slotIndex: 3 }
          ]
        }
      }
    });
    c1BookingId = c1Booking.id;
    createdBookingIds.push(c1Booking.id);

    // 4. Create test reservation for Customer 2 (M01, slots 5..7)
    const c2Booking = await prisma.booking.create({
      data: {
        bookingCode: `TEST-06-C2-${Date.now()}`,
        userId: customer2Id,
        roomId: roomM01.id,
        bookingDate: TEST_DATE,
        startSlot: 5,
        durationHours: 3,
        partySize: 6,
        channel: 'ONLINE',
        customerName: 'Customer Two',
        customerPhone: '0898765432',
        status: 'CONFIRMED',
        slots: {
          create: [
            { roomId: roomM01.id, bookingDate: TEST_DATE, slotIndex: 5 },
            { roomId: roomM01.id, bookingDate: TEST_DATE, slotIndex: 6 },
            { roomId: roomM01.id, bookingDate: TEST_DATE, slotIndex: 7 }
          ]
        }
      }
    });
    c2BookingId = c2Booking.id;
    createdBookingIds.push(c2Booking.id);

    // 5. Create confirmed bookings for the other 7 rooms on TEST_DATE to cover all 9 rooms
    const remainingRooms = allRooms.filter(
      (r) => r.roomNumber !== 'S01' && r.roomNumber !== 'M01'
    );
    for (const room of remainingRooms) {
      const b = await prisma.booking.create({
        data: {
          bookingCode: `TEST-06-${room.roomNumber}-${Date.now()}`,
          userId: customer1Id,
          roomId: room.id,
          bookingDate: TEST_DATE,
          startSlot: 1,
          durationHours: 1,
          partySize: 2,
          channel: 'ONLINE',
          customerName: 'Customer One',
          status: 'CONFIRMED',
          slots: {
            create: [{ roomId: room.id, bookingDate: TEST_DATE, slotIndex: 1 }]
          }
        }
      });
      createdBookingIds.push(b.id);
    }

    // 6. Create booking on OTHER_DATE to verify date isolation
    const otherDateBooking = await prisma.booking.create({
      data: {
        bookingCode: `TEST-06-OTHER-${Date.now()}`,
        userId: customer1Id,
        roomId: roomS01.id,
        bookingDate: OTHER_DATE,
        startSlot: 8,
        durationHours: 1,
        partySize: 2,
        channel: 'ONLINE',
        customerName: 'Customer One',
        status: 'CONFIRMED',
        slots: {
          create: [{ roomId: roomS01.id, bookingDate: OTHER_DATE, slotIndex: 8 }]
        }
      }
    });
    otherDateBookingId = otherDateBooking.id;
    createdBookingIds.push(otherDateBooking.id);

    // 7. Create CANCELLED booking on TEST_DATE to verify non-confirmed exclusion
    const cancelledBooking = await prisma.booking.create({
      data: {
        bookingCode: `TEST-06-CANCELLED-${Date.now()}`,
        userId: customer2Id,
        roomId: roomS01.id,
        bookingDate: TEST_DATE,
        startSlot: 10,
        durationHours: 1,
        partySize: 2,
        channel: 'ONLINE',
        customerName: 'Customer Two',
        status: 'CANCELLED'
      }
    });
    cancelledBookingId = cancelledBooking.id;
    createdBookingIds.push(cancelledBooking.id);
  });

  afterAll(async () => {
    // Clean up strictly test-created records by tracked IDs
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

  // =========================================================================
  // TEST-05: Customer My Bookings Endpoint (GET /api/bookings/my, AC-05)
  // =========================================================================
  describe('TEST-05: Customer My Bookings (AC-05)', () => {
    it('customer retrieves exclusively their own active reservations', async () => {
      const res = await request(app)
        .get('/api/bookings/my')
        .set('Authorization', `Bearer ${customer1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.bookings)).toBe(true);

      // Verify that all returned bookings belong strictly to Customer 1
      const bookings = res.body.bookings;
      expect(bookings.length).toBeGreaterThanOrEqual(1);
      expect(bookings.every((b: any) => b.userId === customer1Id)).toBe(true);

      // Verify that Customer 2's booking is NOT in Customer 1's list (data isolation)
      const hasC2Booking = bookings.some((b: any) => b.id === c2BookingId);
      expect(hasC2Booking).toBe(false);

      // Verify structure includes room details and slots
      const targetBooking = bookings.find((b: any) => b.id === c1BookingId);
      expect(targetBooking).toBeDefined();
      expect(targetBooking.room).toBeDefined();
      expect(targetBooking.room.roomNumber).toBe('S01');
      expect(targetBooking.slots).toHaveLength(2);
    });

    it('rejects unauthenticated request to /api/bookings/my with HTTP 401 UNAUTHENTICATED', async () => {
      const res = await request(app).get('/api/bookings/my');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHENTICATED');
    });
  });

  // =========================================================================
  // TEST-05b: Booking Detail & Data Isolation (GET /api/bookings/:id, AC-05b, BR-07)
  // =========================================================================
  describe('TEST-05b: Booking Detail Data Isolation (AC-05b, BR-07)', () => {
    it('Customer A accessing Customer B booking returns HTTP 403 FORBIDDEN', async () => {
      // Customer 2 tries to access Customer 1's booking
      const res = await request(app)
        .get(`/api/bookings/${c1BookingId}`)
        .set('Authorization', `Bearer ${customer2Token}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe('FORBIDDEN');
      expect(res.body.error.message).toContain('not authorized');
    });

    it('booking owner accesses their own booking detail and receives HTTP 200 with complete data', async () => {
      const res = await request(app)
        .get(`/api/bookings/${c1BookingId}`)
        .set('Authorization', `Bearer ${customer1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.booking).toBeDefined();
      expect(res.body.booking.id).toBe(c1BookingId);
      expect(res.body.booking.userId).toBe(customer1Id);
      expect(res.body.booking.room).toBeDefined();
      expect(res.body.booking.room.roomNumber).toBe('S01');
      expect(res.body.booking.slots).toHaveLength(2);
    });

    it('staff user accesses any customer booking detail with HTTP 200 (Staff Override)', async () => {
      const res = await request(app)
        .get(`/api/bookings/${c1BookingId}`)
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.booking).toBeDefined();
      expect(res.body.booking.id).toBe(c1BookingId);
    });

    it('returns HTTP 404 BOOKING_NOT_FOUND for non-existent booking ID', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .get(`/api/bookings/${nonExistentId}`)
        .set('Authorization', `Bearer ${customer1Token}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('BOOKING_NOT_FOUND');
    });
  });

  // =========================================================================
  // TEST-06: Staff Master Schedule Endpoint (GET /api/bookings/master, AC-06, BR-08)
  // =========================================================================
  describe('TEST-06: Staff Master Schedule (AC-06, BR-08)', () => {
    it('staff retrieves all confirmed bookings across all nine rooms for target date and excludes other dates and non-confirmed bookings', async () => {
      const res = await request(app)
        .get(`/api/bookings/master?date=${TEST_DATE}`)
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.bookings)).toBe(true);

      const bookings = res.body.bookings;

      // 1. Verify that bookings across all 9 rooms are returned
      const representedRooms = new Set(bookings.map((b: any) => b.room.roomNumber));
      const expectedRooms = ['S01', 'S02', 'S03', 'M01', 'M02', 'M03', 'L01', 'L02', 'L03'];
      expectedRooms.forEach((roomNum) => {
        expect(representedRooms.has(roomNum)).toBe(true);
      });
      expect(representedRooms.size).toBe(9);

      // 2. Verify that bookings from another date are NOT returned
      const foundOtherDate = bookings.some((b: any) => b.id === otherDateBookingId);
      expect(foundOtherDate).toBe(false);

      // 3. Verify that non-CONFIRMED bookings (CANCELLED) are excluded
      const foundCancelled = bookings.some((b: any) => b.id === cancelledBookingId);
      expect(foundCancelled).toBe(false);

      // 4. Verify that all returned bookings strictly have status CONFIRMED and matching date
      expect(bookings.every((b: any) => b.status === 'CONFIRMED')).toBe(true);
      expect(bookings.every((b: any) => b.bookingDate === TEST_DATE)).toBe(true);
    });

    it('rejects customer role from /api/bookings/master with HTTP 403 FORBIDDEN', async () => {
      const res = await request(app)
        .get(`/api/bookings/master?date=${TEST_DATE}`)
        .set('Authorization', `Bearer ${customer1Token}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('rejects missing date query parameter with HTTP 400 INVALID_INPUT', async () => {
      const res = await request(app)
        .get('/api/bookings/master')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_INPUT');
    });

    it('rejects invalid date format with HTTP 400 INVALID_INPUT', async () => {
      const res = await request(app)
        .get('/api/bookings/master?date=not-a-date')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_INPUT');
    });

    it('rejects non-existent calendar date (2026-02-31) with HTTP 400 INVALID_INPUT', async () => {
      const res = await request(app)
        .get('/api/bookings/master?date=2026-02-31')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_INPUT');
    });
  });
});

