import { FastifyInstance } from "fastify";
import { ipamRequest } from "../gcp/ipam.js";

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
      return reply.status(400).send({ error: "Campo obrigatório: path" });
    }
    try {
      const response = await ipamRequest({
        method: payload.method ?? "GET",
        path: payload.path,
        query: payload.query,
        body: payload.body
      });
      return reply.status(response.status).send(response.data);
    } catch (error) {
      return reply.status(502).send({ error: (error as Error).message });
    }
  });
}
