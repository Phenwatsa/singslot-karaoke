# GitHub Issues & Team Collaboration Guide

## Project: SingSlot — Sprint 1 Lean Delivery

**Course:** CPE 334 Introduction to Software Engineering in the Age of AI Agents  
**Team Members:**

- **Developer 1:** @Phenwatsa
- **Developer 2:** @lephirada  
  **Target:** Deliverable 1 (Git Workflow & Peer Review Evidence)

---

## 1. Branch Strategy (Mandatory Course Standard)

1. `main`: Protected release branch holding accepted, verified code increments.
2. `sprint-1-staging`: Integration branch for aggregating Sprint 1 work (branched from `main`).
3. `setup/...` or `feat/...`: Feature branches branched from and merged into `sprint-1-staging` via reviewed Pull Requests.

---

## 2. GitHub Issue Breakdown Between @Phenwatsa and @lephirada

The 6 issues below have been refined to match all SRS, SDS, and Sprint 1 contract requirements:

### 📌 Issue #1: Project Baseline Setup, Monorepo Scaffolding & Database Schema

```markdown
Type: Foundation & Scaffolding
Required branch: setup/issue-1-baseline-schema
Assignees: @Phenwatsa & @lephirada (Pair Work)

In-Scope:

- Monorepo Scaffolding: Configure decoupled client/ (React + Vite + TypeScript + Tailwind CSS) and server/ (Node.js + Express + TypeScript) with root orchestration.
- Scripts & Memory Safety: Provide dev, build, typecheck, and test scripts in both client and server; enforce --runInBand single worker constraint for MacBook M1 8GB RAM safety.
- Unified UI Layout Template: Build centralized layout components (AppLayout.tsx, PageHeader.tsx, GlassCard.tsx) under client/src/components/layout/ to enforce 100% design consistency.
- Database Schema (PostgreSQL): Configure Prisma schema with models User, Room, Booking, BookingSlot, and RoomBlock. Enforce separate composite unique constraints @@unique([roomId, bookingDate, slotIndex]) on BookingSlot and @@unique([roomId, blockDate, slotIndex]) on RoomBlock, plus unique constraint on bookingCode.
- Reproducible Seed Data: Implement npm run prisma:seed to idempotently seed 3 demo accounts (staff@singslot.local, customer1@singslot.local, customer2@singslot.local) with bcrypt hashes, and 9 rooms (S01–S03, M01–M03, L01–L03). (Test fixtures such as S01 Slot 3 are managed separately by test suites on fixed test dates).

Out-of-Scope & Deferred Dependencies:

- Authentication API endpoints and login forms (deferred to Issue #2).
- Server-calculated availability logic (deferred to Issue #3).
- Docker packaging and GCP deployment (strictly deferred to Lab 5).

Acceptance Criteria:

- [ ] AC-01: Fresh clone can install dependencies cleanly via documented setup command.
- [ ] AC-02: Client and Server npm scripts (dev, build, typecheck, test) execute with zero TypeScript errors.
- [ ] AC-03: Prisma Client generates cleanly, and migrations execute successfully on target PostgreSQL database.
- [ ] AC-04: npm run prisma:seed populates 3 demo users and 9 rooms with correct bcrypt hashes, roles, and capacities.
- [ ] AC-05: Seed script is idempotent (running seed multiple times produces identical state without duplicate records or re-hashing passwords; verified via PostgreSQL query evidence).
- [ ] AC-06: Database constraints enforce uniqueness on bookingCode and room/date/slot in BookingSlot and RoomBlock (statically verified in schema/migration tests; runtime migration verified on PostgreSQL).
- [ ] AC-07: Shared layout components (AppLayout, PageHeader, GlassCard) conform to design system spec, initialize in unauthenticated shell mode, and expose navigation callback hooks (verified via client structural smoke tests; full interactive DOM render tested in Issue #2/3).
- [ ] AC-08: Test suite runs with --runInBand without spawning parallel worker processes.

AI Verification Note:

- Verify build and typecheck commands succeed on both client and server, migrations succeed from clean database, and baseline tests pass. Attach clean-environment execution logs in PR description.
```

---

### 📌 Issue #2: Seeded User Authentication & Role-Based Access Control

```markdown
Type: Feature & Security
Required branch: feat/issue-2-auth-jwt-roles
Assignee: @Phenwatsa | Reviewer: @lephirada

In-Scope:

- Authentication APIs: Implement POST /api/auth/login validating credentials via bcrypt against seeded users, issuing JWT tokens with role claims (CUSTOMER, STAFF). Implement POST /api/auth/logout acknowledging session termination.
- Session Verification API: Implement GET /api/auth/me returning authenticated user identity.
- RBAC Middleware: Implement verifyToken and requireRole('STAFF') middleware guards on protected routes.
- Frontend Login View: Implement login view wrapped in AppLayout with quick-fill buttons for seeded accounts (staff@singslot.local, customer1@singslot.local).
- Automated Tests: Author and verify TEST-01 (successful staff login returns JWT with role STAFF), TEST-01a (invalid password/email returns 401 INVALID_CREDENTIALS), TEST-01b (unauthenticated access returns 401 UNAUTHENTICATED), TEST-01c (customer token on staff endpoint returns 403 FORBIDDEN), TEST-01d (bcrypt password hash assertion), and TEST-01e (logout returns 200).

Out-of-Scope & Deferred Dependencies:

- Public self-registration (deferred to Sprint 3).
- Password recovery and server-side token blocklist tables (documented limitation for Sprint 1).

Acceptance Criteria:

- AC-01: Valid credentials return HTTP 200 with signed JWT token and user role.
- AC-01a: Invalid credentials return HTTP 401 INVALID_CREDENTIALS.
- AC-01b: Protected endpoints reject unauthenticated requests with HTTP 401 UNAUTHENTICATED.
- AC-01c: Protected staff endpoints reject Customer tokens with HTTP 403 FORBIDDEN.
- AC-01e: POST /api/auth/logout returns HTTP 200, and client clears stored token.
- 100% test pass on TEST-01 through TEST-01e.

AI Verification Note:

- Verify JWT expiration is set to 8 hours and passwords are never returned in JSON responses.
```

---

### 📌 Issue #3: Room Catalog & Server-Calculated Availability Grid

```markdown
Type: Feature & UI
Required branch: feat/issue-3-room-availability-grid
Assignee: @Phenwatsa | Reviewer: @lephirada

In-Scope:

- Room Catalog API: Implement GET /api/rooms returning the 9 seeded rooms grouped by capacity tier (Small 4, Medium 8, Large 12).
- Availability Query API: Implement GET /api/availability?date=YYYY-MM-DD calculating availability across 14 hourly slots (indexed 0..13, 10:00–24:00) per room based on active CONFIRMED bookings and room blocks.
- Frontend Room Catalog: Display room fleet cards using GlassCard with capacity badges.
- Frontend Availability Matrix: Interactive 14-slot timeline grid with visual cues for open (green) vs. occupied (red/gray) slots.
- Automated Tests: Author and verify TEST-02 (room catalog returns 9 rooms with correct capacities), TEST-03 (availability calculation accurately reflects pre-seeded slot 3 occupancy for given date).

Out-of-Scope & Deferred Dependencies:

- Room management CRUD (deferred to Sprint 3).
- Slot maintenance blockout endpoints (deferred to Sprint 2).

Acceptance Criteria:

- AC-02: GET /api/rooms returns 9 seeded rooms with capacities 4, 8, 12.
- AC-03: GET /api/availability returns 14 slots (0..13) per room with accurate boolean isAvailable flags matching database state.
- Availability query returns HTTP 400 INVALID_INPUT for malformed date parameters.

AI Verification Note:

- Verify date-query parameter parsing in Asia/Bangkok timezone and ensure query latency remains under 200ms.
```

---

### 📌 Issue #4: Online Booking Engine & Contiguous Validation

```markdown
Type: Feature & Domain Logic
Required branch: feat/issue-4-booking-engine
Assignee: @lephirada | Reviewer: @Phenwatsa

In-Scope:

- Online Booking API: Implement POST /api/bookings/online wrapped in an atomic Prisma transaction.
- Duration Logic: Support selection of 1 to 5 contiguous hours within operating window (Slot 0 to 13).
- Contiguous Availability Validation: Enforce BR-01 (all selected slots in [startSlot, startSlot + duration - 1] must be continuously open).
- Boundary Validations: Enforce BR-03 (cannot exceed slot 13 / 24:00), BR-04 (past-time slot rejection relative to Asia/Bangkok server time), and BR-05 (party size within room capacity).
- Frontend Booking Journey: Customer slot-selection flow and reservation confirmation view wrapped in AppLayout.
- Automated Tests: Author and verify TEST-04a (valid 1–5 hour booking confirmed and persisted), TEST-04c (past-slot booking rejected with HTTP 400 CANNOT_BOOK_PAST_SLOT), TEST-04d (party size exceeding capacity rejected with HTTP 400 EXCEEDS_CAPACITY), and TEST-04f (transaction rollback upon simulated failure).

Out-of-Scope & Deferred Dependencies:

- Walk-in cashier booking (deferred to Sprint 2).
- Cancellation and rescheduling workflows (deferred to Sprint 2).

Acceptance Criteria:

- AC-04a: Customer reserving 1–5 contiguous open slots receives HTTP 201 Created and unique bookingCode.
- AC-04c: Past date/slot reservation request is rejected with HTTP 400 CANNOT_BOOK_PAST_SLOT.
- AC-04d: Party size exceeding room capacity is rejected with HTTP 400 EXCEEDS_CAPACITY.
- AC-04f: Multi-slot booking failure leaves zero orphaned Booking or BookingSlot records.

AI Verification Note:

- Verify multi-slot insertions execute inside prisma.$transaction to guarantee atomic rollback on failure.
```

---

### 📌 Issue #5: Conflict Prevention & Concurrency Protection (TDD)

