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

export async function listSubnets(projectId: string, region?: string): Promise<SubnetInfo[]> {
  if (config.mockGcp) {
    return [
      {
        name: "mock-subnet-a",
        network: "mock-network",
        region: region ?? "us-central1",
        ipCidrRange: "10.10.0.0/24",
        secondaryIpRanges: [],
        selfLink: null
      }
    ];
  }
  const [subnets] = await (subnetworksClient as unknown as {
    aggregatedList: (req: { project: string }) => Promise<[Record<string, unknown>]>;
  }).aggregatedList({ project: projectId });
  const result: SubnetInfo[] = [];
  for (const [, scoped] of Object.entries((subnets as { items?: Record<string, unknown> }).items ?? {})) {
    const scopedValue = scoped as { subnetworks?: Array<Record<string, unknown>> };
    for (const subnet of scopedValue.subnetworks ?? []) {
      const subnetRegion = subnet.region as string | undefined;
      if (region && subnetRegion && !subnetRegion.includes(region)) {
        continue;
      }
      result.push({
        name: (subnet.name as string) ?? "",
        network: (subnet.network as string) ?? null,
        region: subnetRegion ?? null,
        ipCidrRange: (subnet.ipCidrRange as string) ?? "",
        secondaryIpRanges:
          (subnet.secondaryIpRanges as Array<Record<string, unknown>> | undefined)?.map((range) => ({
            rangeName: (range.rangeName as string) ?? "",
            ipCidrRange: (range.ipCidrRange as string) ?? ""
          })) ?? [],
        selfLink: (subnet.selfLink as string) ?? null
      });
    }
  }
  return result;
}

export async function listRoutes(projectId: string): Promise<RouteInfo[]> {
  if (config.mockGcp) {
    return [
      {
        name: "mock-route",
        destRange: "10.20.0.0/24",
        network: "mock-network",
        priority: 1000,
        nextHop: "mock-next-hop",
        selfLink: null
      }
    ];
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

export async function createSubnet(params: {
  hostProjectId: string;
  region: string;
  name: string;
  network: string;
  primaryCidr: string;
  enablePrivateIpGoogleAccess?: boolean;
  secondaryRanges?: { rangeName: string; ipCidrRange: string }[];
}): Promise<void> {
  if (config.mockGcp) {
    return;
  }
  await subnetworksClient.insert({
    project: params.hostProjectId,
    region: params.region,
    subnetworkResource: {
      name: params.name,
      network: params.network,
      ipCidrRange: params.primaryCidr,
      privateIpGoogleAccess: params.enablePrivateIpGoogleAccess ?? false,
      secondaryIpRanges: params.secondaryRanges ?? []
    }
  });
}

export async function deleteSubnet(params: {
  hostProjectId: string;
  region: string;
  name: string;
}): Promise<void> {
  if (config.mockGcp) {
    return;
  }
  await subnetworksClient.delete({
    project: params.hostProjectId,
    region: params.region,
    subnetwork: params.name
  });
}
