# Partner UAT Execution Log: Whatsss-PMandELS

> **Course:** CPE 334 Introduction to Software Engineering in the Age of AI Agents (1/2026)  
> **Deliverable:** Lab 6 — Independent User Acceptance Testing & Defect Management (Part B)  
> **Testing Role:** Independent UAT Team (SingSlot Engineering Team: `@lephirada` & `@Phenwatsa`)  
> **Target Application:** Whatsss — Personal Money and Expense Logging System (Theme 7)  
> **Product Team:** `@Apichaya251400` (Aphichaya Klinhual) & `@Pilaiwan3492` (Pilaiwan Churdchu)  
> **Target Environment:** GCP Cloud Run Production (`https://whatsss-sipqw4logq-as.a.run.app`)  
> **Tested Revision & Commit:** `whatsss-00020-65k` / Commit `ba2f9dd43d8ed620d4b27820d43bee243d2e3d4d` (`ba2f9dd`)  
> **Backing Database:** Google Cloud SQL for PostgreSQL 16 (`whatsss-sql`)  
> **Execution Session Run ID:** `LAB6-UAT-RUN-01`  
> **Handoff Contract Reference:** Partner Sprint 1 UAT Plan (`uat-plan.md` on branch `staging-lab5`)

---

## 1. Preflight Health & Environment Verification

Before executing any UAT case, service health, readiness, and active serving versions were verified against Cloud Run endpoints via browser/HTTP checks:

* `GET /api/health` $\rightarrow$ HTTP `200 OK`
* `GET /api/ready` $\rightarrow$ HTTP `200 OK`, `{"status":"ready","database":"connected"}`
* **Serving Git Commit SHA:** `ba2f9dd` (`ba2f9dd43d8ed620d4b27820d43bee243d2e3d4d` on partner repository branch `staging-lab5`)
* **Cloud Build / Container Digest Tag:** `f160f25` (Artifact digest built from commit `ba2f9dd` deployed to Cloud Run revision `whatsss-00020-65k`)
* **Serving Revision:** `whatsss-00020-65k`
* **Preflight Evidence Register Status (`A-EV-01`, `A-EV-02`):** `PENDING / NOT ARCHIVED AS SEPARATE FILES` (Endpoint health and test fixtures were verified interactively in live browser sessions prior to test execution; standalone screenshot files were not archived in this run).

---

## 2. Test Accounts & Credential Security (Secret Hygiene)

Per course security guidelines and `uat-plan.md` Section A2.4, testing credentials are delivered securely through private channels. **No plaintext passwords or session cookies are committed to this repository.**

| Account Label | Role | Username | Availability on Cloud Run | Status / Observation |
|:---:|:---:|:---:|:---:|---|
| **`USER-A`** | `USER` | `user_demo` | Available & Verified | **Successfully tested & verified** across Golden Journey, boundaries, and ledger persistence. |
| **`USER-B`** | `USER` | `user_other` | Available & Verified | **Successfully tested & verified** for opening balance constraints, cross-tenant isolation, and debt repayment limits. |
| **`ADMIN-1`** | `ADMIN` | `admin` | Available & Verified | **Successfully tested & verified** for route segregation (403 on standard paths) and case-sensitivity bypass vulnerability. |

---

## 3. Real-Time Execution Log (Section A3 Traceability)

> **Execution Integrity Rule:** Every entry below strictly reflects live manual end-user execution performed during this UAT session. No results are recorded or assumed without verifiable screenshot evidence provided by the tester.  
> **Session Test Execution Metadata:** All test slices executed by Independent UAT Tester: **Lephirada (`@lephirada`)** on **21 November 2026** against Cloud Run Revision **`whatsss-00020-65k`** (Commit **`ba2f9dd`**).  
> **UAT Scope & Verification Layer Note:** Test slices 2A–2G, 3.1–3.2, and 6A–6C evaluate end-user black-box journeys on the web application. When client-side form validation successfully intercepts invalid input (rendering error banners, tooltips, or disabling submit buttons), submission is safely blocked at the client layer before an invalid HTTP mutation reaches the backend. Direct HTTP/API probing was executed specifically for authorization and cross-tenant boundaries (cases 4A, 4B, 4C, and DEF-OUT-02).

