import { PoolClient } from "pg";
import { deleteSubnet } from "../../gcp/compute.js";
import { insertAudit } from "../../db/audit.js";
import { updateAllocationStatus } from "../../db/allocations.js";

export type SubnetDeletePayload = {
  jobId: string;
  hostProjectId: string;
  region: string;
  subnetName: string;
  allocationId?: string;
};

export async function handleSubnetDelete(client: PoolClient, payload: SubnetDeletePayload) {
  await deleteSubnet({
    hostProjectId: payload.hostProjectId,
    region: payload.region,
    name: payload.subnetName
  });

  if (payload.allocationId) {
    await updateAllocationStatus(client, payload.allocationId, "deleted");
  }

  await insertAudit(client, {
    actor: null,
    action: "subnet_delete",
    request: payload,
    result: { ok: true },
    ok: true,
    request_id: null
  });
}
