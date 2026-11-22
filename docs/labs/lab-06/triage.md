# Incoming Defect Triage Report (Lab 6 — Part C)

## Project: SingSlot — Karaoke Room Reservation & Management System
**Course:** CPE 334 Introduction to Software Engineering in the Age of AI Agents (1/2026)  
**Deliverable:** Lab 6 — Part C: Incoming Defect Triage (20 pts)  
**GitHub Issue:** [Issue #35](https://github.com/Phenwatsa/singslot-karaoke/issues/35) (`[Lab 6 - Issue 4] Defect Triage, Partner Retest Verification & UAT Acceptance Decision`)  
**Triage Owner / QA Lead:** @lephirada (SingSlot QA)  
**Peer Reviewer:** @Phenwatsa (SingSlot Lead Developer)  
**Reporting Team:** Whatsss Team (@Pilaiwan3492 & @Apichaya251400)  
**Evaluated Release:** `v0.1.0-sprint1` (Commit `aa5f109b97c157a143a7a9a94cd58dc02998467e` | Cloud Run Revision `singslot-00004-6mv`)  
**Live URL Evaluated:** `https://singslot-4o7kwmd5ma-as.a.run.app`  
**Date of Triage:** 22 November 2026  

---

## 1. Triage Classification Framework

In accordance with course guidelines for Lab 6 Part C, all incoming partner findings must be rigorously evaluated against the agreed **Sprint 1 System Requirements Specification (`docs/system-specifications/srs.md`)** and **Sprint 1 Interface Contracts (`docs/sprints/sprint-1/contracts.md`)**. Each finding is classified into exactly one of four formal categories:

| Triage Category | Definition & Criteria |
| :--- | :--- |
| **Accepted Defect** | A genuine defect that violates explicit Sprint 1 requirements, business rules, or interface contracts, causing functional failure, data corruption, or runtime crash. Requires immediate TDD reproduction and code fix in Sprint 1. |
| **Duplicate** | An issue that describes the identical underlying root cause or failure mechanism as another previously triaged defect in the current backlog. |
| **Not-Defect** | An observed behavior that is fully consistent with the agreed Sprint 1 specification, contracts, or architectural constraints (e.g., behavior by-design). |
| **Enhancement** | A proposed improvement, extra feature, or security hardening measure that falls outside the agreed lean scope of Sprint 1 (deferred to future sprints). |

---

## 2. Summary of Partner Findings & Triage Decisions

| Defect ID | Partner Finding Summary | Reported Severity | Triage Classification | Priority & Target Resolution |
| :---: | :--- | :---: | :---: | :---: |
| **`DEF-SS-01`** | TOCTOU Race Condition Between Online Booking (`BookingSlot`) and Maintenance Block (`RoomBlock`) | **Critical** | **Accepted Defect** | **P0 (Release-Blocking)**<br>Assigned to @Phenwatsa (Issue #34) |
| **`DEF-SS-02`** | Latent "Zombie Slot" Permanent 409 Lockout When Booking Transitions to `CANCELLED` | **High** | **Accepted Defect** | **P1 (Release-Blocking)**<br>Assigned to @Phenwatsa (Issue #34) |
| **`DEF-SS-03`** | Unhandled Prisma P2002 Crash (`HTTP 500`) on `bookingCode` Collision | **High** | **Accepted Defect** | **P1 (Release-Blocking)**<br>Assigned to @Phenwatsa (Issue #34) |
| **`DEF-SS-04 (4A)`** | JWT Stored in `localStorage` (`singslot_token`) Instead of `HttpOnly` Cookies | **Medium** | **Not-Defect** | **Closed (By Design per Contract)**<br>No code change required in Sprint 1 |
| **`DEF-SS-04 (4B)`** | Permissive Wildcard CORS (`app.use(cors())`) | **Medium** | **Enhancement** | **P3 (Deferred to Sprint 2/3)**<br>Single-origin container in Sprint 1 |

---

## 3. Detailed Triage Analysis & Justification

### 📌 Finding 1: `DEF-SS-01`
- **Partner Title:** TOCTOU Race Condition Between Online Booking (`BookingSlot`) and Maintenance Block (`RoomBlock`)
- **Affected Endpoints:** `POST /api/bookings/online` & Staff Maintenance Blocking
- **Affected Code:** `server/src/controllers/booking.controller.ts#L156-L183`, `#L190-L230`; `server/prisma/schema.prisma#L84-L114`
- **Partner Reported Severity:** Critical
- **Triage Decision:** **`Accepted Defect`** (Priority: P0 — Release-Blocking)
- **Technical Analysis & Root Cause:**
  - `createOnlineBooking` performs an initial vacancy pre-check (`prisma.roomBlock.findMany(...)`) outside the database transaction.
  - While PostgreSQL transaction isolation protects writes, `booking_slots` and `room_blocks` are separate tables with independent uniqueness constraints.
  - If a maintenance block is committed concurrently after the outer pre-check succeeds and before the booking transaction commits, the booking transaction commits successfully without re-verifying `room_blocks`.
  - This allows an active customer booking slot and a room maintenance block to coexist on the exact same room, date, and hour.
- **Specification & Contract Compliance Justification:**
  - **`BR-02` (Room Availability):** Explicitly specifies that rooms flagged for maintenance cannot be scheduled for customer bookings.
  - **`BR-06` (No Overlapping Bookings):** Strictly mandates that a room cannot have overlapping occupancy for the identical time slot.
  - **`NFR-03` (Data Integrity):** Requires transaction ACID guarantees preventing conflicting states.
- **Required Action:**
  - Accepted for immediate resolution. Developer must reproduce via automated concurrency test (TDD RED) and implement transactional exclusive row lock (`SELECT ... FOR UPDATE`) re-verifying `room_blocks` inside the transaction (TDD GREEN).

---

### 📌 Finding 2: `DEF-SS-02`
- **Partner Title:** Latent "Zombie Slot" Permanent Lockout When Booking Status Transitions to `CANCELLED`
- **Affected Endpoints:** `GET /api/availability` & `POST /api/bookings/online`
- **Affected Code:** `server/prisma/schema.prisma#L26-L29`, `#L95`; `server/src/controllers/availability.controller.ts#L86-L97`; `server/src/controllers/booking.controller.ts#L157-L164`
- **Partner Reported Severity:** High
- **Triage Decision:** **`Accepted Defect`** (Priority: P1 — Release-Blocking)
- **Technical Analysis & Root Cause:**
  - `GET /api/availability` calculates available slots by checking for slots with active `booking: { status: 'CONFIRMED' }`. If a booking is `CANCELLED`, the slot correctly displays as available (`isAvailable: true`).
  - However, in `schema.prisma`, `BookingSlot` enforces `@@unique([roomId, bookingDate, slotIndex])` across *all* rows without filtering on booking status.
  - When a booking is marked `CANCELLED` but retains its `BookingSlot` rows, any incoming customer attempting to book that advertised available slot triggers a database unique constraint violation (`P2002`), which is returned as `409 SLOT_CONFLICT`, permanently blocking the slot from being booked.
- **Specification & Contract Compliance Justification:**
  - **`FR-03` (Room Availability Calculation) & `AC-03`:** Mandates that slots without active confirmed bookings must be available for booking.
  - **`FR-04` (Customer Booking) & `AC-04a`:** Mandates that available slots must successfully yield a `CONFIRMED` booking. A permanent 409 lock on an available slot violates core booking capability.
- **Required Action:**
  - Accepted for immediate resolution. Developer must reproduce via TDD and ensure that any orphaned `BookingSlot` rows associated with `CANCELLED` bookings are cleaned up within the locked booking transaction.

---

### 📌 Finding 3: `DEF-SS-03`
- **Partner Title:** Unhandled `P2002` Crash (`HTTP 500`) on `bookingCode` Collision
- **Affected Endpoints:** `POST /api/bookings/online` (`generateBookingCode`)
- **Affected Code:** `server/src/controllers/booking.controller.ts#L10-L14`, `#L186`, `#L250-L275`; `server/src/app.ts#L129-L141`
- **Partner Reported Severity:** High
- **Triage Decision:** **`Accepted Defect`** (Priority: P1 — Release-Blocking)
- **Technical Analysis & Root Cause:**
  - `generateBookingCode` produces a 4-character random alphanumeric suffix (`BK-YYYYMMDD-XXXX`).
  - While collision probability is small on low volume, collisions will eventually occur under the Birthday Paradox.
  - The controller's catch block only handled `P2002` on slot conflicts; a collision on the unique `bookingCode` column fell through and crashed the request with unhandled `HTTP 500 INTERNAL_SERVER_ERROR`, dropping valid bookings.
- **Specification & Contract Compliance Justification:**
  - **`FR-04` & `AC-04a`:** Mandates that valid customer bookings return `HTTP 201 Created` with a unique booking confirmation code.
  - **`NFR-03` (Reliability):** Transient code collisions must be handled gracefully by the service layer rather than failing with server crash responses.
- **Required Action:**
  - Accepted for immediate resolution. Developer must reproduce via TDD and implement an automatic retry loop (`MAX_CODE_RETRIES = 5`) that regenerates a fresh booking code when a `P2002` collision on `bookingCode` occurs.

---

### 📌 Finding 4A: `DEF-SS-04 (Part A)`
- **Partner Title:** JWT Stored in `localStorage` (`singslot_token`) Instead of `HttpOnly` Cookies
- **Affected Component:** Client Session Storage (`client/src/utils/session.ts`)
- **Partner Reported Severity:** Medium
- **Triage Decision:** **`Not-Defect`** (Status: Closed / By Design per Contract)
- **Technical Analysis & Specification Justification:**
  - The partner team recommends migrating authentication tokens to `HttpOnly; Secure; SameSite=Lax` cookies to mitigate potential XSS token theft.
  - However, consulting the agreed system specifications:
    1. **`docs/system-specifications/srs.md` §7.3 (Authentication & Authorization):** Explicitly specifies that user sessions are authenticated using stateless signed Bearer JWTs transmitted in JSON response payloads and stored client-side in browser storage.
    2. **`docs/sprints/sprint-1/contracts.md` (Contract 1: Authentication & RBAC, `AC-01`, `AC-01e`):** Explicitly defines that `POST /api/auth/login` returns `{ token: string, user: {...} }` and the client manages the session via `localStorage.getItem('singslot_token')`.
    3. The Sprint 1 automated integration test suites and UAT specifications rely directly on `Authorization: Bearer <token>` HTTP headers.
  - Altering token transport to cookies in Sprint 1 would directly violate the frozen Sprint 1 Interface Contract.
- **Conclusion:**
  - Classified as **Not-Defect (By Design)**. The implementation strictly complies with the Sprint 1 contract.

---

### 📌 Finding 4B: `DEF-SS-04 (Part B)`
- **Partner Title:** Permissive Wildcard CORS Configuration (`app.use(cors())`)
- **Affected Component:** Express Application Middleware (`server/src/app.ts#L17`)
- **Partner Reported Severity:** Medium
- **Triage Decision:** **`Enhancement`** (Priority: P3 — Deferred to Sprint 2/3)
- **Technical Analysis & Justification:**
  - The partner team observes that `app.use(cors())` defaults to `Access-Control-Allow-Origin: *`.
  - In our production architecture on Google Cloud Run (`https://singslot-4o7kwmd5ma-as.a.run.app`), the React SPA static build and Express API are bundled and served from the exact same container origin (`port 8080`), so cross-origin requests do not occur in production.
  - Adding an explicit trusted-origin whitelist via environment variables is a valuable security hardening enhancement, but does not represent a functional defect or breach of Sprint 1 requirements.
- **Conclusion:**
  - Classified as **Enhancement**. Logged for architectural hardening in Sprint 2/3. Non-blocking for Sprint 1 release.

---

## 4. Triage Handoff to Development Team

Based on this triage evaluation:
1. **Defects Accepted for Resolution in Sprint 1:**
   - `DEF-SS-01` (Critical)
   - `DEF-SS-02` (High)
   - `DEF-SS-03` (High)
2. **Assigned Engineering Task:**
   - Lead Developer @Phenwatsa will implement TDD reproduction and resolution on branch `fix/lab6-issue-3-defect-resolution` ([PR #39](https://github.com/Phenwatsa/singslot-karaoke/pull/39)), targeting `sprint-1-staging` and promoting to `main` for Cloud Run redeployment.
3. **Next QA Action (Retest Coordination):**
   - Once redeployment is live, SingSlot QA (@lephirada) will prepare the formal Retest Coordination Package with reproduction steps and coordinate with Whatsss UAT Team for independent verification on the live Cloud Run URL.

---
*Report authored by @lephirada (SingSlot QA Lead) — Issue #35*
