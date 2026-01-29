#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID=${PROJECT_ID:?"Defina PROJECT_ID"}
REGION=${REGION:-us-central1}
REDIS_NAME=${REDIS_NAME:-ipam-redis}

if ! gcloud redis instances describe "${REDIS_NAME}" --region "${REGION}" --project "${PROJECT_ID}" >/dev/null 2>&1; then
  gcloud redis instances create "${REDIS_NAME}" \
    --size=1 \
    --region "${REGION}" \
    --project "${PROJECT_ID}"
fi
