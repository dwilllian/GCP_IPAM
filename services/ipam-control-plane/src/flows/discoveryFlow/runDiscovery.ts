import { PoolClient } from "pg";
import { v4 as uuidv4 } from "uuid";
import { insertJob } from "../../db/jobs.js";
import { enqueueDiscovery } from "../../gcp/cloud-tasks.js";

export type DiscoveryRequest = {
  hostProjectId: string;
  projectIds?: string[];
  regions?: string[];
};

export async function runDiscovery(client: PoolClient, payload: DiscoveryRequest) {
  const jobId = uuidv4();
  const job = await insertJob(client, {
    id: jobId,
    type: "discovery",
    status: "queued",
    payload
  });

  await enqueueDiscovery(jobId, payload);

  return job;
}
