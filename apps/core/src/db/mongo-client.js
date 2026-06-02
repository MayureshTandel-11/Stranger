import { MongoClient, Db } from "mongodb";

let client = null;
let db = null;

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
const DB_NAME = process.env.MONGODB_DB_NAME || "stranger";

/**
 * Connect to MongoDB
 */
export async function connectMongoDB() {
  if (client) {
    return db;
  }

  client = new MongoClient(MONGODB_URI, {
    retryWrites: true,
    writeConcern: { w: "majority" }
  });

  await client.connect();
  db = client.db(DB_NAME);

  // Initialize indexes and schema
  await initializeMongoDB(db);

  return db;
}

/**
 * Initialize MongoDB collections, indexes, and schema
 */
export async function initializeMongoDB(database) {
  const collections = [
    "users",
    "profiles",
    "voice_profiles",
    "documents",
    "embeddings",
    "memories",
    "conversations",
    "tasks",
    "approvals",
    "audit_logs",
    "agent_state",
    "settings"
  ];

  // Create collections if they don't exist
  const existingCollections = await database.listCollections().toArray();
  const existingNames = existingCollections.map((c) => c.name);

  for (const collectionName of collections) {
    if (!existingNames.includes(collectionName)) {
      await database.createCollection(collectionName);
    }
  }

  // Create indexes for performance
  await createIndexes(database);
}

/**
 * Create MongoDB indexes for optimized queries
 */
async function createIndexes(database) {
  // Users collection
  await database.collection("users").createIndex({ email: 1 }, { unique: true, sparse: true });

  // Profiles collection
  await database.collection("profiles").createIndex({ user_id: 1 });

  // Voice profiles collection
  await database.collection("voice_profiles").createIndex({ user_id: 1 });
  await database.collection("voice_profiles").createIndex({ is_active: 1 });

  // Documents collection
  await database.collection("documents").createIndex({ user_id: 1 });
  await database.collection("documents").createIndex({ user_id: 1, created_at: -1 });

  // Embeddings collection
  await database.collection("embeddings").createIndex({ owner_type: 1, owner_id: 1 });
  await database.collection("embeddings").createIndex({ collection_name: 1 });

  // Memories collection
  await database.collection("memories").createIndex({ user_id: 1 });
  await database.collection("memories").createIndex({ user_id: 1, category: 1 });

  // Conversations collection
  await database.collection("conversations").createIndex({ user_id: 1 });
  await database.collection("conversations").createIndex({ session_id: 1, created_at: 1 });

  // Tasks collection
  await database.collection("tasks").createIndex({ user_id: 1 });
  await database.collection("tasks").createIndex({ status: 1 });
  await database.collection("tasks").createIndex({ user_id: 1, created_at: -1 });

  // Approvals collection
  await database.collection("approvals").createIndex({ task_id: 1 });
  await database.collection("approvals").createIndex({ expires_at: 1 }, { expireAfterSeconds: 0 });

  // Audit logs collection
  await database.collection("audit_logs").createIndex({ event_type: 1, created_at: -1 });
  await database.collection("audit_logs").createIndex({ task_id: 1 });
  await database.collection("audit_logs").createIndex({ approval_id: 1 });

  // Agent state collection
  await database.collection("agent_state").createIndex({ agent_name: 1 }, { unique: true });

  // Settings collection
  await database.collection("settings").createIndex({ user_id: 1, key: 1 }, { unique: true });
}

/**
 * Get the MongoDB database instance
 */
export function getDb() {
  if (!db) {
    throw new Error("MongoDB not connected. Call connectMongoDB() first.");
  }
  return db;
}

/**
 * Disconnect from MongoDB
 */
export async function disconnectMongoDB() {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

/**
 * Health check
 */
export async function healthCheck() {
  if (!db) {
    return false;
  }
  try {
    await db.admin().ping();
    return true;
  } catch (error) {
    return false;
  }
}
