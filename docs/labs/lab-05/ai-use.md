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









