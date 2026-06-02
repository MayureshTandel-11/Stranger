# MongoDB Migration Guide

## Overview

This guide documents the migration from SQLite to MongoDB for the Stranger AI Core database layer. All functionality, APIs, and business logic remain unchanged—only the database implementation is replaced.

## Architecture

### Before (SQLite)
- **Database**: SQLite (file-based)
- **ORM**: Raw SQL queries via `better-sqlite3`
- **Schema**: 12 relational tables with foreign keys
- **Connection**: Synchronous, single process

### After (MongoDB)
- **Database**: MongoDB (document-based)
- **Driver**: PyMongo (Python) / MongoDB Node.js driver (Node.js)
- **Schema**: 12 collections with document structure
- **Connection**: Async-ready, connection pooling, replica set compatible

## Database Schema Conversion

### Collection Structure

All 12 collections are created with the following structure:

#### users
```javascript
{
  _id: String (UUID),
  email: String (unique),
  display_name: String,
  locale: String,
  timezone: String,
  created_at: ISO String,
  updated_at: ISO String
}
```

#### profiles
```javascript
{
  _id: String (UUID),
  user_id: String (reference to users._id),
  preferred_name: String,
  wake_word: String,
  approval_mode_default: String,
  theme: String,
  created_at: ISO String,
  updated_at: ISO String
}
```

#### voice_profiles
```javascript
{
  _id: String (UUID),
  user_id: String (reference to users._id),
  engine: String,
  speaker_embedding: Binary,
  threshold: Number,
  is_active: Boolean,
  created_at: ISO String,
  updated_at: ISO String
}
```

#### documents
```javascript
{
  _id: String (UUID),
  user_id: String (reference to users._id),
  source_type: String,
  source_uri: String,
  title: String,
  mime_type: String,
  checksum: String,
  chunk_count: Number,
  indexed_at: ISO String,
  created_at: ISO String
}
```

#### embeddings
```javascript
{
  _id: String (UUID),
  owner_type: String,
  owner_id: String,
  provider: String (default: 'qdrant'),
  vector_dim: Number,
  collection_name: String,
  external_id: String,
  metadata_json: String,
  created_at: ISO String
}
```

#### memories
```javascript
{
  _id: String (UUID),
  user_id: String (reference to users._id),
  category: String,
  content: String,
  salience_score: Number,
  source: String,
  embedding_id: String (reference to embeddings._id),
  created_at: ISO String,
  updated_at: ISO String
}
```

#### conversations
```javascript
{
  _id: String (UUID),
  user_id: String (reference to users._id),
  session_id: String,
  role: String,
  message: String,
  tokens_in: Number,
  tokens_out: Number,
  created_at: ISO String
}
```

#### tasks
```javascript
{
  _id: String (UUID),
  user_id: String (reference to users._id),
  task_type: String,
  user_request: String,
  status: String (enum: 'pending','approved','executing','completed','failed','cancelled'),
  priority: Number,
  plan_id: String,
  approval_id: String,
  result_json: String,
  error_text: String,
  created_at: ISO String,
  updated_at: ISO String
}
```

#### approvals
```javascript
{
  _id: String (UUID),
  task_id: String (reference to tasks._id),
  approval_mode: String (enum: 'voice','keyboard','mouse'),
  decision: String (enum: 'pending','approved','rejected','expired'),
  approved_by: String,
  plan_hash: String,
  reason: String,
  requested_at: ISO String,
  decided_at: ISO String,
  expires_at: ISO String
}
```

#### audit_logs
```javascript
{
  _id: String (UUID),
  task_id: String (reference to tasks._id),
  approval_id: String (reference to approvals._id),
  actor: String,
  event_type: String,
  event_payload_json: String,
  result: String,
  severity: String,
  created_at: ISO String
}
```

#### agent_state
```javascript
{
  _id: String (UUID),
  agent_name: String (unique),
  state_json: String,
  heartbeat_at: ISO String,
  updated_at: ISO String
}
```

