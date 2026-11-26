# Sprint 2 AI Usage Log & Reflection
## Project: SingSlot — Karaoke Room Reservation & Management System
**Course:** CPE 334 Introduction to Software Engineering in the Age of AI Agents  

---

## Session 1 — `[D2 - Issue 1]` Sprint 2 & Sprint 3 Contracts (`docs/sprint2-3-contracts`)
* **Date:** 2026-11-25
* **Prompt Intent:** Draft pre-implementation engineering contracts, Acceptance Criteria (AC), Software Test Specifications (STS), and the Lab 5–6 Change/Defect Register for Sprint 2 (`F-07`–`F-10`, `NFR-04`) and Sprint 3 (`F-11`–`F-14`), aligned with Lab 7 adaptive maintenance rules (`BR-01`, `BR-04`, `BR-11`, `BR-12`).
* **Tools Used:** Antigravity AI (`read_file`, `write_file`, `edit_file`, `run_command`)
* **Concrete Outcome:**
  * Created `docs/sprints/sprint-2/contracts.md` (`v1.0.0`) with Lab 5–6 Change/Defect Register (`DEF-SS-01`–`DEF-SS-04`) and complete contracts for `F-07`–`F-10` and `NFR-04` (`TEST-03b`, `TEST-07`–`TEST-11`).
  * Created `docs/sprints/sprint-3/contracts.md` (`v1.0.0`) with complete contracts for `F-11`–`F-14` (`TEST-12`–`TEST-14`).
  * Updated `docs/ai-use.md` index.

## Session 2 — `[D2 - Issue 2]` Sprint 2 Operations Increment TDD Implementation (`feat/sprint2-complete`)
* **Date:** 2026-11-25
* **Prompt Intent:** Implement and verify the complete Sprint 2 operations increment (`F-07` Staff Walk-in Booking Counter, `F-08` Booking Cancellation & Rescheduling with `BR-09` 24h advance policy, `F-09` Staff Slot Maintenance & Blockout with `BR-10` conflict prevention, `F-10` Booking Search & Multi-criteria Filtering, and `NFR-04` availability latency `< 200 ms`) strictly against `docs/sprints/sprint-2/contracts.md` using TDD (RED → GREEN) while preserving all Sprint 1, Lab 6, and Lab 7 invariants.
* **Tools Used:** Antigravity AI (`read_file`, `write_file`, `edit_file`, `run_command`)
* **Concrete Outcome:**
  * **TDD RED Phase (`4582a44dca6369aa96066844608c86c3ae9bd9d5`):** Authored `server/tests/sprint2.test.ts` covering `TEST-07`, `TEST-08`, `TEST-08b` (`BR-10`), `TEST-09`, `TEST-09a` (`BR-09`), `TEST-10`, `TEST-11`, and `TEST-03b` (`NFR-04`). Verified `0` TypeScript errors and genuine RED failures (`7 failed, 1 passed, 8 total`, with verbatim RED terminal output archived in `docs/sprints/sprint-2/tests.md`).
  * **TDD GREEN Backend (`8093dee5734c23e153eb63790a5459e015cd117b` & hardening commits):** Implemented `server/src/controllers/roomBlock.controller.ts`, `server/src/routes/roomBlock.routes.ts`, and extended `server/src/controllers/booking.controller.ts`, `server/src/routes/booking.routes.ts`, and `server/src/app.ts` (including in-transaction `BR-09` and target slot time/cutoff re-verification under `users` → `bookings` → `rooms` `FOR UPDATE` locking). Updated `server/tests/views.test.ts` for Contract 8's default-today query behavior on `GET /api/bookings/master` and expanded `TEST-08` to assert `CUSTOMER` `403 FORBIDDEN` across `GET`, `POST`, and `DELETE /api/room-blocks`.
  * **Unified Frontend UI:** Added `StaffWalkInPanel.tsx` and `StaffRoomBlockPanel.tsx`, extended `StaffMasterScheduleView.tsx` with multi-criteria search/filtering, date-scoped occupancy keys, and Staff Console tabs, and added Cancel & Reschedule workflows to `BookingDetailModal.tsx` and `MyBookingsView.tsx` inside `<AppLayout>` and `<GlassCard>`.
  * **Verification (`--runInBand`):** 100% pass rate across all 12 server test suites (`118/118` tests passing, `TEST-03b` `< 200 ms` with 54 bookings), all 12 client structural tests, `npm run typecheck`, and `npm run build` (full verbatim RED/GREEN logs in `docs/sprints/sprint-2/tests.md`).