| Execution Case ID | Linked AC & Rules | Target User | Input & Procedure | Expected Result | Actual Observed Result | Outcome | Evidence ID |
|:---|:---|:---:|:---|:---|:---|:---:|:---:|
| **UAT-S1-01** | `AC-03-4`, `AC-04-1`, `AC-05-1`, `AC-06-1`, `AC-07-1`, `AC-07-2`, `AC-08-1`, `AC-09-1`<br>(`BR-02`–`BR-08`) | `user_demo` | Verify Golden Journey metrics: Opening 10,000 locked, Salary +20,000, Purchase 3,000, Repay 3,000. | Final Bank: ฿49,000.00, Debt: ฿0.00, Income: ฿45,000.00, Expense: ฿6,000.00. Repayment excluded from expense (`BR-08`). | **Verified on UI:** Checked `/dashboard` and `/transactions`: Checking Bank shows 49,000.00 THB, Debt shows 0.00 THB, Total Income shows 45,000.00 THB, Total Expenses shows 6,000.00 THB (debt repayment excluded from expenses per BR-08). Transaction History lists all 3 [LAB6-UAT-RUN-01] transactions chronologically intact. | **UI: PASS**<br>*(API: Direct state verified on UI)* | `EVD-11`<br>`EVD-11b` |
| **UAT-S1-02 2A** | `BR-06`<br>`AC-06-2` | `user_demo` | In **Record Purchase**, enter Total 1,500.00, Dining 500.00, Grocery 500.00 (Sum = 1,000.00 != 1,500.00). | Badge shows `Incomplete`, warning displays `Allocate the remaining ฿500.00 to continue.`, Submit button disabled. | **Verified on UI:** In Record Purchase modal, entering Total ฿1,500.00 with allocations totaling ฿1,000.00 renders amber badge `Incomplete`, Remaining `฿500.00`, and warning text `⚠ Allocate the remaining ฿500.00 to continue.` Record Purchase submit button is disabled. | **UI: PASS**<br>*(API: NOT RUN - Client Disabled)* | `EVD-10` |
| **UAT-S1-02 2B** | `BR-06`<br>`AC-06-2` | `user_demo` | In **Record Purchase**, enter Total 1,500.00, Dining 1,000.00, Grocery 800.00 (Sum = 1,800.00 > 1,500.00). | Badge shows `Over-allocated`, warning displays `✕ Over-allocated by ฿300.00. Total allocations exceed purchase amount.`, Submit button disabled. | **Verified on UI:** In Record Purchase modal, entering Total ฿1,500.00 with allocations totaling ฿1,800.00 renders red badge `Over-allocated`, Remaining `฿-300.00`, and warning text `✕ Over-allocated by ฿300.00. Total allocations exceed purchase amount.` Record Purchase submit button is disabled. | **UI: PASS**<br>*(API: NOT RUN - Client Disabled)* | `EVD-03` |
| **UAT-S1-02 2C** | `AC-06-3` | `user_demo` | In **Record Purchase**, enter Total 1,000.00, Dining 400.00, Dining 600.00. | UI displays alert banner `Each allocation line must use a distinct expense category.` and blocks submission (API spec: HTTP 400 `DUPLICATE_ALLOCATION_ACCOUNT`). | **Verified on UI:** In Record Purchase modal, configuring Total ฿1,000.00 with duplicate categories (Dining ฿400.00 + Dining ฿600.00) and clicking Record Purchase triggers top red alert banner: `Each allocation line must use a distinct expense category.` Transaction is rejected and not saved. | **UI: PASS**<br>*(API: NOT RUN - Blocked at UI)* | `EVD-04` |
| **UAT-S1-02 2D** | `AC-07-4`<br>`TEST-REPAY-03` | `user_other` | Open **Pay Credit Card** on dedicated fixture (Bank 5,000 / Debt 3,000), enter 3,500.00. | UI blocks with `Exceeds debt (฿3,000.00)`, Confirm disabled (API spec: HTTP 422 `REPAYMENT_EXCEEDS_DEBT`). Bank/Debt balances unchanged. | **Verified on UI:** In Credit Card Repayment modal, entering `3500` against `฿3,000.00` debt triggers immediate inline red warning: `Exceeds debt (฿3,000.00)`. Form submission is blocked; modal closed via `X` button without submitting. Post-test balances inspected: Bank balance (฿5,000.00) and Debt balance (฿3,000.00) remain 100% intact with zero state mutation. *(UX Note: Description field is single-line, overflowing horizontally rather than vertically).* | **UI: PASS**<br>*(API: NOT RUN - Blocked at UI)* | `EVD-02` |
| **UAT-S1-02 2E** | `AC-04-2` | `user_demo` | In **Record Income**, enter Amount: `-500` and `0`. | UI displays validation alert (`Transaction amount must be strictly greater than 0.00.`) and blocks submission (API spec: HTTP 400 `INVALID_TRANSACTION_AMOUNT`). | **Verified on UI:** In Record Income modal, entering Amount `0` and `-500` and attempting to submit triggers top red alert banner: `Transaction amount must be strictly greater than 0.00.` Income transaction is blocked and not recorded. | **UI: PASS**<br>*(API: NOT RUN - Blocked at UI)* | `EVD-05`<br>`EVD-05b` |
| **UAT-S1-02 2F-1** | `AC-05-2` | `user_demo` | In **Record Purchase**, leave Credit Card unselected (`Select a credit card` placeholder) with Total 1,000.00. | UI displays alert `Please select a primary credit card account.` and blocks submission (API spec: HTTP 400 `INVALID_PRIMARY_ACCOUNT`). | **Verified on UI:** In Record Purchase modal, leaving Credit Card unselected as `Select a credit card` and attempting to submit triggers top red alert banner: `Please select a primary credit card account.` Purchase is blocked. | **UI: PASS**<br>*(API: NOT RUN - Blocked at UI)* | `EVD-06` |
| **UAT-S1-02 2F-2** | `AC-05-3` | `user_demo` | In **Record Purchase**, select `Visa Credit Card` and enter malformed amount `100.123`. | UI detects invalid decimal precision (>2 decimals), disables Submit button (`disabled`), and blocks submission (API spec: HTTP 400 `INVALID_TRANSACTION_AMOUNT`). | **Verified on UI:** In Record Purchase modal, entering `100.123` into Total Amount and Allocation 01 triggers client-side validation: the UI detects invalid decimal precision (>2 decimal places) and keeps the **Record Purchase** button permanently disabled (`disabled`). Submission of malformed amounts is prevented. | **UI: PASS**<br>*(API: NOT RUN - Blocked at UI)* | `EVD-07` |
| **UAT-S1-02 2G** | `AC-07-6` | `user_demo` | In **Pay Credit Card**, enter Amount: `0` and `-100`. | UI keeps Confirm Repayment disabled or displays validation error (API spec: HTTP 400 `INVALID_AMOUNT`). | **Verified on UI:** In Pay Credit Card modal, entering `0` or `-100` leaves the form invalid; the Confirm Repayment submit button cannot be submitted (`disabled`). Form safely prevents submission of non-positive amounts. | **UI: PASS**<br>*(API: NOT RUN - Blocked at UI)* | `EVD-08`<br>`EVD-08b` |
| **UAT-S1-03 3.1** | `AC-03-2`<br>`BR-02` | `user_other` | Click **Set Opening Balance** on unlocked Checking Bank, enter `-500` and `100.123`. Click Cancel. | UI rejects negative values and >2 decimal places via HTML5 validation, blocking save (API spec: HTTP 400 `INVALID_OPENING_BALANCE`). Account remains unlocked. | **Verified on UI:** Attempting to submit `-500.00` triggers HTML5 validation tooltip: `Value must be greater than or equal to 0.` Attempting to submit `100.123` triggers tooltip: `Please enter a valid value. The two nearest valid values are 100.12 and 100.13.` Saving is blocked; user clicked Cancel safely. | **UI: PASS**<br>*(API: NOT RUN - Blocked at UI)* | `EVD-01`<br>`EVD-01b` |
| **UAT-S1-03 3.2** | `AC-03-3`<br>`BR-02` | `user_demo` | Navigate to `/accounts` and inspect Checking Bank card after transactions exist. | Button "Set Opening Balance" is removed from UI. Badge `Opening balance locked` is displayed (API spec: HTTP 422 `OPENING_BALANCE_LOCKED`). | **Verified on UI:** Checked `/accounts`: Checking Bank card displays Status: `Opening balance locked` badge. The "Set Opening Balance" button is completely absent; opening balance is permanently locked. | **UI: PASS**<br>*(API: NOT RUN - Action Hidden on UI)* | `EVD-09` |
| **UAT-S1-04 4A** | `BR-10`<br>`AC-02-2` | `admin` | Log in as `admin` (Cloud Run ADMIN role), attempt access to `/dashboard`, `/accounts`, `/transactions`, and backend financial APIs (`/api/accounts`, `/api/Accounts`, `/api/Reports/summary`). | Strict rejection from all financial routes with HTTP 403 `ADMIN_FINANCIAL_ACCESS_FORBIDDEN` and redirect to `/access-denied`. Navigation tabs hidden. | **UI Standard Path:** Logging into web app as `admin` on standard paths redirects to `/access-denied` and hides navigation bars.<br>**API Case-Sensitivity Route (Vulnerability):** Sending request to `/api/Accounts` or `/api/Reports/summary` bypasses `roleGuard.ts` due to case-sensitive prefix check while Express router matches case-insensitively, returning HTTP **200 OK** and leaking financial payload to Admin. | **Overall: FAIL**<br>*(UI: PASS \| API: FAIL - Capitalized Route Role Bypass; DEF-OUT-01)* | `EVD-13`<br>`DEFECT-01`<br>`DEFECT-01b` |
| **UAT-S1-04 4B** | `BR-01`<br>`AC-02-3` | `user_demo` $\rightarrow$ `user_other` | Step 1: In `user_other` session, verify ownership of Checking Bank UUID (`656b87b3-79c0-4a37-bc47-68ed01321292`).<br>Step 2: Authenticated as `user_demo`, attempt access/mutation against this foreign UUID. | User B accounts absent from User A list. API returns HTTP 404 `NOT_FOUND` (no data leak, no modification to User B). | **Verified with 2-Step Ownership & Tenancy Proof:**<br>1. Logged into `user_other` session and confirmed Checking Bank UUID is `656b87b3-79c0-4a37-bc47-68ed01321292` (`EVD-17b`).<br>2. Switched to `user_demo` session and sent transaction injection request referencing this foreign UUID. Server returned HTTP **404 NOT_FOUND** (`Primary account not found.`, `EVD-17`). Per `income.service.ts` (`where: { id: primaryId, user_id: userId }`), foreign accounts are strictly masked, proving complete tenant isolation. | **Overall: PASS**<br>*(Ownership Verified: PASS \| API: PASS - 404 Masking)* | `EVD-17`<br>`EVD-17b` |
| **UAT-S1-04 4C** | `AC-02-4`<br>`TEST-SEC-04` | `user_demo` | Using an active authenticated session cookie of `user_demo`, send `POST /api/transactions/income` with untrusted `Origin: https://evil-attacker.example`. | Server `csrfGuard` rejects request with HTTP 403 `CSRF_ORIGIN_REJECTED`. Zero state mutation. | **Verified via CLI / HTTP:** Sent state-changing POST request with untrusted header `Origin: https://evil-attacker.example`. Server middleware `csrfGuard` immediately intercepted and rejected request with HTTP 403 Forbidden and JSON payload `{ success: false, error: { code: 'CSRF_ORIGIN_REJECTED', message: 'Cross-site request origin rejected' } }`. Cross-site requests are strictly blocked. | **API: PASS**<br>*(HTTP Origin Verified)* | `EVD-18` |
| **UAT-S1-05** | `AC-01-5`, `AC-08-1`, `AC-09-1`, `AC-09-2`<br>(`NFR-DATA-01`) | `user_demo` | Step 1: Capture baseline figures.<br>Step 2: Logout.<br>Step 3: Close browser window.<br>Step 4: Re-login as `user_demo`.<br>Step 5: Hard reload (`Ctrl+F5` / `Cmd+Shift+R`). | Summary figures (49,000 / 0.00 / 45,000 / 6,000) and 3 Golden Journey transaction records persist intact across browser restart and reload. | **Verified on UI:** After logout, complete browser closure, and fresh re-login as `user_demo`: Dashboard summary figures (Bank 49,000.00 THB, Debt 0.00 THB, Income 45,000.00 THB, Expenses 6,000.00 THB) and transaction history persist 100% intact with zero data loss. | **UI: PASS**<br>*(State Persisted across sessions)* | `EVD-12` |
| **UAT-S1-06 6A** | `AC-01-3`<br>`AC-02-1` | Unauthenticated | In logged-out browser, navigate directly to `/dashboard`, `/accounts`, `/transactions`. | Client router intercepts unauthenticated state, immediately redirecting to `/login` without disclosing financial data (Protected API routes require active session). | **Verified on UI:** In logged-out state, navigating directly to `/dashboard` via browser address bar immediately triggers client-side redirect back to `/login`. No financial records, cards, or user data are exposed. | **UI: PASS**<br>*(API: NOT RUN - Redirected at Client Router)* | `EVD-15` |
| **UAT-S1-06 6B** | `AC-01-2`<br>`NFR-SEC-01` | Unauthenticated | In `/login`, enter Username `user_demo` with invalid password. | Renders red alert banner `Invalid username or password`. Server authentication fails (API: HTTP 401 `INVALID_CREDENTIALS`). | **Verified on UI:** On `/login`, entering username `user_demo` with invalid password renders top red alert banner: `Invalid username or password`. Unauthenticated user remains blocked on `/login`. | **UI: PASS**<br>*(API: Verified via Auth Failure UI)* | `EVD-14` |
| **UAT-S1-06 6C** | `AC-01-1`<br>`AC-01-5` | `user_demo` | In `/login`, enter valid credentials provided through private channel. | Redirects to `/dashboard`, renders username and `USER` role badge, session established. | **Verified on UI:** Entered valid credentials for `user_demo` on `/login` and clicked Sign In. Successfully authenticated and redirected to `/dashboard` displaying `Welcome, user_demo!` with `USER` role badge and active financial widgets. | **UI: PASS**<br>*(API: Session Cookie Established)* | `EVD-16` |

