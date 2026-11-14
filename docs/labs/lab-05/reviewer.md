# Lab 5 Peer Review Record & Audit Trail

## Project: SingSlot — Karaoke Room Reservation & Management System

**Course:** CPE 334 Introduction to Software Engineering in the Age of AI Agents  
**Target:** Lab 5 (Cloud Deployment & CI/CD Pipeline)  
**Team Members:** @Phenwatsa & @lephirada (Equal Engineering Partners)  
**Repository:** `https://github.com/Phenwatsa/singslot-karaoke`

---

## 1. Peer Review Policy & Reciprocal Agreement

1. **Equal Reciprocal Review (No Self-Approval per R-09 / R-11):** Both team members collaborate as equal engineering partners. Every Pull Request targeting `sprint-1-staging` or `main` must be reviewed and approved by the other partner. Authors never approve their own PRs.
2. **Substantive Technical Verification (R-09):** Every PR review must document a specific check, verification question, finding, or explicit justification for approval (no empty approvals).
3. **Continuous Chronological Logging:** Every PR review conversation, feedback, developer response, fixes applied, and final approval is logged sequentially in this document.

---

## 2. Summary of Lab 5 Tasks & Pull Requests

|    Task    | Title / Scope                                                 | Primary Owner |  Reviewer   | Branch                  | PR Target                                                                            |  Status  | Verdict  |
| :--------: | :------------------------------------------------------------ | :-----------: | :---------: | :---------------------- | :----------------------------------------------------------------------------------- | :------: | :------: |
| **Task 1** | `[Lab 5 - Task 1] GCP Account & Cost Control`                 |  @Phenwatsa   | @lephirada  | GCP Console             | None (Issue comment)                                                                 |   Done   | Verified |
| **Task 2** | `[Lab 5 - Task 2] Prepare SingSlot for Cloud Deployment`      |  @lephirada   | @Phenwatsa  | `feat/lab5-cloud-ready` | [PR #22](https://github.com/Phenwatsa/singslot-karaoke/pull/22)                      | Approved | Verified |
| **Task 3** | `[Lab 5 - Task 3] Docker Containerization`                    |  @Phenwatsa   | @lephirada  | `feat/lab5-docker`      | [PR #23](https://github.com/Phenwatsa/singslot-karaoke/pull/23)                      | Approved | Verified |
| **Task 4** | `[Lab 5 - Task 4] CI Quality Gate on Pull Requests`           |  @lephirada   | @Phenwatsa  | `feat/lab5-ci`          | [PR #24](https://github.com/Phenwatsa/singslot-karaoke/pull/24) (`sprint-1-staging`) | Approved | Verified |
| **Task 5** | `[Lab 5 - Task 5] First GCP Deployment`                       |  @Phenwatsa   | @lephirada  | Cloud Shell             | None (Console / Issue #18)                                           | Approved | Verified |
| **Task 6** | `[Lab 5 - Task 6] WIF Setup & Branch Protection Verification` |  @lephirada   | @Phenwatsa  | `test/prove-gate`       | [PR #26](https://github.com/Phenwatsa/singslot-karaoke/pull/26) (`main`) | Approved | Verified |
| **Task 7** | `[Lab 5 - Task 7] Automatic Deployment Pipeline`              |  @Phenwatsa   | @lephirada  | `feat/lab5-auto-deploy` | [PR #27](https://github.com/Phenwatsa/singslot-karaoke/pull/27) (`sprint-1-staging`) | Approved | Verified |
| **Task 7b** | `[Lab 5 - Task 7b] Repeatable Release Proof (UI Update)`      |  @Phenwatsa   | @lephirada  | `feat/lab5-deploy-proof` | Feature PR into `sprint-1-staging` | In Review | Pending  |
| **Task 8** | `[Lab 5 - Task 8] Persistence & Rollback Verification`        |  @lephirada   | @Phenwatsa  | Actions & Console       | None (Console / Issue)                                                               | Backlog  | Pending  |
| **Step 9** | `[Lab 5 - Step 9] Final Documentation & PDF Evidence Index`   | Both Members  | Peer Review | `docs/` & LEB2 PDF      | None (Submission)                                                                    | Backlog  | Pending  |

---

## 3. Detailed Peer Review Logs

### 📌 Task 1: GCP Account & Cost Control

- **GitHub Issue:** [Issue #14](https://github.com/Phenwatsa/singslot-karaoke/issues/14)
- **Primary Owner:** @Phenwatsa
- **Reviewer:** @lephirada
- **Verification Channel:** GitHub Issue Comment / GCP Console
- **Status:** Approved

#### 🔍 Review Discussion & Verification Notes

- **Developer (@Phenwatsa):**

  ## Task Completed: Cloud Infrastructure & Cost Governance (Issue #1)

  ### Execution Summary:
  - [x] Activated GCP Free Trial ($300 credit / ฿10,132.96 verified, zero prepayment, Upgrade NOT clicked).
  - [x] Created team project:
  - **Project Name:** `CPE334 SingSlot`
  - **Project ID:** `cpe334-singslot-en-038-p1`
  - **Project Number:** `103485327421`
  - [x] Granted IAM access to @lephirada with Role `Editor` (`roles/editor`).
  - [x] Verified billing is enabled via Cloud Shell:

  ```bash
  gcloud billing projects describe "cpe334-singslot-en-038-p1" --format='value(billingEnabled)'
  # Output: True
  ```

    <img width="1368" height="903" alt="Image" src="https://github.com/user-attachments/assets/5499c0fe-2830-45d4-8516-d3462cf1fcce" />
    <img width="992" height="859" alt="Image" src="https://github.com/user-attachments/assets/f29ac5bf-d736-4c3e-9af3-858b0d2601ce" />
    <img width="1383" height="903" alt="Image" src="https://github.com/user-attachments/assets/fbf359c7-4abf-4e3e-84bd-cbacd0cd3399" />
    <img width="1428" height="903" alt="Image" src="https://github.com/user-attachments/assets/f35731e0-d6e6-4ca3-b988-80f350a733e3" />
    <img width="1428" height="903" alt="Image" src="https://github.com/user-attachments/assets/730d59c6-07f2-4e36-af54-2cccafd5d58f" />
    <img width="1428" height="903" alt="Image" src="https://github.com/user-attachments/assets/a66f49fc-f009-49f3-ae73-9356200dbc78" />
    <img width="1368" height="903" alt="Image" src="https://github.com/user-attachments/assets/e0ef7934-5df0-4b00-ac1f-2b37c8804e26" />

  ### 📢 Confirmation & Summary of Budget Alerts Configuration:

  To explicitly confirm the details from the attached screenshots for traceability:
  1. **Budget Amount Selected:**
  - `฿8,500 THB` (~`$250 USD` term-wide budget option, preserving reserve credit until project completion in mid-December).
  2. **Threshold Rules Configured (Actual Cost):**
  - **10%** (`฿850 THB`)
  - **20%** (`฿1,700 THB`)
  - **50%** (`฿4,250 THB`)
  - **90%** (`฿7,650 THB`)
  3. **Linked Notification Channels (Both Members):**
  - **Admin / Billing User:** Enabled for @Phenwatsa via _"Email alerts to billing admins and users"_.
  - **Teammate Notification Channel:** Linked to @lephirada via Cloud Monitoring Channel _"Phirada"_.

  All criteria are fully satisfied and documented. Ready for final sign-off!

- **Reviewer (@lephirada):**
  I've reviewed the updates and confirmed that all six acceptance criteria for this issue have been addressed, including GCP setup, IAM permissions, billing configuration, budget alerts, and notification channels.

  No further changes are needed from my side. **Approved ready to close.**

  Great work!

- **Status:** Approved

---

### 📌 Task 2: Prepare SingSlot for Cloud Deployment

- **GitHub Issue:** [Issue #15](https://github.com/Phenwatsa/singslot-karaoke/issues/15)
- **PR Link:** [PR #22](https://github.com/Phenwatsa/singslot-karaoke/pull/22)
- **Source Branch:** `feat/lab5-cloud-ready`
- **Target Branch:** `sprint-1-staging`
- **Primary Owner:** @lephirada
- **Reviewer:** @Phenwatsa
- **Status:** Approved
- **Verdict:** Approved (Verified & Ready to Merge into `sprint-1-staging`)

#### 🔍 Review Discussion & Verification Notes

- **Reviewer (@Phenwatsa):**
  Approved. The implementation meets the objectives of Lab 5 - Task 2, including environment-driven configuration, dynamic port binding, stateless JWT authentication, and production-safe credentials.

  The readiness endpoint implements bounded HTTP timeout and safe error handling. The updated single-flight mechanism prevents duplicate database queries when concurrent requests time out.

  Tests cover the key scenarios, and no blocking issues were identified.

  Approved.

- **Status:** Approved

- **Developer Response (@lephirada):**
  Thank you for the detailed and constructive review throughout this task! All 12 test cases in `server/tests/ready.test.ts`, client layout tests (12/12), and monorepo typechecks pass cleanly with 100% success. The branch `feat/lab5-cloud-ready` is ready to be merged into `sprint-1-staging`.

- **Outcome:** PR #22 approved for integration into `sprint-1-staging`.

---

### 📌 Task 3: Docker Containerization

- **GitHub Issue:** [Issue #16](https://github.com/Phenwatsa/singslot-karaoke/issues/16)
- **PR Link:** [PR #23](https://github.com/Phenwatsa/singslot-karaoke/pull/23)
- **Source Branch:** `feat/lab5-docker`
- **Target Branch:** `sprint-1-staging`
- **Primary Owner:** @Phenwatsa
- **Reviewer:** @lephirada
- **Status:** Approved
- **Verdict:** Approved (Verified & Ready to Merge into `sprint-1-staging`)

#### 🔍 Review Discussion & Verification Notes

- **Reviewer (@lephirada):**
  The implementation and submitted verification evidence cover the required packaging and runtime contracts:
  - Multi-stage Docker build with deterministic dependency installation using the root lockfile and `npm ci`.
  - Explicit Prisma Client generation using the correct schema path.
  - Correct production filesystem structure and working directory.
  - Prisma CLI and seed runtime available in the final container.
  - Generated Prisma Client initialization verified successfully.
  - Express API 404 handling is registered before static serving and SPA fallback.
  - Frontend assets are served from the expected production path, with same-origin API requests.
  - Docker Compose successfully orchestrates PostgreSQL, migration, seeding, and the application.
  - Clean-clone lifecycle and container readiness verification evidence have been documented.
  - Automated Docker, readiness, and client layout test results are included.
  - The previously identified Node.js version documentation mismatch has also been corrected.

  **Non-blocking documentation notes:**
  - Clarify that Compose reads the root `.env` file for variable interpolation and does not automatically load `server/.env` or `client/.env`.
  - Align the Docker test count in `ai-use.md` with the latest 15/15 result in `tests.md`.

  These are documentation consistency improvements and do not prevent the demonstrated container workflow from functioning.

  No blocking issues were identified in this review.

  **Approved.**

- **Developer (@Phenwatsa):**
  Thank you for the thorough review and approval! All non-blocking documentation notes have been recorded and synchronized:
  1. Updated `docs/labs/lab-05/ai-use.md` to reflect the latest 15/15 passed Docker tests.
  2. Clarified in `docs/labs/lab-05/tests.md` §3.2.0 that Docker Compose uses the root `.env` for variable interpolation (with clean fallback defaults) and does not automatically load `server/.env` or `client/.env`.
  3. Synchronized Node.js 24 Alpine runtime references across `deployment.md` and `ai-use.md`.

  All Task 3 acceptance criteria are satisfied, and PR #23 is approved. Ready to merge into `sprint-1-staging`!

---

### 📌 Task 4: CI Quality Gate on Pull Requests

- **GitHub Issue:** [Issue #17](https://github.com/Phenwatsa/singslot-karaoke/issues/17)
- **PR Link (Feature PR):** [PR #24](https://github.com/Phenwatsa/singslot-karaoke/pull/24) (`feat/lab5-ci` → `sprint-1-staging`)
- **PR Link (Release PR to main):** Pending (Follow-up Release PR to `main` after PR #24 merge)
- **Source Branch:** `feat/lab5-ci`
- **Target Branch:** `sprint-1-staging` → `main`
- **Primary Owner:** @lephirada
- **Reviewer:** @Phenwatsa
- **Status:** Approved
- **Verdict:** Approved (Verified & Ready to Merge into `sprint-1-staging`)

#### 🔍 Review Discussion & Verification Notes

- **Reviewer (@Phenwatsa):**
  The CI workflow and deployment tooling have been reviewed.  
  Workflow triggers, PostgreSQL service configuration, and environment variables are correctly configured.  
  Prisma migration/seed, typecheck, server/client tests, offline deployment tests, and Docker build are included.  
  Deployment scripts and their offline stub tests are provided.  
  GitHub Actions Run [feat(booking): implement conflict prevention and concurrency protection [Issue #5] #11](https://github.com/Phenwatsa/singslot-karaoke/pull/11) completed successfully with all 13 steps passing.  
  No blocking issues found.  
  Approved.  
  Note: Post-bootstrap C-01 verification on main remains a follow-up step after the Release PR is merged, as specified in the bootstrap sequence.

- **Developer Response (@lephirada):**
  Thank you for the thorough review and approval!
  - All feedback items, including the addition of `singslot-customer-password` in Secret Manager, `--no-storage-auto-increase` on Cloud SQL, exact health check parameters, and in-memory client test transpilation have been fully verified and committed.
  - Acknowledged regarding C-01 post-bootstrap verification: Once PR #24 is merged into `sprint-1-staging`, we will open the Release PR targeting `main` and execute the C-01 verification on `main` as defined in the bootstrap sequence.
  - Ready to merge PR #24 into `sprint-1-staging`.

- **Outcome:** PR #24 approved by @Phenwatsa. Merging into `sprint-1-staging` unlocked.

---

### 📌 Task 5: First GCP Deployment

- **GitHub Issue:** [Issue #18](https://github.com/Phenwatsa/singslot-karaoke/issues/18)
- **Primary Owner:** @Phenwatsa
- **Reviewer:** @lephirada
- **Verification Channel:** Cloud Shell / GCP Console
- **Status:** Approved
- **Verdict:** Verified

#### 🔍 Review Discussion & Verification Notes

- **Developer (@Phenwatsa):**

  ## 🚀 Task 5 Handover & Live Verification Evidence (C-04, R-03, R-04)

  **Assignee:** @Phenwatsa  
  **Reviewer:** @lephirada  
  **Execution Environment:** Google Cloud Shell cloning `main` (`e598e21`)  
  **Deployment Date:** 2026-11-13  

  ---

  ### 🌐 Live Service & Endpoint Verification
  - **Public Service URL (R-03):** https://singslot-4o7kwmd5ma-as.a.run.app
  - **Readiness Check (`/api/ready`):** `HTTP 200 OK` `{"status":"ready","db":"connected"}` (Unix socket connection verified)
  - **Health Check (`/api/health`):** `HTTP 200 OK` `{"success":true,"data":{"status":"UP","service":"SingSlot API"}}`
  - **Room Fleet (`/api/rooms`):** `HTTP 200 OK` (9 seeded suites active: S01–S03, M01–M03, L01–L03)
  - **Frontend SPA:** Live React Vite bundle serving with 100% functionality.

  ---

  ### ☁️ Infrastructure & Security Architecture
  1. **Cloud SQL PostgreSQL 16 (`singslot-pg`):**
     - Tier: `db-f1-micro` (cost governance compliant)
     - Storage: 10 GB SSD with `--no-storage-auto-increase` (`storageAutoResize: False`)
     - Region: `asia-southeast1-c`
     - Connection Name: `cpe334-singslot-en-038-p1:asia-southeast1:singslot-pg`
  2. **Cloud Run Service (`singslot`):**
     - Revision: `singslot-00001-r8c` (100% traffic)
     - Configuration: Min instances = 0, Max instances = 3, Memory = 512 MiB, Port = 8080
     - Runtime Service Account: `singslot-runner` (Secret Accessor strictly on `database-url` and `jwt-secret`)
  3. **Secret Manager (Zero Secrets Leaked):**
     - Managed Secrets: `singslot-database-url`, `singslot-jwt-secret`, `singslot-staff-password`, `singslot-customer-password`
  4. **Prisma Migration Job (`singslot-migrate`):**
     - Execution `singslot-migrate-rnkzb` successfully completed with exit code 0.
     - Migration `20261105000000_init` applied and demo database seeded.

  ---

  ### 🧪 End-to-End User Flow & Business Rule Verification (C-04)
  1. **User Authentication:** Logged in as demo customer `customer1@singslot.local` (Alice Customer) via stateless signed JWT.
  2. **Booking Creation:** Reserved Suite **L01 (LARGE)** on `2026-11-13` for `21:00 - 24:00` (3 hours). Confirmed with reference code **`BK-20261113-IA4Q`**.
  3. **Business Rule Rejection:** Attempted duplicate booking on room L01 for same time slot; server rejected with error: *"One or more requested slots are already occupied."*

  ---

  ### 📸 Verification Screenshots
  <img width="1294" height="903" alt="Cloud SQL Configuration" src="https://github.com/user-attachments/assets/7cddd10b-8679-42d2-826f-0292ca9b1360" />
  <img width="1294" height="903" alt="Cloud Run Service settings" src="https://github.com/user-attachments/assets/dc0a6f78-ac8e-4de9-8982-4a9469688d87" />
  <img width="1294" height="903" alt="Secret Manager secrets list" src="https://github.com/user-attachments/assets/824dd6c0-5179-48b0-ba90-087db63658f6" />
  <img width="1294" height="903" alt="Public catalog on live URL" src="https://github.com/user-attachments/assets/98888184-c4ea-4abf-a16b-acd120e74e1b" />
  <img width="1294" height="903" alt="Login modal on live URL" src="https://github.com/user-attachments/assets/7a67ed6d-0fd5-4001-af3e-69305a881c42" />
  <img width="1294" height="903" alt="Authenticated customer banner" src="https://github.com/user-attachments/assets/32c1c5af-4df1-499f-8719-4b23867016ef" />
  <img width="1294" height="903" alt="Confirmed booking modal" src="https://github.com/user-attachments/assets/5c97a737-d126-4662-913b-daad5ac78749" />
  <img width="1294" height="903" alt="Reservation detail modal" src="https://github.com/user-attachments/assets/f5ce71eb-9a0f-41f0-a83a-5377fea29c8f" />
  <img width="1294" height="903" alt="Business rule rejection error alert" src="https://github.com/user-attachments/assets/0217d885-1d91-4f59-9fcb-815c031fa098" />

  Ready for review and sign-off by @lephirada.

- **Reviewer (@lephirada):**
  Reviewed the deployment evidence for Task 5.

  All 9 evidence screenshots are provided, covering Secret Manager, Cloud Run, Cloud SQL, successful deployment and migration, and the end-to-end booking flows.

  The evidence is complete, including successful booking confirmation and rejection of overlapping bookings.

  Approved. No further changes required.

- **Outcome:** Issue #18 signed off and approved. Ready to proceed with Task 6 WIF setup and branch protection verification.

---

### 📌 Task 6: WIF Setup & Branch Protection Verification

- **GitHub Issue:** [Issue #19](https://github.com/Phenwatsa/singslot-karaoke/issues/19)
- **PR Link (`test/prove-gate` - Blocked Merge Proof):** [PR #26](https://github.com/Phenwatsa/singslot-karaoke/pull/26)
- **Source Branch:** `test/prove-gate`
- **Target Branch:** `main`
- **Primary Owner:** @lephirada
- **Reviewer:** @Phenwatsa
- **Status:** Approved
- **Verdict:** Verified

#### 🔍 Review Discussion & Verification Notes

- **Verification Evidence (PR #26):**
  - Temporary PR [PR #26](https://github.com/Phenwatsa/singslot-karaoke/pull/26) was opened from `test/prove-gate` targeting `main` with an intentional test failure in `server/tests/ready.test.ts` to prove branch protection gate enforcement.
  - Required status check `CI & Docker Build / test-and-docker` failed.
  - Reviewer @Phenwatsa submitted review approval with comment:
    > `C-02 verification: PASS.`
  - The merge button was visibly blocked by GitHub Ruleset `protect-main` due to the failed required status check, satisfying Requirement C-02.
  - PR #26 was closed without merging, and branch `test/prove-gate` was deleted.

- **Outcome:** Task 6 verified and approved. Requirement C-02 satisfied. Ruleset `protect-main` and WIF setup verified. Ready to proceed to Task 7.

---

### 📌 Task 7: Automatic Deployment Pipeline

- **GitHub Issue:** [Issue #20](https://github.com/Phenwatsa/singslot-karaoke/issues/20)
- **PR Link (Pipeline):** [PR #27](https://github.com/Phenwatsa/singslot-karaoke/pull/27)
- **PR Link (Repeatable Release Proof - Task 7b):** Pending Release PR into `main`
- **Source Branch:** `feat/lab5-auto-deploy`
- **Target Branch:** `sprint-1-staging` → `main`
- **Primary Owner:** @Phenwatsa
- **Reviewer:** @lephirada
- **Status:** Approved
- **Verdict:** Verified

#### 🔍 Review Discussion & Verification Notes

- **Developer Submission Summary (@Phenwatsa):**
  - Created `.github/workflows/deploy.yml` with exact workflow name `Deploy demo` to automate CD to Google Cloud Run upon merge to `main`.
  - Configured keyless WIF authentication via `google-github-actions/auth@v2` consuming GitHub repository/environment variables (`GCP_PROJECT_ID`, `GCP_REGION`, `WIF_PROVIDER`, `WIF_SERVICE_ACCOUNT`) under environment `demo`.
  - Configured pipeline order:
    1. Reusable CI test gate via `./.github/workflows/ci-docker.yml` (`test-and-docker`).
    2. Commit SHA validation (40-char lowercase hex).
    3. Docker image build & push to Artifact Registry tagged with commit SHA.
    4. Immutable image digest resolution (`@sha256:...`) and strict digest validation (`@sha256:[0-9a-f]{64}`).
    5. Database migration gate: updates `singslot-migrate` job image and executes with `--wait`. If migration fails, deployment terminates immediately before Cloud Run service update.
    6. Cloud Run service update: updates `singslot` revision directly with immutable digest and shifts 100% traffic.
    7. Automated read-only smoke tests: queries live service URL and executes `python3 deploy/smoke_test.py "$SERVICE_URL"` across both automated deployments and manual rollbacks.
    8. GitHub Step Summary outputting target commit SHA, immutable digest, revision name, and public URL.
  - Enhanced `deploy/smoke_test.py` to seamlessly validate SingSlot API responses (`/api/health` status UP and `/api/rooms` count) across both local unit mock tests and live Cloud Run deployments.
  - Added test contract in `server/tests/ci.test.ts` verifying all structural, trigger, and security constraints of `deploy.yml`.
  - Rollback safety: Ensured `ROLLBACK: 'true'` is injected during manual rollback to prevent execution of database migration and seeding from historical images.
  - All tests passing: 17/17 server CI tests, 11/11 offline smoke tests, 5/5 deploy stubs, 5/5 release stubs, 3/3 teardown stubs, and TypeScript typecheck (0 errors).
  - Ready for Peer Review from @lephirada on PR #27.

- **Reviewer (@lephirada):**
  Reviewed the latest updates. All raised issues have been addressed, and the latest CI check passed. The deployment workflow now meets the Task 7 requirements. No further blocking concerns. Approved!

- **Developer Response (@Phenwatsa):**
  Thank you for the review and approval! I have recorded the peer review audit notes in `docs/labs/lab-05/reviewer.md`. Merging PR #27 into `sprint-1-staging` now! 🚀

- **Status:** Approved
- **Outcome:** PR #27 approved and ready for merge into `sprint-1-staging`. Unlocks creation of Release PR into `main` for automated continuous deployment and repeatability verification (Task 7b / C-06).

#### 🔍 Task 7b: Prove Repeatable Release via UI Update (Requirement C-06)

- **GitHub Issue:** [Issue #29](https://github.com/Phenwatsa/singslot-karaoke/issues/29)
- **Source Branch:** `feat/lab5-deploy-proof`
- **Target Branch:** `sprint-1-staging` → `main`
- **Primary Owner:** @Phenwatsa
- **Reviewer:** @lephirada
- **Status:** In Review
- **Verdict:** Pending

##### 🔍 Review Discussion & Verification Notes
- **Developer Submission Summary (@Phenwatsa):**
  - Updated `client/src/components/layout/AppLayout.tsx` adding release badge in top navigation and version string in footer: `v1.0.1 - Cloud Verified`.
  - Verified local client unit tests pass (12/12 passed).
  - Verified monorepo typecheck (`npm run typecheck`) passed with 0 errors.
  - Verified production build (`npm run build`) succeeded.
  - Ready for Peer Review from @lephirada on Feature PR into `sprint-1-staging` before promoting to `main` for Revision 2 automated continuous deployment.

---

### 📌 Task 8: Persistence & Rollback Verification

- **GitHub Issue:** [Issue #21](https://github.com/Phenwatsa/singslot-karaoke/issues/21)
- **Primary Owner:** @lephirada
- **Reviewer:** @Phenwatsa
- **Verification Channel:** GitHub Actions & GCP Console
- **Status:** Backlog
- **Verdict:**

#### 🔍 Review Discussion & Verification Notes

<!-- Team members add discussion and verification notes here -->
