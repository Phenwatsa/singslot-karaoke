# Team & Agent Working Rules: Project SingSlot
> **Target Audience:** AI Coding Assistants (Antigravity/Cursor/Copilot) & Engineering Teammates  
> **Course:** CPE 334 Introduction to Software Engineering in the Age of AI Agents  
> **Project:** SingSlot — Karaoke Room Reservation & Management System  
> **Hardware Constraint:** MacBook M1 (8GB Unified Memory)  

---

## 🚨 1. CRITICAL HARDWARE & MEMORY RULES (M1 8GB RAM GUARD)

Both team members use **MacBook M1 with 8GB RAM**. Past projects experienced system freezes and sudden shutdowns caused by memory starvation. **The AI Assistant and developers must strictly follow these memory conservation rules:**

1. **NO DOCKER IN SPRINT 1:**
   - **NEVER** run Docker Desktop or `docker-compose` during Sprint 1 development. (Docker is assessed in Lab 5 on 15 Nov, NOT Deliverable 1 on 8 Nov).
   - Running Docker on 8GB Mac exhausts 3–4 GB of memory and will crash the OS.
2. **NO HEADLESS BROWSERS (NO PLAYWRIGHT/CHROMIUM IN SPRINT 1):**
   - Automated testing for Sprint 1 must use **Supertest + Jest** (pure HTTP API tests).
   - Do **NOT** spin up headless Chromium/Playwright instances that consume 2GB+ RAM.
3. **SERIAL TEST EXECUTION ONLY (`--runInBand`):**
   - All test commands must run with `--runInBand` or `--maxWorkers=1`.
   - Never allow test runners to spawn parallel worker processes.
4. **LIGHTWEIGHT STACK & DECOUPLED COMMANDS:**
   - **Frontend:** React + Vite (minimal memory footprint <100MB; NO heavy Next.js dev server).
   - **Backend:** Node.js + Express (<80MB).
   - **Database:** PostgreSQL (Native Homebrew service or managed local instance).
   - Do **NOT** run multi-process concurrent watchers (`concurrently`) unless explicitly requested. Run backend and frontend commands in separate, bounded steps.

---

## 🛑 2. STRICT GIT & PR HANDOVER RULES (NO AUTONOMOUS GIT)

1. **NO AUTONOMOUS GIT EXECUTION:**
   - **The AI assistant is strictly prohibited from running git write commands autonomously** (`git add`, `git commit`, `git push`, `git checkout -b`, or branch creation).
   - The AI must provide clear CLI copy-paste commands and Conventional Commit messages (e.g. `feat(auth): ...`, `test(booking): ...`) for the developer to execute manually in their terminal.
2. **STRICT 1 ISSUE = 1 BRANCH (NO JUMPING / NO COMBINING):**
   - Decompose work strictly into GitHub Issues. Complete **one issue at a time on one dedicated branch** (e.g., `feat/issue-2-auth-jwt-roles`).
   - Never jump across issues or combine multiple issues into a single branch.
3. **FROZEN COMPLETED ISSUES (FORWARD-ONLY FIXES):**
   - We **never return to edit a closed/merged issue or branch**.
   - If a fix or continuation is needed, create and implement it in a **new subsequent issue and branch**.
