# MongoDB Schema and Data Model Reference

## Collection Schema Definitions

This document provides the complete schema definitions for all MongoDB collections used in Stranger.

## 1. Users Collection

**Collection Name**: `users`  
**Primary Key**: `_id` (String/UUID)  
**Unique Index**: `email`

```javascript
{
  _id: String,                 // UUID, primary key
  email: String,               // Unique, user's email address
  display_name: String,        // User's display name
  locale: String,              // User's locale (default: 'en-IN')
  timezone: String,            // User's timezone (default: 'Asia/Kolkata')
  created_at: String,          // ISO 8601 timestamp
  updated_at: String           // ISO 8601 timestamp
}
```

**Example**:
```javascript
{
  _id: "550e8400-e29b-41d4-a716-446655440000",
  email: "john@example.com",
  display_name: "John Doe",
  locale: "en-IN",
  timezone: "Asia/Kolkata",
  created_at: "2026-06-02T10:30:00Z",
  updated_at: "2026-06-02T10:30:00Z"
}
```

**Relationships**:
- Referenced by: `profiles`, `voice_profiles`, `documents`, `memories`, `conversations`, `tasks`, `settings`

---

## 2. Profiles Collection

**Collection Name**: `profiles`  
**Primary Key**: `_id` (String/UUID)  
**Foreign Key**: `user_id` (references users._id)

```javascript
{
  _id: String,                      // UUID, primary key
  user_id: String,                  // Reference to users._id
  preferred_name: String,           // User's preferred name (optional)
  wake_word: String,                // Voice wake word (default: 'Hey Stranger')
  approval_mode_default: String,    // Default approval mode (default: 'voice_keyboard_mouse')
  theme: String,                    // UI theme (default: 'dark')
  created_at: String,               // ISO 8601 timestamp
  updated_at: String                // ISO 8601 timestamp
}
```

**Example**:
```javascript
{
  _id: "660e8400-e29b-41d4-a716-446655440000",
  user_id: "550e8400-e29b-41d4-a716-446655440000",
  preferred_name: "Johnny",
  wake_word: "Hey Stranger",
  approval_mode_default: "voice_keyboard_mouse",
  theme: "dark",
  created_at: "2026-06-02T10:30:00Z",
  updated_at: "2026-06-02T10:30:00Z"
}
```

**One-to-One Relationship**: Each user has exactly one profile.

---

## 3. Voice Profiles Collection

**Collection Name**: `voice_profiles`  
**Primary Key**: `_id` (String/UUID)  
**Foreign Key**: `user_id` (references users._id)

```javascript
{
  _id: String,                      // UUID, primary key
  user_id: String,                  // Reference to users._id
  engine: String,                   // Voice engine type (e.g., 'whisper', 'google')
  speaker_embedding: Binary,        // Encoded speaker embedding for voice identification
  threshold: Number,                // Similarity threshold (default: 0.72)
  is_active: Boolean,               // Whether this profile is active (default: true)
  created_at: String,               // ISO 8601 timestamp
  updated_at: String                // ISO 8601 timestamp
}
```

**Example**:
```javascript
{
  _id: "770e8400-e29b-41d4-a716-446655440000",
  user_id: "550e8400-e29b-41d4-a716-446655440000",
  engine: "whisper",
  speaker_embedding: BinData(0, "...encoded binary data..."),
  threshold: 0.72,
  is_active: true,
  created_at: "2026-06-02T10:30:00Z",
  updated_at: "2026-06-02T10:30:00Z"
}
```

**One-to-Many Relationship**: Each user can have multiple voice profiles.

---

## 4. Documents Collection

**Collection Name**: `documents`  
**Primary Key**: `_id` (String/UUID)  
**Foreign Key**: `user_id` (references users._id)

```javascript
{
  _id: String,                      // UUID, primary key
  user_id: String,                  // Reference to users._id
  source_type: String,              // Type of source (e.g., 'file', 'url', 'email')
  source_uri: String,               // URI or path to source
  title: String,                    // Document title
  mime_type: String,                // MIME type (e.g., 'application/pdf')
  checksum: String,                 // SHA256 checksum for deduplication
  chunk_count: Number,              // Number of chunks created (default: 0)
  indexed_at: String,               // ISO 8601 timestamp of last indexing
  created_at: String                // ISO 8601 timestamp
}
```

