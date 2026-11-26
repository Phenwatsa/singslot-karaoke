import { describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/prisma';

describe('Sprint 2 Operations Increment: F-07 Walk-in, F-08 Cancel/Reschedule, F-09 RoomBlock, F-10 Search & NFR-04', () => {
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

  // Dedicated non-overlapping test dates (Sprint 1 uses +1..20, Lab 7 uses +31..35)
  const DATE_WALKIN = getFutureBangkokDate(41);
  const DATE_BLOCK = getFutureBangkokDate(42);
  const DATE_CANCEL = getFutureBangkokDate(43);
  const DATE_RESCHEDULE = getFutureBangkokDate(44);
  const DATE_SEARCH_A = getFutureBangkokDate(45);
  const DATE_SEARCH_B = getFutureBangkokDate(46);
  const DATE_PERF = getFutureBangkokDate(47);
  const ALL_TEST_DATES = [
    DATE_WALKIN,
    DATE_BLOCK,
    DATE_CANCEL,
    DATE_RESCHEDULE,
    DATE_SEARCH_A,
    DATE_SEARCH_B,
    DATE_PERF
  ];

  let staffToken: string;
  let customer1Token: string;
  let customer2Token: string;
  let staffUserId: string;
  let customer1Id: string;

  let allRooms: Array<{ id: string; roomNumber: string; type: string; capacity: number; hourlyRate: number }> = [];
  let roomS01: { id: string; roomNumber: string; hourlyRate: number };
  let roomS02: { id: string; roomNumber: string; hourlyRate: number };
  let roomM01: { id: string; roomNumber: string; hourlyRate: number };
  let roomL01: { id: string; roomNumber: string; hourlyRate: number };

  const loginAs = async (email: string, password: string): Promise<{ token: string; userId: string }> => {
    const res = await request(app).post('/api/auth/login').send({ email, password });
    expect(res.status).toBe(200);
    return { token: res.body.token, userId: res.body.user.id };
  };

  const cleanupTestDates = async () => {
    await prisma.bookingSlot.deleteMany({ where: { bookingDate: { in: ALL_TEST_DATES } } });
    await prisma.booking.deleteMany({ where: { bookingDate: { in: ALL_TEST_DATES } } });
    await prisma.roomBlock.deleteMany({ where: { blockDate: { in: ALL_TEST_DATES } } });
  };

  beforeAll(async () => {
    const staff = await loginAs('staff@singslot.local', STAFF_PASSWORD);
    staffToken = staff.token;
    staffUserId = staff.userId;

    const c1 = await loginAs('customer1@singslot.local', CUSTOMER_PASSWORD);
    customer1Token = c1.token;
    customer1Id = c1.userId;

    const c2 = await loginAs('customer2@singslot.local', CUSTOMER_PASSWORD);
    customer2Token = c2.token;

    allRooms = await prisma.room.findMany({
      where: { isActive: true },
      orderBy: { roomNumber: 'asc' },
      select: { id: true, roomNumber: true, type: true, capacity: true, hourlyRate: true }
    });

    const findRoom = (num: string) => {
      const r = allRooms.find((rm) => rm.roomNumber === num);
      if (!r) throw new Error(`Seeded room ${num} not found`);
      return r;
    };

    roomS01 = findRoom('S01');
    roomS02 = findRoom('S02');
    roomM01 = findRoom('M01');
    roomL01 = findRoom('L01');

    await cleanupTestDates();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  afterAll(async () => {
    await cleanupTestDates();
  });

  // =========================================================================
  // TEST-07: Staff Walk-in Booking Counter (F-07, AC-07, FR-07, BR-08, BR-12)
  // =========================================================================
  describe('TEST-07: Staff Walk-in Booking Counter (F-07, AC-07)', () => {
    it('allows STAFF walk-in <60m before start, 4h Peak-Hour, even with >=6h existing daily hours, computes totalPrice, and denies CUSTOMER with 403', async () => {
      jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'setTimeout', 'hrtime', 'performance'] });

      // Mock clock to 17:30 ICT (30 minutes before slot 8 = 18:00 ICT -> inside 60m online cutoff, but NOT past!)
      jest.setSystemTime(new Date(`${DATE_WALKIN}T17:30:00+07:00`));
      const mockStaff = await loginAs('staff@singslot.local', STAFF_PASSWORD);
      const mockCust = await loginAs('customer1@singslot.local', CUSTOMER_PASSWORD);

      // Pre-seed 6 CONFIRMED walk-in hours under the same Staff user on DATE_WALKIN (exceeding online BR-11 6h cap)
      await prisma.booking.create({
        data: {
          bookingCode: `BK-WI-PRE1-${Date.now().toString(36).slice(-4).toUpperCase()}`,
          userId: staffUserId,
          roomId: roomS01.id,
          bookingDate: DATE_WALKIN,
          startSlot: 0,
          durationHours: 4,
          partySize: 2,
          totalPrice: roomS01.hourlyRate * 4,
          channel: 'WALK_IN',
          customerName: 'Earlier Walk-in 1',
          customerPhone: '0810000001',
          status: 'CONFIRMED',
          slots: {
            create: [0, 1, 2, 3].map((slotIndex) => ({
              roomId: roomS01.id,
              bookingDate: DATE_WALKIN,
              slotIndex
            }))
          }
        }
      });

      await prisma.booking.create({
        data: {
          bookingCode: `BK-WI-PRE2-${Date.now().toString(36).slice(-4).toUpperCase()}`,
          userId: staffUserId,
          roomId: roomS02.id,
          bookingDate: DATE_WALKIN,
          startSlot: 0,
          durationHours: 2,
          partySize: 2,
          totalPrice: roomS02.hourlyRate * 2,
          channel: 'WALK_IN',
          customerName: 'Earlier Walk-in 2',
          customerPhone: '0810000002',
          status: 'CONFIRMED',
          slots: {
            create: [0, 1].map((slotIndex) => ({
              roomId: roomS02.id,
              bookingDate: DATE_WALKIN,
              slotIndex
            }))
          }
        }
      });

      // 1. CUSTOMER must receive 403 FORBIDDEN
      const custRes = await request(app)
        .post('/api/bookings/walk-in')
        .set('Authorization', `Bearer ${mockCust.token}`)
        .send({
          roomId: roomM01.id,
          bookingDate: DATE_WALKIN,
          startSlot: 8,
          durationHours: 4,
          partySize: 6,
          customerName: 'Unauthorized Guest',
          customerPhone: '0812345678'
        });
      expect(custRes.status).toBe(403);
      expect(custRes.body.error.code).toBe('FORBIDDEN');

      // 2. STAFF succeeds with 4h Peak-Hour (18:00-22:00), <60m lead time, and >6h daily total
      const staffRes = await request(app)
        .post('/api/bookings/walk-in')
        .set('Authorization', `Bearer ${mockStaff.token}`)
        .send({
          roomId: roomM01.id,
          bookingDate: DATE_WALKIN,
          startSlot: 8,
          durationHours: 4,
          partySize: 6,
          customerName: 'Walk-in Guest',
          customerPhone: '0812345678'
        });

      expect(staffRes.status).toBe(201);
      expect(staffRes.body.success).toBe(true);
      expect(staffRes.body.booking.channel).toBe('WALK_IN');
      expect(staffRes.body.booking.roomNumber).toBe('M01');
      expect(staffRes.body.booking.timeRange).toBe('18:00 - 22:00');
      expect(staffRes.body.booking.totalPrice).toBe(roomM01.hourlyRate * 4); // 350 * 4 = 1400
      expect(staffRes.body.booking.status).toBe('CONFIRMED');

      // 3. Past slot (slot 7 = 17:00 already started at 17:30) MUST be rejected with 400 CANNOT_BOOK_PAST_SLOT
      const pastRes = await request(app)
        .post('/api/bookings/walk-in')
        .set('Authorization', `Bearer ${mockStaff.token}`)
        .send({
          roomId: roomL01.id,
          bookingDate: DATE_WALKIN,
          startSlot: 7,
          durationHours: 1,
          partySize: 4,
          customerName: 'Past Walk-in'
        });
      expect(pastRes.status).toBe(400);
      expect(pastRes.body.error.code).toBe('CANNOT_BOOK_PAST_SLOT');

      // 4. Missing customerName returns 400 INVALID_INPUT
      const missingNameRes = await request(app)
        .post('/api/bookings/walk-in')
        .set('Authorization', `Bearer ${mockStaff.token}`)
        .send({
          roomId: roomL01.id,
          bookingDate: DATE_WALKIN,
          startSlot: 8,
          durationHours: 2,
          partySize: 4
        });
      expect(missingNameRes.status).toBe(400);
      expect(missingNameRes.body.error.code).toBe('INVALID_INPUT');
    });
  });

  // =========================================================================
  // TEST-08 & TEST-08b: Staff Room Maintenance & Blockout (F-09, BR-10 TDD)
  // =========================================================================
  describe('TEST-08 & TEST-08b: Staff Slot Maintenance & Blockout (F-09, AC-08, AC-08b, BR-10)', () => {
    it('TEST-08: STAFF creates, lists, and deletes RoomBlock updating /api/availability; CUSTOMER gets 403', async () => {
      // CUSTOMER rejected on GET and POST /api/room-blocks with 403 FORBIDDEN
      const custGet = await request(app)
        .get(`/api/room-blocks?date=${DATE_BLOCK}`)
        .set('Authorization', `Bearer ${customer1Token}`);
      expect(custGet.status).toBe(403);
      expect(custGet.body.error.code).toBe('FORBIDDEN');

      const custPost = await request(app)
        .post('/api/room-blocks')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({ roomId: roomS01.id, blockDate: DATE_BLOCK, slotIndex: 4, reason: 'Unauthorized' });
      expect(custPost.status).toBe(403);
      expect(custPost.body.error.code).toBe('FORBIDDEN');

      // STAFF creates RoomBlock on open S01 Slot 4
      const createRes = await request(app)
        .post('/api/room-blocks')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ roomId: roomS01.id, blockDate: DATE_BLOCK, slotIndex: 4, reason: 'Speaker maintenance' });

      expect(createRes.status).toBe(201);
      expect(createRes.body.success).toBe(true);
      expect(createRes.body.blocks).toHaveLength(1);
      const blockId = createRes.body.blocks[0].id;

      // CUSTOMER rejected on DELETE /api/room-blocks/:id with 403 FORBIDDEN (block remains intact)
      const custDel = await request(app)
        .delete(`/api/room-blocks/${blockId}`)
        .set('Authorization', `Bearer ${customer1Token}`);
      expect(custDel.status).toBe(403);
      expect(custDel.body.error.code).toBe('FORBIDDEN');

      // Duplicate block returns 409 BLOCK_ALREADY_EXISTS
      const dupRes = await request(app)
        .post('/api/room-blocks')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ roomId: roomS01.id, blockDate: DATE_BLOCK, slotIndex: 4, reason: 'Duplicate' });
      expect(dupRes.status).toBe(409);
      expect(dupRes.body.error.code).toBe('BLOCK_ALREADY_EXISTS');

      // GET /api/room-blocks?date=... lists the block
      const listRes = await request(app)
        .get(`/api/room-blocks?date=${DATE_BLOCK}`)
        .set('Authorization', `Bearer ${staffToken}`);
      expect(listRes.status).toBe(200);
      expect(listRes.body.blocks.some((b: any) => b.id === blockId)).toBe(true);

      // GET /api/availability shows S01 Slot 4 unavailable
      const availBlocked = await request(app).get(`/api/availability?date=${DATE_BLOCK}`);
      expect(availBlocked.status).toBe(200);
      const s01Blocked = availBlocked.body.rooms.find((r: any) => r.roomNumber === 'S01');
      expect(s01Blocked.slots.find((s: any) => s.slotIndex === 4).isAvailable).toBe(false);

      // DELETE /api/room-blocks/:id restores availability
      const delRes = await request(app)
        .delete(`/api/room-blocks/${blockId}`)
        .set('Authorization', `Bearer ${staffToken}`);
      expect(delRes.status).toBe(200);
      expect(delRes.body.success).toBe(true);
      expect(delRes.body.deletedId).toBe(blockId);

      const availRestored = await request(app).get(`/api/availability?date=${DATE_BLOCK}`);
      const s01Restored = availRestored.body.rooms.find((r: any) => r.roomNumber === 'S01');
      expect(s01Restored.slots.find((s: any) => s.slotIndex === 4).isAvailable).toBe(true);

      // Deleting non-existent block returns 404 NOT_FOUND
      const delMissing = await request(app)
        .delete(`/api/room-blocks/${blockId}`)
        .set('Authorization', `Bearer ${staffToken}`);
      expect(delMissing.status).toBe(404);
      expect(delMissing.body.error.code).toBe('NOT_FOUND');
    });

    it('TEST-08b (BR-10 TDD): rejects RoomBlock overlapping a CONFIRMED booking with 409 BLOCK_CONFLICT and persists 0 blocks atomically', async () => {
      // Seed CONFIRMED booking on S01 Slot 2
      const bkRes = await request(app)
        .post('/api/bookings/online')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          roomId: roomS01.id,
          bookingDate: DATE_BLOCK,
          startSlot: 2,
          durationHours: 1,
          partySize: 2
        });
      expect(bkRes.status).toBe(201);

      // Single slot conflict on Slot 2 -> 409 BLOCK_CONFLICT
      const singleConflict = await request(app)
        .post('/api/room-blocks')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ roomId: roomS01.id, blockDate: DATE_BLOCK, slotIndex: 2, reason: 'Conflict test' });
      expect(singleConflict.status).toBe(409);
      expect(singleConflict.body.error.code).toBe('BLOCK_CONFLICT');

      // Multi-slot atomic check [1, 2]: Slot 1 is open, Slot 2 is booked -> entire request rejected, 0 blocks created
      const multiConflict = await request(app)
        .post('/api/room-blocks')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ roomId: roomS01.id, blockDate: DATE_BLOCK, slotIndices: [1, 2], reason: 'Atomic test' });
      expect(multiConflict.status).toBe(409);
      expect(multiConflict.body.error.code).toBe('BLOCK_CONFLICT');

      const blocksOnDate = await prisma.roomBlock.findMany({
        where: { roomId: roomS01.id, blockDate: DATE_BLOCK, slotIndex: { in: [1, 2] } }
      });
      expect(blocksOnDate).toHaveLength(0);
    });
  });

  // =========================================================================
  // TEST-09 & TEST-09a: Booking Cancellation & BR-09 24-Hour Policy (TDD)
  // =========================================================================
  describe('TEST-09 & TEST-09a: Booking Cancellation & BR-09 24h Advance Rule (F-08, AC-09, AC-09a)', () => {
    it('TEST-09: rejects cross-customer cancel (403), allows owner cancel >=24h releasing slots & restoring quota, and rejects duplicate cancel (409)', async () => {
      const createRes = await request(app)
        .post('/api/bookings/online')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          roomId: roomS01.id,
          bookingDate: DATE_CANCEL,
          startSlot: 2,
          durationHours: 3,
          partySize: 2
        });
      expect(createRes.status).toBe(201);
      const bookingId = createRes.body.booking.id;

      // Cross-customer cancel rejected with 403 FORBIDDEN
      const otherCancel = await request(app)
        .patch(`/api/bookings/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${customer2Token}`);
      expect(otherCancel.status).toBe(403);
      expect(otherCancel.body.error.code).toBe('FORBIDDEN');

      // Owner cancels >= 24h in advance -> 200 OK, status = CANCELLED, BookingSlot rows deleted
      const ownerCancel = await request(app)
        .patch(`/api/bookings/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${customer1Token}`);
      expect(ownerCancel.status).toBe(200);
      expect(ownerCancel.body.success).toBe(true);
      expect(ownerCancel.body.booking.status).toBe('CANCELLED');

      const remainingSlots = await prisma.bookingSlot.findMany({ where: { bookingId } });
      expect(remainingSlots).toHaveLength(0);

      // Slots are immediately available again
      const availRes = await request(app).get(`/api/availability?date=${DATE_CANCEL}`);
      const s01 = availRes.body.rooms.find((r: any) => r.roomNumber === 'S01');
      expect(s01.slots.find((s: any) => s.slotIndex === 2).isAvailable).toBe(true);

      // Re-cancelling an already cancelled booking returns 409 BOOKING_ALREADY_CANCELLED
      const secondCancel = await request(app)
        .patch(`/api/bookings/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${customer1Token}`);
      expect(secondCancel.status).toBe(409);
      expect(secondCancel.body.error.code).toBe('BOOKING_ALREADY_CANCELLED');
    });

    it('TEST-09a (BR-09 TDD): rejects cancel and reschedule <24h before start with 400 CANCELLATION_WINDOW_EXPIRED, and permits exact 24h boundary', async () => {
      // Create booking on DATE_CANCEL at Slot 4 (14:00 ICT)
      const createRes = await request(app)
        .post('/api/bookings/online')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          roomId: roomS02.id,
          bookingDate: DATE_CANCEL,
          startSlot: 4,
          durationHours: 2,
          partySize: 2
        });
      expect(createRes.status).toBe(201);
      const bookingId = createRes.body.booking.id;

      // Compute exact 24h before DATE_CANCEL 14:00+07:00
      const slotStartMs = new Date(`${DATE_CANCEL}T14:00:00+07:00`).getTime();
      const exact24hBeforeMs = slotStartMs - 24 * 60 * 60 * 1000;

      jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'setTimeout', 'hrtime', 'performance'] });

      // 1. 23h 59m 59s remaining (1 second inside the 24h lockout window) -> REJECTED
      jest.setSystemTime(new Date(exact24hBeforeMs + 1000));
      const mockCust1 = await loginAs('customer1@singslot.local', CUSTOMER_PASSWORD);

      const cancelLate = await request(app)
        .patch(`/api/bookings/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${mockCust1.token}`);
      expect(cancelLate.status).toBe(400);
      expect(cancelLate.body.error.code).toBe('CANCELLATION_WINDOW_EXPIRED');

      const rescheduleLate = await request(app)
        .patch(`/api/bookings/${bookingId}/reschedule`)
        .set('Authorization', `Bearer ${mockCust1.token}`)
        .send({
          roomId: roomM01.id,
          bookingDate: DATE_CANCEL,
          startSlot: 0,
          durationHours: 2
        });
      expect(rescheduleLate.status).toBe(400);
      expect(rescheduleLate.body.error.code).toBe('CANCELLATION_WINDOW_EXPIRED');

      // Booking must still be CONFIRMED with its 2 slots intact
      const dbBooking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { slots: true }
      });
      expect(dbBooking?.status).toBe('CONFIRMED');
      expect(dbBooking?.slots).toHaveLength(2);

      // 2. Exact 24h 00m 00s remaining -> PERMITTED
      jest.setSystemTime(new Date(exact24hBeforeMs));
      const mockCustBoundary = await loginAs('customer1@singslot.local', CUSTOMER_PASSWORD);
      const cancelExact = await request(app)
        .patch(`/api/bookings/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${mockCustBoundary.token}`);
      expect(cancelExact.status).toBe(200);
      expect(cancelExact.body.booking.status).toBe('CANCELLED');
    });
  });

  // =========================================================================
  // TEST-10: Booking Rescheduling & BR-11 Self-Exclusion + BR-12 Pricing
  // =========================================================================
  describe('TEST-10: Booking Rescheduling (F-08, AC-10, BR-09, BR-11, BR-12)', () => {
    it('moves 4h booking to M01 on same date while holding 6h total (excluding targetBookingId from BR-11), swaps slots atomically, and recalculates totalPrice', async () => {
      // Customer 1 holds Booking #1 (4h S01 Off-Peak, slots 0..3) + Booking #2 (2h S02 Off-Peak, slots 0..1) => 6h total
      const b1 = await request(app)
        .post('/api/bookings/online')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          roomId: roomS01.id,
          bookingDate: DATE_RESCHEDULE,
          startSlot: 0,
          durationHours: 4,
          partySize: 3
        });
      expect(b1.status).toBe(201);
      const booking1Id = b1.body.booking.id;

      const b2 = await request(app)
        .post('/api/bookings/online')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          roomId: roomS02.id,
          bookingDate: DATE_RESCHEDULE,
          startSlot: 0,
          durationHours: 2,
          partySize: 2
        });
      expect(b2.status).toBe(201);

      // Cross-customer reschedule rejected with 403 FORBIDDEN
      const otherResched = await request(app)
        .patch(`/api/bookings/${booking1Id}/reschedule`)
        .set('Authorization', `Bearer ${customer2Token}`)
        .send({
          roomId: roomM01.id,
          bookingDate: DATE_RESCHEDULE,
          startSlot: 2,
          durationHours: 4
        });
      expect(otherResched.status).toBe(403);
      expect(otherResched.body.error.code).toBe('FORBIDDEN');

      // Online Peak-Hour >3h rejected with 400 PEAK_DURATION_EXCEEDED
      const peakResched = await request(app)
        .patch(`/api/bookings/${booking1Id}/reschedule`)
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          roomId: roomM01.id,
          bookingDate: DATE_RESCHEDULE,
          startSlot: 8,
          durationHours: 4
        });
      expect(peakResched.status).toBe(400);
      expect(peakResched.body.error.code).toBe('PEAK_DURATION_EXCEEDED');

      // Exceeding 6h daily quota (2h existing + 5h new = 7h > 6h) rejected with 409 DAILY_QUOTA_EXCEEDED
      const quotaResched = await request(app)
        .patch(`/api/bookings/${booking1Id}/reschedule`)
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          roomId: roomM01.id,
          bookingDate: DATE_RESCHEDULE,
          startSlot: 0,
          durationHours: 5
        });
      expect(quotaResched.status).toBe(409);
      expect(quotaResched.body.error.code).toBe('DAILY_QUOTA_EXCEEDED');

      // Valid reschedule: move Booking #1 (4h) to M01 (slots 2..5 Off-Peak) -> 2 + 4 = 6 <= 6 (targetBookingId excluded)
      const okResched = await request(app)
        .patch(`/api/bookings/${booking1Id}/reschedule`)
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          roomId: roomM01.id,
          bookingDate: DATE_RESCHEDULE,
          startSlot: 2,
          durationHours: 4
        });

      expect(okResched.status).toBe(200);
      expect(okResched.body.success).toBe(true);
      expect(okResched.body.booking.roomNumber).toBe('M01');
      expect(okResched.body.booking.timeRange).toBe('12:00 - 16:00');
      expect(okResched.body.booking.totalPrice).toBe(roomM01.hourlyRate * 4); // 350 * 4 = 1400

      // Verify old S01 slots freed and new M01 slots persisted atomically
      const oldS01Slots = await prisma.bookingSlot.findMany({
        where: { roomId: roomS01.id, bookingDate: DATE_RESCHEDULE }
      });
      expect(oldS01Slots).toHaveLength(0);

      const newM01Slots = await prisma.bookingSlot.findMany({
        where: { bookingId: booking1Id },
        orderBy: { slotIndex: 'asc' }
      });
      expect(newM01Slots.map((s) => s.slotIndex)).toEqual([2, 3, 4, 5]);
    });
  });

  // =========================================================================
  // TEST-11: Booking Search & Multi-Criteria Filtering (F-10, AC-11, BR-08)
  // =========================================================================
  describe('TEST-11: Staff Master Schedule Search & Multi-Criteria Filtering (F-10, AC-11)', () => {
    it('filters by phone, dateRange, roomType, status, defaults to today when empty, rejects invalid combinations, and denies CUSTOMER (403)', async () => {
      // Seed 3 distinct bookings across DATE_SEARCH_A & DATE_SEARCH_B
      await prisma.booking.create({
        data: {
          bookingCode: `BK-SRCH-1-${Date.now().toString(36).slice(-4).toUpperCase()}`,
          userId: staffUserId,
          roomId: roomM01.id,
          bookingDate: DATE_SEARCH_A,
          startSlot: 2,
          durationHours: 2,
          partySize: 5,
          totalPrice: roomM01.hourlyRate * 2,
          channel: 'WALK_IN',
          customerName: 'Search Match One',
          customerPhone: '089-777-1234',
          status: 'CONFIRMED',
          slots: {
            create: [2, 3].map((slotIndex) => ({
              roomId: roomM01.id,
              bookingDate: DATE_SEARCH_A,
              slotIndex
            }))
          }
        }
      });

      await prisma.booking.create({
        data: {
          bookingCode: `BK-SRCH-2-${Date.now().toString(36).slice(-4).toUpperCase()}`,
          userId: customer1Id,
          roomId: roomL01.id,
          bookingDate: DATE_SEARCH_B,
          startSlot: 5,
          durationHours: 1,
          partySize: 8,
          totalPrice: roomL01.hourlyRate,
          channel: 'ONLINE',
          customerName: 'Search Cancelled',
          customerPhone: '089-777-9999',
          status: 'CANCELLED'
        }
      });

      // 1. CUSTOMER denied with 403
      const custRes = await request(app)
        .get(`/api/bookings/master?startDate=${DATE_SEARCH_A}&endDate=${DATE_SEARCH_B}`)
        .set('Authorization', `Bearer ${customer1Token}`);
      expect(custRes.status).toBe(403);
      expect(custRes.body.error.code).toBe('FORBIDDEN');

      // 2. Multi-criteria filter: startDate..endDate + phone + roomType + status=CONFIRMED
      const filteredRes = await request(app)
        .get(
          `/api/bookings/master?startDate=${DATE_SEARCH_A}&endDate=${DATE_SEARCH_B}&phone=777-1234&roomType=MEDIUM&status=CONFIRMED`
        )
        .set('Authorization', `Bearer ${staffToken}`);
      expect(filteredRes.status).toBe(200);
      expect(filteredRes.body.success).toBe(true);
      expect(filteredRes.body.bookings).toHaveLength(1);
      expect(filteredRes.body.bookings[0].roomNumber).toBe('M01');
      expect(filteredRes.body.bookings[0].roomType).toBe('MEDIUM');
      expect(filteredRes.body.bookings[0].totalPrice).toBe(roomM01.hourlyRate * 2);

      // 3. Filter status=CANCELLED across range returns the cancelled booking
      const cancelledRes = await request(app)
        .get(
          `/api/bookings/master?startDate=${DATE_SEARCH_A}&endDate=${DATE_SEARCH_B}&phone=777&status=CANCELLED`
        )
        .set('Authorization', `Bearer ${staffToken}`);
      expect(cancelledRes.status).toBe(200);
      expect(cancelledRes.body.bookings).toHaveLength(1);
      expect(cancelledRes.body.bookings[0].status).toBe('CANCELLED');

      // 4. Default (no query params) returns 200 OK for today's Bangkok date
      const defaultRes = await request(app)
        .get('/api/bookings/master')
        .set('Authorization', `Bearer ${staffToken}`);
      expect(defaultRes.status).toBe(200);
      expect(defaultRes.body.success).toBe(true);
      expect(Array.isArray(defaultRes.body.bookings)).toBe(true);

      // 5. Mutually exclusive date + startDate returns 400 INVALID_INPUT
      const conflictParams = await request(app)
        .get(`/api/bookings/master?date=${DATE_SEARCH_A}&startDate=${DATE_SEARCH_A}`)
        .set('Authorization', `Bearer ${staffToken}`);
      expect(conflictParams.status).toBe(400);
      expect(conflictParams.body.error.code).toBe('INVALID_INPUT');

      // 6. startDate > endDate returns 400 INVALID_INPUT
      const invertedRange = await request(app)
        .get(`/api/bookings/master?startDate=${DATE_SEARCH_B}&endDate=${DATE_SEARCH_A}`)
        .set('Authorization', `Bearer ${staffToken}`);
      expect(invertedRange.status).toBe(400);
      expect(invertedRange.body.error.code).toBe('INVALID_INPUT');

      // 7. Invalid status returns 400 INVALID_INPUT
      const badStatus = await request(app)
        .get(`/api/bookings/master?date=${DATE_SEARCH_A}&status=PENDING`)
        .set('Authorization', `Bearer ${staffToken}`);
      expect(badStatus.status).toBe(400);
      expect(badStatus.body.error.code).toBe('INVALID_INPUT');
    });
  });

  // =========================================================================
  // TEST-03b: Availability Query Latency Benchmark (NFR-04, AC-03b)
  // =========================================================================
  describe('TEST-03b: Availability Query Latency < 200 ms with >= 50 Bookings (NFR-04, AC-03b)', () => {
    it('responds in < 200 ms on GET /api/availability with 54 pre-existing bookings across all 9 rooms', async () => {
      // Insert 54 confirmed 1-hour bookings (6 per room x 9 rooms) on DATE_PERF
      const bookingPromises: Array<Promise<any>> = [];
      let seq = 0;
      for (const rm of allRooms) {
        for (let slot = 0; slot < 6; slot++) {
          seq += 1;
          bookingPromises.push(
            prisma.booking.create({
              data: {
                bookingCode: `BK-PERF-${String(seq).padStart(3, '0')}-${Date.now().toString(36).slice(-3).toUpperCase()}`,
                userId: staffUserId,
                roomId: rm.id,
                bookingDate: DATE_PERF,
                startSlot: slot,
                durationHours: 1,
                partySize: 2,
                totalPrice: rm.hourlyRate,
                channel: 'WALK_IN',
                customerName: `Perf Guest ${seq}`,
                status: 'CONFIRMED',
                slots: {
                  create: [{ roomId: rm.id, bookingDate: DATE_PERF, slotIndex: slot }]
                }
              }
            })
          );
        }
      }
      await Promise.all(bookingPromises);

      const seededCount = await prisma.booking.count({ where: { bookingDate: DATE_PERF } });
      expect(seededCount).toBeGreaterThanOrEqual(50);

      // Warm-up query to avoid first-hit TCP/pool jitter, then measure
      await request(app).get(`/api/availability?date=${DATE_PERF}`);

      const startNs = process.hrtime.bigint();
      const res = await request(app).get(`/api/availability?date=${DATE_PERF}`);
      const elapsedMs = Number(process.hrtime.bigint() - startNs) / 1_000_000;

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.rooms).toHaveLength(9);
      // Confirm slots 0..5 are marked unavailable across rooms
      expect(res.body.rooms[0].slots[0].isAvailable).toBe(false);
      expect(res.body.rooms[0].slots[6].isAvailable).toBe(true);
      expect(elapsedMs).toBeLessThan(200);
    });
  });
});