```markdown
Type: Business Rule & TDD Verification
Required branch: feat/issue-5-conflict-prevention
Assignee: @lephirada | Reviewer: @Phenwatsa

In-Scope:

- TDD Workflow for BR-01: Author failing test TEST-04b (attempting to book across pre-seeded occupied slot 3), capture failing execution log, implement interval validation loop in booking service, and demonstrate passing execution log.
- Concurrency Protection Suite: Implement test TEST-04e simulating parallel requests for the same room-slot using Promise.all; verify that exactly one succeeds (HTTP 201) and competing request returns HTTP 409 Conflict.
- Database Constraint Verification: Ensure composite unique constraint @@unique([roomId, bookingDate, slotIndex]) on BookingSlot intercepts duplicate slot records at the PostgreSQL level.
- Automated Tests: Retain git commit and test log evidence for TEST-04b (TDD) and TEST-04e (Concurrency).

Out-of-Scope & Deferred Dependencies:

- Inventory release from cancellation (deferred to Sprint 2).

Acceptance Criteria:

- AC-04b: Booking across occupied slot returns HTTP 409 SLOT_CONFLICT with zero data modifications.
- AC-04e: Competing concurrent booking attempts produce strictly one confirmed booking and one 409 Conflict rejection.
- Verifiable Git evidence showing test failed first before implementation and passed afterward.

AI Verification Note:

- Record raw terminal test outputs for both failing and passing runs to fulfill Deliverable 1 Part F evidence requirements.
```

---

### 📌 Issue #6: Customer My Bookings, Booking Detail & Staff Master Schedule Views

```markdown
Type: Feature & UI/Integration
Required branch: feat/issue-6-booking-views
Assignee: @lephirada | Reviewer: @Phenwatsa

In-Scope:

- Customer My Bookings API: Implement GET /api/bookings/my returning strictly reservations where userId == req.user.id.
- Booking Detail API: Implement GET /api/bookings/:id enforcing data isolation (returns 200 if booking.userId == req.user.id OR req.user.role == 'STAFF'; returns 403 FORBIDDEN if another customer attempts to access).
- Customer My Bookings UI: Card list view displaying customer's personal active bookings inside AppLayout.
- Staff Master Schedule API: Implement GET /api/bookings/master?date=YYYY-MM-DD returning all reservations across all 9 rooms (restricted to STAFF role).
- Staff Master Schedule UI: Global calendar grid for staff cashier terminal displaying room occupancy across all rooms.
- Automated Tests: Author and verify TEST-05 (customer retrieves own bookings), TEST-05b (cross-customer booking detail access rejected with 403 FORBIDDEN), and TEST-06 (staff accesses global master schedule).

Out-of-Scope & Deferred Dependencies:

- Search and multi-criteria filtering (deferred to Sprint 2).
- Cancellation buttons (deferred to Sprint 2).

Acceptance Criteria:

- AC-05: Customer accessing /api/bookings/my retrieves only their own records.
- AC-05b: Customer A accessing Customer B's booking ID via /api/bookings/:id returns HTTP 403 FORBIDDEN.
- AC-06: Staff accessing Master Schedule views all confirmed reservations for the selected day.

AI Verification Note:

- Verify data isolation filters on backend queries and confirm responsive layout on mobile/desktop screens.
```

---

## 3. Substantive Pull Request Review Flow (Mandatory Evidence for Part F)

```mermaid
sequenceDiagram
    autonumber
    actor P as @Phenwatsa
    actor L as @lephirada
    participant Staging as sprint-1-staging

    Note over P,L: Work on separate feature branches from sprint-1-staging
    P->>Staging: Open PR [Issue #2 or #3] (Title: feat(...): ... [Issue #X])
    L->>P: Substantive Review (Verify tests & logic; approve)
    P->>Staging: Merge PR into sprint-1-staging

    L->>Staging: Open PR [Issue #4, #5 or #6] (Title: feat(...): ... [Issue #X])
    P->>L: Substantive Review (Verify TDD fail/pass & DB constraints; approve)
    L->>Staging: Merge PR into sprint-1-staging
```

### Review Comment Template 1: @lephirada Reviews @Phenwatsa's PR (`feat/issue-2-auth-jwt-roles`)

> _"Verified that password hashing correctly utilizes bcrypt with 10 salt rounds per NFR-01. I pulled the branch and ran `npm test auth.test.ts` locally; confirmed that both TEST-01 (successful staff login), TEST-01a (invalid login rejected with 401), and TEST-01c (customer rejected from staff endpoint with 403 Forbidden) pass cleanly. Also verified JWT token lifetime is configured to 8 hours. Approving for merge into sprint-1-staging."_

### Review Comment Template 2: @Phenwatsa Reviews @lephirada's PR (`feat/issue-5-conflict-prevention`)

> _"Excellent implementation of the contiguous slot rule (BR-01). I reviewed the TDD commit history and confirmed that TEST-04b initially failed when booking across occupied Slot 3, and passed after adding the interval loop check in `bookingService.ts`. I also verified that the composite unique constraint on `[roomId, bookingDate, slotIndex]` is enforced in the Prisma schema to block concurrent collisions. Tests pass locally. Approved!"_

---

## 4. Lab 5 Cloud Deployment & CI/CD Pipeline (Tasks 1 to 8 + Step 9)

- **Target:** Lab 5 (Cloud Deployment, Automated CI/CD, Quality Gate & Persistence)
- **Label:** `lab5` (Mandatory on all Issues and Pull Requests per **R-10**)
- **GitHub Project Board (R-09):** All 8 tasks and release proof issues are tracked on the public GitHub Project Board, advancing across lifecycle columns (`Backlog`, `Specified`, `Started`, `PR Review`, `Done`).
- **Substantive Peer Review (R-09):** Authors never approve their own Pull Requests. Every PR review must state a specific check, question, finding, or reason for approval (no empty approvals).
- **Preserve History & CI Mandatory (R-10):** Do not delete or rewrite Git commits, contract revisions, or CI run histories. CI checks and the `protect-main` ruleset stay permanently mandatory after Lab 5 and through Lab 7.
- **Team Participation Protocol (R-11):** Both members take active roles across all phases: requirements, testing, AI supervision, implementation, peer review, and deployment. While commit counts need not be identical, both developers participate substantively and review each other's pull requests.
- **Public Repository Mandate (R-12):** The repository must be public and remain public until all grading concludes, allowing TAs and the Lab 6 partner team to access code, issues, PRs, and CI runs without being added as collaborators. Zero secrets (.env, real passwords, database connection strings, or keys) may ever be committed.
- **Documentation & Step 9 Delivery:** Finalization of `docs/labs/lab-05/deployment.md` and the PDF evidence index report (`lab5_sec<section>_<group_name>.pdf`) is tracked via [`docs/labs/lab-05/submission-checklist.md`](./labs/lab-05/submission-checklist.md) as Execution Step 9.

### 4.1 Master Work Allocation & Dependency Matrix

| Task  | Title on GitHub                                               | Primary Owner |   Reviewer   |                    Dependencies                     | Branch / Interface          | PR Target                   | Key Deliverable & Evidence                                   |
| :---: | :------------------------------------------------------------ | :-----------: | :----------: | :-------------------------------------------------: | :-------------------------- | :-------------------------- | :----------------------------------------------------------- |
| **1** | `[Lab 5 - Task 1] GCP Account & Cost Control`                 | `@Phenwatsa`  | `@lephirada` |              None (Starts immediately)              | GCP Console                 | None                        | GCP Project, IAM Editor, Budget Alert ($30-$50/$250)         |
| **2** | `[Lab 5 - Task 2] Prepare SingSlot for Cloud Deployment`      | `@lephirada`  | `@Phenwatsa` |              None (Starts immediately)              | `feat/lab5-cloud-ready`     | `sprint-1-staging`          | `/api/ready` endpoint, 6-point cloud readiness, `.env.example`|
| **3** | `[Lab 5 - Task 3] Docker Containerization`                    | `@Phenwatsa`  | `@lephirada` |                       Task 2                        | `feat/lab5-docker`          | `sprint-1-staging`          | Multi-stage `Dockerfile`, `.dockerignore`, compose (C-03)    |
| **4** | `[Lab 5 - Task 4] CI Quality Gate on Pull Requests`           | `@lephirada`  | `@Phenwatsa` |                   Task 2, Task 3                    | `feat/lab5-ci`              | `sprint-1-staging` (Feature PR) → `main` (Release PR) | `ci-docker.yml`, passing CI (C-01), Release PR to `main`     |
| **5** | `[Lab 5 - Task 5] First GCP Deployment`                       | `@Phenwatsa`  | `@lephirada` |             Task 1, Task 4 (on `main`)              | Cloud Shell                 | None                        | Cloud SQL, Cloud Run, auto-increase OFF, C-04 URL            |
| **6** | `[Lab 5 - Task 6] WIF Setup & Branch Protection Verification` | `@lephirada`  | `@Phenwatsa` | Task 1, Task 4 (for 6A: WIF/Gate); Task 5 (for 6B: SA Bindings) | Console + `test/prove-gate` | `main`                      | WIF setup, Ruleset active, Blocked Merge proof (C-02), Bindings|
| **7** | `[Lab 5 - Task 7] Automatic Deployment Pipeline`              | `@Phenwatsa`  | `@lephirada` |               Task 4, Task 5, Task 6                | `feat/lab5-auto-deploy`     | `sprint-1-staging` → `main` | `deploy.yml`, auto-deploy on main, Repeatable Release (C-06) |
| **8** | `[Lab 5 - Task 8] Persistence & Rollback Verification`        | `@lephirada`  | `@Phenwatsa` |                       Task 7                        | Actions & Console           | None                        | Data persists restart & redeploy (C-05); Rollback (Rec.)     |
| **9** | `[Lab 5 - Step 9] Final Documentation & PDF Evidence Index`   | Both Members  | Peer Review  |                       Task 8                        | `docs/` & LEB2 PDF          | None                        | Completed `deployment.md`, checklist, and LEB2 PDF report    |

---

### 4.2 Comprehensive Task Specifications (Ready for GitHub Issues)

#### 📌 Task 1: GCP Account & Cost Control

