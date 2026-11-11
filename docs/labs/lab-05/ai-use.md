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
- **Outcome:** 100% alignment with course rubric and instructor guidelines. All automated tests, typechecks, and Markdown structural checks passed cleanly.

#### 9. Final Pre-Freeze Review Refinements (C-01 Verification PR, Smoke Test Single-Source, C-05 Concrete Restart Proof)
- **Prompt Intent:** Resolve 3 final pre-freeze review items identified by @lephirada:
  1. **C-01 Alignment:** Aligned `submission-checklist.md` Part 1 with Task 4 to designate the post-bootstrap verification PR targeting `main` as official C-01 proof, with staging feature PR as audit trail.
  2. **Task 7 Smoke Test Single-Source:** Added condition `if: inputs.image_tag == ''` to workflow smoke test step in `.github/workflows/deploy.yml` so automated release executes workflow step while manual rollback executes within `deploy/release.sh`, eliminating duplicate smoke tests.
  3. **C-05 Concrete Instance Restart Evidence:** Specified concrete restart evidence across `deployment.md` Section 6.1.1, `github-issues-guide.md` Task 8, and `submission-checklist.md` Part 3 (Cloud Run metrics instance count dropping to 0 + cold-start container startup log in Logs Explorer, or local compose container ID change `ID A != ID B`), proving fresh instance recreation before retrieving data from PostgreSQL.
- **Tools Used:** `read_file`, `edit_file`, `run_command` (Node.js Markdown fence validator, `git diff --check`, `npm run typecheck`, `npm run test:client`).
- **Outcome:** All 3 items resolved. 0 typecheck errors, 12/12 passing tests, and 100% code fence balance.
