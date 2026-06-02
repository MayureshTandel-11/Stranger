import { ObjectId } from "mongodb";
import { getDb } from "./mongo-client.js";

/**
 * Repository pattern for MongoDB collections
 * Provides CRUD operations for all database entities
 */

// ============ USERS ============

export const usersRepository = {
  async create(user) {
    const collection = getDb().collection("users");
    const result = await collection.insertOne({
      _id: user.id,
      email: user.email,
      display_name: user.display_name,
      locale: user.locale || "en-IN",
      timezone: user.timezone || "Asia/Kolkata",
      created_at: user.created_at,
      updated_at: user.updated_at
    });
    return result.insertedId;
  },

  async findById(id) {
    const collection = getDb().collection("users");
    return collection.findOne({ _id: id });
  },

  async findByEmail(email) {
    const collection = getDb().collection("users");
    return collection.findOne({ email });
  },

  async update(id, updates) {
    const collection = getDb().collection("users");
    const result = await collection.updateOne({ _id: id }, { $set: { ...updates, updated_at: new Date().toISOString() } });
    return result.modifiedCount > 0;
  },

  async delete(id) {
    const collection = getDb().collection("users");
    const result = await collection.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }
};

// ============ PROFILES ============

export const profilesRepository = {
  async create(profile) {
    const collection = getDb().collection("profiles");
    return collection.insertOne({
      _id: profile.id,
      user_id: profile.user_id,
      preferred_name: profile.preferred_name,
      wake_word: profile.wake_word || "Hey Stranger",
      approval_mode_default: profile.approval_mode_default || "voice_keyboard_mouse",
      theme: profile.theme || "dark",
      created_at: profile.created_at,
      updated_at: profile.updated_at
    });
  },

  async findByUserId(userId) {
    const collection = getDb().collection("profiles");
    return collection.findOne({ user_id: userId });
  },

  async update(id, updates) {
    const collection = getDb().collection("profiles");
    const result = await collection.updateOne({ _id: id }, { $set: { ...updates, updated_at: new Date().toISOString() } });
    return result.modifiedCount > 0;
  },

  async delete(id) {
    const collection = getDb().collection("profiles");
    return collection.deleteOne({ _id: id });
  }
};

// ============ VOICE PROFILES ============

export const voiceProfilesRepository = {
  async create(profile) {
    const collection = getDb().collection("voice_profiles");
    return collection.insertOne({
      _id: profile.id,
      user_id: profile.user_id,
      engine: profile.engine,
      speaker_embedding: profile.speaker_embedding,
      threshold: profile.threshold || 0.72,
      is_active: profile.is_active || true,
      created_at: profile.created_at,
      updated_at: profile.updated_at
    });
  },

  async findByUserId(userId) {
    const collection = getDb().collection("voice_profiles");
    return collection.find({ user_id: userId }).toArray();
  },

  async findActiveByUserId(userId) {
    const collection = getDb().collection("voice_profiles");
    return collection.findOne({ user_id: userId, is_active: true });
  },

  async update(id, updates) {
    const collection = getDb().collection("voice_profiles");
    const result = await collection.updateOne({ _id: id }, { $set: { ...updates, updated_at: new Date().toISOString() } });
    return result.modifiedCount > 0;
  }
};

// ============ DOCUMENTS ============

export const documentsRepository = {
  async create(document) {
    const collection = getDb().collection("documents");
    return collection.insertOne({
      _id: document.id,
      user_id: document.user_id,
      source_type: document.source_type,
      source_uri: document.source_uri,
      title: document.title,
      mime_type: document.mime_type,
      checksum: document.checksum,
      chunk_count: document.chunk_count || 0,
      indexed_at: document.indexed_at,
      created_at: document.created_at
    });
  },

  async findById(id) {
    const collection = getDb().collection("documents");
    return collection.findOne({ _id: id });
  },

  async findByUserId(userId) {
    const collection = getDb().collection("documents");
    return collection.find({ user_id: userId }).toArray();
  },

  async update(id, updates) {
    const collection = getDb().collection("documents");
    const result = await collection.updateOne({ _id: id }, { $set: updates });
    return result.modifiedCount > 0;
  }
};

// ============ EMBEDDINGS ============

