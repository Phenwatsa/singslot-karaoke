# Lab 5 AI Usage & Governance Log

## Project: SingSlot — Cloud Deployment & CI/CD Pipeline on Google Cloud Platform

**Course:** CPE 334 Introduction to Software Engineering in the Age of AI Agents (1/2026)  
**Deliverable:** Lab 5 — Google Cloud Platform Deployment  
**AI Assistant:** Antigravity (Google DeepMind Advanced Agentic Coding)

---

### Session Log: 11 November 2026

#### 1. Master Plan & GitHub Issues Specification Alignment

- **Prompt Intent:** Refine and finalize Lab 5 Master Plan and GitHub Issues Specification (`docs/github-issues-guide.md` Section 4) and Runbook (`docs/labs/lab-05/deployment.md`) based on peer review feedback from `@lephirada`'s AI reviewer, addressing 4 Must-Fix points: parameterizing `$REGION` in Task 5, extending Task 3 container Prisma verification, completing Task 7 12-step YAML workflow, and balancing all outer Markdown code fences.
- **Tools Used:** `read_file`, `edit_file`, `run_command` (Node.js Markdown fence validator, `npm run typecheck`, `npm run test:client`).
- **Outcome:** All 4 Must-Fix points resolved with zero TypeScript compilation errors and 12/12 passing client tests.

#### 2. Targeted Final Corrections (Task 3 Entrypoint & Task 7 Fail-Fast Digest Validation)

- **Prompt Intent:** Implement targeted corrections per @lephirada's review:
  1. Task 7: Replace fallback digest extraction with strict regex validation (`@sha256:[0-9a-f]{64}$`), failing the workflow immediately if the deployed image is not pinned to a valid SHA-256 immutable digest.
  2. Task 3: Specify `--entrypoint node` in Docker verification command (`docker run --rm --entrypoint node singslot-app -e ...`) to ensure deterministic execution independent of Dockerfile ENTRYPOINT.
  3. Validate full Markdown fence balance across Tasks 1–8.
- **Tools Used:** `read_file`, `edit_file`, `run_command` (Node.js Markdown fence validator, `npm run typecheck`, `npm run test:client`).
- **Outcome:** Perfect fence balance across all Tasks (0 unclosed blocks). Fail-fast immutable digest validation implemented in Release Summary. Deterministic container verification command configured with `--entrypoint node`. Typecheck passed with 0 errors; client tests passed 12/12.

#### 5. Runbook Final Polish & Schema Compatibility Alignment

- **Prompt Intent:** Apply minor refinements to `docs/labs/lab-05/deployment.md`:
  1. Section 1: Updated Secret Manager scope description to include "application credentials" alongside connection strings and cryptographic keys.
  2. Section 6.1: Verified Raw Bash Regex (`^asia-southeast1-docker\.pkg\.dev/[^/]+/singslot/singslot@sha256:[0-9a-f]{64}$`) is completely valid with single backslash escape.
  3. Section 6.2: Refined warning to emphasize backward compatibility and non-destructive schema evolution during container rollbacks.
- **Tools Used:** `read_file`, `edit_file`, `run_command` (Node.js Markdown fence validator, `npm run typecheck`, `npm run test:client`).
- **Outcome:** Clean validation, perfect fence balance, 0 typecheck errors, 12/12 passing tests.

#### 7. Peer Review Refinements (Task 4 Target, Anchors, npm ci, and Rollback Checklist)

- **Prompt Intent:** Resolve 5 actionable peer review items identified by @lephirada:
  1. Clarified Task 4 PR Target in `docs/github-issues-guide.md` Table 4.1 (`feat/lab5-ci → sprint-1-staging (Feature PR) → main (Release PR)`).
  2. Fixed GitHub Markdown slug anchor links in `docs/ai-use.md` and `docs/labs/lab-05/submission-checklist.md` pointing to `#4-lab-5-cloud-deployment--cicd-pipeline-tasks-1-to-8`.
  3. Harmonized Runbook Section 3.1 dependencies install command to feature `npm ci` for lockfile reproducibility alongside `npm run install:all`.
  4. Expanded `docs/labs/lab-05/submission-checklist.md` Part 3 with explicit Cloud Run migration job execution evidence items.
  5. Expanded `docs/labs/lab-05/submission-checklist.md` Part 4 with detailed verification checklists for Automated Release 2, Container Rollback to Release 1, and Roll-forward to Release 2.
