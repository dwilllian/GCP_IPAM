import { FastifyInstance } from "fastify";
import { config } from "../utils/config.js";

export async function healthRoutes(app: FastifyInstance) {
  app.get("/health", async () => ({
    ok: true,
    service: config.serviceName,
    version: config.serviceVersion,
    time: new Date().toISOString()
  }));
}
