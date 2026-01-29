#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID=${PROJECT_ID:?"Defina PROJECT_ID"}
BUCKET_NAME=${BUCKET_NAME:?"Defina BUCKET_NAME"}
API_BASE_URL=${API_BASE_URL:?"Defina API_BASE_URL (ex: https://ipam-control-plane-xxxxx-uc.a.run.app)"}

pushd dashboard >/dev/null
npm install
VITE_API_BASE_URL="${API_BASE_URL}" npm run build

gcloud storage rsync dist "gs://${BUCKET_NAME}" \
  --project "${PROJECT_ID}" \
  --delete-unmatched-destination-objects
popd >/dev/null

cat <<INFO
Dashboard publicado em: https://storage.googleapis.com/${BUCKET_NAME}/index.html
INFO