**Example**:
```javascript
{
  _id: "880e8400-e29b-41d4-a716-446655440000",
  user_id: "550e8400-e29b-41d4-a716-446655440000",
  source_type: "file",
  source_uri: "/home/user/documents/report.pdf",
  title: "Q2 Report",
  mime_type: "application/pdf",
  checksum: "abc123def456...",
  chunk_count: 25,
  indexed_at: "2026-06-02T11:00:00Z",
  created_at: "2026-06-02T10:30:00Z"
}
```

**One-to-Many Relationship**: Each user can have multiple documents.

---

## 5. Embeddings Collection

**Collection Name**: `embeddings`  
**Primary Key**: `_id` (String/UUID)  
**No Foreign Keys**: References are stored as strings

```javascript
{
  _id: String,                      // UUID, primary key
  owner_type: String,               // Type of owner (e.g., 'document', 'memory', 'conversation')
  owner_id: String,                 // ID of owner
  provider: String,                 // Vector store provider (default: 'qdrant')
  vector_dim: Number,               // Dimension of vector
  collection_name: String,          // Qdrant collection name
  external_id: String,              // ID in external vector store (Qdrant)
  metadata_json: String,            // JSON metadata about embedding
  created_at: String                // ISO 8601 timestamp
}
```

**Example**:
```javascript
{
  _id: "990e8400-e29b-41d4-a716-446655440000",
  owner_type: "memory",
  owner_id: "memory-001",
  provider: "qdrant",
  vector_dim: 1536,
  collection_name: "memories",
  external_id: "qdrant-uuid-001",
  metadata_json: "{\"source\": \"conversation\", \"user_id\": \"550e8400-e29b-41d4-a716-446655440000\"}",
  created_at: "2026-06-02T10:30:00Z"
}
```

**Relationship with Qdrant**: Embeddings are stored in Qdrant; MongoDB stores metadata and references.

---

## 6. Memories Collection

**Collection Name**: `memories`  
**Primary Key**: `_id` (String/UUID)  
**Foreign Keys**: `user_id`, `embedding_id`

```javascript
{
  _id: String,                      // UUID, primary key
  user_id: String,                  // Reference to users._id
  category: String,                 // Memory category (e.g., 'preference', 'fact', 'goal')
  content: String,                  // Memory content
  salience_score: Number,           // Importance score 0-1 (default: 0.5)
  source: String,                   // Source of memory (default: 'conversation')
  embedding_id: String,             // Reference to embeddings._id (optional)
  created_at: String,               // ISO 8601 timestamp
  updated_at: String                // ISO 8601 timestamp
}
```

**Example**:
```javascript
{
  _id: "aaa0e8400-e29b-41d4-a716-446655440000",
  user_id: "550e8400-e29b-41d4-a716-446655440000",
  category: "preference",
  content: "User prefers dark theme and works late at night",
  salience_score: 0.85,
  source: "conversation",
  embedding_id: "990e8400-e29b-41d4-a716-446655440000",
  created_at: "2026-06-02T10:30:00Z",
  updated_at: "2026-06-02T10:30:00Z"
}
```

**One-to-Many Relationship**: Each user can have many memories.

---

## 7. Conversations Collection

**Collection Name**: `conversations`  
**Primary Key**: `_id` (String/UUID)  
**Foreign Key**: `user_id` (references users._id)

```javascript
{
  _id: String,                      // UUID, primary key
  user_id: String,                  // Reference to users._id
  session_id: String,               // Session identifier
  role: String,                     // Role of speaker (e.g., 'user', 'assistant')
  message: String,                  // Message content
  tokens_in: Number,                // Input tokens used
  tokens_out: Number,               // Output tokens generated
  created_at: String                // ISO 8601 timestamp
}
```

**Example**:
```javascript
{
  _id: "bbb0e8400-e29b-41d4-a716-446655440000",
  user_id: "550e8400-e29b-41d4-a716-446655440000",
  session_id: "session-001",
  role: "user",
  message: "Can you help me write a Python function?",
  tokens_in: 15,
  tokens_out: 0,
  created_at: "2026-06-02T10:30:00Z"
}
```

**One-to-Many Relationship**: Each user can have many conversation messages.

---

