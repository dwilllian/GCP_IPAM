import { FastifyInstance } from "fastify";
import { withTransaction } from "../db/pool.js";
import { listAudit } from "../db/audit.js";

export async function auditRoutes(app: FastifyInstance) {
  app.get("/audit", async (request, reply) => {
    const query = request.query as {
      action?: string;
      ok?: string;
      from?: string;
      to?: string;
      limit?: string;
      offset?: string;
    };
    const limit = query.limit ? Math.min(Number(query.limit), 200) : 100;
    const offset = query.offset ? Number(query.offset) : 0;
    const rows = await withTransaction((client) =>
      listAudit(client, {
        action: query.action,
        ok: query.ok ? query.ok === "true" : undefined,
        from: query.from,
        to: query.to,
        limit,
        offset
      })
    );
    return reply.send(rows);
  });
}
