# SingSlot Deployment & Release Runbook (Lab 5)
## Course: CPE 334 Introduction to Software Engineering in the Age of AI Agents
**Project:** SingSlot — Karaoke Room Reservation & Management System  
**Maintainers:** Phenwatsa (@Phenwatsa) & phirada (@lephirada)  
**Document Version:** 0.1.0 (Draft / Pre-Deployment Planning Baseline)  
**Status:** In Progress (Updated iteratively across Lab 5 Tasks 1–8)  

---

## 1. System Architecture & Stack Specification

SingSlot is developed as a separate frontend and backend within a monorepo, but is deployed as a unified single-container application in the production Cloud Run environment:

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS (`client/`)
- **Backend:** Node.js 24 + Express + TypeScript (`server/`)
- **ORM & Data Layer:** Prisma ORM 5.22 connecting to PostgreSQL 16
- **Planned Cloud Infrastructure on Google Cloud Platform (GCP):**
  - **Compute:** Google Cloud Run (Serverless container runtime, scale to 0 instances when idle, max 3 instances, CPU: 1, Memory: 512Mi)
  - **Database:** Google Cloud SQL for PostgreSQL 16 (Enterprise db-f1-micro tier, storage auto-increase disabled)
  - **Container Registry:** Google Artifact Registry (`docker` format in `asia-southeast1`)
  - **Secret Management:** Google Secret Manager (stores sensitive connection strings, cryptographic keys, and application credentials)
  - **CI/CD Automation:** GitHub Actions with Keyless Workload Identity Federation (WIF)

### 1.1 Single-Container Production Architecture (Frontend Serving & Routing)

In production on Cloud Run, SingSlot operates as a unified single-container deployment:
- **Production Filesystem Structure:**
  - `/app/server/dist/` (compiled Express backend JavaScript)
  - `/app/server/prisma/` (Prisma schema, migrations, and seed runtime)
  - `/app/client/dist/` (compiled Vite React static assets)
  - Working directory is set to `/app/server`.
- **Runtime Serving & Absolute Path Resolution:**
  - The production Express server resolves and statically serves frontend assets from `/app/client/dist` via `express.static('/app/client/dist')` (or `path.resolve(__dirname, '../../client/dist')`).
- **Middleware & Routing Order (Preventing API 404 Swallowing):**
  1. **API Routers:** Mount all API endpoints under `/api` (`/api/health`, `/api/ready`, `/api/auth`, `/api/bookings`, `/api/rooms`, `/api/availability`).
  2. **API 404 Handler:** Unmatched `/api` and `/api/*` requests immediately return JSON 404 (`{ success: false, error: { code: 'NOT_FOUND', message: 'API endpoint not found' } }`), strictly prevented from falling through to HTML.
  3. **Static Assets:** Express serves `/app/client/dist` static assets via `express.static`.
  4. **SPA Fallback:** Non-API `GET *` requests return `/app/client/dist/index.html` to support client-side routing on page refresh (using syntax compatible with installed Express `^4.21.1`).
- **Same-Origin API Access:**
  - Frontend client strictly uses same-origin relative URLs (`/api/*`) for all API requests.
  - Eliminates cross-origin CORS complexity on Cloud Run, while local development retains Vite dev server proxy (`/api` -> `http://localhost:5001`).

---

## 2. Environment Variables Specification

The application reads all configurations strictly from environment variables per Twelve-Factor App principles (**R-02**):

| Variable Name | Purpose & Function | Secret? | Source / Provider | Example / Placeholder Value | Architecture Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| `NODE_ENV` | Sets runtime optimization mode | No | System Environment | `production` (Cloud) / `development` (Local) | Active |
| `PORT` | Listening port for Express HTTP server | No | Cloud Run / Local env | `8080` (Cloud Run default) / `5001` (Local default) | Active |
| `TZ` | Timezone configuration for Node.js process runtime | No | System Environment / Dockerfile | `Asia/Bangkok` | Active |
| `CLIENT_DIST_PATH` | Optional override for static assets directory path | No | Cloud Run / Local env | `/app/client/dist` (Defaults to `../../client/dist` relative to server dist) | Active |
| `DATABASE_URL` | PostgreSQL connection string | **Yes** | Secret Manager / `.env` | `postgresql://USER:PASS@localhost:5432/DB` | Active |
| `JWT_SECRET` | 256-bit cryptographic secret for signing JWTs | **Yes** | Secret Manager / `.env` | Cryptographically random base64 string | Active |
| `STAFF_PASSWORD` | Password used to seed the initial Staff demo account (mounted strictly to `singslot-migrate` job; omitted from runtime service) | **Yes** | Secret Manager / `.env` | Secure password supplied through environment variable | Active |
| `CUSTOMER_PASSWORD` | Password used to seed the initial Customer demo accounts (mounted strictly to `singslot-migrate` job; omitted from runtime service) | **Yes** | Secret Manager / `.env` | Secure password supplied through environment variable | Active |
| `CORS_ORIGIN` | Allowed web origin for decoupled API access | No | Cloud Run / Local env | `http://localhost:5173` (Optional: not required when served same-origin in production) | [PLANNED] |

