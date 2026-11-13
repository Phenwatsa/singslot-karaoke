#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# SingSlot — Idempotent Google Cloud Run Deployment Script
# ==============================================================================
# Usage:
#   ./deploy/deploy.sh
#
# Environment Variables (Optional):
#   PROJECT_ID   GCP Project ID (defaults to active gcloud config project)
#   REGION       GCP Region (default: asia-southeast1)
#   DRY_RUN      Set DRY_RUN=1 to print all gcloud commands without executing
#
# WHAT THIS SCRIPT DOES (one-time / manual first setup; safe to re-run)
#   Creates every cloud resource the app needs and performs initial deployment:
#   1. Enable APIs           2. Artifact Registry    3. Cloud SQL instance
#   4. Database              5. Runtime SA + IAM     6. DB user + secret
#   7. JWT secret            8. Staff seed password  9. Build image via Cloud Build
#   10. Migrate + seed job   11. Cloud Run service
#
# ⭐ IMPORTANT
#   - Idempotent: existing resources/secrets are reused, never overwritten.
#   - Passwords and secrets are generated via openssl and live in Secret Manager.
#   - Sensitive values are never printed in plain text (run_cmd redacts --password=...).
#   - Run from the repository root.
# ==============================================================================

DRY_RUN="${DRY_RUN:-0}"
REGION="${REGION:-asia-southeast1}"

# Helper: prints the command (DRY_RUN=1) or prints then executes it.
run_cmd() {
  local arg
  if [ "$DRY_RUN" = "1" ]; then
    printf '[DRY_RUN] '
  else
    printf '+ '
  fi
  for arg in "$@"; do
    case "$arg" in
      --password=*) printf '%s ' '--password=<REDACTED>' ;;
      *) printf '%q ' "$arg" ;;
    esac
  done
  printf '\n'
  if [ "$DRY_RUN" != "1" ]; then
    "$@"
  fi
}

# Resolve the GCP project: $PROJECT_ID, else active gcloud project.
if [ "$DRY_RUN" = "1" ]; then
  PROJECT_ID="${PROJECT_ID:-example-gcp-project}"
else
  PROJECT_ID="${PROJECT_ID:-$(gcloud config get-value project 2>/dev/null || true)}"
  if [ -z "$PROJECT_ID" ]; then
    echo "Error: PROJECT_ID is not set and no active gcloud project was found." >&2
    echo "Run: gcloud config set project YOUR_PROJECT_ID" >&2
    exit 1
  fi
fi

# ------------------------------------------------------------------------------
# Resource names per deployment.md Table 4
# ------------------------------------------------------------------------------
REPO_NAME="singslot"
SQL_INSTANCE="singslot-pg"
DB_NAME="singslot"
DB_USER="singslot"
SERVICE_NAME="singslot"
MIGRATE_JOB_NAME="singslot-migrate"
SA_NAME="singslot-runner"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
RUNNER_SA_NAME="singslot-runner"
RUNNER_SA_EMAIL="${RUNNER_SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
MIGRATOR_SA_NAME="singslot-migrator"
MIGRATOR_SA_EMAIL="${MIGRATOR_SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
DEPLOYER_SA_NAME="singslot-deployer"
DEPLOYER_SA_EMAIL="${DEPLOYER_SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
SQL_CONN_NAME="${PROJECT_ID}:${REGION}:${SQL_INSTANCE}"
IMAGE_URI="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${SERVICE_NAME}:latest"

# Secret Manager secret names (Table 4)
SECRET_DB_URL="singslot-database-url"
SECRET_JWT_KEY="singslot-jwt-secret"
SECRET_STAFF_PASS="singslot-staff-password"

echo "=================================================================="
echo "SingSlot Cloud Run Deployment"
echo "Project : ${PROJECT_ID}"
echo "Region  : ${REGION}"
echo "Dry Run : ${DRY_RUN}"
echo "=================================================================="

# ==============================================================================
# 1. Enable required GCP APIs
# ==============================================================================
run_cmd gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  iam.googleapis.com \
  --project "$PROJECT_ID"

# ==============================================================================
# 2. Create Artifact Registry repository (idempotent)
# ==============================================================================
if [ "$DRY_RUN" = "1" ]; then
  run_cmd gcloud artifacts repositories describe "$REPO_NAME" --location "$REGION" --project "$PROJECT_ID"
  run_cmd gcloud artifacts repositories create "$REPO_NAME" --repository-format=docker --location "$REGION" --description="SingSlot container repository" --project "$PROJECT_ID"
