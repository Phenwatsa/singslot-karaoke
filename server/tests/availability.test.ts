import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/prisma';
import { BookingStatus, BookingChannel } from '@prisma/client';

describe('Feature F-02 & F-03: Room Catalog & Server Availability Suite', () => {
  // Dynamically compute a future date string (14 days ahead) in Asia/Bangkok timezone
  const getFutureBangkokDateString = (daysAhead = 14): string => {
    const now = new Date();
    const future = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(future);
  };

  const TEST_DATE = getFutureBangkokDateString(14);
  const FIXTURE_BOOKING_CODE = 'TEST-FIX-SLOT3';

  beforeAll(async () => {
    // 1. Ensure test fixture cleanup before running tests (scoped specifically to fixture bookingCode)
    await prisma.bookingSlot.deleteMany({
      where: {
        booking: {
          bookingCode: FIXTURE_BOOKING_CODE
        }
      }
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
    // Clean up test fixtures to preserve clean state (scoped specifically to fixture bookingCode)
    await prisma.bookingSlot.deleteMany({
      where: {
        booking: {
          bookingCode: FIXTURE_BOOKING_CODE
        }
      }
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
    expect([...roomNumbers].sort()).toEqual([
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

    // Verify API returns grouped tiers matching In-Scope specification
    expect(res.body.tiers).toBeDefined();
    expect(res.body.tiers.SMALL.rooms.length).toBe(3);
    expect(res.body.tiers.SMALL.capacity).toBe(4);
    expect(res.body.tiers.MEDIUM.rooms.length).toBe(3);
    expect(res.body.tiers.MEDIUM.capacity).toBe(8);
    expect(res.body.tiers.LARGE.rooms.length).toBe(3);
    expect(res.body.tiers.LARGE.capacity).toBe(12);

    // Verify ordering by tier: S01..S03 (4 pax), M01..M03 (8 pax), L01..L03 (12 pax)
    expect(rooms.map((r: any) => r.roomNumber)).toEqual([
      'S01', 'S02', 'S03',
      'M01', 'M02', 'M03',
      'L01', 'L02', 'L03'
    ]);
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

    // AC-03: Verify that all 9 rooms contain exactly 14 slots with indices 0..13
    res.body.rooms.forEach((room: any) => {
      expect(room.slots).toHaveLength(14);
      expect(room.slots.map((s: any) => s.slotIndex)).toEqual(
        Array.from({ length: 14 }, (_, index) => index)
      );
    });

    // Locate room S01 in response
    const s01 = res.body.rooms.find((r: any) => r.roomNumber === 'S01');
    expect(s01).toBeDefined();
    expect(s01.slots.length).toBe(14);

    // Slot 3 must be occupied (isAvailable: false, isOccupied: true, isPast: false)
    const slot3 = s01.slots.find((s: any) => s.slotIndex === 3);
    expect(slot3).toBeDefined();
    expect(slot3.timeRange).toBe('13:00 - 14:00');
    expect(slot3.isAvailable).toBe(false);
    expect(slot3.isOccupied).toBe(true);
    expect(slot3.isPast).toBe(false);

    // Verify all slots on this future date are not marked as past
    s01.slots.forEach((s: any) => {
      expect(s.isPast).toBe(false);
    });

    // All other 13 slots in S01 must be unoccupied and available
    const otherSlots = s01.slots.filter((s: any) => s.slotIndex !== 3);
    expect(otherSlots.length).toBe(13);
    otherSlots.forEach((s: any) => {
      expect(s.isOccupied).toBe(false);
      expect(s.isAvailable).toBe(true);
    });

    // Unbooked room (e.g. S02) must have all 14 slots available and not in past
    const s02 = res.body.rooms.find((r: any) => r.roomNumber === 'S02');
    expect(s02).toBeDefined();
    expect(s02.slots.length).toBe(14);
    s02.slots.forEach((s: any) => {
      expect(s.isPast).toBe(false);
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
   * RoomBlock Occupancy Coverage:
   * Slot with active RoomBlock must be marked as isOccupied: true and isAvailable: false.
   */
  it('room blocks: slot with active RoomBlock is marked as occupied and unavailable', async () => {
    const BLOCK_DATE = getFutureBangkokDateString(20);
    const roomS03 = await prisma.room.findUnique({ where: { roomNumber: 'S03' } });
    expect(roomS03).not.toBeNull();

    const createdBlock = await prisma.roomBlock.create({
      data: {
        roomId: roomS03!.id,
        blockDate: BLOCK_DATE,
        slotIndex: 5,
        reason: 'Maintenance and sterilization'
      }
    });

    try {
      const res = await request(app).get(`/api/availability?date=${BLOCK_DATE}`);
      expect(res.status).toBe(200);
      const s03 = res.body.rooms.find((r: any) => r.roomNumber === 'S03');
      expect(s03).toBeDefined();

      const slot5 = s03.slots.find((s: any) => s.slotIndex === 5);
      expect(slot5).toBeDefined();
      expect(slot5.isOccupied).toBe(true);
      expect(slot5.isAvailable).toBe(false);
    } finally {
      await prisma.roomBlock.deleteMany({
        where: { id: createdBlock.id }
      });
    }
  });

  /**
   * CANCELLED Booking Coverage:
   * Slot belonging to CANCELLED booking must NOT be treated as occupied.
   */
  it('cancelled bookings: slots from CANCELLED bookings are not treated as occupied', async () => {
    const CANCEL_DATE = getFutureBangkokDateString(21);
    const roomM02 = await prisma.room.findUnique({ where: { roomNumber: 'M02' } });
    const customer = await prisma.user.findUnique({ where: { email: 'customer1@singslot.local' } });
    expect(roomM02).not.toBeNull();
    expect(customer).not.toBeNull();

    const CANCEL_CODE = 'TEST-CANCEL-SLOT4';

    const cancelledBooking = await prisma.booking.create({
      data: {
        bookingCode: CANCEL_CODE,
        userId: customer!.id,
        roomId: roomM02!.id,
        bookingDate: CANCEL_DATE,
        startSlot: 4,
        durationHours: 1,
        partySize: 4,
        customerName: customer!.fullName,
        status: BookingStatus.CANCELLED
      }
    });

    await prisma.bookingSlot.create({
      data: {
        bookingId: cancelledBooking.id,
        roomId: roomM02!.id,
        bookingDate: CANCEL_DATE,
        slotIndex: 4
      }
    });

    try {
      const res = await request(app).get(`/api/availability?date=${CANCEL_DATE}`);
      expect(res.status).toBe(200);
      const m02 = res.body.rooms.find((r: any) => r.roomNumber === 'M02');
      expect(m02).toBeDefined();

      const slot4 = m02.slots.find((s: any) => s.slotIndex === 4);
      expect(slot4).toBeDefined();
      expect(slot4.isOccupied).toBe(false);
      expect(slot4.isAvailable).toBe(true);
    } finally {
      await prisma.bookingSlot.deleteMany({
        where: { booking: { bookingCode: CANCEL_CODE } }
      });
      await prisma.booking.deleteMany({
        where: { bookingCode: CANCEL_CODE }
      });
    }
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
