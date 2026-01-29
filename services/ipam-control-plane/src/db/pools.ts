import { PoolClient } from "pg";
import { PoolRow } from "./types.js";

export async function listPools(client: PoolClient): Promise<PoolRow[]> {
  const result = await client.query<PoolRow>("SELECT * FROM ipam_pools ORDER BY name ASC");
  return result.rows;
}

export async function getPoolByName(client: PoolClient, name: string): Promise<PoolRow | null> {
  const result = await client.query<PoolRow>("SELECT * FROM ipam_pools WHERE name = $1", [name]);
  return result.rows[0] ?? null;
}

export async function insertPool(
  client: PoolClient,
  pool: Pick<PoolRow, "id" | "name" | "parent_cidr" | "allowed_prefixes" | "cursor_ip">
): Promise<PoolRow> {
  const result = await client.query<PoolRow>(
    `INSERT INTO ipam_pools (id, name, parent_cidr, allowed_prefixes, cursor_ip)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [pool.id, pool.name, pool.parent_cidr, pool.allowed_prefixes, pool.cursor_ip]
  );
  return result.rows[0];
}

export async function updatePoolCursor(client: PoolClient, id: string, cursorIp: string): Promise<void> {
  await client.query(
    "UPDATE ipam_pools SET cursor_ip = $1, updated_at = NOW() WHERE id = $2",
    [cursorIp, id]
  );
}
