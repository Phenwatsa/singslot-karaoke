# Software Requirements Specification (SRS)
## Project: SingSlot — Karaoke Room Reservation & Management System
**Course:** CPE 334 Introduction to Software Engineering in the Age of AI Agents  
**Theme:** Topic 1 — Appointment and Scheduling System  
**Document Version:** 1.2.0 (Rigorous Engineering Baseline)  
**Date:** November 2026  

---

## 1. Stakeholder Problem & Context

### 1.1 Context
**SingSlot** is an appointment and room reservation system designed for a single-venue private karaoke establishment. The facility provides 9 private karaoke rooms across three distinct capacity tiers (Small, Medium, Large) operating daily between **10:00 and 24:00 (Midnight) ICT (UTC+7)**, divided into **14 discrete 1-hour slots (indexed 0 to 13)**.

The system manages inventory across two operational booking channels:
1. **Online Customer Booking (Sprint 1 Golden Slice):** Authenticated customers browse server-calculated availability, select 1 to 5 contiguous hourly slots, and book reservations online.
2. **Staff Cashier Operations:** Staff inspect the venue-wide Master Schedule to monitor occupancy and manage customer turnover. (On-premise walk-ins and slot maintenance blockouts are formally scheduled for Sprint 2).

All operations interact with a persistent PostgreSQL database enforcing strict ACID transactions and composite unique constraints to guarantee zero double bookings.

### 1.2 Stakeholder Problem
* **Booking Collisions:** Manual ledgers and uncoordinated channels cause overlapping reservations for the same room.
* **Contiguous Availability Complexity:** Karaoke reservations span 1 to 5 consecutive hours. Determining contiguous slot vacancy manually is slow and error-prone.
* **Data Isolation & Visibility:** Customers require private access strictly to their own reservations, while staff need an authoritative master schedule.

---

## 2. Actors & User Roles

| Role ID | Role Name | System Capabilities & Permissions |
|---|---|---|
| **ACT-01** | **Customer** | Authenticated patron. Can log in/out with seeded accounts, view active user identity (`/api/auth/me`), query room catalog and availability, submit 1–5 contiguous hour bookings online, view personal booking history (`/api/bookings/my`), and inspect personal booking details (`/api/bookings/:id`). Blocked from staff endpoints and other customers' reservations. |
| **ACT-02** | **Staff** | On-premise venue employee. Can log in/out with seeded staff accounts, view active identity, query room availability, and inspect the venue-wide Master Schedule (`/api/bookings/master`) across all 9 rooms. Has administrative override to view all bookings. |

---

## 3. Product Scope & Operational Boundaries

### 3.1 In-Scope (System Baseline)
* **Venue Model:** Single-venue establishment located in Bangkok (Timezone: `Asia/Bangkok`, ICT, UTC+7).
* **Operating Hours & Slot Indexing:** 10:00–24:00 daily, partitioned into 14 slots:
  * `slotIndex: 0` = 10:00–11:00
  * `slotIndex: 1` = 11:00–12:00
  * ...
  * `slotIndex: 13` = 23:00–24:00
* **Pre-Seeded Room Fleet (9 Rooms):**
  * **Small (S01, S02, S03):** Maximum capacity 4 guests.
  * **Medium (M01, M02, M03):** Maximum capacity 8 guests.
  * **Large (L01, L02, L03):** Maximum capacity 12 guests.
* **Booking Model:** 1 to 5 contiguous hourly slots in the same room. Exclusive lock per room-slot combination.
* **Server-Calculated Availability:** Availability is determined dynamically on request by checking active confirmed bookings (`status == 'CONFIRMED'`) and active maintenance blocks (`RoomBlock`).
* **Sprint 1 Golden Slice:** Seeded authentication, session lifecycle, room catalog, availability query, customer online booking, personal booking detail & list, and staff master schedule.

### 3.2 Explicit Exclusions
1. **No Real Payment Gateway:** Financial checkout is simulated via confirmed status transitions.
2. **No Food & Beverage Ordering:** In-room catering is excluded.
3. **No Loyalty Points / Promotions:** Points and discounts are excluded.
4. **No Multi-Branch Architecture:** Single establishment only.
5. **No SMS / External Push Notifications:** Alerts are confined to the web interface.
6. **No Self-Registration in Sprint 1:** Seeded accounts are used per Section 5.2; self-registration is allocated to Sprint 3.
7. **No Room Management CRUD in Sprint 1:** Seeded database fleet is used; dynamic CRUD is allocated to Sprint 3.