> [!CAUTION]
> **Zero Secret Leaks (R-12):** Real credentials must never be written to this file, committed to Git, or exposed in build logs. In production, sensitive variables are mounted directly from GCP Secret Manager into the Cloud Run container runtime. `STAFF_PASSWORD` and `CUSTOMER_PASSWORD` are scoped exclusively to the migration/seed job (`singslot-migrator` service account) and are not injected into the public runtime service (`singslot-runner`).

---

## 3. Development, Build, Test & Migration Commands

Commands are organized by execution environment. Root-level scripts are used where available; workspace-specific commands are executed from the corresponding package directory:

### 3.1 Dependencies Installation
```bash
# Clean, reproducible installation using root lockfile and npm workspaces (preferred for fresh clones and CI):
npm ci

# Alternatively, workspace install helper defined in root package.json:
npm run install:all
```

### 3.2 Database Migration & Idempotent Seeding

Commands are tailored to the execution environment:
- **Local Development (from repository root):**
  ```bash
  # Apply pending migrations
  npm run prisma:migrate
  # Seed demo users (staff, customers) and room fleet via root workspace forwarding
  npm run prisma:seed
  ```
- **CI Pipeline (from `server/` workspace directory):**
  ```bash
  cd server
  npx prisma migrate deploy
  npm run prisma:seed
  ```
- **Cloud Run Migration Job (inside production container):**
  ```bash
  npx prisma migrate deploy && npm run prisma:seed
  ```
  *(Note: Production container image sets `WORKDIR /app/server` and bundles `ts-node` runtime and dependencies so `npm run prisma:seed` executes reliably inside the container.)*

### 3.3 Automated Test Suites (MacBook M1 8GB RAM Safe)
```bash
# Run server test suite in-band with open handles detection (requires running PostgreSQL)
npm run test:server

# Run client layout & structural component test suite
npm run test:client

# Run full project test verification
npm test
```

### 3.4 Fresh Clone Container Build & Execution [PLANNED - Task 3 / C-03]
```bash
# 1. Fresh clone into a separate directory:
git clone https://github.com/Phenwatsa/singslot-karaoke.git fresh-clone
cd fresh-clone

# 2. Reproducible installation from lockfile:
npm ci

# 3. Configure local environment variables from template:
cp server/.env.example server/.env
# Fill only local development placeholders (e.g. DATABASE_URL, JWT_SECRET, STAFF_PASSWORD; no real secrets)

# 4. Build production multi-stage container image:
docker build -t singslot-app .

# 5. Start local composition with isolated PostgreSQL database volume:
docker compose up --build -d

# 6. Verify system readiness probe (Task 2 endpoint):
curl -f http://localhost:8080/api/ready
# Expected response: {"status":"ready","db":"connected"}

# 7. Verify web application and API work together:
# Open http://localhost:8080 in browser and test room availability and booking creation
```

---

## 4. Planned GCP Resources Specification [PLANNED - Tasks 1 & 5]

