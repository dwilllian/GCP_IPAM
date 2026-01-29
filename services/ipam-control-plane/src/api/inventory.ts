import { FastifyInstance } from "fastify";
import { withTransaction } from "../db/pool.js";
import { listUsedCidrs } from "../db/inventory.js";
import { cidrToFirstLast } from "../utils/cidr.js";
import { findCidrConflicts } from "../db/inventory.js";
import { AppError } from "../utils/errors.js";

export async function inventoryRoutes(app: FastifyInstance) {
  app.get("/inventory/used-cidrs", async (request, reply) => {
    const query = request.query as {
      projectId?: string;
      region?: string;
      network?: string;
      source?: string;
      limit?: string;
      offset?: string;
    };
    const limit = query.limit ? Math.min(Number(query.limit), 200) : 100;
    const offset = query.offset ? Number(query.offset) : 0;
    const rows = await withTransaction((client) =>
      listUsedCidrs(client, {
        projectId: query.projectId,
        region: query.region,
        network: query.network,
        source: query.source,
        limit,
        offset
      })
    );
    return reply.send(rows);
  });

  app.get("/inventory/conflicts", async (request, reply) => {
    const query = request.query as { cidr?: string };
    if (!query.cidr) {
      throw new AppError("VALIDATION_ERROR", 400, "Campo obrigatório: cidr");
    }
    const range = cidrToFirstLast(query.cidr);
    const rows = await withTransaction((client) => findCidrConflicts(client, range.firstIp, range.lastIp));
    return reply.send({ cidr: query.cidr, conflicts: rows });
  });

  app.get("/inventory/subnets", async (request, reply) => {
    const query = request.query as { hostProjectId?: string; region?: string; network?: string };
    const rows = await withTransaction((client) =>
      listUsedCidrs(client, {
        projectId: query.hostProjectId,
        region: query.region,
        network: query.network,
        source: "subnet_primary"
      })
    );
    return reply.send(rows);
  });

  app.get("/inventory/routes", async (request, reply) => {
    const query = request.query as { projectId?: string };
    const rows = await withTransaction((client) =>
      listUsedCidrs(client, {
        projectId: query.projectId,
        source: "route_static"
      })
    );
    return reply.send(rows);
  });
}