```markdown
Type: Cloud Infrastructure & Cost Governance
Assignee: @Phenwatsa
Reviewer: @lephirada
Dependencies: None (Can start immediately in parallel with Task 2)
Branch: None (GCP Console & Cloud Shell)
Label: lab5

Objective:
Set up team Google Cloud Platform environment with active Free Trial, grant teammate IAM access, and configure budget alerts to provide early cost visibility and reduce the risk of unexpected spending.

In-Scope:
- Activate GCP Free Trial using a personal Gmail account that has NEVER used the Free Trial before ($300 credit for 90 days; do NOT use university `@mail.kmutt.ac.th` account to avoid prepayment blocks; zero prepayment; do NOT click Upgrade).
- Create Project: `cpe334-singslot-[team/id]` (record Project ID and Project Number; this single project will be retained and reused for Lab 5, Lab 6, Lab 7, and the Final Project).
- Grant IAM access to @lephirada with Role: Editor (`roles/editor`) per Student Guide Ep 1.3.
- Enable Billing on project (verify `gcloud billing projects describe` returns True).
- Create Alerts-only Budget:
  - Choose one target amount: **$30–$50 equivalent** (lean budget for Lab 5 duration) or **$250 equivalent** (term-wide budget preserving approximately $50 reserve out of the $300 credit). Use the billing account's currency (e.g., THB or USD) and record the actual budget amount and currency upon creation.
  - Configure actual cost alert thresholds at 10%, 20%, 50%, and 90%.
  - Link notification channels to both members' Gmail accounts.
  - Note: Budget alerts send email warnings but do NOT enforce hard spending caps or auto-pause services.

Out-of-Scope:
- Creating Cloud Run or Cloud SQL compute resources (deferred to Task 5 to minimize running costs).
- Modifying repository code or branch configurations.

Acceptance Criteria:
- [ ] GCP Project created with unique Project ID and recorded Project Number (designated for reuse across Lab 5, Lab 6, Lab 7, and Final Project).
- [ ] Teammate @lephirada added to IAM as Editor and confirmed access from their account.
- [ ] Billing enabled confirmed via `gcloud billing projects describe "$PROJECT_ID" --format='value(billingEnabled)'` returning `True`.
- [ ] Alerts-only Budget created with committed target amount, thresholds, and linked notification channels for both members.
- [ ] Confirmation that budget notification channels are linked to both members' Gmail accounts recorded in the Issue comment.
- [ ] Team acknowledges budget alerts provide notifications only and do not automatically cap spending.
- [ ] Zero prepayment made and Upgrade button NOT clicked.

Evidence Required for PDF (Part 0 & Part 3):

- Screenshot of Billing -> Credits showing $300 credit (or equivalent in billing currency) and expiration.
- Screenshot of Cloud Shell showing billingEnabled=True.
- Screenshot of Budgets & alerts dashboard showing active alert thresholds.
```

#### 📌 Task 2: Prepare SingSlot for Cloud Deployment

```markdown
Type: Cloud-Ready Architecture & Environment
Assignee: @lephirada
Reviewer: @Phenwatsa
Dependencies: None (Can start immediately in parallel with Task 1)
Branch: feat/lab5-cloud-ready (created from sprint-1-staging)
PR Target: sprint-1-staging
Label: lab5

Objective:
Refactor SingSlot application settings to adhere to Twelve-Factor configuration, Student Guide Episode 2 six-point cloud-readiness checklist, and Cloud Run runtime contracts (R-02, R-04).

In-Scope:
- Enforce Student Guide Episode 2.2 Six-Point Cloud-Readiness Checklist:
  1. **Uploaded Files Isolation:** Ensure zero user-generated files are written to local container directories (SingSlot karaoke reservations and audit logs reside strictly in PostgreSQL).
  2. **Production-Safe Seed & Demo Accounts:** Demo account credentials for staff (`staff@singslot.local`) and customers must come strictly from environment variables (`STAFF_PASSWORD`), never hardcoded in source code or committed to Git. For local development, credentials reside in `.env` (ignored by Git); in production, they are mounted via Secret Manager. The seed script must be idempotent and safe to rerun without duplicating records.
  3. **No Development Shortcuts in Production:** Ensure no backdoor login selectors or hardcoded credentials appear on screen. The login modal quick-fill helper must not expose real passwords on screen or bypass authentication in production (`NODE_ENV=production`).
  4. **Stateless Session Management:** SingSlot utilizes cryptographically signed stateless JWT tokens; no session state is maintained in container memory, ensuring users remain logged in across container restarts, new revisions, and instance scaling.
  5. **Dynamic Port Binding:** Ensure `server/src/server.ts` reads `PORT` dynamically from `process.env.PORT` (defaulting to 8080 in production) and binds strictly to `0.0.0.0` (not localhost only).
  6. **Readiness Probe Endpoint (`/api/ready`):** Implement `GET /api/ready` in `server/src/app.ts`:
     - Executes Prisma `$queryRaw` SELECT 1.
     - Reuses the shared Prisma Client instance (`prisma` from `src/prisma.ts`), avoiding connection thrashing and never calling `$disconnect()` on every probe.
     - Enforces a bounded timeout (configured to 3–5 seconds): if the database query exceeds this threshold or encounters an error, it returns HTTP 503 `{ status: "not_ready", error: "Database unreachable" }`.
     - The readiness timeout implementation must avoid accumulating unresolved database queries or exhausting Prisma connection pool resources when repeated probes time out.
     - Do not rely on `Promise.race()` alone as database query cancellation unless the underlying query is actually cancelled.
     - Internal database errors, timeout exceptions, stack traces, and database credentials must be strictly masked from all HTTP responses.
- Update `server/prisma/seed.ts` to require `STAFF_PASSWORD` from environment variables without hardcoded fallback passwords in source code. If missing in production, fail safely with a clean error message.
- Update `server/.env.example` with comprehensive placeholder variables and documentation (zero real secrets).
- Verify compilation and test suites:
  - Run `npm run typecheck` across workspaces (zero TypeScript diagnostic errors).
  - Run `npm run test:client` (12/12 passing layout tests).
  - Author automated tests in `server/tests/ready.test.ts` verifying ready (200), database error (503), and timeout (503) scenarios, asserting no credentials or stack traces leaked.
  - Note: Full server integration tests are verified when PostgreSQL test database is active (local or in CI container).

Out-of-Scope:
- Docker packaging (deferred to Task 3).
- Modifying core reservation business rules (frozen from Sprint 1).

Acceptance Criteria:
- [ ] Student Guide Episode 2 six-point cloud-readiness checklist fully verified (no local disk file storage, safe seed from env, no dev shortcuts/exposed passwords on screen, stateless JWT sessions, PORT bound to 0.0.0.0, and `/api/ready` endpoint).
- [ ] `GET /api/ready` responds with HTTP 200 `{ status: "ready", db: "connected" }` when database query succeeds.
- [ ] `GET /api/ready` responds with HTTP 503 `{ status: "not_ready", error: "Database unreachable" }` when database query fails or exceeds bounded timeout (3–5s).
- [ ] Readiness checks reuse the shared Prisma Client instance and do not expose internal database errors, timeouts, or credentials in HTTP responses.
- [ ] Automated tests in `server/tests/ready.test.ts` verify 200 (connected), 503 (error), and 503 (timeout) scenarios cleanly.
- [ ] Demo account passwords come strictly from environment variables (`STAFF_PASSWORD`) without hardcoded fallback passwords in source code.
- [ ] `server/src/server.ts` reads `PORT` from `process.env.PORT` and binds to `0.0.0.0`.
- [ ] `server/.env.example` lists every required environment variable with placeholder values and zero committed secrets.
- [ ] TypeScript compilation (`npm run typecheck`) passes with zero diagnostic errors across client and server.
- [ ] Client structural tests (`npm run test:client`) pass 12/12.
- [ ] Feature PR opened into `sprint-1-staging`, reviewed, approved by @Phenwatsa, and merged.

Evidence Required for PDF (Part 2):

- Direct link to merged PR into sprint-1-staging.
- Direct link to `server/.env.example` and `server/src/app.ts`.
- Local verification output for `GET /api/ready`.
```

#### 📌 Task 3: Docker Containerization

````markdown
Type: Reproducible Packaging
Assignee: @Phenwatsa
Reviewer: @lephirada
Dependencies: Task 2 (Requires cloud-ready app and /api/ready)
Branch: feat/lab5-docker (created from sprint-1-staging)
PR Target: sprint-1-staging
Label: lab5

Objective:
Package SingSlot monorepo into a reproducible, lightweight production container image verifiable from a clean clone (R-01, C-03).

In-Scope:

- Author root `Dockerfile` using multi-stage build (Vite client build + Node server build + lightweight production runner).
- Production Container Filesystem & Tooling Contract:
  - Configure production container filesystem structure:
    - `/app/server/dist/` (compiled server code)
    - `/app/server/prisma/` (Prisma schema & migrations)
    - `/app/client/dist/` (compiled static frontend assets from Vite build stage)
  - Configure production container working directory at `/app/server` so Prisma CLI seamlessly detects `./prisma/schema.prisma` without path drift.
  - Prisma Client Generation & Tooling Contract:
    - Explicitly execute Prisma Client generation during the Docker build stage using the project's actual schema path (`npx prisma generate --schema=prisma/schema.prisma` executed from the `server/` context). Do not rely solely on implicit postinstall behavior.
    - Production runner stage must explicitly include all dependencies and binaries required by Cloud Run migration and seed commands (`npx prisma migrate deploy` and `npm run prisma:seed`).
    - If `npm ci --omit=dev` is used, Prisma CLI (`prisma`) and seed execution runtime (e.g. `ts-node`/`tsx` or compiled JavaScript in `dist/seed.js`) must either be retained in production dependencies or selectively copied/installed in the runner stage.
    - Container verification MUST confirm that the generated Prisma Client initializes properly and Prisma CLI and seed dependencies are runnable inside the final image.
- Production Frontend Serving & SPA Routing Architecture:
  - Compiled Entry Point & Resolved Asset Path:
    - Server compiles from `server/src/` to `server/dist/` (per `server/tsconfig.json` with `rootDir: "./src"`, `outDir: "./dist"`), placing compiled entry points at `/app/server/dist/server.js` and `/app/server/dist/app.js`.
    - Express server resolves static assets using:
      `const clientDistPath = process.env.CLIENT_DIST_PATH || path.resolve(__dirname, '../../client/dist');`
      which evaluates from `__dirname` (`/app/server/dist`) directly to `/app/client/dist`.
  - Middleware & Routing Registration Order (Prevent API 404 Swallowing):
    1. **Register API Routes:** Mount all API routers under `/api` (`/api/health`, `/api/ready`, `/api/auth`, `/api/bookings`, `/api/rooms`, `/api/availability`).
    2. **Unmatched API 404 Handler:** Catch both `/api` and all sub-routes `/api/*` that match no endpoint, immediately returning JSON 404 `{ success: false, error: { code: 'NOT_FOUND', message: 'API endpoint not found' } }`, strictly prevented from falling through to HTML.
    3. **Static Frontend Assets:** Serve static assets from `/app/client/dist` via `express.static(clientDistPath)`.
    4. **SPA Fallback Handler:** Catch-all non-API GET requests (using syntax compatible with installed Express `^4.21.1`) sending `/app/client/dist/index.html`.
  - Same-Origin API Request Contract:
    - Frontend client code strictly uses same-origin relative URLs (`/api/*`, e.g. `/api/rooms`, `/api/availability`, `/api/auth/login`) without hardcoding `localhost:5001` or development origins.
    - Development mode retains Vite proxy (`vite.config.ts`) forwarding `/api` to local Express on `http://localhost:5001`.
    - Production build runs same-origin on Cloud Run port 8080, eliminating CORS overhead.
