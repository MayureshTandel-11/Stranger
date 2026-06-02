import websocket from "@fastify/websocket";
import { subscribe } from "./event-bus.js";

const listeners = new Set();

function broadcast(payload) {
  const data = JSON.stringify(payload);
  for (const socket of listeners) {
    if (socket.readyState === 1) {
      socket.send(data);
    }
  }
}

export async function registerRealtimeRoutes(app) {
  await app.register(websocket);

  app.get("/v1/ws/events", { websocket: true }, (connection) => {
    listeners.add(connection.socket);
    connection.socket.send(JSON.stringify({ type: "realtime.connected", timestamp: new Date().toISOString() }));
    connection.socket.on("close", () => {
      listeners.delete(connection.socket);
    });
  });

  subscribe("plan.proposed", (event) => broadcast(event));
  subscribe("approval.requested", (event) => broadcast(event));
  subscribe("approval.resolved", (event) => broadcast(event));
  subscribe("task.executed", (event) => broadcast(event));
  subscribe("task.stopped", (event) => broadcast(event));
}
