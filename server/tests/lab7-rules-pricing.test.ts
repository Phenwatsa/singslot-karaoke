import { describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/prisma';

describe('Lab 7 Adaptive Maintenance: Booking Rules & Pricing Suite (Issue 2)', () => {
  const STAFF_PASSWORD = process.env.STAFF_PASSWORD || 'Pass1234!';
  const CUSTOMER_PASSWORD = process.env.CUSTOMER_PASSWORD || 'Pass1234!';

  const getFutureBangkokDate = (daysAhead: number): string => {
    const future = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(future);
  };

  const DATE_CUTOFF = getFutureBangkokDate(31);
  const DATE_PEAK = getFutureBangkokDate(32);
  const DATE_QUOTA_SEQ = getFutureBangkokDate(33);
  const DATE_QUOTA_PAR = getFutureBangkokDate(34);
  const DATE_PRICING = getFutureBangkokDate(35);

  let customer1Token: string;
  let customer2Token: string;
  let staffToken: string;
  let customer1Id: string;
  let customer2Id: string;
  let roomS01: { id: string; roomNumber: string };
  let roomS02: { id: string; roomNumber: string };
  let roomM01: { id: string; roomNumber: string };
  let roomL01: { id: string; roomNumber: string };

  const createdBookingIds: string[] = [];

  beforeAll(async () => {
    const c1Res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'customer1@singslot.local', password: CUSTOMER_PASSWORD });
    expect(c1Res.status).toBe(200);
    customer1Token = c1Res.body.token;
    customer1Id = c1Res.body.user.id;

    const c2Res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'customer2@singslot.local', password: CUSTOMER_PASSWORD });
    expect(c2Res.status).toBe(200);
    customer2Token = c2Res.body.token;
    customer2Id = c2Res.body.user.id;

    const sRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'staff@singslot.local', password: STAFF_PASSWORD });
    expect(sRes.status).toBe(200);
    staffToken = sRes.body.token;

    const s01 = await prisma.room.findUnique({ where: { roomNumber: 'S01' } });
    const s02 = await prisma.room.findUnique({ where: { roomNumber: 'S02' } });
    const m01 = await prisma.room.findUnique({ where: { roomNumber: 'M01' } });
    const l01 = await prisma.room.findUnique({ where: { roomNumber: 'L01' } });

    if (!s01 || !s02 || !m01 || !l01) {
      throw new Error('Seeded rooms S01, S02, M01, L01 must exist.');
    }

    roomS01 = s01;
    roomS02 = s02;
    roomM01 = m01;
    roomL01 = l01;

    // Clean up any leftover fixtures on dedicated test dates (e.g. from prior RED test run)
    const testDates = [DATE_CUTOFF, DATE_PEAK, DATE_QUOTA_SEQ, DATE_QUOTA_PAR, DATE_PRICING];
    await prisma.bookingSlot.deleteMany({ where: { bookingDate: { in: testDates } } });
    await prisma.booking.deleteMany({ where: { bookingDate: { in: testDates } } });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  afterAll(async () => {
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
   * TEST-02b (AC-02b, FR-02, BR-12):
   * Room catalog and availability expose tier hourlyRate (SMALL=200, MEDIUM=350, LARGE=500).
   */
  it('TEST-02b: GET /api/rooms and GET /api/availability expose tier hourlyRate', async () => {
    const roomsRes = await request(app).get('/api/rooms');
    expect(roomsRes.status).toBe(200);

    const s01Item = roomsRes.body.rooms.find((r: any) => r.roomNumber === 'S01');
    const m01Item = roomsRes.body.rooms.find((r: any) => r.roomNumber === 'M01');
    const l01Item = roomsRes.body.rooms.find((r: any) => r.roomNumber === 'L01');

    expect(s01Item.hourlyRate).toBe(200);
    expect(m01Item.hourlyRate).toBe(350);
    expect(l01Item.hourlyRate).toBe(500);
    expect(roomsRes.body.tiers.SMALL.hourlyRate).toBe(200);
    expect(roomsRes.body.tiers.MEDIUM.hourlyRate).toBe(350);
    expect(roomsRes.body.tiers.LARGE.hourlyRate).toBe(500);

    const availRes = await request(app).get(`/api/availability?date=${DATE_PRICING}`);
    expect(availRes.status).toBe(200);
    const availS01 = availRes.body.rooms.find((r: any) => r.roomNumber === 'S01');
    expect(availS01.hourlyRate).toBe(200);
  });

  /**
   * TEST-03c & TEST-04g (AC-03c, AC-04g, FR-03, FR-04, BR-04):
   * 60-minute online advance cutoff boundary:
   * - Exact 60 min remaining (13:00:00 ICT for slot 4 at 14:00) -> permitted (isWithinCutoff: false, 201).
   * - < 60 min remaining (13:00:01 ICT for slot 4 at 14:00) -> rejected (400 CANNOT_BOOK_PAST_SLOT, isWithinCutoff: true, isAvailable: false, isPast: false).
   */
  it('TEST-03c & TEST-04g: enforces 60-minute online cutoff while preserving isPast', async () => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'setTimeout', 'hrtime', 'performance'] });

    // 1. 59m59s before slot 4 (14:00+07:00) => 13:00:01+07:00
    jest.setSystemTime(new Date(`${DATE_CUTOFF}T13:00:01+07:00`));

    // Sign in under the mocked clock so JWT remains valid at +31 days
    const c1MockRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'customer1@singslot.local', password: CUSTOMER_PASSWORD });
    expect(c1MockRes.status).toBe(200);
    const mockCustomerToken = c1MockRes.body.token;

    const availWithin = await request(app).get(`/api/availability?date=${DATE_CUTOFF}`);
    expect(availWithin.status).toBe(200);
    const s01Within = availWithin.body.rooms.find((r: any) => r.roomNumber === 'S01');
    const slot4Within = s01Within.slots.find((s: any) => s.slotIndex === 4);

    expect(slot4Within.isWithinCutoff).toBe(true);
    expect(slot4Within.isAvailable).toBe(false);
    expect(slot4Within.isPast).toBe(false);

    const rejectRes = await request(app)
      .post('/api/bookings/online')
      .set('Authorization', `Bearer ${mockCustomerToken}`)
      .send({
        roomId: roomS01.id,
        bookingDate: DATE_CUTOFF,
        startSlot: 4,
        durationHours: 1,
        partySize: 2
      });
    expect(rejectRes.status).toBe(400);
    expect(rejectRes.body.error.code).toBe('CANNOT_BOOK_PAST_SLOT');

    // 2. Exact 60m00s before slot 4 (14:00+07:00) => 13:00:00+07:00
    jest.setSystemTime(new Date(`${DATE_CUTOFF}T13:00:00+07:00`));

    const availExact = await request(app).get(`/api/availability?date=${DATE_CUTOFF}`);
    expect(availExact.status).toBe(200);
    const s01Exact = availExact.body.rooms.find((r: any) => r.roomNumber === 'S01');
    const slot4Exact = s01Exact.slots.find((s: any) => s.slotIndex === 4);

    expect(slot4Exact.isWithinCutoff).toBe(false);
    expect(slot4Exact.isAvailable).toBe(true);
    expect(slot4Exact.isPast).toBe(false);

    const acceptRes = await request(app)
      .post('/api/bookings/online')
      .set('Authorization', `Bearer ${mockCustomerToken}`)
      .send({
        roomId: roomS01.id,
        bookingDate: DATE_CUTOFF,
        startSlot: 4,
        durationHours: 1,
        partySize: 2
      });
    expect(acceptRes.status).toBe(201);
    createdBookingIds.push(acceptRes.body.booking.id);
  });

  /**
   * TEST-04h (AC-04h, FR-04, BR-01):
   * Peak-Hour (18:00-22:00 ICT, slots 8..11) online duration cap:
   * - Overlapping Peak slots allows max 3 hours; 4 hours -> 400 PEAK_DURATION_EXCEEDED.
   * - Pure Off-Peak (slots 0..7) still allows 5 hours.
   */
  it('TEST-04h: caps Peak-Hour overlapping online bookings at 3 hours while allowing 5 hours Off-Peak', async () => {
    // Invalid: starts at slot 6, duration 4 (16:00-20:00, overlaps Peak slots 8 & 9)
    const partialPeakReject = await request(app)
      .post('/api/bookings/online')
      .set('Authorization', `Bearer ${customer2Token}`)
      .send({
        roomId: roomS01.id,
        bookingDate: DATE_PEAK,
        startSlot: 6,
        durationHours: 4,
        partySize: 2
      });
    expect(partialPeakReject.status).toBe(400);
    expect(partialPeakReject.body.error.code).toBe('PEAK_DURATION_EXCEEDED');

    // Invalid: starts at slot 8, duration 4 (18:00-22:00)
    const fullPeakReject = await request(app)
      .post('/api/bookings/online')
      .set('Authorization', `Bearer ${customer2Token}`)
      .send({
        roomId: roomS01.id,
        bookingDate: DATE_PEAK,
        startSlot: 8,
        durationHours: 4,
        partySize: 2
      });
    expect(fullPeakReject.status).toBe(400);
    expect(fullPeakReject.body.error.code).toBe('PEAK_DURATION_EXCEEDED');

    // Valid: starts at slot 8, duration 3 (18:00-21:00)
    const peakOk = await request(app)
      .post('/api/bookings/online')
      .set('Authorization', `Bearer ${customer2Token}`)
      .send({
        roomId: roomS01.id,
        bookingDate: DATE_PEAK,
        startSlot: 8,
        durationHours: 3,
        partySize: 2
      });
    expect(peakOk.status).toBe(201);
    createdBookingIds.push(peakOk.body.booking.id);

    // Valid: pure Off-Peak 5 hours (slots 3..7, 13:00-18:00) on another room
    const offPeakOk = await request(app)
      .post('/api/bookings/online')
      .set('Authorization', `Bearer ${customer1Token}`)
      .send({
        roomId: roomM01.id,
        bookingDate: DATE_PEAK,
        startSlot: 3,
        durationHours: 5,
        partySize: 4
      });
    expect(offPeakOk.status).toBe(201);
    createdBookingIds.push(offPeakOk.body.booking.id);
  });

  /**
   * TEST-04i (AC-04i, FR-04, BR-06, BR-11):
   * Daily customer 6-hour quota across all rooms:
   * - 3h + 3h = 6h permitted; +1h (= 7h) rejected with 409 DAILY_QUOTA_EXCEEDED.
   * - CANCELLED bookings are excluded from quota.
   * - Parallel multi-room 4h + 4h requests by same customer yield strictly one 201 and one 409 DAILY_QUOTA_EXCEEDED.
   */
  it('TEST-04i: enforces 6-hour daily customer quota sequentially, excludes CANCELLED, and serializes parallel multi-room bookings', async () => {
    // Seed a 4h CANCELLED booking for customer1 on DATE_QUOTA_SEQ (must NOT count toward 6h quota)
    const cancelledBooking = await prisma.booking.create({
      data: {
        bookingCode: `BK-CAN-${Date.now()}`,
        userId: customer1Id,
        roomId: roomL01.id,
        bookingDate: DATE_QUOTA_SEQ,
        startSlot: 0,
        durationHours: 4,
        partySize: 4,
        channel: 'ONLINE',
        customerName: 'Customer One',
        status: 'CANCELLED'
      }
    });
    createdBookingIds.push(cancelledBooking.id);

    // 1. First 3h booking on S01 -> 201 (total = 3h)
    const first3h = await request(app)
      .post('/api/bookings/online')
      .set('Authorization', `Bearer ${customer1Token}`)
      .send({
        roomId: roomS01.id,
        bookingDate: DATE_QUOTA_SEQ,
        startSlot: 0,
        durationHours: 3,
        partySize: 2
      });
    expect(first3h.status).toBe(201);
    createdBookingIds.push(first3h.body.booking.id);

    // 2. Second 3h booking on S02 -> 201 (total = 6h, exact boundary)
    const second3h = await request(app)
      .post('/api/bookings/online')
      .set('Authorization', `Bearer ${customer1Token}`)
      .send({
        roomId: roomS02.id,
        bookingDate: DATE_QUOTA_SEQ,
        startSlot: 0,
        durationHours: 3,
        partySize: 2
      });
    expect(second3h.status).toBe(201);
    createdBookingIds.push(second3h.body.booking.id);

    // 3. Additional 1h booking on M01 -> 409 DAILY_QUOTA_EXCEEDED (6 + 1 = 7 > 6)
    const seventhHour = await request(app)
      .post('/api/bookings/online')
      .set('Authorization', `Bearer ${customer1Token}`)
      .send({
        roomId: roomM01.id,
        bookingDate: DATE_QUOTA_SEQ,
        startSlot: 4,
        durationHours: 1,
        partySize: 2
      });
    expect(seventhHour.status).toBe(409);
    expect(seventhHour.body.error.code).toBe('DAILY_QUOTA_EXCEEDED');

    // 4. Parallel multi-room 4h + 4h race by customer2 on DATE_QUOTA_PAR
    const [raceA, raceB] = await Promise.all([
      request(app)
        .post('/api/bookings/online')
        .set('Authorization', `Bearer ${customer2Token}`)
        .send({
          roomId: roomS01.id,
          bookingDate: DATE_QUOTA_PAR,
          startSlot: 0,
          durationHours: 4,
          partySize: 2
        }),
      request(app)
        .post('/api/bookings/online')
        .set('Authorization', `Bearer ${customer2Token}`)
        .send({
          roomId: roomS02.id,
          bookingDate: DATE_QUOTA_PAR,
          startSlot: 0,
          durationHours: 4,
          partySize: 2
        })
    ]);

    const statuses = [raceA.status, raceB.status].sort();
    expect(statuses).toEqual([201, 409]);

    const rejected = raceA.status === 409 ? raceA : raceB;
    const accepted = raceA.status === 201 ? raceA : raceB;
    expect(rejected.body.error.code).toBe('DAILY_QUOTA_EXCEEDED');
    createdBookingIds.push(accepted.body.booking.id);

    // Ensure customer2Id only has 4h confirmed on DATE_QUOTA_PAR
    const persisted = await prisma.booking.findMany({
      where: { userId: customer2Id, bookingDate: DATE_QUOTA_PAR, status: 'CONFIRMED' }
    });
    expect(persisted).toHaveLength(1);
  });

  /**
   * TEST-04j (AC-04j, FR-04, FR-05, FR-06, BR-12):
   * Server calculates totalPrice = hourlyRate * durationHours, ignores forged client prices,
   * and exposes totalPrice across create, my bookings, booking detail, and master schedule.
   */
  it('TEST-04j: computes authoritative totalPrice across endpoints and ignores client-forged price', async () => {
    const createRes = await request(app)
      .post('/api/bookings/online')
      .set('Authorization', `Bearer ${customer1Token}`)
      .send({
        roomId: roomM01.id,
        bookingDate: DATE_PRICING,
        startSlot: 0,
        durationHours: 3,
        partySize: 4,
        totalPrice: 1,
        hourlyRate: 0
      });
    expect(createRes.status).toBe(201);
    const bookingId = createRes.body.booking.id;
    createdBookingIds.push(bookingId);

    // M01 is MEDIUM (350 THB/hr) * 3 hrs = 1050 THB
    expect(createRes.body.booking.totalPrice).toBe(1050);

    const myRes = await request(app)
      .get('/api/bookings/my')
      .set('Authorization', `Bearer ${customer1Token}`);
    expect(myRes.status).toBe(200);
    const myItem = myRes.body.bookings.find((b: any) => b.id === bookingId);
    expect(myItem.totalPrice).toBe(1050);
    expect(myItem.room.hourlyRate).toBe(350);

    const detailRes = await request(app)
      .get(`/api/bookings/${bookingId}`)
      .set('Authorization', `Bearer ${customer1Token}`);
    expect(detailRes.status).toBe(200);
    expect(detailRes.body.booking.totalPrice).toBe(1050);
    expect(detailRes.body.booking.room.hourlyRate).toBe(350);

    const masterRes = await request(app)
      .get(`/api/bookings/master?date=${DATE_PRICING}`)
      .set('Authorization', `Bearer ${staffToken}`);
    expect(masterRes.status).toBe(200);
    const masterItem = masterRes.body.bookings.find((b: any) => b.id === bookingId);
    expect(masterItem.totalPrice).toBe(1050);
    expect(masterItem.room.hourlyRate).toBe(350);
  });
});
