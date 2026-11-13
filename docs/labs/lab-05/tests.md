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
| **R-02 / Task 2** | Checklist 1: Uploaded Files Isolation | `server/package.json`, `server/src/app.ts` | Static analysis: zero file upload middleware (`multer`, etc.) and zero local storage | **PASS** |
| **R-02 / Task 2** | Checklist 2: Production-Safe Seed & Idempotency | `server/prisma/seed.ts` | Static analysis: env passwords (`STAFF_PASSWORD`, `CUSTOMER_PASSWORD`), zero secrets, idempotent | **PASS** |
| **R-02 / Task 2** | Checklist 3: No Dev Shortcuts in Production | `client/src/components/auth/LoginModal.tsx` | Static analysis: quick-fill isolated strictly to `import.meta.env.DEV`, role-specific passwords | **PASS** |
| **R-02 / Task 2** | Checklist 4: Stateless Session Management | `server/src/middlewares/auth.ts` | Static analysis: stateless signed JWT verification, zero memory session store | **PASS** |
| **R-02 / Task 2** | Checklist 5: Dynamic Port & Host Binding | `server/src/server.ts`, `.env.example` | Static analysis: `PORT` from env (5001 dev / 8080 prod), host `0.0.0.0` | **PASS** |
| **R-02 / Task 2** | Checklist 6: Readiness Probe Endpoint | `server/src/app.ts` | Dynamic mock test: `GET /api/ready` returns 200 (connected) / 503 (database failure) | **PASS** |
| **R-02 / Task 2** | Checklist 6: Single-Flight Coalescing | `server/src/app.ts` | Concurrent probe deduplication test (shared in-flight driver query) | **PASS** |
| **R-02 / Task 2** | Checklist 6: Zero Query Accumulation | `server/src/app.ts` | Repeated probe timeouts while database is pending guarantee exactly 1 query launched | **PASS** |
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

PASS tests/ready.test.ts (16.042 s)
  Readiness Probe Endpoint (/api/ready) & Cloud Readiness Contracts (R-02, R-04)
    Twelve-Factor Configuration & Six-Point Cloud-Readiness Static Analysis
      ✓ Checklist 1 (Uploaded Files Isolation): zero file upload dependencies and zero local container file storage (3 ms)
      ✓ Checklist 2 (Production-Safe Seed & Idempotency): reads passwords from env and implements idempotent upsert (1 ms)
      ✓ Checklist 3 (No Development Shortcuts in Production): LoginModal restricts quick-fill to development mode (1 ms)
      ✓ Checklist 4 (Stateless Session Management): relies strictly on signed JWT tokens without local session store (1 ms)
      ✓ Checklist 5 (Dynamic Port & Host Binding): server.ts reads PORT from env (5001 dev / 8080 prod) and binds to 0.0.0.0 (1 ms)
      ✓ Checklist 5b (.env.example): documents development port 5001 and password placeholders with zero secrets (1 ms)
    Readiness Probe Dynamic Execution Contract
      ✓ returns HTTP 200 { status: "ready", db: "connected" } when database query succeeds (8 ms)
      ✓ returns HTTP 503 { status: "not_ready", error: "Database unreachable" } when database query fails (1 ms)
      ✓ returns HTTP 503 within bounded timeout when database query exceeds 3000ms (3005 ms)
      ✓ deduplicates concurrent probes via single-flight activeDbCheck to prevent connection pool exhaustion (107 ms)
      ✓ prevents query accumulation when first probe times out while query is still pending (3006 ms)
      ✓ guarantees zero query accumulation across repeated probe timeouts while database query is pending, and recovers cleanly when query settles (9033 ms)

Test Suites: 1 passed, 1 total
Tests:       12 passed, 12 total
Snapshots:   0 total
Time:        16.233 s
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

### 3.1 Docker & SPA Routing Automated Contract Test Suite

Command executed:

```bash
$ npm --prefix server test tests/docker.test.ts -- --runInBand
```

#### Raw Output:

```
> singslot-server@1.0.0 test
> jest --runInBand --detectOpenHandles --forceExit tests/docker.test.ts --runInBand

PASS tests/docker.test.ts
  Task 3: Docker Containerization & SPA Routing Contracts (R-01, C-03)
    Root Dockerfile Multi-Stage Contract
      ✓ declares root Dockerfile with 3 dedicated stages (client-builder, server-builder, production) (4 ms)
      ✓ client-builder stage builds Vite frontend bundle with empty API URL for same-origin proxy (1 ms)
      ✓ server-builder stage compiles TypeScript and explicitly executes Prisma Client generation from schema (2 ms)
      ✓ production stage sets working directory to /app/server and copies both server and client artifacts (1 ms)
      ✓ production stage enforces non-root USER node and configures port 8080 and graceful entrypoint (1 ms)
      ✓ entrypoint script exists, is executable, and uses exec "$@" for PID 1 signal forwarding (1 ms)
    .dockerignore Isolation Contract
      ✓ excludes node_modules, build outputs, environment files, and version control (1 ms)
    docker-compose.yml Orchestration Contract
      ✓ defines postgres database service with healthcheck and persistent volume (1 ms)
      ✓ defines migration runner service that waits for db health and executes migrate + seed (1 ms)
      ✓ defines unified app service that waits for successful migration and exposes port 8080 (8 ms)
    SPA Routing & Unmatched /api 404 Protection Contract (app.ts)
      ✓ strictly returns JSON 404 for unmatched /api requests without swallowing into HTML (2 ms)
      ✓ strictly returns JSON 404 for unmatched /api/unknown-endpoint requests
      ✓ strictly returns JSON 404 for non-GET unmatched /api requests (1 ms)
      ✓ declares unambiguous route order where /api catch-all precedes static and SPA fallback (1 ms)
      ✓ serves SPA fallback HTML for direct navigation to frontend routes when client dist is present (4 ms)

Test Suites: 1 passed, 1 total
Tests:       15 passed, 15 total
Snapshots:   0 total
Time:        2.046 s
Ran all test suites matching /tests\/docker.test.ts/i.
✔ Exited with code 0
```

