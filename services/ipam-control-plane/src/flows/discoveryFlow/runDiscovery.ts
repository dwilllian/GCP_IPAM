import { PoolClient } from "pg";
import { v4 as uuidv4 } from "uuid";
import { insertJob } from "../../db/jobs.js";
import { enqueueTask } from "../../utils/tasks.js";

export type DiscoveryRequest = {
  scope: "org" | "projects";
  projects?: string[];
};

export async function runDiscovery(client: PoolClient, payload: DiscoveryRequest) {
  const jobId = uuidv4();
  const job = await insertJob(client, {
    id: jobId,
    type: "discovery_run",
    status: "queued",
    payload
  });

  const projects = payload.projects ?? [];
  for (const projectId of projects) {
    await enqueueTask({ jobId, type: "discovery_project", projectId });
  }

  return job;
}
