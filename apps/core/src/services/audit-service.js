import { randomUUID } from "node:crypto";
import { db } from "../db/client.js";

export function writeAuditLog(input) {
  const statement = db.prepare(`
    INSERT INTO audit_logs (id, timestamp, user_request, planned_actions, approval_status, result)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  statement.run(
    randomUUID(),
    new Date().toISOString(),
    input.userRequest,
    input.plannedActions ?? null,
    input.approvalStatus,
    input.result
  );
}