- **Tools Used:** `read_file`, `edit_file`, `run_command` (Node.js Markdown fence validator, `git diff --check`, `npm run typecheck`, `npm run test:client`).
- **Outcome:** All 5 items resolved with zero warnings. 100% clean validation across all suites.

#### 8. Instructor Handout & Rubric Alignment (R-01 to R-12, C-01 to C-06, Answer Parts 0 to 4)

- **Prompt Intent:** Evaluate and incorporate all 7 findings from teammate @lephirada's comparison of Lab 5 planning files against the instructor's Lab 5 Handout (`01_SE_Lab_5_updated.pdf`) and Student Guide V1.1:
  1. **R-09 (Project Board Evidence):** Added GitHub Project Board URL and lifecycle column progression checklist (`Backlog`, `Specified`, `Started`, `PR Review`, `Done`) in `submission-checklist.md` Part 0 and `github-issues-guide.md` Section 4.
  2. **R-10 (History & CI Preservation):** Added explicit rules in `github-issues-guide.md` Section 4 and Task 6 AC prohibiting deletion/rewrite of Git/CI history and requiring the `protect-main` ruleset to remain active post-submission.
  3. **R-11 (Team Participation Protocol):** Added Team Participation Protocol clause in `github-issues-guide.md` Section 4.1 defining active participation for both members across all phases.
  4. **C-03 (Docker Evidence Alignment):** Expanded Task 3 Evidence Required for PDF in `github-issues-guide.md` to enumerate clean clone build terminal output, running container with PostgreSQL in `docker-compose`, `/api/ready` HTTP 200, `.env.example`, and `deployment.md` secret audit.
  5. **C-05 (Restart vs Redeployment):** Separated data persistence checks into container instance restart / process recycling and Cloud Run revision redeployment (identical digest + 100% traffic shift) across `deployment.md` Section 6.1, `github-issues-guide.md` Task 8, and `submission-checklist.md` Part 3.
  6. **C-06 (Dedicated Issue for Release Proof):** Added requirement in Task 7 and checklist Part 4 to track the visible UI change for repeatable release proof via a dedicated GitHub Issue with label `lab5`.
  7. **R-02 & Heading Alignment:** Added `CLIENT_DIST_PATH` and `TZ` (`Asia/Bangkok`) to `deployment.md` Section 2, clarified that `STAFF_PASSWORD` is scoped exclusively to the migration job, and aligned checklist section headings to instructor's exact `Answer Part 0` to `Answer Part 4`.
- **Tools Used:** `read_file`, `edit_file`, `run_command` (Node.js Markdown fence validator, `git diff --check`, `npm run typecheck`, `npm run test:client`).
- **Outcome:** Comprehensive progress toward full course rubric and instructor guidelines alignment; submitted for peer review.

#### 9. Final Pre-Freeze Review Refinements (C-01 Verification PR, Smoke Test Single-Source, C-05 Concrete Restart Proof)

- **Prompt Intent:** Resolve 3 final pre-freeze review items identified by @lephirada:
  1. **C-01 Alignment:** Aligned `submission-checklist.md` Part 1 with Task 4 to designate the post-bootstrap verification PR targeting `main` as official C-01 proof, with staging feature PR as audit trail.
  2. **Task 7 Smoke Test Single-Source:** Added condition `if: inputs.image_tag == ''` to workflow smoke test step in `.github/workflows/deploy.yml` so automated release executes workflow step while manual rollback executes within `deploy/release.sh`, eliminating duplicate smoke tests.
  3. **C-05 Concrete Instance Restart Evidence:** Specified concrete restart evidence across `deployment.md` Section 6.1.1, `github-issues-guide.md` Task 8, and `submission-checklist.md` Part 3 (Cloud Run metrics instance count dropping to 0 + cold-start container startup log in Logs Explorer, or local compose container ID change `ID A != ID B`), proving fresh instance recreation before retrieving data from PostgreSQL.
- **Tools Used:** `read_file`, `edit_file`, `run_command` (Node.js Markdown fence validator, `git diff --check`, `npm run typecheck`, `npm run test:client`).
- **Outcome:** Targeted refinements applied cleanly across all documents.

