# MongoDB Migration Testing Guide

## Pre-Migration Testing

### 1. Connection Testing

#### Test MongoDB Connection (Local)

```bash
# Verify MongoDB is running
brew services list | grep mongodb

# Test with mongosh
mongosh --eval "db.admin().ping()"

# Expected output
# { ok: 1 }
```

#### Test MongoDB Connection (Atlas)

```bash
# Replace with your connection string
mongosh "mongodb+srv://username:password@cluster0.abc123.mongodb.net/test"

# If connected successfully, you'll see mongosh shell
```

### 2. Application Startup Testing

#### Node.js Backend

```bash
cd apps/core

# Install dependencies
pnpm install

# Start in development mode
pnpm dev

# Expected output
# MongoDB connected successfully
# Stranger Core server started successfully
# Listening on http://127.0.0.1:7331
```

#### Python AI Core

```bash
cd apps/ai-core

# Activate virtual environment
source venv/bin/activate

# Start server
python main.py

# Expected output
# INFO:     Uvicorn running on http://0.0.0.0:8000
# INFO:     Application startup complete
```

### 3. Database Schema Testing

#### Verify Collections Created

```javascript
// In mongosh
use stranger

// List all collections
show collections

// Expected output
admin_system_version
agent_state
approvals
audit_logs
conversations
documents
embeddings
memories
profiles
settings
tasks
users
voice_profiles
```

#### Verify Indexes

```javascript
// In mongosh
db.users.getIndexes()
db.tasks.getIndexes()
db.memories.getIndexes()
db.audit_logs.getIndexes()

// Expected: Each collection should have its configured indexes
```

### 4. API Endpoint Testing

#### Health Check

```bash
curl -X GET http://localhost:7331/health
# Expected: { "status": "ok" }
```

#### Create Memory

```bash
curl -X POST http://localhost:7331/v1/memory/store \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "kind": "test",
    "content": "This is a test memory"
  }'

# Expected: { "id": "uuid-string" }
```

#### Search Memory

```bash
curl -X GET "http://localhost:7331/v1/memory/search?q=test"

# Expected: { "rows": [...] }
```

#### Generate Plan

```bash
curl -X POST http://localhost:7331/v1/plan/generate \
  -H "Content-Type: application/json" \
  -d '{
    "userRequest": "Open browser and search for MongoDB"
  }'

# Expected: Plan object with actions
```

#### Request Approval

```bash
curl -X POST http://localhost:7331/v1/approval/request \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "task123",
    "plan": {
      "id": "plan123",
      "goal": "Open browser",
      "actions": [],
      "toolsNeeded": [],
      "risks": []
    }
  }'

# Expected: Approval ID with expiration time
```

#### Search Audit Logs

```bash
curl -X GET "http://localhost:7331/v1/audit/search?q=approval"

# Expected: Audit log entries matching query
```

### 5. Data Integrity Testing

#### Insert Test Data

```javascript
// In mongosh
use stranger

// Create test user
db.users.insertOne({
  _id: "user-test-001",
  email: "test@example.com",
  display_name: "Test User",
  locale: "en-IN",
  timezone: "Asia/Kolkata",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
})

// Create test memory
db.memories.insertOne({
  _id: "memory-test-001",
  user_id: "user-test-001",
  category: "general",
  content: "Test memory content",
  salience_score: 0.8,
  source: "test",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
})

// Create test task
db.tasks.insertOne({
  _id: "task-test-001",
  user_id: "user-test-001",
  task_type: "test",
  user_request: "Test task",
  status: "pending",
  priority: 5,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
})
```

#### Verify Data Retrieval

```javascript
// Query inserted data
db.users.findOne({ _id: "user-test-001" })
db.memories.findOne({ _id: "memory-test-001" })
db.tasks.findOne({ _id: "task-test-001" })

// Expected: All documents retrieved successfully
```

### 6. Query Performance Testing

#### Index Effectiveness

