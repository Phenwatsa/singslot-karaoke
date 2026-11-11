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

#### 6. Raw Bash Regex Verification & Syntax Execution Validation
- **Prompt Intent:** Perform rigorous verification of the raw Bash regex in `docs/labs/lab-05/deployment.md` Section 6.1 and `docs/github-issues-guide.md` Task 8 per @lephirada's request:
  1. Performed raw hex dump inspection (`xxd`) verifying the exact byte sequence `20 3d 7e 20` (` =~ `) and `5c 2e` (`\.`), confirming zero accidental backslashes (`=\~` or `\\.`) in the raw Markdown source.
  2. Executed `bash -n` on extracted script snippets from both documents (exit code 0).
  3. Authored and executed an automated Bash test suite testing valid digests vs. invalid formats (tags, truncated digests, uppercase characters, wrong regions, non-GCP URLs) confirming 100% regex discrimination.
- **Tools Used:** `run_command` (`xxd`, `sed`, `bash -n`, `bash`).
- **Outcome:** Proven 100% syntactically and logically valid Bash regex in the raw files.








