import { SubnetworksClient, RoutesClient } from "@google-cloud/compute";
import { config } from "../utils/config.js";

export type SubnetInfo = {
  name: string;
  network: string | null;
  region: string | null;
  ipCidrRange: string;
  secondaryIpRanges: { rangeName: string; ipCidrRange: string }[];
  selfLink: string | null;
};

export type RouteInfo = {
  name: string;
  destRange: string;
  network: string | null;
  priority: number | null;
  nextHop: string | null;
  selfLink: string | null;
};

const subnetworksClient = new SubnetworksClient();
const routesClient = new RoutesClient();

export async function listSubnetworks(projectId: string): Promise<SubnetInfo[]> {
  if (config.mockGcp) {
    return [];
  }
  const [subnets] = await subnetworksClient.aggregatedList({ project: projectId });
  const result: SubnetInfo[] = [];
  for (const [, scoped] of Object.entries(subnets.items ?? {})) {
    for (const subnet of scoped.subnetworks ?? []) {
      result.push({
        name: subnet.name ?? "",
        network: subnet.network ?? null,
        region: subnet.region ?? null,
        ipCidrRange: subnet.ipCidrRange ?? "",
        secondaryIpRanges:
          subnet.secondaryIpRanges?.map((range) => ({
            rangeName: range.rangeName ?? "",
            ipCidrRange: range.ipCidrRange ?? ""
          })) ?? [],
        selfLink: subnet.selfLink ?? null
      });
    }
  }
  return result;
}

export async function listRoutes(projectId: string): Promise<RouteInfo[]> {
  if (config.mockGcp) {
    return [];
  }
  const [routes] = await routesClient.list({ project: projectId });
  return (routes ?? []).map((route) => ({
    name: route.name ?? "",
    destRange: route.destRange ?? "",
    network: route.network ?? null,
    priority: route.priority ?? null,
    nextHop:
      route.nextHopGateway ??
      route.nextHopInstance ??
      route.nextHopIlb ??
      route.nextHopIp ??
      route.nextHopVpnTunnel ??
      null,
    selfLink: route.selfLink ?? null
  }));
}

export async function createSubnetwork(params: {
  projectId: string;
  region: string;
  name: string;
  network: string;
  ipCidrRange: string;
  enablePrivateIpGoogleAccess?: boolean;
  secondaryIpRanges?: { rangeName: string; ipCidrRange: string }[];
}): Promise<void> {
  if (config.mockGcp) {
    return;
  }
  await subnetworksClient.insert({
    project: params.projectId,
    region: params.region,
    subnetworkResource: {
      name: params.name,
      network: params.network,
      ipCidrRange: params.ipCidrRange,
      privateIpGoogleAccess: params.enablePrivateIpGoogleAccess ?? false,
      secondaryIpRanges: params.secondaryIpRanges ?? []
    }
  });
}

export async function deleteSubnetwork(params: {
  projectId: string;
  region: string;
  name: string;
}): Promise<void> {
  if (config.mockGcp) {
    return;
  }
  await subnetworksClient.delete({
    project: params.projectId,
    region: params.region,
    subnetwork: params.name
  });
}
