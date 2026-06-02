import Fastify from "fastify";
import { initDb } from "./db/client.js";
import { registerHttpRoutes } from "./routes/http.js";
import { subscribe } from "./services/event-bus.js";
import { registerRealtimeRoutes } from "./services/realtime.js";

const app = Fastify({ logger: true });

async function bootstrap() {
  initDb();
  await registerRealtimeRoutes(app);
  await registerHttpRoutes(app);
  subscribe("plan.proposed", (event) => {
    app.log.info({ event }, "Plan proposed");
  });
  subscribe("approval.resolved", (event) => {
    app.log.info({ event }, "Approval resolved");
  });
  subscribe("task.executed", (event) => {
    app.log.info({ event }, "Task executed");
  });

  await app.listen({
    host: "127.0.0.1",
    port: Number(process.env.STRANGER_PORT ?? 7331)
  });
}

bootstrap().catch((error) => {
  app.log.error(error);
  process.exit(1);
});
