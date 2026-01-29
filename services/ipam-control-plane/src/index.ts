import Fastify from "fastify";
import requestId from "fastify-request-id";
import { config } from "./utils/config.js";
import { registerRoutes } from "./api/index.js";

const app = Fastify({
  logger: true
});

app.register(requestId, {
  headerName: "x-request-id"
});

app.addHook("onRequest", async (request) => {
  request.log = request.log.child({ requestId: request.id });
});

await registerRoutes(app);

app.listen({ port: config.port, host: "0.0.0.0" }).catch((error) => {
  app.log.error(error, "Falha ao iniciar servidor");
  process.exit(1);
});