---

## 4. Functional Requirements (FR)

| FR ID | Functional Requirement Description | Actor | Delivery Sprint |
|---|---|---|---|
| **FR-01** | The system shall provide secure authentication for Customer and Staff, supporting Login (`POST /api/auth/login`), Logout (`POST /api/auth/logout`), and Current User inspection (`GET /api/auth/me`). | ACT-01, ACT-02 | **Sprint 1** |
| **FR-02** | The system shall display the room catalog (9 rooms, S01–S03, M01–M03, L01–L03) with capacity tier boundaries. | ACT-01, ACT-02 | **Sprint 1** |
| **FR-03** | The system shall provide a server-calculated availability query (`GET /api/availability?date=YYYY-MM-DD`) returning 14 hourly slots (0..13) per room. | ACT-01, ACT-02 | **Sprint 1** |
| **FR-04** | The system shall allow Customers to submit an online booking (`POST /api/bookings/online`) for 1–5 contiguous open slots within operating hours. | ACT-01 | **Sprint 1** |
| **FR-05** | The system shall provide a "My Bookings" endpoint (`GET /api/bookings/my`) and a Booking Detail endpoint (`GET /api/bookings/:id`) enforcing data ownership. | ACT-01, ACT-02 | **Sprint 1** |
| **FR-06** | The system shall provide a Master Schedule inspection endpoint (`GET /api/bookings/master?date=YYYY-MM-DD`) restricted to Staff. | ACT-02 | **Sprint 1** |
| **FR-07** | The system shall allow Staff to submit on-premise walk-in bookings (`POST /api/bookings/walk-in`) via the cashier dashboard. | ACT-02 | **Sprint 2** |
| **FR-08** | The system shall allow Staff to create and remove room maintenance blockouts (`RoomBlock`), rejecting blocks that overlap confirmed bookings. | ACT-02 | **Sprint 2** |
| **FR-09** | The system shall support booking cancellation (`PATCH /api/bookings/:id/cancel`) subject to the 24-hour advance policy, releasing reserved slots. | ACT-01, ACT-02 | **Sprint 2** |
| **FR-10** | The system shall support booking rescheduling (`PATCH /api/bookings/:id/reschedule`) to open slots subject to the 24-hour advance policy. | ACT-01, ACT-02 | **Sprint 2** |
| **FR-11** | The system shall provide multi-criteria search and filtering for bookings (by phone, date, room). | ACT-02 | **Sprint 2** |
| **FR-12** | The system shall allow Customers to self-register an account online (`POST /api/auth/register`). | ACT-01 | **Sprint 3** |
| **FR-13** | The system shall provide Room Management CRUD (create/update rooms and rates) for Staff. | ACT-02 | **Sprint 3** |
| **FR-14** | The system shall generate operational summaries (occupancy rates and peak hours). | ACT-02 | **Sprint 3** |

---

## 5. Business Rules (BR)

