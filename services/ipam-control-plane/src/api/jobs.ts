import { FastifyInstance } from "fastify";
import { withTransaction } from "../db/pool.js";
import { getJobById } from "../db/jobs.js";
import { runDiscovery } from "../flows/discoveryFlow/runDiscovery.js";
import { AppError } from "../utils/errors.js";

export async function jobsRoutes(app: FastifyInstance) {
  app.post("/jobs/discovery/run", async (request, reply) => {
    const body = request.body as { hostProjectId?: string; projectIds?: string[]; regions?: string[] };
    if (!body?.hostProjectId) {
      throw new AppError("VALIDATION_ERROR", 400, "Campo obrigatório: hostProjectId");
    }
    const hostProjectId = body.hostProjectId as string;
    const job = await withTransaction((client) =>
      runDiscovery(client, {
        hostProjectId,
        projectIds: body.projectIds,
        regions: body.regions
      })
    );
    return reply.status(201).send(job);
  });

  app.get("/jobs/:id", async (request, reply) => {
    const params = request.params as { id: string };
    const jobRecord = await withTransaction((client) => getJobById(client, params.id));
    if (!jobRecord) {
      throw new AppError("VALIDATION_ERROR", 404, "Job não encontrado");
    }
    return reply.send(jobRecord);
  });
}
