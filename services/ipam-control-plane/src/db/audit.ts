import { PoolClient } from "pg";
import { AuditRow } from "./types.js";

export async function insertAudit(
  client: PoolClient,
  audit: Pick<AuditRow, "actor" | "action" | "request" | "result" | "ok" | "request_id">
): Promise<void> {
  await client.query(
    `INSERT INTO audit_events (ts, actor, action, request, result, ok, request_id)
     VALUES (NOW(), $1, $2, $3, $4, $5, $6)`,
    [audit.actor, audit.action, audit.request, audit.result, audit.ok, audit.request_id]
  );
}

export async function listAudit(
  client: PoolClient,
  filters: Partial<{ action: string; ok: boolean; from: string; to: string; limit: number; offset: number }>
): Promise<AuditRow[]> {
  const conditions: string[] = [];
  const values: Array<string | number | boolean> = [];
  if (filters.action) {
    values.push(filters.action);
    conditions.push(`action = $${values.length}`);
  }
  if (typeof filters.ok === "boolean") {
    values.push(filters.ok);
    conditions.push(`ok = $${values.length}`);
  }
  if (filters.from) {
    values.push(filters.from);
    conditions.push(`ts >= $${values.length}`);
  }
  if (filters.to) {
    values.push(filters.to);
    conditions.push(`ts <= $${values.length}`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  let limitClause = "";
  let offsetClause = "";
  if (typeof filters.limit === "number") {
    values.push(filters.limit);
    limitClause = `LIMIT $${values.length}`;
  }
  if (typeof filters.offset === "number") {
    values.push(filters.offset);
    offsetClause = `OFFSET $${values.length}`;
  }
  const result = await client.query<AuditRow>(
    `SELECT * FROM audit_events ${where} ORDER BY ts DESC ${limitClause} ${offsetClause}`,
    values
  );
  return result.rows;
}
