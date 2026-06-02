import { connectMongoDB, disconnectMongoDB, healthCheck } from "./mongo-client.js";

let mongoDb = null;

/**
 * Initialize MongoDB database
 * Replaces the old SQLite initialization
 */
export async function initDb() {
  try {
    mongoDb = await connectMongoDB();
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw error;
  }
}

/**
 * Get MongoDB database instance
 * Provides backward-compatible interface for services
 */
export const db = {
  /**
   * Prepare a statement - MongoDB version
   * This provides a compatibility layer for existing code
   * @deprecated Use repositories instead for new code
   */
  prepare(query) {
    return {
      run: (...params) => {
        throw new Error("Use repositories instead. Direct SQL queries are not supported in MongoDB.");
      },
      get: (...params) => {
        throw new Error("Use repositories instead. Direct SQL queries are not supported in MongoDB.");
      },
      all: (...params) => {
        throw new Error("Use repositories instead. Direct SQL queries are not supported in MongoDB.");
      }
    };
  },

  /**
   * Execute raw SQL - not supported in MongoDB
   */
  exec: (sql) => {
    throw new Error("exec() is not supported in MongoDB. Use repositories instead.");
  }
};

/**
 * Shutdown database connection
 */
export async function shutdownDb() {
  await disconnectMongoDB();
  console.log("MongoDB disconnected");
}

/**
 * Health check for database
 */
export async function checkDbHealth() {
  return healthCheck();
}
