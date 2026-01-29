import { FastifyInstance } from "fastify";
import { withTransaction } from "../db/pool.js";
import { handleSubnetCreate } from "../flows/creationFlow/handleSubnetCreate.js";
import { handleSubnetDelete } from "../flows/deletionFlow/handleSubnetDelete.js";
import { AppError } from "../utils/errors.js";

export async function networkRoutes(app: FastifyInstance) {
  app.post("/network/subnets/create", async (request, reply) => {
    const body = request.body as {
      allocationId?: string;
      subnetName?: string;
      enablePrivateGoogleAccess?: boolean;
      secondaryRanges?: { name: string; cidr: string }[];
    };
    if (!body?.allocationId || !body.subnetName) {
      throw new AppError("VALIDATION_ERROR", 400, "Campos obrigatórios: allocationId, subnetName");
    }
    await withTransaction((client) =>
      handleSubnetCreate(client, {
        jobId: "sync",
        allocationId: body.allocationId,
        subnetName: body.subnetName,
        enablePrivateGoogleAccess: body.enablePrivateGoogleAccess,
        secondaryRanges: body.secondaryRanges
      })
    );
    return reply.status(200).send({ ok: true });
  });

  app.post("/network/subnets/delete", async (request, reply) => {
    const body = request.body as { hostProjectId?: string; region?: string; subnetName?: string; allocationId?: string };
    if (!body?.hostProjectId || !body.region || !body.subnetName) {
      throw new AppError(
        "VALIDATION_ERROR",
        400,
        "Campos obrigatórios: hostProjectId, region, subnetName"
      );
    }
    await withTransaction((client) =>
      handleSubnetDelete(client, {
        jobId: "sync",
        hostProjectId: body.hostProjectId,
        region: body.region,
        subnetName: body.subnetName,
        allocationId: body.allocationId
      })
    );
    return reply.status(200).send({ ok: true });
  });
}
