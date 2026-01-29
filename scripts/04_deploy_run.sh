#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID=${PROJECT_ID:?"Defina PROJECT_ID"}
REGION=${REGION:-us-central1}
SERVICE_NAME=${SERVICE_NAME:-ipam-control-plane}
SERVICE_ACCOUNT=${SERVICE_ACCOUNT:?"Defina SERVICE_ACCOUNT"}
DATABASE_URL=${DATABASE_URL:?"Defina DATABASE_URL"}
TASKS_QUEUE_NAME=${TASKS_QUEUE_NAME:-ipam-control-plane}
TASKS_LOCATION=${TASKS_LOCATION:-us-central1}
TASKS_PROJECT_ID=${TASKS_PROJECT_ID:-$PROJECT_ID}
TASKS_SERVICE_URL=${TASKS_SERVICE_URL:?"Defina TASKS_SERVICE_URL"}
TASKS_SERVICE_ACCOUNT=${TASKS_SERVICE_ACCOUNT:-$SERVICE_ACCOUNT}

pushd services/ipam-control-plane >/dev/null
npm install
npm run build

gcloud run deploy "${SERVICE_NAME}" \
  --project "${PROJECT_ID}" \
  --region "${REGION}" \
  --source . \
  --service-account "${SERVICE_ACCOUNT}" \
  --set-env-vars DATABASE_URL="${DATABASE_URL}" \
  --set-env-vars TASKS_QUEUE_NAME="${TASKS_QUEUE_NAME}" \
  --set-env-vars TASKS_LOCATION="${TASKS_LOCATION}" \
  --set-env-vars TASKS_PROJECT_ID="${TASKS_PROJECT_ID}" \
  --set-env-vars TASKS_SERVICE_URL="${TASKS_SERVICE_URL}" \
  --set-env-vars TASKS_SERVICE_ACCOUNT="${TASKS_SERVICE_ACCOUNT}" \
  --allow-unauthenticated=false

popd >/dev/null
