# Lab 7 Part B — Post-Deployment Live Verification Report

## Project: SingSlot — Karaoke Room Reservation & Management System

**Course:** CPE 334 Introduction to Software Engineering in the Age of AI Agents (Semester 1/2026)  
**Deliverable:** Lab 7 — Part B: Post-Deployment Live Verification  
**GitHub Issue:** [Issue #48](https://github.com/Phenwatsa/singslot-karaoke/issues/48) (`[Lab 7 - Issue 3] Post-Deployment Verification, Engineering Metrics & Release Readiness`)  
**Branch:** `docs/lab7-issue-3-metrics-readiness`  
**Primary Owner:** `@Phenwatsa` | **Reviewer:** `@lephirada`  
**Verification Date & Time:** `2026-11-27 12:23 – 12:36 ICT (UTC+07:00)`

---

## 1. Deployed Production Target Metadata

| Artifact / Field | Verified Value |
| :--- | :--- |
| **Live Cloud Run Service URL** | `https://singslot-4o7kwmd5ma-as.a.run.app` |
| **Active Cloud Run Revision** | `singslot-00007-vd5` (100% traffic; created `2026-11-26T15:52:33Z`) |
| **Prior Lab 7 Cloud Run Revision** | `singslot-00006-49h` (`v0.1.2-lab7`, PR #51 `7ddc0a0b`, created `2026-11-25T11:56:43Z`) |
| **Deployed `main` Commit SHA** | `6d0f23cc3b2094e6e832d93e7e4889bc114627dc` (Release PR #53, tag `v0.2.0-sprint2`) |
| **Immutable Artifact Registry Digest** | `sha256:d898f7a8692fbe785efbccce0704c05a27e4d025d14931af62efe4a7cc9fd372` |
| **Deploy Workflow Run** | `Deploy demo` Run [`#45852744756`](https://github.com/Phenwatsa/singslot-karaoke/actions/runs/45852744756) (`success`, `4m 26s`) |
| **GCP Project / Region** | `cpe334-singslot-en-038-p1` / `asia-southeast1` |
| **Synthetic Test Accounts Used** | `customer1@singslot.local`, `customer2@singslot.local`, `staff@singslot.local` *(credentials read from GCP Secret Manager at runtime; never printed or committed)* |

> **Scope Note on `v0.2.0-sprint2` (`singslot-00007-vd5`):** Following Lab 7 Issue 2 (`v0.1.2-lab7` / `singslot-00006-49h`), the team promoted Sprint 2 Operations Increment (`F-07`–`F-10`, PR #52 $\rightarrow$ PR #53) to `main` as `v0.2.0-sprint2` (`singslot-00007-vd5`). All Lab 7 Sprint 1 maintenance rules (`BR-01`, `BR-04`, `BR-11`, `BR-12`) and preserved Sprint 1 invariants (`BR-07`, `BR-08`, `FR-01`–`FR-06`) remain active in `singslot-00007-vd5` and are verified directly against the live production revision below.

---

## 2. Live Verification Results Matrix

### 2.1 Public Infrastructure & Catalog/Availability Checks (`12:23 ICT`)

| Evidence ID | Endpoint & Parameters | Linked IDs | Expected Result | Observed Live Result | Status |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **`EVD-PD-01`** | `GET /api/health` | `NFR-05` | `200 OK`, `status: "UP"` | `200 OK`: `{"success":true,"data":{"status":"UP","service":"SingSlot API","timestamp":"2026-11-27T05:23:35.846Z"}}` | **PASS** |
| **`EVD-PD-02`** | `GET /api/ready` | `NFR-05` | `200 OK`, `db: "connected"` | `200 OK`: `{"status":"ready","db":"connected"}` (Cloud SQL PostgreSQL reachable; additive migration applied) | **PASS** |
| **`EVD-PD-03`** | `GET /api/rooms` | `FR-02`, `BR-12`, `AC-02b` | `200 OK`, 9 rooms with tier `hourlyRate` (`200`/`350`/`500`) | `200 OK`: 9 rooms (`S01`–`S03`: `hourlyRate=200`, `M01`–`M03`: `hourlyRate=350`, `L01`–`L03`: `hourlyRate=500`) | **PASS** |
| **`EVD-PD-04`** | `GET /api/availability?date=2026-11-27` *(at `12:23 ICT`)* | `FR-03`, `BR-04`, `AC-03c` | Next-hour slot (`slotIndex=3`, `13:00–14:00`) flagged `isWithinCutoff: true`, `isPast: false`, `isAvailable: false`; `slotIndex=4` (`14:00–15:00`) available | `200 OK`: `S01` `slotIndex=3` returned `isAvailable: false, isWithinCutoff: true, isPast: false`; `slotIndex=4` returned `isAvailable: true, isWithinCutoff: false, isPast: false` | **PASS** |

### 2.2 Authenticated Changed-Behavior Checks (`12:36:38 ICT`)

| Evidence ID | Check & Synthetic Actor | Linked IDs | Request Summary | Expected Result | Observed Live Result | Status |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **`EVD-PD-05`** | **Server-Authoritative Pricing & Tamper Resistance** (`customer1@singslot.local`) | `FR-04`, `BR-12`, `AC-04j` | `POST /api/bookings/online` (`M01`, `2026-12-20`, `startSlot=2`, `durationHours=2`, `partySize=4`, tampered `totalPrice=1`) | `201 Created` with server-computed `totalPrice = 350 * 2 = 700` (client `totalPrice: 1` ignored) | `HTTP 201` \| `bookingCode=BK-20261220-HQL6` \| `totalPrice=700` | **PASS** |
| **`EVD-PD-06`** | **Peak-Hour 3-Hour Duration Cap** (`customer1@singslot.local`) | `FR-04`, `BR-01`, `AC-04h` | `POST /api/bookings/online` (`S01`, `2026-12-20`, `startSlot=8` [18:00], `durationHours=4`, `partySize=2`) | `400 Bad Request`, `error.code = PEAK_DURATION_EXCEEDED` | `HTTP 400` \| `code=PEAK_DURATION_EXCEEDED` | **PASS** |
| **`EVD-PD-07`** | **60-Minute Online Booking Cutoff** (`customer1@singslot.local`) | `FR-04`, `BR-04`, `AC-04g` | `POST /api/bookings/online` (`S01`, `2026-11-27`, `startSlot=3` [`13:00` at `12:36 ICT`], `durationHours=1`, `partySize=2`) | `400 Bad Request`, `error.code = CANNOT_BOOK_PAST_SLOT` | `HTTP 400` \| `slot=3` \| `code=CANNOT_BOOK_PAST_SLOT` | **PASS** |
| **`EVD-PD-08`** | **6-Hour Daily Customer Quota** (`customer1@singslot.local`) | `FR-04`, `BR-11`, `AC-04i` | `POST /api/bookings/online` (`S01`, `2026-12-20`, `startSlot=0`, `durationHours=5`, `partySize=2`; existing confirmed `2h` + `5h` = `7h > 6h`) | `409 Conflict`, `error.code = DAILY_QUOTA_EXCEEDED` | `HTTP 409` \| `code=DAILY_QUOTA_EXCEEDED` | **PASS** |

### 2.3 Preserved Sprint 1 Domain & Access-Control Invariants (`12:36:38 ICT`)

| Evidence ID | Check & Synthetic Actor | Linked IDs | Request Summary | Expected Result | Observed Live Result | Status |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **`EVD-PD-09`** | **Cross-Customer Booking Isolation** (`customer2@singslot.local`) | `FR-05`, `BR-07`, `AC-05b` | `GET /api/bookings/:id` targeting `customer1`'s booking (`BK-20261220-HQL6`) | `403 Forbidden`, `error.code = FORBIDDEN` | `HTTP 403` \| `code=FORBIDDEN` | **PASS** |
| **`EVD-PD-10`** | **Customer Denied on Staff Master Schedule** (`customer1@singslot.local`) | `FR-06`, `BR-08`, `AC-01d` | `GET /api/bookings/master?date=2026-12-20` with Customer JWT | `403 Forbidden`, `error.code = FORBIDDEN` | `HTTP 403` \| `code=FORBIDDEN` | **PASS** |
| **`EVD-PD-11`** | **Staff Master Schedule Displays Live Booking + `totalPrice`** (`staff@singslot.local`) | `FR-06`, `BR-08`, `BR-12`, `AC-06` | `GET /api/bookings/master?date=2026-12-20` with Staff JWT | `200 OK` containing `BK-20261220-HQL6` (`CONFIRMED`, `M01`, `totalPrice=700`) | `HTTP 200` \| `BK-20261220-HQL6 status=CONFIRMED room=M01 totalPrice=700` | **PASS** |
| **`EVD-PD-12`** | **Synthetic Test Data Cleanup** (`customer1@singslot.local`) | Operational Hygiene | `PATCH /api/bookings/:id/cancel` on `BK-20261220-HQL6` (`> 24h` before start) | `200 OK` (booking cancelled, slots released) | `HTTP 200` \| `Cancelled BK-20261220-HQL6` | **PASS** |

---

## 3. Verbatim Sanitized Verification Log & Screenshot Evidence

```text
=== SingSlot Live Cloud Run Post-Deploy Verification (singslot-00007-vd5) ===
Timestamp (ICT): 2026-11-27 12:36:38 UTC+07:00 | Today: 2026-11-27 | CutoffSlot: 3
[LOGIN] customer1=200, customer2=200, staff=200 (tokens redacted)
[CHECK-1 Pricing] HTTP=201 | bookingCode=BK-20261220-HQL6 | totalPrice=700 (expected 700)
[CHECK-2 PeakCap] HTTP=400 | code=PEAK_DURATION_EXCEEDED (expected 400 PEAK_DURATION_EXCEEDED)
[CHECK-3 Cutoff ] HTTP=400 | slot=3 | code=CANNOT_BOOK_PAST_SLOT (expected 400 CANNOT_BOOK_PAST_SLOT)
[CHECK-4 Quota  ] HTTP=409 | code=DAILY_QUOTA_EXCEEDED (expected 409 DAILY_QUOTA_EXCEEDED)
[CHECK-5 BR-07  ] HTTP=403 | code=FORBIDDEN (expected 403 FORBIDDEN)
[CHECK-6 BR-08  ] HTTP=403 | code=FORBIDDEN (expected 403 FORBIDDEN)
[CHECK-7 Staff  ] HTTP=200 | match=BK-20261220-HQL6 status=CONFIRMED room=M01 totalPrice=700
[CLEANUP] Cancelled BK-20261220-HQL6: HTTP=200
=== Done ===
```

### Archived Visual Evidence
1. **Production Deploy Summary (`Deploy demo` Run `#45852744756`, `singslot-00007-vd5`, digest `sha256:d898f7a8...`):**  
   [`docs/screenshots/lab-07/deploy-summary-00007-vd5.png`](../../screenshots/lab-07/deploy-summary-00007-vd5.png)
2. **Live Authenticated Verification & Cleanup Output (`2026-11-27 12:36:38 ICT`, zero secrets exposed):**  
   [`docs/screenshots/lab-07/live-checks-00007-vd5.png`](../../screenshots/lab-07/live-checks-00007-vd5.png)
