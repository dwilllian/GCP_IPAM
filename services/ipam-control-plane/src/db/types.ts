export type PoolRow = {
  id: string;
  name: string;
  parent_cidr: string;
  allowed_prefixes: number[];
  cursor_ip: string;
  created_at: string;
  updated_at: string;
};

export type AllocationRow = {
  id: string;
  pool_id: string;
  cidr: string;
  first_ip: string;
  last_ip: string;
  status: "reserved" | "created" | "deleted";
  owner: string | null;
  purpose: string | null;
  host_project_id: string;
  service_project_id: string | null;
  network: string;
  region: string;
  metadata: Record<string, unknown> | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};

export type JobRow = {
  id: string;
  type: string;
  status: "queued" | "running" | "done" | "failed";
  payload: unknown;
  result: unknown | null;
  attempts: number;
  last_error: string | null;
  created_at: string;
  updated_at: string;
};

export type AuditRow = {
  id: number;
  ts: string;
  actor: string | null;
  action: string;
  request: unknown;
  result: unknown;
  ok: boolean;
  request_id: string | null;
};