```javascript
// Test with explain to see index usage
db.tasks.find({ user_id: "user-test-001", status: "pending" }).explain("executionStats")

// Expected: "executionStages": { "stage": "COLLSCAN" or "IXSCAN" (indexed is better)
```

#### Query Execution Time

```javascript
// Measure query time
const start = Date.now()
db.memories.find({ user_id: "user-test-001" }).toArray()
const end = Date.now()
print(`Query took ${end - start}ms`)

// Expected: < 100ms for test data
```

### 7. Repository Pattern Testing

#### Test CRUD Operations

```javascript
// Test through Node.js API
// Create
POST /v1/memory/store { userId: "test", kind: "test", content: "test" }

// Read
GET /v1/memory/search?q=test

// Update
PUT /v1/task/update { id: "task-id", status: "completed" }

// Delete
DELETE /v1/task/delete { id: "task-id" }
```

## Post-Migration Testing

### 1. Data Consistency

```bash
# Compare record counts between old and new systems
# SQLite
sqlite3 stranger.db "SELECT 'users', COUNT(*) FROM users UNION ALL SELECT 'tasks', COUNT(*) FROM tasks..."

# MongoDB
mongosh --eval "
db.users.countDocuments()
db.tasks.countDocuments()
db.memories.countDocuments()
db.audit_logs.countDocuments()
"
```

### 2. Full Workflow Testing

#### Complete User Journey

```bash
# 1. Start application
cd apps/core && pnpm dev

# 2. Analyze intent
curl -X POST http://localhost:7331/v1/intent/analyze \
  -H "Content-Type: application/json" \
  -d '{"userRequest": "Open calculator"}'

# 3. Generate plan
curl -X POST http://localhost:7331/v1/plan/generate \
  -H "Content-Type: application/json" \
  -d '{"userRequest": "Open calculator"}'

# 4. Request approval
curl -X POST http://localhost:7331/v1/approval/request \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "task-001",
    "plan": {
      "id": "plan-001",
      "goal": "Open calculator",
      "actions": [{"id": "action-001", "label": "Open app", "tool": "system_agent", "risk": "low", "args": {}}],
      "toolsNeeded": ["system_agent"],
      "risks": []
    }
  }'

# 5. Respond to approval
curl -X POST http://localhost:7331/v1/approval/respond \
  -H "Content-Type: application/json" \
  -d '{
    "approvalId": "approval-id-from-step-4",
    "approved": true,
    "approvedBy": "user-001"
  }'

# 6. Execute task
curl -X POST http://localhost:7331/v1/task/execute \
  -H "Content-Type: application/json" \
  -d '{
    "userRequest": "Open calculator",
    "plan": { /* plan from step 3 */ }
  }'

# 7. Search audit logs
curl -X GET "http://localhost:7331/v1/audit/search?q=Open"

# Expected: All steps complete successfully
```

### 3. Memory System Testing

```bash
# Store memories
curl -X POST http://localhost:7331/v1/memory/store \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-001",
    "kind": "preference",
    "content": "User prefers dark theme"
  }'

# Search memories
curl -X GET "http://localhost:7331/v1/memory/search?q=theme"

# Verify memory is persistent across restarts
# 1. Stop server (Ctrl+C)
# 2. Start server again (pnpm dev)
# 3. Search memories again - should still be there
```

### 4. Approval System Testing

```bash
# Test approval expiration
# 1. Request approval
# 2. Note the tokenExpiresAt timestamp
# 3. Wait 5 minutes
# 4. Try to use expired approval - should fail

# Test approval rejection
# 1. Request approval
# 2. Respond with approved: false
# 3. Try to execute task - should be denied
```

### 5. Audit Trail Verification

```bash
# Verify all operations logged
db.audit_logs.find({ event_type: "approval" }).count()
db.audit_logs.find({ event_type: "execution" }).count()
db.audit_logs.find({ severity: "error" }).count()

# Expected: Growing count as operations execute
```

## Load Testing

### Basic Load Test with Apache Bench

