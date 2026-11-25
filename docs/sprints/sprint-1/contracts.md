# Sprint 1 Engineering Contracts & Test Specifications
## Project: SingSlot — Karaoke Room Reservation & Management System
**Course:** CPE 334 Introduction to Software Engineering in the Age of AI Agents  
**Document Version:** 1.3.0 (Lab 7 Adaptive Maintenance Contract Revision)  
**Date:** 25 November 2026  

> **Contract Revision Note (Lab 7 — Pre-Implementation):**
> Version `1.3.0` extends the accepted Sprint 1 baseline (`v0.1.0-sprint1` / Lab 6 `f3eb92d4`) with four bounded Sprint 1 adaptive changes: (1) 60-minute online advance cutoff (`BR-04`), (2) Peak-Hour 3-hour online duration cap (`BR-01`), (3) transactional 6-hour daily customer quota (`BR-11`), and (4) flat room hourly rates & authoritative server-calculated `totalPrice` (`BR-12`). All original Sprint 1 security, ownership, and concurrency contracts remain strictly preserved.

---

## 1. Sprint 1 Feature Contracts

### 1.1 Contract 1: User Authentication & Session Lifecycle (F-01)
* **Linked Requirements:** FR-01, BR-08, NFR-01, NFR-02
* **Component Responsibilities:**
  * **Backend:** Verify seeded credentials using `bcrypt.compare`, issue signed JWT tokens containing role claims (`CUSTOMER` or `STAFF`), enforce route protection, and acknowledge logout.
  * **Frontend:** Provide a login view with quick-fill buttons for seeded accounts (`staff@singslot.local` and `customer1@singslot.local`), manage reactive auth state, and clear tokens upon logout.
* **API Specifications:**
  * `POST /api/auth/login`
    * Request: `{ "email": "staff@singslot.local", "password": "Pass1234!" }`
    * Success Response (200 OK):
      ```json
      {
        "success": true,
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "user": { "id": "u-staff-01", "email": "staff@singslot.local", "fullName": "Cashier Staff", "role": "STAFF" }
      }
      ```
    * Invalid Credentials (401 Unauthorized):
      ```json
      { "success": false, "error": { "code": "INVALID_CREDENTIALS", "message": "Invalid email or password" } }
      ```
  * `POST /api/auth/logout` (Header: `Authorization: Bearer <Token>`)
    * Success Response (200 OK):
      ```json
      { "success": true, "message": "Logged out successfully" }
      ```
  * `GET /api/auth/me` (Header: `Authorization: Bearer <Token>`)
    * Success Response (200 OK): returns active user identity object.
    * Missing/Invalid Token (401 Unauthorized):
      ```json
      { "success": false, "error": { "code": "UNAUTHENTICATED", "message": "Authentication required" } }
      ```

---

### 1.2 Contract 2: Room Catalog & Server-Calculated Availability Query (F-02, F-03)
* **Linked Requirements:** FR-02, FR-03, BR-03, BR-04, BR-12
* **Component Responsibilities:**
  * **Backend:** Query the 9 seeded rooms (including tier `hourlyRate`: `SMALL`=200, `MEDIUM`=350, `LARGE`=500 THB/hr) and calculate availability across 14 hourly slots (0..13) for the requested calendar date by cross-referencing active `BookingSlot`, `RoomBlock`, elapsed time (`isPast`), and the 60-minute online advance cutoff (`isWithinCutoff`).
  * **Frontend:** Display room cards with capacity and `hourlyRate` badges (`฿200/hr`, `฿350/hr`, `฿500/hr`) and an interactive 14-slot timeline matrix indicating open (green), occupied (red/gray), and cutoff/past slots.
