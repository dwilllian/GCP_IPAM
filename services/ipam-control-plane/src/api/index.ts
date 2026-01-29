import { FastifyInstance } from "fastify";
import { healthRoutes } from "./health.js";
import { ipamRoutes } from "./ipam.js";
import { inventoryRoutes } from "./inventory.js";
import { jobsRoutes } from "./jobs.js";
import { networkRoutes } from "./network.js";
import { auditRoutes } from "./audit.js";
import { gcpIpamRoutes } from "./gcp-ipam.js";
import { workerRoutes } from "./worker.js";

export async function registerRoutes(app: FastifyInstance) {
  await healthRoutes(app);
  await ipamRoutes(app);
  await inventoryRoutes(app);
  await jobsRoutes(app);
  await networkRoutes(app);
  await auditRoutes(app);
  await gcpIpamRoutes(app);
  await workerRoutes(app);
}
