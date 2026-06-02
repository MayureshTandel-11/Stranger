# Environment Configuration Guide

## MongoDB Configuration

### Local Development Setup

#### macOS with Homebrew

```bash
# Install MongoDB Community Edition
brew tap mongodb/brew
brew install mongodb-community

# Install MongoDB Command Line Tools
brew install mongodb-community-shell

# Install MongoDB Database Tools (for import/export)
brew install mongodb-database-tools

# Start MongoDB
brew services start mongodb-community

# Verify MongoDB is running
brew services list | grep mongodb

# Connect to MongoDB
mongosh
```

#### Docker Setup (Alternative)

```bash
# Start MongoDB in Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Connect
docker exec -it mongodb mongosh
```

### Environment Variables

Create a `.env` file in the project root:

```env
# ============ MongoDB Configuration ============
# Local MongoDB
MONGODB_URI=mongodb://localhost:27017

# Or MongoDB Atlas (Cloud)
# MONGODB_URI=mongodb+srv://username:password@cluster0.abc123.mongodb.net/?retryWrites=true&w=majority

# Database name
MONGODB_DB_NAME=stranger

# ============ Application Configuration ============
# Node.js Backend
STRANGER_PORT=7331
LOG_LEVEL=info

# Python AI Core
AI_CORE_PORT=8000
PYTHONUNBUFFERED=1

# ============ Qdrant Vector Store ============
# (Unchanged from SQLite setup)
QDRANT_URL=http://localhost:6333

# ============ Optional: MongoDB Connection Options ============
# Pool size
MONGODB_POOL_SIZE=10

# Connection timeout (ms)
MONGODB_CONNECTION_TIMEOUT=5000

# Server selection timeout (ms)
MONGODB_SERVER_SELECTION_TIMEOUT=5000
```

### Local MongoDB Setup Script

Create `setup-mongodb.sh`:

```bash
#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Setting up MongoDB for Stranger...${NC}"

# Check if MongoDB is installed
if ! command -v mongosh &> /dev/null; then
    echo "MongoDB not found. Installing..."
    brew tap mongodb/brew
    brew install mongodb-community
    brew install mongodb-community-shell
fi

# Start MongoDB
echo -e "${BLUE}Starting MongoDB...${NC}"
brew services start mongodb-community

# Wait for MongoDB to start
sleep 3

# Check if MongoDB is running
if mongosh --eval "db.admin().ping()" &> /dev/null; then
    echo -e "${GREEN}✓ MongoDB is running on localhost:27017${NC}"
else
    echo "Failed to start MongoDB"
    exit 1
fi

# Create database and collections (optional)
echo -e "${BLUE}Initializing database...${NC}"
mongosh << EOF
use stranger
db.createCollection("users")
db.createCollection("profiles")
db.createCollection("voice_profiles")
db.createCollection("documents")
db.createCollection("embeddings")
db.createCollection("memories")
db.createCollection("conversations")
db.createCollection("tasks")
db.createCollection("approvals")
db.createCollection("audit_logs")
db.createCollection("agent_state")
db.createCollection("settings")
print("Collections created successfully")
EOF

echo -e "${GREEN}✓ MongoDB setup complete!${NC}"
```

Make it executable:
```bash
chmod +x setup-mongodb.sh
./setup-mongodb.sh
```

## MongoDB Atlas Cloud Setup

### Create Atlas Account and Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free account or sign in
3. Create a new project
4. Build a new cluster (M0 tier is free)
5. Wait for cluster to deploy (5-10 minutes)

### Get Connection String

1. Click "Connect" on your cluster
2. Choose "Connect with MongoDB Compass" or "Connect your application"
3. Copy connection string
4. Replace `<password>` with your database user password

### Configure Environment Variables

```env
# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster0.abc123.mongodb.net/stranger?retryWrites=true&w=majority
MONGODB_DB_NAME=stranger
```

### IP Whitelist (Important!)

1. Go to "Network Access" in Atlas
2. Add your IP address or allow from anywhere (0.0.0.0/0) for development
3. For production, only allow specific IPs

## Node.js Backend Setup

### Install Dependencies

```bash
cd apps/core
pnpm install
```

### Run Development Server

```bash
# With MongoDB running, start the server
pnpm dev

# Output should show:
# Stranger Core server started successfully
```

### Environment Variables for Backend

```env
# Required
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=stranger
STRANGER_PORT=7331

# Optional
LOG_LEVEL=info
NODE_ENV=development
```

## Python AI Core Setup

### Install Dependencies

```bash
cd apps/ai-core
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Run Development Server

```bash
# With MongoDB running, start the AI core
python main.py

# Or with uvicorn
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Environment Variables for Python

```env
# Required
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=stranger

# Optional
AI_CORE_PORT=8000
LOG_LEVEL=info
PYTHONUNBUFFERED=1
```

## Complete Local Development Environment

### Start All Services

Create `start-all.sh`:

