# Lab 5 Submission & Evidence Checklist
## Project: SingSlot — Karaoke Room Reservation & Management System
**Course:** CPE 334 Introduction to Software Engineering in the Age of AI Agents  
**Target File:** `lab5_sec<section>_<group_name>.pdf` (Submitted on LEB2 by Sunday 15 Nov 2026, 23:59)  
**Team Members:**  
- Developer 1: Phenwatsa (@Phenwatsa / Student ID: [YOUR_STUDENT_ID])
- Developer 2: phirada (@lephirada / Student ID: [YOUR_STUDENT_ID])
**Repository:** Public (`https://github.com/Phenwatsa/singslot-karaoke`)  
**Work Allocation Reference:** [`docs/github-issues-guide.md`](../github-issues-guide.md#4-lab-5-cloud-deployment--cicd-pipeline-tasks-1-to-8)

---

## 📌 Answer Part 0: Team and Evidence Index

- [ ] **Course, Section & Team Number:** CPE 334, Section [XX], Team [YY], SingSlot (Karaoke Reservation)
- [ ] **Team Information:** Full names, Student IDs, and GitHub Usernames for both members verified
- [ ] **Repository Link:** Public GitHub repository link accessible without login (must remain public until grading concludes per R-12)
- [ ] **Submitted Tag or Commit:** Full 40-character Commit SHA or Git Tag submitted on LEB2
- [ ] **Deployed Public URL & Running Commit:** Active Cloud Run URL serving the verified running Commit SHA (scale-to-zero active with min-instances=0)
- [ ] **GitHub Project Board Evidence (R-09):**
  - [ ] Direct link to public GitHub Project Board
  - [ ] Captioned screenshot: Project board showing all Lab 5 Issues organized across lifecycle columns (`Backlog`, `Specified`, `Started`, `PR Review`, `Done`)
  - [ ] Captioned screenshot: Final board status with all Lab 5 tasks completed and closed
- [ ] **Preserve History & CI Mandatory Confirmation (R-10):**
  - [ ] Confirmation that Git commits, PRs, and CI run histories are preserved without rewriting or deletion
  - [ ] Confirmation that `protect-main` branch ruleset and status check remain permanently active post-submission
- [ ] **Contribution Matrix (R-11):** Table detailing both members' active work across Requirements, Testing, AI Supervision, Implementation, Review, and Deployment (referencing `docs/github-issues-guide.md`)
- [ ] **Evidence Index Table:** Master table indexing all Required Checks (C-01 to C-06) with artifact links, commit SHAs, and verification results

---

## 🛡️ Answer Part 1: CI and Quality Gate (30 Points)

- [ ] **Workflow File:** Direct link to `.github/workflows/ci-docker.yml` on `main`
- [ ] **Feature PR into Staging (Task 4 Bootstrap):**
  - [ ] Direct link to feature PR into `sprint-1-staging` with teammate peer review
- [ ] **Post-Bootstrap CI Verification PR (C-01 / R-05):**
  - [ ] Direct link to dedicated verification PR targeting `main` (proving live CI after workflow is on `main`)
  - [ ] Direct link to successful GitHub Actions run
  - [ ] Test summary showing backend, frontend, and Docker build checks passed
- [ ] **Merge Gate Configuration (R-06):**
  - [ ] Ruleset `protect-main` is Active on branch `main`
  - [ ] Bypass list is empty
  - [ ] Required check `test-and-docker` selected
  - [ ] Captioned screenshot of Ruleset configuration in GitHub Settings
- [ ] **Temporary Failing PR & Blocked Merge (C-02 / R-06):**
  - [ ] Direct link to temporary PR targeting `main` from temporary branch `test/prove-gate`
  - [ ] Direct link to failed GitHub Actions run
  - [ ] **Captioned Screenshot:** Merge button visibly blocked with explicit message stating required status check `test-and-docker` failed (No secrets shown)
  - [ ] Temporary branch safely closed without merging

---

## 🐳 Answer Part 2: Docker and Reproducible Configuration (20 Points)

- [ ] **Docker Files:** Direct links to `Dockerfile`, `.dockerignore`, and `docker-compose.yml`
- [ ] **Fresh Clone Build & Run Verification (C-03 / R-01, R-02):**
  - [ ] Terminal evidence of fresh clone in separate test directory: `git clone https://github.com/Phenwatsa/singslot-karaoke.git fresh-clone`
  - [ ] Deterministic dependencies installation from lockfile: `npm ci`
  - [ ] Copy and configure local environment from `.env.example` to `.env` using placeholder values (no secrets committed)
  - [ ] Container image build and local composition startup with PostgreSQL: `docker compose up --build -d`
  - [ ] Database readiness probe verification: `curl -f http://localhost:8080/api/ready` responds with HTTP 200 `{ status: "ready", db: "connected" }`
  - [ ] Browser and API verification: Web UI loads properly and reservation API endpoints respond correctly
- [ ] **Environment Configuration (R-02):**
  - [ ] Direct link to `server/.env.example` in repository
  - [ ] Environment variable specification table in `docs/labs/lab-05/deployment.md` (covering `NODE_ENV`, `PORT`, `TZ`, `CLIENT_DIST_PATH`, `DATABASE_URL`, `JWT_SECRET`, `STAFF_PASSWORD`, and `CUSTOMER_PASSWORD`)
  - [ ] Audit confirmation: Zero real secrets or connection strings committed in repository, image, logs, or PDF

---

## ☁️ Answer Part 3: GCP Deployment and Persistence (35 Points)

- [ ] **Public URL (R-03):** Public Cloud Run URL accessible without VPN or special auth
- [ ] **End-to-End Domain Workflow (C-04 / R-03):**
  - [ ] Captioned screenshot: Successful user login on public URL (URL visible)
  - [ ] Captioned screenshot: Core booking action completed (selecting room, contiguous slots, booking creation)
  - [ ] Captioned screenshot: Business rule rejection (e.g., booking collision or invalid duration)
- [ ] **GCP Infrastructure Verification:**
  - [ ] Captioned screenshot: Cloud Run service details (Min instances: 0, Max instances: <=3)
  - [ ] Captioned screenshot: Cloud SQL PostgreSQL instance (`storage-auto-increase: OFF`)
  - [ ] Captioned screenshot: Secret Manager secret names (Zero secret values visible)
  - [ ] **Cloud Run Migration Job Execution (`singslot-migrate`):**
    - [ ] Captioned screenshot: Cloud Run Job configuration showing Service Account `singslot-migrator`, Cloud SQL instance attached, and Secret Manager bindings (`DATABASE_URL`, `STAFF_PASSWORD`, `CUSTOMER_PASSWORD`)
    - [ ] Captioned screenshot / terminal log: Execution status displaying successful exit code 0 (`npx prisma migrate deploy && npm run prisma:seed`)
    - [ ] Evidence confirming migration job executes using the exact same immutable image digest (`@sha256:...`) as the service revision
- [ ] **Data Persistence Verification (C-05 / R-04):**
  - [ ] Verification log recording Booking Code, Room, Date, Time Slots, Commit SHA, and Deployed Digest
  - [ ] Captioned screenshot: Booking record created and visible on public URL before restart / redeployment
  - [ ] **Instance Restart & Process Recycling Proof:**
    - [ ] Captioned screenshot: Cloud Run Metrics / Logs showing container instance count dropping to 0 during idle scale-to-zero (or Docker Compose container ID change `ID A != ID B`)
    - [ ] Captioned screenshot: Cloud Run Logs Explorer capturing container startup log (`[Server] SingSlot API listening on port...`) upon incoming request after scale-to-zero, proving a fresh instance was created
    - [ ] Captioned screenshot: Pre-existing booking record retrieved completely intact by the fresh instance from Cloud SQL
  - [ ] **Redeployment Verification:**
    - [ ] Captioned screenshot: Cloud Run forced redeployment / new revision creation (using identical image digest and updated trigger variable) with 100% traffic shift
    - [ ] Captioned screenshot: Booking record still present and fully intact on live URL after new revision activation (proving data resides in Cloud SQL rather than ephemeral container memory - C-05)

---

## 🔄 Answer Part 4: Repeatable Release Pipeline (15 Points)

### Required Part 4 Evidence (15 Points): Full Release Lifecycle — Release 2 (C-06 / R-07, R-08, R-09, R-10)
- [ ] Dedicated GitHub Issue with label `lab5` tracking visible release proof change (e.g., `[Lab 5 - Task 7b] Prove Repeatable Release via UI Update`)
- [ ] Feature PR into `sprint-1-staging` referencing the issue with explicit peer review from teammate (specific findings/checks stated)
- [ ] Release PR from `sprint-1-staging` into `main` with approval and green CI
- [ ] Automatic trigger of `.github/workflows/deploy.yml` upon merge to `main`
- [ ] Pipeline run summary recording Commit SHA, image digest, Cloud Run revision name, and public service URL
- [ ] Captioned screenshot: Cloud Run latest revision matching the exact commit SHA / image digest
- [ ] Captioned screenshot: Live website UI updated with Release 2 string (e.g., `v1.0.1 - Cloud Verified`) without manual deploy commands (C-06)
- [ ] **Release Runbook:** Direct link to release procedure documented in `docs/labs/lab-05/deployment.md` (R-08)

### Optional Recommended Verification (Student Guide Episode 8 / Non-Scored Practice):
- [ ] **Automated Container Rollback Verification (Episode 8):**
  - [ ] Captioned screenshot: GitHub Actions `workflow_dispatch` trigger with Release 1 commit SHA
  - [ ] Captioned screenshot / logs: GitHub Actions pipeline deploys Release 1 immutable image digest directly without rebuilding and without executing migrations
  - [ ] Captioned screenshot: Live website UI successfully reverts to Release 1
  - [ ] Verification evidence: Pre-existing booking records remain completely intact in Cloud SQL and accessible on UI
- [ ] **Automated Container Roll-forward Verification (Episode 8):**
  - [ ] Captioned screenshot: GitHub Actions `workflow_dispatch` trigger with Release 2 commit SHA deploying by historical digest without re-running migrations
  - [ ] Captioned screenshot: Live website UI restored to Release 2 with all booking data preserved intact

---

## ⚠️ Pre-Submission Sanity Check (Definition of Done)

- [ ] **Secret Sanitization:** Verified zero API keys, passwords, database URLs, or private tokens in any screenshot or link
- [ ] **Caption Format:** Every screenshot has a numbered caption (e.g. `Figure X. C-02 (R-06): ...`) specifying check ID, requirement ID, and commit SHA
- [ ] **Readability:** All screenshot text is legible at 100% zoom (no unreadable full-desktop downscaling)
- [ ] **PDF Naming Convention:** File correctly named `lab5_sec<section>_<group_name>.pdf`
- [ ] **LEB2 Upload:** Uploaded before deadline (Sunday 15 November 2026, 23:59)
- [ ] **Service Accessibility:** Cloud Run public URL verified reachable throughout the grading window
