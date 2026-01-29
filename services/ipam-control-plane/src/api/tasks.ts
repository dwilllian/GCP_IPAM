import { FastifyInstance } from "fastify";
import { withTransaction } from "../db/pool.js";
import { handleTask, TaskPayload } from "../flows/taskHandler.js";
import { updateJobStatus } from "../db/jobs.js";

export async function taskRoutes(app: FastifyInstance) {
  app.post("/tasks/execute", async (request, reply) => {
    const body = request.body as TaskPayload;
    if (!body?.type || !body?.jobId) {
      return reply.status(400).send({ error: "Payload inválido" });
    }
    try {
      await withTransaction((client) => handleTask(client, body));
      return reply.send({ ok: true });
    } catch (error) {
      const message = (error as Error).message;
      await withTransaction((client) => updateJobStatus(client, body.jobId, "failed", { error: message }));
      return reply.status(500).send({ error: message });
    }
  });
}