| BR ID | Business Rule Title | Observable & Testable Operational Logic | Verified In |
|---|---|---|---|
| **BR-01** | **Contiguous Slot Rule** | A booking duration of $N$ hours ($1 \le N \le 5$) requires $N$ consecutive available slots in the same room. All slots in `[startSlot, startSlot + duration - 1]` must be unoccupied. Booking across any occupied slot is rejected with HTTP 409 `SLOT_CONFLICT`. | **Sprint 1** |
| **BR-02** | **Exclusive Room Lock** | A room cannot accommodate overlapping confirmed reservations or active maintenance blocks. Strictly one active claim can exist per room-date-slot tuple. Enforced by database unique constraints. | **Sprint 1** |
| **BR-03** | **Operating Hours Boundary** | Operating hours are 10:00 to 24:00 ICT. Slot index must be $0 \le \text{slotIndex} \le 13$. The end slot index (`startSlot + duration - 1`) must not exceed 13. Out-of-bounds requests are rejected with HTTP 400 `INVALID_DURATION`. | **Sprint 1** |
| **BR-04** | **Past Slot Rejection** | Bookings for dates or slots that have already started or elapsed relative to current authoritative server time (`Asia/Bangkok`) are rejected with HTTP 400 `CANNOT_BOOK_PAST_SLOT`. | **Sprint 1** |
| **BR-05** | **Capacity Limit** | Party size must be $\ge 1$ and cannot exceed room maximum capacity (Small $\le 4$, Medium $\le 8$, Large $\le 12$). Violations are rejected with HTTP 400 `EXCEEDS_CAPACITY`. | **Sprint 1** |
| **BR-06** | **Concurrent Booking Prevention** | Simultaneous requests targeting the exact same room and slot index execute inside an isolated transaction. Exactly one request succeeds (HTTP 201) and competing attempts are rejected (HTTP 409 Conflict). | **Sprint 1** |
| **BR-07** | **Data Isolation & Ownership** | Customers are authorized strictly to view their own bookings. Accessing `GET /api/bookings/:id` where `booking.userId != req.user.id` is rejected with HTTP 403 `FORBIDDEN`. Staff accounts are authorized to inspect any booking. | **Sprint 1** |
| **BR-08** | **Staff Operational Boundary** | Endpoints under `/api/bookings/master` and administrative operations require authenticated `STAFF` role credentials. Unprivileged access returns HTTP 403 `FORBIDDEN`. | **Sprint 1** |
| **BR-09** | **24-Hour Advance Cancellation Notice** | A booking can be cancelled or rescheduled if and only if authoritative server time is at least 24 hours prior to the booking start time: `serverTime <= (bookingDate + startSlotTime) - 24 hours`. Exactly 24 hours remaining is permitted; less than 24 hours is rejected with HTTP 400 `CANCELLATION_WINDOW_EXPIRED`. Upon cancellation, `status` becomes `CANCELLED` and occupied `BookingSlot` records are removed. | **Sprint 2** |
| **BR-10** | **Maintenance Block Non-Conflict** | Staff cannot create a `RoomBlock` over slots that have active `CONFIRMED` bookings. Requests overlapping existing bookings are rejected with HTTP 409 `BLOCK_CONFLICT`. | **Sprint 2** |

---

## 6. Non-Functional Requirements (NFR)

| NFR ID | Attribute | Measurable Target & Pass/Fail Threshold | Verification Environment & Method | Sprint |
|---|---|---|---|---|
| **NFR-01** | **Password Security** | All stored passwords must be hashed using `bcrypt` with salt rounds $\ge 10$. Plaintext passwords must never appear in database records, responses, or log files. | Local test suite; database inspection test verifying hash prefix `$2a$` or `$2b$` and salt complexity. | **Sprint 1** |
| **NFR-02** | **Authorization Enforcement** | Requests with invalid tokens, missing tokens, or unprivileged roles must be rejected with HTTP 401 or HTTP 403 within latency $\le 50$ ms. | Automated Supertest security suite measuring response status and latency threshold. | **Sprint 1** |
| **NFR-03** | **Transactional Integrity** | Multi-slot bookings must execute inside an ACID database transaction. Injected runtime failures before commit must cause 100% rollback (zero partial `Booking` or `BookingSlot` rows). | Automated fault-injection integration test asserting zero database side-effects after simulated exception. | **Sprint 1** |
| **NFR-04** | **Availability Query Latency** | `GET /api/availability?date=...` must respond in $\le 200$ ms on a database containing at least 50 pre-existing bookings across the 9 rooms. | Automated Supertest benchmark under local test runner with database fixtures. | **Sprint 2** |
| **NFR-05** | **Container Readiness & Durability** | Frontend and Backend build cleanly into Docker containers. Database migrations execute automatically, and data persists across container restart cycles. | Automated bash verification script executing container build, run, restart, and data query. | **Sprint 2 / Lab 5** |

---

## 7. Assumptions & Resolved Technical Decisions

1. **Primary Database:** **PostgreSQL** is the sole authoritative database system for SingSlot to maintain consistency with Lab 5 Docker/GCP specifications and ACID row-level locking.
2. **Discrete 0-Based Slot Indexing:** Operating slots are indexed $0$ through $13$ (Slot 0 = 10:00–11:00, Slot 13 = 23:00–24:00).
3. **Session & Token Lifecycle:** 
   - Authentication utilizes stateless signed JSON Web Tokens (JWT) with an 8-hour expiration window.
   - **Logout Semantics:** Logout (`POST /api/auth/logout`) formally discards the client-side token. In Sprint 1, stateless JWT tokens expire naturally after 8 hours; token blocklisting or server-side revocation tables are documented as future hardening scope.
4. **Data Model Relationship:** `Booking` is the parent record containing booking metadata (`bookingCode`, `partySize`, `status: "CONFIRMED" | "CANCELLED"`). `BookingSlot` models individual 1-hour physical slot occupancy, linked via foreign key `bookingId`.