export const embeddingsRepository = {
  async create(embedding) {
    const collection = getDb().collection("embeddings");
    return collection.insertOne({
      _id: embedding.id,
      owner_type: embedding.owner_type,
      owner_id: embedding.owner_id,
      provider: embedding.provider || "qdrant",
      vector_dim: embedding.vector_dim,
      collection_name: embedding.collection_name,
      external_id: embedding.external_id,
      metadata_json: embedding.metadata_json,
      created_at: embedding.created_at
    });
  },

  async findById(id) {
    const collection = getDb().collection("embeddings");
    return collection.findOne({ _id: id });
  },

  async findByOwner(ownerType, ownerId) {
    const collection = getDb().collection("embeddings");
    return collection.find({ owner_type: ownerType, owner_id: ownerId }).toArray();
  },

  async findByCollectionName(collectionName) {
    const collection = getDb().collection("embeddings");
    return collection.find({ collection_name: collectionName }).toArray();
  }
};

// ============ MEMORIES ============

export const memoriesRepository = {
  async create(memory) {
    const collection = getDb().collection("memories");
    return collection.insertOne({
      _id: memory.id,
      user_id: memory.user_id,
      category: memory.category,
      content: memory.content,
      salience_score: memory.salience_score || 0.5,
      source: memory.source || "conversation",
      embedding_id: memory.embedding_id,
      created_at: memory.created_at,
      updated_at: memory.updated_at
    });
  },

  async findById(id) {
    const collection = getDb().collection("memories");
    return collection.findOne({ _id: id });
  },

  async findByUserId(userId, category = null) {
    const collection = getDb().collection("memories");
    const query = { user_id: userId };
    if (category) {
      query.category = category;
    }
    return collection.find(query).toArray();
  },

  async search(userId, query) {
    const collection = getDb().collection("memories");
    return collection
      .find({
        user_id: userId,
        $or: [{ content: { $regex: query, $options: "i" } }, { category: { $regex: query, $options: "i" } }]
      })
      .sort({ created_at: -1 })
      .limit(50)
      .toArray();
  },

  async update(id, updates) {
    const collection = getDb().collection("memories");
    const result = await collection.updateOne({ _id: id }, { $set: { ...updates, updated_at: new Date().toISOString() } });
    return result.modifiedCount > 0;
  }
};

// ============ CONVERSATIONS ============

export const conversationsRepository = {
  async create(conversation) {
    const collection = getDb().collection("conversations");
    return collection.insertOne({
      _id: conversation.id,
      user_id: conversation.user_id,
      session_id: conversation.session_id,
      role: conversation.role,
      message: conversation.message,
      tokens_in: conversation.tokens_in,
      tokens_out: conversation.tokens_out,
      created_at: conversation.created_at
    });
  },

  async findBySessionId(sessionId) {
    const collection = getDb().collection("conversations");
    return collection.find({ session_id: sessionId }).sort({ created_at: 1 }).toArray();
  },

  async findByUserId(userId) {
    const collection = getDb().collection("conversations");
    return collection.find({ user_id: userId }).sort({ created_at: -1 }).limit(100).toArray();
  }
};

// ============ TASKS ============

export const tasksRepository = {
  async create(task) {
    const collection = getDb().collection("tasks");
    return collection.insertOne({
      _id: task.id,
      user_id: task.user_id,
      task_type: task.task_type,
      user_request: task.user_request,
      status: task.status,
      priority: task.priority || 5,
      plan_id: task.plan_id,
      approval_id: task.approval_id,
      result_json: task.result_json,
      error_text: task.error_text,
      created_at: task.created_at,
      updated_at: task.updated_at
    });
  },

  async findById(id) {
    const collection = getDb().collection("tasks");
    return collection.findOne({ _id: id });
  },

  async findByUserId(userId) {
    const collection = getDb().collection("tasks");
    return collection.find({ user_id: userId }).sort({ created_at: -1 }).toArray();
  },

  async findByStatus(status) {
    const collection = getDb().collection("tasks");
    return collection.find({ status }).toArray();
  },

  async findByUserIdAndStatus(userId, status) {
    const collection = getDb().collection("tasks");
    return collection.find({ user_id: userId, status }).sort({ created_at: -1 }).toArray();
  },

  async update(id, updates) {
    const collection = getDb().collection("tasks");
    const result = await collection.updateOne({ _id: id }, { $set: { ...updates, updated_at: new Date().toISOString() } });
    return result.modifiedCount > 0;
  }
};

// ============ APPROVALS ============

