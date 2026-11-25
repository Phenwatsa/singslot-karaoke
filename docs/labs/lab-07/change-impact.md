# Lab 7 Part A — Change Impact Analysis & Updated Engineering Contract

## Project: SingSlot — Karaoke Room Reservation & Management System

**Course:** CPE 334 Introduction to Software Engineering in the Age of AI Agents (Semester 1/2026)  
**Deliverable:** Lab 7 — Part A: Change Impact and Updated Contract (25 points)  
**Branch:** `docs/lab7-issue-1-contract-impact`  
**Primary Owner:** `@Phenwatsa` | **Pre-Implementation Reviewer:** `@lephirada`  
**Document Version:** `1.3.0` (Pre-Implementation Contract Revision)  
**Date:** 25 November 2026  

---

## 1. Approved Change Request Record

### 1.1 Baseline & Version Traceability

| Milestone / Reference | Branch / Tag | Commit SHA (Full) | Deployed Revision / Notes |
| :--- | :--- | :--- | :--- |
| **Original Accepted Sprint 1 Tag** | `v0.1.0-sprint1` (`main`) | `cc1c3d82d5c1bf3e635d4b68b2de4d1872abcd3a` | Original Sprint 1 Lean Delivery baseline (`FR-01`–`FR-06`, `BR-01`–`BR-08`) |
| **Accepted Lab 6 Sprint 1 Release** | `main` (PR #40) | `f3eb92d4ee5036fa6af0b6c36f1b903bcafb312d` | Cloud Run `singslot-00005-26q` (`https://singslot-4o7kwmd5ma-as.a.run.app`), accepted by Independent UAT on 2026-11-22 |
| **Pre-Change Staging Baseline** | `sprint-1-staging` (PR #41) | `676c7dfa599bc92f70104056b556fb42373c0c6b` | Identical runtime application code to `f3eb92d4` (only Lab 6 Part C/D documentation merged in PR #41) |
| **Contract Revision Target (This PR)** | `docs/lab7-issue-1-contract-impact` | *Recorded upon commit/merge* | **Documentation & Contract only** — precedes all Lab 7 test & code commits |

### 1.2 Approval Record
- **Approvers:** `@Phenwatsa` (Lead Developer) and `@lephirada` (QA Lead / Partner)
- **Approval Date:** `2026-11-25`
- **Authorization Basis:** Per the official CPE334 Lab 7 Spec Sheet Announcement (*"You need not get Instructor or TA Approval for your change request to Sprint 1. Think of a good change to Sprint 1 among yourselves, but do try to make it a complex enough added feature and not just a trivial change."*), the team jointly designed and approved this multi-rule adaptive maintenance change to Sprint 1 prior to code implementation.

### 1.3 Business Motivation
The accepted Sprint 1 Golden Online Booking Slice validated core availability, contiguous booking, data isolation, and concurrency locking, but lacked realistic venue operational controls and pricing transparency. Specifically:
1. Allowing online bookings up to 1 second before start time leaves staff zero turnover/sanitation lead time.
2. Allowing unrestricted 5-hour online bookings during peak evening hours (`18:00–22:00`) causes single-party prime-time room hoarding.
3. Having no per-customer daily hour cap allows a single account to monopolize multiple rooms all day.
4. Rooms and bookings carried no hourly pricing or server-authoritative total fare calculation.

### 1.4 Precise Old-to-New Behavior Specification (Boundaries, Invalid Cases & Access)

| Change Item | Linked IDs | Accepted Sprint 1 Behavior (Old v1.2.0) | Approved Revised Behavior (New v1.3.0) | Exact Boundaries & Invalid Cases | Role & Access Expectations |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **CR-01: 60-Minute Online Advance Cutoff** | `FR-03`, `FR-04`, `BR-04`, `AC-03c`, `AC-04g` | Online bookings rejected only when `currentServerTime >= slotStartTime` (`Asia/Bangkok`). `GET /api/availability` sets `isAvailable = !isOccupied && !isPast`. | Customer online bookings (`POST /api/bookings/online`, `channel = ONLINE`) require $\ge 60$ min lead time before `startSlot`. Reject when `currentServerTime > slotStartTime - 60 min` with HTTP `400 CANNOT_BOOK_PAST_SLOT`. `GET /api/availability` adds `isWithinCutoff` and sets `isAvailable = !isOccupied && !isWithinCutoff` (online bookability), while **preserving `isPast`** (`currentServerTime >= slotStartTime`) so future Staff Walk-in (`F-07`) explicitly evaluates `!isOccupied && !isPast` instead of `isAvailable`. | **Boundary:** Slot 4 (`14:00+07:00`) at `13:00:00+07:00` (exact 60 min) $\rightarrow$ **PERMITTED** (`201`, `isWithinCutoff: false`).<br>**Invalid:** At `13:00:01+07:00` (59m59s) or `13:01:00+07:00` $\rightarrow$ **REJECTED** (`400 CANNOT_BOOK_PAST_SLOT`, `isWithinCutoff: true`, `isAvailable: false`, `isPast: false`). | `GET /api/availability` remains public.<br>`POST /api/bookings/online` remains strictly `CUSTOMER` (`401` anonymous, `403` `STAFF`). |
| **CR-02: Peak-Hour Online Duration Cap** | `FR-04`, `BR-01`, `AC-04h` | Any contiguous online booking spans `1..5` hours across any operating slots (`0..13`, `10:00–24:00`). | Peak Hours are **18:00–22:00 ICT (`slotIndex` `8, 9, 10, 11`)**. If a customer online booking interval `[startSlot, startSlot + durationHours - 1]` overlaps **any** slot in `8..11`, maximum `durationHours` is capped at **3 hours** (`1..3`). Violations return HTTP `400 PEAK_DURATION_EXCEEDED`. Pure Off-Peak intervals (`slots 0..7` or `12..13` with zero overlap in `8..11`) continue to allow `1..5` hours. | **Boundary (Valid):** `startSlot=8, duration=3` (`18:00–21:00`) $\rightarrow$ `201`; `startSlot=0, duration=5` (`10:00–15:00`, pure Off-Peak) $\rightarrow$ `201`; `startSlot=3, duration=5` (`13:00–18:00`, ends at slot `7`) $\rightarrow$ `201`.<br>**Invalid:** `startSlot=6, duration=4` (`16:00–20:00`, touches Peak slots `8, 9`) $\rightarrow$ `400 PEAK_DURATION_EXCEEDED`; `startSlot=8, duration=4` $\rightarrow$ `400 PEAK_DURATION_EXCEEDED`. | Strictly `CUSTOMER` (`POST /api/bookings/online`). Staff walk-in (`F-07`) is not bound by online peak cap. |
| **CR-03: Daily Customer 6-Hour Quota** | `FR-04`, `BR-06`, `BR-11`, `AC-04i` | No daily per-customer hour cap; one customer could book unlimited hours/rooms on the same date. | Each customer (`userId`) may hold at most **6 total `CONFIRMED` booking hours** on the same `bookingDate` across all rooms (`sum(existingConfirmedHours) + durationHours <= 6`). Enforced atomically inside `prisma.$transaction` using deterministic `SELECT "id" FROM "users" ... FOR UPDATE` followed by `SELECT "id" FROM "rooms" ... FOR UPDATE` to serialize concurrent multi-room requests. Exceeding 6 hours returns HTTP `409 DAILY_QUOTA_EXCEEDED`. `CANCELLED` bookings are excluded; Sprint 2 reschedule (`F-08`) excludes the booking being modified (`id != targetBookingId`). | **Boundary (Valid):** `3h + 3h = 6h` on same `bookingDate` $\rightarrow$ `201`; `4h` `CANCELLED` + `3h` new $\rightarrow$ `201`; `6h` on Day A + `5h` on Day B $\rightarrow$ `201`.<br>**Invalid:** Existing `6h` + new `1h` (`sum=7`) $\rightarrow$ `409 DAILY_QUOTA_EXCEEDED`; two parallel `4h` requests by same customer on `S01` and `S02` $\rightarrow$ strictly one `201` and one `409 DAILY_QUOTA_EXCEEDED`. | Strictly `CUSTOMER` (`userId` taken exclusively from verified JWT `req.user.id`, never request body). |
| **CR-04: Flat Room Hourly Pricing & Server Fare** | `FR-02`, `FR-04`, `FR-05`, `FR-06`, `BR-12`, `AC-02b`, `AC-04j` | `Room` and `Booking` had no pricing columns; catalog and booking screens displayed capacity only. | Fixed tier `hourlyRate` (THB/hr): `SMALL` = **200**, `MEDIUM` = **350**, `LARGE` = **500**. Server authoritatively computes and persists `totalPrice = room.hourlyRate * durationHours` (ignoring any client-supplied price field). Exposed in `GET /api/rooms`, `GET /api/availability`, `POST /api/bookings/online`, `GET /api/bookings/my`, `GET /api/bookings/:id`, and `GET /api/bookings/master`, and displayed across Customer & Staff UI views. | **Boundary (Valid):** `S01` (`200`) $\times 3\text{h} = 600$ THB; `M01` (`350`) $\times 3\text{h} = 1050$ THB; `L01` (`500`) $\times 2\text{h} = 1000$ THB.<br>**Tampering / Invalid:** Request body injecting `totalPrice: 1` or `hourlyRate: 0` $\rightarrow$ ignored by server; persisted and returned `totalPrice` equals `room.hourlyRate * durationHours`. | `GET /api/rooms` & `/api/availability`: public.<br>`GET /api/bookings/my` & `/:id`: `BR-07` ownership preserved (`403` cross-customer).<br>`GET /api/bookings/master`: `BR-08` `STAFF`-only (`403` customer). |

---

## 2. Compact Change Impact Traceability Table

| Req / Rule ID | Feature | Affected Spec Sections (SRS / Feature SDS / System SDS) | AC & STS Test IDs | Affected Code Modules & Callers | Validation, Auth/Ownership, Persistence & Historical Data Analysis |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`FR-02`**, **`BR-12`** | **F-02** Room Catalog | `srs.md` §3.1, §4 (`FR-02`), §5 (`BR-12`); `features.md` (`F-02`); `system-sds.md` §2.1, §2.2, §2.3 | `AC-02`, `AC-02b` / `TEST-02`, `TEST-02b` | **DB:** `server/prisma/schema.prisma`, new additive migration SQL, `server/prisma/seed.ts`<br>**BE:** `server/src/controllers/room.controller.ts` (`getRooms`)<br>**FE:** `client/src/types/room.ts`, `client/src/components/room/RoomCatalog.tsx` | **API/UI:** Add `hourlyRate` integer to `rooms` and `tiers` responses; render `฿200/hr`, `฿350/hr`, `฿500/hr` badges inside `GlassCard`.<br>**Roles/Ownership:** **N/A** (public read-only catalog unchanged).<br>**Persistence/Migration:** Additive `ALTER TABLE rooms ADD COLUMN "hourlyRate" INTEGER NOT NULL DEFAULT 200` + SQL backfill (`SMALL=200`, `MEDIUM=350`, `LARGE=500`) + idempotent `seed.ts` upsert. |
| **`FR-03`**, **`BR-04`**, **`BR-12`** | **F-03** Slot Availability | `srs.md` §3.1, §4 (`FR-03`), §5 (`BR-04`); `features.md` (`F-03`); `system-sds.md` §2.3 | `AC-03`, `AC-03c` / `TEST-03`, `TEST-03c` *(preserves `AC-03b`/`TEST-03b` for Sprint 2 `NFR-04`)* | **BE:** `server/src/controllers/availability.controller.ts` (`isSlotInPast`, new `isSlotWithinOnlineCutoff`, `getAvailability`)<br>**Callers:** `booking.controller.ts` imports cutoff helper; `AvailabilityMatrix.tsx` consumes `isAvailable`, `isWithinCutoff`, `hourlyRate`<br>**FE:** `client/src/types/room.ts`, `client/src/components/room/AvailabilityMatrix.tsx` | **API/UI:** Expose `hourlyRate` per room and `isWithinCutoff` per slot; set `isAvailable = !isOccupied && !isWithinCutoff` for online customer bookability; preserve `isPast` so future Staff Walk-in (`F-07`) availability explicitly evaluates `!isOccupied && !isPast` rather than relying on `isAvailable`; display cutoff state in timeline grid.<br>**Roles/Ownership:** **N/A** (public read-only availability unchanged).<br>**Persistence/Migration:** **N/A** (derived dynamically from server clock `Asia/Bangkok` + existing tables). |
| **`FR-04`**, **`BR-01`**, **`BR-04`**, **`BR-11`**, **`BR-12`** | **F-04** Online Booking Engine | `srs.md` §3.1, §4 (`FR-04`), §5 (`BR-01`, `BR-04`, `BR-11`, `BR-12`); `features.md` (`F-04`); `system-sds.md` §2.1–2.3, §3.3 | `AC-04a`–`04f` (regression), `AC-04g`–`04j` / `TEST-04a`–`04f`, `TEST-04g`–`04j` | **DB:** `server/prisma/schema.prisma` (`Booking.totalPrice`), additive migration SQL<br>**BE:** `server/src/controllers/booking.controller.ts` (`createOnlineBooking`, helper for Peak overlap & daily quota with optional `excludeBookingId`)<br>**FE:** `client/src/components/booking/BookingModal.tsx` | **API/UI:** Validate Peak overlap (`400 PEAK_DURATION_EXCEEDED`), 60-min cutoff (`400 CANNOT_BOOK_PAST_SLOT`), transactional 6-hr quota under `users` $\rightarrow$ `rooms` `FOR UPDATE` lock (`409 DAILY_QUOTA_EXCEEDED`), and compute `totalPrice = room.hourlyRate * durationHours`. Update `BookingModal` to show live price calculation, Peak 3-hr limit notice, and error handling.<br>**Roles/Ownership:** `verifyToken` + `requireRole(Role.CUSTOMER)` unchanged; `userId` sourced strictly from `req.user.id`.<br>**Persistence/Historical Data:** Additive `ALTER TABLE bookings ADD COLUMN "totalPrice" INTEGER NOT NULL DEFAULT 0` + SQL backfill `bookings.totalPrice = bookings.durationHours * rooms.hourlyRate` so all existing historical bookings display accurate non-zero totals. |
| **`FR-05`**, **`BR-12`** | **F-05** My Bookings & Detail | `srs.md` §4 (`FR-05`), §5 (`BR-12`); `features.md` (`F-05`); `contracts.md` §1.4 | `AC-05`, `AC-05b`, `AC-04j` / `TEST-05`, `TEST-05b`, `TEST-04j` | **BE:** `server/src/controllers/booking.controller.ts` (`getMyBookings`, `getBookingById`)<br>**FE:** `client/src/components/booking/MyBookingsView.tsx`, `client/src/components/booking/BookingDetailModal.tsx` | **API/UI:** Include persisted `totalPrice` and `room.hourlyRate` in JSON responses and render price badges/breakdown in UI.<br>**Roles/Ownership:** `BR-07` strict customer isolation (`403 FORBIDDEN` on cross-customer read) **strictly preserved without modification**.<br>**Persistence/Migration:** Reads backfilled `bookings.totalPrice`; no separate table needed. |
| **`FR-06`**, **`BR-12`** | **F-06** Staff Master Schedule | `srs.md` §4 (`FR-06`), §5 (`BR-12`); `features.md` (`F-06`); `contracts.md` §1.4 | `AC-06`, `AC-04j` / `TEST-06`, `TEST-04j` | **BE:** `server/src/controllers/booking.controller.ts` (`getMasterSchedule`)<br>**FE:** `client/src/components/staff/StaffMasterScheduleView.tsx` | **API/UI:** Include persisted `totalPrice` and `room.hourlyRate` in Master Schedule payload and display fare on staff reservation cards/cells.<br>**Roles/Ownership:** `BR-08` `requireRole(Role.STAFF)` guard **strictly preserved**.<br>**Persistence/Migration:** Reads backfilled `bookings.totalPrice`. |
| **`FR-01`**, **`NFR-01`**, **`NFR-02`** | **F-01** Auth & RBAC | **N/A** (Unchanged) | `AC-01`–`01e` / `TEST-01`–`01e` | **N/A** — `auth.controller.ts`, `auth.routes.ts`, `middlewares/auth.ts`, `LoginModal.tsx` untouched | **Reason for N/A:** Seeded JWT authentication, bcrypt hashing, and RBAC middleware are unaffected by booking rules and room pricing. Protected by regression suite `server/tests/auth.test.ts`. |
| **`NFR-05`** | **Container Readiness & Durability** *(SRS §6)* | **N/A for Workflow Edits** *(Verified in Part B Release)* | Lab 5 CI/CD (`ci-docker.yml`, `deploy.yml`), `server/tests/docker.test.ts` | **CI/CD & Packaging Files Unchanged:** `Dockerfile`, `.github/workflows/ci-docker.yml`, `.github/workflows/deploy.yml`, `deploy/deploy.sh`, `deploy/smoke_test.py` | **Workflow Edits N/A vs. Verification In-Scope:** No modifications are required to container or CI/CD pipeline definitions because the existing `singslot-migrate` Cloud Run Job already executes `npx prisma migrate deploy && npm run prisma:seed` before service rollout. However, **container build, additive migration execution, Cloud SQL data durability, and post-deployment smoke verification remain actively in-scope** and are re-verified via the unchanged Lab 5 pipeline during Lab 7 Issue 2 release. |

---

## 3. Preserved Sprint 1 Behavior & Regression Protection Plan

The following previously accepted Sprint 1 and Lab 6 behaviors **must remain 100% unchanged** after Lab 7 implementation. Every invariant is actively guarded by existing automated test suites executed serially (`--runInBand`):

| Preserved Domain / Security Invariant | Requirement / Rule ID | Automated Regression Suite Protecting It | Expected Regression Behavior |
| :--- | :--- | :--- | :--- |
| Seeded login, logout, `/api/auth/me`, bcrypt hashing (`>= 10` rounds), and `401`/`403` RBAC | `FR-01`, `BR-08`, `NFR-01`, `NFR-02` | `server/tests/auth.test.ts` (`TEST-01`, `01a`–`01e`) | 100% pass unchanged; Staff blocked on `/api/bookings/online`, Customer blocked on `/api/bookings/master`. |
| 9-room catalog capacities (`S:4`, `M:8`, `L:12`) and 14-slot matrix structure (`0..13`) | `FR-02`, `FR-03`, `BR-03` | `server/tests/availability.test.ts` (`TEST-02`, `TEST-03`) | 100% pass unchanged (additive `hourlyRate` and `isWithinCutoff` fields do not break existing assertions). |
| Contiguous slot conflict rejection (`409 SLOT_CONFLICT`), capacity limit (`400 EXCEEDS_CAPACITY`), operating window (`400 INVALID_DURATION`), and ACID rollback | `BR-01`, `BR-02`, `BR-03`, `BR-05`, `NFR-03` | `server/tests/booking.test.ts` (`TEST-04a`, `04c`, `04d`, `04f`), `server/tests/conflict.test.ts` (`TEST-04b`, `04e`) | 100% pass; note any fixture in `TEST-04a`/`04c` using a near-term current-hour slot will be explicitly documented if adjusted for the legitimate new 60-minute cutoff, without weakening any assertion. |
| Customer data isolation (`GET /api/bookings/my`, cross-customer `403 FORBIDDEN` on `GET /api/bookings/:id`) & Staff Master Schedule | `FR-05`, `FR-06`, `BR-07`, `BR-08` | `server/tests/views.test.ts` (`TEST-05`, `05b`, `TEST-06`) | 100% pass unchanged. |
| Lab 6 hardening fixes: symmetric `RoomBlock` `FOR UPDATE` locking, cancelled-slot purge, `bookingCode` `P2002` collision retry | `DEF-SS-01`, `DEF-SS-01b`, `DEF-SS-02`, `DEF-SS-03` | `server/tests/lab6-defects.test.ts` | 100% pass unchanged; new `users` $\rightarrow$ `rooms` lock ordering preserves symmetric `rooms` lock compatibility with `RoomBlock` middleware. |
| Database schema uniqueness constraints & Unified UI Layout Shell (`AppLayout`, `PageHeader`, `GlassCard`) | `AC-06`, `AC-07`, `NFR-05` | `server/tests/baseline.test.ts`, `ready.test.ts`, `ci.test.ts`, `docker.test.ts`, `client/tests/layout.test.mjs` | 100% pass unchanged. |
| Forward compatibility with Sprint 2 Walk-in (`F-07`) & Reschedule (`F-08`) | `FR-07`, `FR-09`, `FR-10`, `BR-09` | Architectural separation (`isPast` preserved so Walk-in checks `!isOccupied && !isPast` instead of `isAvailable`; quota helper supports `excludeBookingId`; `@default(0)` on `totalPrice`) | Zero breaking impact on upcoming Sprint 2 increment on `sprint-1-staging`. |

---

## 4. Additive Database Migration & Historical Data Strategy (Pre-Implementation Plan)

To maintain **100% backward compatibility** with the Lab 5 Cloud Run rollback safeguard (additive schema invariance) and preserve all existing Cloud SQL booking records without data loss, Issue 2 will introduce a single additive Prisma migration (`add_room_pricing_and_booking_total`):

```sql
-- 1. Additive columns with safe non-null defaults (rollback-safe for older container images)
ALTER TABLE "rooms" ADD COLUMN "hourlyRate" INTEGER NOT NULL DEFAULT 200;
ALTER TABLE "bookings" ADD COLUMN "totalPrice" INTEGER NOT NULL DEFAULT 0;

-- 2. Deterministic backfill for existing rooms by capacity tier (BR-12)
UPDATE "rooms" SET "hourlyRate" = 200 WHERE "type" = 'SMALL';
UPDATE "rooms" SET "hourlyRate" = 350 WHERE "type" = 'MEDIUM';
UPDATE "rooms" SET "hourlyRate" = 500 WHERE "type" = 'LARGE';

-- 3. Deterministic backfill for historical Sprint 1 / Lab 6 bookings
UPDATE "bookings" AS b
SET "totalPrice" = b."durationHours" * r."hourlyRate"
FROM "rooms" AS r
WHERE b."roomId" = r."id";
```

- **Idempotency:** `server/prisma/seed.ts` will also upsert `hourlyRate` (`200` / `350` / `500`) alongside `capacity` and `description` on every `singslot-migrate` run.
- **Zero Data Loss:** Existing confirmed bookings in Cloud SQL remain intact and immediately gain accurate `totalPrice` values matching their room tier and `durationHours`.

---

## 5. Summary of Revised Specification & Contract Artifacts (v1.2.0 $\rightarrow$ v1.3.0)

All engineering contract documents below have been updated on branch `docs/lab7-issue-1-contract-impact` **prior to** any test or application code modification:

1. [`docs/system-specifications/srs.md`](../../system-specifications/srs.md) (`v1.2.0` $\rightarrow$ `v1.3.0`): Updated §3.1, §4 (`FR-02`–`FR-06`), and §5 (`BR-01`, `BR-04`, added `BR-11`, `BR-12`).
2. [`docs/system-specifications/features.md`](../../system-specifications/features.md) (`v1.2.0` $\rightarrow$ `v1.3.0`): Updated `F-02`–`F-06` feature descriptions and requirement links.
3. [`docs/system-specifications/system-sds.md`](../../system-specifications/system-sds.md) (`v1.2.0` $\rightarrow$ `v1.3.0`): Updated ERD, Prisma schema, §2.3 (`users` $\rightarrow$ `rooms` lock order, `isWithinCutoff` vs `isPast`, additive migration), and §3.3 error codes (`PEAK_DURATION_EXCEEDED`, `DAILY_QUOTA_EXCEEDED`).
4. [`docs/system-specifications/traceability.md`](../../system-specifications/traceability.md) (`v1.2.0` $\rightarrow$ `v1.3.0`): Updated Sprint 1 rows and added `BR-11`, `BR-12`, `AC-02b`, `AC-03c`, `AC-04g`–`04j`, and `TEST-02b`, `TEST-03c`, `TEST-04g`–`04j` (preserving `AC-03b`/`TEST-03b` for Sprint 2 `NFR-04`).
5. [`docs/sprints/sprint-1/contracts.md`](../../sprints/sprint-1/contracts.md) (`v1.2.0` $\rightarrow$ `v1.3.0`): Revised Contracts 2, 3, and 4, Section 2 Acceptance Criteria, and Section 3 Software Test Specification (STS) with exact preconditions, boundaries, and expected outcomes.
6. [`docs/labs/lab-07/reviewer.md`](./reviewer.md) & [`docs/labs/lab-07/ai-use.md`](./ai-use.md): Initialized Lab 7 peer review audit trail and AI usage log.
