import { PoolClient } from "pg";
import { updateJobStatus, incrementJobAttempts } from "../../db/jobs.js";
import { listProjects } from "../../gcp/resource-manager.js";
import { handleDiscoveryProject } from "./handleDiscoveryProject.js";

export type DiscoveryPayload = {
  jobId: string;
  hostProjectId: string;
  projectIds?: string[];
  regions?: string[];
};

export async function discoveryFlow(client: PoolClient, payload: DiscoveryPayload): Promise<void> {
  await incrementJobAttempts(client, payload.jobId);
  await updateJobStatus(client, payload.jobId, "running", { startedAt: new Date().toISOString() });

  const projectIds = payload.projectIds?.length ? payload.projectIds : await listProjects();
  for (const projectId of projectIds) {
    await handleDiscoveryProject(client, projectId);
  }

  await updateJobStatus(client, payload.jobId, "done", {
    projects: projectIds,
    finishedAt: new Date().toISOString()
  });
}
