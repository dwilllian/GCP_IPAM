import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { PoolClient } from "pg";
import { allocateFromPool } from "./allocateFromPool.js";

const basePool = {
  id: "pool-1",
  name: "pool-test",
  parent_cidr: "10.0.0.0/30",
  allowed_prefixes: [30],
  cursor_ip: "10.0.0.1",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

const fakeClient = {
  query: async () => ({ rows: [] })
} as unknown as PoolClient;

describe("flows/allocateFromPool", () => {
  it("falha quando prefixo não é permitido", async () => {
    await assert.rejects(
      () =>
        allocateFromPool(fakeClient, {
          poolName: "pool-test",
          prefixLength: 28,
          region: "us-central1",
          hostProjectId: "host",
          network: "net"
        }),
      /Prefixo não permitido/
    );
  });

  it("falha quando não há bloco disponível", async () => {
    await assert.rejects(
      () =>
        allocateFromPool(
          fakeClient,
          {
            poolName: "pool-test",
            prefixLength: 30,
            region: "us-central1",
            hostProjectId: "host",
            network: "net"
          },
          {
            getPoolByName: async () => basePool,
            updatePoolCursor: async () => undefined,
            insertAllocation: async () => {
              throw new Error("não deveria inserir");
            },
            findCidrConflicts: async () => [{ id: 1 } as never],
            existsAllocationConflict: async () => true
          }
        ),
      /Nenhum bloco livre/
    );
  });

  it("respeita conflito de inventário", async () => {
    let called = 0;
    await assert.rejects(
      () =>
        allocateFromPool(
          fakeClient,
          {
            poolName: "pool-test",
            prefixLength: 30,
            region: "us-central1",
            hostProjectId: "host",
            network: "net"
          },
          {
            getPoolByName: async () => basePool,
            updatePoolCursor: async () => undefined,
            insertAllocation: async () => {
              throw new Error("não deveria inserir");
            },
            findCidrConflicts: async () => {
              called += 1;
              return called === 1 ? [{ id: 1 } as never] : [{ id: 2 } as never];
            },
            existsAllocationConflict: async () => false
          }
        ),
      /Nenhum bloco livre/
    );
  });

  it("executa advisory lock antes da seleção", async () => {
    const queries: string[] = [];
    const client = {
      query: async (text: string) => {
        queries.push(text);
        return { rows: [] };
      }
    } as unknown as PoolClient;

    await assert.rejects(
      () =>
        allocateFromPool(
          client,
          {
            poolName: "pool-test",
            prefixLength: 30,
            region: "us-central1",
            hostProjectId: "host",
            network: "net"
          },
          {
            getPoolByName: async () => basePool,
            updatePoolCursor: async () => undefined,
            insertAllocation: async () => {
              throw new Error("não deveria inserir");
            },
            findCidrConflicts: async () => [{ id: 1 } as never],
            existsAllocationConflict: async () => true
          }
        ),
      /Nenhum bloco livre/
    );

    assert.ok(queries.some((query) => query.includes("pg_advisory_xact_lock")));
  });
});
