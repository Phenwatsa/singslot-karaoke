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

The UAT Team is requested to independently test the delivered **Sprint 1 functionality**. Sprint 2 and Sprint 3 features are not part of this evaluation.

### ✅ In-Scope (Delivered Sprint 1 Functionality)
1. **User Authentication & RBAC (FR-01, FR-02):**
   - Seeded account login via JWT tokens (Customer and Staff roles).
   - Route protection: Staff-only views guarded against customer access.
2. **Room Fleet Catalog (FR-03):**
   - 9 seeded rooms across 3 tiers:
     - **Small (S01, S02, S03):** Max capacity 4 guests.
     - **Medium (M01, M02, M03):** Max capacity 8 guests.
     - **Large (L01, L02, L03):** Max capacity 12 guests.
3. **Availability Matrix (FR-04):**
   - 14 hourly slots per operating day (indexed 0..13, from 10:00 to 24:00).
   - Server-calculated real-time availability by date.
4. **Online Booking Engine (FR-05, BR-01 to BR-05):**
   - 1 to 5 contiguous hours per booking in a single room.
   - Real-time conflict prevention (cannot book across occupied slots).
   - Past time-slot rejection based on `Asia/Bangkok` server time.
   - Party size validation against room capacity limits.
5. **Customer Booking Management (FR-06, FR-07):**
   - Customer "My Bookings" list view showing personal reservations.
   - Booking detail view with unique Booking Code (`BK-YYYYMMDD-XXXX`).
   - Customer-to-customer data isolation (Customer A cannot see Customer B's records).
6. **Staff Master Schedule (FR-08):**
   - Daily master schedule view for staff displaying reservations across all 9 rooms.

### ❌ Out-of-Scope (Deferred to Sprint 2 / Sprint 3)
* Public self-registration (Deferred to Sprint 3)
* Walk-in cashier booking (Deferred to Sprint 2)
* Room management CRUD (Deferred to Sprint 3)
* Booking cancellation and rescheduling (Deferred to Sprint 2)
* Payment gateway integrations & F&B ordering (Out of course scope)

---

## 3. Test Accounts & Role Directory

To satisfy security and course governance rules (**R-12**), secret passwords are NOT published in public repositories. Passwords have been securely provided to your team via the private course channel.

| Account Label | Login Email | Assigned Role | Primary Permissions & Capabilities |
| :--- | :--- | :---: | :--- |
| **Customer 1 (Alice)** | `customer1@singslot.local` | `CUSTOMER` | Browse catalog, check availability, book 1–5 contiguous hours, view personal bookings in "My Bookings". |
| **Customer 2 (Bob)** | `customer2@singslot.local` | `CUSTOMER` | Independent customer account used to verify slot conflicts and test customer data isolation. |
| **Staff (Cashier)** | `staff@singslot.local` | `STAFF` | Access Staff Master Schedule, inspect room occupancy, view customer contact details for reservations. |

> 💡 **Tip:** On the Sign In page (`/login`), quick-fill buttons are provided for both Customer and Staff accounts to accelerate testing without manual typing.

---

## 4. Test Data Guidelines, Timezone & Reset Instructions

1. **Operating Timezone:**
   - The application evaluates slot availability based on **Bangkok local time (`Asia/Bangkok` / UTC+7)**.
   - For all booking tests, please select **Tomorrow's date** or a future date in the date picker to ensure that slots are not flagged as past-time slots (`BR-04`).

2. **Test Independence & Room Allocation:**
   - There are 9 separate rooms across 3 tiers (`S01–S03`, `M01–M03`, `L01–L03`).
   - If a specific slot is occupied from an earlier test, testers may either:
     - Use a different room in the same tier (e.g., test on `M02` if `M01` has occupied slots).
     - Select a different test date (e.g., 2 days from today).
     - Test the conflict rule intentionally using the occupied slot (as prescribed in `UAT-02`).

3. **Data Reset / Cleanup Request:**
   - In the event that the UAT Team requires a completely fresh database reset, notify the SingSlot Product Team via the shared contact channel.
   - The Product Team can re-run the idempotent database migration & seeding job on GCP within 2 minutes:
     ```bash
     gcloud run jobs execute singslot-migrate --region asia-southeast1
     ```

---

## 5. Defect Reporting Protocol (Part C)

If you observe behavior that deviates from the executable test specifications or the Sprint 1 scope, please report the finding using the following format:

```markdown
### 🐞 Defect Report: [Short Title]
- **Issue ID:** DEFECT-XX
- **Tested Version/URL:** https://singslot-4o7kwmd5ma-as.a.run.app (Commit e598e21)
- **Reporter:** [Partner Tester Name]
- **Linked UAT Case / Requirement:** UAT-XX / [FR-XX, BR-XX]
- **Role Used:** Customer / Staff
- **Preconditions & Inputs:** [Date, Room, Slot Index, Duration]
- **Steps to Reproduce:**
  1. ...
  2. ...
- **Expected Result:** [Expected behavior per specification]
- **Actual Result:** [Observed behavior or error message]
- **Severity Assessment:**
  - [ ] Critical (System crash / Complete block of booking flow)
  - [ ] Major (Business rule violation, e.g. double-booking permitted, privacy leak)
  - [ ] Minor (UI discrepancy, minor styling, non-blocking label typo)
- **Evidence / Screenshot:** [Attach screenshot or network log]
```

We are committed to rapid triage and resolution per Lab 6 engineering guidelines!
