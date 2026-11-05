# Sprint 1 Peer Review Record & Audit Trail
## Project: SingSlot — Karaoke Room Reservation & Management System
**Course:** CPE 334 Introduction to Software Engineering in the Age of AI Agents  
**Target:** Deliverable 1 (Sprint 1 Lean Delivery — The Golden Online Booking Slice)  
**Authors & Reviewers:**  
- **Pair A Developer:** @Phenwatsa (Lead on Setup, Auth, Availability)  
- **Pair B Developer:** @lephirada (Lead on Booking Engine, Conflict TDD, History Views)  

---

## 1. Peer Review Process & Policy (Sprint 1)

1. **Strict Reciprocal Review (No Self-Approval):** Every Pull Request targeted to `sprint-1-staging` must be reviewed and approved by the peer teammate.
2. **Substantive Technical Reviews:** Reviews must verify Acceptance Criteria, code quality, M1 8GB RAM memory constraints, and reproducible test evidence.
3. **Audit Trail Documentation:** Every PR review round (feedback, developer response, fixes applied, and final approval) is recorded in this document.

---

## 2. Summary of Sprint 1 Pull Requests

| PR # | Related Issue | Branch | Author | Reviewer | Review Rounds | Verdict / Status |
|:---:|:---:|---|:---:|:---:|:---:|:---:|
| **#1** | **Issue #1** | `setup/issue-1-baseline-schema` | @Phenwatsa | @lephirada | 4 Rounds | **Approved / Ready to Merge** |
| **#2** | **Issue #2** | `feat/issue-2-auth-jwt-roles` | @Phenwatsa | @lephirada | Planned | *Pending Issue #1 Merge* |
| **#3** | **Issue #3** | `feat/issue-3-availability-lookup` | @Phenwatsa | @lephirada | Planned | *Upcoming* |
| **#4** | **Issue #4** | `feat/issue-4-booking-engine-tdd` | @lephirada | @Phenwatsa | Planned | *Upcoming* |
| **#5** | **Issue #5** | `feat/issue-5-customer-bookings-view` | @lephirada | @Phenwatsa | Planned | *Upcoming* |
| **#6** | **Issue #6** | `feat/issue-6-staff-master-schedule` | @Phenwatsa | @lephirada | Planned | *Upcoming* |

---

## 3. Detailed Review Logs: PR #1 (Issue #1)

### 📌 PR #1: `setup(baseline): implement monorepo scaffolding, baseline schema, and layout shell [Issue #1]`
- **Author:** @Phenwatsa
- **Peer Reviewer:** @lephirada
- **Source Branch:** `setup/issue-1-baseline-schema`
- **Target Branch:** `sprint-1-staging`
- **Scope:** Monorepo scaffolding, PostgreSQL Prisma schema, committed initial migration, idempotent seed, shared layout shell, and baseline tests.

---

#### 🔍 Round 1 Review
* **Reviewer (@lephirada):** `Request Changes`
  * *Feedback:* PR contains documentation updates, but implementation directories (`client/` and `server/`) are empty in the Git tree. Missing committed Prisma migration (`server/prisma/migrations/`). Operating hours indexing must be unified to `0..13` and `RoomBlock` model is missing.
* **Developer Response (@Phenwatsa):**
  * Committed monorepo scaffolding code for both client and server.
  * Added committed initial PostgreSQL migration `20261105000000_init` and `migration_lock.toml`.
  * Standardized slot indexing `0..13` and added `RoomBlock` model with unique constraint.
* **Fix Commits:** `9a4f773`, `164df51`

---

#### 🔍 Round 2 Review
* **Reviewer (@lephirada):** `Request Changes`
  * *Feedback:* Root workspace `package-lock.json` is missing dependency tree. `README.md` missing database creation step (`createdb singslot_dev`). Client test in `package.json` is an `echo` placeholder. Need separation of seed data and test fixtures. Need concurrency conflict prevention strategy documented.
* **Developer Response (@Phenwatsa):**
  * Generated and committed full workspace `package-lock.json`.
  * Updated `README.md` with explicit `createdb singslot_dev` and `.env` configuration.
  * Replaced client test placeholder with executable Node-native structural test runner (`layout.test.mjs`, passing 5/5 in <5ms).
  * Documented transactional pessimistic room-locking strategy (`SELECT FOR UPDATE`) in `docs/system-sds.md`.
* **Fix Commits:** `6209c58`

---

#### 🔍 Round 3 Review
* **Reviewer (@lephirada):** `Request Changes`
  * *Feedback:* Client test performs filesystem/source regex checks rather than React rendering; AC-07 description should reflect this accurately. `App.tsx` hardcodes a logged-in customer (`Alice Customer`), whereas authentication belongs in Issue #2. Missing verifiable clean environment execution evidence (typecheck, build, test, and repeated seed).
* **Developer Response (@Phenwatsa):**
  * Updated AC-07 in documentation to explicitly state "Client Layout Structural & Contract Verification" (deferring full interactive DOM render tests to Issue #2/3).
  * Refactored `App.tsx` to default to an unauthenticated shell (`userRole={null}`, `userName={null}`), and wired navigation/logout buttons to interactive notification banners informing the user of upcoming issue activations.
  * Executed clean environment commands: `npm run typecheck`, `npm run build`, and `npm test` (11/11 tests pass with `--runInBand`).
  * Executed repeated seed runs on PostgreSQL verifying that password hashes remain identical.
* **Fix Commits:** `6c75c77`

---

#### 🔍 Round 4 Review
* **Reviewer (@lephirada):** `Request Changes` (Minor Polish & Evidence Formatting)
  * *Feedback:* Clean installation evidence (`npm ci`) was missing raw stdout. AC-06 covers unique `bookingCode`, but static tests only checked `BookingSlot` and `RoomBlock` unique indexes. Provide verifiable before/after database query outputs showing 0 tables before migration and identical user/room counts with unchanged hashes across seed runs. Clean up Markdown code block fences.
* **Developer Response (@Phenwatsa):**
  * Added test assertions in `server/tests/baseline.test.ts` verifying unique `bookingCode` in both `schema.prisma` and `migration.sql`.
  * Captured clean `npm ci` execution log (558 packages added in 4s).
  * Executed and captured PostgreSQL query logs confirming 0 tables pre-migration, 6 relations post-migration, and identical hash prefixes (`$2a$10$pvTMd...`, `$2a$10$cyD/6...`, `$2a$10$f.qPr...`) across Seed Run 1 and Run 2.
  * Established authoritative test execution log in [`docs/sprints/sprint-1/tests.md`](./tests.md) and formatted PR description cleanly with standard code blocks.
* **Fix Commits:** `ac99aab`, follow-up docs commit.
* **Verdict:** **Approved for Merge into `sprint-1-staging`**

---

## 4. Reciprocal Peer Review Record (Pair A reviewing Pair B)

*(To be populated as @lephirada submits Pull Requests for Issue #4 and Issue #5)*

| PR # | Feature / Issue | Author | Reviewer | Review Notes & Feedback | Status |
|:---:|---|:---:|:---:|---|:---:|
| **#4** | Issue #4: Booking Engine & Concurrency TDD | @lephirada | @Phenwatsa | *Awaiting PR submission* | Pending |
| **#5** | Issue #5: Customer My Bookings View | @lephirada | @Phenwatsa | *Awaiting PR submission* | Pending |
