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

---

### Session Log: 21 November 2026

#### 3. Partner UAT Master Plan Calibration & Execution Log Scaffolding (Issue #2)
* **Prompt Intent:** Calibrate the operational UAT Master Plan Tracker and author the formal partner execution log (`docs/labs/lab-06/partner-execution-log.md`) against Whatsss-PMandELS Sprint 1 UAT Plan (`uat-plan.md` on branch `staging-lab5`). Verify test accounts (`user_demo`, `user_other`, `admin`), decouple 2F into discrete sub-checks (2F-1 missing CC and 2F-2 malformed amount), correct 2E API expected code to `INVALID_TRANSACTION_AMOUNT`, verify initial screenshots in `docs/labs/lab-06/screenshots/partner/`, and enforce secret hygiene across all documentation.
* **Tools Used:** `read_file`, `write_file`, `run_command` (`ls -lah`, `git status`).
* **Outcome:** Created `docs/labs/lab-06/partner-execution-log.md` with complete 18-slice traceability table, verified active test fixtures on Cloud Run, and initialized sequential live test execution across all 4 mandatory categories.

#### 4. Live Partner UAT Execution, Outgoing Defect Discovery & Full Handoff (Issue #2)
* **Prompt Intent:** Execute all 18 test slices of Partner Team's application (Whatsss-PMandELS, Theme 7) on Google Cloud Run deployment (`https://whatsss-sipqw4logq-as.a.run.app`). Ensure strict 1-to-1 live binding between user-provided visual evidence and documented test outcomes. Conduct deep security penetration and code audit on partner repository: identified 1 critical runtime-verified security defect (`DEF-OUT-01` Case-Sensitivity Authorization Bypass in `roleGuard.ts`), 1 advisory contract discrepancy (`DEF-OUT-02` Unauthenticated Logout), and 4 static code-inspection findings (`AUDIT-01` to `AUDIT-04`). Formulate formal Outgoing Defect Reports (Part C1) and prepare PR handover package adhering to course rules.
* **Tools Used:** `read_file`, `edit_file`, `write_file`, `run_command` (`cp`, `ls -la`, `git status`).
* **Outcome:** Successfully executed and verified 18/18 test cases. Captured and bound 26 authentic evidence files (`EVD-01` through `EVD-18`, `DEFECT-01`, `DEFECT-01b`, `DEFECT-02`) in `docs/labs/lab-06/screenshots/partner/`. Documented formal Outgoing Defect Reports in Section 6 of `partner-execution-log.md` with concrete root cause analysis and code recommendations. Prepared PR handover package.

#### 5. Peer Review Audit Resolution & Evidence/Contract Harmonization (Issue #2)
* **Prompt Intent:** Address peer review feedback on PR #37 from `@Phenwatsa`:
  1. Harmonize all evidence filenames in `partner-execution-log.md` to `.png` and `.txt`, resolving extension mismatches with actual repository files.
  2. Reconcile case `UAT-S1-04 4A` outcome to `FAIL` based on verified Admin API role bypass (`DEF-OUT-01`) on capitalized routes (`/api/Accounts`, `/api/Reports/summary`).
  3. Reclassify `DEF-OUT-02` (unauthenticated logout) as a Contract Discrepancy / Advisory Finding to respect idempotent REST API design possibilities, maintaining `DEF-OUT-01` as the sole primary verified Critical defect.
  4. Verify tenant isolation mechanism in `UAT-S1-04 4B` using authentic 2-step verification: `user_other` Checking Bank UUID ownership proof (`656b87b3-79c0-4a37-bc47-68ed01321292` in `EVD-17b`) and foreign injection rejection from `user_demo` with HTTP 404 in `EVD-17`.
  5. Refine input parameter documentation for `2F-2` and `2G` to reflect exact tested values, verify post-repayment balance stability in `2D`, and reconcile Acceptance Decision to Not Accepted pending resolution of Critical Defect `DEF-OUT-01`.
* **Tools Used:** `read_file`, `edit_file`, `run_command` (`git diff`, `git status`).
* **Outcome:** Updated `partner-execution-log.md` with 100% accurate file mapping, 2-step cross-tenant UUID proof (`EVD-17` and `EVD-17b`), reconciled test outcome summary (UI: 17 PASS / Direct API: 4A FAIL, 4B PASS, 4C PASS / UI-Blocked Forms: API NOT RUN), and clearly demarcated Section 6 into Primary Verified Defect (`DEF-OUT-01`) vs. Advisory Findings (`DEF-OUT-02` + `AUDIT-01`..`AUDIT-04`).



