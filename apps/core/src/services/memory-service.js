import { randomUUID } from "node:crypto";
import { db } from "../db/client.js";

export function storeMemory(input) {
  const id = randomUUID();
  db.prepare(
    "INSERT INTO memories (id, user_id, kind, content, created_at) VALUES (?, ?, ?, ?, ?)"
  ).run(id, input.userId, input.kind, input.content, new Date().toISOString());
  return id;
}

export function searchMemory(query) {
  return db
    .prepare(
      "SELECT id, user_id, kind, content, created_at FROM memories WHERE content LIKE ? OR kind LIKE ? ORDER BY created_at DESC LIMIT 50"
    )
    .all(`%${query}%`, `%${query}%`);
}
