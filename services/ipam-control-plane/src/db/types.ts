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
  status: "reserved" | "active" | "released";
  owner: string | null;
  purpose: string | null;
  host_project_id: string | null;
  network: string | null;
  region: string | null;
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
};
