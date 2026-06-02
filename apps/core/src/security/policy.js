import { db } from "../db/client.js";

export function assertApprovedExecution(request) {
  const row = db
    .prepare("SELECT id, status FROM approvals WHERE id = ?")
    .get(request.approvalId);

  if (!row) {
    throw new Error("Approval record not found.");
  }

  if (row.status !== "approved") {
    throw new Error("Execution blocked: explicit approval is required.");
  }
}
