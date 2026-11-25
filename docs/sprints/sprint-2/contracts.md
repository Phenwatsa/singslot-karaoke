# Sprint 2 Engineering Contracts, Change Register & Test Specifications
## Project: SingSlot — Karaoke Room Reservation & Management System
**Course:** CPE 334 Introduction to Software Engineering in the Age of AI Agents  
**Document Version:** 1.0.0 (Pre-Implementation Contract Baseline — `[D2 - Issue 1]`)  
**Date:** November 2026  

---

## 1. Sprint 1 Continuity & Lab 5–6 Change / Defect Register

### 1.1 Accepted Baseline References
* **Original Sprint 1 Tag / Commit:** `v0.1.0-sprint1` (`cc1c3d82d5c1bf3e635d4b68b2de4d1872abcd3a`)
* **Accepted Lab 6 Production Release (`main`):** `f3eb92d4ee5036fa6af0b6c36f1b903bcafb312d` (Cloud Run Revision `singslot-00005-26q`, accepted by Independent UAT on 2026-11-22)
* **Pre-Sprint 2 Staging Baseline (`sprint-1-staging`):** `676c7dfa599bc92f70104056b556fb42373c0c6b` (Post-PR #41 Lab 6 sign-off)

### 1.2 Lab 5–6 Change & Defect Register

| ID | Source | Affected Req / Feature | Finding Summary | Accepted Decision | Status | Fix / Target Release | Re-Test Outcome |
|---|---|---|---|---|---|---|---|
| **DEF-SS-01** | Lab 6 UAT (Whatsss Team) | `BR-02`, `BR-06`, `NFR-03` / `F-04` | TOCTOU race condition between `BookingSlot` and `RoomBlock` during concurrent booking & blockout | **Accepted Defect (P0)** — Enforce `SELECT ... FOR UPDATE` row locking and re-verify `room_blocks` inside transaction | **Resolved** | PR #39 (`17c62eb`) / `f3eb92d4` (`singslot-00005-26q`) | **PASS** (TDD RED→GREEN + Partner Retest) |
| **DEF-SS-02** | Lab 6 UAT (Whatsss Team) | `FR-03`, `FR-04` / `F-03`, `F-04` | Latent "Zombie Slot" 409 lockout if `CANCELLED` booking retains `BookingSlot` rows | **Accepted Defect (P1)** — Clean up orphaned `BookingSlot` rows of `CANCELLED` bookings inside locked transaction | **Resolved** | PR #39 (`17c62eb`) / `f3eb92d4` (`singslot-00005-26q`) | **PASS** (Partner Retest) |
| **DEF-SS-03** | Lab 6 UAT (Whatsss Team) | `FR-04`, `NFR-03` / `F-04` | Unhandled Prisma `P2002` crash (`HTTP 500`) on `bookingCode` collision | **Accepted Defect (P1)** — Add retry loop (`MAX_CODE_RETRIES = 5`) on `bookingCode` `P2002` | **Resolved** | PR #39 (`17c62eb`) / `f3eb92d4` (`singslot-00005-26q`) | **PASS** (Automated + Partner Retest) |
| **DEF-SS-04 (4A)** | Lab 6 UAT (Whatsss Team) | `NFR-02` / `F-01` | JWT stored in `localStorage` (`singslot_token`) instead of `HttpOnly` cookie | **Not-Defect** — Consistent with Sprint 1 stateless Bearer JWT contract | **Closed** | N/A (By Design) | N/A |
| **DEF-SS-04 (4B)** | Lab 6 UAT (Whatsss Team) | `NFR-02` / Infrastructure | Permissive wildcard CORS (`app.use(cors())`) | **Enhancement (P3)** — Single-origin container in Sprint 1; restrict origin in Sprint 2/3 hardening | **Remaining (Tech Debt)** | Planned Sprint 3 (`F-14`) | Pending |

*(Note: Adaptive Sprint 1 maintenance changes from Lab 7—`BR-01`, `BR-04`, `BR-11`, `BR-12`—are tracked in `docs/labs/lab-07/change-impact.md` and integrated into Sprint 2 implementation.)*

---

## 2. Sprint 2 Feature Contracts

### 2.1 Contract 5: Staff Walk-in Booking Counter (`F-07`)
* **Linked Requirements:** `FR-07`, `BR-01`, `BR-02`, `BR-03`, `BR-04`, `BR-05`, `BR-06`, `BR-08`, `BR-12`, `NFR-03`
* **Data Layer:** Uses existing `Booking` (`channel = WALK_IN`) and `BookingSlot` models in `schema.prisma`. No new schema migration required beyond Lab 7's `Room.hourlyRate` and `Booking.totalPrice`.
* **Component Responsibilities:**
  * **Backend:** Restrict access to `STAFF` role (`403 FORBIDDEN` for `CUSTOMER`, `401 UNAUTHENTICATED` without valid JWT). Validate operating window (`0..13`, `1 <= durationHours <= 5`, `endSlot <= 13`), capacity (`1 <= partySize <= room.capacity`), and contiguous slot vacancy (`BookingSlot` + `RoomBlock`).
  * **Lab 7 Alignment (Channel Exemption):** Walk-in bookings (`channel = WALK_IN`) check `!isPast` (`currentServerTime < slotStartTime` in `Asia/Bangkok`) **only**. They are **exempt** from online-only Lab 7 rules (60-minute advance cutoff, Peak-Hour 3-hour cap, and customer 6-hour daily quota `BR-11`). Server authoritatively computes `totalPrice = room.hourlyRate * durationHours`.
  * **Frontend:** Provide a Staff Walk-in Booking form inside `<AppLayout>` and `<GlassCard>` allowing staff to select room, date, start slot, duration, party size, `customerName`, and optional `customerPhone`.
* **API Specifications:**
  * `POST /api/bookings/walk-in` (Header: `Authorization: Bearer <StaffToken>`)
    * Request Body:
      ```json
      {
        "roomId": "r-m01",
        "bookingDate": "2026-11-28",
        "startSlot": 8,
        "durationHours": 4,
        "partySize": 6,
        "customerName": "Walk-in Guest",
        "customerPhone": "0812345678"
      }
      ```
    * Success Response (`201 Created`):
      ```json
      {
        "success": true,
        "booking": {
          "id": "bk-uuid-walkin-01",
          "bookingCode": "BK-20261128-9A2B",
          "roomId": "r-m01",
          "roomNumber": "M01",
          "bookingDate": "2026-11-28",
          "startSlot": 8,
          "durationHours": 4,
          "timeRange": "18:00 - 22:00",
          "partySize": 6,
          "channel": "WALK_IN",
          "customerName": "Walk-in Guest",
          "customerPhone": "0812345678",
          "totalPrice": 1400,
          "status": "CONFIRMED"
        }
      }
      ```
    * Error Responses:
      * `401 UNAUTHENTICATED` (missing/invalid token)
      * `403 FORBIDDEN` (caller role is `CUSTOMER`)
      * `400 INVALID_INPUT` (missing `customerName` or invalid types)
      * `400 INVALID_DURATION` (`durationHours` not in `1..5` or `endSlot > 13`)
      * `400 CANNOT_BOOK_PAST_SLOT` (slot already started/elapsed)
      * `400 EXCEEDS_CAPACITY` (`partySize < 1` or `partySize > room.capacity`)
      * `409 SLOT_CONFLICT` (overlapping `BookingSlot` or `RoomBlock`)

---

### 2.2 Contract 6: Booking Cancellation & Rescheduling (`F-08`)
* **Linked Requirements:** `FR-09`, `FR-10`, `BR-01`, `BR-02`, `BR-03`, `BR-04`, `BR-05`, `BR-07`, `BR-09`, `BR-11`, `BR-12`, `NFR-03`
* **Data Layer:** Uses `Booking.status` (`CONFIRMED` → `CANCELLED`), `Booking.totalPrice`, and `BookingSlot` rows. No schema change needed.
* **Domain Rules & Boundaries:**
  1. **Ownership & Role Guard:** `CUSTOMER` can cancel/reschedule **only** their own bookings (`booking.userId === req.user.id`); accessing another customer's booking returns `403 FORBIDDEN`. `STAFF` may cancel/reschedule any booking.
  2. **Status Guard:** Cannot cancel or reschedule an already `CANCELLED` booking (`400 ALREADY_CANCELLED` or `409 BOOKING_ALREADY_CANCELLED`).
  3. **24-Hour Advance Policy (`BR-09`):** Authoritative server time in `Asia/Bangkok` must satisfy `serverTime <= slotStartDateTime - 24 hours`. Exact boundary (`== 24h` remaining) is **permitted**; `< 24h` remaining is **rejected** with `400 CANCELLATION_WINDOW_EXPIRED`.
  4. **Atomic Slot Release on Cancel:** Inside `prisma.$transaction`, set `Booking.status = 'CANCELLED'` and delete all `BookingSlot` rows for `bookingId`, immediately freeing those slots and restoring customer daily quota (`BR-11`).
  5. **Atomic Slot Swap & Lab 7 Alignment on Reschedule:** Inside `prisma.$transaction` (with `SELECT ... FOR UPDATE` row locking):
     * Validate target `roomId`, `bookingDate`, `startSlot`, `durationHours`, `partySize` (if provided).
     * Re-check `BR-09` (`>= 24h` before *original* booking start) and target slot `!isPast`.
     * If `booking.channel === 'ONLINE'`, enforce Lab 7 online rules: `60-min cutoff` (`BR-04`), `Peak-Hour 3-hr cap` (`BR-01`), and `6-hr daily quota` (`BR-11`) **excluding `targetBookingId`** (`id != targetBookingId`) so same-day reschedules do not double-count the booking's own prior hours.
     * Delete old `BookingSlot` rows for `bookingId`, verify new target slots have no `BookingSlot` or `RoomBlock` conflict (`409 SLOT_CONFLICT`), insert new `BookingSlot` rows, and recalculate `totalPrice = targetRoom.hourlyRate * durationHours`.
* **API Specifications:**
  * `PATCH /api/bookings/:id/cancel` (Header: `Authorization: Bearer <Token>`)
    * Success Response (`200 OK`): `{ "success": true, "booking": { "id": "...", "status": "CANCELLED", ... } }`
    * Errors: `401`, `403 FORBIDDEN`, `404 NOT_FOUND`, `400 CANCELLATION_WINDOW_EXPIRED`, `409 BOOKING_ALREADY_CANCELLED`.
  * `PATCH /api/bookings/:id/reschedule` (Header: `Authorization: Bearer <Token>`)
    * Request Body: `{ "roomId": "r-s02", "bookingDate": "2026-11-30", "startSlot": 2, "durationHours": 2 }`
    * Success Response (`200 OK`): `{ "success": true, "booking": { "id": "...", "roomNumber": "S02", "bookingDate": "2026-11-30", "timeRange": "12:00 - 14:00", "totalPrice": 400, "status": "CONFIRMED" } }`
    * Errors: `401`, `403 FORBIDDEN`, `404 NOT_FOUND`, `400 CANCELLATION_WINDOW_EXPIRED`, `400 CANNOT_BOOK_PAST_SLOT`, `400 PEAK_DURATION_EXCEEDED`, `400 EXCEEDS_CAPACITY`, `409 SLOT_CONFLICT`, `409 DAILY_QUOTA_EXCEEDED`.
* **Frontend:** Add Cancel (with confirmation) and Reschedule modal/actions inside Customer "My Bookings" and Booking Detail views using `<GlassCard>`.

---

### 2.3 Contract 7: Staff Slot Maintenance & Blockout (`F-09`)
* **Linked Requirements:** `FR-08`, `BR-02`, `BR-03`, `BR-08`, `BR-10`, `NFR-02`, `NFR-03`
* **Data Layer:** Uses existing `RoomBlock` model (`roomId`, `blockDate`, `slotIndex`, `reason`). No schema change required.
* **Component Responsibilities:**
  * **Backend:** Restricted to `STAFF` role (`403 FORBIDDEN` for `CUSTOMER`).
    * `GET /api/room-blocks?date=YYYY-MM-DD`: Lists active maintenance blocks (optional `date` filter).
    * `POST /api/room-blocks`: Creates block(s) for `roomId`, `blockDate`, `slotIndex` (or array `slotIndices` / `durationHours` `1..5` within `0..13`). Inside `prisma.$transaction` with row lock on `rooms`, verifies no active `CONFIRMED` `BookingSlot` overlaps `[roomId, blockDate, slotIndex]`. Overlap returns `409 BLOCK_CONFLICT`. Duplicate block returns `409 BLOCK_ALREADY_EXISTS` without creating duplicate rows.
    * `DELETE /api/room-blocks/:id`: Removes maintenance block (`404 NOT_FOUND` if missing), restoring slot availability in `GET /api/availability`.
  * **Frontend:** Staff Room Blockout management panel inside `<AppLayout>` / `<GlassCard>` to view, create (with reason), and remove slot blocks.
* **API Specifications:**
  * `POST /api/room-blocks` (Header: `Authorization: Bearer <StaffToken>`)
    * Request Body: `{ "roomId": "r-s01", "blockDate": "2026-11-29", "slotIndex": 4, "reason": "Speaker maintenance" }`
    * Success Response (`201 Created`): `{ "success": true, "block": { "id": "blk-01", "roomId": "r-s01", "blockDate": "2026-11-29", "slotIndex": 4, "reason": "Speaker maintenance" } }`
    * Conflict (`409 Conflict`): `{ "success": false, "error": { "code": "BLOCK_CONFLICT", "message": "Cannot block a slot with an existing confirmed booking." } }`

---

### 2.4 Contract 8: Booking Search & Multi-Criteria Filtering (`F-10`)
* **Linked Requirements:** `FR-11`, `BR-08`, `NFR-02`
* **Data Layer:** Queries existing `Booking` + `Room` tables. No schema change required.
* **Component Responsibilities:**
  * **Backend:** Extend `GET /api/bookings/master` (`STAFF` only; `403 FORBIDDEN` for `CUSTOMER`) to support optional query parameters:
    * `date=YYYY-MM-DD` (exact date) or `startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` (date range)
    * `phone=<string>` (case-insensitive substring match on `customerPhone`)
    * `roomId=<uuid>` or `roomType=SMALL|MEDIUM|LARGE`
    * `status=CONFIRMED|CANCELLED`
    * If no query filter is provided, defaults to today's date in `Asia/Bangkok` (`ICT`, `UTC+7`). All results are ordered by `bookingDate DESC, startSlot ASC`. Invalid filter format (e.g., malformed date or invalid `roomType`/`status`) returns `400 INVALID_INPUT`.
  * **Frontend:** Add search & filter toolbar (phone input, date/range, room type, status) to the Staff Master Schedule page inside `<AppLayout>`.

---

### 2.5 Contract 9: Availability Query Latency Target (`NFR-04`)
* **Linked Requirements:** `FR-03`, `NFR-04`
* **Operational Target:** `GET /api/availability?date=YYYY-MM-DD` must respond in **`< 200 ms`** under local test execution when PostgreSQL contains at least **50 pre-existing bookings** across the 9 rooms.

---

## 3. Acceptance Criteria (AC)

| AC ID | Target Feature | Scenario | Observable Expected Outcome |
|---|---|---|---|
| **AC-07** | F-07 | Staff creates walk-in booking (`POST /api/bookings/walk-in`) `< 60 min` before start, for 4 hrs in Peak-Hour, and when daily `CONFIRMED` hours already exceed 6 hrs; Customer attempts same endpoint | Staff receives `201 Created` (`channel: "WALK_IN"`, `totalPrice` computed, exempt from online-only Lab 7 rules); Customer receives `403 FORBIDDEN`. |
| **AC-08** | F-09 | Staff creates and deletes a `RoomBlock` on an open slot | `POST` returns `201 Created`; `GET /api/availability` marks slot `isAvailable: false`; `DELETE` returns `200` and restores `isAvailable: true`. |
| **AC-08b** | F-09 | Staff attempts to block a slot that has a `CONFIRMED` booking | `409 Conflict` with code `BLOCK_CONFLICT`; zero `RoomBlock` rows created. |
| **AC-09** | F-08 | Customer cancels own booking `>= 24h` before start; another customer attempts to cancel it | Owner receives `200 OK` (`status: "CANCELLED"`), slots released & quota restored; non-owner receives `403 FORBIDDEN`. |
| **AC-09a** | F-08 | Customer attempts to cancel or reschedule `< 24h` before start (`BR-09`) | `400 Bad Request` with code `CANCELLATION_WINDOW_EXPIRED`; booking & slots remain unchanged. |
| **AC-10** | F-08 | Customer reschedules own booking `>= 24h` before start to open slots | `200 OK`, old `BookingSlot` rows replaced atomically, `totalPrice` recalculated, and `BR-11` excludes `targetBookingId`. |
| **AC-11** | F-10 | Staff filters Master Schedule by `phone`, `date`/`range`, `roomType`, and `status`; Customer attempts access | Staff receives `200 OK` with matching subset; Customer receives `403 FORBIDDEN`. |
| **AC-03b** | NFR-04 | `GET /api/availability` queried with `>= 50` bookings seeded | `200 OK` with response time `< 200 ms`. |

---

## 4. Software Test Specification (STS)

| Test ID | Linked AC | Level | Preconditions & Input | Test Action | Expected Result |
|---|---|---|---|---|---|
| **TEST-07** | AC-07 | API Integration & Security | Staff token + Customer token; Room M01 open; slot `< 60 min` before start; the same Staff user (`userId == staff.id`) already holds `>= 6` `CONFIRMED` walk-in hours on target date | `POST /api/bookings/walk-in` (4 hrs Peak-Hour, `< 60 min` lead time) by Staff, then by Customer | Staff → `201 Created` (`WALK_IN`, `totalPrice = 1400`, not blocked by 60-min cutoff, Peak-Hour cap, or 6-hr quota); Customer → `403 FORBIDDEN`. |
| **TEST-08** | AC-08 | API Integration | Staff token; Room S01 Slot 4 open | `POST /api/room-blocks`, query `/api/availability`, then `DELETE /api/room-blocks/:id` | `201` → slot unavailable → `200` → slot available again. |
| **TEST-08b** | AC-08b | Domain Rule (TDD) | Room S01 Slot 2 has `CONFIRMED` booking | Staff sends `POST /api/room-blocks` on S01 Slot 2 | `409 Conflict`, `BLOCK_CONFLICT`, 0 blocks persisted. |
| **TEST-09** | AC-09 | API Integration & Ownership | Customer A owns booking `> 24h` away; Customer B token | Customer B calls `PATCH /api/bookings/:id/cancel`; then Customer A calls it | Customer B → `403 FORBIDDEN`; Customer A → `200 OK`, `status = CANCELLED`, `BookingSlot` rows deleted. |
| **TEST-09a** | AC-09a | Domain Rule (TDD) | Booking starts `< 24h` from server time | Owner calls `PATCH /api/bookings/:id/cancel` and `/reschedule` | `400 Bad Request`, `CANCELLATION_WINDOW_EXPIRED`, booking remains `CONFIRMED`. |
| **TEST-10** | AC-10 | API Integration & Rule | Customer A holds 6 confirmed hrs on target date (Booking #1: 4 hrs in S01 `> 24h` away + Booking #2: 2 hrs in S02); target room M01 open | `PATCH /api/bookings/:id/reschedule` moving Booking #1 (4 hrs) to M01 on the same date | `200 OK` (total remains `2 + 4 = 6 <= 6`, proving `targetBookingId` is excluded from `BR-11` sum), slots swapped atomically, `totalPrice` updated to `1400`. |
| **TEST-11** | AC-11 | API Integration & Security | Multiple bookings across rooms/phones/statuses | Staff calls `GET /api/bookings/master?phone=...&roomType=...&status=...`; Customer calls same | Staff → `200 OK` filtered results; Customer → `403 FORBIDDEN`. |
| **TEST-03b** | AC-03b | Performance (NFR-04) | `>= 50` bookings inserted across 9 rooms | Measure elapsed time of `GET /api/availability?date=...` | `200 OK` and elapsed duration `< 200 ms`. |

---

## 5. Sprint 2 Definition of Done (DoD)
1. **Implementation Delivery:** Features `F-07` through `F-10` implemented across React UI (`<AppLayout>` / `<GlassCard>`), Express API, and PostgreSQL persistence.
2. **TDD & Automated Verification:** RED → GREEN TDD evidence captured for `BR-09` (`TEST-09a`) and `BR-10` (`TEST-08b`); full test suite (`--runInBand`), `npm run typecheck`, and `npm run build` pass 100% with zero skipped tests.
3. **Peer Review & Identifiable Release:** Feature PR reviewed and merged into `sprint-1-staging`, then Release PR merged into `main` and tagged **`v0.2.0-sprint2`**.
