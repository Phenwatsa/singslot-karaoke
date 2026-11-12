# Lab 5 Authoritative Test Execution Logs & Verification Evidence

## Project: SingSlot — Karaoke Room Reservation & Management System

**Course:** CPE 334 Introduction to Software Engineering in the Age of AI Agents  
**Target:** Lab 5 (Cloud Deployment & CI/CD Pipeline)  
**Document Status:** Working Evidence Log  
**Last Updated:** 2026-11-12  
**Repository:** `https://github.com/Phenwatsa/singslot-karaoke`  

---

## 1. Lab 5 Requirements & Required Checks Traceability Matrix

| Requirement / Check ID | Scope | Verification Target | Verification Method | Status |
|---|---|---|---|---|
| **R-02 / Task 2** | Dynamic Port & Host Binding | `server/src/server.ts` | Static & dynamic test: `PORT` from env, default 8080 (prod) / 5001 (dev), host `0.0.0.0` | **PASS** |
| **R-02 / Task 2** | Readiness Probe Endpoint | `server/src/app.ts` | Dynamic mock test: `GET /api/ready` returns 200/503 | **PASS** |
| **R-02 / Task 2** | Single-Flight Coalescing | `server/src/app.ts` | Concurrent probe deduplication test (shared in-flight driver query) | **PASS** |
| **R-02 / Task 2** | Probe Timeout & Pending Query Preservation | `server/src/app.ts` | 3000ms bounded timeout test with pending driver query protection | **PASS** |
| **R-02 / Task 2** | Zombie Query Recovery | `server/src/app.ts` | Hard stale TTL unblocks `activeDbCheck`, allowing clean recovery to 200 | **PASS** |
| **R-02 / Task 2** | Zero Hardcoded Passwords | `server/prisma/seed.ts` | Fail-fast env check for `STAFF_PASSWORD`, `CUSTOMER_PASSWORD` | **PASS** |
| **R-02 / Task 2** | Client Dev-Only Quick Fill | `client/src/components/auth/LoginModal.tsx` | `import.meta.env.DEV` isolation & `VITE_STAFF_DEMO_PASSWORD` / `VITE_CUSTOMER_DEMO_PASSWORD` env bindings | **PASS** |
| **Quality Gate** | TypeScript Type Safety | Client & Server workspaces | `npm run typecheck` (tsc `--noEmit` across both workspaces) | **PASS** |
| **C-03 / R-01 (Task 3)** | Docker & Compose Fresh Clone | `Dockerfile`, `docker-compose.yml` | `npm ci`, `docker compose up --build -d`, `GET /api/ready` | *Pending Task 3* |
| **C-01 / R-05 (Task 4)** | CI Pipeline Execution | `.github/workflows/ci-docker.yml` | GitHub Actions workflow execution on PR targeting `main` | *Pending Task 4* |
| **C-02 / R-06 (Task 6)** | Blocked Merge on Failed Check | Branch ruleset `protect-main` | Temporary failing PR `test/prove-gate` showing blocked merge | *Pending Task 6* |
| **C-04 / R-03 (Task 5, 6)** | End-to-End Cloud Run Workflow | Public Cloud Run URL | Login, room selection, slot booking, business rule rejection | *Pending Task 5/6* |
| **C-05 / R-04 (Task 8)** | Data Persistence on Restart | Cloud Run & Cloud SQL | Scale-to-zero restart & redeploy with booking intact | *Pending Task 8* |
| **C-06 / R-07 (Task 7)** | Repeatable Automated Release | `.github/workflows/deploy.yml` | UI string update PR to `main` auto-deploys revision 2 | *Pending Task 7* |

---

## 2. Task 2 Test Execution Evidence: Readiness Probe & Cloud Readiness Contracts

### 2.1 Server Readiness Probe Test Suite (`server/tests/ready.test.ts`)

Command executed on branch `feat/lab5-cloud-ready`:

```bash
$ npm --prefix server test tests/ready.test.ts
```

#### Raw Output:

```
> singslot-server@1.0.0 test
> jest --runInBand --detectOpenHandles --forceExit tests/ready.test.ts

PASS tests/ready.test.ts (10.335 s)
  Readiness Probe Endpoint (/api/ready) & Cloud Readiness Contracts (R-02, R-04)
    Twelve-Factor Configuration & Static Analysis Verification
      ✓ server.ts binds PORT dynamically from process.env.PORT and binds to 0.0.0.0 (2 ms)
      ✓ prisma/seed.ts reads STAFF_PASSWORD and CUSTOMER_PASSWORD from env and has zero hardcoded passwords (1 ms)
      ✓ .env.example documents STAFF_PASSWORD and CUSTOMER_PASSWORD placeholders with zero secrets (1 ms)
      ✓ client LoginModal.tsx supports role-specific demo passwords and restricts quick-fill to development mode (1 ms)
    Readiness Probe Dynamic Execution Contract
      ✓ returns HTTP 200 { status: "ready", db: "connected" } when database query succeeds (4 ms)
      ✓ returns HTTP 503 { status: "not_ready", error: "Database unreachable" } when database query fails (1 ms)
      ✓ returns HTTP 503 within bounded timeout when database query exceeds 3000ms (3003 ms)
      ✓ deduplicates concurrent probes via single-flight activeDbCheck to prevent connection pool exhaustion (105 ms)
      ✓ prevents query accumulation when first probe times out while query is still pending (3008 ms)
      ✓ recovers cleanly and returns HTTP 200 on subsequent probe when underlying database recovers after zombie query (3213 ms)

Test Suites: 1 passed, 1 total
Tests:       10 passed, 10 total
Snapshots:   0 total
Time:        10.534 s
Ran all test suites matching /tests\/ready.test.ts/i.
✔ Exited with code 0
```

---

### 2.2 Monorepo TypeScript Compilation Verification

Command executed:

```bash
$ npm run typecheck
```

#### Raw Output:

```
> singslot-karaoke@1.0.0 typecheck
> npm --prefix server run typecheck && npm --prefix client run typecheck


> singslot-server@1.0.0 typecheck
> tsc --noEmit


> singslot-client@1.0.0 typecheck
> tsc --noEmit

✔ Exited with code 0
```

---

## 3. Task 3 Verification Evidence: Docker & Local Compose (C-03 / R-01)
<!-- To be populated during Task 3 execution -->

- **Clean Clone Command:** 
- **Build & Up Command:** `docker compose up --build -d`
- **Readiness Probe Response:** `curl -f http://localhost:8080/api/ready`
- **Output Log:**

---

## 4. Task 4 Verification Evidence: CI Pipeline Execution (C-01 / R-05)
<!-- To be populated during Task 4 execution -->

- **PR Target:** `main`
- **Workflow Run Link:** 
- **Execution Summary:** 

---

## 5. Task 6 Verification Evidence: Blocked Merge Proof (C-02 / R-06)
<!-- To be populated during Task 6 execution -->

- **Branch:** `test/prove-gate`
- **PR Link:** 
- **Failed Status Check:** `test-and-docker`
- **Merge Button State:** Blocked (Screenshot referenced in Submission Checklist)

---

## 6. Task 5/6 Verification Evidence: Live Cloud Run Workflow (C-04 / R-03)
<!-- To be populated during Task 5/6 execution -->

- **Public URL:** 
- **Active Commit SHA:** 
- **Login Verification:**
- **Booking Creation Verification:**
- **Business Rule Rejection Verification:**

---

## 7. Task 8 Verification Evidence: Data Persistence on Restart & Redeploy (C-05 / R-04)
<!-- To be populated during Task 8 execution -->

- **Booking Code / Record:**
- **Scale-to-Zero Container Recycle Proof:**
- **Redeployment Intact Verification:**

---

## 8. Task 7 Verification Evidence: Repeatable Release Pipeline (C-06 / R-07, R-08)
<!-- To be populated during Task 7 execution -->

- **UI Update PR:**
- **Commit SHA:**
- **Automated Deployment Run Link:**
- **Live URL Verification:**