* **API Specifications:**
  * `GET /api/rooms`
    * Success Response (200 OK): Array of 9 room objects with `id`, `roomNumber`, `type`, `capacity`, `hourlyRate`, `description` (and grouped `tiers` with `hourlyRate`).
  * `GET /api/availability?date=YYYY-MM-DD`
    * Validation: `date` must match format `YYYY-MM-DD`. Invalid date returns HTTP 400 `INVALID_INPUT`.
    * Slot Availability Semantics (`BR-04` Rev. Lab 7):
      * `isOccupied`: `true` if occupied by an active `CONFIRMED` `BookingSlot` or `RoomBlock`.
      * `isPast`: `true` if `currentServerTime >= slotStartTime` (`Asia/Bangkok`) — preserved for Staff walk-in eligibility (`F-07`).
      * `isWithinCutoff`: `true` if `currentServerTime > slotStartTime - 60 minutes` (`Asia/Bangkok`). Exact 60-minute boundary (`== 60 min`) yields `isWithinCutoff: false`.
      * `isAvailable`: `!isOccupied && !isWithinCutoff` (authoritative online customer bookability).
    * Success Response (200 OK):
      ```json
      {
        "success": true,
        "date": "2026-11-10",
        "rooms": [
          {
            "id": "r-s01",
            "roomNumber": "S01",
            "type": "SMALL",
            "capacity": 4,
            "hourlyRate": 200,
            "slots": [
              { "slotIndex": 0, "timeRange": "10:00 - 11:00", "isAvailable": true, "isPast": false, "isWithinCutoff": false, "isOccupied": false },
              { "slotIndex": 3, "timeRange": "13:00 - 14:00", "isAvailable": false, "isPast": false, "isWithinCutoff": false, "isOccupied": true }
            ]
          }
        ]
      }
      ```

---

### 1.3 Contract 3: Customer Online Booking Engine & Conflict Prevention (F-04)
* **Linked Requirements:** FR-04, BR-01, BR-02, BR-03, BR-04, BR-05, BR-06, BR-11, BR-12, NFR-03
* **Domain Validation Sequence (Online Channel `POST /api/bookings/online`):**
  1. **Operating Window & Base Duration (`BR-03`):** `startSlot` must be an integer in `0..13`; `durationHours` must be an integer in `1..5`; `startSlot + durationHours - 1 <= 13`. Violations return HTTP 400 `INVALID_DURATION`.
  2. **Peak-Hour Online Duration Cap (`BR-01` Rev. Lab 7):** Peak Hours are slots `8, 9, 10, 11` (`18:00–22:00` ICT). If `[startSlot, startSlot + durationHours - 1]` overlaps any slot in `8..11` and `durationHours > 3`, reject with HTTP 400 `PEAK_DURATION_EXCEEDED`. Pure Off-Peak intervals retain the `1..5` hour ceiling.
  3. **Room Existence & Capacity (`BR-05`):** Target room must exist and be active (`404 ROOM_NOT_FOUND`); `partySize` must be integer `>= 1` and `<= room.capacity` (`400 EXCEEDS_CAPACITY`).
  4. **60-Minute Online Advance Cutoff (`BR-04` Rev. Lab 7):** `currentServerTime` in `Asia/Bangkok` must satisfy `currentServerTime <= slotStartTime - 60 minutes` (exact 60-minute boundary permitted; `< 60 minutes` rejected with HTTP 400 `CANNOT_BOOK_PAST_SLOT`).
  5. **Atomic Locking, Daily Quota, Vacancy & Authoritative Pricing (`BR-02`, `BR-06`, `BR-11`, `BR-12`, `NFR-03`):**
     * Execute inside `prisma.$transaction`:
       1. Acquire deterministic row locks in global order: `SELECT "id" FROM "users" WHERE "id" = $userId FOR UPDATE`, then `SELECT "id" FROM "rooms" WHERE "id" = $roomId FOR UPDATE`.
       2. **Daily Customer Quota (`BR-11`):** Sum `durationHours` of all `CONFIRMED` bookings for `(userId, bookingDate)` (excluding `CANCELLED`, and excluding `id != targetBookingId` when invoked by Sprint 2 reschedule). If `existingConfirmedHours + durationHours > 6`, reject with HTTP 409 `DAILY_QUOTA_EXCEEDED` (exact total of `6` hours is permitted).
       3. Purge orphaned `CANCELLED` `BookingSlot` rows (`DEF-SS-02`) and re-verify zero overlap with active `CONFIRMED` `BookingSlot` or `RoomBlock` rows; conflicts reject with HTTP 409 `SLOT_CONFLICT`.
       4. **Authoritative Pricing (`BR-12`):** Compute `totalPrice = room.hourlyRate * durationHours` strictly on the server (ignoring any client-supplied price field).
       5. Insert `Booking` (with persisted `totalPrice`) and all `BookingSlot` records atomically, with bounded `bookingCode` collision retry (`DEF-SS-03`).