- Author `.dockerignore` excluding node_modules, .git, .env, and local test caches.
- Provide `docker-compose.yml` for local multi-container development with PostgreSQL database and migration runner.
- Verification beyond CLI stub:
  - Build container image: `docker build -t singslot-app .`.
  - Verify filesystem, compiled entry point, and local Prisma binary inside the production image:
    ```bash
    docker run --rm --entrypoint sh singslot-app -c \
      'test -d /app/server/dist &&
       test -f /app/server/dist/server.js &&
       test -f /app/server/prisma/schema.prisma &&
       test -f /app/client/dist/index.html &&
       ./node_modules/.bin/prisma --version'
    ```
  - Verify `@prisma/client` package resolves and initializes cleanly in the container working directory (`/app/server`):
    ```bash
    docker run --rm --entrypoint node singslot-app -e \
      "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); console.log('Prisma Client initialized successfully');"
    ```
    *(Note: Instantiating `new PrismaClient()` verifies that generated client artifacts, typings, and runtime dependencies resolve cleanly inside the production image without requiring an active database connection. Live database connectivity is validated separately during migration and seed execution against PostgreSQL).*
  - Execute live container migration and seed test against a local PostgreSQL test container in `docker-compose` (`./node_modules/.bin/prisma migrate deploy` and `npm run prisma:seed`) to confirm schema detection, migration application, and seed idempotency inside the container environment.

Out-of-Scope:
- GitHub Actions CI workflow (deferred to Task 4).
- Pushing images to Google Artifact Registry (deferred to Tasks 4/5).

Acceptance Criteria:
- [ ] Root `Dockerfile` builds a working container image from a fresh clone without host-specific files.
- [ ] `.dockerignore` properly prevents sensitive and heavy directories from entering the build context.
- [ ] Multi-stage build outputs a minimal production image containing runtime dependencies, built static assets, Prisma CLI, schema, and migration files with configured working directory.
- [ ] Prisma Client is explicitly generated from the correct schema during the Docker build (`npx prisma generate --schema=prisma/schema.prisma`).
- [ ] The generated Prisma Client is available and can be initialized successfully inside the final production container (verified via `docker run --rm --entrypoint node singslot-app -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); console.log('Prisma Client initialized successfully');"`).
- [ ] Production runner image includes Prisma CLI local binary and seed execution runtime, verified runnable via `./node_modules/.bin/prisma --version` inside the container.
- [ ] The resolved frontend asset path is verified from the actual compiled Express entry point inside the production container.
- [ ] The resolved path points to `/app/client/dist` and contains both `index.html` and the generated Vite assets.
- [ ] Unknown `/api` and `/api/*` requests return JSON 404 and never return the frontend `index.html`.
- [ ] SPA fallback syntax is compatible with the Express version installed in `server/package.json`.
- [ ] Production frontend uses same-origin relative API requests under `/api/*` without hardcoded localhost URLs.
- [ ] Production build does not contain development-only API origins.
- [ ] Local production container serves the built frontend successfully.
- [ ] SPA routes support direct navigation and page refresh inside the local container.
- [ ] API endpoints and unmatched API requests behave correctly inside the local container.
- [ ] Application starts inside the container and responds on the port specified by `PORT`.
- [ ] Migration and seed commands verified working inside the container against a PostgreSQL test database in docker-compose.
- [ ] Feature PR opened into `sprint-1-staging`, reviewed, approved by @lephirada, and merged.

Evidence Required for PDF (Part 2):

- Direct links to `Dockerfile`, `.dockerignore`, and `docker-compose.yml`.
- Terminal commands and output showing successful clean clone build and run (C-03):
  1. Fresh clone into a separate directory: `git clone https://github.com/Phenwatsa/singslot-karaoke.git fresh-clone`
  2. Install dependencies from lockfile: `npm ci`
  3. Copy and fill only `.env.example` placeholders into local `.env` (no committed secrets)
  4. Build container image and start local composition with PostgreSQL: `docker compose up --build -d`
  5. Verify system readiness: `curl -f http://localhost:8080/api/ready` returning HTTP 200 `{ status: "ready", db: "connected" }`
  6. Verify web UI and API work together locally
- Direct links to `server/.env.example` and environment variable specification table in `docs/labs/lab-05/deployment.md` proving zero secrets are committed.
````

#### 📌 Task 4: CI Quality Gate on Pull Requests

````markdown
Type: Continuous Integration & Automated Verification
Assignee: @lephirada
Reviewer: @Phenwatsa
Dependencies: Task 2, Task 3 (Requires Dockerfile and cloud-ready codebase)
Branch: feat/lab5-ci (created from sprint-1-staging)
PR Target: sprint-1-staging -> Release PR into main
Label: lab5

Objective:
Configure automated CI pipeline on GitHub Actions to test all PRs, verify Docker builds, and prepare deployment tooling on main (R-05, R-07).

In-Scope:

- Add `.github/workflows/ci-docker.yml` with job `test-and-docker` configured for both PR triggers and reusable invocation:
  ```yaml
  on:
    pull_request:
      branches: [main, sprint-1-staging]
    workflow_call:
    workflow_dispatch:
  ```
- Add `deploy/` directory as **Deployment Tooling Preparation**:
  - Incorporate `deploy.sh`, `release.sh`, `smoke_test.py`, `teardown.sh`.
  - Incorporate offline stub tests in `deploy/tests/` verifying deploy scripts statically without connecting to GCP.
- Configure CI job steps:
  1. Spin up PostgreSQL 16 Alpine service container with explicit health check:
     ```yaml
     services:
       postgres:
         image: postgres:16-alpine
         env:
           POSTGRES_DB: singslot_test
           POSTGRES_USER: postgres
           POSTGRES_PASSWORD: postgres
         ports:
           - 5432:5432
         options: >-
           --health-cmd "pg_isready -U postgres -d singslot_test"
           --health-interval 10s
           --health-timeout 5s
           --health-retries 5
     ```
  2. Configure job environment variables for service container testing:
     ```yaml
     env:
       DATABASE_URL: postgresql://postgres:postgres@localhost:5432/singslot_test?schema=public
       STAFF_PASSWORD: ci-test-staff-pass-123!
       JWT_SECRET: ci-test-jwt-secret-for-testing-only-not-production
     ```
  3. Checkout code and set up Node.js 20 with npm caching:
     ```yaml
     - uses: actions/checkout@v4
     - uses: actions/setup-node@v4
       with:
         node-version: 20
         cache: 'npm'
     ```
  4. Install dependencies deterministically from root lockfile:
     ```bash
     npm ci
     ```
  5. Execute Prisma migrations and idempotent seed on service container from `server/` workspace context:
     ```bash
     cd server && npx prisma migrate deploy && npm run prisma:seed
     ```
     Zero production secrets used in CI.
  6. Run static typecheck across all workspaces:
     ```bash
     npm run typecheck
     ```
  7. Run backend and frontend test suites independently:
     ```bash
     npm run test:server
     npm run test:client
     ```
  8. Run offline deploy script tests (`deploy/tests/`).
  9. Execute `docker build .` on root Dockerfile (verification only, zero push).
- Bootstrap Exception & Verification Sequence:
  - Since `.github/workflows/ci-docker.yml` does not exist on base branches (`sprint-1-staging` and `main`) prior to Task 4, the initial PR introducing it cannot be evaluated by a pre-existing workflow on the base branch.
  - Initial Bootstrap PR: Author executes and verifies `npm run typecheck`, backend test suite (`npm run test:server`), client test suite (`npm run test:client`), database migration & seed, deploy script offline tests (`deploy/tests/`), and `docker build .` locally, recording full terminal test logs as PR verification evidence.
  - Merge into `sprint-1-staging`, then open Release PR into `main` and merge to place `deploy/` and `ci-docker.yml` on `main`.
  - **Post-Bootstrap Live CI Verification (C-01):**
    - After the Release PR is merged into `main`, open a dedicated verification PR targeting `main` directly with a minor non-code change (e.g., test comment or README touch).
    - Confirm that GitHub Actions automatically triggers and the `test-and-docker` job runs to completion and passes.
    - Use this actual GitHub Actions PR run as the official C-01 evidence for Part 1 of the PDF and as the registered check when configuring the `main` Ruleset in Task 6.
    - Do not treat local verification logs as a substitute for the required live GitHub Actions PR run.

Out-of-Scope:

- Live cloud deployment execution (CD workflow is built in Task 7; manual deployment is executed in Task 5).
- Workload Identity Federation authentication (deferred to Task 6/7).

Acceptance Criteria:

- [ ] `.github/workflows/ci-docker.yml` introduces job `test-and-docker` with triggers for PRs into `sprint-1-staging`, `main`, and `workflow_call`.
- [ ] Job `test-and-docker` installs dependencies via `npm ci`, runs `npm run typecheck`, executes migrations/seed from `server/`, and runs `npm run test:server` and `npm run test:client` cleanly against PostgreSQL service container.
- [ ] Docker build step in CI succeeds without pushing.
- [ ] Offline deploy script stub tests pass cleanly.
- [ ] Initial bootstrap PR verified locally with passing typecheck, tests, and docker build before merge into `sprint-1-staging`.
- [ ] Release PR from `sprint-1-staging` into `main` is approved, merged, and puts `deploy/` on `main`.
- [ ] Post-bootstrap verification PR opened targeting `main` with live GitHub Actions CI run passing cleanly (C-01).

Evidence Required for PDF (Part 1):

- Direct link to `.github/workflows/ci-docker.yml` on `main`.
- Direct link to green CI run on PR with test summary (C-01).
- Direct link to merged Release PR into `main`.

````

#### 📌 Task 5: First GCP Deployment

````markdown
Type: Cloud Deployment & Persistence
Assignee: @Phenwatsa
Reviewer: @lephirada
Dependencies: Task 1 (GCP Project/Billing ready), Task 4 (deploy/ scripts merged onto main)
Branch: None (Executed via Google Cloud Shell cloning main)
Label: lab5

Objective:
Execute initial cloud deployment of SingSlot to Google Cloud Run with persistent Cloud SQL PostgreSQL database (R-03, R-04).

In-Scope:
- Cloud Shell Environment Initialization & Project Validation:
  ```bash
  export PROJECT_ID="$(gcloud config get-value project)"
  export REGION="asia-southeast1"

  if [[ -z "$PROJECT_ID" || "$PROJECT_ID" == "(unset)" ]]; then
    echo "ERROR: GCP project is not configured in gcloud CLI" >&2
    exit 1
  fi

  gcloud config set project "$PROJECT_ID"
  echo "Operating on Project: $PROJECT_ID, Region: $REGION"
  ```
