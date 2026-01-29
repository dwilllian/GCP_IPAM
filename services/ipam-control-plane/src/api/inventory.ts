import { FastifyInstance } from "fastify";
import { withTransaction } from "../db/pool.js";
import { listUsedCidrs } from "../db/inventory.js";

export async function inventoryRoutes(app: FastifyInstance) {
  app.get("/inventory/used-cidrs", async (request, reply) => {
    const query = request.query as { projectId?: string; region?: string; network?: string };
    const rows = await withTransaction((client) =>
      listUsedCidrs(client, {
        projectId: query.projectId,
        region: query.region,
        network: query.network
      })
    );
    return reply.send(rows);
  });

  app.get("/inventory/subnets", async (request, reply) => {
    const query = request.query as { hostProjectId?: string; region?: string; network?: string };
    const rows = await withTransaction((client) =>
      listUsedCidrs(client, {
        projectId: query.hostProjectId,
        region: query.region,
        network: query.network,
        sourceType: "subnet_primary"
      })
    );
    return reply.send(rows);
  });

  app.get("/inventory/routes", async (request, reply) => {
    const query = request.query as { projectId?: string };
    const rows = await withTransaction((client) =>
      listUsedCidrs(client, {
        projectId: query.projectId,
        sourceType: "route_static"
      })
    );
    return reply.send(rows);
  });
}
