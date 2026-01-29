#!/usr/bin/env bash
set -euo pipefail

: "${API_BASE_URL:?Defina API_BASE_URL (ex: https://ipam-control-plane-xxxxx-uc.a.run.app)}"
: "${GCP_IPAM_PROXY_PATH:?Defina GCP_IPAM_PROXY_PATH (ex: /v1/projects/PROJECT_ID/locations/LOCATION/ipamRanges)}"

METHOD=${METHOD:-GET}
PAGE_SIZE=${PAGE_SIZE:-50}

curl -sS -X POST "${API_BASE_URL}/gcp/ipam/proxy" \
  -H "Content-Type: application/json" \
  -d "$(cat <<JSON
{
  \"method\": \"${METHOD}\",
  \"path\": \"${GCP_IPAM_PROXY_PATH}\",
  \"query\": {
    \"pageSize\": \"${PAGE_SIZE}\"
  }
}
JSON
)"
