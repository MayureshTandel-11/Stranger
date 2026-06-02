import http from "node:http";
import axios from "axios";
import cors from "cors";
import express from "express";
import { Server } from "socket.io";
import { z } from "zod";

const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

const aiCoreBaseUrl = process.env.AI_CORE_URL ?? "http://127.0.0.1:8340";
const port = Number(process.env.GATEWAY_PORT ?? 7332);

const requestSchema = z.object({
  sessionId: z.string(),
  userRequest: z.string()
});

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "gateway" });
});

app.post("/v1/plan-and-request-approval", async (req, res) => {
  const input = requestSchema.parse(req.body);

  const planResponse = await axios.post(`${aiCoreBaseUrl}/v1/plan`, input);
  const plan = planResponse.data;
  io.emit("plan:proposed", plan);
  io.emit("state:update", { state: "Waiting Approval", planId: plan.planId });

  res.json(plan);
});

app.post("/v1/approval/respond", (req, res) => {
  const body = z
    .object({
      approvalId: z.string(),
      decision: z.enum(["approved", "rejected", "modify"])
    })
    .parse(req.body);

  io.emit("approval:resolved", body);
  io.emit("state:update", { state: body.decision === "approved" ? "Executing" : "Completed" });
  res.json({ ok: true });
});

app.post("/v1/task/interrupt", (req, res) => {
  const body = z
    .object({
      taskId: z.string(),
      command: z.enum(["stop", "cancel", "abort", "pause", "freeze"])
    })
    .parse(req.body);
  io.emit("task:failed", { taskId: body.taskId, reason: body.command });
  io.emit("state:update", { state: "Error", reason: `Interrupted via ${body.command}` });
  res.json({ status: "interrupted" });
});

io.on("connection", (socket) => {
  socket.emit("state:update", { state: "Idle" });
  socket.on("voice:wake-detected", () => {
    io.emit("overlay:show");
    io.emit("state:update", { state: "Listening" });
  });
  socket.on("task:interrupt", (payload) => {
    io.emit("state:update", { state: "Error", reason: payload?.command ?? "interrupt" });
    io.emit("task:failed", { reason: payload?.command ?? "interrupt" });
  });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Stranger gateway running on http://127.0.0.1:${port}`);
});