| Resource Type | Resource Name | Region / Zone | Configuration / Safeguards |
| :--- | :--- | :--- | :--- |
| **GCP Project** | `cpe334-singslot-[id]` | `asia-southeast1` | Free Trial project ($300 credit, Budget Alert configured) |
| **Artifact Registry** | `singslot` | `asia-southeast1` | Docker repository |
| **Cloud SQL Instance** | `singslot-pg` | `asia-southeast1` | PostgreSQL 16, db-f1-micro, `--no-storage-auto-increase` |
| **Database Name** | `singslot` | — | Default PostgreSQL application database |
| **Runtime Service Account** | `singslot-runner` | — | Role: `Cloud SQL Client` + `Secret Accessor` (scoped to `DATABASE_URL`, `JWT_SECRET`) |
| **Migration Service Account**| `singslot-migrator` | — | Role: `Cloud SQL Client` + `Secret Accessor` (scoped to `DATABASE_URL`, `STAFF_PASSWORD`, `CUSTOMER_PASSWORD`) |
| **Deployer Service Account** | `singslot-deployer` | — | Keyless account impersonated via WIF. Required permissions: `roles/iam.workloadIdentityUser` (bound to authorized GitHub WIF principal), `roles/iam.serviceAccountUser` (on `singslot-runner` and `singslot-migrator`), and minimum required Cloud Run deployment (`roles/run.developer`) and Artifact Registry push (`roles/artifactregistry.writer`) roles |
| **Cloud Run Service** | `singslot` | `asia-southeast1` | Min: 0, Max: 3, Memory: 512Mi, CPU: 1, Port: 8080 |
| **Cloud Run Migration Job**| `singslot-migrate` | `asia-southeast1` | Pre-deploy database migration runner |
| **Secret: DB URL** | `singslot-database-url` | — | Prisma PostgreSQL Unix socket connection string (resolved with actual project ID, region, and URL-encoded password) |
| **Secret: JWT Key** | `singslot-jwt-secret` | — | 256-bit cryptographically secure token signing key |
| **Secret: Staff Password** | `singslot-staff-password`| — | Seed credential for initial Staff demo account |
| **Secret: Customer Password** | `singslot-customer-password`| — | Seed credential for initial Customer demo accounts |