export const approvalsRepository = {
  async create(approval) {
    const collection = getDb().collection("approvals");
    return collection.insertOne({
      _id: approval.id,
      task_id: approval.task_id,
      approval_mode: approval.approval_mode,
      decision: approval.decision,
      approved_by: approval.approved_by,
      plan_hash: approval.plan_hash,
      reason: approval.reason,
      requested_at: approval.requested_at,
      decided_at: approval.decided_at,
      expires_at: approval.expires_at
    });
  },

  async findById(id) {
    const collection = getDb().collection("approvals");
    return collection.findOne({ _id: id });
  },

  async findByTaskId(taskId) {
    const collection = getDb().collection("approvals");
    return collection.findOne({ task_id: taskId });
  },

  async findByDecision(decision) {
    const collection = getDb().collection("approvals");
    return collection.find({ decision }).toArray();
  },

  async update(id, updates) {
    const collection = getDb().collection("approvals");
    const result = await collection.updateOne({ _id: id }, { $set: updates });
    return result.modifiedCount > 0;
  }
};

// ============ AUDIT LOGS ============

export const auditLogsRepository = {
  async create(log) {
    const collection = getDb().collection("audit_logs");
    return collection.insertOne({
      _id: log.id,
      task_id: log.task_id,
      approval_id: log.approval_id,
      actor: log.actor,
      event_type: log.event_type,
      event_payload_json: log.event_payload_json,
      result: log.result,
      severity: log.severity || "info",
      created_at: log.created_at
    });
  },

  async findById(id) {
    const collection = getDb().collection("audit_logs");
    return collection.findOne({ _id: id });
  },

  async search(query, limit = 50) {
    const collection = getDb().collection("audit_logs");
    return collection
      .find({
        $or: [{ event_type: { $regex: query, $options: "i" } }, { result: { $regex: query, $options: "i" } }]
      })
      .sort({ created_at: -1 })
      .limit(limit)
      .toArray();
  },

  async findByEventType(eventType) {
    const collection = getDb().collection("audit_logs");
    return collection.find({ event_type: eventType }).sort({ created_at: -1 }).toArray();
  },

  async findByTaskId(taskId) {
    const collection = getDb().collection("audit_logs");
    return collection.find({ task_id: taskId }).toArray();
  }
};

// ============ AGENT STATE ============

export const agentStateRepository = {
  async create(state) {
    const collection = getDb().collection("agent_state");
    return collection.insertOne({
      _id: state.id,
      agent_name: state.agent_name,
      state_json: state.state_json,
      heartbeat_at: state.heartbeat_at,
      updated_at: state.updated_at
    });
  },

  async findByAgentName(agentName) {
    const collection = getDb().collection("agent_state");
    return collection.findOne({ agent_name: agentName });
  },

  async update(id, updates) {
    const collection = getDb().collection("agent_state");
    const result = await collection.updateOne({ _id: id }, { $set: { ...updates, updated_at: new Date().toISOString() } });
    return result.modifiedCount > 0;
  },

  async updateByAgentName(agentName, updates) {
    const collection = getDb().collection("agent_state");
    const result = await collection.updateOne(
      { agent_name: agentName },
      { $set: { ...updates, updated_at: new Date().toISOString() } },
      { upsert: true }
    );
    return result.modifiedCount > 0 || result.upsertedCount > 0;
  }
};

// ============ SETTINGS ============

export const settingsRepository = {
  async create(setting) {
    const collection = getDb().collection("settings");
    return collection.insertOne({
      _id: setting.id,
      user_id: setting.user_id,
      key: setting.key,
      value_json: setting.value_json,
      updated_at: setting.updated_at
    });
  },

  async findByUserIdAndKey(userId, key) {
    const collection = getDb().collection("settings");
    return collection.findOne({ user_id: userId, key });
  },

  async findByUserId(userId) {
    const collection = getDb().collection("settings");
    return collection.find({ user_id: userId }).toArray();
  },

  async upsert(userId, key, valueJson) {
    const collection = getDb().collection("settings");
    const result = await collection.updateOne(
      { user_id: userId, key },
      {
        $set: {
          value_json: valueJson,
          updated_at: new Date().toISOString()
        }
      },
      { upsert: true }
    );
    return result.modifiedCount > 0 || result.upsertedCount > 0;
  },

  async delete(userId, key) {
    const collection = getDb().collection("settings");
    const result = await collection.deleteOne({ user_id: userId, key });
    return result.deletedCount > 0;
  }
};
