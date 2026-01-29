export const config = {
  port: Number(process.env.PORT ?? 8080),
  serviceName: process.env.SERVICE_NAME ?? "ipam-control-plane",
  serviceVersion: process.env.SERVICE_VERSION ?? process.env.npm_package_version ?? "dev",
  requestIdHeaderName: process.env.REQUEST_ID_HEADER ?? "x-request-id",
  maxPayloadBytes: Number(process.env.MAX_PAYLOAD_BYTES ?? 1048576),
  databaseUrl: process.env.DATABASE_URL ?? "",
  tasksQueueName: process.env.TASKS_QUEUE_NAME ?? "ipam-control-plane",
  tasksLocation: process.env.TASKS_LOCATION ?? "us-central1",
  tasksProjectId: process.env.GCP_PROJECT ?? "",
  tasksServiceUrl: process.env.TASKS_SERVICE_URL ?? "",
  tasksServiceAccount: process.env.TASKS_SERVICE_ACCOUNT ?? "",
  tasksAuthToken: process.env.TASKS_AUTH_TOKEN ?? "",
  mockGcp: process.env.MOCK_GCP === "true",
  gcpIpamBaseUrl: process.env.GCP_IPAM_BASE_URL ?? "",
  gcpIpamAccessToken: process.env.GCP_IPAM_ACCESS_TOKEN ?? "",
  gcpIpamTimeoutMs: Number(process.env.GCP_IPAM_TIMEOUT_MS ?? 10000),
  enableExpirationWorker: process.env.FEATURE_EXPIRATION === "true",
  enableRbac: process.env.FEATURE_RBAC === "true",
  enableMetrics: process.env.FEATURE_METRICS !== "false"
};

if (!config.databaseUrl) {
  console.warn("DATABASE_URL não configurado; o serviço não irá conectar ao Postgres.");
}