- Customize `deploy/deploy.sh` with SingSlot resource names (`asia-southeast1`).
- Run `DRY_RUN=1` simulation in Cloud Shell, verify commands before execution.
- Execute deployment script:
  1. Enable required Google Cloud APIs (Cloud Run, Cloud SQL, Artifact Registry, Cloud Build, Secret Manager, IAM, IAM Credentials, STS):
     ```bash
     gcloud services enable \
       run.googleapis.com \
       sqladmin.googleapis.com \
       artifactregistry.googleapis.com \
       cloudbuild.googleapis.com \
       secretmanager.googleapis.com \
       iam.googleapis.com \
       iamcredentials.googleapis.com \
       sts.googleapis.com \
       --project="$PROJECT_ID"
     ```
  2. Create Artifact Registry repository `singslot`:
     ```bash
     gcloud artifacts repositories create singslot \
       --repository-format=docker \
       --location="$REGION" \
       --project="$PROJECT_ID" \
       --description="SingSlot container repository"
     ```
  3. Create Cloud SQL PostgreSQL 16 instance with explicit parameters (Note: `db-f1-micro` shared-core tier is supported by Google Cloud for Cloud SQL Enterprise coursework and cost governance within the $30–$50 budget; while shared-core tiers do not carry high-availability SLAs, they are sufficient for lab demonstration. The team must monitor actual billing metrics and delete all cloud resources promptly after evaluation/grading is complete):
     ```bash
     gcloud sql instances create singslot-pg \
       --database-version=POSTGRES_16 \
       --edition=enterprise \
       --tier=db-f1-micro \
       --region="$REGION" \
       --project="$PROJECT_ID" \
       --storage-size=10 \
       --storage-type=SSD \
       --no-storage-auto-increase
     ```
  4. Create PostgreSQL database `singslot` and application user `singslot` (non-superuser).
  5. Enforce Principle of Least Privilege by creating two distinct Service Accounts:
     - `singslot-runner` (Cloud Run Service runtime SA):
       - Role `roles/cloudsql.client` on the project.
       - Role `roles/secretmanager.secretAccessor` granted at the individual secret resource level strictly for `singslot-database-url` and `singslot-jwt-secret`. (Must NOT have Secret Accessor permission on `singslot-staff-password`).
     - `singslot-migrator` (Cloud Run Migration Job SA):
       - Role `roles/cloudsql.client` on the project.
       - Role `roles/secretmanager.secretAccessor` granted at the individual secret resource level strictly for `singslot-database-url` and `singslot-staff-password`.
  6. Store 3 secrets in Secret Manager (zero secrets committed or logged):
     - `singslot-database-url`: Prisma PostgreSQL Unix socket connection string:
       - Before storing `singslot-database-url` in Secret Manager:
         - Replace `$PROJECT_ID` and `$REGION` with the actual GCP Project ID and region to form the exact Cloud SQL connection name: `${PROJECT_ID}:${REGION}:singslot-pg`.
         - URL-encode the database password before inserting it into the connection string (preventing special characters like `@`, `#`, `/`, `?` from corrupting the URI).
         - Verify that the final secret contains the actual connection name without unresolved placeholders:
           `postgresql://singslot:URL_ENCODED_PASSWORD@localhost/singslot?host=/cloudsql/ACTUAL_PROJECT_ID:ACTUAL_REGION:singslot-pg&schema=public&connection_limit=3`
         - Never print the complete DATABASE_URL or password in terminal output or logs.
     - `singslot-jwt-secret`: 256-bit cryptographic secret (`openssl rand -base64 32`) required by `server/src/config/jwt.ts` to sign/verify authentication tokens (prevents runtime boot crash).
     - `singslot-staff-password`: Seed application credentials for staff demo account (`staff@singslot.local`).
  7. Build, push, and validate initial production container image in Artifact Registry:
     ```bash
     export IMAGE_TAG="$(git rev-parse HEAD)"
     export IMAGE_URI="${REGION}-docker.pkg.dev/$PROJECT_ID/singslot/singslot:$IMAGE_TAG"
     gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet
     docker build -t "$IMAGE_URI" .
     docker push "$IMAGE_URI"

     export DIGEST="$(gcloud artifacts docker images describe "$IMAGE_URI" --format='value(image_summary.digest)')"
     if [[ -z "$DIGEST" || ! "$DIGEST" =~ ^sha256:[0-9a-f]{64}$ ]]; then
       echo "ERROR: Invalid or missing image digest: $DIGEST" >&2
       exit 1
     fi
     export DIGEST_IMAGE="${REGION}-docker.pkg.dev/$PROJECT_ID/singslot/singslot@$DIGEST"
     echo "Verified Immutable Deployed Image: $DIGEST_IMAGE"
     ```
  8. Deploy and execute migration Cloud Run job `singslot-migrate`:
     - Uses immutable production image digest `$DIGEST_IMAGE`:
     ```bash
     gcloud run jobs deploy singslot-migrate \
       --image "$DIGEST_IMAGE" \
       --region "$REGION" \
       --service-account "singslot-migrator@$PROJECT_ID.iam.gserviceaccount.com" \
       --set-cloudsql-instances "$PROJECT_ID:$REGION:singslot-pg" \
       --set-secrets "DATABASE_URL=singslot-database-url:latest,STAFF_PASSWORD=singslot-staff-password:latest" \
       --set-env-vars "NODE_ENV=production,TZ=Asia/Bangkok" \
       --command "sh" \
       --args "-c,cd /app/server && npx prisma migrate deploy && npm run prisma:seed" \
       --max-retries 1 \
       --task-timeout 300s
     ```
     Execute migration job with `gcloud run jobs execute singslot-migrate --region "$REGION" --wait`. Must exit with code 0 before service deploy.
  9. Deploy Cloud Run service `singslot`:
     - Image: `$DIGEST_IMAGE` (exact same immutable digest as migration job).
     - Configure public access: `--allow-unauthenticated` (allows public invocation without Google account login; customer/staff authentication is managed by application-level JWT).
     - Attach Cloud SQL connection: `--add-cloudsql-instances="$PROJECT_ID:$REGION:singslot-pg"`.
     - Mount secrets: `--set-secrets="DATABASE_URL=singslot-database-url:latest,JWT_SECRET=singslot-jwt-secret:latest"`.
     - Set environment variables: `--set-env-vars="NODE_ENV=production,TZ=Asia/Bangkok"`.
     - Service account: `--service-account="singslot-runner@$PROJECT_ID.iam.gserviceaccount.com"`.
     - Set configuration: min-instances=0, max-instances=3, memory=512Mi, port=8080.
     - Consolidated Cloud Shell deployment command:
       ```bash
       gcloud run deploy singslot \
         --image "$DIGEST_IMAGE" \
         --region "$REGION" \
         --project "$PROJECT_ID" \
         --allow-unauthenticated \
         --add-cloudsql-instances "$PROJECT_ID:$REGION:singslot-pg" \
         --set-secrets "DATABASE_URL=singslot-database-url:latest,JWT_SECRET=singslot-jwt-secret:latest" \
         --set-env-vars "NODE_ENV=production,TZ=Asia/Bangkok" \
         --service-account "singslot-runner@$PROJECT_ID.iam.gserviceaccount.com" \
         --port 8080 \
         --cpu 1 \
         --min-instances 0 \
         --max-instances 3 \
         --memory 512Mi \
         --quiet
       ```
  10. Enforce storage cap safeguard verification:
      `gcloud sql instances describe singslot-pg --format="value(settings.storageAutoResize)"` returns `False`.
- Verify pipeline order: Migration job MUST execute and succeed BEFORE Cloud Run service is updated.
- Execute read-only smoke tests: `/api/health`, `/api/ready` (asserting `db: "connected"`), and `python3 deploy/smoke_test.py`.

Out-of-Scope:
- Setting up GitHub Actions deployment automation (deferred to Task 7).
- Generating or downloading any Service Account JSON private keys (Strictly prohibited).

Acceptance Criteria:
- [ ] Cloud SQL PostgreSQL instance active with storage-size=10 and storage auto-increase disabled.
- [ ] Application database `singslot` and non-superuser created in Cloud SQL.
- [ ] Distinct service accounts `singslot-runner` and `singslot-migrator` created with least-privilege secret access at resource level.
- [ ] Initial production container image built, tagged with commit SHA, and pushed to Artifact Registry resolving to immutable digest.
- [ ] Secrets `singslot-database-url`, `singslot-jwt-secret`, and `singslot-staff-password` created in Secret Manager.
- [ ] `singslot-database-url` contains the actual Cloud SQL connection name and a URL-encoded password, with no unresolved placeholders.
- [ ] Cloud Run migration job mounts `DATABASE_URL` and `STAFF_PASSWORD`, running migrations and seed from `/app/server` with exit code 0.
- [ ] Cloud Run service configured with Cloud SQL unix socket, mounts `DATABASE_URL` and `JWT_SECRET`, runs with `NODE_ENV=production,TZ=Asia/Bangkok` under `singslot-runner`.
- [ ] Cloud Run service allows unauthenticated invocation (`--allow-unauthenticated`) at infrastructure level, providing public URL access without Google login (C-04).
- [ ] Public Cloud Run URL serves the production frontend successfully.
- [ ] Frontend routes work after direct navigation or page refresh on live Cloud Run.
- [ ] API requests under `/api/*` reach the Express backend correctly on Cloud Run.
- [ ] `/api/ready` returns HTTP 200 with `db: "connected"` confirming Cloud Run successfully communicates with Cloud SQL.
- [ ] User can access public URL, log in as customer/staff (verifying JWT authentication works without crash), and complete room reservation (C-04).
- [ ] Business rule rejection behaves properly on public URL (e.g. invalid duration or conflict).
- [ ] Zero secrets or database passwords exposed in build logs or console outputs.

Evidence Required for PDF (Part 3):
- Active public Cloud Run URL.
- Screenshots of working UI on public URL (login, booking creation, rule rejection - C-04).
- Screenshots of Cloud Run service and Cloud SQL instance settings (`storageAutoResize: False`).
````

#### 📌 Task 6: WIF Setup & Branch Protection Verification

````markdown
Type: Keyless Security & Quality Gate Enforcement
Assignee: @lephirada
Reviewer: @Phenwatsa
Dependencies: Task 1, Task 4 (for Phase 6A: WIF/Gate); Task 5 (for Phase 6B: Service Account Bindings)
Branch: None (GCP/GitHub Console) + test/prove-gate (Temporary branch)
PR Target: main (for failing PR proof only)
Label: lab5

