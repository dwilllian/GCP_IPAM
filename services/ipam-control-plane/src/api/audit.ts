import { FastifyInstance } from "fastify";
import { withTransaction } from "../db/pool.js";
import { listAudit } from "../db/audit.js";

export async function auditRoutes(app: FastifyInstance) {
  app.get("/audit", async (_request, reply) => {
    const rows = await withTransaction((client) => listAudit(client));
    return reply.send(rows);
  });
}
