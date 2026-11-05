# Sprint 1 Engineering Contracts & Test Specifications
## Project: SingSlot — Karaoke Room Reservation & Management System
**Course:** CPE 334 Introduction to Software Engineering in the Age of AI Agents  
**Document Version:** 1.2.0 (Rigorous Engineering Baseline)  
**Date:** November 2026  

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
* **Linked Requirements:** FR-02, FR-03, BR-03
* **Component Responsibilities:**
  * **Backend:** Query the 9 seeded rooms and calculate availability across 14 hourly slots (0..13) for the requested calendar date by cross-referencing active `BookingSlot` and `RoomBlock` records.
  * **Frontend:** Display room cards with capacity badges and an interactive 14-slot timeline matrix indicating open (green) vs. occupied (red/gray) slots.
* **API Specifications:**
  * `GET /api/rooms`
    * Success Response (200 OK): Array of 9 room objects with `id`, `roomNumber`, `type`, `capacity`, `description`.
  * `GET /api/availability?date=YYYY-MM-DD`
    * Validation: `date` must match format `YYYY-MM-DD`. Invalid date returns HTTP 400 `INVALID_INPUT`.
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
            "slots": [
              { "slotIndex": 0, "timeRange": "10:00 - 11:00", "isAvailable": true },
              { "slotIndex": 3, "timeRange": "13:00 - 14:00", "isAvailable": false }
            ]
          }
        ]
      }
      ```

---

### 1.3 Contract 3: Customer Online Booking Engine & Conflict Prevention (F-04)
* **Linked Requirements:** FR-04, BR-01, BR-02, BR-03, BR-04, BR-05, BR-06, NFR-03
* **Domain Validation Sequence:**
  1. Operating Window: `startSlot` must be between $0$ and $13$.
  2. Duration Boundary: `durationHours` must be an integer between $1$ and $5$. The computed end slot `startSlot + durationHours - 1` must not exceed $13$. Violations return HTTP 400 `INVALID_DURATION`.
  3. Past Slot: The scheduled start datetime in `Asia/Bangkok` must be strictly in the future relative to server time. Past requests return HTTP 400 `CANNOT_BOOK_PAST_SLOT`.
  4. Capacity: `partySize` must be $\ge 1$ and $\le$ `room.capacity`. Violations return HTTP 400 `EXCEEDS_CAPACITY`.
  5. Contiguous Vacancy: All slots in `[startSlot, startSlot + durationHours - 1]` must be unoccupied in `BookingSlot` and `RoomBlock`. Overlapping attempts return HTTP 409 `SLOT_CONFLICT`.
  6. Atomic Commit: Create `Booking` and insert all corresponding `BookingSlot` records inside `prisma.$transaction`. Database unique constraint `@@unique([roomId, bookingDate, slotIndex])` enforces concurrency protection.
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
          "status": "CONFIRMED"
        }
      }
      ```
    * Conflict Rejection (409 Conflict):
      ```json
      {
        "success": false,
        "error": { "code": "SLOT_CONFLICT", "message": "One or more requested slots are already occupied." }
      }
      ```

---

### 1.4 Contract 4: Customer My Bookings, Detail View & Staff Master Schedule (F-05, F-06)
* **Linked Requirements:** FR-05, FR-06, BR-07, BR-08, NFR-02
* **Component Responsibilities:**
  * **Backend:**
    * `GET /api/bookings/my`: Queries bookings where `userId == req.user.id`.
    * `GET /api/bookings/:id`: Ownership guard. If `booking.userId != req.user.id` AND `req.user.role != 'STAFF'`, return HTTP 403 `FORBIDDEN`.
    * `GET /api/bookings/master?date=YYYY-MM-DD`: Restricted to `STAFF` role. Returns all bookings across all rooms.
  * **Frontend:**
    * Customer "My Bookings" list view displaying reservation code, room, date, and time.
    * Customer Booking Detail modal view.
    * Staff Master Schedule calendar grid view showing reservations across all 9 rooms.
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
| **AC-03** | F-03 | Client queries availability for date (`/api/availability`) | HTTP 200 returning 14 slots (0..13) per room with boolean flags matching database state. |
| **AC-04a**| F-04 | Customer reserves 1–5 contiguous open slots | HTTP 201 Created with bookingCode; slots marked unavailable in subsequent queries. |
| **AC-04b**| F-04 | Customer attempts to book across an occupied slot (TDD Target) | HTTP 409 Conflict with code `SLOT_CONFLICT`; zero rows modified. |
| **AC-04c**| F-04 | Customer attempts to reserve a past date or elapsed slot | HTTP 400 Bad Request with code `CANNOT_BOOK_PAST_SLOT`. |
| **AC-04d**| F-04 | Customer specifies party size exceeding room capacity | HTTP 400 Bad Request with code `EXCEEDS_CAPACITY`. |
| **AC-04e**| F-04 | Concurrent parallel requests target same room and slot | Exactly one request returns HTTP 201; competing request returns HTTP 409 Conflict. |
| **AC-04f**| F-04 | Multi-slot booking encounters database failure | Transaction rolls back completely; zero orphaned `Booking` or `BookingSlot` records. |
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
| **TEST-03** | AC-03 | API Integration | Room S01 has Slot 3 booked on date | `GET /api/availability?date=...` | Slot 3 indicates `isAvailable: false`, other slots `true`. |
| **TEST-04a**| AC-04a | API Integration | Customer token, Room S01 open in Slots 0–2 | `POST /api/bookings/online` (start=0, duration=3) | HTTP 201 Created, `Booking` and 3 `BookingSlot` rows persisted. |
| **TEST-04b**| AC-04b | Domain Rule (TDD) | Room S01 has Slot 3 pre-reserved | Submit booking for Slot 0 with duration=4 (0..3) | HTTP 409 Conflict, `SLOT_CONFLICT`, 0 slots modified. |
| **TEST-04c**| AC-04c | Domain Rule | Booking date is yesterday | `POST /api/bookings/online` with past date | HTTP 400 Bad Request, `CANNOT_BOOK_PAST_SLOT`. |
| **TEST-04d**| AC-04d | Domain Rule | Small room (capacity 4) with `partySize: 6` | `POST /api/bookings/online` | HTTP 400 Bad Request, `EXCEEDS_CAPACITY`. |
| **TEST-04e**| AC-04e | Concurrency Suite | Two parallel requests for S01 Slot 5 | Execute concurrent `POST` via `Promise.all` | Exactly one 201 Created and one 409 Conflict. |
| **TEST-04f**| AC-04f | Fault Injection | Mock error before `BookingSlot` commit | `POST /api/bookings/online` | Operation rolls back, zero orphaned `Booking` rows. |
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
