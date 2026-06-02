import { randomUUID } from "node:crypto";
import { coreEventSchema, executionRequestSchema, planSchema } from "@stranger/shared";
import { executeActions } from "../agents/capability-agent.js";
import { createPlanFromRequest } from "../agents/planning-agent.js";
import { db } from "../db/client.js";
import { assertApprovedExecution } from "../security/policy.js";
import { writeAuditLog } from "../services/audit-service.js";
import { publish } from "../services/event-bus.js";
import { searchMemory, storeMemory } from "../services/memory-service.js";

export async function registerHttpRoutes(app) {
  app.post("/v1/intent/analyze", async (request) => {
    const body = request.body;
    return {
      intent: "action.request",
      confidence: 0.92,
      extractedGoal: body.userRequest
    };
  });

  app.post("/v1/plan/generate", async (request) => {
    const body = request.body;
    const plan = createPlanFromRequest(body.userRequest);
    publish(coreEventSchema.parse({ type: "plan.proposed", plan, userRequest: body.userRequest }));
    return { plan };
  });

  app.post("/v1/approval/request", async (request) => {
    const body = request.body;
    planSchema.parse(body.plan);
    const approvalId = randomUUID();

    db.prepare(
      "INSERT INTO approvals (id, task_id, plan_id, status, created_at) VALUES (?, ?, ?, ?, ?)"
    ).run(approvalId, body.taskId, body.plan.id, "pending", new Date().toISOString());

    writeAuditLog({
      userRequest: body.plan.goal,
      plannedActions: JSON.stringify(body.plan.actions),
      approvalStatus: "pending",
      result: "Approval requested"
    });
    publish(coreEventSchema.parse({ type: "approval.requested", approvalId, planId: body.plan.id }));

    return {
      approvalId,
      tokenExpiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      transparency: {
        goal: body.plan.goal,
        plan: body.plan.actions.map((x) => x.label),
        toolsNeeded: body.plan.toolsNeeded,
        risks: body.plan.risks,
        status: "Waiting For Approval"
      }
    };
  });

  app.post("/v1/approval/respond", async (request) => {
    const body = request.body;
    const existing = db.prepare("SELECT id, status FROM approvals WHERE id = ?").get(body.approvalId);
    if (!existing) {
      return { error: "Approval request not found." };
    }

    const status = body.approved ? "approved" : "denied";
    db.prepare("UPDATE approvals SET status = ?, approved_by = ?, decided_at = ? WHERE id = ?").run(
      status,
      body.approvedBy,
      new Date().toISOString(),
      body.approvalId
    );
    publish(coreEventSchema.parse({ type: "approval.resolved", approvalId: body.approvalId, status }));
    return { approvalId: body.approvalId, status };
  });

  app.post("/v1/task/execute", async (request) => {
    const payload = executionRequestSchema.parse(request.body);
    assertApprovedExecution(payload);
    const taskId = randomUUID();
    const capabilityResults = executeActions(payload.plan.actions);

    writeAuditLog({
      userRequest: payload.userRequest,
      plannedActions: JSON.stringify(payload.plan.actions),
      approvalStatus: "approved",
      result: JSON.stringify(capabilityResults)
    });
    publish(
      coreEventSchema.parse({
        type: "task.executed",
        taskId,
        result: "Execution completed via capability stubs."
      })
    );

    return {
      status: "executed",
      taskId,
      message: "Execution stub completed after approval.",
      capabilityResults
    };
  });

  app.post("/v1/emergency/stop", async () => {
    writeAuditLog({
      userRequest: "Emergency stop",
      approvalStatus: "approved",
      result: "All running tasks were stopped."
    });
    publish(coreEventSchema.parse({ type: "task.stopped", reason: "Emergency command invoked." }));
    return { status: "stopped", message: "Emergency stop activated." };
  });

  app.get("/v1/audit/search", async (request) => {
    const query = request.query.q ?? "";
    const rows = db
      .prepare(
        "SELECT * FROM audit_logs WHERE user_request LIKE ? OR result LIKE ? ORDER BY timestamp DESC LIMIT 50"
      )
      .all(`%${query}%`, `%${query}%`);
    return { rows };
  });

  app.get("/v1/approval/:id", async (request) => {
    const params = request.params;
    const row = db.prepare("SELECT id, status FROM approvals WHERE id = ?").get(params.id);

    if (!row) {
      return { status: "missing" };
    }
    return row;
  });

  app.post("/v1/memory/store", async (request) => {
    const body = request.body;
    const id = storeMemory(body);
    return { id };
  });

  app.get("/v1/memory/search", async (request) => {
    const query = request.query.q ?? "";
    return { rows: searchMemory(query) };
  });
}
