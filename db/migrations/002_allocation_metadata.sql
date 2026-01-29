ALTER TABLE ipam_allocations
  ADD COLUMN IF NOT EXISTS first_ip bigint,
  ADD COLUMN IF NOT EXISTS last_ip bigint,
  ADD COLUMN IF NOT EXISTS service_project_id text,
  ADD COLUMN IF NOT EXISTS metadata jsonb,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;

CREATE INDEX IF NOT EXISTS ipam_allocations_expires_at_idx
  ON ipam_allocations (expires_at);

CREATE INDEX IF NOT EXISTS ipam_allocations_range_idx
  ON ipam_allocations (first_ip, last_ip);

ALTER TABLE inv_used_cidrs
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS first_ip bigint,
  ADD COLUMN IF NOT EXISTS last_ip bigint,
  ADD COLUMN IF NOT EXISTS resource_id text,
  ADD COLUMN IF NOT EXISTS meta jsonb;

CREATE INDEX IF NOT EXISTS inv_used_cidrs_range_idx
  ON inv_used_cidrs (first_ip, last_ip);

CREATE INDEX IF NOT EXISTS inv_used_cidrs_project_idx
  ON inv_used_cidrs (project_id);

CREATE INDEX IF NOT EXISTS inv_used_cidrs_source_idx
  ON inv_used_cidrs (source);

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS last_error text;

ALTER TABLE audit_events
  ADD COLUMN IF NOT EXISTS request_id text;
