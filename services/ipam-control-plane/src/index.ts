import Fastify from "fastify";
import requestId from "fastify-request-id";
import { config } from "./utils/config.js";
import { registerRoutes } from "./api/index.js";
import { asAppError, errorResponse } from "./utils/errors.js";

const app = Fastify({
  logger: true,
  bodyLimit: config.maxPayloadBytes
});

if (config.mockGcp) {
  throw new Error("MOCK_GCP não é permitido no ambiente atual.");
}

app.register(requestId, {
  headerName: config.requestIdHeaderName
});

app.addHook("onRequest", async (request) => {
  request.log = request.log.child({ requestId: request.id });
});

app.addHook("onResponse", async (request, reply) => {
  if (config.enableMetrics) {
    request.log.info(
      {
        route: request.routerPath,
        status: reply.statusCode,
        latencyMs: reply.getResponseTime()
      },
      "request"
    );
  }
  reply.header("x-request-id", request.id);
});

app.setErrorHandler(async (error, request, reply) => {
  const appError = asAppError(error);
  request.log.error(
    {
      code: appError.code,
      status: appError.status,
      details: appError.details
    },
    appError.message
  );
  reply.status(appError.status).send(errorResponse(request.id, appError));
});

await registerRoutes(app);

app.listen({ port: config.port, host: "0.0.0.0" }).catch((error) => {
  app.log.error(error, "Falha ao iniciar servidor");
  process.exit(1);
});