Objective:
Establish keyless GitHub-to-GCP authentication via Workload Identity Federation (WIF) and enforce branch protection ruleset blocking broken code (R-06).

In-Scope:

- **Phase 6A (WIF Infrastructure, Environment & Merge Gate - Runnable in parallel with Task 5):**
  - Verify required APIs are enabled (`iam.googleapis.com`, `iamcredentials.googleapis.com`, `sts.googleapis.com`):
    ```bash
    gcloud services enable iam.googleapis.com iamcredentials.googleapis.com sts.googleapis.com
    ```
  - Resolve and validate GCP Project ID and Project Number:
    ```bash
    export PROJECT_ID="$(gcloud config get-value project)"
    export PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"

    if [[ -z "$PROJECT_ID" || "$PROJECT_ID" == "(unset)" || -z "$PROJECT_NUMBER" ]]; then
      echo "ERROR: GCP project configuration is incomplete" >&2
      exit 1
    fi

    echo "Operating on Project ID: $PROJECT_ID, Project Number: $PROJECT_NUMBER"
    ```
  - Query GitHub Repository ID and Owner ID via GitHub API.
  - Create Workload Identity Pool `github-actions` and Provider `github-main` on GCP:
    - Attribute Mappings:
      `google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner`
    - Attribute Conditions:
      ```
      assertion.repository == 'Phenwatsa/singslot-karaoke' &&
      assertion.ref == 'refs/heads/main' &&
      assertion.workflow_ref == 'Phenwatsa/singslot-karaoke/.github/workflows/deploy.yml@refs/heads/main'
      ```
  - Create deployer service account `singslot-deployer` with roles `Cloud Run Developer` and `Artifact Registry Writer` (scoped to `singslot` repository). Zero JSON keys generated.
  - Bind `roles/iam.workloadIdentityUser` to allow GitHub Actions to impersonate `singslot-deployer`:
    ```bash
    gcloud iam service-accounts add-iam-policy-binding \
      singslot-deployer@$PROJECT_ID.iam.gserviceaccount.com \
      --role="roles/iam.workloadIdentityUser" \
      --member="principalSet://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github-actions/attribute.repository/Phenwatsa/singslot-karaoke"
    ```
  - Create GitHub Environment `demo` restricted to branch `main` with 4 WIF variables (`GCP_PROJECT_ID`, `GCP_REGION`, `WIF_PROVIDER`, `WIF_SERVICE_ACCOUNT`).
  - Configure GitHub Ruleset `protect-main` on branch `main`:
    - Enforcement: Active.
    - Require pull request before merging (1 required approval; authors cannot approve their own PRs).
    - Require status check: Select the actual registered check name that appeared in the GitHub Ruleset dropdown during Task 4 (e.g. `test-and-docker` or prefixed `CI & Docker Build / test-and-docker`). Do not type blindly; choose the exact name registered from live runs.
    - Require branches to be up to date before merging.
    - Bypass list: Empty (ensures gate is genuinely enforced).
  - Prove the gate works (C-02):
    1. Create temporary branch `test/prove-gate` from `main`.
    2. Intentionally modify a unit test assertion to fail.
    3. Open PR directly targeting `main`.
    4. Wait for CI check to fail.
    5. Capture evidence showing the merge button is visibly BLOCKED by GitHub Ruleset.
    6. Close PR and delete branch without merging (zero impact on released code).

- **Phase 6B (Service Account Delegation Binding - Executed after Task 5 creates accounts):**
  - Once Task 5 completes and creates `singslot-runner` and `singslot-migrator`, grant `roles/iam.serviceAccountUser` to `singslot-deployer` on both accounts (Student Guide Ep 6.2 Step 8):
    ```bash
    gcloud iam service-accounts add-iam-policy-binding \
      singslot-runner@$PROJECT_ID.iam.gserviceaccount.com \
      --role="roles/iam.serviceAccountUser" \
      --member="serviceAccount:singslot-deployer@$PROJECT_ID.iam.gserviceaccount.com"

    gcloud iam service-accounts add-iam-policy-binding \
      singslot-migrator@$PROJECT_ID.iam.gserviceaccount.com \
      --role="roles/iam.serviceAccountUser" \
      --member="serviceAccount:singslot-deployer@$PROJECT_ID.iam.gserviceaccount.com"
    ```
  - Confirms deployer can run the deployed app and migration job under their respective least-privilege identities without possessing JSON keys.

Out-of-Scope:

- Merging failing code into `main` (Strictly forbidden).
- Creating Service Account JSON keys.

Acceptance Criteria:
- [ ] PROJECT_ID and PROJECT_NUMBER are explicitly resolved and validated before creating the Workload Identity User IAM binding.
- [ ] Workload Identity Pool and Provider configured with repository, ref, and workflow attribute conditions.
- [ ] Provider attribute mappings include `google.subject=assertion.sub` and `attribute.repository=assertion.repository`.
- [ ] Deployer service account grants `roles/iam.workloadIdentityUser` to `principalSet` with `$PROJECT_NUMBER` and repository `Phenwatsa/singslot-karaoke`.
- [ ] Deployer service account created with zero keys in IAM & Admin -> Service Accounts -> Keys.
- [ ] GitHub Environment `demo` configured with 4 required variables and restricted to `main`.
- [ ] GitHub Ruleset `protect-main` is Active with bypass list empty, selecting registered check name from live dropdown.
- [ ] Temporary PR with failing test triggers red CI check and GitHub visibly blocks merge button (C-02).
- [ ] Temporary PR closed and branch deleted with zero impact on released code.
- [ ] Deployer service account bound with `roles/iam.serviceAccountUser` on `singslot-runner` and `singslot-migrator` after Task 5 creates them.
- [ ] Preserve commit, PR, and CI run history (do not delete or rewrite history). Keep the `protect-main` ruleset and status check permanently active post-submission (R-10).

Evidence Required for PDF (Part 1):

- Captioned screenshot of GitHub Ruleset settings showing Active status and required check.
- Direct link and captioned screenshot of temporary PR showing failed check and blocked merge (C-02).
````

#### 📌 Task 7: Automatic Deployment Pipeline

````markdown
Type: Continuous Deployment & Repeatable Release
Assignee: @Phenwatsa
Reviewer: @lephirada
Dependencies: Task 4 (CI foundation), Task 5 (Cloud resources exist), Task 6 (WIF configured)
Branch: feat/lab5-auto-deploy (from sprint-1-staging) -> later feat/lab5-deploy-proof
PR Target: sprint-1-staging -> Release PR into main
Label: lab5

Objective:
Implement automated CD workflow triggering upon merge to main with image digest tagging and proof of repeatability (R-07, R-08).

In-Scope:

- Add `.github/workflows/deploy.yml` with exact workflow name `Deploy demo`:
  ```yaml
  name: Deploy demo
  on:
    push:
      branches: [main]
    workflow_dispatch:
      inputs:
        image_tag:
          description: "Full 40-character commit SHA to deploy (leave empty for latest main)"
          required: false
          type: string
  permissions:
    contents: read
  concurrency:
    group: deploy-demo
    cancel-in-progress: false
  jobs:
    test:
      if: github.ref == 'refs/heads/main' && !inputs.image_tag
      uses: ./.github/workflows/ci-docker.yml
    deploy:
      needs: test
      if: >-
        always() && !cancelled() && github.ref == 'refs/heads/main' &&
        (needs.test.result == 'success' ||
         (github.event_name == 'workflow_dispatch' && inputs.image_tag != '' && needs.test.result == 'skipped'))
      runs-on: ubuntu-latest
      environment: demo
      env:
        PROJECT_ID: ${{ vars.GCP_PROJECT_ID }}
        REGION: ${{ vars.GCP_REGION }}
        WIF_PROVIDER: ${{ vars.WIF_PROVIDER }}
        WIF_SERVICE_ACCOUNT: ${{ vars.WIF_SERVICE_ACCOUNT }}
      permissions:
        contents: read
        id-token: write # Required for keyless Google Cloud login via WIF
      steps:
        - name: Checkout code
          uses: actions/checkout@v4

        - name: Validate manual image tag
          if: github.event_name == 'workflow_dispatch' && inputs.image_tag != ''
          shell: bash
          env:
            IMAGE_TAG: ${{ inputs.image_tag }}
          run: |
            if [[ ! "$IMAGE_TAG" =~ ^[0-9a-f]{40}$ ]]; then
              echo "ERROR: image_tag must be a full 40-character lowercase commit SHA." >&2
              exit 1
            fi
            echo "Validated rollback target SHA: $IMAGE_TAG"

        - name: Authenticate to Google Cloud via WIF
          uses: google-github-actions/auth@v2
          with:
            workload_identity_provider: ${{ env.WIF_PROVIDER }}
            service_account: ${{ env.WIF_SERVICE_ACCOUNT }}

        - name: Set up Cloud SDK
          uses: google-github-actions/setup-gcloud@v2

        - name: Execute rollback or roll-forward
          if: github.event_name == 'workflow_dispatch' && inputs.image_tag != ''
          env:
            IMAGE_TAG: ${{ inputs.image_tag }}
            PROJECT_ID: ${{ env.PROJECT_ID }}
            REGION: ${{ env.REGION }}
          run: bash deploy/release.sh

        - name: Configure Docker Authentication
          if: inputs.image_tag == ''
          shell: bash
          run: |
            gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet

        - name: Build and Push Release Image
          if: inputs.image_tag == ''
          shell: bash
          run: |
            IMAGE_TAG="${GITHUB_SHA}"
            if [[ ! "$IMAGE_TAG" =~ ^[0-9a-f]{40}$ ]]; then
              echo "ERROR: Invalid commit SHA: $IMAGE_TAG" >&2
              exit 1
            fi
            IMAGE_URI="${REGION}-docker.pkg.dev/${PROJECT_ID}/singslot/singslot:${IMAGE_TAG}"
            echo "IMAGE_TAG=$IMAGE_TAG" >> "$GITHUB_ENV"
            echo "IMAGE_URI=$IMAGE_URI" >> "$GITHUB_ENV"
            echo "Building image: $IMAGE_URI"
            docker build -t "$IMAGE_URI" .
            docker push "$IMAGE_URI"

        - name: Resolve and Validate Immutable Digest
          if: inputs.image_tag == ''
          shell: bash
          run: |
            export DIGEST="$(gcloud artifacts docker images describe "$IMAGE_URI" --format='value(image_summary.digest)')"
            if [[ -z "$DIGEST" || ! "$DIGEST" =~ ^sha256:[0-9a-f]{64}$ ]]; then
              echo "ERROR: Invalid or missing image digest: $DIGEST" >&2
              exit 1
            fi
            export DIGEST_IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/singslot/singslot@$DIGEST"
            echo "DIGEST_IMAGE=$DIGEST_IMAGE" >> "$GITHUB_ENV"
            echo "Verified Immutable Release Image: $DIGEST_IMAGE"

        - name: Update and Execute Database Migration Job
          if: inputs.image_tag == ''
          shell: bash
          run: |
            echo "Updating singslot-migrate job to image: $DIGEST_IMAGE"
            gcloud run jobs update singslot-migrate \
              --image="$DIGEST_IMAGE" \
              --project="$PROJECT_ID" \
              --region="$REGION" \
              --quiet
            echo "Executing singslot-migrate job..."
            gcloud run jobs execute singslot-migrate \
              --region="$REGION" \
              --project="$PROJECT_ID" \
              --wait \
              --quiet

        - name: Deploy Cloud Run Service Revision and Shift Traffic
          if: inputs.image_tag == ''
          shell: bash
          run: |
            echo "Deploying singslot service with image: $DIGEST_IMAGE"
            gcloud run services update singslot \
              --image="$DIGEST_IMAGE" \
              --project="$PROJECT_ID" \
              --region="$REGION" \
              --quiet
            gcloud run services update-traffic singslot \
              --to-latest \
              --project="$PROJECT_ID" \
              --region="$REGION" \
              --quiet

        - name: Execute Automated Smoke Tests
          if: inputs.image_tag == ''
          shell: bash
          run: |
            export SERVICE_URL="$(gcloud run services describe singslot --format='value(status.url)' --region="$REGION" --project="$PROJECT_ID")"
            echo "SERVICE_URL=$SERVICE_URL" >> "$GITHUB_ENV"
            python3 deploy/smoke_test.py "$SERVICE_URL"

        - name: Generate Release Summary
          shell: bash
          run: |
            SERVICE_URL="$(gcloud run services describe singslot --format='value(status.url)' --region="$REGION" --project="$PROJECT_ID")"
            DEPLOYED_IMAGE="$(gcloud run services describe singslot \
              --format='value(spec.template.spec.containers[0].image)' \
              --region="$REGION" \
              --project="$PROJECT_ID")"

            if [[ ! "$DEPLOYED_IMAGE" =~ @sha256:[0-9a-f]{64}$ ]]; then
              echo "ERROR: Deployed Cloud Run image is not pinned to a valid SHA-256 digest: $DEPLOYED_IMAGE" >&2
              exit 1
            fi

            DEPLOYED_IMAGE_DIGEST="${DEPLOYED_IMAGE##*@}"
            REVISION_NAME="$(gcloud run services describe singslot --format='value(status.latestReadyRevisionName)' --region="$REGION" --project="$PROJECT_ID")"
            echo "=========================================="
            echo " SingSlot Release Deployment Successful"
            echo "=========================================="
            echo "Commit SHA:     ${{ inputs.image_tag || github.sha }}"
            echo "Image Digest:   $DEPLOYED_IMAGE_DIGEST"
            echo "Cloud Run Rev:  $REVISION_NAME"
            echo "Service URL:    $SERVICE_URL"
            echo "=========================================="
  ```

