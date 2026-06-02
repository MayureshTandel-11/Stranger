const gatewayBaseUrl = "http://127.0.0.1:7332";
const coreBaseUrl = "http://127.0.0.1:7331";

export async function analyzeIntent(userRequest) {
  const response = await fetch(`${coreBaseUrl}/v1/intent/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userRequest })
  });
  if (!response.ok) {
    throw new Error("Intent analysis failed.");
  }
  return response.json();
}

export async function generatePlan(sessionId, userRequest) {
  const response = await fetch(`${gatewayBaseUrl}/v1/plan-and-request-approval`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, userRequest })
  });
  if (!response.ok) {
    throw new Error("Plan generation failed.");
  }
  return response.json();
}

export async function requestApproval(taskId, plan) {
  const response = await fetch(`${coreBaseUrl}/v1/approval/request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      taskId,
      plan: {
        id: plan.planId,
        goal: plan.goal,
        toolsNeeded: plan.toolsNeeded,
        risks: plan.risks,
        actions: plan.actions
      }
    })
  });
  if (!response.ok) {
    throw new Error("Approval request failed.");
  }
  return response.json();
}

export async function submitApproval(params) {
  const response = await fetch(`${gatewayBaseUrl}/v1/approval/respond`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      approvalId: params.approvalId,
      decision: params.decision,
      approvedBy: `local-user:${params.mode}`
    })
  });
  if (!response.ok) {
    throw new Error("Approval response failed.");
  }
}

export async function executeTask(params) {
  const response = await fetch(`${coreBaseUrl}/v1/task/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: params.userId,
      userRequest: params.userRequest,
      approvalId: params.approvalId,
      plan: {
        id: params.plan.planId,
        goal: params.plan.goal,
        toolsNeeded: params.plan.toolsNeeded,
        risks: params.plan.risks,
        actions: params.plan.actions
      }
    })
  });
  if (!response.ok) {
    throw new Error("Task execution failed.");
  }
  return response.json();
}

export async function interruptTask(taskId, command) {
  const response = await fetch(`${gatewayBaseUrl}/v1/task/interrupt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ taskId, command })
  });
  if (!response.ok) {
    throw new Error("Task interrupt failed.");
  }
}