#### 10. Comprehensive Lab 5 Master Baseline Freeze Alignment
- **Prompt Intent:** Resolve all 9 items from @lephirada's comprehensive review:
  1. **Task 6 Dependency Phasing:** Structured Task 6 into Phase 6A (WIF Pool/Provider, Deployer SA, Environment `demo`, Ruleset `protect-main`, and C-02 failing PR proof - runnable in parallel with Task 5) and Phase 6B (Binding Service Account User on `singslot-runner` and `singslot-migrator` after Task 5 creates them).
  2. **Task 7 Workflow SERVICE_URL Robustness:** Dynamically resolved `SERVICE_URL` directly from Cloud Run inside `Generate Release Summary` step, ensuring `SERVICE_URL` is populated accurately in both automated and manual release paths.
  3. **Task 1 GCP Free Trial Governance:** Added explicit rules (personal Gmail never used before, no `@mail.kmutt.ac.th`, one project reused through Lab 5–7 and Final Project, no prepayment, no Upgrade button).
  4. **Task 2 Cloud Readiness & Demo Safety:** Implemented Student Guide Episode 2.2 six-point cloud-readiness checklist; eliminated hardcoded fallback passwords from code; credentials sourced strictly from `.env` locally and Secret Manager in production; demo helpers safe on UI.
  5. **Task 3 / C-03 Fresh Clone Lifecycle:** Detailed complete reproducible clone, install (`npm ci`), `.env` template configuration, build, compose run, `/api/ready` 200, and UI verification.
  6. **Task 4 Bootstrap Local Tests:** Specified running full suite (typecheck, server tests, client tests, migration/seed, docker build, deploy script offline checks) before merging initial bootstrap PR.
  7. **R-09 & R-12 Team Workflow:** Documented substantive peer review requirement (specific check/finding/reason stated) and repository public mandate until grading concludes.
  8. **Part 4 & Task 8 Scope Demarcation:** Formally separated Required Part 4 Evidence (15 Points for C-06 Repeatable Release) from Optional Recommended Verification (Episode 8 Rollback/Roll-forward); acknowledged Step 9 for final documentation and LEB2 PDF report.
  9. **AI Safety Governance (Lab Sheet Section 9):** Enforced strict human review of all proposed gcloud/console commands before execution; zero AI autonomous modification of billing, IAM, or databases; and zero secrets pasted into AI chats.
- **Tools Used:** `read_file`, `edit_file`, `run_command` (Node.js Markdown fence validator, `git diff --check`, `npm run typecheck`, `npm run test:client`).
- **Outcome:** 100% complete, verifiable, and unified baseline across all planning artifacts, ready for execution.

#### 11. Rollback Decoupling & C-05 Cloud Run Primacy Harmonization
- **Prompt Intent:** Resolve 5 legacy phrasing conflicts identified by @lephirada to strictly decouple the mandatory automated release path (C-06) and persistence requirement (C-05) from optional rollback practices:
  1. **Task 7 Acceptance Criteria (`github-issues-guide.md`):** Updated `deploy.yml` criteria to require automated release upon push to `main` (C-06), annotating `workflow_dispatch` manual rollback/roll-forward as an optional recommended practice (Student Guide Episode 8).
  2. **Task 8 Dependencies (`github-issues-guide.md`):** Replaced dependency on 2 deployed releases with `Task 5 (Requires running Cloud Run service and Cloud SQL database); Task 7 for release verification (C-06)`, unblocking C-05 persistence verification on Release 1.
  3. **Task 8 In-Scope (`github-issues-guide.md`):** Explicitly grouped rollback and roll-forward execution under `[Optional Recommended Practice - Student Guide Episode 8] Container Rollback & Roll-forward Verification`.
  4. **Task 8 Evidence Required (`github-issues-guide.md`):** Clearly separated Required Evidence (Part 3 C-05 Persistence on Cloud Run + Part 4 C-06 Repeatable Release) from Optional Evidence (Episode 8 Rollback/Roll-forward screenshots).
  5. **`deployment.md` §6.2 Rollback Section:** Added `[Optional Recommended Practice - Student Guide Episode 8]` to heading with an explicit Callout note clarifying that rollback is a non-scored reliability practice per Lab Sheet Section 5 and Figure 1.
- **Tools Used:** `read_file`, `edit_file`, `run_command` (Node.js Markdown fence validator, `git diff --check`, `npm run typecheck`, `npm run test:client`).
- **Outcome:** Complete alignment across all files, fully eliminating ambiguity between graded requirements and optional practices.

