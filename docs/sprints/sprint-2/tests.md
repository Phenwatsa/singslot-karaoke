# Sprint 2 TDD (RED → GREEN) & Regression Verification Evidence

## Project: SingSlot — Karaoke Room Reservation & Management System

**Course:** CPE 334 Introduction to Software Engineering in the Age of AI Agents (Semester 1/2026)  
**Deliverable:** Deliverable 2 — `[D2 - Issue 2]` Sprint 2 Operations Increment (`F-07`–`F-10`, `BR-09`, `BR-10`, `NFR-04`)  
**Branch:** `feat/sprint2-complete` (PR #52 → `sprint-1-staging`)  
**Date:** 25–26 November 2026  

---

## 1. Verifiable TDD Commit Sequence

| TDD Phase | Commit SHA (Full) | Scope & Evidence |
| :--- | :--- | :--- |
| **Pre-Implementation Base** | `aa8fa59` (`sprint-1-staging` post-PR #50) | Sprint 1 + Lab 6 + Lab 7 (`BR-01`, `BR-04`, `BR-11`, `BR-12`) runtime baseline |
| **Phase 1 — RED (Failing Tests)** | `4582a44dca6369aa96066844608c86c3ae9bd9d5` | Added `server/tests/sprint2.test.ts` (`TEST-07`, `TEST-08`, `TEST-08b`, `TEST-09`, `TEST-09a`, `TEST-10`, `TEST-11`, `TEST-03b`). `0` TS errors; **7 failed, 1 passed (`TEST-03b`), 8 total** against unmodified pre-Sprint 2 runtime. |
| **Phase 2 — GREEN (Implementation)** | `8093dee5734c23e153eb63790a5459e015cd117b` | Implemented `F-07`–`F-10` backend & unified frontend UI. All **12/12 server suites (`118/118` tests)** and **12/12 client tests** passed serially (`--runInBand`). |
| **Phase 3 — Review Hardening** | Subsequent commits on `feat/sprint2-complete` | Aligned optional `customerPhone` in Walk-in UI (Contract 5), re-verified `BR-09` & target slot time/cutoff inside locked transactions, keyed schedule occupancy by `bookingDate`, and expanded `TEST-08` to verify `CUSTOMER` `403 FORBIDDEN` on `GET`, `POST`, and `DELETE /api/room-blocks`. |

---

## 2. Verbatim RED Execution Evidence (Commit `4582a44dca6369aa96066844608c86c3ae9bd9d5`)

### 2.1 Zero TypeScript Compile Errors Before Running RED Tests
```bash
$ npm --prefix server run typecheck

> singslot-server@1.0.0 typecheck
> tsc --noEmit
# Exited with code 0 (Zero TypeScript errors)
```

### 2.2 Complete Verbatim Jest RED Terminal Output (`--runInBand`)
- **Command:** `npm --prefix server run test -- tests/sprint2.test.ts`
- **Tested Commit SHA:** `4582a44dca6369aa96066844608c86c3ae9bd9d5`
- **Failure Diagnosis:** All 7 failures stem strictly from the unimplemented Sprint 2 endpoints and business rules (`TEST-08b` `BR-10`: Expected `409`, Received `404`; `TEST-09a` `BR-09`: Expected `400`, Received `404`; `TEST-11` `F-10`: Expected `200`, Received `400` because Sprint 1 rejected missing `date`). Zero authentication, fixture, or compilation errors occurred (authenticated setup and `TEST-03b` succeeded cleanly).

```text
> singslot-server@1.0.0 test
> jest --runInBand --detectOpenHandles --forceExit tests/sprint2.test.ts

FAIL tests/sprint2.test.ts
  Sprint 2 Operations Increment: F-07 Walk-in, F-08 Cancel/Reschedule, F-09 RoomBlock, F-10 Search & NFR-04
    TEST-07: Staff Walk-in Booking Counter (F-07, AC-07)
      ✕ allows STAFF walk-in <60m before start, 4h Peak-Hour, even with >=6h existing daily hours, computes totalPrice, and denies CUSTOMER with 403 (322 ms)
    TEST-08 & TEST-08b: Staff Slot Maintenance & Blockout (F-09, AC-08, AC-08b, BR-10)
      ✕ TEST-08: STAFF creates, lists, and deletes RoomBlock updating /api/availability; CUSTOMER gets 403 (8 ms)
      ✕ TEST-08b (BR-10 TDD): rejects RoomBlock overlapping a CONFIRMED booking with 409 BLOCK_CONFLICT and persists 0 blocks atomically (50 ms)
    TEST-09 & TEST-09a: Booking Cancellation & BR-09 24h Advance Rule (F-08, AC-09, AC-09a)
      ✕ TEST-09: rejects cross-customer cancel (403), allows owner cancel >=24h releasing slots & restoring quota, and rejects duplicate cancel (409) (27 ms)
      ✕ TEST-09a (BR-09 TDD): rejects cancel and reschedule <24h before start with 400 CANCELLATION_WINDOW_EXPIRED, and permits exact 24h boundary (160 ms)
    TEST-10: Booking Rescheduling (F-08, AC-10, BR-09, BR-11, BR-12)
      ✕ moves 4h booking to M01 on same date while holding 6h total (excluding targetBookingId from BR-11), swaps slots atomically, and recalculates totalPrice (47 ms)
    TEST-11: Staff Master Schedule Search & Multi-Criteria Filtering (F-10, AC-11)
      ✕ filters by phone, dateRange, roomType, status, defaults to today when empty, rejects invalid combinations, and denies CUSTOMER (403) (19 ms)
    TEST-03b: Availability Query Latency < 200 ms with >= 50 Bookings (NFR-04, AC-03b)
      ✓ responds in < 200 ms on GET /api/availability with 54 pre-existing bookings across all 9 rooms (105 ms)

  ● Sprint 2 Operations Increment: F-07 Walk-in, F-08 Cancel/Reschedule, F-09 RoomBlock, F-10 Search & NFR-04 › TEST-07: Staff Walk-in Booking Counter (F-07, AC-07) › allows STAFF walk-in <60m before start, 4h Peak-Hour, even with >=6h existing daily hours, computes totalPrice, and denies CUSTOMER with 403

    expect(received).toBe(expected) // Object.is equality

    Expected: 403
    Received: 404

      174 |           customerPhone: '0812345678'
      175 |         });
    > 176 |       expect(custRes.status).toBe(403);
          |                              ^
      177 |       expect(custRes.body.error.code).toBe('FORBIDDEN');
      178 |
      179 |       // 2. STAFF succeeds with 4h Peak-Hour (18:00-22:00), <60m lead time, and >6h daily total

      at Object.<anonymous> (tests/sprint2.test.ts:176:30)

  ● Sprint 2 Operations Increment: F-07 Walk-in, F-08 Cancel/Reschedule, F-09 RoomBlock, F-10 Search & NFR-04 › TEST-08 & TEST-08b: Staff Slot Maintenance & Blockout (F-09, AC-08, AC-08b, BR-10) › TEST-08: STAFF creates, lists, and deletes RoomBlock updating /api/availability; CUSTOMER gets 403

    expect(received).toBe(expected) // Object.is equality

    Expected: 403
    Received: 404

      240 |         .set('Authorization', `Bearer ${customer1Token}`)
      241 |         .send({ roomId: roomS01.id, blockDate: DATE_BLOCK, slotIndex: 4, reason: 'Unauthorized' });
    > 242 |       expect(custPost.status).toBe(403);
          |                               ^
      243 |       expect(custPost.body.error.code).toBe('FORBIDDEN');
      244 |
      245 |       // STAFF creates RoomBlock on open S01 Slot 4

      at Object.<anonymous> (tests/sprint2.test.ts:242:31)

  ● Sprint 2 Operations Increment: F-07 Walk-in, F-08 Cancel/Reschedule, F-09 RoomBlock, F-10 Search & NFR-04 › TEST-08 & TEST-08b: Staff Slot Maintenance & Blockout (F-09, AC-08, AC-08b, BR-10) › TEST-08b (BR-10 TDD): rejects RoomBlock overlapping a CONFIRMED booking with 409 BLOCK_CONFLICT and persists 0 blocks atomically

    expect(received).toBe(expected) // Object.is equality

    Expected: 409
    Received: 404

      314 |         .set('Authorization', `Bearer ${staffToken}`)
      315 |         .send({ roomId: roomS01.id, blockDate: DATE_BLOCK, slotIndex: 2, reason: 'Conflict test' });
    > 316 |       expect(singleConflict.status).toBe(409);
          |                                     ^
      317 |       expect(singleConflict.body.error.code).toBe('BLOCK_CONFLICT');
      318 |
      319 |       // Multi-slot atomic check [1, 2]: Slot 1 is open, Slot 2 is booked -> entire request rejected, 0 blocks created

      at Object.<anonymous> (tests/sprint2.test.ts:316:37)

  ● Sprint 2 Operations Increment: F-07 Walk-in, F-08 Cancel/Reschedule, F-09 RoomBlock, F-10 Search & NFR-04 › TEST-09 & TEST-09a: Booking Cancellation & BR-09 24h Advance Rule (F-08, AC-09, AC-09a) › TEST-09: rejects cross-customer cancel (403), allows owner cancel >=24h releasing slots & restoring quota, and rejects duplicate cancel (409)

    expect(received).toBe(expected) // Object.is equality

    Expected: 403
    Received: 404

      354 |         .patch(`/api/bookings/${bookingId}/cancel`)
      355 |         .set('Authorization', `Bearer ${customer2Token}`);
    > 356 |       expect(otherCancel.status).toBe(403);
          |                                  ^
      357 |       expect(otherCancel.body.error.code).toBe('FORBIDDEN');
      358 |
      359 |       // Owner cancels >= 24h in advance -> 200 OK, status = CANCELLED, BookingSlot rows deleted

      at Object.<anonymous> (tests/sprint2.test.ts:356:34)

  ● Sprint 2 Operations Increment: F-07 Walk-in, F-08 Cancel/Reschedule, F-09 RoomBlock, F-10 Search & NFR-04 › TEST-09 & TEST-09a: Booking Cancellation & BR-09 24h Advance Rule (F-08, AC-09, AC-09a) › TEST-09a (BR-09 TDD): rejects cancel and reschedule <24h before start with 400 CANCELLATION_WINDOW_EXPIRED, and permits exact 24h boundary

    expect(received).toBe(expected) // Object.is equality

    Expected: 400
    Received: 404

      409 |         .patch(`/api/bookings/${bookingId}/cancel`)
      410 |         .set('Authorization', `Bearer ${mockCust1.token}`);
    > 411 |       expect(cancelLate.status).toBe(400);
          |                                 ^
      412 |       expect(cancelLate.body.error.code).toBe('CANCELLATION_WINDOW_EXPIRED');
      413 |
      414 |       const rescheduleLate = await request(app)

      at Object.<anonymous> (tests/sprint2.test.ts:411:33)

  ● Sprint 2 Operations Increment: F-07 Walk-in, F-08 Cancel/Reschedule, F-09 RoomBlock, F-10 Search & NFR-04 › TEST-10: Booking Rescheduling (F-08, AC-10, BR-09, BR-11, BR-12) › moves 4h booking to M01 on same date while holding 6h total (excluding targetBookingId from BR-11), swaps slots atomically, and recalculates totalPrice

    expect(received).toBe(expected) // Object.is equality

    Expected: 403
    Received: 404

      484 |           durationHours: 4
      485 |         });
    > 486 |       expect(otherResched.status).toBe(403);
          |                                   ^
      487 |       expect(otherResched.body.error.code).toBe('FORBIDDEN');
      488 |
      489 |       // Online Peak-Hour >3h rejected with 400 PEAK_DURATION_EXCEEDED

      at Object.<anonymous> (tests/sprint2.test.ts:486:35)

  ● Sprint 2 Operations Increment: F-07 Walk-in, F-08 Cancel/Reschedule, F-09 RoomBlock, F-10 Search & NFR-04 › TEST-11: Staff Master Schedule Search & Multi-Criteria Filtering (F-10, AC-11) › filters by phone, dateRange, roomType, status, defaults to today when empty, rejects invalid combinations, and denies CUSTOMER (403)

    expect(received).toBe(expected) // Object.is equality

    Expected: 200
    Received: 400

      604 |         )
      605 |         .set('Authorization', `Bearer ${staffToken}`);
    > 606 |       expect(filteredRes.status).toBe(200);
          |                                  ^
      607 |       expect(filteredRes.body.success).toBe(true);
      608 |       expect(filteredRes.body.bookings).toHaveLength(1);
      609 |       expect(filteredRes.body.bookings[0].roomNumber).toBe('M01');

      at Object.<anonymous> (tests/sprint2.test.ts:606:34)

Test Suites: 1 failed, 1 total
Tests:       7 failed, 1 passed, 8 total
Snapshots:   0 total
Time:        4.114 s
Ran all test suites matching /tests\/sprint2.test.ts/i.
```

---

## 3. Verbatim GREEN Execution Evidence (Post-Implementation & Expanded RBAC Coverage)

- **Command:** `npm --prefix server run test -- tests/sprint2.test.ts` (including `CUSTOMER` `403 FORBIDDEN` assertions on `GET`, `POST`, and `DELETE /api/room-blocks`)

```text
> singslot-server@1.0.0 test
> jest --runInBand --detectOpenHandles --forceExit tests/sprint2.test.ts

PASS tests/sprint2.test.ts
  Sprint 2 Operations Increment: F-07 Walk-in, F-08 Cancel/Reschedule, F-09 RoomBlock, F-10 Search & NFR-04
    TEST-07: Staff Walk-in Booking Counter (F-07, AC-07)
      ✓ allows STAFF walk-in <60m before start, 4h Peak-Hour, even with >=6h existing daily hours, computes totalPrice, and denies CUSTOMER with 403 (208 ms)
    TEST-08 & TEST-08b: Staff Slot Maintenance & Blockout (F-09, AC-08, AC-08b, BR-10)
      ✓ TEST-08: STAFF creates, lists, and deletes RoomBlock updating /api/availability; CUSTOMER gets 403 (64 ms)
      ✓ TEST-08b (BR-10 TDD): rejects RoomBlock overlapping a CONFIRMED booking with 409 BLOCK_CONFLICT and persists 0 blocks atomically (48 ms)
    TEST-09 & TEST-09a: Booking Cancellation & BR-09 24h Advance Rule (F-08, AC-09, AC-09a)
      ✓ TEST-09: rejects cross-customer cancel (403), allows owner cancel >=24h releasing slots & restoring quota, and rejects duplicate cancel (409) (38 ms)
      ✓ TEST-09a (BR-09 TDD): rejects cancel and reschedule <24h before start with 400 CANCELLATION_WINDOW_EXPIRED, and permits exact 24h boundary (186 ms)
    TEST-10: Booking Rescheduling (F-08, AC-10, BR-09, BR-11, BR-12)
      ✓ moves 4h booking to M01 on same date while holding 6h total (excluding targetBookingId from BR-11), swaps slots atomically, and recalculates totalPrice (63 ms)
    TEST-11: Staff Master Schedule Search & Multi-Criteria Filtering (F-10, AC-11)
      ✓ filters by phone, dateRange, roomType, status, defaults to today when empty, rejects invalid combinations, and denies CUSTOMER (403) (37 ms)
    TEST-03b: Availability Query Latency < 200 ms with >= 50 Bookings (NFR-04, AC-03b)
      ✓ responds in < 200 ms on GET /api/availability with 54 pre-existing bookings across all 9 rooms (69 ms)

Test Suites: 1 passed, 1 total
Tests:       8 passed, 8 total
Snapshots:   0 total
Time:        2.283 s, estimated 4 s
Ran all test suites matching /tests\/sprint2.test.ts/i.
```

- **Full Regression Summary (`npm run test:server` + `npm run test:client`):**
  - Server (`jest --runInBand`): **12/12 suites passed, 118/118 tests passed, 0 failed, 0 skipped**
  - Client (`node --test --test-concurrency=1`): **12/12 tests passed, 0 failed, 0 skipped**
  - Typecheck & Build (`npm run typecheck && npm run build`): **0 errors**
