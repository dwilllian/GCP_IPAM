import { PoolClient } from "pg";
import { v4 as uuidv4 } from "uuid";
import { candidateSubnets, cidrToFirstLast, nextCursorIp } from "../../utils/cidr.js";
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
  dryRun?: boolean;
};

export type AllocationResult = {
  allocationId?: string;
  cidr: string;
  firstIp: string;
  lastIp: string;
  collisionChecked: {
    inv_used_cidrs: boolean;
    routesIncluded: boolean;
  };
  dryRun: boolean;
};

type AllocationDeps = {
  getPoolByName: typeof getPoolByName;
  updatePoolCursor: typeof updatePoolCursor;
  insertAllocation: typeof insertAllocation;
  findCidrConflicts: typeof findCidrConflicts;
  existsAllocationConflict: typeof existsAllocationConflict;
};

export async function allocateFromPool(
  client: PoolClient,
  payload: AllocationRequest,
  deps: AllocationDeps = {
    getPoolByName,
    updatePoolCursor,
    insertAllocation,
    findCidrConflicts,
    existsAllocationConflict
  }
): Promise<AllocationResult> {
  const pool = await deps.getPoolByName(client, payload.poolName);
  if (!pool) {
    throw new Error("Pool não encontrado");
  }
  if (!pool.allowed_prefixes.includes(payload.prefixLength)) {
    throw new Error("Prefixo não permitido para o pool");
  }
  await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [payload.poolName]);

  let selectedCidr: string | null = null;
  let selectedRange: { firstIp: string; lastIp: string } | null = null;
  for (const candidate of candidateSubnets(pool.parent_cidr, pool.cursor_ip, payload.prefixLength)) {
    const range = cidrToFirstLast(candidate);
    const invConflict = await deps.findCidrConflicts(client, range.firstIp, range.lastIp);
    const allocConflict = await deps.existsAllocationConflict(client, range.firstIp, range.lastIp);
    if (invConflict.length === 0 && !allocConflict) {
      selectedCidr = candidate;
      selectedRange = range;
      break;
    }
  }

  if (!selectedCidr) {
    throw new Error("Nenhum bloco livre encontrado");
  }

  if (!selectedRange) {
    throw new Error("Falha ao calcular o range do CIDR selecionado");
  }

  let allocationId: string | undefined;
  if (!payload.dryRun) {
    const allocation = await deps.insertAllocation(client, {
      id: uuidv4(),
      pool_id: pool.id,
      cidr: selectedCidr,
      first_ip: selectedRange.firstIp,
      last_ip: selectedRange.lastIp,
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
    allocationId = allocation.id;

    const nextCursor = nextCursorIp(pool.parent_cidr, selectedCidr, payload.prefixLength);
    await deps.updatePoolCursor(client, pool.id, nextCursor);
  }

  return {
    allocationId,
    cidr: selectedCidr,
    firstIp: selectedRange.firstIp,
    lastIp: selectedRange.lastIp,
    collisionChecked: {
      inv_used_cidrs: true,
      routesIncluded: true
    },
    dryRun: payload.dryRun ?? false
  };
}
