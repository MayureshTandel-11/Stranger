import { randomUUID } from "node:crypto";
import { auditLogsRepository } from "../db/repositories.js";

/**
 * Write audit log using MongoDB
 */
export async function writeAuditLog(input) {
  await auditLogsRepository.create({
    id: randomUUID(),
    task_id: input.taskId || null,
    approval_id: input.approvalId || null,
    actor: input.actor || "system",
    event_type: input.eventType || "audit",
    event_payload_json: JSON.stringify({
      userRequest: input.userRequest,
      plannedActions: input.plannedActions,
      approvalStatus: input.approvalStatus,
      result: input.result
    }),
    result: input.result,
    severity: input.severity || "info",
    created_at: new Date().toISOString()
  });
}

/**
 * Search audit logs
 */
export async function searchAuditLogs(query, limit = 50) {
  return auditLogsRepository.search(query, limit);
}