#### settings
```javascript
{
  _id: String (UUID),
  user_id: String (reference to users._id),
  key: String,
  value_json: String,
  updated_at: ISO String
  // Compound unique index: user_id + key
}
```

## Index Strategy

Indexes created for performance optimization:

| Collection | Index | Type | Options |
|-----------|-------|------|---------|
| users | email | 1 | unique, sparse |
| profiles | user_id | 1 | - |
| voice_profiles | user_id | 1 | - |
| voice_profiles | is_active | 1 | - |
| documents | user_id | 1 | - |
| documents | user_id, created_at | 1, -1 | - |
| embeddings | owner_type, owner_id | 1, 1 | - |
| embeddings | collection_name | 1 | - |
| memories | user_id | 1 | - |
| memories | user_id, category | 1, 1 | - |
| conversations | user_id | 1 | - |
| conversations | session_id, created_at | 1, 1 | - |
| tasks | user_id | 1 | - |
| tasks | status | 1 | - |
| tasks | user_id, created_at | 1, -1 | - |
| approvals | task_id | 1 | - |
| approvals | expires_at | 1 | TTL |
| audit_logs | event_type, created_at | 1, -1 | - |
| audit_logs | task_id | 1 | - |
| audit_logs | approval_id | 1 | - |
| agent_state | agent_name | 1 | unique |
| settings | user_id, key | 1, 1 | unique |

## Environment Configuration

### Local MongoDB

```bash
# Install MongoDB (macOS)
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community

# Set environment variables
export MONGODB_URI="mongodb://localhost:27017"
export MONGODB_DB_NAME="stranger"
```

### MongoDB Atlas (Cloud)

```bash
# Set environment variables
export MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/stranger?retryWrites=true&w=majority"
export MONGODB_DB_NAME="stranger"
```

### Node.js Environment File (.env)

```env
# Database
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=stranger

# Application
STRANGER_PORT=7331
LOG_LEVEL=info

# Qdrant (vector store - unchanged)
QDRANT_URL=http://localhost:6333
```

### Python Environment File (.env)

```env
# Database
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=stranger

# Application
API_PORT=8000
LOG_LEVEL=info

# Qdrant (vector store - unchanged)
QDRANT_URL=http://localhost:6333
```

## Implementation Files

### Node.js Backend

**New Files:**
- `apps/core/src/db/mongo-client.js` - MongoDB connection manager
- `apps/core/src/db/repositories.js` - Repository pattern for all CRUD operations

**Updated Files:**
- `apps/core/src/db/client.js` - Updated to initialize MongoDB
- `apps/core/src/server.js` - Added async MongoDB initialization
- `apps/core/src/routes/http.js` - Updated to use repositories
- `apps/core/src/services/audit-service.js` - MongoDB audit logging
- `apps/core/src/services/memory-service.js` - MongoDB memory operations
- `apps/core/package.json` - Replaced `better-sqlite3` with `mongodb`

**Removed Files:**
- `apps/core/src/db/schema.sql` - No longer needed (MongoDB creates collections dynamically)

### Python AI Core

**Updated Files:**
- `apps/ai-core/requirements.txt` - Added `pymongo` and `motor` for async support

## API Compatibility

All existing APIs remain unchanged:

- `GET /health` - Returns health status
- `POST /v1/plan/generate` - Plan generation
- `POST /v1/approval/request` - Request approval
- `POST /v1/approval/respond` - Respond to approval
- `POST /v1/task/execute` - Execute task
- `POST /v1/emergency/stop` - Emergency stop
- `GET /v1/audit/search` - Search audit logs
- `GET /v1/approval/:id` - Get approval status
- `POST /v1/memory/store` - Store memory
- `GET /v1/memory/search` - Search memory

Request/response formats remain identical.

## Data Migration Steps

### Option 1: Fresh Start (for development)

```bash
# 1. Start MongoDB
brew services start mongodb-community

# 2. Install dependencies
cd apps/core
pnpm install

# 3. Start the server (it will create collections automatically)
pnpm dev
```

