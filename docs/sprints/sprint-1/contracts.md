# Sprint 1 Engineering Contracts & Test Specifications
## Project: SingSlot — Karaoke Room Reservation & Management System
**Course:** CPE 334 Introduction to Software Engineering in the Age of AI Agents  
**Document Version:** 1.1.0 (Refined Lean-Sprint Allocation)  
**Date:** November 2026  

---

## 1. Sprint 1 Feature Contracts

### 1.1 Contract 1: Seeded User Authentication & Role Authorization (F-01)
* **Linked Requirements:** FR-01, BR-08, NFR-01, NFR-02
* **Component Responsibilities:**
  * **Backend:** Verify seeded user credentials via `bcryptjs`, issue signed JWT tokens containing role claims (`CUSTOMER` or `STAFF`), and enforce backend role guards on protected endpoints.
  * **Frontend:** Provide a streamlined login view displaying quick-fill buttons for seeded demo accounts (`staff@singslot.local` and `customer1@singslot.local`), manage JWT state, and dynamically render navigation links based on role.
* **API Specifications:**
  * `POST /api/auth/login`
    * Request: `{ "email": "staff@singslot.local", "password": "Pass1234!" }`
    * Success Response (200 OK):
      ```json
      {
        "success": true,
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "user": { "id": "u-staff-01", "fullName": "Cashier Staff", "role": "STAFF" }
      }
      ```
    * Invalid Credentials (401 Unauthorized):
      ```json
      { "success": false, "error": { "code": "INVALID_CREDENTIALS", "message": "Email or password incorrect" } }
      ```
  * `GET /api/auth/me` (Protected with Bearer Token): Retrieves active user profile.

---

### 1.2 Contract 2: Room Catalog & Real-Time Availability Query (F-02, F-03)
* **Linked Requirements:** FR-02, FR-03, BR-03
* **Component Responsibilities:**
  * **Backend:** Query seeded rooms (S01–S03, M01–M03, L01–L03) and join with `BOOKING_SLOT` to return 14 hourly slots (10:00–24:00) with boolean availability flags for any specified calendar date.
  * **Frontend:** Display date-picker and room cards grouped by tier with interactive time-slot grids.
