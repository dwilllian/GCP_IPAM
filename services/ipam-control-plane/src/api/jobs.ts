import { FastifyInstance } from "fastify";
import { withTransaction } from "../db/pool.js";
import { getJobById } from "../db/jobs.js";
import { runDiscovery } from "../flows/discoveryFlow/runDiscovery.js";

export async function jobsRoutes(app: FastifyInstance) {
  app.post("/jobs/discovery/run", async (request, reply) => {
    const body = request.body as { scope?: "org" | "projects"; projects?: string[] };
    if (!body?.scope) {
      return reply.status(400).send({ error: "Campo obrigatório: scope" });
    }
    if (body.scope === "projects" && (!body.projects || body.projects.length === 0)) {
      return reply.status(400).send({ error: "Para scope=projects informe projects[]" });
    }
    const job = await withTransaction((client) => runDiscovery(client, body));
    return reply.status(201).send(job);
  });

  app.get("/jobs/:id", async (request, reply) => {
    const params = request.params as { id: string };
    const job = await withTransaction((client) => getJobById(client, params.id));
    if (!job) {
      return reply.status(404).send({ error: "Job não encontrado" });
    }
    return reply.send(job);
  });
}
