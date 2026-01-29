import { PoolClient } from "pg";
import { AllocationRow } from "./types.js";

export async function listAllocations(client: PoolClient): Promise<AllocationRow[]> {
  const result = await client.query<AllocationRow>("SELECT * FROM ipam_allocations ORDER BY created_at DESC");
  return result.rows;
}

export async function getAllocationById(client: PoolClient, id: string): Promise<AllocationRow | null> {
  const result = await client.query<AllocationRow>("SELECT * FROM ipam_allocations WHERE id = $1", [id]);
  return result.rows[0] ?? null;
}

export async function insertAllocation(
  client: PoolClient,
  allocation: Pick<
    AllocationRow,
    "id" | "pool_id" | "cidr" | "status" | "owner" | "purpose" | "host_project_id" | "network" | "region"
  >
): Promise<AllocationRow> {
  const result = await client.query<AllocationRow>(
    `INSERT INTO ipam_allocations
      (id, pool_id, cidr, status, owner, purpose, host_project_id, network, region)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING *`,
    [
      allocation.id,
      allocation.pool_id,
      allocation.cidr,
      allocation.status,
      allocation.owner,
      allocation.purpose,
      allocation.host_project_id,
      allocation.network,
      allocation.region
    ]
  );
  return result.rows[0];
}

export async function updateAllocationStatus(
  client: PoolClient,
  id: string,
  status: AllocationRow["status"]
): Promise<void> {
  await client.query(
    "UPDATE ipam_allocations SET status = $1, updated_at = NOW() WHERE id = $2",
    [status, id]
  );
}

export async function updateAllocationNetworkData(
  client: PoolClient,
  id: string,
  update: Partial<Pick<AllocationRow, "host_project_id" | "network" | "region">>
): Promise<void> {
  await client.query(
    "UPDATE ipam_allocations SET host_project_id = $1, network = $2, region = $3, updated_at = NOW() WHERE id = $4",
    [update.host_project_id ?? null, update.network ?? null, update.region ?? null, id]
  );
}

export async function existsAllocationConflict(client: PoolClient, cidr: string): Promise<boolean> {
  const result = await client.query<{ exists: boolean }>(
    `SELECT EXISTS(
        SELECT 1 FROM ipam_allocations
        WHERE status IN ('reserved','active') AND cidr && $1::cidr
        LIMIT 1
     ) AS exists`,
    [cidr]
  );
  return result.rows[0]?.exists ?? false;
}

export async function listAllocationConflicts(client: PoolClient, cidr: string): Promise<AllocationRow[]> {
  const result = await client.query<AllocationRow>(
    `SELECT * FROM ipam_allocations
     WHERE status IN ('reserved','active') AND cidr && $1::cidr
     ORDER BY updated_at DESC`,
    [cidr]
  );
  return result.rows;
}
