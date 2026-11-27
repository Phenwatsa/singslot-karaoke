# Lab 7 Parts C & D — Engineering Metrics, Release Readiness & Retrospective

## Project: SingSlot — Karaoke Room Reservation & Management System

**Course:** CPE 334 Introduction to Software Engineering in the Age of AI Agents (Semester 1/2026)  
**Deliverable:** Lab 7 — Part C: Engineering Metrics (15 pts) & Part D: Release Readiness Review & Retrospective (10 pts)  
**GitHub Issue:** [Issue #48](https://github.com/Phenwatsa/singslot-karaoke/issues/48) (`[Lab 7 - Issue 3] Post-Deployment Verification, Engineering Metrics & Release Readiness`)  
**Branch:** `docs/lab7-issue-3-metrics-readiness`  
**Primary Owner:** `@Phenwatsa` | **Reviewer:** `@lephirada`  
**Metrics Snapshot Timestamp:** `2026-11-27 12:30 ICT (2026-11-27T05:30:00Z)`

---

## Part C — Objective Engineering Metrics (Reconcilable Offline)

All five metrics below are extracted directly from the repository Git history, GitHub Issues/PRs, GitHub Actions workflow runs, and Lab 6/Lab 7/Sprint 2 test records at snapshot **`2026-11-27 12:30 ICT`**. Every figure is backed by an embedded source summary so it can be audited offline without opening external links.

### C.1 Metrics Summary Table

| # | Metric Name | Exact Definition | Repository Scope & Window | Snapshot Value |
| :-: | :--- | :--- | :--- | :--- |
| **M1** | **Completed Issues** | Count of GitHub Issues with `state == CLOSED` representing completed engineering, CI/CD, UAT, or maintenance tasks (excluding duplicates, cancelled, and still-open issues `#44`, `#48`). | `Phenwatsa/singslot-karaoke`<br>`2026-11-05` – `2026-11-27 12:30 ICT` | **`23` completed** *(out of `25` tracked; `2` open, `0` cancelled/duplicate)* |
| **M2** | **Merged Pull Requests** | Count of Pull Requests with `state == MERGED` into `sprint-1-staging` or `main` (excluding closed unmerged gate-test PR `#26` and open PR `#54`). | `Phenwatsa/singslot-karaoke`<br>`2026-11-05` – `2026-11-27 12:30 ICT` | **`27` merged** *(`20` into `sprint-1-staging`, `7` into `main`)* |
| **M3** | **Automated Test Results** | Serial test suite execution results on deployed production `main` commit `6d0f23cc` (`v0.2.0-sprint2`), verified in CI Run `#45852161140` & Deploy Run `#45852744756`. | `server/` (`jest --runInBand`) + `client/` (`node --test --test-concurrency=1`)<br>Commit `6d0f23cc` (`2026-11-26`) | **`130` passed, `0` failed, `0` skipped (`100%`)** *(`118` server + `12` client; `0` TS/build errors)* |
| **M4** | **UAT & Maintenance Defect Status** | Count of open accepted defects (`P0` Critical, `P1` High, `P2` Medium) not yet verified fixed and merged to `main` (excludes `Not-Defect` and deferred `Enhancement`/debt). | Lab 6 UAT + Lab 7 & Sprint 2 PR reviews<br>`2026-11-21` – `2026-11-27 12:30 ICT` | **`0` open defects** *(`3/3` accepted UAT defects closed; `5/5` pre-merge review findings resolved)* |
| **M5** | **CI/CD Workflow Run Outcomes** | Completion outcomes across `CI & Docker Build` and `Deploy demo` workflows for the most recent 40 completed runs (Lab 6 Fix through Lab 7 / Sprint 2 Release). | `Phenwatsa/singslot-karaoke` Actions<br>`2026-11-21` – `2026-11-27 12:30 ICT` | **`39 / 40` passed (`97.5%`)** *(`27 / 27` = `100%` during Lab 7 & Sprint 2 window `2026-11-25`–`27`)* |

---

### C.2 Embedded Source Tables (Offline Reconciliation)

#### Source Table M1 — Completed Issues (`23` Closed, `2` Open)

| Milestone | Closed Issue IDs | Completion Dates (UTC) | Closed Count | Open Issues |
| :--- | :--- | :--- | :---: | :--- |
| **Sprint 1** | `#2`, `#3`, `#4`, `#5`, `#6`, `#7` | `2026-11-05` – `2026-11-07` | `6` | None |
| **Lab 5 (CI/CD & Cloud)** | `#14`, `#15`, `#16`, `#17`, `#18`, `#19`, `#20`, `#21`, `#29` | `2026-11-12` – `2026-11-15` | `9` | None |
| **Lab 6 (Partner UAT)** | `#32`, `#33`, `#34`, `#35` | `2026-11-20` – `2026-11-22` | `4` | None |
| **Lab 7 (Maintenance)** | `#45` (Issue 1), `#47` (Issue 2) | `2026-11-25` | `2` | `#48` (Issue 3 — this PR) |
| **Deliverable 2 (Sprint 2–3)** | `#42` (D2-1), `#43` (D2-2) | `2026-11-25` – `2026-11-26` | `2` | `#44` (D2-3 — Sprint 3 `F-11`) |
| **Total** | **23 unique closed issues (`0` duplicates/cancelled)** | **`2026-11-05` – `2026-11-26`** | **`23`** | **`2` open (`#44`, `#48`)** |

#### Source Table M2 — Merged Pull Requests (`27` Merged: `20` Staging + `7` Main)

| Target Branch | Merged PR IDs (Chronological) | Merge Date Window (UTC) | Count | Excluded Non-Merged PRs |
| :--- | :--- | :--- | :---: | :--- |
| **`sprint-1-staging`** | `#1`, `#8`, `#9`, `#10`, `#11`, `#12`, `#22`, `#23`, `#24`, `#27`, `#30`, `#36`, `#37`, `#38`, `#39`, `#41`, `#46`, `#49`, `#50`, `#52` | `2026-11-05` – `2026-11-26` | `20` | `#54` (`OPEN`, Sprint 3 `F-11`) |
| **`main` (Releases)** | `#13` (`cc1c3d82`), `#25` (`e598e212`), `#28` (`4cd0f90d`), `#31` (`aa5f109b`), `#40` (`f3eb92d4`), `#51` (`7ddc0a0b`), `#53` (`6d0f23cc`) | `2026-11-07` – `2026-11-26` | `7` | `#26` (`CLOSED`, intentional branch-gate test) |
| **Total** | **27 merged PRs** | **`2026-11-05` – `2026-11-26`** | **`27`** | **`1` closed unmerged, `1` open** |

#### Source Table M3 — Automated Test Results (`6d0f23cc` / `v0.2.0-sprint2`)

| Suite Name | Command | Verified Commit SHA | Passed | Failed | Skipped | Notes |
| :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| **Server Integration & Unit (12 suites)** | `cd server && npm test` (`jest --runInBand`) | `6d0f23cc3b2094e6e832d93e7e4889bc114627dc` | `118` | `0` | `0` | Covers Sprint 1 (`TEST-01`–`06`), Lab 6 (`DEF-SS-01`–`03`), Lab 7 (`TEST-02b`, `03c`, `04g`–`04j`), Sprint 2 (`TEST-07a`–`10b`, `03b` `69–77 ms < 200 ms`) |
| **Client Unit & Layout** | `cd client && npm test` (`node --test --test-concurrency=1`) | `6d0f23cc3b2094e6e832d93e7e4889bc114627dc` | `12` | `0` | `0` | Covers Unified Layout Shell, `date.ts` cutoff helper, and `StaffMasterScheduleView` |
| **TypeScript & Build Gate** | `npm run typecheck && npm run build` | `6d0f23cc3b2094e6e832d93e7e4889bc114627dc` | `Pass` | `0` | `0` | Zero TypeScript or Vite/TSC build diagnostics |
| **Combined Total** | **CI Run `#45852161140` / Deploy Run `#45852744756`** | **`6d0f23cc`** | **`130`** | **`0`** | **`0`** | **100% pass rate (also 100% at Lab 7 tag `v0.1.2-lab7` / Run `#45593502671`)** |

#### Source Table M4 — UAT & Maintenance Defect Register (`0` Open Defects)

| Defect / Finding ID | Source | Severity | Classification | Status | Resolution Proof |
| :--- | :--- | :---: | :--- | :---: | :--- |
| **`DEF-SS-01`** | Lab 6 Partner UAT | Critical (P0) | Accepted Defect | **Closed (Verified)** | PR #39 / #40 (`f3eb92d4`), `singslot-00005-26q` |
| **`DEF-SS-02`** | Lab 6 Partner UAT | High (P1) | Accepted Defect | **Closed (Verified)** | PR #39 / #40 (`f3eb92d4`), `singslot-00005-26q` |
| **`DEF-SS-03`** | Lab 6 Partner UAT | High (P1) | Accepted Defect | **Closed (Verified)** | PR #39 / #40 (`f3eb92d4`), `singslot-00005-26q` |
| **`DEF-SS-04 (4A)`** | Lab 6 Partner UAT | Medium | **Not-Defect** (By Design) | **Closed** | Complies with Sprint 1 Contract `AC-01`/`AC-01e` |
| **`DEF-SS-04 (4B)`** | Lab 6 Partner UAT | Medium | **Enhancement / Debt** (P3) | **Deferred** | Tracked in Technical Debt Table (Part D.2) |
| **PR #50 Review (1)** | Lab 7 Issue 2 Peer Review | Medium (P2) | Pre-Merge Review Finding | **Resolved Pre-Merge** | `a32592c` (`BookingModal` 60m cutoff UI guard) |
| **PR #52 Review (4)** | Sprint 2 Peer Review | Medium (P2) | Pre-Merge Review Findings | **Resolved Pre-Merge** | `f169c26`, `b83bd99`, `de9b8fa`, `c0a6c49` |

#### Source Table M5 — CI/CD Workflow Run Summary (`2026-11-21` – `2026-11-27 12:30 ICT`, 40 Runs)

| Workflow | Total Runs | Succeeded | Failed | Pass Rate | Key Release / Failure Run IDs |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **`CI & Docker Build`** | `37` | `36` | `1` | `97.3%` | Sole failure: `#44928976326` (`2026-11-21`, intentional TDD RED commit `a810b980`). Lab 7 & Sprint 2 window (`2026-11-25`–`27`): `25/25` (`100%`). |
| **`Deploy demo`** | `3` | `3` | `0` | `100.0%` | `#44941547401` (`f3eb92d4`, `singslot-00005-26q`), `#45608475633` (`7ddc0a0b`, `singslot-00006-49h`), `#45852744756` (`6d0f23cc`, `singslot-00007-vd5`). |
| **Combined (40 Runs)** | **`40`** | **`39`** | **`1`** | **`97.5%`** | **Zero production deployment failures; 100% green across Lab 7 & Sprint 2 (`27/27`).** |

---

### C.3 Action-Oriented Interpretation *(88 words — strictly $\le 100$ words)*

Across 23 completed issues, 27 merged PRs, and 40 recent CI/CD runs (97.5% pass rate; 100% across Lab 7 and Sprint 2), SingSlot maintains 130/130 passing automated tests and 0 open defects. However, one deferred P3 security debt item (`DEF-SS-04 (4B)` permissive CORS) and two devDependency audit advisories remain, alongside open PR #54 (`F-11`).
**Action Plan:** `@Phenwatsa` will implement an explicit `CORS_ORIGINS` allowlist (`DEF-SS-04 (4B)`) and audit dependencies before the final Sprint 3 release (`v0.3.0-final`, `F-14`), while `@lephirada` reviews Lab 7 Issue #48 and finishes Sprint 3 `F-11`.

---

## Part D — Release Readiness Review & Retrospective

### D.1 Release Readiness Checklist (Maintained Sprint 1 Scope)

- **Evaluated Scope:** Maintained Sprint 1 Golden Online Booking Slice (`FR-01`–`FR-06`, `BR-01`–`BR-08`, plus Lab 7 `BR-11`, `BR-12`, and Sprint 2 `F-07`–`F-10` on active production revision `singslot-00007-vd5`).
- **Release Readiness Verdict:** **`READY`** *(All mandatory engineering, migration, verification, and documentation gates satisfied with zero open defects.)*

| Readiness Dimension | Gate Criterion | Status | Objective Evidence |
| :--- | :--- | :---: | :--- |
| **1. Version & Tag Traceability** | Deployed image matches immutable digest & tagged `main` commit | **PASS** | `v0.1.2-lab7` (`7ddc0a0b` / `singslot-00006-49h`) & `v0.2.0-sprint2` (`6d0f23cc` / `singslot-00007-vd5`, `sha256:d898f7a8...`) |
| **2. Defect Gate** | `0` open Critical/High/Medium defects | **PASS** | `0` open defects (`DEF-SS-01`–`03` verified closed; all 5 PR #50/#52 review findings resolved pre-merge) |
| **3. Automated Test & Regression Gate** | 100% passing unit, integration, concurrency & layout suites | **PASS** | `118/118` server + `12/12` client = `130/130` passed (`0` failed/skipped); `0` TS/build errors (Run `#45852161140`) |
| **4. Database Migration & Rollback Safety** | Additive migration executed cleanly without historical data loss | **PASS** | `20261125000000_add_room_pricing_and_booking_total` ran via `singslot-migrate`; historical bookings backfilled; rollback-safe defaults |
| **5. Security & Secret Hygiene** | Zero hardcoded secrets; RBAC & data isolation verified live | **PASS** | Credentials stored exclusively in GCP Secret Manager; live `BR-07` (`403`) & `BR-08` (`403`) verified (`EVD-PD-09`, `EVD-PD-10`) |
| **6. Documentation & Contracts** | Specs, contracts, traceability, STS & peer review logs current | **PASS** | `srs.md`, `features.md`, `system-sds.md`, `traceability.md`, `contracts.md`, `tests.md`, `change-impact.md`, `reviewer.md` updated to `v1.3.0+` |
| **7. Post-Deployment Live Verification** | Live Cloud Run checks pass on changed + preserved behaviors | **PASS** | `EVD-PD-01`–`EVD-PD-12` all PASS on `singslot-00007-vd5` (`post-deploy-checks.md`) |

---

### D.2 Technical Debt Register (Tracked Separately from Defects)

| Debt ID | Area | Description | Risk / Runtime Impact | Planned Remediation Owner & Milestone |
| :---: | :--- | :--- | :--- | :--- |
| **`TD-01`**<br>*(from `DEF-SS-04 (4B)`)* | Security / Middleware | Permissive wildcard CORS (`app.use(cors())` in `server/src/app.ts`) | **Low in current single-origin Cloud Run deployment** (React SPA served from same Express origin); medium if cross-origin clients are added later. | `@Phenwatsa` — Replace with env-driven `CORS_ORIGINS` allowlist in Sprint 3 (`F-14` / `v0.3.0-final`). |
| **`TD-02`** | Dev Dependencies | Transitive `npm audit` advisories in dev-only tooling (`deepmerge` via `jest`, `esbuild` via `vite`) | **Zero production runtime impact** (devDependencies are excluded from the multi-stage production container image). | `@Phenwatsa` — Upgrade toolchain lockfile during Sprint 3 hardening (`v0.3.0-final`). |
| **`TD-03`** | Auth Session Lifecycle | Stateless 8-hour JWT without server-side token revocation blocklist | **Low for demo scope** (short expiry, synthetic accounts); logout clears client storage only. | Deferred post-course / optional Sprint 3 enhancement if time permits. |

---

### D.3 Version & Deployment Traceability Table

| Milestone | Git Tag / PR | `main` Commit SHA (Short) | Cloud Run Revision | Date (UTC) | Scope & Intervening Work Explanation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Original Sprint 1 Baseline** | `v0.1.0-sprint1` (PR #13) | `cc1c3d82` | *(Pre-Cloud Run)* | `2026-11-07` | Lean Sprint 1 Golden Online Booking Slice (`FR-01`–`FR-06`). |
| **Lab 5 Production Baseline** | PR #31 (`v1.0.1` UI proof) | `aa5f109b` | `singslot-00004-6mv` | `2026-11-14` | Containerized Cloud Run + Cloud SQL + automated CD pipeline. |
| **Lab 6 Accepted Sprint 1** | PR #40 | `f3eb92d4` | `singslot-00005-26q` | `2026-11-21` | Fixed `DEF-SS-01`–`03`; accepted by Independent UAT (`2026-11-22`). |
| **Lab 7 Maintained Sprint 1** | `v0.1.2-lab7` (PR #51) | `7ddc0a0b` | `singslot-00006-49h` | `2026-11-25` | Deployed Lab 7 adaptive changes (`BR-01` Peak cap, `BR-04` 60m cutoff, `BR-11` 6h quota, `BR-12` flat pricing + migration). |
| **Current Active Production** | `v0.2.0-sprint2` (PR #53) | `6d0f23cc` | `singslot-00007-vd5` | `2026-11-26` | **Intervening Sprint 2 work:** Promoted Sprint 2 Operations (`F-07`–`F-10`, PR #52) on top of `v0.1.2-lab7`. All Lab 7 & Sprint 1 rules verified live on `singslot-00007-vd5`. |

---

### D.4 Team Retrospective (Concise — 1–2 Sentences Each)

1. **What helped:** Enforcing a strict pre-implementation contract gate (`[Lab 7 - Issue 1]` PR #49) and serial TDD RED $\rightarrow$ GREEN discipline caught edge cases like `isWithinCutoff` vs. `isPast` separation and lock ordering (`users` $\rightarrow$ `rooms`) before code was written. Reciprocal peer reviews on PR #50 and PR #52 also caught five real P2 gaps before merge.
2. **What hurt:** Running Lab 7 maintenance and Deliverable 2 Sprint 2–3 in overlapping days increased coordination overhead on `sprint-1-staging` and required careful version traceability between `v0.1.2-lab7` and `v0.2.0-sprint2`. A minor payload field mismatch during live script setup also briefly delayed verification.
3. **What we will change for the final release:** We will lock a single release freeze window before tagging `v0.3.0-final` so Sprint 3 features (`F-11`–`F-14`) and security debt (`TD-01` `CORS_ORIGINS`) merge sequentially with zero overlapping release promotions. We will also reuse our automated post-deploy verification script immediately after each Cloud Run rollout.

---

### D.5 Team Contribution Summary (Lab 7)

| Engineer | GitHub | Lab 7 Responsibilities & Delivered Artifacts |
| :--- | :---: | :--- |
| **Penwatsa Saengyenpan** | `@Phenwatsa` | Primary owner of **Issue #45** (`docs/labs/lab-07/change-impact.md`, v1.3.0 spec/contract/STS revisions, PR #49) and **Issue #48** (`post-deploy-checks.md`, `metrics-readiness.md`, live Cloud Run verification); peer reviewer of **Issue #47** (PR #50, caught `BookingModal` 60m cutoff P2). |
| **Phirada Lekpaeng** | `@lephirada` | Primary owner of **Issue #47** (TDD RED/GREEN implementation of `BR-01`, `BR-04`, `BR-11`, `BR-12`, Prisma pricing migration/backfill, PR #50 & Release PR #51 `v0.1.2-lab7`); peer reviewer of **Issue #45** (PR #49) and **Issue #48**. |

---

### D.6 Known Limitations

1. **Deferred Sprint 3 Features:** Self-Registration (`F-11`, currently in open PR #54), Room Management CRUD (`F-12`), Utilization Reports (`F-13`), and CORS hardening (`F-14` / `TD-01`) are intentionally outside Sprint 1/Lab 7 scope and scheduled for Deliverable 2/Final Release.
2. **Demo Account Model:** Production authentication relies on seeded synthetic accounts (`customer1`, `customer2`, `staff`) managed via GCP Secret Manager; no real payment gateway or email/SMS notification service is integrated.
3. **Single-Region Demo Sizing:** Cloud Run and Cloud SQL run on minimal single-region (`asia-southeast1`) course-budget tiers without multi-region failover or load-test autoscaling guarantees.
