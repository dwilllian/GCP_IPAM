import { PoolClient } from "pg";
import { AuditRow } from "./types.js";

export async function insertAudit(
  client: PoolClient,
  audit: Pick<AuditRow, "actor" | "action" | "request" | "result" | "ok">
): Promise<void> {
  await client.query(
    `INSERT INTO audit_events (ts, actor, action, request, result, ok)
     VALUES (NOW(), $1, $2, $3, $4, $5)`,
    [audit.actor, audit.action, audit.request, audit.result, audit.ok]
  );
}

export async function listAudit(client: PoolClient, limit = 100): Promise<AuditRow[]> {
  const result = await client.query<AuditRow>("SELECT * FROM audit_events ORDER BY ts DESC LIMIT $1", [limit]);
  return result.rows;
}
