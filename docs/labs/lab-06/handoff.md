# Sprint 1 UAT Handoff & Environment Instructions

## Project: SingSlot — Karaoke Room Reservation & Management System
**Course:** CPE 334 Introduction to Software Engineering in the Age of AI Agents (Semester 1/2026)  
**Deliverable:** Lab 6 — Independent User Acceptance Testing & Defect Management  
**Product Team:** SingSlot Team (@Phenwatsa, @lephirada)  
**UAT Team:** *(Partner Team)*  

---

## 1. System & Deployment Identification

| Attribute | Specification / Value |
| :--- | :--- |
| **System Name** | SingSlot — Karaoke Room Reservation & Management System |
| **Live Deployed URL** | [https://singslot-4o7kwmd5ma-as.a.run.app](https://singslot-4o7kwmd5ma-as.a.run.app) |
| **Baseline Release Tag** | `v1.0.1 - Cloud Verified` |
| **Baseline Commit SHA** | `e598e21` |
| **GitHub Repository** | [https://github.com/Phenwatsa/singslot-karaoke](https://github.com/Phenwatsa/singslot-karaoke) |
| **Cloud Infrastructure** | Google Cloud Platform (Cloud Run + Cloud SQL PostgreSQL 16) |
| **Server Timezone** | `Asia/Bangkok` (UTC+7) |

---

## 2. Agreed Sprint 1 Accepted-for-Test Scope

The UAT Team is requested to independently test the delivered **Sprint 1 functionality** against [`docs/system-specifications/srs.md`](../../system-specifications/srs.md) and [`docs/sprints/sprint-1/contracts.md`](../../sprints/sprint-1/contracts.md). Sprint 2 and Sprint 3 features are not part of this evaluation.

### ✅ In-Scope (Delivered Sprint 1 Functionality)
1. **User Authentication & RBAC (`FR-01`, `BR-08`, `NFR-01`, `NFR-02`, `AC-01`..`AC-01e`):**
   - Seeded account login (`POST /api/auth/login`), session verification (`GET /api/auth/me`), and logout (`POST /api/auth/logout`) via stateless JWT tokens (`CUSTOMER` and `STAFF` roles).
   - Route and endpoint protection: Staff-only endpoint (`GET /api/bookings/master`) rejects `CUSTOMER` tokens with `HTTP 403 FORBIDDEN`.
2. **Room Fleet Catalog (`FR-02`, `AC-02`):**
   - 9 seeded rooms (`GET /api/rooms`) across 3 capacity tiers:
     - **Small (`S01`, `S02`, `S03`):** Max capacity 4 guests.
     - **Medium (`M01`, `M02`, `M03`):** Max capacity 8 guests.
     - **Large (`L01`, `L02`, `L03`):** Max capacity 12 guests.
3. **Server-Calculated Availability Matrix (`FR-03`, `BR-03`, `AC-03`):**
   - 14 discrete 1-hour slots per operating day (`GET /api/availability?date=YYYY-MM-DD`, indexed `0..13` from `10:00` to `24:00` ICT).
   - Real-time availability computed dynamically from active `CONFIRMED` bookings (`booking_slots`) and active maintenance blocks (`room_blocks`).
4. **Online Booking Engine (`FR-04`, `BR-01` to `BR-06`, `NFR-03`, `AC-04a`..`AC-04f`):**
   - Online reservation (`POST /api/bookings/online`) for 1 to 5 contiguous hours in a single room (`BR-01`).
   - Real-time conflict prevention (`BR-01`, `BR-02`, `BR-06`): Overlapping booking attempts are rejected with `HTTP 409 SLOT_CONFLICT`.
   - Operating hours boundary (`BR-03`): End slot (`startSlot + durationHours - 1`) cannot exceed `Slot 13` (`24:00`).
   - Past time-slot rejection (`BR-04`): Past dates or elapsed slots relative to `Asia/Bangkok` server time are rejected with `HTTP 400 CANNOT_BOOK_PAST_SLOT`.
   - Party size validation (`BR-05`): Party size exceeding room capacity is rejected with `HTTP 400 EXCEEDS_CAPACITY`.
5. **Customer Booking Management & Data Isolation (`FR-05`, `BR-07`, `AC-05`, `AC-05b`):**
   - Customer **"My Bookings"** list view (`GET /api/bookings/my`) scoped strictly to the authenticated customer's `userId`.
   - Booking Detail inspection (`GET /api/bookings/:id`) displaying unique Booking Code (`BK-YYYYMMDD-XXXX`) and reserved hourly slots.
   - Cross-customer ownership guard (`BR-07`, `AC-05b`): A customer requesting another customer's booking ID via `GET /api/bookings/:id` is rejected with `HTTP 403 FORBIDDEN`.
6. **Staff Master Schedule (`FR-06`, `BR-07`, `BR-08`, `AC-06`):**
   - Venue-wide daily master schedule (`GET /api/bookings/master?date=YYYY-MM-DD`) restricted to `STAFF`, displaying reservations across all 9 rooms with full customer attribution.

### ❌ Out-of-Scope (Deferred to Sprint 2 / Sprint 3)
* On-premise walk-in cashier booking (`FR-07` — Deferred to Sprint 2)
* Staff maintenance blockout creation/removal UI & endpoints (`FR-08` — Deferred to Sprint 2)
* Booking cancellation and rescheduling (`FR-09`, `FR-10` — Deferred to Sprint 2)
* Multi-criteria booking search and filtering (`FR-11` — Deferred to Sprint 2)
* Public customer self-registration (`FR-12` — Deferred to Sprint 3; note that clicking "Register" in the navbar opens the Sign In modal in Sprint 1)
* Room management CRUD and operational summary reports (`FR-13`, `FR-14` — Deferred to Sprint 3)
* Payment gateway integrations & F&B ordering (Explicitly excluded from course scope)

---

## 3. Test Accounts & Role Directory

To satisfy security and course governance rules (**R-12**), secret passwords are NOT published in public repositories or PDF reports. Passwords for the accounts below have been provided to the UAT Team privately via the course handoff channel.

| Account Label | Login Email | Assigned Role | Primary Permissions & Capabilities |
| :--- | :--- | :---: | :--- |
| **Customer 1 (Alice)** | `customer1@singslot.local` | `CUSTOMER` | Browse room catalog, query availability, book 1–5 contiguous hours, view personal reservations in "My Bookings". |
| **Customer 2 (Bob)** | `customer2@singslot.local` | `CUSTOMER` | Independent customer account used to verify slot conflict prevention (`UAT-02`) and cross-customer ownership denial (`UAT-04`). |
| **Staff (Cashier)** | `staff@singslot.local` | `STAFF` | Access Staff "Master Schedule", inspect venue-wide room occupancy across all 9 rooms, view any reservation's customer contact details. |

> 💡 **Sign-In Note:** On the production Cloud Run deployment (`import.meta.env.DEV === false`), development quick-fill buttons are disabled for production hygiene. Please enter the email above and the privately provided password in the **"Sign In to SingSlot"** modal.

---

## 4. Test Data Guidelines, Timezone & Environment Reset / Cleanup Procedure

### 4.1 Operating Timezone & Recommended Test Dates
* The backend evaluates all date and slot boundaries against **Bangkok local time (`Asia/Bangkok` / UTC+7)**.
* For normal booking flows (`UAT-01`, `UAT-02`, `UAT-05`), select **Tomorrow's date** (or any future date) in the date picker so that all 14 slots (`Slot #0` 10:00 through `Slot #13` 23:00–24:00) are in the future (`BR-04`).

### 4.2 Case Execution Sequence & Self-Service Clean State
* **Declared Case Sequence:**
  - `UAT-01` creates a confirmed 2-hour reservation on **Room `M01` (`Slot #4` and `Slot #5`, 14:00–16:00)** for Tomorrow's date as `customer1@singslot.local`.
  - `UAT-02`, `UAT-04`, and `UAT-05` intentionally build upon the reservation created in `UAT-01` to test slot overlap rejection, cross-customer ownership denial (`GET /api/bookings/:id`), and Staff Master Schedule persistence.
  - `UAT-03` tests boundary validations on Room `S01` and does not mutate future slots on Room `M01`.
* **Immediate Self-Service Re-run (Zero Wait Time):**
  - Because slot occupancy is uniquely scoped to `(roomId, bookingDate, slotIndex)` across 9 rooms (`S01–S03`, `M01–M03`, `L01–L03`) and any future calendar date, the UAT Team can re-run `UAT-01` through `UAT-05` at any time on a completely clean 14-slot matrix simply by selecting an unused future date (e.g., `Today + 2 days`, `Today + 3 days`) or another Medium room (`M02`, `M03`).

### 4.3 Scoped UAT Database Cleanup & Reset Procedure (Exact Target Date & Test Account Scope)
> ⚠️ **Important Note on Environment & `singslot-migrate`:**
> 1. **Dedicated Assessment & UAT Database:** The Cloud SQL database (`singslot-pg`) is a dedicated course evaluation environment containing **zero real production customer data**. Its baseline seeded state (`server/prisma/seed.ts`) consists strictly of **3 demo users (`users`)** and **9 rooms (`rooms`)** with **0 pre-seeded bookings**.
> 2. **Protected Historical & Unrelated Records:** Historical bookings from Lab 5 deployment verification (`BK-20261113-IA4Q` on `2026-11-13` and `BK-20261115-MQRX` on `2026-11-15`) and any bookings on other dates are strictly preserved.
> 3. **Why `singslot-migrate` Alone Is Insufficient:** The Cloud Run job `singslot-migrate` runs `prisma migrate deploy` and `server/prisma/seed.ts` (which performs an idempotent upsert of the 3 users and 9 rooms) and does not delete UAT-generated bookings.

When the UAT Team requests a database reset for a specific UAT test date (or specific UAT booking codes) while preserving all other dates, baseline accounts, rooms, and historical Lab 5 records:
1. Notify the SingSlot Product Team (@Phenwatsa / @lephirada) via the private handoff channel specifying the **exact target UAT date (`UAT_TARGET_DATE`, e.g., `2026-11-20`)** to clear.
2. The Product Team sets `UAT_TARGET_DATE` to that exact date ( guarding against empty or wildcard values and prohibiting `2026-11-13` / `2026-11-15` Lab 5 dates) and executes the following **strictly date-scoped and account-scoped transactional cleanup** against Cloud SQL (`singslot-pg`):
   ```bash
   # Step 1: Set the exact single UAT target date requested by the UAT Team (YYYY-MM-DD)
   export UAT_TARGET_DATE="2026-11-20"

   if [[ ! "$UAT_TARGET_DATE" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]] || [[ "$UAT_TARGET_DATE" == "2026-11-13" ]] || [[ "$UAT_TARGET_DATE" == "2026-11-15" ]]; then
     echo "ERROR: UAT_TARGET_DATE must be a single valid YYYY-MM-DD UAT date and cannot target Lab 5 evidence dates."
     exit 1
   fi

   # Step 2: Transactionally delete ONLY UAT bookings created by the designated UAT test accounts
   # on the exact UAT_TARGET_DATE (never deleting other dates or non-UAT records)
   gcloud sql connect singslot-pg \
     --project=cpe334-singslot-en-038-p1 \
     --user=postgres \
     --database=singslot \
     --quiet << EOF
   BEGIN;

   DELETE FROM "booking_slots"
   WHERE "bookingDate" = '${UAT_TARGET_DATE}'
     AND "bookingId" IN (
       SELECT b."id"
       FROM "bookings" b
       JOIN "users" u ON u."id" = b."userId"
       WHERE b."bookingDate" = '${UAT_TARGET_DATE}'
         AND u."email" IN ('customer1@singslot.local', 'customer2@singslot.local')
         AND b."bookingCode" NOT IN ('BK-20261113-IA4Q', 'BK-20261115-MQRX')
     );

   DELETE FROM "bookings"
   WHERE "bookingDate" = '${UAT_TARGET_DATE}'
     AND "userId" IN (
       SELECT "id" FROM "users"
       WHERE "email" IN ('customer1@singslot.local', 'customer2@singslot.local')
     )
     AND "bookingCode" NOT IN ('BK-20261113-IA4Q', 'BK-20261115-MQRX');

   COMMIT;

   -- Verify only the target UAT date is cleared while all other dates, Lab 5 records, users, and rooms remain intact
   SELECT COUNT(*) AS remaining_on_target_date FROM "bookings" WHERE "bookingDate" = '${UAT_TARGET_DATE}';
   SELECT COUNT(*) AS preserved_lab5_bookings FROM "bookings" WHERE "bookingCode" IN ('BK-20261113-IA4Q', 'BK-20261115-MQRX');
   SELECT COUNT(*) AS seeded_users FROM "users";
   SELECT COUNT(*) AS seeded_rooms FROM "rooms";
   EOF

   # Step 3: Re-run idempotent seed job to verify the 3 demo accounts and 9 rooms
   gcloud run jobs execute singslot-migrate --region asia-southeast1 --wait
   ```
3. **Post-Reset Verification:** The Product Team verifies that `remaining_on_target_date = 0` for `${UAT_TARGET_DATE}`, `preserved_lab5_bookings = 2`, `seeded_users = 3`, `seeded_rooms = 9`, and `GET /api/availability?date=${UAT_TARGET_DATE}` returns all 14 slots (`0..13`) as `isAvailable: true` across all 9 rooms before notifying the UAT Team.

---

## 5. Agreed Documentation & Screenshot Directory Architecture (`AC-01`)

Per the team's standardized repository layout established in Issue #1 (`PR #36`), documentation and visual evidence across all sprints and labs are organized under a unified top-level `docs/` structure:
* `docs/system-specifications/` — Canonical system specifications (`srs.md`, `system-sds.md`, `features.md`, `traceability.md`).
* `docs/sprints/` — Sprint-level engineering contracts and logs (`docs/sprints/sprint-1/`).
* `docs/labs/lab-06/` — Lab 6 Markdown specifications and logs (`uat-cases.md`, `handoff.md`, `reviewer.md`, `ai-use.md`).
* `docs/screenshots/` — **Agreed Centralized Screenshot Directory** replacing legacy nested `screenshots/` subfolders:
  - `docs/screenshots/sprint-1/` — Sprint 1 UI verification screenshots and architecture diagrams.
  - `docs/screenshots/lab-06/` — Dedicated Lab 6 UAT screenshot evidence directory (tracked in Git via `docs/screenshots/lab-06/.gitkeep`).

---

## 6. Defect Reporting Protocol (Part C)

If you observe behavior that deviates from the executable test specifications or the Sprint 1 contract, please report the finding using the following template:

```markdown
### 🐞 Defect Report: [Short Title]
- **Issue ID:** DEFECT-XX
- **Tested Version/URL:** https://singslot-4o7kwmd5ma-as.a.run.app (Commit e598e21 / v1.0.1 - Cloud Verified)
- **Reporter:** [Partner Tester Name & Team]
- **Linked UAT Case / Requirement:** UAT-XX / [FR-XX, BR-XX, AC-XX]
- **Role Used:** Customer / Staff
- **Preconditions & Inputs:** [Date, Room, Slot Index, Duration, Party Size]
- **Steps to Reproduce:**
  1. ...
  2. ...
- **Expected Result:** [Expected behavior per Sprint 1 specification]
- **Actual Result:** [Observed behavior, HTTP status, or error message]
- **Severity Assessment:**
  - [ ] Critical (System crash / Complete block of core booking flow)
  - [ ] Major (Business rule or security violation, e.g., double-booking permitted, cross-customer data leak)
  - [ ] Minor (UI discrepancy, minor styling, non-blocking label typo)
- **Evidence / Screenshot:** [Attach screenshot or network/console log]
```