- Configure workflow execution logic:
  - If `image_tag` is empty (Automated Release on merge to main):
    1. Reuses CI test workflow via `uses: ./.github/workflows/ci-docker.yml`.
    2. Authenticates to GCP using WIF via `google-github-actions/auth@v2` (Keyless OIDC exchange). Reads environment variables from GitHub Environment `demo`:
       `PROJECT_ID: ${{ vars.GCP_PROJECT_ID }}` and `REGION: ${{ vars.GCP_REGION }}` (zero hardcoded GCP IDs in workflow). Sets up gcloud CLI via `google-github-actions/setup-gcloud@v2`.
    3. Configures Docker credential helper for Artifact Registry:
       ```bash
       gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet
       ```
    4. Validates commit SHA, constructs `IMAGE_TAG` and `IMAGE_URI`, then builds and pushes production image:
       ```bash
       IMAGE_TAG="${GITHUB_SHA}"
       if [[ ! "$IMAGE_TAG" =~ ^[0-9a-f]{40}$ ]]; then
         echo "ERROR: Invalid commit SHA: $IMAGE_TAG" >&2
         exit 1
       fi
       IMAGE_URI="${REGION}-docker.pkg.dev/${PROJECT_ID}/singslot/singslot:${IMAGE_TAG}"
       echo "IMAGE_TAG=$IMAGE_TAG" >> "$GITHUB_ENV"
       echo "IMAGE_URI=$IMAGE_URI" >> "$GITHUB_ENV"
       echo "Building image: $IMAGE_URI"

       docker build -t "$IMAGE_URI" .
       docker push "$IMAGE_URI"
       ```
    5. Resolves immutable image digest from Artifact Registry and enforces strict digest format validation before deployment:
       ```bash
       export DIGEST="$(gcloud artifacts docker images describe "$IMAGE_URI" --format='value(image_summary.digest)')"
       if [[ -z "$DIGEST" || ! "$DIGEST" =~ ^sha256:[0-9a-f]{64}$ ]]; then
         echo "ERROR: Invalid or missing image digest: $DIGEST" >&2
         exit 1
       fi
       export DIGEST_IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/singslot/singslot@$DIGEST"
       echo "DIGEST_IMAGE=$DIGEST_IMAGE" >> $GITHUB_ENV
       echo "Verified Immutable Release Image: $DIGEST_IMAGE"
       ```
    6. **Updates Cloud Run migration job image before execution:**
       `gcloud run jobs update singslot-migrate --image="$DIGEST_IMAGE" --project="$PROJECT_ID" --region="$REGION" --quiet`
    7. **Executes Cloud Run migration job:**
       `gcloud run jobs execute singslot-migrate --wait --project="$PROJECT_ID" --region="$REGION" --quiet`
       If migration fails (non-zero exit code), deployment MUST abort immediately before service update.
    8. **Deploys Cloud Run service revision:**
       `gcloud run services update singslot --image="$DIGEST_IMAGE" --project="$PROJECT_ID" --region="$REGION" --quiet`
       `gcloud run services update-traffic singslot --to-latest --project="$PROJECT_ID" --region="$REGION" --quiet`
    9. **Resolves live service URL and executes read-only smoke tests:**
       ```bash
       export SERVICE_URL="$(gcloud run services describe singslot --format='value(status.url)' --region="$REGION" --project="$PROJECT_ID")"
       echo "SERVICE_URL=$SERVICE_URL" >> $GITHUB_ENV
       python3 deploy/smoke_test.py "$SERVICE_URL"
       ```
    10. Outputs release summary (Commit SHA, immutable image digest, Cloud Run revision name, and public URL).
  - If `image_tag` is provided (Manual Rollback / Roll-forward):
    1. **Workflow Trigger & Local SHA Validation:** Enforces execution restricted to `main` branch only (matching WIF attribute condition `refs/heads/main`) and validates that `image_tag` conforms strictly to the 40-character lowercase hexadecimal SHA format (`^[0-9a-f]{40}$`) locally before initiating any cloud operations. If invalid or missing, workflow terminates immediately without calling cloud APIs.
    2. Workflow skips the test, Docker build, and migration steps when `inputs.image_tag` is provided.
    3. **WIF Authentication:** Authenticates to GCP using Workload Identity Federation (Keyless OIDC exchange). Workflow MUST abort immediately if WIF authentication fails.
    4. **Execution Interface for `deploy/release.sh`:** The workflow passes explicit inputs via environment variables:
       ```yaml
       - name: Execute rollback or roll-forward
         if: github.event_name == 'workflow_dispatch' && inputs.image_tag != ''
         env:
           IMAGE_TAG: ${{ inputs.image_tag }}
           PROJECT_ID: ${{ env.PROJECT_ID }}
           REGION: ${{ env.REGION }}
         run: bash deploy/release.sh
       ```
       The script executes the authenticated release contract:
       a. **Validate Inputs:** Validates `IMAGE_TAG`, `PROJECT_ID`, and `REGION` are non-empty and well-formed.
       b. **Verify Image in Registry:** Constructs `${REGION}-docker.pkg.dev/${PROJECT_ID}/singslot/singslot:${IMAGE_TAG}` and confirms image tag exists in Artifact Registry.
       c. **Resolve & Validate Digest:** Resolves corresponding immutable image digest (`@sha256:...`) and validates strict SHA-256 format (`^sha256:[0-9a-f]{64}$`).
       d. **Database Schema Safeguard:** Does NOT execute migration or seed for historical image (database schema is additive/backward-compatible; rollback must never run migrations from an older application image).
       e. **Deploy Revision:** Deploys Cloud Run service revision pointing directly to the resolved historical image digest with 100% traffic shift.
       f. **Smoke Test:** Resolves deployed Cloud Run service URL and runs automated smoke test on live URL.
       g. **Release Summary:** Outputs release summary with target SHA, resolved digest, Cloud Run revision name, and live URL.
    5. For Roll-forward: Target release's required migrations must already have been successfully applied during its initial automated release.
- [Optional Recommended Practice - Student Guide Episode 8] Artifact Registry Image Retention: Configure Artifact Registry cleanup policies so release images tagged with commit SHAs remain permanently available for historical rollback. Do not apply automated deletion or purge policies to retained release images.
- Open PR into `sprint-1-staging`, review, merge, then open Release PR into `main`.
- Merge into `main` and observe automated deployment executing to completion.
- Prove Repeatable Release (C-06):
  1. Create a dedicated GitHub Issue with label `lab5` (e.g. `[Lab 5 - Task 7b] Prove Repeatable Release via UI Update`) to maintain complete lifecycle traceability from Issue → PR → Deploy (R-09, C-06).
  2. Sync `sprint-1-staging` with `main`.
  3. Create branch `feat/lab5-deploy-proof`, make a minor visible UI string update (e.g. `v1.0.1 - Cloud Verified`).
  4. Open Feature PR into staging referencing Issue #7b, request teammate peer review, approve, and merge.
  5. Open Release PR into `main`, merge upon green CI.
  6. Verify pipeline auto-deploys revision 2 and live website displays updated text without manual deploy commands.

Out-of-Scope:

- Manual gcloud deploy commands during normal release (Pipeline must be 100% automated).

Acceptance Criteria:

