import { randomUUID } from "node:crypto";
import { memoriesRepository } from "../db/repositories.js";

/**
 * Store memory in MongoDB
 */
export async function storeMemory(input) {
  const id = randomUUID();
  await memoriesRepository.create({
    id,
    user_id: input.userId,
    category: input.kind || "general",
    content: input.content,
    salience_score: input.salienceScore || 0.5,
    source: input.source || "conversation",
    embedding_id: input.embeddingId || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
  return id;
}

/**
 * Search memories in MongoDB
 */
export async function searchMemory(query) {
  if (!query) {
    return [];
  }
  // Search across all users for now (in production, filter by userId)
  const collection = (await import("../db/mongo-client.js")).getDb().collection("memories");
  return collection
    .find({
      $or: [{ content: { $regex: query, $options: "i" } }, { category: { $regex: query, $options: "i" } }]
    })
    .sort({ created_at: -1 })
    .limit(50)
    .toArray();
}
