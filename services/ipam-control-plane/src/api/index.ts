import { FastifyInstance } from "fastify";
import { healthRoutes } from "./health.js";
import { ipamRoutes } from "./ipam.js";
import { inventoryRoutes } from "./inventory.js";
import { jobsRoutes } from "./jobs.js";
import { networkRoutes } from "./network.js";
import { taskRoutes } from "./tasks.js";
import { auditRoutes } from "./audit.js";
import { gcpIpamRoutes } from "./gcp-ipam.js";

export async function registerRoutes(app: FastifyInstance) {
  await healthRoutes(app);
  await ipamRoutes(app);
  await inventoryRoutes(app);
  await jobsRoutes(app);
  await networkRoutes(app);
  await taskRoutes(app);
  await auditRoutes(app);
  await gcpIpamRoutes(app);
}
