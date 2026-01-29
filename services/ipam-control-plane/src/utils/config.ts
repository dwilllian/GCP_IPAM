export const config = {
  port: Number(process.env.PORT ?? 8080),
  databaseUrl: process.env.DATABASE_URL ?? "",
  tasksQueueName: process.env.TASKS_QUEUE_NAME ?? "ipam-control-plane",
  tasksLocation: process.env.TASKS_LOCATION ?? "us-central1",
  tasksProjectId: process.env.GCP_PROJECT ?? "",
  tasksServiceUrl: process.env.TASKS_SERVICE_URL ?? "",
  tasksServiceAccount: process.env.TASKS_SERVICE_ACCOUNT ?? "",
  mockGcp: process.env.MOCK_GCP === "true"
};

if (!config.databaseUrl) {
  console.warn("DATABASE_URL não configurado; o serviço não irá conectar ao Postgres.");
}
