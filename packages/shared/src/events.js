import { z } from "zod";

export const approvalStatusSchema = z.enum(["pending", "approved", "denied", "expired"]);

export const proposedActionSchema = z.object({
  id: z.string(),
  label: z.string(),
  tool: z.string(),
  risk: z.enum(["low", "medium", "high"]),
  args: z.record(z.any()).default({})
});

export const planSchema = z.object({
  id: z.string(),
  goal: z.string(),
  toolsNeeded: z.array(z.string()),
  risks: z.array(z.string()),
  actions: z.array(proposedActionSchema)
});

export const auditEventSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  userRequest: z.string(),
  planId: z.string().nullable(),
  approvalStatus: approvalStatusSchema,
  result: z.string()
});

export const executionRequestSchema = z.object({
  userId: z.string(),
  userRequest: z.string(),
  plan: planSchema,
  approvalId: z.string()
});

export const transparencyEnvelopeSchema = z.object({
  goal: z.string(),
  plan: z.array(z.string()),
  toolsNeeded: z.array(z.string()),
  risks: z.array(z.string()),
  status: z.literal("Waiting For Approval")
});

export const memoryRecordSchema = z.object({
  id: z.string(),
  userId: z.string(),
  kind: z.string(),
  content: z.string(),
  createdAt: z.string()
});

export const coreEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("plan.proposed"),
    plan: planSchema,
    userRequest: z.string()
  }),
  z.object({
    type: z.literal("approval.requested"),
    approvalId: z.string(),
    planId: z.string()
  }),
  z.object({
    type: z.literal("approval.resolved"),
    approvalId: z.string(),
    status: approvalStatusSchema
  }),
  z.object({
    type: z.literal("task.executed"),
    taskId: z.string(),
    result: z.string()
  }),
  z.object({
    type: z.literal("task.stopped"),
    reason: z.string()
  })
]);
