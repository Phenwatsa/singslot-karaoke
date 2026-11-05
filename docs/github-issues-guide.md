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
- [ ] AC-05: Seed script is idempotent (running seed multiple times produces identical state without duplicate records).
- [ ] AC-06: Database constraints enforce uniqueness on bookingCode and room/date/slot in BookingSlot and RoomBlock.
- [ ] AC-07: Shared layout components (AppLayout, PageHeader, GlassCard) render navigation header, gradient theme, and footer.
- [ ] AC-08: Test suite runs with --runInBand without spawning parallel worker processes.

AI Verification Note:
- Verify build and typecheck commands succeed on both client and server, migrations succeed from clean database, and baseline tests pass.
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
> *"Verified that password hashing correctly utilizes bcrypt with 10 salt rounds per NFR-01. I pulled the branch and ran `npm test auth.test.ts` locally; confirmed that both TEST-01 (successful staff login), TEST-01a (invalid login rejected with 401), and TEST-01c (customer rejected from staff endpoint with 403 Forbidden) pass cleanly. Also verified JWT token lifetime is configured to 8 hours. Approving for merge into sprint-1-staging."*

### Review Comment Template 2: @Phenwatsa Reviews @lephirada's PR (`feat/issue-5-conflict-prevention`)
> *"Excellent implementation of the contiguous slot rule (BR-01). I reviewed the TDD commit history and confirmed that TEST-04b initially failed when booking across occupied Slot 3, and passed after adding the interval loop check in `bookingService.ts`. I also verified that the composite unique constraint on `[roomId, bookingDate, slotIndex]` is enforced in the Prisma schema to block concurrent collisions. Tests pass locally. Approved!"*
