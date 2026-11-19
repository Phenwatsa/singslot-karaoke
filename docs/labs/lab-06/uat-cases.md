# Sprint 1 User Acceptance Testing (UAT) Test Specifications

## Project: SingSlot — Karaoke Room Reservation & Management System
- **Course:** CPE 334 Introduction to Software Engineering in the Age of AI Agents (Semester 1/2026)
- **Deliverable:** Lab 6 — Independent User Acceptance Testing & Defect Management
- **Scope:** Sprint 1 "The Golden Online Booking Slice"
- **Sprint 1 Baseline Git Tag:** `v0.1.0-sprint1`
- **UI Release Name / Badge:** `v1.0.1 - Cloud Verified`
- **Deployed Commit SHA (`main`):** `aa5f109b97c157a143a7a9a94cd58dc02998467e` (Initial Lab 5 `main` baseline merge: `e598e2122af080978d2b2fb588df41125ffb0496`)
- **Deployed Cloud Run Revision:** `singslot-00004-6mv` (`singslot` in `asia-southeast1`)
- **Deployment URL:** [https://singslot-4o7kwmd5ma-as.a.run.app](https://singslot-4o7kwmd5ma-as.a.run.app)

---

## 1. Traceability & Requirement Mapping Matrix

All UAT test cases correspond strictly to the agreed Sprint 1 specifications defined in [`docs/system-specifications/srs.md`](../../system-specifications/srs.md), [`docs/system-specifications/features.md`](../../system-specifications/features.md), and [`docs/sprints/sprint-1/contracts.md`](../../sprints/sprint-1/contracts.md):

| Case ID | Category | Functional Requirements (SRS) | Business Rules (SRS) | Contract AC & Test IDs | Description |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **UAT-01** | Normal Domain Journey | `FR-01`, `FR-02`, `FR-03`, `FR-04` | `BR-01`, `BR-02`, `BR-03`, `BR-05` | `AC-01`, `AC-02`, `AC-03`, `AC-04a` / `TEST-01`, `TEST-02`, `TEST-03`, `TEST-04a` | Customer end-to-end online booking for 2 contiguous hours |
| **UAT-02** | Business-Rule / Conflict | `FR-03`, `FR-04` | `BR-01`, `BR-02` | `AC-03`, `AC-04b` / `TEST-03`, `TEST-04b` | Conflict prevention: Reject booking overlapping an already occupied slot |
| **UAT-03** | Boundary Validation | `FR-03`, `FR-04` | `BR-01`, `BR-03`, `BR-04`, `BR-05` | `AC-04c`, `AC-04d` / `TEST-04c`, `TEST-04d` | Boundary checks: Reject past-time slots, operating window overflow (>Slot 13 / >5 hrs), and over-capacity party size |
| **UAT-04** | Forbidden Role / Ownership | `FR-01`, `FR-05`, `FR-06` | `BR-07`, `BR-08` | `AC-01c`, `AC-05`, `AC-05b` / `TEST-01c`, `TEST-05`, `TEST-05b` | Access control: Cross-customer ownership denial (`GET /api/bookings/:id` → 403) and Staff endpoint protection (`GET /api/bookings/master` → 403) |
| **UAT-05** | State / History / Persistence | `FR-05`, `FR-06` | `BR-07`, `BR-08` | `AC-05`, `AC-06` / `TEST-05`, `TEST-06` | State synchronization across Customer "My Bookings" and Staff "Master Schedule" |

---

## 2. Executable UAT Test Cases

### 🧪 Case UAT-01: End-to-End Online Booking Flow (Normal Domain Journey)
* **Category:** Normal Domain Journey
* **Requirement Reference:** `FR-01` (Authentication), `FR-02` (Room Catalog), `FR-03` (Availability Query), `FR-04` (Online Booking), `BR-01` (Contiguous Slot Rule: 1–5 consecutive hours), `BR-02` (Exclusive Room Lock), `BR-03` (Operating Hours Boundary: 10:00–24:00, slots 0..13), `BR-05` (Capacity Limit), `AC-01`, `AC-02`, `AC-03`, `AC-04a`, `TEST-01`, `TEST-02`, `TEST-03`, `TEST-04a`
* **Purpose:** Verify that an authenticated customer can browse the 9-room catalog, inspect the server-calculated 14-slot timeline matrix, select 2 contiguous available hours in a single room, submit a reservation within capacity limits, and receive an instant confirmation receipt with a unique booking code.
* **Role:** Customer (`customer1@singslot.local`)
* **Preconditions:**
  1. The target test date has open slots (`Slot 4` and `Slot 5`) for Room `M01` (Medium Room, max capacity 8 guests).
  2. Recommended test date: **Tomorrow's date** (`YYYY-MM-DD`).
* **Synthetic Inputs:**
  - **Account:** `customer1@singslot.local` (Password provided via private handoff channel)
  - **Target Date:** Tomorrow (`YYYY-MM-DD`)
  - **Room:** `M01` (`MEDIUM`, capacity 8)
  - **Start Slot:** `Slot #4` (`14:00 – 15:00`)
  - **Duration:** `2 Hours` (`Slot #4` 14:00–15:00 and `Slot #5` 15:00–16:00)
  - **Party Size:** `5 Guests`

* **Numbered User Actions:**
  1. Navigate to the deployed application root URL: `https://singslot-4o7kwmd5ma-as.a.run.app`.
  2. Wait for the initial splash screen to finish (or click **"Sign In"** in the top navigation bar if the Sign In modal is not already open).
  3. Enter Email `customer1@singslot.local` and the provided Customer password, then click **"Sign In"**.
  4. Verify the top navigation bar displays **"Alice Customer"** with role label **"Customer"**, and verify the **"Browse Rooms"** view displays 9 karaoke rooms (`S01–S03` capacity 4, `M01–M03` capacity 8, `L01–L03` capacity 12) (`FR-02`, `AC-02`).
  5. Click the **"Time Slot Matrix"** tab above the catalog to switch to the 14-slot availability timeline (`FR-03`, `AC-03`).
  6. In the **"Date:"** picker, select **Tomorrow's date** (`YYYY-MM-DD`).
  7. Locate Room **"M01"** in the availability matrix and verify that **Slot #4 (14:00 - 15:00)** and **Slot #5 (15:00 - 16:00)** are marked as **Available (Green)**.
  8. Click directly on **Slot #4 (14:00 - 15:00)** in Room `M01` to open the **"Reserve a Karaoke Room"** modal.
  9. In the **"Duration (1–5 Hours)"** selector, choose **"2 Hours"** ( verify **Calculated Time Window** updates to `14:00 - 16:00` / `2 hrs`).
  10. Use the **"Party Size (Guests)"** `+` stepper to set party size to **`5 Guests`** (within `M01` max capacity of 8).
  11. Click **"Confirm Reservation (14:00 - 16:00)"**.

* **Specific Expected Results:**
  - The reservation succeeds (`HTTP 201 Created`) and the modal transitions to the confirmation receipt (**"You're Booked for SingSlot!"**) (`AC-04a`, `TEST-04a`).
  - A unique **Booking Code** (format `BK-YYYYMMDD-XXXX`) is displayed along with `Room M01 (MEDIUM)`, the selected date, time window `14:00 - 16:00 (2 hrs)`, and `5 guests`.
  - Clicking **"Done & Return to Schedule"** closes the modal and refreshes the **Time Slot Matrix**, where **Slot #4 and Slot #5 for Room M01 are now visibly marked as Occupied (Red/Disabled)** (`AC-03`).

---

### 🧪 Case UAT-02: Slot Overlap Conflict Prevention (Business-Rule / Conflict)
* **Category:** Business-Rule or Boundary Case
* **Requirement Reference:** `FR-03` (Availability Query), `FR-04` (Online Booking), `BR-01` (Contiguous Slot Rule), `BR-02` (Exclusive Room Lock), `AC-03`, `AC-04b`, `TEST-03`, `TEST-04b`
* **Purpose:** Verify that once a time slot is reserved (`CONFIRMED`), another customer cannot book a multi-hour interval that overlaps any occupied slot in the same room and date, and the system rejects the collision with HTTP 409 `SLOT_CONFLICT` without modifying existing records.
* **Role:** Customer (`customer2@singslot.local`)
* **Preconditions:**
  1. Room `M01` has `Slot #4` (`14:00–15:00`) and `Slot #5` (`15:00–16:00`) already reserved by Customer 1 on Tomorrow's date (from `UAT-01`).
* **Synthetic Inputs:**
  - **Account:** `customer2@singslot.local` (Bob Customer)
  - **Target Date:** Same date used in `UAT-01` (Tomorrow `YYYY-MM-DD`)
  - **Room:** `M01`
  - **Attempted Start Slot:** `Slot #3` (`13:00 – 14:00`, which is open)
  - **Attempted Duration:** `3 Hours` (`13:00 – 16:00`, which spans across open `Slot #3` and occupied `Slot #4` & `Slot #5`)
  - **Party Size:** `4 Guests`

* **Numbered User Actions:**
  1. Click the profile pill in the top-right corner and click **"Log Out"**, or open an Incognito/Private browser window at `https://singslot-4o7kwmd5ma-as.a.run.app`.
  2. Click **"Sign In"** and log in as **Customer 2 (Bob)** (`customer2@singslot.local`) with the provided Customer password.
  3. Switch to the **"Time Slot Matrix"** tab and select the test date from `UAT-01`.
  4. Inspect the row for Room **`M01`**: verify **Slot #4 and Slot #5 are displayed as Occupied (Red)** and cannot be clicked directly (`AC-03`, `TEST-03`).
  5. Click on the preceding open slot, **Slot #3 (13:00 - 14:00)**, in Room `M01` to open the booking modal.
  6. In the **"Duration (1–5 Hours)"** dropdown, select **"3 Hours"** (so the calculated window is `13:00 - 16:00`, overlapping occupied Slots #4 and #5).
  7. Set Party Size to **`4 Guests`** and click **"Confirm Reservation (13:00 - 16:00)"**.

* **Specific Expected Results:**
  - The server rejects the overlapping reservation request with **HTTP 409 Conflict** (`SLOT_CONFLICT`) (`BR-01`, `BR-02`, `AC-04b`, `TEST-04b`).
  - The booking modal stays open and displays the error alert banner: **"One or more requested slots are already occupied."**
  - Zero new booking records are created: **Slot #3 (13:00 - 14:00)** remains **Available (Green)**, and **Slot #4 & Slot #5** remain reserved strictly by Customer 1 (`UAT-01`).

---

### 🧪 Case UAT-03: Past Slot, Operating Window & Capacity Boundary Enforcement (Boundary Validation)
* **Category:** Business-Rule or Boundary Case
* **Requirement Reference:** `FR-03` (Availability Query), `FR-04` (Online Booking), `BR-01` (Contiguous Slot Rule: 1–5 hours), `BR-03` (Operating Hours Boundary: 10:00–24:00, slots 0..13), `BR-04` (Past Slot Rejection in `Asia/Bangkok`), `BR-05` (Capacity Limit), `AC-04c`, `AC-04d`, `TEST-04c`, `TEST-04d`
* **Purpose:** Verify that the application enforces domain boundaries across both UI controls and backend API validation:
  1. Rejects bookings for past dates/elapsed slots relative to `Asia/Bangkok` time (`BR-04`, `AC-04c`).
  2. Prevents duration selections exceeding 5 hours (`BR-01`) or extending past `Slot #13` / `24:00` (`BR-03`).
  3. Prevents party sizes exceeding room tier capacity (`BR-05`, `AC-04d`).
* **Role:** Customer (`customer1@singslot.local` or `customer2@singslot.local`)
* **Preconditions:**
  1. Logged in as an authenticated Customer.
  2. Server evaluates timestamps in `Asia/Bangkok` (UTC+7).
* **Synthetic Inputs:**
  - **Boundary Input A (Operating Window & Max Duration):** Tomorrow's date (`YYYY-MM-DD`), Room `S01` (Small, capacity 4), `Start Time Slot = Slot #12 (22:00 – 23:00)`, inspect `3 Hours` (`22:00 – 25:00`, end slot 14 > 13), and submit `durationHours: 6` via API (`BR-01`, `BR-03`).
  - **Boundary Input B (Capacity Limit):** Tomorrow's date (`YYYY-MM-DD`), Room `S01` (`SMALL • max 4 pax`), attempt to increment Party Size above `4` in UI, and submit `partySize: 6` via API (`BR-05`, `TEST-04d`).
  - **Boundary Input C (Past Date Rejection):** Yesterday's date (`YYYY-MM-DD` relative to current `Asia/Bangkok` date), Room `S01`, `startSlot: 0`, `durationHours: 1`, `partySize: 2` (`BR-04`, `TEST-04c`).

* **Numbered User Actions:**
  1. In the **"Browse Rooms"** view, click **"Book This Suite"** on Room **`S01` (Small • max 4 pax)** to open the booking modal.
  2. **Check Operating Window & Max Duration Boundary (`BR-01`, `BR-03`):**
     - Select **Tomorrow's date** as the Booking Date.
     - Open the **"Duration (1–5 Hours)"** dropdown and verify only options `1` to `5` hours exist (`BR-01`).
     - Change **"Start Time Slot"** to **`Slot #12 (22:00 – 23:00)`**.
     - Open the **"Duration (1–5 Hours)"** dropdown again and inspect options `3 Hours`, `4 Hours`, and `5 Hours`.
  3. **Check Capacity Limit Boundary (`BR-05`, `AC-04d`):**
     - With Room `S01` (`max 4 pax`) selected, click the `+` button on **"Party Size (Guests)"** until it reaches **`4 Guests`**. Observe the state of the `+` button.
  4. **Check Past Date Picker Guard (`BR-04`):**
     - Click the **"Booking Date"** calendar popover inside the booking modal and attempt to click any date prior to today's `Asia/Bangkok` date.
  5. **Direct API Boundary Verification (`BR-01`, `BR-03`, `BR-04`, `BR-05`, `AC-04c`, `AC-04d`):**
     - Open Browser DevTools Console (`F12` / `Cmd + Option + I` → **Console**) and run the following snippet (which dynamically computes Yesterday's and Tomorrow's `Asia/Bangkok` dates) to verify backend rejection of a past-date booking (`CANNOT_BOOK_PAST_SLOT`), an over-capacity booking (`EXCEEDS_CAPACITY`), and a >5-hour booking (`INVALID_DURATION`) directly against `POST /api/bookings/online`:
       ```javascript
       (async () => {
         const fmtBangkok = (offsetDays) => {
           const d = new Date(Date.now() + offsetDays * 86400000);
           return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(d);
         };
         const yesterdayStr = fmtBangkok(-1);
         const tomorrowStr = fmtBangkok(1);
         const token = localStorage.getItem('singslot_token');
         const roomsRes = await fetch('/api/rooms').then(r => r.json());
         const s01 = roomsRes.rooms.find(r => r.roomNumber === 'S01');

         // 1. Past Date Test (BR-04 / AC-04c / TEST-04c)
         const pastRes = await fetch('/api/bookings/online', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
           body: JSON.stringify({ roomId: s01.id, bookingDate: yesterdayStr, startSlot: 0, durationHours: 1, partySize: 2 })
         });
         console.log('1. Past Date Status:', pastRes.status, await pastRes.json());

         // 2. Over-Capacity Test (BR-05 / AC-04d / TEST-04d)
         const capRes = await fetch('/api/bookings/online', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
           body: JSON.stringify({ roomId: s01.id, bookingDate: tomorrowStr, startSlot: 0, durationHours: 1, partySize: 6 })
         });
         console.log('2. Over-Capacity Status:', capRes.status, await capRes.json());

         // 3. Exceed Max Duration >5 Hours Test (BR-01 / BR-03)
         const durationRes = await fetch('/api/bookings/online', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
           body: JSON.stringify({ roomId: s01.id, bookingDate: tomorrowStr, startSlot: 0, durationHours: 6, partySize: 2 })
         });
         console.log('3. Exceed Max Duration (6 hrs) Status:', durationRes.status, await durationRes.json());
       })();
       ```

* **Specific Expected Results:**
  - **Operating Window (`BR-01`, `BR-03`):** When `Slot #12 (22:00 – 23:00)` is selected, durations `1 Hour` and `2 Hours` are selectable, while `3 Hours (Exceeds 24:00)`, `4 Hours (Exceeds 24:00)`, and `5 Hours (Exceeds 24:00)` are disabled.
  - **Capacity Stepper (`BR-05`):** On Small Room `S01`, the `+` button disables at **`4 Guests`** (`Room capacity: up to 4 guests`).
  - **Past Date Picker (`BR-04`):** Dates earlier than today in `Asia/Bangkok` are disabled in the booking modal calendar popover.
  - **Backend API Enforcement (`BR-01`, `BR-04`, `BR-05`, `AC-04c`, `AC-04d`):**
    - The past-date request (`yesterdayStr`) returns **HTTP 400 Bad Request** with `{ "success": false, "error": { "code": "CANNOT_BOOK_PAST_SLOT", ... } }` (`TEST-04c`).
    - The over-capacity request (`partySize: 6` on `S01`) returns **HTTP 400 Bad Request** with `{ "success": false, "error": { "code": "EXCEEDS_CAPACITY", ... } }` (`TEST-04d`).
    - The >5-hour duration request (`durationHours: 6` on `S01`) returns **HTTP 400 Bad Request** with `{ "success": false, "error": { "code": "INVALID_DURATION", ... } }` (`BR-01`), creating zero `Booking` or `BookingSlot` records.

---

### 🧪 Case UAT-04: Customer Data Isolation & Staff Authorization Boundary (Forbidden Role / Ownership)
* **Category:** Forbidden Role / Ownership Case
* **Requirement Reference:** `FR-01` (Authentication), `FR-05` (My Bookings & Booking Detail Ownership), `FR-06` (Staff Master Schedule Restriction), `BR-07` (Data Isolation & Ownership), `BR-08` (Staff Operational Boundary), `AC-01c`, `AC-05`, `AC-05b`, `TEST-01c`, `TEST-05`, `TEST-05b`
* **Purpose:** Verify strict customer data isolation and role-based access control across both UI and direct HTTP API calls:
  1. Customer 2's **"My Bookings"** list (`GET /api/bookings/my`) excludes Customer 1's reservations (`AC-05`, `TEST-05`).
  2. Customer 2 directly requesting Customer 1's reservation by ID (`GET /api/bookings/:id`) is rejected with **HTTP 403 Forbidden** (`FORBIDDEN`) (`BR-07`, `AC-05b`, `TEST-05b`).
  3. Customer 2 is hidden from the Staff Master Schedule UI tab and any direct request to `GET /api/bookings/master` with a Customer token is rejected with **HTTP 403 Forbidden** (`FORBIDDEN`) (`BR-08`, `AC-01c`, `TEST-01c`).
* **Role:** Customer 1 (`customer1@singslot.local`) and Customer 2 (`customer2@singslot.local`)
* **Preconditions:**
  1. Customer 1 (`customer1@singslot.local`) has at least one confirmed reservation in the database (created in `UAT-01`).
* **Synthetic Inputs:**
  - **Customer 1 Account:** `customer1@singslot.local` (Owner of the `UAT-01` booking)
  - **Customer 2 Account:** `customer2@singslot.local` (Unauthorized another customer)
  - **Protected Endpoints Tested:**
    - `GET /api/bookings/:customer1BookingId` (Cross-customer ownership guard)
    - `GET /api/bookings/master?date=YYYY-MM-DD` (Staff role guard)

* **Numbered User Actions:**
  1. Log in as **Customer 1 (Alice)** (`customer1@singslot.local`).
  2. Click **"My Bookings"** in the top navigation bar and verify Customer 1's booking for Room `M01` is visible. Click the booking card to verify the **Reservation Details** modal opens (`GET /api/bookings/:id` returns `HTTP 200 OK` for the owner).
  3. Obtain Customer 1's `booking.id` by opening Browser DevTools Console (`F12` → **Console**) while logged in as Customer 1 and running:
     ```javascript
     fetch('/api/bookings/my', {
       headers: { Authorization: `Bearer ${localStorage.getItem('singslot_token')}` }
     }).then(r => r.json()).then(d => console.log('CUSTOMER_1_BOOKING_ID =', d.bookings[0]?.id));
     ```
     Copy the printed UUID string (`CUSTOMER_1_BOOKING_ID`).
  4. Click the top-right user profile menu and click **"Log Out"**.
  5. Click **"Sign In"** and log in as **Customer 2 (Bob)** (`customer2@singslot.local`).
  6. **Verify UI List Isolation & Navbar Role Guard (`AC-05`):**
     - Click **"My Bookings"** in the top navigation bar. Confirm that Customer 1's Room `M01` reservation (`Alice Customer`) **does NOT appear** anywhere in Customer 2's list (`TEST-05`).
     - Inspect the top navigation bar and confirm only **"Rooms & Slots"** and **"My Bookings"** are displayed; the **"Master Schedule"** button is not rendered for `CUSTOMER`.
  7. **Verify Direct Cross-Customer Ownership API Guard (`GET /api/bookings/:id` — `BR-07`, `AC-05b`, `TEST-05b`):**
     - While logged in as **Customer 2**, paste the copied `<CUSTOMER_1_BOOKING_ID>` into the following snippet in Browser DevTools Console and execute it:
       ```javascript
       (async () => {
         const customer1BookingId = 'PASTE_CUSTOMER_1_BOOKING_ID_HERE';
         const token = localStorage.getItem('singslot_token');
         const res = await fetch(`/api/bookings/${customer1BookingId}`, {
           headers: { Authorization: `Bearer ${token}` }
         });
         console.log('Cross-Customer GET /api/bookings/:id Status:', res.status, await res.json());
       })();
       ```
  8. **Verify Direct Staff Master Schedule API Guard (`GET /api/bookings/master` — `BR-08`, `AC-01c`, `TEST-01c`):**
     - While still logged in as **Customer 2**, run the following snippet in Browser DevTools Console to attempt direct access to `/api/bookings/master`:
       ```javascript
       (async () => {
         const tomorrowStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' })
           .format(new Date(Date.now() + 86400000));
         const token = localStorage.getItem('singslot_token');
         const res = await fetch(`/api/bookings/master?date=${tomorrowStr}`, {
           headers: { Authorization: `Bearer ${token}` }
         });
         console.log('Customer GET /api/bookings/master Status:', res.status, await res.json());
       })();
       ```

* **Specific Expected Results:**
  - **My Bookings Isolation (`FR-05`, `AC-05`, `TEST-05`):** Customer 2's "My Bookings" view returns strictly Customer 2's own bookings; Customer 1's booking is absent.
  - **Direct Ownership Rejection (`FR-05`, `BR-07`, `AC-05b`, `TEST-05b`):** Calling `GET /api/bookings/<CUSTOMER_1_BOOKING_ID>` with Customer 2's Bearer token returns **HTTP 403 Forbidden** with JSON payload:
    ```json
    {
      "success": false,
      "error": {
        "code": "FORBIDDEN",
        "message": "You are not authorized to view this booking."
      }
    }
    ```
    No booking details, customer name, phone number, or booking code are disclosed.
  - **Staff Endpoint Rejection (`FR-06`, `BR-08`, `AC-01c`, `TEST-01c`):** Calling `GET /api/bookings/master?date=${tomorrowStr}` with Customer 2's Bearer token returns **HTTP 403 Forbidden** with JSON payload:
    ```json
    {
      "success": false,
      "error": {
        "code": "FORBIDDEN",
        "message": "Staff privileges required."
      }
    }
    ```

---

### 🧪 Case UAT-05: State Synchronization & History Persistence (State / History / Persistence)
* **Category:** State / History / Persistence Case
* **Requirement Reference:** `FR-05` (Customer My Bookings & Booking Detail), `FR-06` (Staff Master Schedule), `BR-07` (Staff Override to Inspect Any Booking), `BR-08` (Staff Operational Boundary), `AC-05`, `AC-06`, `TEST-05`, `TEST-06`
* **Purpose:** Verify that after a reservation is confirmed in Cloud SQL PostgreSQL, its state persists across browser hard refreshes and session switches, and is accurately synchronized between the Customer's **"My Bookings"** view and the Staff's **"Master Schedule"** view across all 9 rooms.
* **Role:** Customer 1 (`customer1@singslot.local`) and Staff (`staff@singslot.local`)
* **Preconditions:**
  1. The reservation created by Customer 1 in `UAT-01` (Room `M01`, Tomorrow's date, `Slot #4` & `Slot #5`, `14:00 – 16:00`) is committed in the database.
* **Synthetic Inputs:**
  - **Customer Account:** `customer1@singslot.local`
  - **Staff Account:** `staff@singslot.local` (Password provided via private handoff channel)
  - **Target Date:** Same date used in `UAT-01` (Tomorrow `YYYY-MM-DD`)

* **Numbered User Actions:**
  1. Log in as **Customer 1 (`customer1@singslot.local`)** and navigate to **"My Bookings"**.
  2. Perform a hard browser reload (`Cmd + Shift + R` on macOS or `Ctrl + F5` on Windows).
  3. Verify the session restores cleanly (`GET /api/auth/me`) and navigate back to **"My Bookings"**. Click on the Room `M01` reservation card to open the **Reservation Details** modal (`GET /api/bookings/:id`).
  4. Verify the modal displays `CONFIRMED` status, the exact `Booking Code`, `Room M01`, `14:00 - 16:00`, `Alice Customer`, `5 Guests`, and the discrete slot badges (`Slot #4`, `Slot #5`). Close the modal.
  5. Open the top-right user profile dropdown and click **"Log Out"**.
  6. Click **"Sign In"** and log in as **Staff (`staff@singslot.local`)** using the provided Staff password.
  7. Verify the top navigation bar displays **"Cashier Staff"** with role label **"Staff Manager"** and exposes the **"Master Schedule"** navigation button.
  8. Click **"Master Schedule"** in the top navigation bar (`GET /api/bookings/master?date=...`).
  9. Select the test date from `UAT-01` (Tomorrow's date) in the Master Schedule date picker.
  10. Verify that all 9 rooms (`S01–S03`, `M01–M03`, `L01–L03`) are listed in the Global Schedule Matrix (`AC-06`, `TEST-06`).
  11. Locate the row for Room **`M01`** and click the occupied booking block spanning **`14:00 – 16:00` (Slots #4–#5)**.

* **Specific Expected Results:**
  - **Persistence Across Reloads (`FR-05`, `AC-05`):** Customer 1's reservation persists in PostgreSQL after a hard browser refresh with identical booking code, status (`CONFIRMED`), and slot breakdown.
  - **Staff Master Schedule Synchronization (`FR-06`, `BR-07`, `BR-08`, `AC-06`, `TEST-06`):**
    - The Staff Master Schedule loads all 9 rooms for the selected date (`HTTP 200 OK` on `GET /api/bookings/master?date=YYYY-MM-DD`).
    - Room `M01` displays the continuous reserved block for `14:00 – 16:00` attributed to **`Alice Customer`** with her `BK-YYYYMMDD-XXXX` booking code.
    - Clicking the block opens the **Reservation Details** modal (`GET /api/bookings/:id` authorized via Staff role override `BR-07`), displaying Customer 1's full contact details (`Alice Customer`, phone `0898765432`, `5 Guests`, `Slot #4` and `Slot #5`).

---

## 3. Test Execution Summary Sheet (For Partner UAT Team)

| Case ID | Category | Requirement & Contract Ref | Tested By | Date & Time | Execution Status | Actual Result Notes |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| **UAT-01** | Normal Domain Journey | `FR-01`..`04`, `BR-01`, `AC-04a`, `TEST-04a` | *(Partner Tester)* | *(YYYY-MM-DD HH:MM)* | `[ ] PASS  [ ] FAIL` | |
| **UAT-02** | Conflict Prevention | `FR-03`, `FR-04`, `BR-01`, `BR-02`, `AC-04b`, `TEST-04b` | *(Partner Tester)* | *(YYYY-MM-DD HH:MM)* | `[ ] PASS  [ ] FAIL` | |
| **UAT-03** | Boundary Validation | `FR-04`, `BR-01`, `BR-03`..`05`, `AC-04c/d`, `TEST-04c/d` | *(Partner Tester)* | *(YYYY-MM-DD HH:MM)* | `[ ] PASS  [ ] FAIL` | |
| **UAT-04** | Forbidden Role / Ownership | `FR-05`, `FR-06`, `BR-07`, `BR-08`, `AC-01c`, `AC-05b`, `TEST-01c`, `TEST-05b` | *(Partner Tester)* | *(YYYY-MM-DD HH:MM)* | `[ ] PASS  [ ] FAIL` | |
| **UAT-05** | State Persistence & Sync | `FR-05`, `FR-06`, `BR-07`, `BR-08`, `AC-05`, `AC-06`, `TEST-05`, `TEST-06` | *(Partner Tester)* | *(YYYY-MM-DD HH:MM)* | `[ ] PASS  [ ] FAIL` | |
