import { FastifyInstance } from "fastify";
import { v4 as uuidv4 } from "uuid";
import { withTransaction } from "../db/pool.js";
import { allocateFromPool } from "../flows/creationFlow/allocateFromPool.js";
import { listPools, insertPool } from "../db/pools.js";
import { listAllocations, listAllocationConflicts } from "../db/allocations.js";
import { findCidrConflicts } from "../db/inventory.js";
import { firstUsableIp } from "../utils/cidr.js";

export async function ipamRoutes(app: FastifyInstance) {
  app.get("/ipam/pools", async (_request, reply) => {
    const pools = await withTransaction((client) => listPools(client));
    return reply.send(pools);
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
      network?: string;
      owner?: string;
      purpose?: string;
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
          network: body.network,
          owner: body.owner,
          purpose: body.purpose
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