* **API Specifications:**
  * `GET /api/availability?date=2026-11-10`
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
              { "slotIndex": 1, "time": "10:00-11:00", "isAvailable": true },
              { "slotIndex": 4, "time": "13:00-14:00", "isAvailable": false }
            ]
          }
        ]
      }
      ```

---

### 1.3 Contract 3: Customer Online Booking Engine & Conflict Prevention (F-04)
* **Linked Requirements:** FR-04, BR-01, BR-02, BR-04, BR-05, BR-06, NFR-03
* **Validation & Business Logic:**
  1. Boundary Check: `startSlot + durationHours - 1` must be $\le 14$ (cannot exceed 24:00).
  2. Duration Check: `durationHours` must be an integer between 1 and 5.
  3. Contiguous Availability Check: All slots in `[startSlot, startSlot + durationHours - 1]` must be unoccupied.
  4. Atomic Persistence: Create `BOOKING` record and associated `BOOKING_SLOT` records inside a single Prisma database transaction.
* **API Specifications:**
  * `POST /api/bookings/online` (Header: `Authorization: Bearer <CustomerToken>`)
    * Request Body:
      ```json
      {
        "roomId": "r-s01",
        "bookingDate": "2026-11-10",
        "startSlot": 1,
        "durationHours": 3,
        "partySize": 3
      }
      ```
    * Success Response (201 Created):
      ```json
      {
        "success": true,
        "booking": {
          "bookingCode": "BK-20261110-001",
          "roomNumber": "S01",
          "date": "2026-11-10",
          "timeRange": "10:00 - 13:00",
          "duration": 3,
          "status": "CONFIRMED"
        }
      }
      ```
    * Conflict Rejection (409 Conflict):
      ```json
      {
        "success": false,
        "error": { "code": "SLOT_CONFLICT", "message": "One or more selected slots are already booked." }
      }
      ```

---

### 1.4 Contract 4: Customer "My Bookings" & Staff Master Schedule Views (F-05, F-06)
* **Linked Requirements:** FR-05, FR-06, BR-07, BR-08, NFR-02
* **Component Responsibilities:**
  * **Backend:**
    * `GET /api/bookings/my`: Returns reservations where `userId == token.sub`.
    * `GET /api/bookings/master`: Returns all reservations across all rooms on a specified date (Staff role only).
  * **Frontend:**
    * Customer view: Clean card list of user's personal active and past bookings.
    * Staff view: Comprehensive calendar grid showing room occupancy across all 9 rooms.

---

## 2. Acceptance Criteria (AC)

| AC ID | Feature | Scenario | Observable Expected Outcome |
|---|---|---|---|
| **AC-01** | F-01 | User logs in with valid seeded credentials | Receives HTTP 200, JWT token, and profile with assigned role. |
| **AC-01b** | F-01 | Customer requests protected Staff endpoint (`GET /api/bookings/master`) | Server rejects request with HTTP 403 Forbidden. |
| **AC-02** | F-02 | Client requests room catalog | Receives full fleet of 9 rooms (S01–S03, M01–M03, L01–L03) with capacity specs. |
| **AC-03** | F-03 | Client queries availability for a specific date | Server returns 14 slots for each room with accurate `isAvailable` flags. |
| **AC-04a** | F-04 | Customer reserves 1–5 contiguous open slots | Reservation succeeds (HTTP 201), slots marked unavailable in subsequent queries. |
| **AC-04b** | F-04 | Customer attempts to book across an occupied slot (e.g., Slots 1–4 where Slot 4 is taken) | Request is rejected with HTTP 409 Conflict; no slots are modified. |
| **AC-04c** | F-04 | Customer submits a reservation for a past date or elapsed slot | Request is rejected with HTTP 400 Bad Request. |
| **AC-04d** | F-04 | Customer specifies party size exceeding room capacity (e.g., 6 guests in Small room) | Request is rejected with HTTP 400 Bad Request. |
| **AC-04e** | F-04 | Two concurrent requests attempt to reserve the same room and slot simultaneously | Exactly one request returns HTTP 201; competing request receives HTTP 409 Conflict. |
| **AC-05** | F-05 | Customer accesses "My Bookings" | Displays strictly the reservations placed by the authenticated customer. |
| **AC-05b** | F-05 | Customer attempts to read another user's reservation ID via API | Server returns HTTP 403 Forbidden. |
| **AC-06** | F-06 | Staff accesses Master Schedule | Displays comprehensive schedule matrix of all reservations across all rooms. |

---

## 3. Software Test Specification (STS)

| Test ID | Linked AC | Level | Preconditions / Input | Test Action | Expected Result |
|---|---|---|---|---|---|
| **TEST-01** | AC-01 | API Integration | Seeded user: `staff@singslot.local` / `Pass1234!` | `POST /api/auth/login` | HTTP 200, JWT token returned with `role: "STAFF"` |
| **TEST-01b** | AC-01b | Security Access | Customer Bearer Token | `GET /api/bookings/master` | HTTP 403 Forbidden, private schedule withheld |
| **TEST-02** | AC-02 | Unit / API | Seeded database with room records | `GET /api/rooms` | HTTP 200, array of 9 rooms with capacities 4, 8, 12 |
| **TEST-03** | AC-03 | API Integration | Room S01 has Slot 4 booked on target date | `GET /api/availability?date=...` | Slot 4 indicates `isAvailable: false`, others `true` |
| **TEST-04a** | AC-04a | API Integration | Customer token, Room S01 open in Slots 1–3 | `POST /api/bookings/online` (start=1, duration=3) | HTTP 201 Created, booking stored, slots 1–3 marked reserved |
| **TEST-04b** | AC-04b | Domain Rule (TDD) | Room S01 has Slot 4 already booked | Submit booking for Slot 1 with duration=4 | HTTP 409 Conflict, error `SLOT_CONFLICT`, state unchanged |
| **TEST-04c** | AC-04c | Domain Rule | Booking date is yesterday | `POST /api/bookings/online` with past date | HTTP 400 Bad Request, error `CANNOT_BOOK_PAST_SLOT` |
| **TEST-04d** | AC-04d | Domain Rule | Small room (capacity 4) with `partySize: 6` | `POST /api/bookings/online` | HTTP 400 Bad Request, error `EXCEEDS_CAPACITY` |
| **TEST-04e** | AC-04e | Concurrency Suite | Two parallel requests for S01 Slot 5 | Execute concurrent `POST` via `Promise.all` | Exactly one 201 Created and one 409 Conflict |
| **TEST-05** | AC-05 | API Integration | Users Alice and Bob have bookings | Alice calls `GET /api/bookings/my` | Response contains exclusively Alice's bookings |
| **TEST-05b** | AC-05b | Security Access | Alice calls `GET /api/bookings/:bobBookingId` | Request made with Alice's Bearer token | HTTP 403 Forbidden |

---

## 4. Product Definition of Done (DoD)

Sprint 1 deliverables achieve complete Definition of Done status only when:
1. **Implementation Delivery:** Features F-01 through F-06 are implemented across frontend, backend, and persistence tiers.
2. **Automated Verification:** All test specifications (`TEST-01` through `TEST-05b`) execute and pass without skipping.
3. **TDD Verification Trail:** Explicit Git commit history demonstrates failing test executions prior to implementation for key business rules (`TEST-04b` and `TEST-01b`), followed by passing executions.
4. **Substantive Peer Review:** All feature branches are merged via reviewed Pull Requests into `sprint-1-staging` with teammate reviews addressing logic, tests, and contracts.
5. **Reproducible Local Setup:** Clear deployment and execution commands documented in `README.md` enable fresh installation and execution.
