import { PoolClient } from "pg";
import { listRoutes, listSubnetworks } from "../../gcp/compute.js";
import { upsertUsedCidr } from "../../db/inventory.js";
import { updateJobStatus } from "../../db/jobs.js";

export async function handleDiscoveryProject(client: PoolClient, jobId: string, projectId: string): Promise<void> {
  const subnetworks = await listSubnetworks(projectId);
  for (const subnet of subnetworks) {
    await upsertUsedCidr(client, {
      project_id: projectId,
      folder_id: null,
      network: subnet.network,
      region: subnet.region,
      source_type: "subnet_primary",
      cidr: subnet.ipCidrRange,
      resource_name: subnet.name,
      self_link: subnet.selfLink,
      meta: {
        secondaryRanges: subnet.secondaryIpRanges
      }
    });

    for (const secondary of subnet.secondaryIpRanges) {
      await upsertUsedCidr(client, {
        project_id: projectId,
        folder_id: null,
        network: subnet.network,
        region: subnet.region,
        source_type: "subnet_secondary",
        cidr: secondary.ipCidrRange,
        resource_name: `${subnet.name}:${secondary.rangeName}`,
        self_link: subnet.selfLink,
        meta: {
          parentSubnet: subnet.name,
          rangeName: secondary.rangeName
        }
      });
    }
  }

  const routes = await listRoutes(projectId);
  for (const route of routes) {
    await upsertUsedCidr(client, {
      project_id: projectId,
      folder_id: null,
      network: route.network,
      region: null,
      source_type: "route_static",
      cidr: route.destRange,
      resource_name: route.name,
      self_link: route.selfLink,
      meta: {
        priority: route.priority,
        nextHop: route.nextHop
      }
    });
  }

  await updateJobStatus(client, jobId, "done", { projectId, discovered: true });
}