#### 12. Task 1 GCP Billing Currency & Notification Channel Verification Alignment
- **Prompt Intent:** Refine Task 1 specification in `docs/github-issues-guide.md` based on @lephirada's review:
  1. **Billing Currency Neutrality:** Adjusted budget target description to explicitly allow local billing currency equivalent (e.g. ฿8,500 THB matching ~$250 USD) and recording of the exact currency upon creation, harmonizing issue spec with actual GCP Console THB display.
  2. **Notification Channel Verification:** Added explicit Acceptance Criteria item requiring confirmation of budget notification channels linked to both members' Gmail accounts to be recorded in the GitHub Issue comment.
  3. **Project Reuse & Conciseness:** Retained project reuse mandate (Lab 5–7 and Final Project) while streamlining acceptance criteria.
- **Tools Used:** `read_file`, `edit_file`, `run_command` (Node.js Markdown fence validator, `git diff --check`, `npm run typecheck`, `npm run test:client`).
- **Outcome:** Task 1 specification accurately reflects team's active GCP setup (THB currency) and verifies dual-member notifications.

#### 13. Task 7 & Task 8 Granular Rollback Tagging Harmonization
- **Prompt Intent:** Resolve 2 remaining granular rollback alignment points identified by @lephirada:
  1. **Task 7 Acceptance Criteria (`github-issues-guide.md`):** Tagged `deploy/release.sh` input handling and rollback smoke testing with `[Optional Recommended Practice - Episode 8]`, keeping automated release smoke testing strictly required. Added optional tag to Artifact Registry image retention.
  2. **Task 8 Acceptance Criteria (`github-issues-guide.md`):** Nested the unlabelled criteria `Zero destructive database operations executed during rollback` under `[Optional Recommended Practice - Student Guide Episode 8] Container Rollback & Roll-forward Verification`.
- **Tools Used:** `read_file`, `edit_file`, `run_command` (Node.js Markdown fence validator, `git diff --check`, `npm run typecheck`, `npm run test:client`).
- **Outcome:** 100% granular decoupling between mandatory release/persistence paths and optional rollback procedures.

#### 14. Task 7 In-Scope Workflow Dispatch Optional Tagging Harmonization
- **Prompt Intent:** Align Task 7 In-Scope workflow examples and execution logic with Acceptance Criteria:
  1. Annotated `workflow_dispatch`, `Validate manual image tag`, and `Execute rollback or roll-forward` steps in `.github/workflows/deploy.yml` YAML with `[Optional Recommended Practice - Student Guide Episode 8]`.
  2. Annotated `If image_tag is provided` conditional execution logic bullet with `[Optional Recommended Practice - Student Guide Episode 8]`.
- **Tools Used:** `read_file`, `edit_file`, `run_command` (Node.js Markdown fence validator, `git diff --check`, `npm run typecheck`, `npm run test:client`).
- **Outcome:** Total consistency across In-Scope workflow templates and Acceptance Criteria.

#### 15. Task 2 Implementation: Cloud-Ready Application Architecture & Resilient Readiness Probe
- **Prompt Intent:** Implement Task 2 cloud-readiness specifications on branch `feat/lab5-cloud-ready` adhering to Twelve-Factor configuration, Student Guide Episode 2, and team security requirements (Option B):
  1. **Dynamic Port & Host Binding (`server/src/server.ts`):** Bound Express port to `Number(process.env.PORT) || 8080` and host strictly to `0.0.0.0` for Cloud Run container routing, retaining fail-fast JWT secret check.
  2. **Readiness Probe Endpoint (`server/src/app.ts`):** Implemented `GET /api/ready` executing `prisma.$queryRaw` `SELECT 1` via shared Prisma instance, with single-flight request coalescing bound strictly to the underlying Prisma driver query (cleared only when the driver query settles), per-request 3000ms bounded timeout, and strict error/credential masking returning `{ status: "ready", db: "connected" }` or `{ status: "not_ready", error: "Database unreachable" }`.
  3. **Role-Separated Environment Passwords (`server/prisma/seed.ts`):** Eliminated all hardcoded passwords; required `STAFF_PASSWORD` (for staff demo) and `CUSTOMER_PASSWORD` (for customer demo) from environment with fail-fast validation.
  4. **Client Quick-Fill Dev Isolation (`client/src/components/auth/LoginModal.tsx`):** Bound demo password to `import.meta.env.VITE_DEMO_PASSWORD` and restricted quick-fill helper rendering strictly to development mode (`import.meta.env.DEV`), eliminating demo shortcuts from production bundles.
  5. **Environment Templates (`.env.example`):** Added comprehensive placeholders in `server/.env.example` and created `client/.env.example` (both `.env` files verified ignored by Git).
  6. **Automated Testing & Quality Gates:** Authored 9 test cases in `server/tests/ready.test.ts` (100% passing) including verification that subsequent probes do not spawn new queries while a previous timed-out query is still pending in the driver, verified `npm run typecheck` across client/server (0 errors), `npm run test:client` (12/12 passing), and production builds.