4. **MANDATORY PR HANDOVER PACKAGE:**
   - When an issue's implementation is ready to be uploaded, the AI must automatically provide:
     1. **Terminal Git Commands:** Exact copy-paste commands to stage, commit, and push.
     2. **PR Title Format:** Use conventional commits with a **non-closing issue reference** (e.g. `feat(auth): implement seeded JWT authentication [Issue #2]`). **DO NOT** use auto-closing keywords like `Closes #X` or `Fixes #X` in PR titles to prevent GitHub from closing issues prematurely before follow-up reviews.
     3. **PR Description:** A comprehensive Markdown summary detailing:
        - **What was done:** Features implemented and files created/updated.
        - **Testing & Scope:** Tests executed and verification evidence.
        - **Continuity & Next Issue:** Explanation of why this slice is bounded (e.g. UI built here, full integration test in Issue #X).
        - **Reviewer Instructions & Exceptions:** Clear notes for the peer reviewer (e.g., if this PR must be approved and merged into staging before downstream integration tests can run, explicitly justify this so the reviewer can approve with confidence).
5. **PEER REVIEW & NO SELF-APPROVAL:**
   - All PRs into `sprint-1-staging` must be reviewed by the other teammate (Pair A reviews Pair B; Pair B reviews Pair A). Authors never approve their own PRs.

---

## 🎨 3. UNIFIED UI TEMPLATE & LAYOUT PATTERN (DESIGN CONSISTENCY)

To guarantee that screens built by both developers (Customer vs. Staff) share a 100% identical look-and-feel, layout structure, and aesthetic polish:

1. **CENTRALIZED LAYOUT PATTERN (`client/src/components/layout/`):**
   - All page views must be wrapped inside the shared layout template (e.g. `AppLayout.tsx`, `PageHeader.tsx`, `GlassCard.tsx`).
   - **Never create isolated custom page shells.** All navigation bars, footers, background gradients, padding, and typography hierarchies must be inherited directly from the shared layout.
2. **PLUG-AND-PLAY FUNCTIONAL SLICES:**
   - Developers focus strictly on writing their domain feature components (forms, time grids, schedule tables) and injecting them into the predefined `<AppLayout>` and `<GlassCard>` slots.
3. **SINGLE SOURCE OF TRUTH FOR STYLING:**
   - Any theme modifications (e.g. neon gradient colors, dark/light tones, card border-radius) are updated strictly within the shared layout components, instantly reflecting across all pages.

---

## 📐 4. SPEC-FIRST & ENGINEERING DISCIPLINE

1. **ALWAYS SPEC-FIRST & ZERO INVENTED RULES:**
   - Before writing any code, the AI must strictly consult the documentation in `docs/` (`srs.md`, `system-sds.md`, `contracts.md`, `features.md`, `traceability.md`).
   - **Never invent business rules or assume behaviors.** If any ambiguity arises, ask the developer for clarification before proceeding.
2. **STRICT FEATURE DISCIPLINE (NO OVER-ENGINEERING):**
   - Work strictly within the agreed feature scope. **Never add extra or unrequested features.**
   - If the AI identifies an enhancement or a feature that would be beneficial, the AI must **propose it to the developer first**. Only implement it if the developer explicitly approves.
3. **CODE FREEZE & NON-DESTRUCTIVE EXTENSION:**
   - Code from merged issues is **FROZEN**.
   - The AI is **strictly prohibited from unsolicited refactoring, rewriting, or modifying existing working code or tests**, unless a severe defect blocks the current issue or the developer explicitly orders a refactoring.
4. **100% PASSING TESTS & ZERO REGRESSIONS:**
   - Every completed issue must ensure all newly authored tests pass and all existing tests continue to pass (**100% pass rate**).
   - TypeScript builds must compile with zero diagnostic errors.
5. **TDD EVIDENCE FOR CORE BUSINESS RULES:**
   - For core rules (e.g., `TEST-04b`: rejecting bookings across occupied slots), retain verifiable Git evidence showing the test failed first before implementation and passed afterward.
6. **MANDATORY TRACEABILITY IDS:**
   - All requirements, features, and tests must reference stable IDs defined in `docs/`:
     - Functional Requirements: `FR-01` to `FR-14`
     - Business Rules: `BR-01` to `BR-10`
     - Non-Functional Requirements: `NFR-01` to `NFR-05`
     - Acceptance Criteria: `AC-01` to `AC-06`
     - Software Tests: `TEST-01` to `TEST-06` (17 Test IDs: `TEST-01`, `01a`–`01e`, `02`, `03`, `04a`–`04f`, `05`, `05b`, `06`).

---

## 📝 5. LOGGING & COMMUNICATION PROTOCOL

1. **REAL-TIME PROMPT LOGGING (`docs/ai-use.md`):**
   - For every key architectural decision and major prompt instruction, append a short entry to [`docs/ai-use.md`](./docs/ai-use.md) capturing the prompt intent, tools used, and concrete outcome (per course AI disclosure requirements).
2. **LANGUAGE PROTOCOL:**
   - **Discussions & Planning:** Thai language (🇹🇭) is used for collaborative discussions, explanations, and reviews between the developer and AI.
   - **Code, Artifacts & Documentation:** English (🇬🇧) is strictly used for all code, comments, Markdown docs in `docs/`, commit messages, PR titles/descriptions, and PR review comments.

---

## 🎯 6. SPRINT 1 LEAN SCOPE (DELIVERABLE 1 — DUE 8 NOV)

Focus 100% on **The Golden Online Booking Slice**:
- ✅ **In-Scope for Sprint 1:**
  1. Seeded User Authentication (Customer & Staff login via JWT, seeded accounts: `staff@singslot.local`, `customer1@singslot.local`).
  2. Seeded Room Fleet (S01–S03, M01–M03, L01–L03) & 14 hourly slots (10:00–24:00, indexed 0..13).
  3. Server-calculated availability lookup by date.
  4. Online customer booking (1–5 contiguous hours in same room, no overlaps, no past slots).
  5. Customer "My Bookings" & Booking Detail view (with data isolation).
  6. Staff Master Schedule inspection page.
  7. Automated tests with 100% pass rate & clean evidence.
- ❌ **Strictly Deferred to Sprint 2 / 3:**
  - No Self-Registration (Sprint 3)
  - No Walk-in Cashier Booking (Sprint 2)
  - No Room Management CRUD (Sprint 3)
  - No Cancellation / Rescheduling (Sprint 2)
  - No Real Payment Gateway or F&B ordering (Out of scope)
