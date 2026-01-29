#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID=${PROJECT_ID:?"Defina PROJECT_ID"}
REGION=${REGION:-us-central1}
INSTANCE_NAME=${INSTANCE_NAME:-ipam-sql}
DB_NAME=${DB_NAME:-ipam}
DB_USER=${DB_USER:-ipam_admin}
DB_PASSWORD=${DB_PASSWORD:?"Defina DB_PASSWORD"}

if ! gcloud sql instances describe "${INSTANCE_NAME}" --project "${PROJECT_ID}" >/dev/null 2>&1; then
  gcloud sql instances create "${INSTANCE_NAME}" \
    --project "${PROJECT_ID}" \
    --database-version=POSTGRES_15 \
    --region "${REGION}" \
    --tier=db-custom-1-3840 \
    --storage-type=SSD \
    --storage-size=50
fi

gcloud sql databases create "${DB_NAME}" --instance "${INSTANCE_NAME}" --project "${PROJECT_ID}" || true

gcloud sql users create "${DB_USER}" \
  --instance "${INSTANCE_NAME}" \
  --password "${DB_PASSWORD}" \
  --project "${PROJECT_ID}" || true
