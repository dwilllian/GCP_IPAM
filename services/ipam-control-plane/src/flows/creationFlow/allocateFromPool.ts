import { PoolClient } from "pg";
import { v4 as uuidv4 } from "uuid";
import { candidateSubnets, nextCursorIp } from "../../utils/cidr.js";
import { existsAllocationConflict, insertAllocation } from "../../db/allocations.js";
import { findCidrConflicts } from "../../db/inventory.js";
import { getPoolByName, updatePoolCursor } from "../../db/pools.js";

export type AllocationRequest = {
  poolName: string;
  prefixLength: number;
  region: string;
  hostProjectId: string;
  serviceProjectId?: string;
  network: string;
  owner?: string;
  purpose?: string;
  metadata?: Record<string, unknown>;
  expiresAt?: string;
};

export type AllocationResult = {
  allocationId: string;
  cidr: string;
  collisionChecked: {
    inv_used_cidrs: boolean;
    routesIncluded: boolean;
  };
};

export async function allocateFromPool(client: PoolClient, payload: AllocationRequest): Promise<AllocationResult> {
  const pool = await getPoolByName(client, payload.poolName);
  if (!pool) {
    throw new Error("Pool não encontrado");
  }
  if (!pool.allowed_prefixes.includes(payload.prefixLength)) {
    throw new Error("Prefixo não permitido para o pool");
  }
  await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [payload.poolName]);

  let selectedCidr: string | null = null;
  for (const candidate of candidateSubnets(pool.parent_cidr, pool.cursor_ip, payload.prefixLength)) {
    const invConflict = await findCidrConflicts(client, candidate);
    const allocConflict = await existsAllocationConflict(client, candidate);
    if (invConflict.length === 0 && !allocConflict) {
      selectedCidr = candidate;
      break;
    }
  }

  if (!selectedCidr) {
    throw new Error("Nenhum bloco livre encontrado");
  }

  const allocation = await insertAllocation(client, {
    id: uuidv4(),
    pool_id: pool.id,
    cidr: selectedCidr,
    status: "reserved",
    owner: payload.owner ?? null,
    purpose: payload.purpose ?? null,
    host_project_id: payload.hostProjectId,
    service_project_id: payload.serviceProjectId ?? null,
    network: payload.network,
    region: payload.region,
    metadata: payload.metadata ?? null,
    expires_at: payload.expiresAt ?? null
  });

  const nextCursor = nextCursorIp(pool.parent_cidr, selectedCidr, payload.prefixLength);
  await updatePoolCursor(client, pool.id, nextCursor);

  return {
    allocationId: allocation.id,
    cidr: allocation.cidr,
    collisionChecked: {
      inv_used_cidrs: true,
      routesIncluded: true
    }
  };
}