* **API Specifications:**
  * `POST /api/bookings/online` (Header: `Authorization: Bearer <CustomerToken>`)
    * Request Body:
      ```json
      {
        "roomId": "r-s01",
        "bookingDate": "2026-11-10",
        "startSlot": 0,
        "durationHours": 3,
        "partySize": 3
      }
      ```
    * Success Response (201 Created):
      ```json
      {
        "success": true,
        "booking": {
          "id": "bk-uuid-001",
          "bookingCode": "BK-20261110-001",
          "roomNumber": "S01",
          "bookingDate": "2026-11-10",
          "timeRange": "10:00 - 13:00",
          "durationHours": 3,
          "partySize": 3,
          "hourlyRate": 200,
          "totalPrice": 600,
          "status": "CONFIRMED"
        }
      }
      ```
    * Peak-Hour Duration Cap Violation (400 Bad Request):
      ```json
      {
        "success": false,
        "error": { "code": "PEAK_DURATION_EXCEEDED", "message": "Online bookings overlapping peak hours (18:00 - 22:00) are limited to a maximum of 3 hours." }
      }
      ```
    * Conflict Rejection (409 Conflict):
      ```json
      {
        "success": false,
        "error": { "code": "SLOT_CONFLICT", "message": "One or more requested slots are already occupied." }
      }
      ```
    * Daily Quota Exceeded Rejection (409 Conflict):
      ```json
      {
        "success": false,
        "error": { "code": "DAILY_QUOTA_EXCEEDED", "message": "Daily customer booking limit of 6 confirmed hours exceeded for this date." }
      }
      ```

---

### 1.4 Contract 4: Customer My Bookings, Detail View & Staff Master Schedule (F-05, F-06)
* **Linked Requirements:** FR-05, FR-06, BR-07, BR-08, BR-12, NFR-02
* **Component Responsibilities:**
  * **Backend:**
    * `GET /api/bookings/my`: Queries bookings where `userId == req.user.id`, returning persisted `totalPrice` and `room.hourlyRate`.
    * `GET /api/bookings/:id`: Ownership guard. If `booking.userId != req.user.id` AND `req.user.role != 'STAFF'`, return HTTP 403 `FORBIDDEN`. Returns full booking detail including persisted `totalPrice` and `room.hourlyRate`.
    * `GET /api/bookings/master?date=YYYY-MM-DD`: Restricted to `STAFF` role. Returns all bookings across all rooms including persisted `totalPrice` and `room.hourlyRate`.
  * **Frontend:**
    * Customer "My Bookings" list view displaying reservation code, room, date, time, and persisted `totalPrice` (THB).
    * Customer Booking Detail modal view displaying `hourlyRate` breakdown and persisted `totalPrice` (THB).
    * Staff Master Schedule calendar grid view showing reservations and `totalPrice` across all 9 rooms.
* **API Specifications:**
  * `GET /api/bookings/:id` (Header: `Authorization: Bearer <Token>`)
    * Ownership Granted (200 OK): returns full booking detail.
    * Cross-Customer Access Forbidden (403 Forbidden):
      ```json
      { "success": false, "error": { "code": "FORBIDDEN", "message": "You are not authorized to view this booking." } }
      ```
  * `GET /api/bookings/master?date=2026-11-10` (Header: `Authorization: Bearer <StaffToken>`)
    * Customer Access Forbidden (403 Forbidden):
      ```json
      { "success": false, "error": { "code": "FORBIDDEN", "message": "Staff privileges required." } }
      ```
    * Staff Success (200 OK): returns array of all bookings across all rooms for the date.

---

## 2. Acceptance Criteria (AC)

