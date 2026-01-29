#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID=${PROJECT_ID:?"Defina PROJECT_ID"}
REGION=${REGION:-us-central1}
QUEUE_NAME=${QUEUE_NAME:-ipam-control-plane}
SERVICE_ACCOUNT=${SERVICE_ACCOUNT:?"Defina SERVICE_ACCOUNT"}

if ! gcloud tasks queues describe "${QUEUE_NAME}" --location "${REGION}" --project "${PROJECT_ID}" >/dev/null 2>&1; then
  gcloud tasks queues create "${QUEUE_NAME}" \
    --location "${REGION}" \
    --project "${PROJECT_ID}"
fi

gcloud iam service-accounts add-iam-policy-binding "${SERVICE_ACCOUNT}" \
  --member "serviceAccount:${SERVICE_ACCOUNT}" \
  --role "roles/run.invoker" \
  --project "${PROJECT_ID}"
