#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID=${PROJECT_ID:?"Defina PROJECT_ID"}

gcloud services enable \
  compute.googleapis.com \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  sqladmin.googleapis.com \
  servicenetworking.googleapis.com \
  vpcaccess.googleapis.com \
  cloudtasks.googleapis.com \
  --project "${PROJECT_ID}"
