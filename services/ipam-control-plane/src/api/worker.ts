import { FastifyInstance } from "fastify";
import { withTransaction } from "../db/pool.js";
import { discoveryFlow, DiscoveryPayload } from "../flows/discoveryFlow/discoveryFlow.js";
import { updateJobStatus } from "../db/jobs.js";
import { config } from "../utils/config.js";
import { AppError } from "../utils/errors.js";

function isAuthorized(request: { headers: Record<string, string | string[] | undefined> }): boolean {
  const token = request.headers["x-tasks-token"];
  if (!config.tasksAuthToken) {
    return false;
  }
  if (Array.isArray(token)) {
    return token.includes(config.tasksAuthToken);
  }
  return token === config.tasksAuthToken;
}

export async function workerRoutes(app: FastifyInstance) {
  app.post("/worker/discovery", async (request, reply) => {
    if (!isAuthorized(request)) {
      throw new AppError("UNAUTHORIZED_WORKER", 401, "Token inválido para worker");
    }
    const body = request.body as DiscoveryPayload;
    if (!body?.jobId || !body?.hostProjectId) {
      throw new AppError("VALIDATION_ERROR", 400, "Payload inválido");
    }
    try {
      await withTransaction((client) => discoveryFlow(client, body));
      return reply.send({ ok: true });
    } catch (error) {
      const message = (error as Error).message;
      await withTransaction((client) => updateJobStatus(client, body.jobId, "failed", { error: message }, message));
      return reply.status(500).send({ error: message });
    }
  });

  app.post("/worker/expiration", async (request, reply) => {
    if (!isAuthorized(request)) {
      throw new AppError("UNAUTHORIZED_WORKER", 401, "Token inválido para worker");
    }
    if (!config.enableExpirationWorker) {
      throw new AppError("INTERNAL", 501, "Processo de expiração não habilitado");
    }
    return reply.status(200).send({ ok: true });
  });
}
