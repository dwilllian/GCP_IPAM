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
  status text NOT NULL CHECK (status IN ('reserved','active','released')),
  owner text,
  purpose text,
  host_project_id text,
  network text,
  region text,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW(),
  CONSTRAINT unique_active_cidr UNIQUE (cidr) DEFERRABLE INITIALLY IMMEDIATE
);

CREATE TABLE IF NOT EXISTS inv_used_cidrs (
  id bigserial PRIMARY KEY,
  project_id text,
  folder_id text,
  network text,
  region text,
  source_type text NOT NULL CHECK (source_type IN ('subnet_primary','subnet_secondary','route_static','reserved','allocation')),
  cidr cidr NOT NULL,
  resource_name text,
  self_link text,
  meta jsonb,
  updated_at timestamptz DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS inv_used_cidrs_unique
  ON inv_used_cidrs (source_type, cidr, resource_name);

CREATE INDEX IF NOT EXISTS inv_used_cidrs_cidr_gist ON inv_used_cidrs USING gist (cidr);

CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY,
  type text NOT NULL,
  status text NOT NULL CHECK (status IN ('queued','running','done','failed')),
  payload jsonb NOT NULL,
  result jsonb,
  attempts int DEFAULT 0,
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
  ok boolean
);
