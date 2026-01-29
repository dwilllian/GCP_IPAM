import { PoolClient } from "pg";
import { handleDiscoveryProject } from "./discoveryFlow/handleDiscoveryProject.js";
import { handleSubnetCreate } from "./creationFlow/handleSubnetCreate.js";
import { handleSubnetDelete } from "./deletionFlow/handleSubnetDelete.js";
import { incrementJobAttempts, updateJobStatus } from "../db/jobs.js";

export type TaskPayload =
  | { type: "discovery_project"; jobId: string; projectId: string }
  | { type: "subnet_create"; jobId: string; allocationId: string; subnetName: string; enablePrivateGoogleAccess?: boolean; secondaryRanges?: { name: string; cidr: string }[] }
  | { type: "subnet_delete"; jobId: string; hostProjectId: string; region: string; subnetName: string; allocationId?: string };

export async function handleTask(client: PoolClient, payload: TaskPayload) {
  await incrementJobAttempts(client, payload.jobId);
  await updateJobStatus(client, payload.jobId, "running", null);

  switch (payload.type) {
    case "discovery_project":
      await handleDiscoveryProject(client, payload.projectId);
      await updateJobStatus(client, payload.jobId, "done", { projectId: payload.projectId });
      return;
    case "subnet_create":
      await handleSubnetCreate(client, payload);
      await updateJobStatus(client, payload.jobId, "done", { allocationId: payload.allocationId });
      return;
    case "subnet_delete":
      await handleSubnetDelete(client, payload);
      await updateJobStatus(client, payload.jobId, "done", { subnetName: payload.subnetName });
      return;
    default:
      throw new Error("Tipo de task desconhecido");
  }
}