| AC ID | Target Feature | Scenario | Observable Expected Outcome |
|---|---|---|---|
| **AC-01** | F-01 | User logs in with valid seeded credentials | HTTP 200, JWT token returned with correct role payload. |
| **AC-01a**| F-01 | User attempts login with invalid password or unknown email | HTTP 401 Unauthorized with code `INVALID_CREDENTIALS`. |
| **AC-01b**| F-01 | Unauthenticated request sent to protected endpoint | HTTP 401 Unauthorized with code `UNAUTHENTICATED`. |
| **AC-01c**| F-01 | Customer token used on staff-only endpoint (`/api/bookings/master`) | HTTP 403 Forbidden with code `FORBIDDEN`. |
| **AC-01d**| F-01 | User requests `/api/auth/me` with valid token | HTTP 200 returning caller's user object. |
| **AC-01e**| F-01 | User requests `/api/auth/logout` with valid token | HTTP 200 acknowledging logout; client clears stored token. |
| **AC-02** | F-02 | Client queries room catalog (`/api/rooms`) | HTTP 200 returning array of 9 rooms with capacities 4, 8, 12. |
| **AC-02b**| F-02 | *(Lab 7)* Client queries `/api/rooms` and `/api/availability` for room pricing | Every room includes accurate tier `hourlyRate` (`SMALL`: 200, `MEDIUM`: 350, `LARGE`: 500 THB/hr). |
| **AC-03** | F-03 | Client queries availability for date (`/api/availability`) | HTTP 200 returning 14 slots (0..13) per room with boolean flags matching database state. |
| **AC-03c**| F-03 | *(Lab 7)* Client queries `/api/availability` for a slot within 60 min of start vs. $\ge 60$ min away | Slot `< 60 min` before start returns `isWithinCutoff: true`, `isAvailable: false`, while keeping `isPast: false` until start time; slot `== 60 min` away returns `isWithinCutoff: false`, `isAvailable: true` (if unoccupied). *(Note: `AC-03b` remains reserved for Sprint 2 `NFR-04`.)* |
| **AC-04a**| F-04 | Customer reserves 1–5 contiguous open Off-Peak slots | HTTP 201 Created with bookingCode; slots marked unavailable in subsequent queries. |
| **AC-04b**| F-04 | Customer attempts to book across an occupied slot (TDD Target) | HTTP 409 Conflict with code `SLOT_CONFLICT`; zero rows modified. |
| **AC-04c**| F-04 | Customer attempts to reserve a past date or elapsed slot | HTTP 400 Bad Request with code `CANNOT_BOOK_PAST_SLOT`. |
| **AC-04d**| F-04 | Customer specifies party size exceeding room capacity | HTTP 400 Bad Request with code `EXCEEDS_CAPACITY`. |
| **AC-04e**| F-04 | Concurrent parallel requests target same room and slot | Exactly one request returns HTTP 201; competing request returns HTTP 409 Conflict. |
| **AC-04f**| F-04 | Multi-slot booking encounters database failure | Transaction rolls back completely; zero orphaned `Booking` or `BookingSlot` records. |
| **AC-04g**| F-04 | *(Lab 7)* Customer books online at exact 60-min boundary vs. 59 min before start (`BR-04`) | Exactly 60 min prior returns HTTP 201 Created; `< 60 min` prior (e.g., 59 min) returns HTTP 400 `CANNOT_BOOK_PAST_SLOT`. |
| **AC-04h**| F-04 | *(Lab 7)* Customer books online overlapping Peak Hours 18:00–22:00 (`slots 8..11`) vs. pure Off-Peak (`BR-01`) | Peak-overlapping booking of 3 hrs returns HTTP 201; Peak-overlapping booking of 4 hrs (e.g., `startSlot=6, duration=4` or `startSlot=8, duration=4`) returns HTTP 400 `PEAK_DURATION_EXCEEDED`; pure Off-Peak 5-hr booking (e.g., `startSlot=0, duration=5`) returns HTTP 201. |
| **AC-04i**| F-04 | *(Lab 7)* Customer books up to 6 `CONFIRMED` hrs/day vs. exceeding 6 hrs/day (`BR-11`) | Cumulative `== 6` hrs returns HTTP 201; cumulative `> 6` hrs (sequential or concurrent across two distinct rooms) returns HTTP 409 `DAILY_QUOTA_EXCEEDED`; `CANCELLED` bookings do not consume quota. |
| **AC-04j**| F-04, F-05, F-06 | *(Lab 7)* Customer submits online booking (including forged `totalPrice` field) and inspects via My Bookings / Detail / Staff Master (`BR-12`) | Server ignores client price, persists `totalPrice = room.hourlyRate * durationHours`, and returns identical `totalPrice` across `POST /api/bookings/online`, `GET /api/bookings/my`, `GET /api/bookings/:id`, and `GET /api/bookings/master`. |
| **AC-05** | F-05 | Customer accesses `/api/bookings/my` | HTTP 200 returning strictly the reservations placed by the authenticated customer. |
| **AC-05b**| F-05 | Customer A requests Customer B's booking via `/api/bookings/:id` | HTTP 403 Forbidden with code `FORBIDDEN`. |
| **AC-06** | F-06 | Staff accesses `/api/bookings/master?date=...` | HTTP 200 returning comprehensive schedule of all confirmed bookings. |