else
  if ! gcloud artifacts repositories describe "$REPO_NAME" --location "$REGION" --project "$PROJECT_ID" >/dev/null 2>&1; then
    run_cmd gcloud artifacts repositories create "$REPO_NAME" \
      --repository-format=docker \
      --location "$REGION" \
      --description="SingSlot container repository" \
      --project "$PROJECT_ID"
  fi
fi

# ==============================================================================
# 3. Create Cloud SQL for PostgreSQL instance (idempotent, db-f1-micro requires --edition=enterprise on POSTGRES_16)
# ==============================================================================
if [ "$DRY_RUN" = "1" ]; then
  run_cmd gcloud sql instances describe "$SQL_INSTANCE" --project "$PROJECT_ID"
  run_cmd gcloud sql instances create "$SQL_INSTANCE" --database-version=POSTGRES_16 --edition=enterprise --tier=db-f1-micro --region="$REGION" --storage-size=10GB --storage-type=SSD --no-storage-auto-increase --backup-start-time=03:00 --project "$PROJECT_ID"
else
  if ! gcloud sql instances describe "$SQL_INSTANCE" --project "$PROJECT_ID" >/dev/null 2>&1; then
    run_cmd gcloud sql instances create "$SQL_INSTANCE" \
      --database-version=POSTGRES_16 \
      --edition=enterprise \
      --tier=db-f1-micro \
      --region="$REGION" \
      --storage-size=10GB \
      --storage-type=SSD \
      --no-storage-auto-increase \
      --backup-start-time=03:00 \
      --project "$PROJECT_ID"
  fi
fi

# ==============================================================================
# 4. Create Database (idempotent)
# ==============================================================================
if [ "$DRY_RUN" = "1" ]; then
  run_cmd gcloud sql databases describe "$DB_NAME" --instance="$SQL_INSTANCE" --project "$PROJECT_ID"
  run_cmd gcloud sql databases create "$DB_NAME" --instance="$SQL_INSTANCE" --project "$PROJECT_ID"
else
  if ! gcloud sql databases describe "$DB_NAME" --instance="$SQL_INSTANCE" --project "$PROJECT_ID" >/dev/null 2>&1; then
    run_cmd gcloud sql databases create "$DB_NAME" --instance="$SQL_INSTANCE" --project "$PROJECT_ID"
  fi
fi

# ==============================================================================
# 5. Create Dedicated Service Accounts & IAM bindings (idempotent, Table 4)
# ==============================================================================
for sa_tuple in "${RUNNER_SA_NAME}:SingSlot Cloud Run Runtime Service Account" \
                "${MIGRATOR_SA_NAME}:SingSlot Migration Job Service Account" \
                "${DEPLOYER_SA_NAME}:SingSlot GitHub Actions Deployer Service Account"; do
  sa_n="${sa_tuple%%:*}"
  sa_d="${sa_tuple#*:}"
  sa_e="${sa_n}@${PROJECT_ID}.iam.gserviceaccount.com"
  if [ "$DRY_RUN" = "1" ]; then
    run_cmd gcloud iam service-accounts describe "$sa_e" --project "$PROJECT_ID"
    run_cmd gcloud iam service-accounts create "$sa_n" --display-name="$sa_d" --project "$PROJECT_ID"
  else
    if ! gcloud iam service-accounts describe "$sa_e" --project "$PROJECT_ID" >/dev/null 2>&1; then
      run_cmd gcloud iam service-accounts create "$sa_n" \
        --display-name="$sa_d" \
        --project "$PROJECT_ID"
    fi
  fi
done

for sa_email in "$RUNNER_SA_EMAIL" "$MIGRATOR_SA_EMAIL"; do
  run_cmd gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${sa_email}" \
    --role="roles/cloudsql.client" \
    --condition=None \
    --quiet
done

