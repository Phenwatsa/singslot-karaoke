#!/usr/bin/env bash
# ==============================================================================
# SingSlot — release.sh (used by .github/workflows/deploy.yml)
# ==============================================================================
# WHAT THIS SCRIPT DOES
#   Updates pre-provisioned Cloud Run resources. Does not create SQL, IAM or secrets.
#   Normal release : verify image -> run migration job -> update service.
#   Rollback       : verify image -> update service (NO migration, NO seed).
#
# INPUT (environment variables)
#   PROJECT_ID, REGION, IMAGE_TAG   required (IMAGE_TAG = full 40-char commit SHA)
#   SERVICE_NAME, MIGRATE_JOB_NAME  optional (default: singslot, singslot-migrate)
#   ROLLBACK                        true | false (default false)
#   GITHUB_ENV                      optional (appends SERVICE_URL / DEPLOYED_IMAGE)
#
# ⭐ IMPORTANT
#   - If the migration job fails, set -e stops the script BEFORE the service is
#     updated, preventing broken migrations from serving user traffic.
#   - The image is resolved to an immutable @sha256 digest so the job and the
#     service run the exact same image.
# ==============================================================================
set -euo pipefail

# ------------------------------------------------------------------------------
# 1. Read and validate inputs (fail before any GCP call)
# ------------------------------------------------------------------------------
: "${PROJECT_ID:?Required}" "${REGION:?Required}" "${IMAGE_TAG:?Required}"
SERVICE_NAME="${SERVICE_NAME:-singslot}"
MIGRATE_JOB_NAME="${MIGRATE_JOB_NAME:-singslot-migrate}"
ROLLBACK="${ROLLBACK:-false}"
[[ "$IMAGE_TAG" =~ ^[0-9a-f]{40}$ ]] || { echo 'Invalid image tag.' >&2; exit 1; }
[[ "$ROLLBACK" == true || "$ROLLBACK" == false ]] || { echo 'Invalid rollback mode.' >&2; exit 1; }

# ------------------------------------------------------------------------------
# 2. Find the image and pin it by digest
# ------------------------------------------------------------------------------
IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/singslot/singslot:$IMAGE_TAG"
DIGEST_IMAGE="$(gcloud artifacts docker images describe "$IMAGE" --project="$PROJECT_ID" --format='value(image_summary.fully_qualified_digest)')"
if [[ ! "$DIGEST_IMAGE" =~ @sha256:[0-9a-f]{64}$ ]]; then
  echo "ERROR: Invalid or missing image digest: $DIGEST_IMAGE" >&2
  exit 1
fi

# ------------------------------------------------------------------------------
# 3. Database migration (normal release only; --wait blocks until completion)
# ------------------------------------------------------------------------------
if [[ "$ROLLBACK" == false ]]; then
  gcloud run jobs update "$MIGRATE_JOB_NAME" --image="$DIGEST_IMAGE" --project="$PROJECT_ID" --region="$REGION" --quiet
  gcloud run jobs execute "$MIGRATE_JOB_NAME" --wait --project="$PROJECT_ID" --region="$REGION" --quiet
else
  echo 'Rollback: reuse existing image; skip tests, build, migration and seed.'
fi

# ------------------------------------------------------------------------------
# 4. Point the Cloud Run service at the image and send 100% of traffic
# ------------------------------------------------------------------------------
gcloud run services update "$SERVICE_NAME" --image="$DIGEST_IMAGE" --project="$PROJECT_ID" --region="$REGION" --quiet
gcloud run services update-traffic "$SERVICE_NAME" --to-latest --project="$PROJECT_ID" --region="$REGION" --quiet

# ------------------------------------------------------------------------------
# 5. Report the URL (and export via GITHUB_ENV if provided)
# ------------------------------------------------------------------------------
SERVICE_URL="$(gcloud run services describe "$SERVICE_NAME" --project="$PROJECT_ID" --region="$REGION" --format='value(status.url)')"
echo "Service URL: $SERVICE_URL"
if [[ -n "${GITHUB_ENV:-}" ]]; then
  printf 'SERVICE_URL=%s\nDEPLOYED_IMAGE=%s\nDEPLOYED_COMMIT_SHA=%s\n' "$SERVICE_URL" "$DIGEST_IMAGE" "$IMAGE_TAG" >> "$GITHUB_ENV"
fi

