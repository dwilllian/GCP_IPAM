import { CloudTasksClient } from "@google-cloud/tasks";
import { config } from "./config.js";

const client = new CloudTasksClient();

export async function enqueueTask(payload: Record<string, unknown>): Promise<void> {
  if (!config.tasksProjectId || !config.tasksLocation || !config.tasksQueueName || !config.tasksServiceUrl) {
    console.warn("Cloud Tasks não configurado; task não será enfileirada.");
    return;
  }
  const parent = client.queuePath(config.tasksProjectId, config.tasksLocation, config.tasksQueueName);
  const task = {
    httpRequest: {
      httpMethod: "POST" as const,
      url: `${config.tasksServiceUrl}/tasks/execute`,
      headers: { "Content-Type": "application/json" },
      body: Buffer.from(JSON.stringify(payload)).toString("base64"),
      oidcToken: config.tasksServiceAccount
        ? {
            serviceAccountEmail: config.tasksServiceAccount
          }
        : undefined
    }
  };
  await client.createTask({ parent, task });
}
