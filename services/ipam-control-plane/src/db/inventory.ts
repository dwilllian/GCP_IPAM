import { PoolClient } from "pg";

type UsedCidrRow = {
  id: number;
  project_id: string;
  network: string | null;
  region: string | null;
  source: string;
  cidr: string;
  first_ip: string;
  last_ip: string;
  resource_id: string;
  meta: unknown;
  updated_at: string;
};

export async function upsertUsedCidr(
  client: PoolClient,
  row: Omit<UsedCidrRow, "id" | "updated_at">
): Promise<void> {
  await client.query(
    `INSERT INTO inv_used_cidrs
      (project_id, network, region, source, cidr, first_ip, last_ip, resource_id, meta)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     ON CONFLICT (source, project_id, region, cidr, resource_id)
     DO UPDATE SET
       project_id = EXCLUDED.project_id,
       network = EXCLUDED.network,
       region = EXCLUDED.region,
       source = EXCLUDED.source,
       first_ip = EXCLUDED.first_ip,
       last_ip = EXCLUDED.last_ip,
       resource_id = EXCLUDED.resource_id,
       meta = EXCLUDED.meta,
       updated_at = NOW()`,
    [
      row.project_id,
      row.network,
      row.region,
      row.source,
      row.cidr,
      row.first_ip,
      row.last_ip,
      row.resource_id,
      row.meta
    ]
  );
}

export async function listUsedCidrs(
  client: PoolClient,
  filters: Partial<{ projectId: string; region: string; network: string; source: string; limit: number; offset: number }>
): Promise<UsedCidrRow[]> {
  const conditions: string[] = [];
  const values: Array<string | number> = [];
  if (filters.source) {
    values.push(filters.source);
    conditions.push(`source = $${values.length}`);
  }
  if (filters.projectId) {
    values.push(filters.projectId);
    conditions.push(`project_id = $${values.length}`);
  }
  if (filters.region) {
    values.push(filters.region);
    conditions.push(`region = $${values.length}`);
  }
  if (filters.network) {
    values.push(filters.network);
    conditions.push(`network = $${values.length}`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  let limitClause = "";
  let offsetClause = "";
  if (typeof filters.limit === "number") {
    values.push(filters.limit);
    limitClause = `LIMIT $${values.length}`;
  }
  if (typeof filters.offset === "number") {
    values.push(filters.offset);
    offsetClause = `OFFSET $${values.length}`;
  }
  const result = await client.query<UsedCidrRow>(
    `SELECT * FROM inv_used_cidrs ${where} ORDER BY updated_at DESC ${limitClause} ${offsetClause}`,
    values
  );
  return result.rows;
}

export async function findCidrConflicts(
  client: PoolClient,
  firstIp: string,
  lastIp: string
): Promise<UsedCidrRow[]> {
  const result = await client.query<UsedCidrRow>(
    `SELECT * FROM inv_used_cidrs WHERE first_ip <= $1 AND last_ip >= $2 ORDER BY updated_at DESC`,
    [lastIp, firstIp]
  );
  return result.rows;
}

export async function deleteUsedCidrsByProject(client: PoolClient, projectId: string): Promise<void> {
  await client.query("DELETE FROM inv_used_cidrs WHERE project_id = $1", [projectId]);
}