---

## 4. Summary of UAT Results & Acceptance Progress

* **Total Test Slices Defined:** 18 items
* **Execution Status on Baseline Scenarios (17 Combined UI & API Passing Outcomes / 1 Overall Case FAIL on `4A`):**
  - **Client-Side Journey & Validation (UI Layer):** 15 items PASS (`UAT-S1-01` [1], `UAT-S1-02 2A`..`2G` [8], `UAT-S1-03 3.1`..`3.2` [2], `UAT-S1-05` [1], `UAT-S1-06 6A`..`6C` [3]; plus the UI standard path of `UAT-S1-04 4A`).
  - **Direct Security & Tenancy Probing (API Layer):**
    - `UAT-S1-04 4A` (Admin Route Segregation): **FAIL** (Vulnerability: Role bypass on capitalized paths `/api/Accounts`, `/api/Reports/summary` returning HTTP 200 OK; logged as `DEF-OUT-01`).
    - `UAT-S1-04 4B` (Cross-Tenant Isolation): **PASS** (Ownership confirmed in User B session via `EVD-17b`; foreign injection from User A masked with HTTP 404 via `EVD-17`).
    - `UAT-S1-04 4C` (CSRF Origin Protection): **PASS** (Untrusted origin rejected with HTTP 403 `CSRF_ORIGIN_REJECTED` via `EVD-18`).
  - **API Checks on UI-Blocked Forms:** Marked **API NOT RUN** (because client-side form validation safely intercepted invalid inputs and disabled submit buttons, preventing malformed HTTP mutations from reaching the backend).