```bash
#!/bin/bash

echo "Starting MongoDB..."
brew services start mongodb-community
sleep 2

echo "Verifying MongoDB connection..."
mongosh --eval "db.admin().ping()" || exit 1

# Terminal 1: Node.js Backend
echo "Starting Node.js backend..."
cd apps/core
pnpm install
pnpm dev &
BACKEND_PID=$!

# Terminal 2: Python AI Core
echo "Starting Python AI Core..."
cd apps/ai-core
source venv/bin/activate
python main.py &
PYTHON_PID=$!

# Terminal 3: Desktop (if needed)
# cd apps/desktop
# pnpm dev &
# DESKTOP_PID=$!

echo "All services started:"
echo "  - MongoDB: localhost:27017"
echo "  - Backend: localhost:7331"
echo "  - AI Core: localhost:8000"

# Keep script running
wait
```

### Stop All Services

```bash
#!/bin/bash

echo "Stopping services..."
pkill -f "pnpm dev"
pkill -f "python main.py"

echo "Stopping MongoDB..."
brew services stop mongodb-community

echo "All services stopped"
```

## Verify MongoDB Connection

### Using mongosh CLI

```bash
mongosh
```

```javascript
// In mongosh
use stranger
db.users.find().pretty()
db.admin().ping()
```

### Using MongoDB Compass (GUI)

1. Download [MongoDB Compass](https://www.mongodb.com/products/compass)
2. Connect to `mongodb://localhost:27017`
3. Browse collections and data visually

### From Node.js Application

The application will automatically:
1. Connect to MongoDB via `MONGODB_URI`
2. Create all required collections
3. Create all required indexes
4. Start accepting requests

### Troubleshooting Connection

```bash
# Check MongoDB status
brew services list | grep mongodb

# View MongoDB logs
tail -f /usr/local/var/log/mongodb/mongo.log

# Test connection with nc (netcat)
nc -zv localhost 27017

# If not running, start it
brew services start mongodb-community
```

## Data Backup and Restore

### Backup MongoDB

```bash
# Backup all databases
mongodump --uri="mongodb://localhost:27017" --out=./backup

# Backup specific database
mongodump --uri="mongodb://localhost:27017/stranger" --out=./backup
```

### Restore MongoDB

```bash
# Restore all databases
mongorestore ./backup

# Restore specific database
mongorestore --db stranger ./backup/stranger
```

### Export to JSON

```bash
# Export collection to JSON
mongoexport --uri="mongodb://localhost:27017/stranger" --collection users --out users.json

# Export with query
mongoexport --uri="mongodb://localhost:27017/stranger" --collection tasks --query '{"status":"pending"}' --out pending_tasks.json
```

### Import from JSON

```bash
# Import collection from JSON
mongoimport --uri="mongodb://localhost:27017/stranger" --collection users --file users.json --jsonArray
```

## Connection Pooling Configuration

### Advanced MongoDB Options

```env
# Connection pool configuration
MONGODB_MAX_POOL_SIZE=10
MONGODB_MIN_POOL_SIZE=5

# Connection timeouts (milliseconds)
MONGODB_CONNECT_TIMEOUT=5000
MONGODB_SOCKET_TIMEOUT=45000
MONGODB_SERVER_SELECTION_TIMEOUT=5000

# Retry settings
MONGODB_RETRY_WRITES=true
MONGODB_WRITE_CONCERN_W=majority
```

### In Code (if needed)

```javascript
const client = new MongoClient(MONGODB_URI, {
  maxPoolSize: 10,
  minPoolSize: 5,
  retryWrites: true,
  writeConcern: { w: "majority" },
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000
});
```

## Production Deployment

### MongoDB Atlas Production Checklist

- [ ] Create M1+ cluster (minimum for production)
- [ ] Enable automatic backups
- [ ] Configure IP whitelist (allow only app servers)
- [ ] Set up monitoring and alerts
- [ ] Enable encryption at rest
- [ ] Configure authentication with strong passwords
- [ ] Set up database users with minimal permissions
- [ ] Enable audit logging
- [ ] Configure backups to retain 35 days
- [ ] Test failover and recovery procedures
- [ ] Set up VPC Peering for private network access

### Self-Hosted Production

- Use MongoDB Replica Sets for redundancy
- Use MongoDB Sharding for horizontal scaling
- Set up monitoring with MongoDB Cloud Manager or Ops Manager
- Configure automated backups
- Set up firewall rules for database access
- Use SSL/TLS for connections
- Enable authentication with strong passwords

## Monitoring and Debugging

### Check Database Size

```javascript
db.stats()  // Database stats
db.collection.stats()  // Collection stats
db.collection.totalIndexSize()  // Index size
```

### View Query Performance

```javascript
// Enable profiling
db.setProfilingLevel(1, { slowms: 100 })

// View slow queries
db.system.profile.find().sort({ ts: -1 }).limit(5).pretty()
```

### Monitor Connections

```javascript
// Current connections
db.serverStatus().connections

// Active operations
db.currentOp()
```

## Reference Documentation

- [MongoDB Official Docs](https://docs.mongodb.com/)
- [MongoDB Node.js Driver](https://www.mongodb.com/docs/drivers/node/)
- [MongoDB Atlas Documentation](https://www.mongodb.com/docs/atlas/)
- [MongoDB Security Checklist](https://docs.mongodb.com/manual/administration/security-checklist/)
