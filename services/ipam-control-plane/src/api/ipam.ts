import { FastifyInstance } from "fastify";
import { v4 as uuidv4 } from "uuid";
import { withTransaction } from "../db/pool.js";
import { allocateFromPool } from "../flows/creationFlow/allocateFromPool.js";
import { getPoolByName, insertPool, listPools } from "../db/pools.js";
import { listAllocationConflicts, listAllocations, listAllocationsByPool } from "../db/allocations.js";
import { findCidrConflicts } from "../db/inventory.js";
import { cidrSize, firstUsableIp } from "../utils/cidr.js";

export async function ipamRoutes(app: FastifyInstance) {
  app.get("/ipam/pools", async (_request, reply) => {
    const pools = await withTransaction((client) => listPools(client));
    return reply.send(pools);
  });

  app.get("/ipam/pools/:name/summary", async (request, reply) => {
    const params = request.params as { name?: string };
    if (!params?.name) {
      return reply.status(400).send({ error: "Campo obrigatório: name" });
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
      return reply.status(404).send({ error: "Pool não encontrado" });
    }

    const totalAddresses = cidrSize(summary.pool.parent_cidr);
    let activeAddresses = 0n;
    let reservedAddresses = 0n;
    let releasedAddresses = 0n;
    let activeCount = 0;
    let reservedCount = 0;
    let releasedCount = 0;

    for (const allocation of summary.allocations) {
      const size = cidrSize(allocation.cidr);
      if (allocation.status === "active") {
        activeAddresses += size;
        activeCount += 1;
      } else if (allocation.status === "reserved") {
        reservedAddresses += size;
        reservedCount += 1;
      } else {
        releasedAddresses += size;
        releasedCount += 1;
      }
    }

    const allocatedAddresses = activeAddresses + reservedAddresses;
    const availableAddresses = totalAddresses - allocatedAddresses;
    const utilizationPercent =
      totalAddresses === 0n ? 0 : Number((allocatedAddresses * 10000n) / totalAddresses) / 100;

    return reply.send({
      pool: summary.pool,
      totals: {
        totalAddresses: totalAddresses.toString(),
        allocatedAddresses: allocatedAddresses.toString(),
        availableAddresses: availableAddresses.toString(),
        utilizationPercent
      },
      byStatus: {
        active: { count: activeCount, addresses: activeAddresses.toString() },
        reserved: { count: reservedCount, addresses: reservedAddresses.toString() },
        released: { count: releasedCount, addresses: releasedAddresses.toString() }
      }
    });
  });

  app.post("/ipam/pools", async (request, reply) => {
    const body = request.body as { name?: string; parentCidr?: string; allowedPrefixes?: number[] };
    if (!body?.name || !body.parentCidr || !body.allowedPrefixes?.length) {
      return reply.status(400).send({ error: "Campos obrigatórios: name, parentCidr, allowedPrefixes" });
    }
    const pool = await withTransaction((client) =>
      insertPool(client, {
        id: uuidv4(),
        name: body.name,
        parent_cidr: body.parentCidr,
        allowed_prefixes: body.allowedPrefixes,
        cursor_ip: firstUsableIp(body.parentCidr)
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
    };
    if (!body?.poolName || !body.prefixLength || !body.region || !body.hostProjectId || !body.network) {
      return reply.status(400).send({ error: "Campos obrigatórios: poolName, prefixLength, region, hostProjectId, network" });
    }
    try {
      const result = await withTransaction((client) =>
        allocateFromPool(client, {
          poolName: body.poolName,
          prefixLength: body.prefixLength,
          region: body.region,
          hostProjectId: body.hostProjectId,
          serviceProjectId: body.serviceProjectId,
          network: body.network,
          owner: body.owner,
          purpose: body.purpose,
          metadata: body.metadata,
          expiresAt: body.expiresAt
        })
      );
      return reply.status(201).send(result);
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes("Nenhum bloco livre")) {
        return reply.status(507).send({ error: message });
      }
      if (message.includes("Pool não encontrado") || message.includes("Prefixo não permitido")) {
        return reply.status(409).send({ error: message });
      }
      return reply.status(500).send({ error: message });
    }
  });

  app.post("/ipam/validate-cidr", async (request, reply) => {
    const body = request.body as { cidr?: string };
    if (!body?.cidr) {
      return reply.status(400).send({ error: "Campo obrigatório: cidr" });
    }
    const conflicts = await withTransaction(async (client) => {
      const inventory = await findCidrConflicts(client, body.cidr!);
      const allocations = await listAllocationConflicts(client, body.cidr!);
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
