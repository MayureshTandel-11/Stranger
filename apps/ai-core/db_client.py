"""
MongoDB Client for Python AI Core
Provides async MongoDB operations for the AI Core backend
"""

import json
import os
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import uuid4

import motor.motor_asyncio
from pymongo import ASCENDING, DESCENDING


class MongoDBClient:
    """MongoDB client with async support for Python AI Core"""

    def __init__(self):
        self.client: Optional[motor.motor_asyncio.AsyncClient] = None
        self.db: Optional[motor.motor_asyncio.AsyncDatabase] = None

    async def connect(self):
        """Connect to MongoDB"""
        mongodb_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
        db_name = os.getenv("MONGODB_DB_NAME", "stranger")

        self.client = motor.motor_asyncio.AsyncClient(mongodb_uri)
        self.db = self.client[db_name]

        # Create indexes
        await self._create_indexes()
        print(f"✓ Connected to MongoDB: {db_name}")

    async def disconnect(self):
        """Disconnect from MongoDB"""
        if self.client:
            self.client.close()
            print("✓ Disconnected from MongoDB")

    async def _create_indexes(self):
        """Create all necessary indexes"""
        # Users collection
        await self.db.users.create_index("email", unique=True, sparse=True)

        # Profiles collection
        await self.db.profiles.create_index("user_id")

        # Voice profiles collection
        await self.db.voice_profiles.create_index("user_id")
        await self.db.voice_profiles.create_index("is_active")

        # Memories collection
        await self.db.memories.create_index([("user_id", ASCENDING)])
        await self.db.memories.create_index([("user_id", ASCENDING), ("category", ASCENDING)])

        # Tasks collection
        await self.db.tasks.create_index("user_id")
        await self.db.tasks.create_index("status")
        await self.db.tasks.create_index([("user_id", ASCENDING), ("created_at", DESCENDING)])

        # Audit logs collection
        await self.db.audit_logs.create_index([("event_type", ASCENDING), ("created_at", DESCENDING)])

        # Settings collection
        await self.db.settings.create_index([("user_id", ASCENDING), ("key", ASCENDING)], unique=True)

    # ============ Users ============

    async def create_user(self, email: str, display_name: str, locale: str = "en-IN", timezone: str = "Asia/Kolkata") -> str:
        """Create a new user"""
        user_id = str(uuid4())
        now = datetime.utcnow().isoformat() + "Z"

        await self.db.users.insert_one(
            {
                "_id": user_id,
                "email": email,
                "display_name": display_name,
                "locale": locale,
                "timezone": timezone,
                "created_at": now,
                "updated_at": now,
            }
        )
        return user_id

    async def get_user(self, user_id: str) -> Optional[Dict]:
        """Get user by ID"""
        return await self.db.users.find_one({"_id": user_id})

    async def get_user_by_email(self, email: str) -> Optional[Dict]:
        """Get user by email"""
        return await self.db.users.find_one({"email": email})

    async def update_user(self, user_id: str, updates: Dict) -> bool:
        """Update user"""
        updates["updated_at"] = datetime.utcnow().isoformat() + "Z"
        result = await self.db.users.update_one({"_id": user_id}, {"$set": updates})
        return result.modified_count > 0

    # ============ Memories ============

    async def create_memory(
        self,
        user_id: str,
        category: str,
        content: str,
        salience_score: float = 0.5,
        source: str = "conversation",
        embedding_id: Optional[str] = None,
    ) -> str:
        """Create a new memory"""
        memory_id = str(uuid4())
        now = datetime.utcnow().isoformat() + "Z"

        await self.db.memories.insert_one(
            {
                "_id": memory_id,
                "user_id": user_id,
                "category": category,
                "content": content,
                "salience_score": salience_score,
                "source": source,
                "embedding_id": embedding_id,
                "created_at": now,
                "updated_at": now,
            }
        )
        return memory_id

    async def get_memories(self, user_id: str, category: Optional[str] = None) -> List[Dict]:
        """Get memories for a user"""
        query = {"user_id": user_id}
        if category:
            query["category"] = category

        return await self.db.memories.find(query).to_list(None)

    async def search_memories(self, user_id: str, query: str) -> List[Dict]:
        """Search memories for a user"""
        return await self.db.memories.find(
            {
                "user_id": user_id,
                "$or": [
                    {"content": {"$regex": query, "$options": "i"}},
                    {"category": {"$regex": query, "$options": "i"}},
                ],
            }
        ).sort("created_at", -1).limit(50).to_list(None)

    async def update_memory(self, memory_id: str, updates: Dict) -> bool:
        """Update memory"""
        updates["updated_at"] = datetime.utcnow().isoformat() + "Z"
        result = await self.db.memories.update_one({"_id": memory_id}, {"$set": updates})
        return result.modified_count > 0

    # ============ Tasks ============

    async def create_task(
        self,
        user_id: str,
        task_type: str,
        user_request: str,
        status: str = "pending",
        priority: int = 5,
        plan_id: Optional[str] = None,
    ) -> str:
        """Create a new task"""
        task_id = str(uuid4())
        now = datetime.utcnow().isoformat() + "Z"

        await self.db.tasks.insert_one(
            {
                "_id": task_id,
                "user_id": user_id,
                "task_type": task_type,
                "user_request": user_request,
                "status": status,
                "priority": priority,
                "plan_id": plan_id,
                "approval_id": None,
                "result_json": None,
                "error_text": None,
                "created_at": now,
                "updated_at": now,
            }
        )
        return task_id

    async def get_task(self, task_id: str) -> Optional[Dict]:
        """Get task by ID"""
        return await self.db.tasks.find_one({"_id": task_id})

    async def get_tasks_by_user(self, user_id: str) -> List[Dict]:
        """Get all tasks for a user"""
        return await self.db.tasks.find({"user_id": user_id}).sort("created_at", -1).to_list(None)

    async def get_tasks_by_status(self, user_id: str, status: str) -> List[Dict]:
        """Get tasks by user and status"""
        return await self.db.tasks.find({"user_id": user_id, "status": status}).sort("created_at", -1).to_list(None)

    async def update_task(self, task_id: str, updates: Dict) -> bool:
        """Update task"""
        updates["updated_at"] = datetime.utcnow().isoformat() + "Z"
        result = await self.db.tasks.update_one({"_id": task_id}, {"$set": updates})
        return result.modified_count > 0

    # ============ Approvals ============

    async def create_approval(
        self,
        task_id: str,
        approval_mode: str,
        plan_hash: str,
        expires_at: str,
    ) -> str:
        """Create an approval request"""
        approval_id = str(uuid4())
        now = datetime.utcnow().isoformat() + "Z"

        await self.db.approvals.insert_one(
            {
                "_id": approval_id,
                "task_id": task_id,
                "approval_mode": approval_mode,
                "decision": "pending",
                "approved_by": None,
                "plan_hash": plan_hash,
                "reason": None,
                "requested_at": now,
                "decided_at": None,
                "expires_at": expires_at,
            }
        )
        return approval_id

    async def get_approval(self, approval_id: str) -> Optional[Dict]:
        """Get approval by ID"""
        return await self.db.approvals.find_one({"_id": approval_id})

    async def update_approval(self, approval_id: str, updates: Dict) -> bool:
        """Update approval"""
        result = await self.db.approvals.update_one({"_id": approval_id}, {"$set": updates})
        return result.modified_count > 0

    # ============ Audit Logs ============

    async def create_audit_log(
        self,
        actor: str,
        event_type: str,
        result: str,
        severity: str = "info",
        task_id: Optional[str] = None,
        approval_id: Optional[str] = None,
        event_payload: Optional[Dict] = None,
    ) -> str:
        """Create an audit log entry"""
        log_id = str(uuid4())
        now = datetime.utcnow().isoformat() + "Z"

        await self.db.audit_logs.insert_one(
            {
                "_id": log_id,
                "task_id": task_id,
                "approval_id": approval_id,
                "actor": actor,
                "event_type": event_type,
                "event_payload_json": json.dumps(event_payload or {}),
                "result": result,
                "severity": severity,
                "created_at": now,
            }
        )
        return log_id

    async def search_audit_logs(self, query: str, limit: int = 50) -> List[Dict]:
        """Search audit logs"""
        return await self.db.audit_logs.find(
            {
                "$or": [
                    {"event_type": {"$regex": query, "$options": "i"}},
                    {"result": {"$regex": query, "$options": "i"}},
                ]
            }
        ).sort("created_at", -1).limit(limit).to_list(None)

    # ============ Settings ============

    async def create_setting(self, user_id: str, key: str, value: Any) -> str:
        """Create a user setting"""
        setting_id = str(uuid4())
        now = datetime.utcnow().isoformat() + "Z"

        await self.db.settings.insert_one(
            {
                "_id": setting_id,
                "user_id": user_id,
                "key": key,
                "value_json": json.dumps(value),
                "updated_at": now,
            }
        )
        return setting_id

    async def get_setting(self, user_id: str, key: str) -> Optional[Dict]:
        """Get a user setting"""
        return await self.db.settings.find_one({"user_id": user_id, "key": key})

    async def upsert_setting(self, user_id: str, key: str, value: Any) -> bool:
        """Create or update a user setting"""
        now = datetime.utcnow().isoformat() + "Z"
        result = await self.db.settings.update_one(
            {"user_id": user_id, "key": key},
            {
                "$set": {
                    "value_json": json.dumps(value),
                    "updated_at": now,
                }
            },
            upsert=True,
        )
        return result.modified_count > 0 or result.upserted_id is not None

    # ============ Utility ============

    async def health_check(self) -> bool:
        """Check database connection"""
        try:
            await self.db.client.admin.command("ping")
            return True
        except Exception:
            return False

    async def get_stats(self) -> Dict:
        """Get database statistics"""
        stats = await self.db.command("dbStats")
        return {
            "collections": stats.get("collections", 0),
            "data_size": stats.get("dataSize", 0),
            "indexes": stats.get("indexes", 0),
            "storage_size": stats.get("storageSize", 0),
        }


# Global client instance
_client: Optional[MongoDBClient] = None


async def get_mongodb_client() -> MongoDBClient:
    """Get or create MongoDB client"""
    global _client
    if _client is None:
        _client = MongoDBClient()
        await _client.connect()
    return _client


async def close_mongodb_client():
    """Close MongoDB client"""
    global _client
    if _client:
        await _client.disconnect()
        _client = None
