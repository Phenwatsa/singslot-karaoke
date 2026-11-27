# Requirements Traceability Matrix
## Project: SingSlot — Karaoke Room Reservation & Management System
**Course:** CPE 334 Introduction to Software Engineering in the Age of AI Agents  
**Document Version:** 1.4.0 (Deliverable 2 Candidate — `feat/sprint3-and-d2-release` Staging Review)  
**Date:** 27 November 2026  

---

## 1. End-to-End Traceability Matrix (Req → Feature → Sprint → AC/NFR → Planned Test → Actual File/Test → Result & Version)

| Req ID | Description | Feature | Sprint | AC / NFR Verification | Planned Test ID | Actual File / Test or Measurement | Result & Version |
|---|---|---|---|---|---|---|---|
| **FR-01** | Seeded Login, Logout & `/api/auth/me` | F-01 | **Sprint 1** | AC-01, AC-01a, AC-01b | `TEST-01`, `01a`, `01b`, `01e` | `server/tests/auth.test.ts` | **PASS** (`v0.1.0-sprint1`, `v0.2.0-sprint2`, `feat/sprint3-and-d2-release`) |
| **FR-02** | Room catalog with capacities & flat `hourlyRate` (200/350/500 THB) | F-02 | **Sprint 1 (Rev. Lab 7)** | AC-02, AC-02b | `TEST-02`, `TEST-02b` | `server/tests/availability.test.ts`, `server/tests/lab7-rules-pricing.test.ts` | **PASS** (`v0.1.2-lab7`, `v0.2.0-sprint2`, `feat/sprint3-and-d2-release`) |
| **FR-03** | Server-calculated availability (0..13) with `isWithinCutoff` & `isPast` | F-03 | **Sprint 1 (Rev. Lab 7)** | AC-03, AC-03c | `TEST-03`, `TEST-03c` | `server/tests/availability.test.ts`, `server/tests/lab7-rules-pricing.test.ts` | **PASS** (`v0.1.2-lab7`, `v0.2.0-sprint2`, `feat/sprint3-and-d2-release`) |
| **FR-04** | Online booking (1–5h Off-Peak, 1–3h Peak, 60m cutoff, 6h quota, `totalPrice`) | F-04 | **Sprint 1 (Rev. Lab 7)** | AC-04a, AC-04g–04j | `TEST-04a`, `04g`–`04j` | `server/tests/booking.test.ts`, `server/tests/lab7-rules-pricing.test.ts` | **PASS** (`v0.1.2-lab7`, `v0.2.0-sprint2`, `feat/sprint3-and-d2-release`) |
| **FR-05** | Customer "My Bookings" & Booking Detail with `totalPrice` | F-05 | **Sprint 1 (Rev. Lab 7)** | AC-05, AC-05b, AC-04j | `TEST-05`, `05b`, `04j` | `server/tests/views.test.ts`, `server/tests/lab7-rules-pricing.test.ts` | **PASS** (`v0.1.2-lab7`, `v0.2.0-sprint2`, `feat/sprint3-and-d2-release`) |
| **FR-06** | Staff Master Schedule grid with `totalPrice` | F-06 | **Sprint 1 (Rev. Lab 7)** | AC-06, AC-04j | `TEST-06`, `04j` | `server/tests/views.test.ts`, `server/tests/lab7-rules-pricing.test.ts` | **PASS** (`v0.1.2-lab7`, `v0.2.0-sprint2`, `feat/sprint3-and-d2-release`) |
| **FR-07** | Staff walk-in counter booking (`WALK_IN`, `!isPast`, `totalPrice`) | F-07 | **Sprint 2** | AC-07 | `TEST-07` | `server/tests/sprint2.test.ts` | **PASS** (`v0.2.0-sprint2`, `feat/sprint3-and-d2-release`) |
| **FR-08** | Staff slot maintenance & `RoomBlock` | F-09 | **Sprint 2** | AC-08 | `TEST-08` | `server/tests/sprint2.test.ts` | **PASS** (`v0.2.0-sprint2`, `feat/sprint3-and-d2-release`) |
| **FR-09** | Booking cancellation (`CANCELLED`, slot release, 24h policy) | F-08 | **Sprint 2** | AC-09 | `TEST-09` | `server/tests/sprint2.test.ts` | **PASS** (`v0.2.0-sprint2`, `feat/sprint3-and-d2-release`) |
| **FR-10** | Booking rescheduling (24h policy, `totalPrice` recalc, `excludeBookingId`) | F-08 | **Sprint 2** | AC-10 | `TEST-10` | `server/tests/sprint2.test.ts` | **PASS** (`v0.2.0-sprint2`, `feat/sprint3-and-d2-release`) |
| **FR-11** | Staff multi-criteria booking search & filter | F-10 | **Sprint 2** | AC-11 | `TEST-11` | `server/tests/sprint2.test.ts` | **PASS** (`v0.2.0-sprint2`, `feat/sprint3-and-d2-release`) |
| **FR-12** | Customer online self-registration (`POST /api/auth/register`) | F-11 | **Sprint 3 (D2)** | AC-12 | `TEST-12` | `server/tests/sprint3-register.test.ts` | **PASS** (`feat/sprint3-and-d2-release`; pending `main` release) |
| **FR-13** | Room Management CRUD for Staff (`POST/PATCH/DELETE /api/rooms`) | F-12 | **Sprint 3 (Final)** | AC-13 | `TEST-13` (Planned) | *Not yet implemented (Planned)* | **PLANNED / UNCOVERED** (Target 13 Dec) |
| **FR-14** | Room occupancy & utilization summary reports (`GET /api/reports/summary`) | F-13 | **Sprint 3 (Final)** | AC-14 | `TEST-14` (Planned) | *Not yet implemented (Planned)* | **PLANNED / UNCOVERED** (Target 13 Dec) |
| **BR-01** | Contiguous slots (1–5h Off-Peak; max 3h overlapping Peak 18:00–22:00) | F-04 | **Sprint 1 (Rev. Lab 7)** | AC-04a, AC-04b, AC-04h | `TEST-04a`, `04b`, `04h` | `server/tests/booking.test.ts`, `conflict.test.ts`, `lab7-rules-pricing.test.ts` | **PASS (TDD)** (`v0.1.2-lab7`, `v0.2.0-sprint2`, `feat/sprint3-and-d2-release`) |
| **BR-02** | Exclusive room reservation (1 active claim per slot; `FOR UPDATE` lock) | F-04 | **Sprint 1 (Rev. Lab 6)** | AC-04b | `TEST-04b`, `04e`, `DEF-SS-01` | `server/tests/conflict.test.ts`, `server/tests/lab6-defects.test.ts` | **PASS** (`v0.1.0-sprint1`, `v0.2.0-sprint2`, `feat/sprint3-and-d2-release`) |
| **BR-03** | Operating window enforcement (Slots 0..13, 10:00–24:00 ICT) | F-02, F-03 | **Sprint 1** | AC-03, AC-04c | `TEST-03`, `TEST-04c` | `server/tests/availability.test.ts`, `server/tests/booking.test.ts` | **PASS** (`v0.1.0-sprint1`, `v0.2.0-sprint2`, `feat/sprint3-and-d2-release`) |
| **BR-04** | Past-slot & 60-min online advance cutoff (`isWithinCutoff` vs `isPast`) | F-03, F-04 | **Sprint 1 (Rev. Lab 7)** | AC-03c, AC-04c, AC-04g | `TEST-03c`, `04c`, `04g` | `server/tests/booking.test.ts`, `server/tests/lab7-rules-pricing.test.ts` | **PASS (TDD)** (`v0.1.2-lab7`, `v0.2.0-sprint2`, `feat/sprint3-and-d2-release`) |
| **BR-05** | Capacity validation against room tier maximums | F-04 | **Sprint 1** | AC-04d | `TEST-04d` | `server/tests/booking.test.ts` | **PASS** (`v0.1.0-sprint1`, `v0.2.0-sprint2`, `feat/sprint3-and-d2-release`) |
| **BR-06** | Concurrent booking isolation (no double booking) | F-04 | **Sprint 1** | AC-04e | `TEST-04e` | `server/tests/conflict.test.ts` | **PASS** (`v0.1.0-sprint1`, `v0.2.0-sprint2`, `feat/sprint3-and-d2-release`) |
| **BR-07** | Customer data privacy (cross-customer read/modify forbidden `403`) | F-05, F-08 | **Sprint 1 & 2** | AC-05b, AC-09 | `TEST-05b`, `TEST-09` | `server/tests/views.test.ts`, `server/tests/sprint2.test.ts` | **PASS** (`v0.1.0-sprint1`, `v0.2.0-sprint2`, `feat/sprint3-and-d2-release`) |
| **BR-08** | Staff endpoints restricted to `STAFF` role (`403` for `CUSTOMER`) | F-01, F-06, F-07, F-09, F-10 | **Sprint 1 & 2** | AC-01c, AC-06, AC-07, AC-08, AC-11 | `TEST-01c`, `06`, `07`, `08`, `11` | `server/tests/auth.test.ts`, `views.test.ts`, `sprint2.test.ts` | **PASS** (`v0.1.0-sprint1`, `v0.2.0-sprint2`, `feat/sprint3-and-d2-release`) |
| **BR-09** | Cancellation/rescheduling restricted within 24h window | F-08 | **Sprint 2** | AC-09a | `TEST-09a` | `server/tests/sprint2.test.ts` | **PASS (TDD)** (`v0.2.0-sprint2`, `feat/sprint3-and-d2-release`) |
| **BR-10** | Maintenance blocks cannot overlap confirmed bookings (`409 BLOCK_CONFLICT`) | F-09 | **Sprint 2** | AC-08b | `TEST-08b` | `server/tests/sprint2.test.ts` | **PASS (TDD)** (`v0.2.0-sprint2`, `feat/sprint3-and-d2-release`) |
| **BR-11** | Daily customer online quota (`<= 6` hrs/day; excludes `CANCELLED` & self on reschedule) | F-04, F-08 | **Lab 7 & Sprint 2** | AC-04i, AC-10 | `TEST-04i`, `TEST-10` | `server/tests/lab7-rules-pricing.test.ts`, `server/tests/sprint2.test.ts` | **PASS (TDD)** (`v0.1.2-lab7`, `v0.2.0-sprint2`, `feat/sprint3-and-d2-release`) |
| **BR-12** | Flat room hourly pricing (200/350/500) & server-calculated `totalPrice` | F-02..F-08 | **Lab 7 & Sprint 2** | AC-02b, AC-04j, AC-07, AC-10 | `TEST-02b`, `04j`, `07`, `10` | `server/tests/lab7-rules-pricing.test.ts`, `server/tests/sprint2.test.ts` | **PASS (TDD)** (`v0.1.2-lab7`, `v0.2.0-sprint2`, `feat/sprint3-and-d2-release`) |
| **NFR-01** | Password hashed with `bcrypt` (salt rounds `>= 10`) | F-01, F-11 | **Sprint 1 & 3** | AC-01d, AC-12 | `TEST-01d`, `TEST-12` | `server/tests/auth.test.ts`, `server/tests/sprint3-register.test.ts` | **PASS** (`v0.1.0-sprint1`, `feat/sprint3-and-d2-release`) |
| **NFR-02** | Unauthenticated/unauthorized access yields HTTP `401`/`403` | All Protected | **Sprint 1–3** | AC-01b, AC-01c, AC-05b, AC-12 | `TEST-01b`, `01c`, `05b`, `07`–`12` | `server/tests/auth.test.ts`, `views.test.ts`, `sprint2.test.ts`, `sprint3-register.test.ts` | **PASS** (`v0.1.0-sprint1`, `v0.2.0-sprint2`, `feat/sprint3-and-d2-release`) |
| **NFR-03** | Multi-slot bookings execute inside ACID transaction | F-04, F-07, F-08 | **Sprint 1 & 2** | AC-04f | `TEST-04f` | `server/tests/booking.test.ts` | **PASS** (`v0.1.0-sprint1`, `v0.2.0-sprint2`, `feat/sprint3-and-d2-release`) |
| **NFR-04** | Availability query latency `< 200 ms` with `>= 50` bookings | F-03 | **Sprint 2** | AC-03b | `TEST-03b` | `server/tests/sprint2.test.ts` | **PASS** (`v0.2.0-sprint2`, `feat/sprint3-and-d2-release`) |
| **NFR-05** | Reproducible container execution & Cloud Run durability | Infrastructure | **Lab 5–7 & D2** | Container/CI checks + Cloud Run post-deploy | `docker.test.ts`, `ready.test.ts`, `ci.test.ts` | **CI/Container:** `docker.test.ts`, `ready.test.ts`, `ci.test.ts`<br>**Cloud Run Deploy & Persistence:** `.github/workflows/deploy.yml` | **CI/Container:** **PASS** (`feat/sprint3-and-d2-release`)<br>**Cloud Run & Persistence:** **PASS** on `v0.1.2-lab7` & `v0.2.0-sprint2`; **PENDING Release PR** (`main` / `v0.3.0-rc1`) |

