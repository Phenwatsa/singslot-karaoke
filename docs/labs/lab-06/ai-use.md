# Lab 6 AI Usage & Governance Log

## Project: SingSlot — Karaoke Room Reservation & Management System
**Course:** CPE 334 Introduction to Software Engineering in the Age of AI Agents (1/2026)
**Deliverable:** Lab 6 — Independent User Acceptance Testing & Defect Management
**AI Assistant:** Antigravity (Google DeepMind Advanced Agentic Coding / Gemini 3.8 Flash & Gemini 4 Argon)

---

### Session Log: 19 November 2026

#### 1. Lab 6 Master Plan, Issue Decomposition & Part A UAT Preparation
* **Prompt Intent:** Align Lab 6 work breakdown with course guidelines, adopt a streamlined 4-issue structure split 50/50 between teammates (@Phenwatsa and @lephirada), author Sprint 1 UAT Test Cases (`docs/labs/lab-06/uat-cases.md`) covering all 4 required categories (Normal Domain Journey, Business-Rule/Boundary, Forbidden Role/Ownership, State/History/Persistence), and construct the comprehensive safe handoff package (`docs/labs/lab-06/handoff.md`).
* **Tools Used:** `read_file`, `write_file`, `run_command` (Git branch and inspection tools).
* **Outcome:** Created directory structure `docs/labs/lab-06/` and centralized `docs/screenshots/lab-06/` (tracked via `.gitkeep`); authored 5 complete executable UAT test cases (`UAT-01` to `UAT-05`) with 100% accurate requirement traceability (`FR-01`..`FR-06`, `BR-01`..`BR-08`, `AC-01`..`AC-06`, `TEST-01`..`TEST-06`); authored complete safe handoff package specifying GCP Cloud Run baseline URL (`https://singslot-4o7kwmd5ma-as.a.run.app`), commit `e598e21`, seeded roles, test guidelines, transactional Cloud SQL booking reset procedure, and defect reporting template. Zero source code modifications made.

#### 2. Pre-Review Self-Audit & Traceability / Handoff Refinement
* **Prompt Intent:** Refine `docs/labs/lab-06/uat-cases.md` and `docs/labs/lab-06/handoff.md` following author self-audit on PR #36:
  1. Align all Functional Requirement (`FR-01`–`FR-06`) and Business Rule (`BR-01`–`BR-08`) references strictly with `docs/system-specifications/srs.md` and `docs/sprints/sprint-1/contracts.md`.
  2. Expand `UAT-04` to include direct cross-customer ownership testing (`GET /api/bookings/:id` returning HTTP 403 `FORBIDDEN` per `AC-05b` / `TEST-05b`) and correct the Staff Master Schedule API endpoint to `GET /api/bookings/master` (`AC-01c` / `TEST-01c`).
  3. Clarify in `handoff.md` that `singslot-migrate` only upserts seeded accounts/rooms without deleting bookings, and document the complete transactional Cloud SQL cleanup procedure (`DELETE FROM "booking_slots"; DELETE FROM "bookings"; DELETE FROM "room_blocks";`) followed by idempotent seed verification.
  4. Add `docs/screenshots/lab-06/.gitkeep` so the Lab 6 screenshots directory is preserved in Git upon clone.
* **Tools Used:** `read_file`, `write_file`, `run_command` (`git status`, `npm run typecheck`).
* **Outcome:** All 4 findings resolved and verified against `srs.md`, `contracts.md`, and `schema.prisma`.