- **Tools Used:** `read_file`, `write_file`, `edit_file`, `run_command` (`git status`, `git diff --check`, `npm run typecheck`, `npm run test:client`, `npm --prefix server test tests/ready.test.ts`, `npm run build`).
- **Outcome:** Clean, robust cloud-ready codebase ready for PR review and merge into `sprint-1-staging`.

#### 16. VS Code Test Runner Type Resolution Alignment in `ready.test.ts`
- **Prompt Intent:** Resolve 57 TypeScript diagnostic errors (`ts(2304) Cannot find name 'expect' / 'it' / 'describe' / 'jest'`) surfaced in VS Code Problems panel when opening `server/tests/ready.test.ts`:
  1. **Root Cause Identification:** `server/tsconfig.json` excludes the `tests` directory so that compilation for `dist/` is isolated to `src/`. When test files are opened in VS Code's editor outside of `server/tests/tsconfig.json` context, test runner globals are not automatically in scope without explicit imports.
  2. **Resolution:** Added `/// <reference types="jest" />` and explicit imports `import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';` to `server/tests/ready.test.ts`, matching existing conventions in `booking.test.ts`, `conflict.test.ts`, and `views.test.ts`. Adjusted Prisma mock types with explicit generics to satisfy strict TypeScript definitions.
  3. **Verification:** Executed `npm --prefix server test tests/ready.test.ts` (9/9 passed in 7.158s), `npm run typecheck` across server and client (0 errors), and verified clean diagnostics.
- **Tools Used:** `read_file`, `edit_file`, `run_command` (`tsc --noEmit -p server/tests/tsconfig.json`, `npm --prefix server test tests/ready.test.ts`, `npm run typecheck`, `npm --prefix client test`, `git status`).
- **Outcome:** Zero TypeScript errors in both VS Code Problems panel and automated CI typechecks.

#### 17. Lab 5 Reviewer Record & Test Evidence Documentation Scaffolding
- **Prompt Intent:** Scaffold `docs/labs/lab-05/reviewer.md` and `docs/labs/lab-05/tests.md` aligned strictly with Lab 5 scope and team specifications:
  1. **`reviewer.md` Skeleton Scaffolding:** Provided a neutral structural skeleton for peer review tracking across Tasks 1 through 8 (and Step 9) matching `docs/github-issues-guide.md` (§4.1 Master Allocation Matrix). Stripped all simulated discussion, dialogue, and approval comments so that team members (@Phenwatsa and @lephirada) author their own review notes and verdicts directly.
  2. **`tests.md` Lab 5 Alignment:** Replaced previous Sprint 1 test traces (`AC-02`, `AC-07`, `layout.test.mjs`) with Lab 5 requirements (`R-01` to `R-12`) and Required Checks (`C-01` to `C-06`). Captured raw verification logs for Task 2 (`ready.test.ts` 9/9 passed, `npm run typecheck` 0 errors), and added structured evidence placeholders for Tasks 3–8.
- **Tools Used:** `read_file`, `write_file`, `edit_file`, `run_command` (`git status`).
- **Outcome:** Clean, accurate documentation templates for Lab 5 peer reviews and test evidence.