# ==============================================================================
# 6. Create DB User & Store DATABASE_URL in Secret Manager (idempotent)
# ==============================================================================
if [ "$DRY_RUN" = "1" ]; then
  run_cmd gcloud secrets describe "$SECRET_DB_URL" --project "$PROJECT_ID"
  run_cmd gcloud sql users list --instance="$SQL_INSTANCE" --project "$PROJECT_ID" --format="value(name)"
  run_cmd gcloud sql users create "$DB_USER" --instance="$SQL_INSTANCE" --password="<GENERATED_HEX_PASSWORD>" --project "$PROJECT_ID"
  run_cmd gcloud secrets create "$SECRET_DB_URL" --replication-policy="automatic" --project "$PROJECT_ID"
  run_cmd gcloud secrets versions add "$SECRET_DB_URL" --data-file=- --project "$PROJECT_ID"
else
  if ! gcloud secrets describe "$SECRET_DB_URL" --project "$PROJECT_ID" >/dev/null 2>&1; then
    DB_PASS="$(openssl rand -hex 24)"
    if gcloud sql users list --instance="$SQL_INSTANCE" --project "$PROJECT_ID" --format="value(name)" | grep -qx "$DB_USER"; then
      run_cmd gcloud sql users set-password "$DB_USER" --instance="$SQL_INSTANCE" --password="$DB_PASS" --project "$PROJECT_ID"
    else
      run_cmd gcloud sql users create "$DB_USER" --instance="$SQL_INSTANCE" --password="$DB_PASS" --project "$PROJECT_ID"
    fi
    DB_URL_VALUE="postgresql://${DB_USER}:${DB_PASS}@localhost/${DB_NAME}?host=/cloudsql/${SQL_CONN_NAME}&schema=public&connection_limit=3"
    run_cmd gcloud secrets create "$SECRET_DB_URL" --replication-policy="automatic" --project "$PROJECT_ID"
    printf "%s" "$DB_URL_VALUE" | gcloud secrets versions add "$SECRET_DB_URL" --data-file=- --project "$PROJECT_ID"
  fi
fi

# ==============================================================================
# 7. Create JWT_SECRET in Secret Manager (idempotent)
# ==============================================================================
if [ "$DRY_RUN" = "1" ]; then
  run_cmd gcloud secrets describe "$SECRET_JWT_KEY" --project "$PROJECT_ID"
  run_cmd gcloud secrets create "$SECRET_JWT_KEY" --replication-policy="automatic" --project "$PROJECT_ID"
  run_cmd gcloud secrets versions add "$SECRET_JWT_KEY" --data-file=- --project "$PROJECT_ID"
else
  if ! gcloud secrets describe "$SECRET_JWT_KEY" --project "$PROJECT_ID" >/dev/null 2>&1; then
    GENERATED_JWT_SECRET="$(openssl rand -base64 32)"
    run_cmd gcloud secrets create "$SECRET_JWT_KEY" --replication-policy="automatic" --project "$PROJECT_ID"
    printf "%s" "$GENERATED_JWT_SECRET" | gcloud secrets versions add "$SECRET_JWT_KEY" --data-file=- --project "$PROJECT_ID"
  fi
fi

# ==============================================================================
# 8. Create STAFF_PASSWORD in Secret Manager (idempotent)
# ==============================================================================
if [ "$DRY_RUN" = "1" ]; then
  run_cmd gcloud secrets describe "$SECRET_STAFF_PASS" --project "$PROJECT_ID"
  run_cmd gcloud secrets create "$SECRET_STAFF_PASS" --replication-policy="automatic" --project "$PROJECT_ID"
  run_cmd gcloud secrets versions add "$SECRET_STAFF_PASS" --data-file=- --project "$PROJECT_ID"
else
  if ! gcloud secrets describe "$SECRET_STAFF_PASS" --project "$PROJECT_ID" >/dev/null 2>&1; then
    GENERATED_STAFF_PASSWORD="$(openssl rand -base64 16 | tr -d '/+=' | cut -c1-14)Aa1!"
    run_cmd gcloud secrets create "$SECRET_STAFF_PASS" --replication-policy="automatic" --project "$PROJECT_ID"
    printf "%s" "$GENERATED_STAFF_PASSWORD" | gcloud secrets versions add "$SECRET_STAFF_PASS" --data-file=- --project "$PROJECT_ID"
  fi
fi

# ------------------------------------------------------------------------------
# Secret access (strictly scoped per secret per Table 4, never project-wide)
# runner   -> singslot-database-url, singslot-jwt-secret (NO staff password)
# migrator -> singslot-database-url, singslot-staff-password (NO jwt secret)
# ------------------------------------------------------------------------------
for secret in "$SECRET_DB_URL" "$SECRET_JWT_KEY"; do
  run_cmd gcloud secrets add-iam-policy-binding "$secret" \
    --member="serviceAccount:${RUNNER_SA_EMAIL}" \
    --role="roles/secretmanager.secretAccessor" \
    --project "$PROJECT_ID" \
    --quiet
