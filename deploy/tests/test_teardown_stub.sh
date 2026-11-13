#!/usr/bin/env bash
# ==============================================================================
# Offline test for deploy/teardown.sh (fake `gcloud`, no GCP access, no cost)
# ==============================================================================
# WHAT THIS TEST CHECKS
#   1. confirmed : user confirms project ID -> calls delete on service, job,
#                  cloudsql instance, artifact repo, secrets, and service account
#   2. aborted   : mismatch project ID -> exits with error, NO delete executed
#   3. dry_run   : DRY_RUN=1 -> prints commands, zero gcloud calls executed
# HOW TO RUN (repo root, needs bash):  bash deploy/tests/test_teardown_stub.sh
# ==============================================================================
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEARDOWN_SCRIPT="${SCRIPT_DIR}/../teardown.sh"
TEST_STATE_DIR="$(mktemp -d)"
trap 'rm -rf "$TEST_STATE_DIR"' EXIT
mkdir -p "$TEST_STATE_DIR/bin"

# --- Fake `gcloud`: logs each call -------------------------------------------
cat > "$TEST_STATE_DIR/bin/gcloud" <<'STUB'
#!/usr/bin/env bash
set -euo pipefail
printf '%s\n' "$*" >> "$GCLOUD_LOG"
if [ "${1:-} ${2:-}" = 'config get-value' ]; then
  echo stub-gcp-project
  exit 0
fi
exit 0
STUB
chmod +x "$TEST_STATE_DIR/bin/gcloud"

export PATH="$TEST_STATE_DIR/bin:$PATH"
export PROJECT_ID=stub-gcp-project
export REGION=asia-southeast1

# 1. Confirmed scenario
export GCLOUD_LOG="$TEST_STATE_DIR/gcloud-confirmed.log"
export DRY_RUN=0
echo "stub-gcp-project" | bash "$TEARDOWN_SCRIPT" > "$TEST_STATE_DIR/output-confirmed" 2>&1
grep -q 'run services delete singslot ' "$GCLOUD_LOG"
grep -q 'run jobs delete singslot-migrate ' "$GCLOUD_LOG"
grep -q 'sql instances delete singslot-pg ' "$GCLOUD_LOG"
grep -q 'artifacts repositories delete singslot ' "$GCLOUD_LOG"
grep -q 'secrets delete singslot-database-url ' "$GCLOUD_LOG"
grep -q 'secrets delete singslot-jwt-secret ' "$GCLOUD_LOG"
grep -q 'secrets delete singslot-staff-password ' "$GCLOUD_LOG"
grep -q 'secrets delete singslot-customer-password ' "$GCLOUD_LOG"
grep -q 'iam service-accounts delete singslot-runner@stub-gcp-project.iam.gserviceaccount.com ' "$GCLOUD_LOG"
grep -q 'iam service-accounts delete singslot-migrator@stub-gcp-project.iam.gserviceaccount.com ' "$GCLOUD_LOG"
grep -q 'iam service-accounts delete singslot-deployer@stub-gcp-project.iam.gserviceaccount.com ' "$GCLOUD_LOG"
echo 'PASS confirmed teardown deletes all provisioned resources'

# 2. Aborted scenario (mismatch input)
export GCLOUD_LOG="$TEST_STATE_DIR/gcloud-aborted.log"
abort_exit=0
echo "wrong-project-id" | bash "$TEARDOWN_SCRIPT" > "$TEST_STATE_DIR/output-aborted" 2>&1 || abort_exit=$?
if [ "$abort_exit" -eq 0 ]; then
  echo 'FAIL: teardown did not abort on mismatch project ID' >&2
  exit 1
fi
if [ -f "$GCLOUD_LOG" ] && grep -q 'delete' "$GCLOUD_LOG"; then
  echo 'FAIL: teardown executed delete commands despite mismatch' >&2
  exit 1
fi
echo 'PASS mismatched confirmation aborts without executing deletion'

# 3. Dry run scenario
export GCLOUD_LOG="$TEST_STATE_DIR/gcloud-dryrun.log"
DRY_RUN=1 bash "$TEARDOWN_SCRIPT" > "$TEST_STATE_DIR/output-dryrun" 2>&1
if [ -f "$GCLOUD_LOG" ]; then
  echo 'FAIL: dry run executed gcloud calls' >&2
  exit 1
fi
grep -q '\[DRY_RUN\] gcloud run services delete singslot' "$TEST_STATE_DIR/output-dryrun"
echo 'PASS dry run makes no gcloud calls'

