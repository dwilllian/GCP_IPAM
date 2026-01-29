import { FastifyInstance } from "fastify";
import { ipamRequest } from "../gcp/ipam.js";
import { withTransaction } from "../db/pool.js";
import { insertAudit } from "../db/audit.js";
import { AppError } from "../utils/errors.js";

type ProxyBody = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  path?: string;
  query?: Record<string, string>;
  body?: unknown;
};

export async function gcpIpamRoutes(app: FastifyInstance) {
  app.post("/gcp/ipam/proxy", async (request, reply) => {
    const payload = request.body as ProxyBody;
    if (!payload?.path) {
      throw new AppError("VALIDATION_ERROR", 400, "Campo obrigatório: path");
    }
    try {
      const response = await ipamRequest({
        method: payload.method ?? "GET",
        path: payload.path,
        query: payload.query,
        body: payload.body
      });
      await withTransaction((client) =>
        insertAudit(client, {
          actor: null,
          action: "gcp_ipam_proxy",
          request: payload,
          result: { status: response.status },
          ok: true,
          request_id: request.id
        })
      );
      return reply.status(response.status).send(response.data);
    } catch (error) {
      const message = (error as Error).message;
      await withTransaction((client) =>
        insertAudit(client, {
          actor: null,
          action: "gcp_ipam_proxy",
          request: payload,
          result: { error: message },
          ok: false,
          request_id: request.id
        })
      );
      throw new AppError("INTERNAL", 502, message);
    }
  });
}
