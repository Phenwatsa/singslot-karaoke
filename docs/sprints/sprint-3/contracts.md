# Sprint 3 Engineering Contracts & Test Specifications
## Project: SingSlot — Karaoke Room Reservation & Management System
**Course:** CPE 334 Introduction to Software Engineering in the Age of AI Agents  
**Document Version:** 1.0.0 (Pre-Implementation Contract Baseline — `[D2 - Issue 1]`)  
**Date:** November 2026  

---

## 1. Sprint 3 Delivery Strategy
* **Deliverable 2 Checkpoint (Due 29 Nov 2026):** All Sprint 3 contracts (`F-11`–`F-14`) are fully specified here, and **`F-11` (Customer Self-Registration)** is selected as the implemented & tested Sprint 3 vertical slice in the Deliverable 2 release candidate (`v0.3.0-rc1`).
* **Final Release (Due 13 Dec 2026):** `F-12` (Room Management CRUD), `F-13` (Occupancy & Summary Reports), and `F-14` (UAT Defect Fixes, UI Polish & Final Video) are scheduled for completion after the 1–11 December examination period.

---

## 2. Sprint 3 Feature Contracts

### 2.1 Contract 10: Customer Self-Registration (`F-11`) — *Implemented in Deliverable 2*
* **Linked Requirements:** `FR-12`, `NFR-01`, `NFR-02`
* **Data Layer:** Uses existing `User` model (`id`, `email`, `passwordHash`, `fullName`, `phone`, `role`). No schema migration required.
* **Component Responsibilities:**
  * **Backend:** Public endpoint `POST /api/auth/register`:
    * Validates `email` (valid email format, normalized lowercase/trimmed), `password` (minimum 8 characters), `fullName` (non-empty string), and optional `phone`. Invalid input returns `400 INVALID_INPUT`.
    * Checks uniqueness on `email`; duplicate email returns `409 EMAIL_ALREADY_EXISTS`.
    * Hashes password with `bcrypt` using `saltRounds >= 10` (`NFR-01`).
    * Strictly hardcodes `role: "CUSTOMER"` on creation, ignoring any client-supplied `role` field to prevent privilege escalation.
  * **Frontend:** Registration view/tab linked from the Login screen inside `<AppLayout>` and `<GlassCard>`. On success, displays confirmation and allows immediate sign-in via `POST /api/auth/login`.
* **API Specifications:**
  * `POST /api/auth/register` (Public — no auth header required)
    * Request Body:
      ```json
      {
        "email": "newcustomer@singslot.local",
        "password": "StrongPass123!",
        "fullName": "New Customer",
        "phone": "0899998888"
      }
      ```
    * Success Response (`201 Created`):
      ```json
      {
        "success": true,
        "user": {
          "id": "u-cust-new-01",
          "email": "newcustomer@singslot.local",
          "fullName": "New Customer",
          "phone": "0899998888",
          "role": "CUSTOMER"
        }
      }
      ```
    * Duplicate Email (`409 Conflict`):
      ```json
      {
        "success": false,
        "error": { "code": "EMAIL_ALREADY_EXISTS", "message": "An account with this email already exists." }
      }
      ```

---

### 2.2 Contract 11: Room Management CRUD (`F-12`) — *Planned for Final Release*
* **Linked Requirements:** `FR-13`, `BR-08`, `BR-12`, `NFR-02`
* **Data Layer:** Uses `Room` model (`roomNumber`, `type`, `capacity`, `hourlyRate`, `description`, `isActive`).
* **Component Responsibilities:**
  * **Backend:** All mutation endpoints restricted to `STAFF` role (`403 FORBIDDEN` for `CUSTOMER`, `401` if unauthenticated).
    * `POST /api/rooms`: Create room with unique `roomNumber` (`409 ROOM_ALREADY_EXISTS` on duplicate), `type` (`SMALL|MEDIUM|LARGE`), `capacity > 0`, `hourlyRate > 0`.
    * `PATCH /api/rooms/:id`: Update `capacity`, `hourlyRate`, `description`, or `isActive`. Deactivating (`isActive: false`) hides the room from new online bookings without deleting historical `Booking` records.
    * `DELETE /api/rooms/:id`: Soft-deactivates the room (`isActive = false`, returning `200 OK` with updated room record) while preserving all historical `Booking` records and referential integrity (`onDelete: Restrict`).
  * **Frontend:** Staff Room Management table & modal inside `<AppLayout>` / `<GlassCard>`.
