import ipaddr from "ipaddr.js";

export type CidrRange = {
  start: bigint;
  end: bigint;
  prefixLength: number;
};

const IPV4_BITS = 32n;

export function ipToBigInt(ip: string): bigint {
  const parsed = ipaddr.parse(ip);
  if (parsed.kind() !== "ipv4") {
    throw new Error("Somente IPv4 é suportado no MVP");
  }
  const bytes = parsed.toByteArray();
  return bytes.reduce((acc, byte) => (acc << 8n) + BigInt(byte), 0n);
}

export function bigIntToIp(value: bigint): string {
  const bytes = [
    Number((value >> 24n) & 255n),
    Number((value >> 16n) & 255n),
    Number((value >> 8n) & 255n),
    Number(value & 255n)
  ];
  return bytes.join(".");
}

export function cidrToRange(cidr: string): CidrRange {
  const [ip, prefixRaw] = cidr.split("/");
  if (!ip || !prefixRaw) {
    throw new Error("CIDR inválido");
  }
  const prefixLength = Number(prefixRaw);
  if (Number.isNaN(prefixLength) || prefixLength < 0 || prefixLength > 32) {
    throw new Error("Prefixo inválido");
  }
  const base = ipToBigInt(ip);
  const hostBits = IPV4_BITS - BigInt(prefixLength);
  const mask = (1n << IPV4_BITS) - (1n << hostBits);
  const network = base & mask;
  const size = 1n << hostBits;
  return {
    start: network,
    end: network + size - 1n,
    prefixLength
  };
}

export function cidrToFirstLast(cidr: string): { firstIp: string; lastIp: string } {
  const range = cidrToRange(cidr);
  return {
    firstIp: range.start.toString(),
    lastIp: range.end.toString()
  };
}

export function firstUsableIp(cidr: string): string {
  const range = cidrToRange(cidr);
  const first = range.start + 1n;
  return bigIntToIp(first);
}

export function subnetSize(prefixLength: number): bigint {
  const hostBits = IPV4_BITS - BigInt(prefixLength);
  return 1n << hostBits;
}

export function cidrSize(cidr: string): bigint {
  const range = cidrToRange(cidr);
  return range.end - range.start + 1n;
}

export function alignToPrefix(value: bigint, parentStart: bigint, prefixLength: number): bigint {
  const size = subnetSize(prefixLength);
  const offset = value - parentStart;
  if (offset <= 0n) {
    return parentStart;
  }
  const remainder = offset % size;
  if (remainder === 0n) {
    return value;
  }
  return value + (size - remainder);
}

export function formatCidr(start: bigint, prefixLength: number): string {
  return `${bigIntToIp(start)}/${prefixLength}`;
}

export function* candidateSubnets(parentCidr: string, cursorIp: string, prefixLength: number) {
  const parent = cidrToRange(parentCidr);
  const cursorValue = ipToBigInt(cursorIp);
  const aligned = alignToPrefix(cursorValue, parent.start, prefixLength);
  const size = subnetSize(prefixLength);
  const firstStart = parent.start;
  const lastStart = parent.end - size + 1n;
  const visited = new Set<string>();
  const emit = (start: bigint) => {
    const cidr = formatCidr(start, prefixLength);
    if (!visited.has(cidr)) {
      visited.add(cidr);
      return cidr;
    }
    return null;
  };

  for (let current = aligned; current <= lastStart; current += size) {
    const cidr = emit(current);
    if (cidr) {
      yield cidr;
    }
  }
  for (let current = firstStart; current < aligned; current += size) {
    const cidr = emit(current);
    if (cidr) {
      yield cidr;
    }
  }
}

export function nextCursorIp(parentCidr: string, lastAllocated: string, prefixLength: number): string {
  const parent = cidrToRange(parentCidr);
  const [ip] = lastAllocated.split("/");
  if (!ip) {
    throw new Error("CIDR inválido");
  }
  const start = ipToBigInt(ip);
  const size = subnetSize(prefixLength);
  const next = start + size;
  if (next > parent.end) {
    return bigIntToIp(parent.start + 1n);
  }
  return bigIntToIp(next);
}
