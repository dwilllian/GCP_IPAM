import { FastifyInstance } from "fastify";
import { v4 as uuidv4 } from "uuid";
import { withTransaction } from "../db/pool.js";
import { allocateFromPool } from "../flows/creationFlow/allocateFromPool.js";
import { getPoolByName, insertPool, listPools } from "../db/pools.js";
import { listAllocationConflicts, listAllocations, listAllocationsByPool } from "../db/allocations.js";
import { findCidrConflicts } from "../db/inventory.js";
import { cidrSize, cidrToFirstLast, firstUsableIp } from "../utils/cidr.js";
import { AppError } from "../utils/errors.js";

export async function ipamRoutes(app: FastifyInstance) {
  app.get("/ipam/pools", async (_request, reply) => {
    const pools = await withTransaction((client) => listPools(client));
    return reply.send(pools);
  });

  app.get("/ipam/pools/:name/summary", async (request, reply) => {
    const params = request.params as { name?: string };
    if (!params?.name) {
      throw new AppError("VALIDATION_ERROR", 400, "Campo obrigatório: name");
    }
    const summary = await withTransaction(async (client) => {
      const pool = await getPoolByName(client, params.name!);
      if (!pool) {
        return null;
      }
      const allocations = await listAllocationsByPool(client, pool.id);
      return { pool, allocations };
    });
    if (!summary) {
      throw new AppError("POOL_NOT_FOUND", 404, "Pool não encontrado");
    }

    const totalAddresses = cidrSize(summary.pool.parent_cidr);
    let createdAddresses = 0n;
    let reservedAddresses = 0n;
    let deletedAddresses = 0n;
    let createdCount = 0;
    let reservedCount = 0;
    let deletedCount = 0;
    const byPrefix: Record<string, number> = {};

    for (const allocation of summary.allocations) {
      const size = cidrSize(allocation.cidr);
      const prefixLength = allocation.cidr.split("/")[1] ?? "";
      if (prefixLength) {
        byPrefix[prefixLength] = (byPrefix[prefixLength] ?? 0) + 1;
      }
      if (allocation.status === "created") {
        createdAddresses += size;
        createdCount += 1;
      } else if (allocation.status === "reserved") {
        reservedAddresses += size;
        reservedCount += 1;
      } else {
        deletedAddresses += size;
        deletedCount += 1;
      }
    }

    const usedAddresses = createdAddresses + reservedAddresses;
    const availableAddresses = totalAddresses - usedAddresses;
    const utilizationPercent =
      totalAddresses === 0n ? 0 : Number((usedAddresses * 10000n) / totalAddresses) / 100;

    return reply.send({
      pool: summary.pool,
      totalIps: totalAddresses.toString(),
      usedIps: usedAddresses.toString(),
      freeIps: availableAddresses.toString(),
      utilizationPct: utilizationPercent,
      countsByStatus: {
        reserved: { count: reservedCount, addresses: reservedAddresses.toString() },
        created: { count: createdCount, addresses: createdAddresses.toString() },
        deleted: { count: deletedCount, addresses: deletedAddresses.toString() }
      },
      countsByPrefix: byPrefix
    });
  });

  app.post("/ipam/pools", async (request, reply) => {
    const body = request.body as { name?: string; parentCidr?: string; allowedPrefixes?: number[] };
    if (!body?.name || !body.parentCidr || !body.allowedPrefixes?.length) {
      throw new AppError(
        "VALIDATION_ERROR",
        400,
        "Campos obrigatórios: name, parentCidr, allowedPrefixes"
      );
    }
    const { name, parentCidr, allowedPrefixes } = body;
    const pool = await withTransaction((client) =>
      insertPool(client, {
        id: uuidv4(),
        name,
        parent_cidr: parentCidr,
        allowed_prefixes: allowedPrefixes,
        cursor_ip: firstUsableIp(parentCidr)
      })
    );
    return reply.status(201).send(pool);
  });

  app.post("/ipam/allocate", async (request, reply) => {
    const body = request.body as {
      poolName?: string;
      prefixLength?: number;
      region?: string;
      hostProjectId?: string;
      serviceProjectId?: string;
      network?: string;
      owner?: string;
      purpose?: string;
      metadata?: Record<string, unknown>;
      expiresAt?: string;
      dryRun?: boolean;
    };
    if (!body?.poolName || !body.prefixLength || !body.region || !body.hostProjectId || !body.network) {
      throw new AppError(
        "VALIDATION_ERROR",
        400,
        "Campos obrigatórios: poolName, prefixLength, region, hostProjectId, network"
      );
    }
    const { poolName, prefixLength, region, hostProjectId, network } = body;
    try {
      const result = await withTransaction((client) =>
        allocateFromPool(client, {
          poolName,
          prefixLength,
          region,
          hostProjectId,
          serviceProjectId: body.serviceProjectId,
          network,
          owner: body.owner,
          purpose: body.purpose,
          metadata: body.metadata,
          expiresAt: body.expiresAt,
          dryRun: body.dryRun
        })
      );
      return reply.status(201).send(result);
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes("Nenhum bloco livre")) {
        throw new AppError("NO_AVAILABLE_BLOCK", 409, message);
      }
      if (message.includes("Pool não encontrado")) {
        throw new AppError("POOL_NOT_FOUND", 404, message);
      }
      if (message.includes("Prefixo não permitido")) {
        throw new AppError("INVALID_PREFIX", 400, message);
      }
      throw new AppError("INTERNAL", 500, message);
    }
  });

  app.post("/ipam/validate-cidr", async (request, reply) => {
    const body = request.body as { cidr?: string };
    if (!body?.cidr) {
      throw new AppError("VALIDATION_ERROR", 400, "Campo obrigatório: cidr");
    }
    const range = cidrToFirstLast(body.cidr);
    const conflicts = await withTransaction(async (client) => {
      const inventory = await findCidrConflicts(client, range.firstIp, range.lastIp);
      const allocations = await listAllocationConflicts(client, range.firstIp, range.lastIp);
      return { inventory, allocations };
    });
    if (conflicts.inventory.length > 0 || conflicts.allocations.length > 0) {
      return reply.send({
        status: "CONFLICT",
        conflicts: [
          ...conflicts.inventory,
          ...conflicts.allocations.map((allocation) => ({
            source_type: "allocation",
            cidr: allocation.cidr,
            project_id: allocation.host_project_id,
            network: allocation.network,
            region: allocation.region,
            resource_name: allocation.owner,
            self_link: null,
            meta: {
              allocationId: allocation.id,
              status: allocation.status,
              purpose: allocation.purpose
            }
          }))
        ]
      });
    }
    return reply.send({ status: "FREE", conflicts: [] });
  });

  app.get("/ipam/allocations", async (_request, reply) => {
    const allocations = await withTransaction((client) => listAllocations(client));
    return reply.send(allocations);
  });
}