> [!NOTE]
> **Task 4 vs. Task 6 Scope on Service Accounts:**
> In Task 4 (PR #24), all three service accounts (`singslot-runner`, `singslot-migrator`, `singslot-deployer`) are provisioned by `deploy/deploy.sh` to establish predictable resource naming and Table 4 schema completeness. The runtime and migration accounts (`singslot-runner`, `singslot-migrator`) receive their strictly scoped IAM policies and Secret Accessor bindings in Task 4. The deployer account (`singslot-deployer`) has its Workload Identity Federation (WIF) pool, provider bindings, and deployment roles (`roles/run.developer`, `roles/artifactregistry.writer`, `roles/iam.serviceAccountUser`) configured explicitly in **Task 6 (Continuous Deployment Pipeline & WIF Setup)** when the GitHub Actions deploy workflow is established.

---

## 5. Release Procedure & Commit Traceability Runbook [PLANNED - Task 7]

All normal production releases follow this immutable forward release pipeline. Controlled application-image rollback and roll-forward are handled separately through the manual release workflow, without rerunning historical database migrations:

```
[Feature Branch]
       │
       ▼  (PR + Peer Review + Passing CI Check 'test-and-docker')
[sprint-1-staging]
       │
       ▼  (Release PR + Peer Approval + Passing CI Check)
[main]
       │
       ▼  (Automatic Trigger: .github/workflows/deploy.yml)
[1. Reusable CI Verification (npm ci, typecheck, test:server, test:client)]
       │
       ▼
[2. Keyless Authenticate via WIF (google-github-actions/auth)]
       │
       ▼
[3. Configure Docker Credential Helper (gcloud auth configure-docker)]
       │
       ▼
[4. Build & Push Image (Tagged with Full 40-char Commit SHA)]
       │
       ▼
[5. Resolve & Validate Immutable Image Digest (@sha256:...)]
       │
       ▼
[6. Update & Execute Cloud Run Migration Job (singslot-migrate)]
       │
       ▼
[7. Deploy Cloud Run Service Revision by Digest & Shift 100% Traffic]
       │
       ▼
[8. Execute Automated Read-Only Smoke Test (/api/health, /api/ready)]
```

### How to Identify the Active Running Commit (R-08)
1. Open Google Cloud Run Console → Select `singslot` Service → **Revisions** tab.
2. Inspect the active Revision serving 100% traffic.
3. Distinguish between Tag and Digest:
   - **Commit SHA (`$IMAGE_TAG`):** The 40-character Git commit hash used as the release Tag in Artifact Registry.
   - **Image Digest (`@sha256:...`):** The immutable cryptographic hash deployed to Cloud Run.
4. Verify that the Cloud Run Revision image digest matches the exact immutable digest reported in the GitHub Actions Deploy Run Summary.

---

## 6. Verification, Persistence & Rollback Runbook [PLANNED - Task 8]

### 6.1 Data Persistence Verification (C-05 / R-04)

Per course requirements (**R-04, C-05**), data must survive both (a) an application instance restart / container recreation and (b) a new revision redeployment.

#### 6.1.1 Instance Restart & Process Recycling Proof
1. **Local Composition Verification:**
   - Record container ID before restart: `CONTAINER_A=$(docker compose ps -q singslot-app)`.
   - Execute container process recycle: `docker compose down && docker compose up -d` (without `-v`).
   - Record container ID after restart: `CONTAINER_B=$(docker compose ps -q singslot-app)`.
   - Assert `CONTAINER_A != CONTAINER_B`, proving container recreation while database volume retains all records intact.
2. **Cloud Run Instance Recycling Proof:**
   - In Cloud Run, services scale to zero (`min-instances=0`) when idle. Capture Cloud Run Metrics showing active container instance count dropping to 0 (all previous instances terminated).
   - Send an HTTP request to the live service URL. In Cloud Run Logs Explorer, capture the fresh container initialization event (`[Server] SingSlot API listening on port 8080`), proving the request is handled by a brand-new container instance.
   - Confirm that the pre-existing booking record (Booking Code, Room, Date, Slots) is retrieved from Cloud SQL and rendered on the UI without data loss.

#### 6.1.2 Cloud Run Redeployment / New Revision Persistence Test
1. Sign in to the live Cloud Run application URL.
2. Create a distinct room reservation (record Room, Date, Slot Index, and Booking Code).
3. Execute redeployment in Google Cloud Shell to force a brand-new Revision using the exact same immutable image digest:
   ```bash
   # 1. Resolve and validate currently deployed immutable image digest
   export PROJECT_ID="$(gcloud config get-value project)"
   export REGION="asia-southeast1"
   export DEPLOYED_IMAGE="$(gcloud run services describe singslot \
     --project="$PROJECT_ID" \
     --region="$REGION" \
     --format='value(spec.template.spec.containers[0].image)')"

   if [[ ! "$DEPLOYED_IMAGE" =~ ^asia-southeast1-docker\.pkg\.dev/[^/]+/singslot/singslot@sha256:[0-9a-f]{64}$ ]]; then
     echo "ERROR: Invalid Artifact Registry image URI or digest: $DEPLOYED_IMAGE" >&2
     exit 1
   fi
   echo "Verified Immutable Deployed Image: $DEPLOYED_IMAGE"

   # 2. Force new Revision deployment using the exact same image digest
   gcloud run services update singslot \
     --image "$DEPLOYED_IMAGE" \
     --update-env-vars="PERSISTENCE_TEST_TRIGGER=$(date +%s)" \
     --region="$REGION" \
     --project="$PROJECT_ID" \
     --quiet

   # 3. Explicitly shift 100% traffic to the new revision
   gcloud run services update-traffic singslot \
     --to-latest \
     --region="$REGION" \
     --project="$PROJECT_ID" \
     --quiet
   ```
4. Verify 4-step proof:
   - A new Cloud Run revision is deployed and becomes active.
   - The new revision runs the exact same historical image digest.
   - 100% traffic is shifted to this new revision.
   - Refresh the application; the reservation record created in Step 2 remains completely intact in Cloud SQL and visible on the UI, proving data resides in Cloud SQL rather than ephemeral container memory (C-05).

### 6.2 Rollback Safeguards & Runbook [Optional Recommended Practice - Student Guide Episode 8]
> [!NOTE]
> **Recommended Practice (Non-Scored):** Per Lab Sheet Section 5 and Figure 1, automated rollback is a recommended operational practice and is not scored separately under the Lab 5 rubric (15 points in Part 4 are scored strictly on the Repeatable Release Pipeline C-06). Teams may implement and execute this procedure as an advanced reliability and disaster recovery demonstration.

> [!WARNING]
> **Database Schema Compatibility:** Rolling back a container image redeploys previous application binaries but does **NOT** roll back database schema migrations. Database migrations must maintain backward compatibility with previous application revisions that might still be rolled back to (avoiding destructive drops or breaking structural changes until all older revisions are retired).

In the event of a defective release:
1. Open GitHub Actions → **Deploy demo** workflow → Click **Run workflow**.
2. Target branch: `main`.
3. In the `image_tag` input field, supply the full 40-character commit SHA of the known stable release.
4. The pipeline deploys the specified container digest immediately without rebuilding, preserving all historical database state.
