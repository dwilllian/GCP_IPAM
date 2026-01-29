import { PoolClient } from "pg";
import { getAllocationById, updateAllocationStatus } from "../../db/allocations.js";
import { findCidrConflicts, upsertUsedCidr } from "../../db/inventory.js";
import { createSubnet } from "../../gcp/compute.js";
import { insertAudit } from "../../db/audit.js";
import { cidrToFirstLast } from "../../utils/cidr.js";

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

  if (!allocation.host_project_id || !allocation.region || !allocation.network) {
    throw new Error("Allocation não possui metadados de rede");
  }

  const range = cidrToFirstLast(allocation.cidr);
  const inventoryConflicts = await findCidrConflicts(client, range.firstIp, range.lastIp);
  if (inventoryConflicts.length > 0) {
    throw new Error("CIDR em conflito no inventário");
  }

  await createSubnet({
    hostProjectId: allocation.host_project_id,
    region: allocation.region,
    name: payload.subnetName,
    network: allocation.network,
    primaryCidr: allocation.cidr,
    enablePrivateIpGoogleAccess: payload.enablePrivateGoogleAccess,
    secondaryRanges: payload.secondaryRanges?.map((rangeItem) => ({
      rangeName: rangeItem.name,
      ipCidrRange: rangeItem.cidr
    }))
  });

  await updateAllocationStatus(client, allocation.id, "created");
  await upsertUsedCidr(client, {
    project_id: allocation.host_project_id,
    network: allocation.network,
    region: allocation.region,
    source: "allocation",
    cidr: allocation.cidr,
    first_ip: range.firstIp,
    last_ip: range.lastIp,
    resource_id: payload.subnetName,
    meta: {
      allocationId: allocation.id
    }
  });

  await insertAudit(client, {
    actor: null,
    action: "subnet_create",
    request: payload,
    result: { allocationId: allocation.id, subnetName: payload.subnetName },
    ok: true,
    request_id: null
  });
}
