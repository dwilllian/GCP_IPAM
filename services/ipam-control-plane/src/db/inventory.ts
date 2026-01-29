import { PoolClient } from "pg";

type UsedCidrRow = {
  id: number;
  project_id: string | null;
  folder_id: string | null;
  network: string | null;
  region: string | null;
  source_type: string;
  cidr: string;
  resource_name: string | null;
  self_link: string | null;
  meta: unknown;
  updated_at: string;
};

export async function upsertUsedCidr(
  client: PoolClient,
  row: Omit<UsedCidrRow, "id" | "updated_at">
): Promise<void> {
  await client.query(
    `INSERT INTO inv_used_cidrs
      (project_id, folder_id, network, region, source_type, cidr, resource_name, self_link, meta)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     ON CONFLICT (source_type, cidr, resource_name)
     DO UPDATE SET
       project_id = EXCLUDED.project_id,
       folder_id = EXCLUDED.folder_id,
       network = EXCLUDED.network,
       region = EXCLUDED.region,
       self_link = EXCLUDED.self_link,
       meta = EXCLUDED.meta,
       updated_at = NOW()`,
    [
      row.project_id,
      row.folder_id,
      row.network,
      row.region,
      row.source_type,
      row.cidr,
      row.resource_name,
      row.self_link,
      row.meta
    ]
  );
}

export async function listUsedCidrs(
  client: PoolClient,
  filters: Partial<{ projectId: string; region: string; network: string; sourceType: string }>
): Promise<UsedCidrRow[]> {
  const conditions: string[] = [];
  const values: string[] = [];
  if (filters.sourceType) {
    values.push(filters.sourceType);
    conditions.push(`source_type = $${values.length}`);
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
  const result = await client.query<UsedCidrRow>(
    `SELECT * FROM inv_used_cidrs ${where} ORDER BY updated_at DESC`,
    values
  );
  return result.rows;
}

export async function findCidrConflicts(client: PoolClient, cidr: string): Promise<UsedCidrRow[]> {
  const result = await client.query<UsedCidrRow>(
    `SELECT * FROM inv_used_cidrs WHERE cidr && $1::cidr ORDER BY updated_at DESC`,
    [cidr]
  );
  return result.rows;
}