- [ ] `.github/workflows/deploy.yml` triggers automatically upon merge to `main`.
- [ ] Dedicated GitHub Issue with label `lab5` created to track the second release UI change (C-06).
- [ ] The actual `deploy.yml` workflow implements automated release upon push to `main` (C-06); optionally supports `workflow_dispatch` for manual rollback/roll-forward per Student Guide Episode 8.
- [ ] Workflow reuses `ci-docker.yml` via `uses: ./.github/workflows/ci-docker.yml` and grants `permissions: { contents: read, id-token: write }`.
- [ ] Workflow explicitly authenticates using `google-github-actions/auth@v2` with configured `WIF_PROVIDER` and `WIF_SERVICE_ACCOUNT` without Service Account JSON keys.
- [ ] Google Cloud SDK is set up via `google-github-actions/setup-gcloud@v2` before executing gcloud commands.
- [ ] Required deployment variables (`PROJECT_ID`, `REGION`, `WIF_PROVIDER`, `WIF_SERVICE_ACCOUNT`) are sourced from GitHub `demo` Environment.
- [ ] Automated release constructs `IMAGE_TAG` from full `GITHUB_SHA`, validates 40-character hexadecimal format, and constructs `IMAGE_URI` before Docker build and push.
- [ ] Automated release builds and pushes the image, resolves its immutable digest, executes the migration job, updates Cloud Run, shifts traffic, and runs smoke tests in the required order.
- [ ] Image URI and immutable digest are passed safely between workflow steps via `$GITHUB_ENV`.
- [ ] [Optional Recommended Practice - Episode 8] Workflow supports `workflow_dispatch` with optional `image_tag` parameter restricted to `main`.
- [ ] [Optional Recommended Practice - Episode 8] Manual rollback/roll-forward uses the historical image digest without rebuilding or executing migrations.
- [ ] Automated release explicitly updates `singslot-migrate` job image to the current release digest before executing migration.
- [ ] Cloud Run migration job runs before service update; if migration fails, deployment aborts immediately.
- [ ] [Optional Recommended Practice - Episode 8] Manual `image_tag` is validated as a full 40-character lowercase hexadecimal SHA before WIF authentication or any GCP operation.
- [ ] [Optional Recommended Practice - Episode 8] Invalid or missing rollback image tags cause the workflow to fail safely without modifying Cloud Run resources.
- [ ] [Optional Recommended Practice - Episode 8] `deploy/release.sh` receives explicit inputs (`IMAGE_TAG`, `PROJECT_ID`, `REGION`) and verifies existence in Artifact Registry before deploying by digest during manual rollback/roll-forward.
- [ ] Cloud Run revision deployed by digest with 100% traffic allocation.
- [ ] Smoke tests execute against the actual deployed Cloud Run service URL queried dynamically from live deployment during automated release.
- [ ] [Optional Recommended Practice - Episode 8] Smoke tests execute via `deploy/release.sh` during manual rollback/roll-forward without duplication.
- [ ] Release Summary records the actual deployed image digest for automated releases (and manual rollback/roll-forward if executed), together with the target commit SHA, Cloud Run revision name, and service URL.
- [ ] The recorded image digest matches the immutable image used by the deployed Cloud Run revision.
- [ ] Second release executed via PR lifecycle deploys automatically and updates live UI without manual intervention (C-06).

Evidence Required for PDF (Part 4):

- Direct link to dedicated GitHub Issue with label `lab5` tracking release proof (C-06).
- Direct links to Feature PRs, Release PRs, and GitHub Actions Deploy run.
- Captioned screenshot of Cloud Run revisions showing revision matching commit SHA / image digest (C-06).
- Captioned screenshot of live website showing updated UI text after second release.

````

#### 📌 Task 8: Persistence & Rollback Verification

````markdown
Type: Reliability, Disaster Recovery & Persistence Proof
Assignee: @lephirada
Reviewer: @Phenwatsa
Dependencies: Task 5 (Requires running Cloud Run service and Cloud SQL database); Task 7 for Repeatable Release verification (C-06). (Note: Container Rollback is an optional recommended practice once 2 releases are deployed)
Branch: None (GitHub Actions manual trigger & GCP Console)
Label: lab5

Objective:
Prove database persistence across container instance restart and new revision deployment (R-04, C-05), and optionally demonstrate container rollback using historical commit SHA (Recommended Practice per Student Guide Episode 8).

In-Scope:
- Create a distinct karaoke room reservation on the live public URL (record Room, Date, Slots, Booking Code).
- Execute Application Instance Restart / Container Recycling Proof:
  - Demonstrate that data survives container process termination and cold start:
    - **Local Composition:** Record container ID before restart (`CONTAINER_A=$(docker compose ps -q singslot-app)`), execute `docker compose down && docker compose up -d` (without `-v`), and record new container ID `CONTAINER_B`. Verify `CONTAINER_A != CONTAINER_B`, confirming container process replacement while database volume retains all records intact.
    - **Cloud Run Instance Recycling:** Record Cloud Run Metrics showing active container instance count dropping to 0 during idle scale-to-zero (`min-instances=0`). Send an HTTP request and capture Cloud Run Logs Explorer showing container startup log (`[Server] SingSlot API listening on port 8080`), proving the request is handled by a brand-new container instance. Confirm that the pre-existing booking record is retrieved from Cloud SQL without data loss (C-05).
- Execute Cloud Run Redeployment / New Revision Persistence Test:
  - Enforce creation of a brand new Cloud Run revision using the exact same immutable image digest:
    ```bash
    # 1. Resolve and validate currently deployed immutable image digest
    export PROJECT_ID="$(gcloud config get-value project)"
    export REGION="asia-southeast1"
    export DEPLOYED_IMAGE="$(gcloud run services describe singslot \
      --project="$PROJECT_ID" \
      --region="$REGION" \
      --format='value(spec.template.spec.containers[0].image)')"

    if [[ ! "$DEPLOYED_IMAGE" =~ ^asia-southeast1-docker\.pkg\.dev/[^/]+/singslot/singslot@sha256:[0-9a-f]{64}$ ]]; then
      echo "ERROR: Invalid Artifact Registry image URI or digest: $DEPLOYED_IMAGE" >&2
      exit 1
    fi
    echo "Verified Immutable Deployed Image: $DEPLOYED_IMAGE"

    # 2. Force new Revision deployment using the exact same image digest
    gcloud run services update singslot \
      --image "$DEPLOYED_IMAGE" \
      --update-env-vars="PERSISTENCE_TEST_TRIGGER=$(date +%s)" \
      --region="$REGION" \
      --project="$PROJECT_ID" \
      --quiet

    # 3. Explicitly shift 100% traffic to the new revision
    gcloud run services update-traffic singslot \
      --to-latest \
      --region="$REGION" \
      --project="$PROJECT_ID" \
      --quiet
    ```
  - Verify 4-step proof:
    1. A brand new Cloud Run revision is deployed and active.
    2. The new revision runs the exact same historical image digest.
    3. 100% traffic is shifted to this new revision.
    4. The booking created in Cloud SQL before redeployment remains visible and completely intact on the live UI, proving data resides in Cloud SQL rather than ephemeral container memory (C-05).
- [Optional Recommended Practice - Student Guide Episode 8] Container Rollback & Roll-forward Verification:
  - Execute Rollback via Pipeline:
    1. Open GitHub Actions -> `Deploy demo` workflow -> Run workflow on `main`.
    2. Provide `image_tag` parameter with full 40-character commit SHA of Release 1.
    3. Verify that providing `image_tag` causes the workflow to skip the test, Docker build, and migration steps, then deploys the specified historical image digest without running migrations.
    4. Verify live UI reverts to Release 1 text while reservation data remains intact.
  - Execute Roll-forward:
    1. Target Release 2's required migrations must already have been successfully applied to the database during its initial release.
    2. Run workflow providing the full 40-character Commit SHA of Release 2 to target the historical image directly without re-running migrations.
    3. Verify UI updates back to Release 2 and reservation data remains fully intact.
  - Enforce Database Schema Invariance Safeguard:
    - Confirm all database migrations are backward-compatible (additive) so older application container images run cleanly without schema conflicts.

Out-of-Scope:
- Destructive database schema rollbacks (Schema is additive; data must be preserved).

Acceptance Criteria:
- [ ] Application Instance Restart / Process Recycling (C-05):
  - Verify that the Cloud Run service scales down to zero instances while idle (min-instances=0).
  - Send a new request to trigger a fresh container instance.
  - Capture evidence showing the previous instance count reached zero and a new instance started (Logs Explorer startup event `[Server] SingSlot API listening on port...`).
  - Verify that the booking created before instance recycling remains intact and can still be retrieved from Cloud SQL.
  - Local Docker Compose container ID change (`ID A != ID B`) may be captured as supporting evidence.
- [ ] Redeployment Persistence (C-05): Booking record created before redeployment remains intact after a new Cloud Run revision is deployed using the same immutable image digest (with trigger environment variable) and 100% traffic shift, proving data resides in Cloud SQL rather than ephemeral container memory.
- [ ] [Optional Recommended Practice - Student Guide Episode 8] Container Rollback & Roll-forward Verification:
  - Rollback workflow successfully deploys previous image tag by SHA without rebuilding or running migrations.
  - Deploy Release 1 image against updated database schema and verify core operations.
  - Roll-forward restores Release 2 with all booking data preserved intact.
  - Zero destructive database operations executed during rollback.

Evidence Required for PDF:

Required Evidence (Part 3 - C-05 Persistence & Part 4 - C-06 Release):
- Explicit verification log recording Booking Code, Room Number, Date, and Time Slots before redeployment and verified completely intact afterward (C-05).
- Release 1 and Release 2 full 40-character Commit SHAs and resolved immutable image digests (C-06).
- Captioned screenshot of Cloud Run Metrics showing container instance count dropping to 0 during idle scale-to-zero (`min-instances=0`) and subsequent Logs Explorer cold-start startup log (`[Server] SingSlot API listening on port 8080`), proving fresh container instance recreation (C-05).
- Before-and-after screenshots of Cloud Run Revisions showing new revision name generation and 100% traffic shift while preserving identical immutable image digest (C-05).
- Before-and-after screenshots of booking data surviving restart/redeploy on live Cloud Run UI (C-05).
- (Supporting local evidence): Docker Compose container ID replacement (`CONTAINER_A != CONTAINER_B`) with persistent local database volume.

Optional Evidence (Part 4 Recommended Practice - Student Guide Episode 8):
- Captioned screenshot of GitHub Actions rollback workflow execution deploying Release 1 image without running migrations.
- Captioned screenshot of live website UI successfully reverting to Release 1 while booking data remains intact.
- Captioned screenshot of restored application state after roll-forward to Release 2.
````