* **Pending Execution:** 0 items
* **Blocked Items:** 0 items
* **Evidence Files Captured in this run:** 27 files (26 PNG screenshots + 1 CLI text log) stored in `docs/labs/lab-06/screenshots/partner/`:
  - `EVD-01_opening_balance_negative_rejection.png` (Sub-case 3.1: `-500.00` rejection tooltip)
  - `EVD-01b_opening_balance_decimals_rejection.png` (Sub-case 3.1: `100.123` rejection tooltip)
  - `EVD-02_over_repayment_rejection.png` (Sub-check 2D: `3500` vs `3000` debt warning)
  - `EVD-03_over_allocated_split.png` (Sub-check 2B: `1800` vs `1500` Over-allocated warning)
  - `EVD-04_duplicate_category_rejection.png` (Sub-check 2C: duplicate category error banner)
  - `EVD-05_invalid_income_negative_rejection.png` (Sub-check 2E: `-500` rejection banner)
  - `EVD-05b_invalid_income_zero_rejection.png` (Sub-check 2E: `0` rejection banner)
  - `EVD-06_missing_credit_card_rejection.png` (Sub-check 2F-1: missing CC error banner)
  - `EVD-07_malformed_expense_amount_disabled.png` (Sub-check 2F-2: `100.123` disabled button)
  - `EVD-08_invalid_repayment_zero_nobutton.png` (Sub-check 2G: `0` repayment with no submit button)
  - `EVD-08b_invalid_repayment_negative_nobutton.png` (Sub-check 2G: `-100` repayment with no submit button)
  - `EVD-09_opening_balance_locked_card.png` (Sub-case 3.2: Checking Bank locked badge)
  - `EVD-10_under_allocated_split.png` (Sub-check 2A: `1000` vs `1500` Incomplete badge)
  - `EVD-11_dashboard_summary_metrics.png` (Case UAT-S1-01: Dashboard 4 metrics)
  - `EVD-11b_transaction_history_table.png` (Case UAT-S1-01: History table)
  - `EVD-12_persistence_after_relogin.png` (Case UAT-S1-05: Ledger persistence after restart)
  - `EVD-13_admin_access_forbidden_403.png` (Sub-check 4A: Admin 403 access forbidden)
  - `EVD-14_invalid_login_rejection.png` (Sub-check 6B: Invalid login rejection banner)
  - `EVD-15_unauth_direct_access_redirect.png` (Sub-check 6A: Direct unauth navigation redirects to login)
  - `EVD-16_valid_login_success.png` (Sub-check 6C: Valid login redirects to dashboard with USER badge)
  - `EVD-17_cross_user_isolation_404.png` (Sub-check 4B: Rejection of User B Checking Bank UUID with HTTP 404 NOT_FOUND under User A session)
  - `EVD-17b_user_other_ownership_proof.png` (Sub-check 4B: Authentic User B Checking Bank UUID `656b87b3-79c0-4a37-bc47-68ed01321292` confirmed under `user_other` session)
  - `EVD-18_csrf_origin_rejected_403.png` (Sub-check 4C: Untrusted Origin rejected with 403 CSRF_ORIGIN_REJECTED)
  - `DEFECT-01_admin_roleguard_case_sensitive_bypass.png` (Defect 1: Admin `/api/Accounts` bypass returning 200 OK)
  - `DEFECT-01b_admin_reports_summary_bypass.png` (Defect 1: Admin `/api/Reports/summary` bypass returning 200 OK)
  - `DEFECT-02_unauthenticated_logout_200.png` (Defect 2: Terminal screenshot of unauthenticated logout returning 200 OK)
  - `DEFECT-02_unauthenticated_logout_200.txt` (Defect 2: CLI curl log of unauthenticated POST to `/api/auth/logout`)

