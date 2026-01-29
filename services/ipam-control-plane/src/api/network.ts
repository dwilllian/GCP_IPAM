import { FastifyInstance } from "fastify";
import { v4 as uuidv4 } from "uuid";
import { withTransaction } from "../db/pool.js";
import { insertJob } from "../db/jobs.js";
import { enqueueTask } from "../utils/tasks.js";

export async function networkRoutes(app: FastifyInstance) {
  app.post("/network/subnets/create", async (request, reply) => {
    const body = request.body as {
      allocationId?: string;
      subnetName?: string;
      enablePrivateGoogleAccess?: boolean;
      secondaryRanges?: { name: string; cidr: string }[];
    };
    if (!body?.allocationId || !body.subnetName) {
      return reply.status(400).send({ error: "Campos obrigatórios: allocationId, subnetName" });
    }
    const jobId = uuidv4();
    const job = await withTransaction((client) =>
      insertJob(client, {
        id: jobId,
        type: "subnet_create",
        status: "queued",
        payload: body
      })
    );
    await enqueueTask({
      type: "subnet_create",
      jobId,
      allocationId: body.allocationId,
      subnetName: body.subnetName,
      enablePrivateGoogleAccess: body.enablePrivateGoogleAccess,
      secondaryRanges: body.secondaryRanges
    });
    return reply.status(202).send(job);
  });

  app.delete("/network/subnets", async (request, reply) => {
    const body = request.body as { hostProjectId?: string; region?: string; subnetName?: string; allocationId?: string };
    if (!body?.hostProjectId || !body.region || !body.subnetName) {
      return reply.status(400).send({ error: "Campos obrigatórios: hostProjectId, region, subnetName" });
    }
    const jobId = uuidv4();
    const job = await withTransaction((client) =>
      insertJob(client, {
        id: jobId,
        type: "subnet_delete",
        status: "queued",
        payload: body
      })
    );
    await enqueueTask({
      type: "subnet_delete",
      jobId,
      hostProjectId: body.hostProjectId,
      region: body.region,
      subnetName: body.subnetName,
      allocationId: body.allocationId
    });
    return reply.status(202).send(job);
  });
}
