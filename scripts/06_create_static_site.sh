#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID=${PROJECT_ID:?"Defina PROJECT_ID"}
BUCKET_NAME=${BUCKET_NAME:?"Defina BUCKET_NAME (ex: ipam-dashboard-static)"}
REGION=${REGION:-us-central1}

# Cria bucket e habilita hosting estático.

gcloud storage buckets create "gs://${BUCKET_NAME}" \
  --project "${PROJECT_ID}" \
  --location "${REGION}" \
  --uniform-bucket-level-access

gcloud storage buckets update "gs://${BUCKET_NAME}" \
  --website-main-page-suffix index.html \
  --website-not-found-page index.html

# Permite leitura pública dos objetos (para acesso direto).

gcloud storage buckets add-iam-policy-binding "gs://${BUCKET_NAME}" \
  --member="allUsers" \
  --role="roles/storage.objectViewer"

cat <<INFO
Bucket criado: gs://${BUCKET_NAME}
Hospedagem estática habilitada.
INFO
