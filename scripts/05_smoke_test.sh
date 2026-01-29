#!/usr/bin/env bash
set -euo pipefail

BASE_URL=${BASE_URL:?"Defina BASE_URL"}

curl -sS "${BASE_URL}/health"

curl -sS -X POST "${BASE_URL}/ipam/pools" \
  -H "Content-Type: application/json" \
  -d '{"name":"shared-prod","parentCidr":"10.0.0.0/8","allowedPrefixes":[22,24]}'

curl -sS -X POST "${BASE_URL}/ipam/allocate" \
  -H "Content-Type: application/json" \
  -d '{"poolName":"shared-prod","prefixLength":24,"region":"us-central1","hostProjectId":"host-project","network":"default","dryRun":true}'

curl -sS -X POST "${BASE_URL}/ipam/allocate" \
  -H "Content-Type: application/json" \
  -d '{"poolName":"shared-prod","prefixLength":24,"region":"us-central1","hostProjectId":"host-project","network":"default"}'

curl -sS "${BASE_URL}/ipam/allocations"

curl -sS "${BASE_URL}/ipam/pools/shared-prod/summary"