---

## 2. Coverage Summary & Explicit Gaps (Honest Status on `feat/sprint3-and-d2-release`)

* **Covered & Passing (Local `--runInBand` & Staging CI):**
  * **Sprint 1 + Lab 7:** 6/6 FRs (`FR-01`–`FR-06`), 10/10 BRs (`BR-01`–`BR-08`, `BR-11`, `BR-12`), and 3/3 app NFRs (`NFR-01`–`NFR-03`) are implemented, tested, and passing.
  * **Sprint 2 (`v0.2.0-sprint2`):** 5/5 FRs (`FR-07`–`FR-11`), 2/2 BRs (`BR-09`, `BR-10`), and `NFR-04` (`< 200 ms`) are 100% implemented, tested, and passing.
  * **Sprint 3 Deliverable 2 Slice (`feat/sprint3-and-d2-release`):** `FR-12` (`F-11` Customer Self-Registration, `TEST-12`) is implemented, tested, and passing locally/CI; production Cloud Run verification awaits the Release PR (`main` / `v0.3.0-rc1`).
  * **Infrastructure (`NFR-05`):** Container/CI static and readiness checks pass on `feat/sprint3-and-d2-release`; Cloud Run deployment and post-deployment persistence verification for the integrated candidate are **Pending Release PR** into `main`.
* **Uncovered / Planned (Deferred to Final Release by 13 Dec 2026):**
  * **`FR-13` (`F-12` Room Management CRUD — `AC-13` / `TEST-13`):** Contract specified in `docs/sprints/sprint-3/contracts.md`; implementation and automated tests are **Planned** (not executed).
  * **`FR-14` (`F-13` Appointment Summary & Occupancy Reports — `AC-14` / `TEST-14`):** Contract specified in `docs/sprints/sprint-3/contracts.md`; implementation and automated tests are **Planned** (not executed).
  * **`DEF-SS-04 (4B)` & `F-14` (`AC-14-POLISH` / `TEST-14-POLISH`):** Origin-restricted CORS (`CORS_ORIGIN`), final UI polish, and demonstration video are **Planned** for completion by 13 December 2026 (see [`docs/sprints/sprint-3/remaining-work.md`](../sprints/sprint-3/remaining-work.md)).