```bash
# Test health endpoint (100 requests, 10 concurrent)
ab -n 100 -c 10 http://localhost:7331/health

# Expected output shows response times
```

### Load Test with Custom Script

```bash
#!/bin/bash

echo "Starting load test..."

for i in {1..100}; do
  curl -X POST http://localhost:7331/v1/memory/store \
    -H "Content-Type: application/json" \
    -d "{\"userId\": \"user-$i\", \"kind\": \"test\", \"content\": \"Test memory $i\"}" \
    > /dev/null 2>&1 &
done

wait
echo "Load test complete"

# Check MongoDB for all records
mongosh --eval "db.memories.countDocuments()"
```

## Rollback Testing

### Prepare Rollback

```bash
# Backup MongoDB
mongodump --uri="mongodb://localhost:27017" --out=./backup-$(date +%s)

# Keep SQLite database as fallback
cp stranger.db stranger.db.backup
```

### Test Rollback Procedure

```bash
# 1. Stop application
# 2. Revert package.json to use better-sqlite3
# 3. Revert client.js to SQLite version
# 4. Restart application
# 5. Verify application works with SQLite

# To restore MongoDB after testing rollback
# mongorestore ./backup-<timestamp>
```

## Monitoring Queries

### Active Connections

```javascript
db.serverStatus().connections
// Expected: Shows current, available, and totalCreated connections
```

### Database Size

```javascript
db.stats()
// Expected: Shows data size, storage size, number of collections
```

### Slow Queries

```javascript
db.setProfilingLevel(1, { slowms: 100 })
db.system.profile.find().sort({ ts: -1 }).limit(10).pretty()
```

## Automated Testing Script

```bash
#!/bin/bash

FAILED=0

echo "Running MongoDB Migration Tests..."

# Test 1: Connection
echo -n "Test 1: MongoDB Connection... "
if mongosh --eval "db.admin().ping()" &>/dev/null; then
  echo "✓"
else
  echo "✗"
  FAILED=$((FAILED+1))
fi

# Test 2: Collections exist
echo -n "Test 2: Collections Created... "
COLLECTIONS=$(mongosh --eval "show collections" 2>/dev/null | wc -l)
if [ $COLLECTIONS -ge 12 ]; then
  echo "✓"
else
  echo "✗"
  FAILED=$((FAILED+1))
fi

# Test 3: API Health
echo -n "Test 3: API Health Check... "
if curl -s http://localhost:7331/health | grep -q "ok"; then
  echo "✓"
else
  echo "✗"
  FAILED=$((FAILED+1))
fi

# Test 4: Memory Storage
echo -n "Test 4: Memory Storage... "
RESPONSE=$(curl -s -X POST http://localhost:7331/v1/memory/store \
  -H "Content-Type: application/json" \
  -d '{"userId": "test", "kind": "test", "content": "test"}')
if echo "$RESPONSE" | grep -q "id"; then
  echo "✓"
else
  echo "✗"
  FAILED=$((FAILED+1))
fi

echo ""
echo "Tests completed. Failed: $FAILED"

exit $FAILED
```

Save as `test-mongodb-migration.sh` and run:
```bash
chmod +x test-mongodb-migration.sh
./test-mongodb-migration.sh
```

## Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| MongoDB not running | `brew services start mongodb-community` |
| Connection refused | Check MongoDB URI and port 27017 |
| Collections not created | Restart application after MongoDB starts |
| Indexes not working | Run `db.collection.getIndexes()` to verify |
| Slow queries | Check explain() output and add missing indexes |
| Data not persisting | Verify MongoDB data directory permissions |
| Tests timeout | Increase timeout values in test script |

## Success Criteria

- [ ] All 12 collections created
- [ ] All indexes created successfully
- [ ] All API endpoints respond
- [ ] Memory storage works
- [ ] Audit logging works
- [ ] Approval workflow works
- [ ] Data persists across restarts
- [ ] No errors in logs
- [ ] Response times < 200ms for queries
- [ ] Can rollback to SQLite if needed
