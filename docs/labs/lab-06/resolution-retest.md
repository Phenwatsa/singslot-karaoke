# Defect Resolution Retest & Formal UAT Acceptance Report (Lab 6 — Part D)

## Project: SingSlot — Karaoke Room Reservation & Management System

**Course:** CPE 334 Introduction to Software Engineering in the Age of AI Agents (1/2026)  
**Deliverable:** Lab 6 — Part D: Defect Retest Verification & UAT Sign-off (35 pts)  
**GitHub Issue:** [Issue #35](https://github.com/Phenwatsa/singslot-karaoke/issues/35) (`[Lab 6 - Issue 4] Defect Triage, Partner Retest Verification & UAT Acceptance Decision`)  
**Resolution Issue & Branch:** Issue #34 ([PR #39](https://github.com/Phenwatsa/singslot-karaoke/pull/39) / `fix/lab6-issue-3-defect-resolution`), promoted to `main` ([PR #40](https://github.com/Phenwatsa/singslot-karaoke/pull/40))  
**Document Custodian / QA Lead:** @lephirada (SingSlot QA)  
**Lead Developer:** @Phenwatsa (SingSlot Lead Developer)  
**Independent Testing Team:** Whatsss Team (@Pilaiwan3492 & @Apichaya251400)  
**Tested Cloud Run URL:** `https://singslot-4o7kwmd5ma-as.a.run.app`  
**Tested Cloud Run Revision:** `singslot-00005-26q` (Active 100% Traffic)  
**Tested Production Commit SHA (`main`):** `f3eb92d4ee5036fa6af0b6c36f1b903bcafb312d`  
**Source Comment Reference:** [Phenwatsa/singslot-karaoke#35 (Comment #6 by @Pilaiwan3492)](https://github.com/Phenwatsa/singslot-karaoke/issues/35#issuecomment-7067118915)  
**Retest Date & Time:** 2026-11-22 02:56 – 03:01 ICT (UTC+7)

---

## 1. Verbatim Partner Retest Report & Acceptance Decision

_The following content is the exact, verbatim report delivered by the independent Partner UAT Team (Whatsss Team: `@Pilaiwan3492` & `@Apichaya251400`) in [Issue #35 Comment #6](https://github.com/Phenwatsa/singslot-karaoke/issues/35#issuecomment-7067118915):_

---

> ## Independent Retest Verification & Formal Sprint 1 Acceptance Decision
>
> - **Tested By:** Whatsss Team (`@Pilaiwan3492`, `@Apichaya251400`)
> - **Retest Date & Time:** `2026-11-22 02:56 – 03:01 ICT (UTC+7)`
> - **Tested Cloud Run Revision:** `singslot-00005-26q`
> - **Tested Commit SHA:** `f3eb92d4ee5036fa6af0b6c36f1b903bcafb312d`
> - **Live URL:** https://singslot-4o7kwmd5ma-as.a.run.app
>
> ---
>
> ### 1. Defect Resolution Retest Summary (`DEF-SS-01`–`DEF-SS-04`)
>
> |    Defect ID    | Severity |          Retest Result          | Verification Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
> | :-------------: | :------: | :-----------------------------: | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
> | **`DEF-SS-01`** | Critical |    **PASS (Verified Fixed)**    | Verified [`booking.controller.ts#L248-L283`](https://github.com/Phenwatsa/singslot-karaoke/blob/f3eb92d4ee5036fa6af0b6c36f1b903bcafb312d/server/src/controllers/booking.controller.ts#L248-L283) and [`prisma.ts#L12-L42`](https://github.com/Phenwatsa/singslot-karaoke/blob/f3eb92d4ee5036fa6af0b6c36f1b903bcafb312d/server/src/prisma.ts#L12-L42): `SELECT ... FOR UPDATE` Room row lock and in-transaction `RoomBlock` check serialize `BookingSlot` and `RoomBlock` writes. Verified GREEN via [CI Run #44941547401](https://github.com/Phenwatsa/singslot-karaoke/actions/runs/44941547401) (`105/105` server tests). ([`EVD-RETEST-01`](https://github.com/Pilaiwan3492/Whatsss-PMandELS/blob/0f5bfdec8c5bceebbce001d60caed63029b4aa76/docs/labs/lab-06/evidence/retest-01-code-fix-f3eb92d.jpg), [`EVD-RETEST-02`](https://github.com/Pilaiwan3492/Whatsss-PMandELS/blob/0f5bfdec8c5bceebbce001d60caed63029b4aa76/docs/labs/lab-06/evidence/retest-02-ci-deploy-00005.jpg)) |
> | **`DEF-SS-02`** |   High   |    **PASS (Verified Fixed)**    | Verified [`booking.controller.ts#L251-L258`](https://github.com/Phenwatsa/singslot-karaoke/blob/f3eb92d4ee5036fa6af0b6c36f1b903bcafb312d/server/src/controllers/booking.controller.ts#L251-L258): orphaned `BookingSlot` rows belonging to `CANCELLED` bookings are atomically deleted inside the locked transaction. Verified GREEN via `DEF-SS-02` regression test. ([`EVD-RETEST-01`](https://github.com/Pilaiwan3492/Whatsss-PMandELS/blob/0f5bfdec8c5bceebbce001d60caed63029b4aa76/docs/labs/lab-06/evidence/retest-01-code-fix-f3eb92d.jpg))                                                                                                                                                                                                                                                                                                                                                                                                                                  |
> | **`DEF-SS-03`** |   High   |    **PASS (Verified Fixed)**    | Verified [`booking.controller.ts#L240-L245`](https://github.com/Phenwatsa/singslot-karaoke/blob/f3eb92d4ee5036fa6af0b6c36f1b903bcafb312d/server/src/controllers/booking.controller.ts#L240-L245): bounded retry loop (`MAX_CODE_RETRIES = 5`) handles `bookingCode` `P2002` collisions without unhandled `HTTP 500`. Verified GREEN via `DEF-SS-03` regression test. ([`EVD-RETEST-01`](https://github.com/Pilaiwan3492/Whatsss-PMandELS/blob/0f5bfdec8c5bceebbce001d60caed63029b4aa76/docs/labs/lab-06/evidence/retest-01-code-fix-f3eb92d.jpg))                                                                                                                                                                                                                                                                                                                                                                                                                                   |
> | **`DEF-SS-04`** |  Medium  | **Acknowledged (Non-Blocking)** | Triage accepted: `localStorage` JWT conforms to Sprint 1 contract (`AC-01`/`AC-01e`); `cors()` origin restriction deferred as Sprint 2 hardening advisory (single-origin Cloud Run deployment).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
>
> ---
>
> ### 2. Live Deployment Spot-Check (`singslot-00005-26q`)
>
> - **API Probes:** `/api/health` (`200 OK`, `UP`), `/api/ready` (`200 OK`, `db: connected`), `/api/rooms` (`9 rooms`), `/api/availability?date=2026-11-22` (`200 OK`).
> - **Live Booking Flow (Customer `customer1@singslot.local`):** Created reservation **`BK-20261122-LB00`** for **Room `S01` (SMALL)** on **`2026-11-22`**, **`10:00 – 12:00` (2 hrs, 2 guests)** — confirmed without regression ([`EVD-RETEST-03`](https://github.com/Pilaiwan3492/Whatsss-PMandELS/blob/0f5bfdec8c5bceebbce001d60caed63029b4aa76/docs/labs/lab-06/evidence/retest-03-live-booking-lb00.jpg)).
> - **Staff Master Schedule Sync (`staff@singslot.local`):** Verified **`BK-20261122-LB00`** (`CONFIRMED`, `Alice Customer`, `2 guests`) displayed accurately on Global Schedule Matrix (`2026-11-22`, Room `S01`, `10:00–12:00`) ([`EVD-RETEST-04`](https://github.com/Pilaiwan3492/Whatsss-PMandELS/blob/0f5bfdec8c5bceebbce001d60caed63029b4aa76/docs/labs/lab-06/evidence/retest-04-staff-master-schedule-lb00.jpg)).
>
> ---
>
> ### 3. Clickable Retest Screenshot Evidence
>
> 1. **`EVD-RETEST-01` — Fixed Code (`booking.controller.ts#L240-L283` on `f3eb92d4`):** [View Screenshot](https://github.com/Pilaiwan3492/Whatsss-PMandELS/blob/0f5bfdec8c5bceebbce001d60caed63029b4aa76/docs/labs/lab-06/evidence/retest-01-code-fix-f3eb92d.jpg)
> 2. **`EVD-RETEST-02` — GitHub Actions CI & Cloud Run Deploy (`singslot-00005-26q`):** [View Screenshot](https://github.com/Pilaiwan3492/Whatsss-PMandELS/blob/0f5bfdec8c5bceebbce001d60caed63029b4aa76/docs/labs/lab-06/evidence/retest-02-ci-deploy-00005.jpg)
> 3. **`EVD-RETEST-03` — Live Booking Confirmed (`BK-20261122-LB00`, Room `S01`):** [View Screenshot](https://github.com/Pilaiwan3492/Whatsss-PMandELS/blob/0f5bfdec8c5bceebbce001d60caed63029b4aa76/docs/labs/lab-06/evidence/retest-03-live-booking-lb00.jpg)
> 4. **`EVD-RETEST-04` — Live Staff Master Schedule Sync (`BK-20261122-LB00`):** [View Screenshot](https://github.com/Pilaiwan3492/Whatsss-PMandELS/blob/0f5bfdec8c5bceebbce001d60caed63029b4aa76/docs/labs/lab-06/evidence/retest-04-staff-master-schedule-lb00.jpg)
>
> ---
>
> ### 4. Formal Sprint 1 UAT Acceptance Decision
>
> - **Decision:** `[x] Accepted`
> - **Notes / Conditions:** All Sprint 1 UAT flows (`UAT-01`–`UAT-05`) and all Critical/High defects (`DEF-SS-01`–`DEF-SS-03`) are verified resolved on Cloud Run revision `singslot-00005-26q` (`f3eb92d4`). `DEF-SS-04` (`cors()` origin allowlist) is logged as a non-blocking Sprint 2 hardening recommendation.

---

## 2. SingSlot QA Team Analysis & Verification Disclosure (AC-02 Clarification)

In response to peer review inquiry regarding `AC-02`, this section explicitly documents the tiered verification strategy employed by the engineering and testing teams, distinguishing automated code/CI verification from live production retesting and disclosing practical reproduction constraints:

### 🔬 2.1 Tiered Verification Framework

| Verification Tier | Scope & Execution Layer | Evidence Produced | Evaluated Scope |
| :--- | :--- | :--- | :--- |
| **Tier 1: Automated Regression & Concurrency Suites (Code/CI Layer)** | Executed via Jest + Supertest (`--runInBand`) on local PostgreSQL and GitHub Actions CI workflow ([Run `#44941547401`](https://github.com/Phenwatsa/singslot-karaoke/actions/runs/44941547401)). | Terminal RED/GREEN logs, passing test assertions in `server/tests/lab6-defects.test.ts`, and CI run status. | Core transactional defect mechanics (`DEF-SS-01`, `DEF-SS-02`, `DEF-SS-03`). |
| **Tier 2: Live Cloud Run Spot-Checks & Regression Smoke (Production Layer)** | Executed live against Google Cloud Run revision `singslot-00005-26q` (`https://singslot-4o7kwmd5ma-as.a.run.app`) on commit `f3eb92d4`. | Health check responses, successful booking confirmation (`BK-20261122-LB00`), and Master Schedule UI sync. | Production service health, catalog rendering, and end-to-end booking flow without regression. |

---

### 📋 2.2 Defect-by-Defect Verification Breakdown & Practical Production Limitations

| Defect ID | Primary Verification Layer | Verification Mechanism & Test Steps | Production Live Retest Constraint / Limitation | Retest Verdict |
| :---: | :---: | :--- | :--- | :---: |
| **`DEF-SS-01`**<br>*(TOCTOU Race Condition)* | **Tier 1 (CI / Supertest Concurrency)** | **Step 1:** Injected concurrent maintenance block during outer check window (`tests/lab6-defects.test.ts`).<br>**Step 2:** Simulated simultaneous parallel transactions via `Promise.allSettled`.<br>**Step 3:** Verified locked room re-check catches block and returns `409 SLOT_CONFLICT`. | **Impractical for Manual Live Reproduction:** Microsecond race window between concurrent `RoomBlock` and `BookingSlot` commits cannot be reliably or deterministically triggered via manual browser clicks without automated load harness. | **PASS**<br>*(Verified via CI & Code Inspection)* |
| **`DEF-SS-02`**<br>*(Zombie Slot on Cancellation)* | **Tier 1 (CI / Supertest Regression)** | **Step 1:** Seeded a booking with status `CANCELLED` retaining historical `BookingSlot` rows.<br>**Step 2:** Verified `GET /api/availability` advertises slot as available.<br>**Step 3:** Executed `POST /api/bookings/online` on that slot; verified in-transaction purge allows `201 Created` without `409` lockout. | **Impractical for Live UI Reproduction:** Sprint 1 does not expose a public cancellation endpoint or UI button (`srs.md` strictly scopes cancellations to Sprint 2). Creating cancelled bookings on Cloud Run requires direct Cloud SQL tampering, making user-level UI reproduction impossible. | **PASS**<br>*(Verified via CI & Code Inspection)* |
| **`DEF-SS-03`**<br>*(P2002 Crash on Code Collision)* | **Tier 1 (CI / Supertest Regression)** | **Step 1:** Pre-seeded existing booking with deterministic 4-char code `ABSD`.<br>**Step 2:** Mocked initial `Math.random()` to force code collision on incoming booking request.<br>**Step 3:** Verified transaction retry loop catches `P2002`, regenerates fresh code, and returns `201 Created`. | **Impractical for Live UI Reproduction:** Random code collision probability is $1/36^4 \approx 1/1,679,616$. Deterministic collision cannot be induced on production Cloud Run without mocking backend runtime environment. | **PASS**<br>*(Verified via CI & Code Inspection)* |
| **`DEF-SS-04`**<br>*(JWT / Permissive CORS)* | **Specification & Contract Audit** | **Step 1:** Audited `client/src/utils/session.ts` against `srs.md §7.3` and `contracts.md (Contract 1: AC-01)`.<br>**Step 2:** Confirmed single-origin packaging on Cloud Run container renders wildcard CORS non-exploitable in production. | **Non-Defect / Deferred:** Conforms strictly to Sprint 1 contract; origin whitelist deferred to Sprint 2 hardening. | **ACK**<br>*(Non-Blocking)* |

---

## 3. Peer Review & Archival Signatures

| Role                             | Engineer             | GitHub Username   |    Date     | Decision / Status       |
| :------------------------------- | :------------------- | :---------------- | :---------: | :---------------------- |
| **Independent UAT Evaluator**    | Pilaiwan Churdchu    | `@Pilaiwan3492`   | 22 Nov 2026 | **[X] Accepted**        |
| **Independent UAT Evaluator**    | Aphichaya Klinhual   | `@Apichaya251400` | 22 Nov 2026 | **[X] Accepted**        |
| **SingSlot QA Lead / Custodian** | Phirada lekpaeng     | `@lephirada`      | 22 Nov 2026 | **Archived & Verified** |
| **SingSlot Lead Developer**      | Penwatsa Saengyenpan | `@Phenwatsa`      | 22 Nov 2026 | **Archived & Verified** |

_Document reference: `docs/labs/lab-06/resolution-retest.md` (Branch: `docs/lab6-issue-4-triage-retest-signoff`)_