#### 18. Task 2 Peer Review Findings Resolution (PR #22 Feedback)
- **Prompt Intent:** Resolve 3 substantive peer review findings raised on PR #22 (`feat/lab5-cloud-ready`):
  1. **Development & Production Port Configuration Alignment:** Updated `server/src/server.ts` to set `DEFAULT_PORT = process.env.NODE_ENV === 'production' ? 8080 : 5001` so local development preserves port 5001 (matching Vite proxy) while production defaults to 8080. Updated `client/vite.config.ts` to proxy to `process.env.VITE_API_URL || 'http://localhost:5001'`.
  2. **Zombie Query Recovery & Max Stale TTL:** In `server/src/app.ts`, implemented a hard stale TTL ceiling (`READINESS_STALE_TTL_MS`, default 5000ms) that unblocks and resets `activeDbCheck` if the underlying driver query stalls indefinitely, preventing permanent 503 lockout and allowing immediate recovery when the database returns. Added a 10th automated test in `server/tests/ready.test.ts` verifying clean recovery to HTTP 200 after a zombie query.
  3. **Role-Specific Demo Password Consistency:** Updated `client/src/components/auth/LoginModal.tsx` to read `VITE_STAFF_DEMO_PASSWORD` for staff and `VITE_CUSTOMER_DEMO_PASSWORD` for customer quick-fill, while maintaining `VITE_DEMO_PASSWORD` as shared fallback. Updated `client/.env.example` and `client/tests/layout.test.mjs`.
- **Tools Used:** `read_file`, `edit_file`, `run_command` (`npm --prefix server test tests/ready.test.ts`, `npm run typecheck`, `npm --prefix client test`, `git diff --check`, `git status`).
- **Outcome:** 10/10 tests passed in `ready.test.ts`, 12/12 passed in `layout.test.mjs`, and 0 typecheck errors, completely resolving all peer review findings.

#### 19. Task 2 Follow-Up Peer Review Resolution (PR #22 Round 2)
- **Prompt Intent:** Resolve 2 specific edge-case and environment findings raised in the second review round of PR #22:
  1. **Local Development Port in `.env.example`:** Changed `PORT=8080` to `PORT=5001` in `server/.env.example` with clear documentation so copying `.env.example` to `.env` immediately aligns with the client Vite proxy (`http://localhost:5001`), while Cloud Run automatically injects `PORT=8080` in production.
  2. **Promise Identity Concurrency Guard (`server/src/app.ts`):** Prevented an asynchronous race condition where a late-settling stale query's `.finally()` callback could clobber a newly active probe query's state or cancel its timeout timer. Implemented an identity guard `if (activeDbCheck === checkPromise)` ensuring only the currently active query can clear global state.
  3. **Concurrency Test Verification (`server/tests/ready.test.ts`):** Authored Test #11 explicitly reproducing a late-settling stale query while a subsequent probe query is in-flight, and asserting that single-flight coalescing and timer management remain 100% intact.
- **Tools Used:** `read_file`, `edit_file`, `run_command` (`npm --prefix server test tests/ready.test.ts`, `npm run typecheck`, `npm --prefix client test`, `git diff --check`, `git status`).
- **Outcome:** 11/11 tests passed in `ready.test.ts`, 12/12 passed in `layout.test.mjs`, 0 typecheck errors, and robust concurrency safety.

#### 20. Final Cloud-Readiness & Strict Lifecycle Concurrency Finalization (PR #22 Round 3)
- **Prompt Intent:** Conclusively resolve all remaining peer review blocking points and verification gaps:
  1. **Strict Query Lifecycle & Zero Query Accumulation (`server/src/app.ts`):** Removed artificial application-level TTL unblocking of in-flight checks. Bound `activeDbCheck` strictly to the underlying database driver query lifecycle with identity validation (`if (activeDbCheck === checkPromise)`), ensuring subsequent probes arriving across multiple timeout intervals coalesce into the existing in-flight query without spawning duplicate queries.
  2. **Zero Query Accumulation Regression Test (`server/tests/ready.test.ts`):** Added a regression test proving that multiple consecutive probe timeouts while a database query is pending result in exactly 1 query sent to PostgreSQL, and that upon driver query settlement, subsequent probes immediately create a fresh query and recover to HTTP 200.
  3. **Explicit Six-Point Checklist Verification Suite:** Added static analysis assertions in `server/tests/ready.test.ts` for Checklist Item 1 (Uploaded Files Isolation: zero file upload dependencies `multer`/`busboy`/`formidable` and zero local container storage) and Checklist Item 4 (Stateless Session Management: strictly signed stateless JWT verification without session memory stores).
- **Tools Used:** `read_file`, `edit_file`, `run_command` (`npm --prefix server test tests/ready.test.ts`, `npm run typecheck`, `npm --prefix client test`, `git diff --check`, `git status`).
- **Outcome:** 12/12 tests passed in `ready.test.ts`, 12/12 passed in `layout.test.mjs`, 0 typecheck errors, and 100% full compliance with all six cloud-readiness checklist items.