## 8. Tasks Collection

**Collection Name**: `tasks`  
**Primary Key**: `_id` (String/UUID)  
**Foreign Key**: `user_id` (references users._id)

```javascript
{
  _id: String,                      // UUID, primary key
  user_id: String,                  // Reference to users._id
  task_type: String,                // Type of task (e.g., 'browser', 'system', 'file')
  user_request: String,             // Original user request
  status: String,                   // Status enum: 'pending','approved','executing','completed','failed','cancelled'
  priority: Number,                 // Priority level (default: 5)
  plan_id: String,                  // Reference to plan
  approval_id: String,              // Reference to approval
  result_json: String,              // Result as JSON
  error_text: String,               // Error message if failed
  created_at: String,               // ISO 8601 timestamp
  updated_at: String                // ISO 8601 timestamp
}
```

**Example**:
```javascript
{
  _id: "ccc0e8400-e29b-41d4-a716-446655440000",
  user_id: "550e8400-e29b-41d4-a716-446655440000",
  task_type: "browser",
  user_request: "Search for MongoDB tutorials",
  status: "completed",
  priority: 5,
  plan_id: "plan-001",
  approval_id: "approval-001",
  result_json: "{\"opened_url\": \"https://www.mongodb.com\"}",
  error_text: null,
  created_at: "2026-06-02T10:30:00Z",
  updated_at: "2026-06-02T10:35:00Z"
}
```

**Status Enum**:
- `pending`: Task created, waiting for processing
- `approved`: Approved by user, ready to execute
- `executing`: Currently executing
- `completed`: Successfully completed
- `failed`: Failed during execution
- `cancelled`: User cancelled the task

---

## 9. Approvals Collection

**Collection Name**: `approvals`  
**Primary Key**: `_id` (String/UUID)  
**Foreign Key**: `task_id` (references tasks._id)

```javascript
{
  _id: String,                      // UUID, primary key
  task_id: String,                  // Reference to tasks._id
  approval_mode: String,            // Approval mode enum: 'voice','keyboard','mouse'
  decision: String,                 // Decision enum: 'pending','approved','rejected','expired'
  approved_by: String,              // User ID who approved (if approved)
  plan_hash: String,                // Hash of plan for verification
  reason: String,                   // Reason for decision (if rejected)
  requested_at: String,             // ISO 8601 timestamp
  decided_at: String,               // ISO 8601 timestamp (if decided)
  expires_at: String                // ISO 8601 timestamp when approval expires
}
```

**Example**:
```javascript
{
  _id: "ddd0e8400-e29b-41d4-a716-446655440000",
  task_id: "ccc0e8400-e29b-41d4-a716-446655440000",
  approval_mode: "voice",
  decision: "approved",
  approved_by: "550e8400-e29b-41d4-a716-446655440000",
  plan_hash: "sha256hash123",
  reason: null,
  requested_at: "2026-06-02T10:30:00Z",
  decided_at: "2026-06-02T10:31:00Z",
  expires_at: "2026-06-02T10:35:00Z"
}
```

**Decision Enum**:
- `pending`: Awaiting user response
- `approved`: User approved the action
- `rejected`: User rejected the action
- `expired`: Approval window expired

---

## 10. Audit Logs Collection

**Collection Name**: `audit_logs`  
**Primary Key**: `_id` (String/UUID)  
**Foreign Keys**: `task_id`, `approval_id` (both optional)

```javascript
{
  _id: String,                      // UUID, primary key
  task_id: String,                  // Reference to tasks._id (optional)
  approval_id: String,              // Reference to approvals._id (optional)
  actor: String,                    // Actor performing the action
  event_type: String,               // Type of event (e.g., 'approval', 'execution', 'error')
  event_payload_json: String,       // Full event details as JSON
  result: String,                   // Result or status message
  severity: String,                 // Severity: 'info','warn','error'
  created_at: String                // ISO 8601 timestamp
}
```

**Example**:
```javascript
{
  _id: "eee0e8400-e29b-41d4-a716-446655440000",
  task_id: "ccc0e8400-e29b-41d4-a716-446655440000",
  approval_id: "ddd0e8400-e29b-41d4-a716-446655440000",
  actor: "system",
  event_type: "execution",
  event_payload_json: "{\"actions\": [...], \"status\": \"completed\"}",
  result: "Execution successful",
  severity: "info",
  created_at: "2026-06-02T10:35:00Z"
}
```

