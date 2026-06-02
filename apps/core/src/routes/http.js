import { randomUUID } from "node:crypto";
import { coreEventSchema, executionRequestSchema, planSchema } from "@stranger/shared";
import { executeActions } from "../agents/capability-agent.js";
import { createPlanFromRequest } from "../agents/planning-agent.js";
import { approvalsRepository, auditLogsRepository, memoriesRepository } from "../db/repositories.js";
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

    // Create approval record in MongoDB
    await approvalsRepository.create({
      id: approvalId,
      task_id: body.taskId,
      approval_mode: "voice_keyboard_mouse",
      decision: "pending",
      approved_by: null,
      plan_hash: body.plan.id,
      reason: null,
      requested_at: new Date().toISOString(),
      decided_at: null,
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString()
    });

    // Write audit log
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
    const existing = await approvalsRepository.findById(body.approvalId);

    if (!existing) {
      return { error: "Approval request not found." };
    }

    const status = body.approved ? "approved" : "rejected";
    await approvalsRepository.update(body.approvalId, {
      decision: status,
      approved_by: body.approvedBy,
      decided_at: new Date().toISOString()
    });

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
    const rows = await auditLogsRepository.search(query, 50);
    return { rows };
  });

  app.get("/v1/approval/:id", async (request) => {
    const params = request.params;
    const row = await approvalsRepository.findById(params.id);

    if (!row) {
      return { status: "missing" };
    }
    return row;
  });

  app.post("/v1/memory/store", async (request) => {
    const body = request.body;
    const id = await storeMemory(body);
    return { id };
  });

  app.get("/v1/memory/search", async (request) => {
    const query = request.query.q ?? "";
    const rows = await searchMemory(query);
    return { rows };
  });
}