---

## 3. Software Test Specification (STS)

| Test ID | Linked AC | Level | Preconditions & Input | Test Action | Expected Result |
|---|---|---|---|---|---|
| **TEST-01** | AC-01 | API Integration | Seeded user: `staff@singslot.local` / `Pass1234!` | `POST /api/auth/login` | HTTP 200, JWT token returned with `role: "STAFF"`. |
| **TEST-01a**| AC-01a | API Integration | `staff@singslot.local` with wrong password | `POST /api/auth/login` | HTTP 401 Unauthorized, `INVALID_CREDENTIALS`. |
| **TEST-01b**| AC-01b | Security Access | Request without Authorization header | `GET /api/auth/me` | HTTP 401 Unauthorized, `UNAUTHENTICATED`. |
| **TEST-01c**| AC-01c | Security Access | Customer Bearer token | `GET /api/bookings/master` | HTTP 403 Forbidden, `FORBIDDEN`. |
| **TEST-01d**| AC-01d | Unit/Storage | Seeded database inspection | Check `User.passwordHash` | String begins with `$2a$` or `$2b$`, no plaintext. |
| **TEST-01e**| AC-01e | API Integration | Valid Customer Bearer token | `POST /api/auth/logout` | HTTP 200, `{ "success": true }`. |
| **TEST-02** | AC-02 | API Integration | Seeded database with 9 rooms | `GET /api/rooms` | HTTP 200, array of 9 rooms with capacities 4, 8, 12. |
| **TEST-02b**| AC-02b | API Integration (Lab 7 TDD) | Seeded database with 9 rooms and additive pricing migration | `GET /api/rooms` and `GET /api/availability?date=<futureDate>` | Every `SMALL` room has `hourlyRate: 200`, `MEDIUM`: `350`, `LARGE`: `500` in both catalog and availability payloads. |
| **TEST-03** | AC-03 | API Integration | Room S01 has Slot 3 booked on future date | `GET /api/availability?date=...` | Slot 3 indicates `isAvailable: false`, other slots `true`. |
| **TEST-03c**| AC-03c | Domain Boundary (Lab 7 TDD) | Mocked server time in `Asia/Bangkok`: (a) `13:01:00+07:00` (59 min before Slot 4 `14:00`), (b) `13:00:00+07:00` (exact 60 min before Slot 4) | `GET /api/availability?date=<today>` | (a) Slot 4 has `isWithinCutoff: true`, `isAvailable: false`, `isPast: false`; (b) Slot 4 has `isWithinCutoff: false`, `isAvailable: true`, `isPast: false`. |
| **TEST-04a**| AC-04a | API Integration | Customer token, Room S01 open in Off-Peak Slots 0–2 | `POST /api/bookings/online` (start=0, duration=3) | HTTP 201 Created, `Booking` (`totalPrice: 600`) and 3 `BookingSlot` rows persisted. |
| **TEST-04b**| AC-04b | Domain Rule (TDD) | Room S01 has Slot 3 pre-reserved | Submit booking for Slot 0 with duration=4 (0..3) | HTTP 409 Conflict, `SLOT_CONFLICT`, 0 slots modified. |
| **TEST-04c**| AC-04c | Domain Rule | Booking date is yesterday or slot elapsed | `POST /api/bookings/online` with past date/slot | HTTP 400 Bad Request, `CANNOT_BOOK_PAST_SLOT`. |
| **TEST-04d**| AC-04d | Domain Rule | Small room (capacity 4) with `partySize: 6` | `POST /api/bookings/online` | HTTP 400 Bad Request, `EXCEEDS_CAPACITY`. |
| **TEST-04e**| AC-04e | Concurrency Suite | Two parallel requests for S01 Slot 5 | Execute concurrent `POST` via `Promise.all` | Exactly one 201 Created and one 409 Conflict. |
| **TEST-04f**| AC-04f | Fault Injection | Mock error before `BookingSlot` commit | `POST /api/bookings/online` | Operation rolls back, zero orphaned `Booking` rows. |
| **TEST-04g**| AC-04g | Domain Boundary (Lab 7 TDD) | Customer token; mocked server time `13:00:00+07:00` (exact 60 min before Slot 4 `14:00`) vs. `13:00:01+07:00` (59m59s before Slot 4) | `POST /api/bookings/online` targeting Slot 4 on `<today>` | At `13:00:00+07:00`: HTTP 201 Created; at `13:00:01+07:00`: HTTP 400 `CANNOT_BOOK_PAST_SLOT` with 0 rows written. |
| **TEST-04h**| AC-04h | Domain Boundary (Lab 7 TDD) | Customer token, open rooms on future date: (a) `startSlot=8, duration=3` (Peak 3h), (b) `startSlot=6, duration=4` (overlaps Slot 8–9), (c) `startSlot=8, duration=4` (Peak 4h), (d) `startSlot=0, duration=5` (pure Off-Peak 5h) | `POST /api/bookings/online` for (a)–(d) | (a) HTTP 201; (b) HTTP 400 `PEAK_DURATION_EXCEEDED`; (c) HTTP 400 `PEAK_DURATION_EXCEEDED`; (d) HTTP 201. |
| **TEST-04i**| AC-04i | Domain & Concurrency (Lab 7 TDD) | Customer token on future date: (a) 3h + 3h (`sum=6`), (b) additional 1h (`sum=7`), (c) 1 cancelled 4h booking + new 3h booking, (d) two concurrent 4h requests targeting distinct rooms (`S01` & `S02`) via `Promise.all` | `POST /api/bookings/online` | (a) Both HTTP 201; (b) HTTP 409 `DAILY_QUOTA_EXCEEDED`; (c) HTTP 201 (`CANCELLED` excluded); (d) Strictly one HTTP 201 and one HTTP 409 `DAILY_QUOTA_EXCEEDED`. |
| **TEST-04j**| AC-04j | Domain & Persistence (Lab 7 TDD) | Customer token, Medium room `M01` (`hourlyRate=350`), duration=3, forged payload `totalPrice: 1` | `POST /api/bookings/online`, then `GET /api/bookings/my`, `GET /api/bookings/:id`, and Staff `GET /api/bookings/master?date=...` | Forged `totalPrice` ignored; server persists and returns `totalPrice: 1050` (`350 * 3`) across all four endpoints and in PostgreSQL `bookings.totalPrice`. |
| **TEST-05** | AC-05 | API Integration | Customers Alice and Bob have bookings | Alice calls `GET /api/bookings/my` | Response contains exclusively Alice's bookings. |
| **TEST-05b**| AC-05b | Security Access | Alice calls `GET /api/bookings/:bobBookingId` | Request made with Alice's Bearer token | HTTP 403 Forbidden, `FORBIDDEN`. |
| **TEST-06** | AC-06 | API Integration | Bookings exist for target date | Staff calls `GET /api/bookings/master?date=...` | HTTP 200 returning all bookings across all rooms. |

---

## 4. Product Definition of Done (DoD)

Sprint 1 deliverables achieve complete Definition of Done status only when:
1. **Implementation Delivery:** Features F-01 through F-06 are implemented across frontend, backend, and PostgreSQL persistence tiers.
2. **Automated Verification:** All test specifications (`TEST-01` through `TEST-06`) execute and pass 100% on local machine using `--runInBand`.
3. **TDD Verification Trail:** Explicit Git commit history demonstrates failing test execution prior to implementation for contiguous conflict rule (`TEST-04b`), followed by passing execution.
4. **Substantive Peer Review:** All feature branches are merged via reviewed Pull Requests into `sprint-1-staging` with teammate reviews addressing logic, tests, and contracts.
5. **Reproducible Local Setup:** Instructions documented in `README.md` enable fresh clone, migration, seed, and execution on MacBook M1 with low memory footprint (<200MB).