### 3.2 Production Container Build & Live Runtime Verification Evidence (C-03)

#### 3.2.0 Clean Clone Lifecycle End-to-End Verification (C-03 / R-01)

Verifies that a clean clone of the repository into an isolated directory builds and runs without any host-specific artifacts or committed secrets.

##### Step 1: Fresh Clone into Isolated Directory
```bash
$ git clone https://github.com/Phenwatsa/singslot-karaoke.git fresh-clone
$ cd fresh-clone
```
*Result:* Clean working tree cloned with 0 uncommitted files.

##### Step 2: Install Dependencies from Committed Lockfile
```bash
$ npm ci
```
*Raw Output:*
```
added 558 packages in 3s
74 packages are looking for funding
  run `npm fund` for details
✔ Exited with code 0
```

##### Step 3: Configure Environment from `.env.example` Templates (Zero Secrets)
```bash
$ cp server/.env.example server/.env
$ cp client/.env.example client/.env
```
*Note on Docker Compose Environment Interpolation:*
Docker Compose automatically reads variable interpolations (`${...}`) from a root `.env` file if present, and falls back cleanly to the built-in default values defined in `docker-compose.yml` (`POSTGRES_USER=singslot`, `DATABASE_URL=...`, `JWT_SECRET=...`, and demo passwords). Copying `server/.env.example` to `server/.env` and `client/.env.example` to `client/.env` configures isolated workspace development environments without committing secrets. If custom environment overrides are desired for Docker Compose, a root `.env` can optionally be created or environment variables exported in the shell.

##### Step 4: Build Container Images and Start Multi-Container Composition
```bash
$ docker compose up --build -d
```
*Raw Output:*
```
[+] Building 67.6s (38/38) FINISHED
 ✔ Image singslot-app:latest Built                                         67.6s
 ✔ Network fresh-clone_default Created                                      0.1s
 ✔ Volume fresh-clone_postgres_data Created                                 0.0s
 ✔ Container singslot-db Healthy                                            6.1s
 ✔ Container singslot-migrate Exited (0)                                    8.6s
 ✔ Container singslot-app Started                                           8.8s
✔ Exited with code 0
```

##### Step 5: Verify System Readiness Probe
```bash
$ curl -s -i http://localhost:8080/api/ready
```
*Raw Output:*
```
HTTP/1.1 200 OK
X-Powered-By: Express
Access-Control-Allow-Origin: *
Content-Type: application/json; charset=utf-8
Content-Length: 35
ETag: W/"23-D1kNMykUfue7IXX2BZJN51Pj3jg"
Date: Fri, 13 Nov 2026 03:23:55 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"status":"ready","db":"connected"}
✔ Exited with code 0
```

#### 3.2.1 Deterministic Container Image Build with Root Lockfile (`npm ci`)

Command executed:

```bash
$ docker build -t singslot-app .
```

Raw Build Log:

```
[+] Building 64.3s (34/34) FINISHED                        docker:desktop-linux
 => [internal] load build definition from Dockerfile                       0.0s
 => [internal] load metadata for docker.io/library/node:24-alpine          3.6s
 => [internal] load .dockerignore                                          0.0s
 => [client-builder 3/9] COPY package.json package-lock.json ./            0.0s
 => [client-builder 4/9] COPY client/package.json client/                  0.0s
 => [client-builder 5/9] COPY server/package.json server/                  0.0s
 => [client-builder 6/9] RUN npm ci                                       26.1s
 => [server-builder  4/10] COPY package.json package-lock.json ./          0.0s
 => [server-builder  5/10] COPY client/package.json client/                0.0s
 => [server-builder  6/10] COPY server/package.json server/                0.0s
 => [server-builder  7/10] RUN npm ci                                     25.1s
 => [client-builder 9/9] RUN npm run build                                 6.1s
 => [server-builder 10/10] RUN cp -r /app/node_modules /app/server/node_m  4.6s
 => [production 12/12] RUN chmod +x ./docker-entrypoint.sh                 0.2s
 => naming to docker.io/library/singslot-app:latest                         0.0s
✔ Exited with code 0
```

