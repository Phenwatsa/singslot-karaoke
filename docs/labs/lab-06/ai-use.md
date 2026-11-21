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
* **Outcome:** Successfully executed and verified 18/18 test cases. Captured and bound 27 authentic evidence files (26 PNG screenshots + 1 CLI text log: `EVD-01` through `EVD-18` including `EVD-17b`, `DEFECT-01`, `DEFECT-01b`, `DEFECT-02`) in `docs/labs/lab-06/screenshots/partner/`. Documented formal Outgoing Defect Reports in Section 6 of `partner-execution-log.md` with concrete root cause analysis and code recommendations. Prepared PR handover package.

#### 5. Peer Review Audit Resolution & Evidence/Contract Harmonization (Issue #2)
* **Prompt Intent:** Address peer review feedback on PR #37 from `@Phenwatsa`:
  1. Harmonize all evidence filenames in `partner-execution-log.md` to `.png` and `.txt`, resolving extension mismatches with actual repository files.
  2. Reconcile case `UAT-S1-04 4A` outcome to `FAIL` based on verified Admin API role bypass (`DEF-OUT-01`) on capitalized routes (`/api/Accounts`, `/api/Reports/summary`).
  3. Reclassify `DEF-OUT-02` (unauthenticated logout) as a Contract Discrepancy / Advisory Finding to respect idempotent REST API design possibilities, maintaining `DEF-OUT-01` as the sole primary verified Critical defect.
  4. Verify tenant isolation mechanism in `UAT-S1-04 4B` using authentic 2-step verification: `user_other` Checking Bank UUID ownership proof (`656b87b3-79c0-4a37-bc47-68ed01321292` in `EVD-17b`) and foreign injection rejection from `user_demo` with HTTP 404 in `EVD-17`.
  5. Refine input parameter documentation for `2F-2` and `2G` to reflect exact tested values, verify post-repayment balance stability in `2D`, and reconcile Acceptance Decision to Not Accepted pending resolution of Critical Defect `DEF-OUT-01`.
* **Tools Used:** `read_file`, `edit_file`, `run_command` (`git diff`, `git status`).
* **Outcome:** Updated `partner-execution-log.md` with 100% accurate file mapping, 2-step cross-tenant UUID proof (`EVD-17` and `EVD-17b`), reconciled test outcome summary (UI: 17 PASS / Direct API: 4A FAIL, 4B PASS, 4C PASS / UI-Blocked Forms: API NOT RUN), and clearly demarcated Section 6 into Primary Verified Defect (`DEF-OUT-01`) vs. Advisory Findings (`DEF-OUT-02` + `AUDIT-01`..`AUDIT-04`).