* **API Specifications:**
  * `POST /api/rooms` (`STAFF` only) → `201 Created` | `400 INVALID_INPUT` | `403 FORBIDDEN` | `409 ROOM_ALREADY_EXISTS`.
  * `PATCH /api/rooms/:id` (`STAFF` only) → `200 OK` | `400 INVALID_INPUT` | `403 FORBIDDEN` | `404 NOT_FOUND`.
  * `DELETE /api/rooms/:id` (`STAFF` only) → `200 OK` (`isActive: false`) | `403 FORBIDDEN` | `404 NOT_FOUND`.

---

### 2.3 Contract 12: Appointment Summary & Occupancy Reports (`F-13`) — *Planned for Final Release*
* **Linked Requirements:** `FR-14`, `BR-08`, `BR-12`, `NFR-02`
* **Data Layer:** Read-only aggregation over `Booking` (`status = 'CONFIRMED'`, `durationHours`, `totalPrice`, `channel`), `Room`, and `RoomBlock`.
* **Component Responsibilities:**
  * **Backend:** `GET /api/reports/summary?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` (`STAFF` only; `403 FORBIDDEN` for `CUSTOMER`).
    * Validates `startDate <= endDate` (`400 INVALID_INPUT` otherwise).
    * Computes per-room and total booked hours, occupancy rate (`bookedHours / (activeRooms * 14 * days) * 100`), total confirmed revenue (`SUM(totalPrice)`), channel breakdown (`ONLINE` vs `WALK_IN`), and peak-hour distribution by `slotIndex` (`0..13`).
  * **Frontend:** Staff Analytics / Reports dashboard inside `<AppLayout>` / `<GlassCard>` with date-range picker, KPI cards, and occupancy/peak-hour breakdown table.
* **API Specifications:**
  * `GET /api/reports/summary?startDate=2026-12-01&endDate=2026-12-07` (`STAFF` only)
    * Success Response (`200 OK`):
      ```json
      {
        "success": true,
        "range": { "startDate": "2026-12-01", "endDate": "2026-12-07" },
        "summary": {
          "totalConfirmedBookings": 24,
          "totalBookedHours": 58,
          "totalRevenue": 19500,
          "occupancyRatePercent": 6.58,
          "byChannel": { "ONLINE": 18, "WALK_IN": 6 },
          "peakSlots": [{ "slotIndex": 9, "bookedCount": 11 }],
          "byRoom": [
            { "roomId": "r-s01", "roomNumber": "S01", "type": "SMALL", "bookedHours": 12, "revenue": 2400, "occupancyRatePercent": 12.24 }
          ]
        }
      }
      ```

---

### 2.4 Contract 13: Hardening, UI Polish & Final Video (`F-14`) — *Planned for Final Release*
* **Linked Requirements:** All FRs, `DEF-SS-04 (4B)`, `NFR-05`
* **Scope:**
  1. Address remaining technical debt (`DEF-SS-04 (4B)` origin-restricted CORS configuration via `CORS_ORIGIN` env var).
  2. Final UI aesthetic polish across Customer and Staff views within `<AppLayout>`.
  3. Full end-to-end regression suite (`--runInBand`), UAT re-tests, and final demonstration video by 13 December 2026.

---

## 3. Acceptance Criteria (AC)

