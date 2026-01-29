ALTER TABLE ipam_allocations
  ADD COLUMN IF NOT EXISTS service_project_id text,
  ADD COLUMN IF NOT EXISTS metadata jsonb,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;

CREATE INDEX IF NOT EXISTS ipam_allocations_expires_at_idx
  ON ipam_allocations (expires_at);