---

## 11. Agent State Collection

**Collection Name**: `agent_state`  
**Primary Key**: `_id` (String/UUID)  
**Unique Index**: `agent_name`

```javascript
{
  _id: String,                      // UUID, primary key
  agent_name: String,               // Unique agent name
  state_json: String,               // Agent state as JSON
  heartbeat_at: String,             // ISO 8601 timestamp of last heartbeat
  updated_at: String                // ISO 8601 timestamp of last update
}
```

**Example**:
```javascript
{
  _id: "fff0e8400-e29b-41d4-a716-446655440000",
  agent_name: "planning_agent",
  state_json: "{\"queue_length\": 3, \"last_plan_id\": \"plan-001\"}",
  heartbeat_at: "2026-06-02T10:35:00Z",
  updated_at: "2026-06-02T10:35:00Z"
}
```

**One-to-One Relationship**: Each agent has exactly one state record.

---

## 12. Settings Collection

**Collection Name**: `settings`  
**Primary Key**: `_id` (String/UUID)  
**Composite Unique Index**: `user_id + key`

```javascript
{
  _id: String,                      // UUID, primary key
  user_id: String,                  // Reference to users._id
  key: String,                      // Setting key
  value_json: String,               // Setting value as JSON
  updated_at: String                // ISO 8601 timestamp
}
```

**Example**:
```javascript
{
  _id: "ggg0e8400-e29b-41d4-a716-446655440000",
  user_id: "550e8400-e29b-41d4-a716-446655440000",
  key: "notifications_enabled",
  value_json: "true",
  updated_at: "2026-06-02T10:30:00Z"
}
```

**One-to-Many Relationship**: Each user can have multiple settings.

---

## Data Types Reference

| Type | MongoDB Type | Example | Notes |
|------|--------------|---------|-------|
| UUID | String | "550e8400-e29b-41d4-a716-446655440000" | 36-character UUID string |
| Timestamp | String (ISO 8601) | "2026-06-02T10:30:00Z" | Always use ISO 8601 format |
| JSON | String | "{\"key\": \"value\"}" | Store as JSON string, parse when needed |
| Boolean | Boolean | true, false | Native MongoDB boolean |
| Number | Int or Double | 0.72, 5 | Use appropriate numeric type |
| Binary | BinData | BinData(0, "...") | For embeddings and binary data |
| Reference | String | "550e8400-e29b-41d4-a716-446655440000" | Store ID as string |

---

## Validation Rules

### Field Constraints

| Collection | Field | Constraint |
|-----------|-------|-----------|
| users | email | Required, Unique |
| users | display_name | Required, String |
| profiles | user_id | Required, Must exist in users |
| voice_profiles | speaker_embedding | Optional, Binary |
| tasks | status | Required, Must be in enum |
| approvals | decision | Required, Must be in enum |
| memories | content | Required, Min 1 char |
| conversations | role | Required, Either 'user' or 'assistant' |
| all | _id | Required, UUID format |
| all | created_at | Required, ISO 8601 |

### Query Patterns

**Find by user**:
```javascript
db.collection.find({ user_id: "user-uuid" })
```

**Find active records**:
```javascript
db.voice_profiles.find({ is_active: true })
```

**Find recent records**:
```javascript
db.tasks.find({ user_id: "user-uuid" }).sort({ created_at: -1 }).limit(10)
```

**Search in content**:
```javascript
db.memories.find({ content: { $regex: "pattern", $options: "i" } })
```

**Find by status**:
```javascript
db.tasks.find({ status: { $in: ["pending", "approved"] } })
```

---

## Migration from SQLite

### Data Type Mapping

| SQLite | MongoDB |
|--------|---------|
| TEXT | String |
| INTEGER | Number (Int) |
| REAL | Number (Double) |
| BLOB | BinData |
| NULL | null |

### Timestamp Conversion

SQLite stores timestamps as TEXT (ISO 8601) → MongoDB also uses STRING (ISO 8601)
No conversion needed; values transfer directly.

### ID Generation

SQLite uses TEXT for UUID strings → MongoDB also uses String
No conversion needed; continue using same UUID format.
