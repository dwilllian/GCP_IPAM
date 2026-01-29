import { CloudTasksClient } from "@google-cloud/tasks";
import { config } from "../utils/config.js";

const client = new CloudTasksClient();

type DiscoveryTaskPayload = {
  jobId: string;
  hostProjectId: string;
  projectIds?: string[];
  regions?: string[];
};

export async function enqueueDiscovery(jobId: string, payload: Omit<DiscoveryTaskPayload, "jobId">): Promise<void> {
  if (config.mockGcp) {
    return;
  }
  if (!config.tasksProjectId || !config.tasksLocation || !config.tasksQueueName || !config.tasksServiceUrl) {
    console.warn("Cloud Tasks não configurado; task de discovery não será enfileirada.");
    return;
  }
  const parent = client.queuePath(config.tasksProjectId, config.tasksLocation, config.tasksQueueName);
  const taskName = client.taskPath(config.tasksProjectId, config.tasksLocation, config.tasksQueueName, `discovery-${jobId}`);
  const task = {
    name: taskName,
    httpRequest: {
      httpMethod: "POST" as const,
      url: `${config.tasksServiceUrl}/worker/discovery`,
      headers: {
        "Content-Type": "application/json",
        "X-Tasks-Token": config.tasksAuthToken
      },
      body: Buffer.from(JSON.stringify({ jobId, ...payload })).toString("base64"),
      oidcToken: config.tasksServiceAccount
        ? {
            serviceAccountEmail: config.tasksServiceAccount
          }
        : undefined
    }
  };
  await client.createTask({ parent, task });
}
