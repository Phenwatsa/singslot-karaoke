# Lab 7 AI Usage & Governance Log

## Project: SingSlot — Karaoke Room Reservation & Management System

**Course:** CPE 334 Introduction to Software Engineering in the Age of AI Agents (1/2026)  
**Deliverable:** Lab 7 — Software Maintenance Metrics and Release Readiness  
**AI Assistant:** Antigravity (Google DeepMind Advanced Agentic Coding)

---

### Session Log: 25 November 2026

#### 1. Lab 7 Requirement Breakdown, Adaptive Change Scoping & Cross-Deliverable Coordination
- **Prompt Intent:** Analyze the CPE334 Lab 7 specification, account for the course announcement waiving external Instructor/TA approval while emphasizing a non-trivial Sprint 1 adaptive change, design a substantive multi-rule Sprint 1 change combining operational constraints and flat hourly room pricing (`BR-04` 60-min online cutoff, `BR-01` Peak-Hour 3-hr cap, `BR-11` 6-hr daily customer quota, `BR-12` flat hourly pricing 200/350/500 THB), and audit compatibility against the parallel Deliverable 2 Sprint 2–3 issues on `sprint-1-staging`.
- **Tools Used:** `read_file`, `run_command` (read-only Git history, workflow trigger inspection, Prisma schema & controller inspection).
- **Outcome:** Confirmed `.github/workflows/ci-docker.yml` triggers on `[sprint-1-staging, main]` and `singslot-migrate` automatically executes `prisma migrate deploy && npm run prisma:seed`; coordinated a 5-Wave non-conflicting workflow with teammate (`@lephirada`); resolved two pre-implementation design edge cases before coding: (1) reassigned Lab 7 availability cutoff test ID from `TEST-03b` to `TEST-03c` to preserve `TEST-03b` for Sprint 2 `NFR-04`, and (2) separated `isWithinCutoff` from `isPast` and documented `id != targetBookingId` exclusion in `BR-11` so Sprint 2 Walk-in (`F-07`) and Rescheduling (`F-08`) remain conflict-free.

#### 2. Lab 7 Issue 1 — Pre-Implementation Change Impact Analysis & Contract Revision (`v1.2.0` $\rightarrow$ `v1.3.0`)
- **Prompt Intent:** Author the complete Part A documentation package on branch `docs/lab7-issue-1-contract-impact` strictly prior to any test or implementation code edits.
- **Tools Used:** `read_file`, `edit_file`, `write_file`, `run_command` (`git status`, `ls`).
- **Outcome:**
  - Created `docs/labs/lab-07/change-impact.md` containing the approved change request record, exact baselines (`v0.1.0-sprint1` / `cc1c3d82`, Lab 6 `f3eb92d4` / `singslot-00005-26q`, staging `676c7dfa`), compact Impact Traceability Table (with explicit N/A rationales), Preserved Sprint 1 Regression Protection Matrix, and additive SQL migration/backfill plan.
  - Revised and versioned (`1.2.0` $\rightarrow$ `1.3.0`) `docs/system-specifications/srs.md`, `features.md`, `system-sds.md`, `traceability.md`, and `docs/sprints/sprint-1/contracts.md` (including revised Contracts 2–4, Acceptance Criteria `AC-02b`, `AC-03c`, `AC-04g`–`04j`, and Software Test Specification `TEST-02b`, `TEST-03c`, `TEST-04g`–`04j`).
  - Initialized `docs/labs/lab-07/reviewer.md`, `docs/labs/lab-07/ai-use.md`, and `docs/screenshots/lab-07/.gitkeep`, and indexed Lab 7 logs in `docs/ai-use.md`. Zero application or test source files modified.


---

### Session Log: 27 November 2026

#### 3. Lab 7 Issue 3 (Issue #48) — Post-Deployment Live Verification, Engineering Metrics & Release Readiness
- **Prompt Intent:** Execute live post-deployment verification against the active Cloud Run production revision (`singslot-00007-vd5`, `v0.2.0-sprint2` containing all Lab 7 Sprint 1 maintenance rules and preserved Sprint 1 invariants), extract five dated, offline-reconcilable engineering metrics from GitHub/Git/CI records, and author the Part B/C/D Lab 7 submission documentation on branch `docs/lab7-issue-3-metrics-readiness`.
- **Tools Used:** `run_command` (read-only `git log`, `gh issue list`, `gh pr list`, `gh run list`, public `curl` probes), `write_file`, `edit_file`, Google Cloud Shell verification script (executed manually by developer using GCP Secret Manager without printing credentials).
- **Outcome:**
  - Verified all 12 live Cloud Run checks (`EVD-PD-01`–`EVD-PD-12`) against `https://singslot-4o7kwmd5ma-as.a.run.app` (`singslot-00007-vd5`, commit `6d0f23cc`, digest `sha256:d898f7a8...`), confirming `BR-12` pricing (`BK-20261220-HQL6`, `totalPrice=700`, tamper ignored), `BR-01` Peak cap (`400 PEAK_DURATION_EXCEEDED`), `BR-04` 60-min cutoff (`400 CANNOT_BOOK_PAST_SLOT`), `BR-11` 6-hr daily quota (`409 DAILY_QUOTA_EXCEEDED`), preserved `BR-07`/`BR-08` `403` isolation, Staff Master Schedule visibility, and clean synthetic booking cancellation.
  - Authored `docs/labs/lab-07/post-deploy-checks.md`, `docs/labs/lab-07/metrics-readiness.md` (5 metrics + 88-word `<= 100`-word action plan + Release Readiness Checklist + Technical Debt register + Version Traceability + Retrospective), updated `docs/labs/lab-07/reviewer.md`, and archived sanitized visual evidence in `docs/screenshots/lab-07/` (`deploy-summary-00007-vd5.png`, `live-checks-00007-vd5.png`). Zero application code modified.