done

for secret in "$SECRET_DB_URL" "$SECRET_STAFF_PASS"; do
  run_cmd gcloud secrets add-iam-policy-binding "$secret" \
    --member="serviceAccount:${MIGRATOR_SA_EMAIL}" \
    --role="roles/secretmanager.secretAccessor" \
    --project "$PROJECT_ID" \
    --quiet
done

# ==============================================================================
# 9. Build & Push Unified Container Image via Cloud Build
# ==============================================================================
run_cmd gcloud builds submit \
  --tag "$IMAGE_URI" \
  --project "$PROJECT_ID"

# ==============================================================================
# 10. Create/Update & Execute Cloud Run Job for Migration + Seed
# ==============================================================================
JOB_SECRETS="DATABASE_URL=${SECRET_DB_URL}:latest,STAFF_PASSWORD=${SECRET_STAFF_PASS}:latest"

run_cmd gcloud run jobs deploy "$MIGRATE_JOB_NAME" \
  --image "$IMAGE_URI" \
  --region "$REGION" \
  --service-account "$MIGRATOR_SA_EMAIL" \
  --set-cloudsql-instances "$SQL_CONN_NAME" \
  --set-secrets "$JOB_SECRETS" \
  --set-env-vars "NODE_ENV=production,TZ=Asia/Bangkok,CUSTOMER_PASSWORD=Customer1234!" \
  --command "sh" \
  --args "-c,npx prisma migrate deploy && npm run prisma:seed" \
  --max-retries 1 \
  --task-timeout 300s \
  --project "$PROJECT_ID"

if ! run_cmd gcloud run jobs execute "$MIGRATE_JOB_NAME" \
  --region "$REGION" \
  --wait \
  --project "$PROJECT_ID"; then
  printf '%s\n' "ERROR: Cloud Run migration job '${MIGRATE_JOB_NAME}' failed. Aborting service deployment." >&2
  printf '%s\n' "View job logs with:" >&2
  printf '%s\n' "  gcloud logging read \"resource.type=cloud_run_job AND resource.labels.job_name=${MIGRATE_JOB_NAME}\" --project \"${PROJECT_ID}\" --limit 50 --format=\"value(textPayload)\"" >&2
  exit 1
fi

# ==============================================================================
# 11. Deploy Cloud Run Service
# ==============================================================================
SERVICE_SECRETS="DATABASE_URL=${SECRET_DB_URL}:latest,JWT_SECRET=${SECRET_JWT_KEY}:latest"

run_cmd gcloud run deploy "$SERVICE_NAME" \
  --image "$IMAGE_URI" \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --service-account "$RUNNER_SA_EMAIL" \
  --add-cloudsql-instances "$SQL_CONN_NAME" \
  --set-secrets "$SERVICE_SECRETS" \
  --set-env-vars "NODE_ENV=production,TZ=Asia/Bangkok" \
  --min-instances 0 \
  --max-instances 3 \
  --memory 512Mi \
  --cpu 1 \
  --port 8080 \
  --project "$PROJECT_ID"

if [ "$DRY_RUN" = "1" ]; then
  SERVICE_URL="https://${SERVICE_NAME}-<hash>-as.a.run.app"
else
  SERVICE_URL="$(gcloud run services describe "$SERVICE_NAME" --region "$REGION" --project "$PROJECT_ID" --format='value(status.url)')"
fi

# ------------------------------------------------------------------------------
# Summary output (URLs; credentials kept in Secret Manager)
# ------------------------------------------------------------------------------
printf '\n'
printf '%s\n' "=================================================================="
printf '%s\n' "Deployment Completed!"
printf '%s\n' "Service URL    : ${SERVICE_URL}"
printf '%s\n' "Health Check   : ${SERVICE_URL}/api/health"
printf '%s\n' "Readiness Check: ${SERVICE_URL}/api/ready"
printf '%s\n' "Staff Email    : staff@singslot.local"
printf '%s\n' "Staff Password : Stored in Secret Manager: ${SECRET_STAFF_PASS} (not printed)."
printf '%s\n' "=================================================================="