---

## 5. Independent UAT Acceptance Decision & Sign-off

| Field | Value |
|---|---|
| **Partner Product Name & Team** | Whatsss — Personal Money & Expense Ledger System (Theme 7) |
| **Partner Team Authors** | Pilaiwan Churdchu (`67070503492`, `@Pilaiwan3492`) & Aphichaya Klinhual (`67070503447`, `@Apichaya251400`) |
| **Tested Revision / Commit SHA** | Cloud Run Revision: `whatsss-00020-65k` (Commit `ba2f9dd` on branch `staging-lab5`) |
| **Target Cloud Run URL** | `https://whatsss-sipqw4logq-as.a.run.app` |
| **Total Test Slices Executed** | **18 / 18 items (100% Complete)** |
| **Overall Execution Result** | **UI Layer: 15 PASS / Direct Security API: 4A FAIL (Role Bypass), 4B PASS (Tenancy), 4C PASS (CSRF) / UI-Blocked Forms: API NOT RUN** *(17 combined UI & API passing outcomes, 1 overall case FAIL on 4A)* |
| **Critical / Major Defects Found** | **1 Critical Security Defect (`DEF-OUT-01`) verified with live runtime evidence** (plus 1 Advisory Contract Discrepancy `DEF-OUT-02` and 4 code inspection findings in Section 6.2) |
| **Minor UX Usability Observations** | In Credit Card Repayment modal, the `Description` field is an `<input>` rather than a `<textarea>`, causing horizontal text scrolling for long descriptions (detailed in Section 6.2). |
| **Defect Handoff Status** | **Dispatched & Formally Submitted** to Whatsss Engineering Team via GitHub Issue [#38](https://github.com/Pilaiwan3492/Whatsss-PMandELS/issues/38) on 21 November 2026. |
| **Independent Acceptance Decision** | **[X] Not Accepted / Rejected for Release (Blocked by Critical Defect DEF-OUT-01; Sprint 1 resolution & independent re-test required per Part C)** |
| **Independent UAT Lead & Tester** | Lephirada (`@lephirada`), SingSlot Team (Issue #2 Lead) |
| **Sign-off Date & Time** | 21 November 2026, 16:15 ICT |

---

## 6. Outgoing Defect Reports & Code Audit (Part C1 — Formally Submitted to Whatsss-PMandELS)

The findings below have been formally triaged and submitted to the partner development team (`@Pilaiwan3492` & `@Apichaya251400`) via partner repository [Issue #38](https://github.com/Pilaiwan3492/Whatsss-PMandELS/issues/38) on 21 November 2026 based on live testing and deep architectural inspection of Cloud Run revision `whatsss-00020-65k` (Commit `ba2f9dd`). Retest verification will be conducted in Part D following defect resolution.

### 6.1 Primary Verified Defect (Runtime & Visual Evidence Bound)

The following defect was reproduced live on the production Cloud Run deployment and is backed by verifiable evidence files in `docs/labs/lab-06/screenshots/partner/`:

#### 🔴 Defect Report 1: Case-Sensitivity Authorization Bypass in `roleGuard.ts`
* **Defect ID:** `DEF-OUT-01`
* **Target System:** Whatsss — Personal Money & Expense Ledger System (Theme 7)
* **Tested Revision:** Cloud Run `whatsss-00020-65k` (Commit `ba2f9dd`)
* **Reporter:** Lephirada (`@lephirada`), SingSlot UAT Team
* **Linked Requirements:** `BR-10` (Admin Financial Access Prohibition), `AC-02-2`
* **Severity:** **Critical** (Security / Authorization Bypass)
* **Preconditions:** Authenticated as user with `Role: ADMIN` (`admin`).
* **Reproduction Steps:**
  1. Log in as `admin` on `https://whatsss-sipqw4logq-as.a.run.app/login`. Observe initial redirect to `/access-denied` (403) when accessing standard lowercase paths.
  2. In the browser address bar or via API client, navigate to `https://whatsss-sipqw4logq-as.a.run.app/api/Accounts` (with uppercase `A`).
  3. Alternatively, navigate to `https://whatsss-sipqw4logq-as.a.run.app/api/Reports/summary` (with uppercase `R`).
* **Expected Result:**
  Server middleware `roleGuard` intercepts all casing variations of financial routes and strictly rejects the request with HTTP **`403 Forbidden`** and JSON error `{ code: "ADMIN_FINANCIAL_ACCESS_FORBIDDEN" }`.
* **Actual Observed Result:**
  Because `roleGuard.ts` compares `normalizedPath` against lowercase prefixes (`/api/accounts`, `/api/reports`) without `.toLowerCase()`, but Express matches routes case-insensitively, `roleGuard` evaluates `isFinancialRoute` as `false`. The request bypasses security and returns HTTP **`200 OK`** with financial payload (`{"success":true,"data":{"accounts":[]}}` and summary reports).
* **Root Cause & Recommended Fix:**
  In `server/src/middlewares/roleGuard.ts`, convert paths to lowercase prior to prefix checking: `const normalizedPath = path.toLowerCase().replace(/\/+$/, '')`.
* **Evidence IDs:** `DEFECT-01_admin_roleguard_case_sensitive_bypass.png`, `DEFECT-01b_admin_reports_summary_bypass.png`

---

### 6.2 Contract Discrepancy & Code Inspection Findings (Advisory & Architectural Feedback)

The following findings were identified through API protocol probing and in-depth code audit of the partner repository (`staging-lab5`). They are provided as constructive architectural recommendations and contract clarifications for Sprint 2/3:

#### 🟡 Finding 1: Unauthenticated Caller Permitted to Execute Logout (Contract Discrepancy)
* **Finding ID:** `DEF-OUT-02` (Advisory / Contract Discrepancy)
* **Target System:** Whatsss — Personal Money & Expense Ledger System (Theme 7)
* **Tested Revision:** Cloud Run `whatsss-00020-65k` (Commit `ba2f9dd`)
* **Reporter:** Lephirada (`@lephirada`), SingSlot UAT Team
* **Linked Requirements:** `AC-01-e`, SDS Section 8 (Session Lifecycle)
* **Severity:** **Low / Advisory** (Contract Ambiguity & Session Hygiene)
* **Preconditions:** Unauthenticated client (no session token / cookie).
* **Reproduction Steps:**
  1. Open Terminal and send a POST request to logout endpoint without providing any session credentials:
     ```bash
     curl -i -X POST "https://whatsss-sipqw4logq-as.a.run.app/api/auth/logout" \
       -H "Origin: https://whatsss-sipqw4logq-as.a.run.app"
     ```
* **Expected Result (Contract Proposal):**
  Standard authenticated session termination expected. Recommend partner team clarify in SDS Section 8 whether unauthenticated POST to `/api/auth/logout` is intended to be idempotent (returning HTTP 200) or guarded by `authGuard` (rejecting with HTTP 401 `UNAUTHENTICATED`).
* **Actual Observed Result:**
  Endpoint responds with HTTP **`200 OK`** and `{"success":true,"data":{"message":"Logged out successfully"}}`.  
  *(Architectural Note: While certain REST architectures treat logout as an idempotent operation where an unauthenticated caller is considered successfully logged out, standard session hygiene and explicit SDS authentication contracts typically require an active session context before clearing authentication state).*
* **Root Cause & Recommended Fix:**
  In `server/src/routes/auth.routes.ts`, line 9 defines `router.post('/logout', logout)` without `authGuard`. If strict session protection is required by the partner team's contract: change to `router.post('/logout', authGuard, logout)`.
* **Evidence IDs:** `DEFECT-02_unauthenticated_logout_200.png`, `DEFECT-02_unauthenticated_logout_200.txt`

---

#### 🟠 Finding 2: Incomplete Opening Balance Locking on Income Category Accounts
* **Finding ID:** `AUDIT-01` (Data Integrity - High)
* **Target System:** Whatsss — Personal Money & Expense Ledger System (Theme 7)
* **Linked Requirements:** `F-03`, `AC-03-3`, `BR-02` (Immutable Opening Balances)
* **Severity:** **High** (Architectural Data Integrity Recommendation)
* **Description:** In `server/src/services/income.service.ts` line 376, `lockAccounts(tx, [primaryAccount.id], userId)` only locks the primary CASH account, omitting `incomeAccount.id` (`Salary`). Unlike `expense.service.ts`, this allows `Salary` to remain mutable via PATCH after income transactions exist.
* **Recommended Fix:** Pass both IDs: `await lockAccounts(tx, [primaryAccount.id, incomeAccount.id], userId)`.

---

#### 🟠 Finding 3: Unhandled Exception & Lack of Type Safety in Login Endpoint
* **Finding ID:** `AUDIT-02` (Service Stability - High)
* **Target System:** Whatsss — Personal Money & Expense Ledger System (Theme 7)
* **Linked Requirements:** `NFR-SEC-01`, `AC-01-2`
* **Severity:** **High** (Architectural Robustness Recommendation)
* **Description:** In `server/src/controllers/auth.controller.ts`, input payload is passed directly to Prisma without wrapping in a `try/catch` block or asserting `typeof username === 'string'` and `typeof password === 'string'`. Non-string inputs can cause unhandled promise rejections.

---

#### 🟡 Finding 4: Missing JSON Content-Type Enforcement on Mutating Transaction Routes
* **Finding ID:** `AUDIT-03` (Middleware Configuration - Medium)
* **Target System:** Whatsss — Personal Money & Expense Ledger System (Theme 7)
* **Linked Requirements:** `NFR-SEC-03`, SDS 7.4
* **Severity:** **Medium** (Middleware Configuration Recommendation)
* **Description:** In `server/src/middlewares/contentType.ts`, the `isJsonBodyRequired()` path matcher omits `/api/transactions/income`, `/expense`, and `/repayment`. Requests missing JSON headers bypass content-type guard and trigger 401 instead of 400 `MISSING_REQUEST_BODY`.

---

#### 🔵 Finding 5: Repayment Form Submits without Warning when Debt is ฿0.00
* **Finding ID:** `AUDIT-04` (Client UX - Minor)
* **Target System:** Whatsss — Personal Money & Expense Ledger System (Theme 7)
* **Linked Requirements:** `F-07`, `AC-07`
* **Severity:** **Minor** (Client-side Form UX Recommendation)
* **Description:** In `client/src/components/RepaymentForm.tsx` (line 92), the validation condition checks `amountCents > debtCents && debtCents > 0`. When outstanding debt is ฿0.00, client-side validation fails to display an exceed-debt warning, deferring rejection to backend 422.