#### 3.2.2 Container Filesystem Structure & Prisma CLI Verification

Command executed (both tagged image `singslot-app:latest` and `docker compose run` supported):

```bash
$ docker run --rm --entrypoint sh singslot-app:latest -c \
  'test -d /app/server/dist &&
   test -f /app/server/dist/server.js &&
   test -f /app/server/prisma/schema.prisma &&
   test -f /app/client/dist/index.html &&
   ./node_modules/.bin/prisma --version'
```

Raw Output:

```
prisma                  : 5.22.0
@prisma/client          : 5.22.0
Computed binaryTarget   : linux-musl-arm64-openssl-3.0.x
Operating System        : linux
Architecture            : arm64
Node.js                 : v24.22.3
Query Engine (Node-API) : libquery-engine 605197351a3c8bdd595af2d2a9bc3025bca48ea2 (at node_modules/@prisma/engines/libquery_engine-linux-musl-arm64-openssl-3.0.x.so.node)
Schema Engine           : schema-engine-cli 605197351a3c8bdd595af2d2a9bc3025bca48ea2 (at node_modules/@prisma/engines/schema-engine-linux-musl-arm64-openssl-3.0.x)
Schema Wasm             : @prisma/prisma-schema-wasm 5.22.0-44.605197351a3c8bdd595af2d2a9bc3025bca48ea2
Default Engines Hash    : 605197351a3c8bdd595af2d2a9bc3025bca48ea2
Studio                  : 0.503.0
✔ Exited with code 0
```

#### 3.2.3 Generated Prisma Client Initialization Verification

Command executed:

```bash
$ docker run --rm --entrypoint node singslot-app:latest -e \
  "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); console.log('Prisma Client initialized successfully');"
```

Raw Output:

```
Prisma Client initialized successfully
✔ Exited with code 0
```

#### 3.2.4 Multi-Container Orchestration, Migration & Idempotent Seed Evidence

Command executed:

```bash
$ docker compose up -d
$ docker logs singslot-migrate
```

Raw Output:

```
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "singslot", schema "public" at "db:5432"

1 migration found in prisma/migrations

Applying migration `20261105000000_init`

The following migration(s) have been applied:

migrations/
  └─ 20261105000000_init/
    └─ migration.sql
      
All migrations have been successfully applied.

> singslot-server@1.0.0 prisma:seed
> ts-node --transpile-only prisma/seed.ts

🌱 Starting SingSlot database seeding (Idempotent)...
✅ Seeded/Verified 3 demo users (1 Staff, 2 Customers).
✅ Seeded/Verified 9 karaoke rooms (3 Small, 3 Medium, 3 Large).
🎉 Idempotent seeding completed successfully!
```

#### 3.2.5 Live Readiness Probe Verification against PostgreSQL

Command executed:

```bash
$ curl -s -i http://localhost:8080/api/ready
```

Raw HTTP Response:

```
HTTP/1.1 200 OK
X-Powered-By: Express
Access-Control-Allow-Origin: *
Content-Type: application/json; charset=utf-8
Content-Length: 35
ETag: W/"23-D1kNMykUfue7IXX2BZJN51Pj3jg"
Date: Thu, 12 Nov 2026 17:59:19 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"status":"ready","db":"connected"}
```

#### 3.2.6 Unmatched API 404 Protection Verification (Prevent HTML Swallowing)

Command executed:

```bash
$ curl -s -i http://localhost:8080/api/unknown-endpoint
```

Raw HTTP Response:

```
HTTP/1.1 404 Not Found
X-Powered-By: Express
Access-Control-Allow-Origin: *
Content-Type: application/json; charset=utf-8
Content-Length: 96
ETag: W/"60-vPwPdw/Wi9NedcO+c8bIPWH1tes"
Date: Thu, 12 Nov 2026 18:01:06 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"success":false,"error":{"code":"NOT_FOUND","message":"The requested API route was not found"}}
```

#### 3.2.7 Production SPA Routing & Direct Page Refresh Verification

Command executed:

```bash
$ curl -s -i http://localhost:8080/my-bookings
```

Raw HTTP Response:

```
HTTP/1.1 200 OK
X-Powered-By: Express
Access-Control-Allow-Origin: *
Accept-Ranges: bytes
Cache-Control: public, max-age=0
Last-Modified: Thu, 12 Nov 2026 17:52:17 GMT
ETag: W/"254-1a1d0e39068"
Content-Type: text/html; charset=UTF-8
Content-Length: 596
Date: Thu, 12 Nov 2026 18:02:11 GMT
Connection: keep-alive
Keep-Alive: timeout=5

<!doctype html>
<html lang="en" class="bg-white">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SingSlot — Karaoke Room Reservation</title>
    <script type="module" crossorigin src="/assets/index-D5Zzf6pX.js"></script>
    <link rel="stylesheet" crossorigin href="/assets/index-dj9vyFCv.css">
  </head>
  <body class="bg-white text-slate-800 antialiased selection:bg-pink-300 selection:text-purple-900">
    <div id="root"></div>
  </body>
</html>
```

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
