# GitHub Issues & Team Collaboration Guide
## Project: SingSlot — Sprint 1 Lean Delivery
**Course:** CPE 334 Introduction to Software Engineering in the Age of AI Agents  
**Target:** Deliverable 1 (Git Workflow & Peer Review Evidence)  

---

## 1. Branch Strategy (Mandatory Course Standard)

1. `main`: Protected release branch holding accepted, verified code increments.
2. `sprint-1-staging`: Integration branch for aggregating Sprint 1 work (branched from `main`).
3. `feat/...` or `fix/...`: Short-lived feature branches branched from and merged into `sprint-1-staging` via reviewed Pull Requests.

---

## 2. GitHub Issue Breakdown for Two Team Members

Create these issues on your **GitHub Project Board** to divide responsibilities across vertical slices:

### 📌 Joint Foundation (Pair Programming — Day 1)
* **Issue #1: Project Baseline Setup & Database Schema**
  * **Assignees:** Both Members (Pair Programming)
  * **Scope:** Initialize repository structure, configure Prisma schema (`User`, `Room`, `Booking`, `BookingSlot`), and write database seed script (`npm run prisma:seed`) with 2 roles (Customer, Staff) and 9 rooms (S01–S03, M01–M03, L01–L03).
  * **Linked Contract:** System SDS Section 2

---

### 👤 Member 1 (Pair A): Data Model, Auth & Availability Slice
* **Issue #2: Seeded User Authentication & Role Authorization**
  * **Branch:** `feat/auth-jwt-roles`
  * **Linked Contract:** Contract 1 (F-01, AC-01, AC-01b)
  * **Scope:**
    - Express JWT authentication with bcrypt password verification using seeded credentials.
    - Role verification middleware (`verifyToken`, `requireRole('STAFF')`).
    - Frontend Login view with quick-fill buttons for seeded accounts.
    - Automated tests: `TEST-01`, `TEST-01b`.
* **Issue #3: Room Catalog & Real-Time Availability Grid**
  * **Branch:** `feat/room-availability-grid`
  * **Linked Contract:** Contract 2 (F-02, F-03, AC-02, AC-03)
  * **Scope:**
    - Room catalog view grouped by capacity tier (Small 4, Medium 8, Large 12).
    - 14-slot availability timeline matrix (10:00–24:00) with reactive open/booked visual cues.
    - Endpoints `GET /api/rooms` and `GET /api/availability?date=...`.
    - Automated tests: `TEST-02`, `TEST-03`.

---

### 👤 Member 2 (Pair B): Booking Logic, Conflict Prevention & History Slice
* **Issue #4: Online Booking Engine & Contiguous Validation**
  * **Branch:** `feat/booking-engine`
  * **Linked Contract:** Contract 3 (F-04, AC-04a, AC-04c, AC-04d)
  * **Scope:**
    - Multi-hour selection logic (1 to 5 contiguous hours).
    - Contiguous slot validation loop (BR-01) and past-time rejection (BR-04).
    - Party-size capacity boundary checks (BR-05).
    - Booking submission endpoint `POST /api/bookings/online` via Prisma transaction.
    - Automated tests: `TEST-04a`, `TEST-04c`, `TEST-04d`.
* **Issue #5: Conflict Prevention & Concurrency Protection (TDD Focus)**
  * **Branch:** `feat/conflict-prevention`
  * **Linked Contract:** Contract 3 (F-04, AC-04b, AC-04e)
  * **Scope:**
    - TDD workflow: Write failing test `TEST-04b` (double booking rejection on occupied slot), then implement enforcement logic until passing.
    - Concurrency test `TEST-04e` ensuring parallel requests yield one 201 and one 409.
    - Automated tests: `TEST-04b`, `TEST-04e`.
* **Issue #6: Customer "My Bookings" & Staff Master Schedule Views**
  * **Branch:** `feat/booking-views`
  * **Linked Contract:** Contract 4 (F-05, F-06, AC-05, AC-05b, AC-06)
  * **Scope:**
    - Customer "My Bookings" page with data isolation (Customer cannot read another's bookings).
    - Staff Master Schedule calendar grid viewing all 9 rooms (`GET /api/bookings/master`).
    - Automated tests: `TEST-05`, `TEST-05b`.

---

## 3. Substantive Pull Request Review Templates (Part F Evidence)

> [!IMPORTANT]
> Rubric rules strictly state: **"Authors do not approve their own PRs"** and **"Reviews must contain a specific check, question, finding, or reason for approval."**

### Example 1: Member 2 Reviews Member 1's PR (`feat/auth-jwt-roles`)
* **Review Comment by Member 2:**
  > *"Verified that password hashing correctly utilizes bcrypt with 10 salt rounds per NFR-01. I pulled the branch and ran `npm test auth.test.ts` locally; confirmed that both TEST-01 (successful staff login) and TEST-01b (customer rejected from staff endpoint with 403 Forbidden) pass cleanly. Also verified JWT token lifetime is configured to 8 hours. Approving for merge into sprint-1-staging."*

### Example 2: Member 1 Reviews Member 2's PR (`feat/conflict-prevention`)
* **Review Comment by Member 1:**
  > *"Excellent implementation of the contiguous slot rule (BR-01). I reviewed the TDD commit history and confirmed that TEST-04b initially failed when booking across occupied Slot 4, and passed after adding the interval loop check in `bookingService.ts`. I also verified that the composite unique constraint on `[roomId, bookingDate, slotIndex]` is enforced in the Prisma schema to block concurrent collisions. Tests pass locally. Approved!"*
