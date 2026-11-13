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

|    Task    | Title / Scope                                                 | Primary Owner |  Reviewer   | Branch                  | PR Target                                                       |  Status  | Verdict  |
| :--------: | :------------------------------------------------------------ | :-----------: | :---------: | :---------------------- | :-------------------------------------------------------------- | :------: | :------: |
| **Task 1** | `[Lab 5 - Task 1] GCP Account & Cost Control`                 |  @Phenwatsa   | @lephirada  | GCP Console             | None (Issue comment)                                            |   Done   | Verified |
| **Task 2** | `[Lab 5 - Task 2] Prepare SingSlot for Cloud Deployment`      |  @lephirada   | @Phenwatsa  | `feat/lab5-cloud-ready` | [PR #22](https://github.com/Phenwatsa/singslot-karaoke/pull/22) | Approved | Verified |
| **Task 3** | `[Lab 5 - Task 3] Docker Containerization`                    |  @Phenwatsa   | @lephirada  | `feat/lab5-docker`      | [PR #23](https://github.com/Phenwatsa/singslot-karaoke/pull/23) | Approved | Verified |
| **Task 4** | `[Lab 5 - Task 4] CI Quality Gate on Pull Requests`           |  @lephirada   | @Phenwatsa  | `feat/lab5-ci`          | `sprint-1-staging` → `main`                                     | Backlog  | Pending  |
| **Task 5** | `[Lab 5 - Task 5] First GCP Deployment`                       |  @Phenwatsa   | @lephirada  | Cloud Shell             | None (Console / Issue)                                          | Backlog  | Pending  |
| **Task 6** | `[Lab 5 - Task 6] WIF Setup & Branch Protection Verification` |  @lephirada   | @Phenwatsa  | `test/prove-gate`       | `main`                                                          | Backlog  | Pending  |
| **Task 7** | `[Lab 5 - Task 7] Automatic Deployment Pipeline`              |  @Phenwatsa   | @lephirada  | `feat/lab5-auto-deploy` | `sprint-1-staging` → `main`                                     | Backlog  | Pending  |
| **Task 8** | `[Lab 5 - Task 8] Persistence & Rollback Verification`        |  @lephirada   | @Phenwatsa  | Actions & Console       | None (Console / Issue)                                          | Backlog  | Pending  |
| **Step 9** | `[Lab 5 - Step 9] Final Documentation & PDF Evidence Index`   | Both Members  | Peer Review | `docs/` & LEB2 PDF      | None (Submission)                                               | Backlog  | Pending  |

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
- **Verdict:** Verified

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
- **Verdict:** Verified

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
- **PR Link (Feature PR):** [Pending Submission to `sprint-1-staging`]
- **PR Link (Release PR to main):** [Pending Submission to `main`]
- **Source Branch:** `feat/lab5-ci`
- **Target Branch:** `sprint-1-staging` → `main`
- **Primary Owner:** @lephirada
- **Reviewer:** @Phenwatsa
- **Status:** In Review
- **Verdict:** Pending PR Merge & GitHub Actions Run

#### 🔍 Review Discussion & Verification Notes

---

### 📌 Task 5: First GCP Deployment

- **GitHub Issue:** [Issue #18](https://github.com/Phenwatsa/singslot-karaoke/issues/18)
- **Primary Owner:** @Phenwatsa
- **Reviewer:** @lephirada
- **Verification Channel:** Cloud Shell / GCP Console
- **Status:** Backlog
- **Verdict:**

#### 🔍 Review Discussion & Verification Notes

<!-- Team members add discussion and verification notes here -->

---

### 📌 Task 6: WIF Setup & Branch Protection Verification

- **GitHub Issue:** [Issue #19](https://github.com/Phenwatsa/singslot-karaoke/issues/19)
- **PR Link (`test/prove-gate` - Blocked Merge Proof):**
- **Source Branch:** `test/prove-gate`
- **Target Branch:** `main`
- **Primary Owner:** @lephirada
- **Reviewer:** @Phenwatsa
- **Status:** Backlog
- **Verdict:**

#### 🔍 Review Discussion & Verification Notes

<!-- Team members add discussion and verification notes here -->

---

### 📌 Task 7: Automatic Deployment Pipeline

- **GitHub Issue:** [Issue #20](https://github.com/Phenwatsa/singslot-karaoke/issues/20)
- **PR Link (Pipeline):**
- **PR Link (Repeatable Release Proof - Task 7b):**
- **Source Branch:** `feat/lab5-auto-deploy`
- **Target Branch:** `sprint-1-staging` → `main`
- **Primary Owner:** @Phenwatsa
- **Reviewer:** @lephirada
- **Status:** Backlog
- **Verdict:**

#### 🔍 Review Discussion & Verification Notes

<!-- Team members add discussion and verification notes here -->

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
