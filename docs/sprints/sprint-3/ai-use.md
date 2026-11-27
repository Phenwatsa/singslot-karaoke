# Sprint 3 AI Usage Log & Reflection
## Project: SingSlot — Karaoke Room Reservation & Management System
**Course:** CPE 334 Introduction to Software Engineering in the Age of AI Agents  

---

## Session 1 — `[D2 - Issue 3]` F-11 Self-Registration, Traceability & Release Readiness (`feat/sprint3-and-d2-release`)
* **Date:** 2026-11-27
* **Prompt Intent:** Implement `F-11` Customer Self-Registration (`POST /api/auth/register`, Login/Register UI toggle, `TEST-12`), update `srs.md`, `features.md`, and `traceability.md` preserving all Lab 7 + Sprint 2 updates, and author `docs/sprints/sprint-3/remaining-work.md` for the 13 Dec completion plan.
* **Tools Used:** Antigravity AI (`read_file`, `edit_file`, `write_file`, `run_command`)
* **Concrete Outcome:**
  * Implemented `register` controller (`server/src/controllers/auth.controller.ts`) and route (`server/src/routes/auth.routes.ts`) enforcing `bcrypt` (10 rounds), `409 EMAIL_ALREADY_EXISTS`, and hardcoded `Role.CUSTOMER`.
  * Added Sign In / Register mode toggle in `client/src/components/auth/LoginModal.tsx`.
  * Added `server/tests/sprint3-register.test.ts` (`TEST-12`, 4 test cases).
  * Updated `srs.md`, `features.md`, `traceability.md` (`v1.4.0`), and created `docs/sprints/sprint-3/remaining-work.md`.
