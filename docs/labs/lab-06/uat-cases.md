# Sprint 1 User Acceptance Testing (UAT) Test Specifications

## Project: SingSlot — Karaoke Room Reservation & Management System
**Course:** CPE 334 Introduction to Software Engineering in the Age of AI Agents (Semester 1/2026)  
**Deliverable:** Lab 6 — Independent User Acceptance Testing & Defect Management  
**Scope:** Sprint 1 "The Golden Online Booking Slice"  
**Target Release:** `v1.0.1 - Cloud Verified` (Commit `e598e21`)  
**Deployment URL:** [https://singslot-4o7kwmd5ma-as.a.run.app](https://singslot-4o7kwmd5ma-as.a.run.app)  

---

## 1. Traceability & Requirement Mapping Matrix

All UAT test cases correspond strictly to the agreed Sprint 1 specifications defined in `docs/system-specifications/srs.md`, `docs/system-specifications/features.md`, and `docs/sprints/sprint-1/contracts.md`:

| Case ID | Category | Requirement Ref | Contract / Business Rule | Description |
| :---: | :--- | :--- | :--- | :--- |
| **UAT-01** | Normal Domain Journey | `FR-01`, `FR-03`, `FR-04`, `FR-05` | `BR-01`, `BR-02`, `AC-04a`, `TEST-04a` | Customer end-to-end booking for 2 contiguous hours |
| **UAT-02** | Business-Rule / Conflict | `FR-04`, `FR-05` | `BR-01`, `AC-04b`, `TEST-04b` | Conflict prevention: Reject booking overlapping occupied slot |
| **UAT-03** | Boundary Validation | `FR-04`, `FR-05` | `BR-02`, `BR-03`, `BR-04`, `AC-04c` | Boundary checks: Reject past-time slots and >5 hour duration |
| **UAT-04** | Forbidden Role / Ownership | `FR-02`, `FR-08`, `FR-09` | `BR-08`, `AC-01c`, `AC-06`, `TEST-01c`, `TEST-06` | Access control: Customer cannot access Staff view or other customer's booking |
| **UAT-05** | State / History / Persistence | `FR-06`, `FR-07`, `FR-09` | `AC-05`, `AC-06`, `TEST-05` | State synchronization across Customer "My Bookings" and Staff "Master Schedule" |

---

## 2. Executable UAT Test Cases

### 🧪 Case UAT-01: End-to-End Online Booking Flow (Normal Domain Journey)
* **Category:** Normal Domain Journey
* **Requirement Reference:** `FR-01` (Auth), `FR-03` (Room Catalog), `FR-04` (Availability), `FR-05` (Booking Creation), `BR-01`, `BR-02`, `AC-04a`, `TEST-04a`
* **Purpose:** Verify that a logged-in customer can browse available rooms, inspect the 14-slot timeline matrix, select 2 contiguous available hours, complete the booking with valid party details, and receive an instant booking confirmation with a unique booking code.
* **Role:** Customer (`customer1@singslot.local`)
* **Preconditions:**
  1. The target date has open slots for Room `M01` (Standard Medium Room, capacity 8).
  2. Recommended test date: **Tomorrow's date** (`YYYY-MM-DD`).
* **Synthetic Inputs:**
  - **Account:** `customer1@singslot.local`
  - **Target Date:** Tomorrow (`YYYY-MM-DD`)
  - **Room:** `M01` (Medium Room)
  - **Start Slot:** `Slot 4` (14:00 - 15:00)
  - **Duration:** 2 Hours (`Slot 4` 14:00–15:00 and `Slot 5` 15:00–16:00)
  - **Party Size:** 5 persons
  - **Contact Phone:** `0898765432`
  - **Customer Name:** Alice Customer

* **Numbered User Actions:**
  1. Navigate to the application root URL: `https://singslot-4o7kwmd5ma-as.a.run.app`.
  2. Click **"Sign In"** in the top navigation bar.
  3. Click the quick-fill button for **"Customer 1 (Alice)"** or enter `customer1@singslot.local` with the provided test password. Click **"Login"**.
  4. Verify the top navigation reflects **"Alice Customer"** with role badge `CUSTOMER`.
  5. Select the **"Book a Room"** navigation link to open the booking page.
  6. In the date picker, select **Tomorrow's date**.
  7. Locate Room **"M01 (Medium)"** in the availability grid.
  8. Click on **Slot 4 (14:00 - 15:00)** as the start time.
  9. In the booking drawer/form, select duration **"2 Hours"** (covering 14:00 to 16:00).
  10. Enter Party Size: `5`.
  11. Verify the summary card displays: Room M01, Date, Time (14:00 - 16:00), Duration: 2 hours, Total price calculated correctly.
  12. Click **"Confirm Reservation"**.

* **Specific Expected Results:**
  - System successfully creates the reservation and displays the **Booking Confirmation Modal / Summary**.
  - A unique **Booking Code** (format `BK-YYYYMMDD-XXXX`) is displayed.
  - The booking status is marked as `CONFIRMED`.
  - Returning to the Availability Grid for Tomorrow shows **Slot 4 and Slot 5 for Room M01 turned RED / Occupied**.

---

### 🧪 Case UAT-02: Slot Overlap Conflict Prevention (Business-Rule / Boundary)
* **Category:** Business-Rule / Boundary Case
* **Requirement Reference:** `FR-04` (Availability), `FR-05` (Online Booking), `BR-01` (Contiguous & Open Inventory), `AC-04b`, `TEST-04b`
* **Purpose:** Verify that when a time slot is already confirmed/reserved, another customer cannot reserve an overlapping interval containing that slot, and the system gracefully rejects the collision with a clear conflict notice.
* **Role:** Customer (`customer2@singslot.local`)
* **Preconditions:**
  1. Room `M01` has Slot 4 & Slot 5 already reserved by Customer 1 (completed in `UAT-01`).
* **Synthetic Inputs:**
  - **Account:** `customer2@singslot.local`
  - **Target Date:** Same date used in `UAT-01`
  - **Room:** `M01`
  - **Attempted Start Slot:** `Slot 3` (13:00 - 14:00)
  - **Attempted Duration:** 3 Hours (13:00 - 16:00, which overlaps occupied Slot 4 and Slot 5)
  - **Party Size:** 4 persons

* **Numbered User Actions:**
  1. Log out from Customer 1, or open an Incognito/Private browser window.
  2. Navigate to `https://singslot-4o7kwmd5ma-as.a.run.app`.
  3. Sign in as **Customer 2 (Bob)** (`customer2@singslot.local`).
  4. Navigate to **"Book a Room"** and select the test date from `UAT-01`.
  5. Inspect the matrix for Room `M01`: Verify **Slot 4 and Slot 5 are visibly marked as Occupied/Disabled**.
  6. Attempt to select **Slot 3 (13:00 - 14:00)** with duration **"3 Hours"** (aiming to span across Slot 4 and Slot 5).
  7. If UI disables overlapping selection: Note the prevention in UI.
  8. If submitting request: Click **"Confirm Reservation"**.

* **Specific Expected Results:**
  - The application strictly prevents the conflict:
    - **UI Layer:** The duration selector limits choices to 1 hour, or warns that subsequent slots are occupied.
    - **API Layer:** If an overlapping request is submitted, the server rejects it with **HTTP 409 Conflict** (`SLOT_CONFLICT`).
  - No new booking is created.
  - The original reservation from `UAT-01` remains intact and unaffected.

---

### 🧪 Case UAT-03: Past Slot & Operational Boundary Enforcement (Boundary Validation)
* **Category:** Business-Rule or Boundary Case
* **Requirement Reference:** `BR-02` (1–5 Contiguous Hours), `BR-03` (Operating Window 10:00–24:00), `BR-04` (No Past Slot Booking), `AC-04c`, `TEST-04c`
* **Purpose:** Verify that the system strictly prevents reservations for time slots that have already passed in Asia/Bangkok time, and prevents reservations that exceed the 14-slot operating window.
* **Role:** Customer (`customer1@singslot.local`)
* **Preconditions:**
  1. Logged in as Customer.
  2. Current server time is evaluated in `Asia/Bangkok` (UTC+7).
* **Synthetic Inputs:**
  - **Date 1 (Past Date):** Yesterday's date (`YYYY-MM-DD`).
  - **Date 2 (Boundary):** Tomorrow's date, Room `S01`, Start `Slot 12` (22:00–23:00), Attempted Duration: 3 Hours (which would exceed Slot 13 / 24:00).

* **Numbered User Actions:**
  1. Navigate to **"Book a Room"**.
  2. In the date picker, attempt to select **Yesterday's date** (or any past date).
  3. Observe date picker behavior and slot statuses.
  4. Switch back to **Tomorrow's date**. Select Room `S01`.
  5. Select **Slot 12 (22:00 - 23:00)** as the start time.
  6. Inspect available duration options in the booking form.

* **Specific Expected Results:**
  - **Past Date Enforcement:** Past dates are disabled in the date picker, or if queried, all past slots are flagged unavailable with booking blocked (`CANNOT_BOOK_PAST_SLOT`).
  - **Operating Window Boundary:** From Slot 12 (22:00), the duration option is strictly capped at **2 Hours** (up to 24:00 / Slot 13). Attempting to book 3 hours (past midnight) is blocked by boundary validation (`BR-03`).

---

### 🧪 Case UAT-04: Customer Data Isolation & Staff Authorization Boundary (Forbidden Role / Ownership)
* **Category:** Forbidden Role / Ownership Case
* **Requirement Reference:** `FR-02` (RBAC), `FR-08` (Staff Master Schedule), `FR-09` (Customer Data Privacy), `BR-08`, `AC-01c`, `AC-06`, `TEST-01c`, `TEST-06`
* **Purpose:** Verify strict customer data privacy (Customer 2 cannot view or access Customer 1's booking details) and verify role authorization (Customer cannot access the Staff Master Schedule).
* **Role:** Customer 1 (`customer1@singslot.local`), Customer 2 (`customer2@singslot.local`)
* **Preconditions:**
  1. Customer 1 has an active booking from `UAT-01` with an internal Booking ID (obtained from URL `/my-bookings` or booking code).
* **Synthetic Inputs:**
  - Customer 1 Booking ID (e.g., `1` or UUID / detail URL)
  - Protected Staff URL: `/master-schedule` or `https://singslot-4o7kwmd5ma-as.a.run.app/schedule`

* **Numbered User Actions:**
  1. Log in as **Customer 1**. Navigate to **"My Bookings"** (`/my-bookings`).
  2. Click on the booking created in `UAT-01` to view its details. Note the browser URL (e.g. `/my-bookings` or `/bookings/:id`).
  3. Log out.
  4. Log in as **Customer 2 (Bob)** (`customer2@singslot.local`).
  5. Navigate to **"My Bookings"** (`/my-bookings`).
  6. Verify Customer 2's list: Ensure Customer 1's booking from Room M01 **does NOT appear** in Customer 2's list.
  7. In the browser address bar, attempt to navigate directly to the Staff Schedule URL: `https://singslot-4o7kwmd5ma-as.a.run.app/schedule` (or click Staff links if visible).
  8. If an API request is made with Customer 2's token to `/api/bookings/master-schedule`: inspect response.

* **Specific Expected Results:**
  - **Data Isolation:** Customer 2 sees only their own reservations. Customer 1's booking details, name, phone, and booking code are completely inaccessible to Customer 2.
  - **Role Guard:** Customer 2 attempting to access the Staff Schedule receives an **Access Denied / 403 Forbidden** page or is redirected to the home/unauthorized page. The backend returns **HTTP 403 FORBIDDEN** for `/api/bookings/master-schedule`.

---

### 🧪 Case UAT-05: State Synchronization & History Persistence (State / History / Persistence)
* **Category:** State / History / Persistence Case
* **Requirement Reference:** `FR-06` (Customer My Bookings), `FR-07` (Booking Detail), `FR-08` (Staff Master Schedule), `AC-05`, `AC-06`, `TEST-05`
* **Purpose:** Verify that after a booking is confirmed, the state persists across browser refreshes and session restarts, and the updated schedule state is instantly visible on the Staff Master Schedule with accurate customer attribution.
* **Role:** Customer 1 (`customer1@singslot.local`) and Staff (`staff@singslot.local`)
* **Preconditions:**
  1. Booking created in `UAT-01` exists in the database.
* **Synthetic Inputs:**
  - Account: `staff@singslot.local`
  - Target Date: The test date from `UAT-01`

* **Numbered User Actions:**
  1. Log in as **Customer 1**. Go to **"My Bookings"**.
  2. Perform a hard refresh in the browser (`Cmd + Shift + R` or `Ctrl + F5`).
  3. Verify that the booking for Room M01 remains listed with status `CONFIRMED`.
  4. Log out.
  5. Log in as **Staff** (`staff@singslot.local`).
  6. Notice the top navigation bar displays the **"Staff"** role badge and exposes the **"Master Schedule"** menu link.
  7. Click **"Master Schedule"** (or navigate to `/schedule`).
  8. Select the test date from `UAT-01` in the schedule date picker.
  9. Locate Room **M01** on the master schedule grid.

* **Specific Expected Results:**
  - On the Staff Master Schedule, **Slot 4 and Slot 5 for Room M01** are rendered as **Occupied / Booked**.
  - Clicking or hovering over the occupied slots reveals the booking summary: Customer Name (`Alice Customer`), Contact Phone, Booking Code, and Time Window (`14:00 - 16:00`).
  - State is verified to be fully persistent in Cloud SQL PostgreSQL and synchronized across both customer and staff views.

---

## 3. Test Execution Summary Sheet (For Partner UAT Team)

| Case ID | Category | Tested By | Date & Time | Execution Status | Actual Result Notes |
| :---: | :--- | :---: | :---: | :---: | :--- |
| **UAT-01** | Normal Domain Journey | *(Partner Tester)* | *(YYYY-MM-DD HH:MM)* | `[ ] PASS  [ ] FAIL` | |
| **UAT-02** | Conflict Prevention | *(Partner Tester)* | *(YYYY-MM-DD HH:MM)* | `[ ] PASS  [ ] FAIL` | |
| **UAT-03** | Boundary Validation | *(Partner Tester)* | *(YYYY-MM-DD HH:MM)* | `[ ] PASS  [ ] FAIL` | |
| **UAT-04** | Forbidden Role / Privacy | *(Partner Tester)* | *(YYYY-MM-DD HH:MM)* | `[ ] PASS  [ ] FAIL` | |
| **UAT-05** | State Persistence & Sync | *(Partner Tester)* | *(YYYY-MM-DD HH:MM)* | `[ ] PASS  [ ] FAIL` | |
