import Fastify from "fastify";
import { initDb, shutdownDb } from "./db/client.js";
import { registerHttpRoutes } from "./routes/http.js";
import { subscribe } from "./services/event-bus.js";
import { registerRealtimeRoutes } from "./services/realtime.js";

const app = Fastify({ logger: true });

async function bootstrap() {
  try {
    // Initialize MongoDB connection
    await initDb();

    // Register routes
    await registerRealtimeRoutes(app);
    await registerHttpRoutes(app);

    // Subscribe to events
    subscribe("plan.proposed", (event) => {
      app.log.info({ event }, "Plan proposed");
    });
    subscribe("approval.resolved", (event) => {
      app.log.info({ event }, "Approval resolved");
    });
    subscribe("task.executed", (event) => {
      app.log.info({ event }, "Task executed");
    });

    // Start server
    await app.listen({
      host: "127.0.0.1",
      port: Number(process.env.STRANGER_PORT ?? 7331)
    });

    app.log.info("Stranger Core server started successfully");

    // Handle graceful shutdown
    process.on("SIGINT", async () => {
      app.log.info("Shutting down gracefully...");
      await shutdownDb();
      await app.close();
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      app.log.info("Shutting down gracefully...");
      await shutdownDb();
      await app.close();
      process.exit(0);
    });
  } catch (error) {
    app.log.error(error);
    await shutdownDb();
    process.exit(1);
  }
}

bootstrap();
