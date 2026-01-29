import { PoolClient } from "pg";
import { listRoutes, listSubnets } from "../../gcp/compute.js";
import { deleteUsedCidrsByProject, upsertUsedCidr } from "../../db/inventory.js";
import { cidrToFirstLast } from "../../utils/cidr.js";

export async function handleDiscoveryProject(client: PoolClient, projectId: string): Promise<void> {
  await deleteUsedCidrsByProject(client, projectId);
  const subnetworks = await listSubnets(projectId);
  for (const subnet of subnetworks) {
    const primaryRange = cidrToFirstLast(subnet.ipCidrRange);
    await upsertUsedCidr(client, {
      project_id: projectId,
      network: subnet.network,
      region: subnet.region,
      source: "subnet_primary",
      cidr: subnet.ipCidrRange,
      first_ip: primaryRange.firstIp,
      last_ip: primaryRange.lastIp,
      resource_id: subnet.name,
      meta: {
        secondaryRanges: subnet.secondaryIpRanges
      }
    });

    for (const secondary of subnet.secondaryIpRanges) {
      const secondaryRange = cidrToFirstLast(secondary.ipCidrRange);
      await upsertUsedCidr(client, {
        project_id: projectId,
        network: subnet.network,
        region: subnet.region,
        source: "subnet_secondary",
        cidr: secondary.ipCidrRange,
        first_ip: secondaryRange.firstIp,
        last_ip: secondaryRange.lastIp,
        resource_id: `${subnet.name}:${secondary.rangeName}`,
        meta: {
          parentSubnet: subnet.name,
          rangeName: secondary.rangeName
        }
      });
    }
  }

  const routes = await listRoutes(projectId);
  for (const route of routes) {
    if (!route.destRange) {
      continue;
    }
    const routeRange = cidrToFirstLast(route.destRange);
    await upsertUsedCidr(client, {
      project_id: projectId,
      network: route.network,
      region: null,
      source: "route_static",
      cidr: route.destRange,
      first_ip: routeRange.firstIp,
      last_ip: routeRange.lastIp,
      resource_id: route.name,
      meta: {
        priority: route.priority,
        nextHop: route.nextHop
      }
    });
  }
}