#### 6. Issue 3 (#34): Partner Defect Resolution via TDD (RED/GREEN) & Regression Verification
* **Prompt Intent:** Reproduce and resolve the accepted release-blocking defects reported by the partner UAT team (Whatsss Team: `@Pilaiwan3492` & `@Apichaya251400`) on [Issue #35](https://github.com/Phenwatsa/singslot-karaoke/issues/35) (`DEF-SS-01`, `DEF-SS-02`, `DEF-SS-03`), document the formal disposition of `DEF-SS-04`, and verify the complete TDD RED-to-GREEN cycle across local and CI test suites:
  1. **TDD RED Phase (`server/tests/lab6-defects.test.ts` — Commit `167bea35788bc5feb3d23f3669a9ab49d2d5b9b0`):** Authored 3 initial automated Supertest + Jest tests reproducing `DEF-SS-01` (TOCTOU race condition between `BookingSlot` and `RoomBlock` violating `BR-02` & `BR-06`), `DEF-SS-02` (latent "Zombie Slot" permanent 409 lockout when a `CANCELLED` booking leaves an orphaned `BookingSlot` row), and `DEF-SS-03` (unhandled `P2002` `HTTP 500` crash on `bookingCode` collision). Verified all 3 tests failed (`3 failed, 3 total`) against the unmodified `booking.controller.ts` baseline (`aa5f109b97c157a143a7a9a94cd58dc02998467e`).
  2. **TDD GREEN Phase (`server/src/controllers/booking.controller.ts` — Commit `c7b22b649fa9ad290f7def0471ec2b5999ea14ea`):** Acquired a transaction-scoped exclusive row lock on the target room (`SELECT "id" FROM "rooms" WHERE "id" = ... FOR UPDATE`), purged any orphaned `BookingSlot` rows belonging to `CANCELLED` bookings inside the transaction (`DEF-SS-02`), re-verified both `tx.bookingSlot.findMany` and `tx.roomBlock.findMany` inside the locked transaction (`DEF-SS-01`), and wrapped transaction execution in a bounded retry loop (`MAX_CODE_RETRIES = 5`) that regenerates `bookingCode` upon `P2002` collision (`DEF-SS-03`). Verified all 3 initial defect tests passed (`3 passed, 3 total`) without modifying test assertions.
  3. **Concurrency Hardening Follow-Up 1 (Commit `a810b9808ffc1d1eaec3b956de75eb32723c5ff5`):** Added `createMaintenanceRoomBlock()` in `server/src/controllers/booking.controller.ts` enforcing the symmetric `SELECT "id" FROM "rooms" WHERE "id" = ... FOR UPDATE` locking protocol, added the 4th regression test `DEF-SS-01b` (two-transaction parallel concurrency race via `Promise.allSettled`), and aligned the `ABSD` suffix comment in `DEF-SS-03`.
  4. **Global Prisma Middleware & Midnight Boundary Follow-Up 2 (Commit `c540ca900c5ec1a757e79b5505591372610e879f`):** Registered global Prisma client middleware (`prisma.$use`) in `server/src/prisma.ts` so every standalone `prisma.roomBlock.create` call across the application automatically executes inside a transaction holding the target Room's `FOR UPDATE` lock and checking for `CONFIRMED` `BookingSlot` conflicts; extended `DEF-SS-01b` to verify both `createMaintenanceRoomBlock` and direct `prisma.roomBlock.create`; and fixed `getBangkokCurrentHour()` in `server/tests/booking.test.ts` (`TEST-04c`) to use `hourCycle: 'h23'` (`% 24`) and derive `yesterdayStr` directly from `todayBangkok` so midnight (`00:00–00:59 ICT`) CI runs never misclassify hour `0` as `24`.
  5. **Explicit Disposition of `DEF-SS-04` (Permissive Wildcard CORS & JWT Stored in `localStorage`):**
     - **Sub-item 4A (JWT in `localStorage` vs. `HttpOnly` Cookies):** Classified as **Not-Defect (By-Design per Agreed Sprint 1 Contract)**. Both [`docs/system-specifications/srs.md` §7.3](../../system-specifications/srs.md) and [`docs/sprints/sprint-1/contracts.md` Contract 1 (`AC-01`, `AC-01e`)](../../sprints/sprint-1/contracts.md) explicitly specify stateless signed Bearer JWT authentication returned in JSON and stored client-side in `localStorage` (`singslot_token`). Modifying authentication transport to `HttpOnly` cookies would break the agreed Sprint 1 API contract and automated/UAT test suites.
     - **Sub-item 4B (`app.use(cors())` Configuration):** Classified as **Advisory / Deferred Enhancement (Non-Blocking for Sprint 1 Acceptance)**. In production on Google Cloud Run (`https://singslot-4o7kwmd5ma-as.a.run.app`), the React SPA static bundle and Express API are served from the exact same single origin container, and `srs.md` defines no cross-origin whitelist requirement for Sprint 1.
* **Tools Used:** `read_file`, `write_file`, `edit_file`, `run_command` (`npm --prefix server test -- tests/lab6-defects.test.ts`, `npm run test:server`, `npm run test:client`, `npm run typecheck`).
* **Outcome & Reproducible Verification Evidence:**
  - **Reproducible TDD RED Terminal Log (Commit `167bea35788bc5feb3d23f3669a9ab49d2d5b9b0`):**
    ```text
    > singslot-server@1.0.0 test
    > jest --runInBand --detectOpenHandles --forceExit tests/lab6-defects.test.ts

    FAIL tests/lab6-defects.test.ts
      Lab 6 Part D: Partner-Reported Defect Reproduction & Regression Suite (Issue #34 / Issue #35)
        ✕ DEF-SS-01: rejects online booking with HTTP 409 SLOT_CONFLICT when a RoomBlock is inserted concurrently before transaction commit (BR-02, BR-06) (29 ms)
        ✕ DEF-SS-02: allows booking a slot shown as available when a prior CANCELLED booking left an orphaned BookingSlot row (FR-03, FR-04) (33 ms)
        ✕ DEF-SS-03: automatically retries and returns HTTP 201 Created when an initial bookingCode collision (P2002) occurs (FR-04, AC-04a) (21 ms)

      ● DEF-SS-01: expect(received).toBe(expected) — Expected: 409, Received: 201
      ● DEF-SS-02: expect(received).toBe(expected) — Expected: 201, Received: 409
      ● DEF-SS-03: expect(received).toBe(expected) — Expected: 201, Received: 500

    Test Suites: 1 failed, 1 total
    Tests:       3 failed, 3 total
    Time:        1.33 s
    ```
  - **Reproducible TDD GREEN Terminal Log (4/4 Defect Cases Passing at Commit `c540ca900c5ec1a757e79b5505591372610e879f`):**
    ```text
    > singslot-server@1.0.0 test
    > jest --runInBand --detectOpenHandles --forceExit tests/lab6-defects.test.ts

    PASS tests/lab6-defects.test.ts
      Lab 6 Part D: Partner-Reported Defect Reproduction & Regression Suite (Issue #34 / Issue #35)
        ✓ DEF-SS-01: rejects online booking with HTTP 409 SLOT_CONFLICT when a RoomBlock is inserted concurrently before transaction commit (BR-02, BR-06) (18 ms)
        ✓ DEF-SS-01b: concurrent two-transaction race between online booking and RoomBlock creation (both service helper and direct prisma.roomBlock.create) serializes on Room FOR UPDATE lock and prevents coexistence (BR-02, BR-06) (28 ms)
        ✓ DEF-SS-02: allows booking a slot shown as available when a prior CANCELLED booking left an orphaned BookingSlot row (FR-03, FR-04) (26 ms)
        ✓ DEF-SS-03: automatically retries and returns HTTP 201 Created when an initial bookingCode collision (P2002) occurs (FR-04, AC-04a) (34 ms)

    Test Suites: 1 passed, 1 total
    Tests:       4 passed, 4 total
    Time:        1.425 s
    ```
  - **Full Regression & CI Verification (GitHub Actions Run [`44930162938`](https://github.com/Phenwatsa/singslot-karaoke/actions/runs/44930162938)):** `10/10` server test suites (`105/105` server tests with `--runInBand`), `12/12` client tests (`--test-concurrency=1`), `0` TypeScript errors, and production multi-stage Docker build succeeded. (Cloud Run deployment `AC-04` and final merge `AC-05` remain pending until PR #39 is peer-reviewed by `@lephirada`, merged into `sprint-1-staging`, and promoted to `main`).
