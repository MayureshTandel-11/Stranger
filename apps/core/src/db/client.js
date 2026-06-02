import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const dbPath = path.resolve(process.cwd(), "stranger.sqlite");
const schemaPath = path.resolve(process.cwd(), "src/db/schema.sql");

export const db = new Database(dbPath);

export function initDb() {
  const schema = fs.readFileSync(schemaPath, "utf8");
  db.exec(schema);
}
