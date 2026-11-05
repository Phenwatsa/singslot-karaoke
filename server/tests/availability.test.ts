import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/prisma';
import { BookingStatus, BookingChannel } from '@prisma/client';

describe('Feature F-02 & F-03: Room Catalog & Server Availability Suite', () => {
  const TEST_DATE = '2026-11-10';
  const FIXTURE_BOOKING_CODE = 'TEST-FIX-SLOT3';

  beforeAll(async () => {
    // 1. Ensure test fixture cleanup before running tests
    await prisma.bookingSlot.deleteMany({
      where: { bookingDate: TEST_DATE }
    });
    await prisma.booking.deleteMany({
      where: { bookingCode: FIXTURE_BOOKING_CODE }
    });

    // 2. Fetch seeded room S01 and seeded customer
    const roomS01 = await prisma.room.findUnique({
      where: { roomNumber: 'S01' }
    });
    const customer = await prisma.user.findUnique({
      where: { email: 'customer1@singslot.local' }
    });

    if (!roomS01 || !customer) {
      throw new Error('Database prerequisite missing: S01 or customer1@singslot.local not found');
    }

    // 3. Create deterministic test booking fixture occupying S01 Slot 3 on TEST_DATE (SDS 2.4)
    const testBooking = await prisma.booking.create({
      data: {
        bookingCode: FIXTURE_BOOKING_CODE,
        userId: customer.id,
        roomId: roomS01.id,
        bookingDate: TEST_DATE,
        startSlot: 3,
        durationHours: 1,
        partySize: 2,
        channel: BookingChannel.ONLINE,
        customerName: customer.fullName,
        status: BookingStatus.CONFIRMED
      }
    });

    await prisma.bookingSlot.create({
      data: {
        bookingId: testBooking.id,
        roomId: roomS01.id,
        bookingDate: TEST_DATE,
        slotIndex: 3
      }
    });
  });

  afterAll(async () => {
    // Clean up test fixtures to preserve clean state
    await prisma.bookingSlot.deleteMany({
      where: { bookingDate: TEST_DATE }
    });
    await prisma.booking.deleteMany({
      where: { bookingCode: FIXTURE_BOOKING_CODE }
    });
    await prisma.$disconnect();
  });

  /**
   * TEST-02 (AC-02): Room catalog returns 9 rooms with capacity boundaries 4, 8, 12.
   */
  it('TEST-02: GET /api/rooms returns 9 seeded rooms across Small, Medium, Large tiers', async () => {
    const res = await request(app).get('/api/rooms');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.rooms)).toBe(true);
    expect(res.body.rooms.length).toBe(9);

    const rooms = res.body.rooms;

    // Verify presence of all 9 seeded room numbers
    const roomNumbers = rooms.map((r: any) => r.roomNumber);
    expect(roomNumbers).toEqual([
      'L01', 'L02', 'L03',
      'M01', 'M02', 'M03',
      'S01', 'S02', 'S03'
    ].sort());

    // Verify capacity tiers per SRS FR-02 (Small: 4, Medium: 8, Large: 12)
    const smallRooms = rooms.filter((r: any) => r.type === 'SMALL');
    const mediumRooms = rooms.filter((r: any) => r.type === 'MEDIUM');
    const largeRooms = rooms.filter((r: any) => r.type === 'LARGE');

    expect(smallRooms.length).toBe(3);
    smallRooms.forEach((r: any) => expect(r.capacity).toBe(4));

    expect(mediumRooms.length).toBe(3);
    mediumRooms.forEach((r: any) => expect(r.capacity).toBe(8));

    expect(largeRooms.length).toBe(3);
    largeRooms.forEach((r: any) => expect(r.capacity).toBe(12));
  });

  /**
   * TEST-03 (AC-03): Server-calculated availability accurately reflects pre-seeded slot 3 occupancy.
   */
  it('TEST-03: GET /api/availability reflects Slot 3 occupancy for room S01 on target date', async () => {
    const res = await request(app).get(`/api/availability?date=${TEST_DATE}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.date).toBe(TEST_DATE);
    expect(Array.isArray(res.body.rooms)).toBe(true);
    expect(res.body.rooms.length).toBe(9);

    // Locate room S01 in response
    const s01 = res.body.rooms.find((r: any) => r.roomNumber === 'S01');
    expect(s01).toBeDefined();
    expect(s01.slots.length).toBe(14);

    // Slot 3 must be occupied (isAvailable: false)
    const slot3 = s01.slots.find((s: any) => s.slotIndex === 3);
    expect(slot3).toBeDefined();
    expect(slot3.timeRange).toBe('13:00 - 14:00');
    expect(slot3.isAvailable).toBe(false);

    // All other 13 slots in S01 must be available (isAvailable: true)
    const otherSlots = s01.slots.filter((s: any) => s.slotIndex !== 3);
    expect(otherSlots.length).toBe(13);
    otherSlots.forEach((s: any) => {
      expect(s.isAvailable).toBe(true);
    });

    // Unbooked room (e.g. S02) must have all 14 slots available
    const s02 = res.body.rooms.find((r: any) => r.roomNumber === 'S02');
    expect(s02).toBeDefined();
    expect(s02.slots.length).toBe(14);
    s02.slots.forEach((s: any) => {
      expect(s.isAvailable).toBe(true);
    });
  });

  /**
   * BR-04: Past slot rejection / elapsed time slots are closed (isAvailable: false, isPast: true).
   */
  it('BR-04: past date queries mark slots as isAvailable: false and isPast: true', async () => {
    const res = await request(app).get('/api/availability?date=2026-01-01');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const s01 = res.body.rooms.find((r: any) => r.roomNumber === 'S01');
    expect(s01).toBeDefined();
    s01.slots.forEach((s: any) => {
      expect(s.isAvailable).toBe(false);
      expect(s.isPast).toBe(true);
    });
  });

  /**
   * Malformed Date Validation: Returns HTTP 400 INVALID_INPUT (AC-03).
   */
  it('date validation: missing date query returns HTTP 400 INVALID_INPUT', async () => {
    const res = await request(app).get('/api/availability');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('INVALID_INPUT');
  });

  it('date validation: non-date string returns HTTP 400 INVALID_INPUT', async () => {
    const res = await request(app).get('/api/availability?date=not-a-valid-date');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_INPUT');
  });

  it('date validation: non-existent calendar date (2026-02-31) returns HTTP 400 INVALID_INPUT', async () => {
    const res = await request(app).get('/api/availability?date=2026-02-31');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_INPUT');
  });
});