### Option 2: Migrate from SQLite (for production)

#### Step 1: Export SQLite data

```bash
# Export each table to JSON
sqlite3 -json stranger.sqlite "SELECT * FROM users;" > users.json
sqlite3 -json stranger.sqlite "SELECT * FROM profiles;" > profiles.json
# ... repeat for all tables
```

#### Step 2: Create Python migration script

```python
import json
import pymongo
from datetime import datetime

client = pymongo.MongoClient("mongodb://localhost:27017")
db = client["stranger"]

# Load and insert each collection
with open("users.json") as f:
    users = json.load(f)
    if users:
        db["users"].insert_many(users)

# ... repeat for other collections
```

#### Step 3: Verify data integrity

```javascript
// In MongoDB
db.getCollection("users").countDocuments()
db.getCollection("tasks").countDocuments()
// ... etc
```

## Repository Pattern

All data access goes through repository objects in `apps/core/src/db/repositories.js`:

```javascript
// Create
await usersRepository.create(user);

// Read
const user = await usersRepository.findById(userId);
const user = await usersRepository.findByEmail(email);

// Update
await usersRepository.update(userId, { display_name: "New Name" });

// Delete
await usersRepository.delete(userId);

// Search
const memories = await memoriesRepository.search(userId, "query");
const tasks = await tasksRepository.findByUserIdAndStatus(userId, "pending");
```

## Security Considerations

### Connection Security

```javascript
// MongoDB client with security options
const client = new MongoClient(MONGODB_URI, {
  retryWrites: true,
  writeConcern: { w: "majority" },
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 10000
});
```

### Data Validation

- All inputs validated with Zod schemas
- Proper error handling with try-catch
- Transaction support for multi-document operations

### Audit Trail

- All write operations logged to `audit_logs` collection
- Timestamp on every record
- Event tracking for compliance

## Performance Optimization

### Query Patterns

1. **User lookups**: Indexed on `_id` (primary key) and `email` (unique)
2. **Task queries**: Indexed on `user_id`, `status`, and creation time
3. **Memory search**: Full-text search pattern optimized
4. **Audit logs**: Indexed on event type and timestamp

### Connection Pooling

MongoDB Node.js driver automatically manages connection pooling:
- Default: 10 connections
- Configurable via connection string options

### Pagination

Implement cursor-based pagination for large datasets:
```javascript
const page1 = await collection.find({}).limit(50).toArray();
const lastId = page1[page1.length - 1]._id;
const page2 = await collection.find({ _id: { $gt: lastId } }).limit(50).toArray();
```

## Troubleshooting

### Connection Issues

```bash
# Check MongoDB is running
brew services list

# Start MongoDB if stopped
brew services start mongodb-community

# Check connection
mongosh "mongodb://localhost:27017"
```

### Data Validation Issues

- Ensure IDs are strings (UUIDs), not ObjectIds
- Check timestamp formats (ISO 8601)
- Verify enums match allowed values

### Performance Issues

- Check index status: `db.collection.getIndexes()`
- Monitor query performance: Enable profiling
- Use explain() to analyze queries: `db.collection.find().explain("executionStats")`

## Rollback Plan

If issues occur with MongoDB:

1. **Backup current state**: Export MongoDB collections to JSON
2. **Recreate SQLite DB**: Restore from backup or reinitialize
3. **Revert package.json**: Change back to `better-sqlite3`
4. **Restart services**: Clear cache and restart all services

## Future Enhancements

1. **Replica Sets**: For high availability in production
2. **Sharding**: For horizontal scaling
3. **Change Streams**: For real-time data synchronization
4. **Transactions**: For multi-document ACID transactions
5. **Atlas Search**: For advanced full-text search capabilities
6. **Time-series Collections**: For conversation and event data

## Support

For issues or questions about the MongoDB migration:

1. Check MongoDB logs: `brew log mongodb-community`
2. Review repository implementations in `apps/core/src/db/repositories.js`
3. Verify environment variables are set correctly
4. Test with MongoDB Compass (GUI client)
