#!/usr/bin/env bash
set -euo pipefail

BASE_URL=${BASE_URL:?"Defina BASE_URL"}

curl -sS "${BASE_URL}/health"

curl -sS -X POST "${BASE_URL}/ipam/pools" \
  -H "Content-Type: application/json" \
  -d '{"name":"shared-prod","parentCidr":"10.0.0.0/8","allowedPrefixes":[22,24]}'

curl -sS -X POST "${BASE_URL}/jobs/discovery/run" \
  -H "Content-Type: application/json" \
  -d '{"scope":"projects","projects":["example-project-1"]}'
