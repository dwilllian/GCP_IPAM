import { PoolClient } from "pg";
import { JobRow } from "./types.js";

export async function insertJob(
  client: PoolClient,
  job: Pick<JobRow, "id" | "type" | "status" | "payload">
): Promise<JobRow> {
  const result = await client.query<JobRow>(
    `INSERT INTO jobs (id, type, status, payload)
     VALUES ($1,$2,$3,$4)
     RETURNING *`,
    [job.id, job.type, job.status, job.payload]
  );
  return result.rows[0];
}

export async function updateJobStatus(
  client: PoolClient,
  id: string,
  status: JobRow["status"],
  result: JobRow["result"] | null
): Promise<void> {
  await client.query(
    "UPDATE jobs SET status = $1, result = $2, updated_at = NOW() WHERE id = $3",
    [status, result, id]
  );
}

export async function incrementJobAttempts(client: PoolClient, id: string): Promise<void> {
  await client.query("UPDATE jobs SET attempts = attempts + 1, updated_at = NOW() WHERE id = $1", [id]);
}

export async function getJobById(client: PoolClient, id: string): Promise<JobRow | null> {
  const result = await client.query<JobRow>("SELECT * FROM jobs WHERE id = $1", [id]);
  return result.rows[0] ?? null;
}

export async function listJobs(client: PoolClient, limit = 50): Promise<JobRow[]> {
  const result = await client.query<JobRow>("SELECT * FROM jobs ORDER BY created_at DESC LIMIT $1", [limit]);
  return result.rows;
}
