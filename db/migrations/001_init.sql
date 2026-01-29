CREATE TABLE IF NOT EXISTS ipam_pools (
  id uuid PRIMARY KEY,
  name text UNIQUE NOT NULL,
  parent_cidr cidr NOT NULL,
  allowed_prefixes int[] NOT NULL,
  cursor_ip inet NOT NULL,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ipam_allocations (
  id uuid PRIMARY KEY,
  pool_id uuid REFERENCES ipam_pools(id) ON DELETE CASCADE,
  cidr cidr NOT NULL,
  first_ip bigint NOT NULL,
  last_ip bigint NOT NULL,
  status text NOT NULL CHECK (status IN ('reserved','created','deleted')),
  owner text,
  purpose text,
  host_project_id text NOT NULL,
  service_project_id text,
  network text NOT NULL,
  region text NOT NULL,
  metadata jsonb,
  expires_at timestamptz,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW(),
  CONSTRAINT unique_active_cidr UNIQUE (cidr, status) DEFERRABLE INITIALLY IMMEDIATE
);

CREATE TABLE IF NOT EXISTS inv_used_cidrs (
  id bigserial PRIMARY KEY,
  source text NOT NULL CHECK (source IN ('subnet_primary','subnet_secondary','route_static','allocation')),
  project_id text NOT NULL,
  network text,
  region text,
  cidr cidr NOT NULL,
  first_ip bigint NOT NULL,
  last_ip bigint NOT NULL,
  resource_id text NOT NULL,
  meta jsonb,
  updated_at timestamptz DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS inv_used_cidrs_unique
  ON inv_used_cidrs (source, project_id, region, cidr, resource_id);

CREATE INDEX IF NOT EXISTS inv_used_cidrs_range_idx ON inv_used_cidrs (first_ip, last_ip);
CREATE INDEX IF NOT EXISTS inv_used_cidrs_project_idx ON inv_used_cidrs (project_id);
CREATE INDEX IF NOT EXISTS inv_used_cidrs_source_idx ON inv_used_cidrs (source);

CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY,
  type text NOT NULL,
  status text NOT NULL CHECK (status IN ('queued','running','done','failed')),
  payload jsonb NOT NULL,
  result jsonb,
  attempts int DEFAULT 0,
  last_error text,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_events (
  id bigserial PRIMARY KEY,
  ts timestamptz DEFAULT NOW(),
  actor text,
  action text NOT NULL,
  request jsonb,
  result jsonb,
  ok boolean,
  request_id text
);
