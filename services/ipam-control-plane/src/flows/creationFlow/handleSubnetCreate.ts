import { PoolClient } from "pg";
import { getAllocationById, updateAllocationStatus } from "../../db/allocations.js";
import { findCidrConflicts, upsertUsedCidr } from "../../db/inventory.js";
import { createSubnetwork } from "../../gcp/compute.js";
import { insertAudit } from "../../db/audit.js";

export type SubnetCreatePayload = {
  jobId: string;
  allocationId: string;
  subnetName: string;
  enablePrivateGoogleAccess?: boolean;
  secondaryRanges?: { name: string; cidr: string }[];
};

export async function handleSubnetCreate(client: PoolClient, payload: SubnetCreatePayload) {
  const allocation = await getAllocationById(client, payload.allocationId);
  if (!allocation) {
    throw new Error("Allocation não encontrada");
  }
  if (allocation.status !== "reserved") {
    throw new Error("Allocation não está em status reserved");
  }

  const conflicts = await findCidrConflicts(client, allocation.cidr);
  if (conflicts.length > 0) {
    throw new Error("CIDR em conflito no inventário");
  }

  if (!allocation.host_project_id || !allocation.region || !allocation.network) {
    throw new Error("Allocation não possui metadados de rede");
  }

  await createSubnetwork({
    projectId: allocation.host_project_id,
    region: allocation.region,
    name: payload.subnetName,
    network: allocation.network,
    ipCidrRange: allocation.cidr,
    enablePrivateIpGoogleAccess: payload.enablePrivateGoogleAccess,
    secondaryIpRanges: payload.secondaryRanges?.map((range) => ({
      rangeName: range.name,
      ipCidrRange: range.cidr
    }))
  });

  await updateAllocationStatus(client, allocation.id, "active");
  await upsertUsedCidr(client, {
    project_id: allocation.host_project_id,
    folder_id: null,
    network: allocation.network,
    region: allocation.region,
    source_type: "allocation",
    cidr: allocation.cidr,
    resource_name: payload.subnetName,
    self_link: null,
    meta: {
      allocationId: allocation.id
    }
  });

  await insertAudit(client, {
    actor: null,
    action: "subnet_create",
    request: payload,
    result: { allocationId: allocation.id, subnetName: payload.subnetName },
    ok: true
  });
}