| AC ID | Target Feature | Scenario | Observable Expected Outcome | Target Milestone |
|---|---|---|---|---|
| **AC-12** | F-11 | New customer registers via `POST /api/auth/register` with valid data, duplicate email, and forged `role: "STAFF"` | Valid → `201 Created` (`role: "CUSTOMER"`, `bcrypt` hash, can login); Duplicate → `409 EMAIL_ALREADY_EXISTS`; Forged role → ignored (`role: "CUSTOMER"`). | **Deliverable 2** |
| **AC-13** | F-12 | Staff creates/updates/deactivates a room; Customer attempts same | Staff → `201`/`200`; deactivated room excluded from availability; Customer → `403 FORBIDDEN`. | **Final (13 Dec)** |
| **AC-14** | F-13 | Staff queries `/api/reports/summary` for a date range; Customer attempts same | Staff → `200 OK` with accurate hours, occupancy %, and revenue; Customer → `403 FORBIDDEN`. | **Final (13 Dec)** |
| **AC-14-POLISH** | F-14 | Production CORS & final regression check | Allowed origin succeeds; full suite passes 100%; demo video recorded. | **Final (13 Dec)** |

---

## 4. Software Test Specification (STS)

| Test ID | Linked AC | Level | Preconditions & Input | Test Action | Expected Result |
|---|---|---|---|---|---|
| **TEST-12** | AC-12 | API Integration & Security | Fresh email + existing email `customer1@singslot.local`; payload with `role: "STAFF"` | `POST /api/auth/register` (valid, duplicate, invalid password, forged role) + `POST /api/auth/login` | Valid → `201` + `role: "CUSTOMER"` + `bcrypt` hash in DB + login `200`; Duplicate → `409`; Invalid → `400`. |
| **TEST-13** | AC-13 | API Integration & Security | Staff token + Customer token | `POST /api/rooms`, `PATCH /api/rooms/:id`, and `DELETE /api/rooms/:id` by Staff, then by Customer | Staff → `201`/`200` (`DELETE` sets `isActive: false`, preserves historical bookings, and hides room from availability); Customer → `403 FORBIDDEN`. |
| **TEST-14** | AC-14 | API Integration & Security | Seeded fixtures: 2 `CONFIRMED` bookings (2 hrs `SMALL` `S01` ONLINE = 400 THB; 3 hrs `MEDIUM` `M01` WALK_IN = 1050 THB) + 1 `CANCELLED` booking in 1-day range (9 active rooms × 14 slots = 126 slots) | Staff calls `GET /api/reports/summary?startDate=...&endDate=...`; Customer calls same | Staff → `200 OK` with `totalConfirmedBookings = 2`, `totalBookedHours = 5`, `totalRevenue = 1450`, `occupancyRatePercent = 3.97`, `byChannel = { ONLINE: 1, WALK_IN: 1 }`, and `byRoom` containing `S01` (`bookedHours = 2`, `revenue = 400`) & `M01` (`bookedHours = 3`, `revenue = 1050`); Customer → `403 FORBIDDEN`. |
| **TEST-14-POLISH** | AC-14-POLISH | Security / Integration / Manual | Configured `CORS_ORIGIN`; full regression suite; UI & video checklist | Send request from allowed vs. disallowed origin; run `npm test -- --runInBand`; verify UI polish & demo video | Allowed origin succeeds; disallowed origin rejected by CORS; all automated suites pass 100%; UI & final video manually verified. |

---

## 5. Sprint 3 Definition of Done (DoD)
1. **Deliverable 2 Checkpoint:** `F-11` (`TEST-12`) implemented, tested (`--runInBand`), peer-reviewed, and deployed in `v0.3.0-rc1`; `F-12`–`F-14` contracts finalized.
2. **Final Release (13 Dec 2026):** `F-12`–`F-14` implemented, all tests (`TEST-01`–`TEST-14`) passing 100%, deployed on GCP, and final video submitted.
