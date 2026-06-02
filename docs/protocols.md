# Stranger API + WebSocket Specifications

## HTTP API (Gateway)

Base URL: `http://127.0.0.1:7331`

### `POST /v1/voice/ingest`
- purpose: streaming STT chunk ingestion
- request:
  - `sessionId: string`
  - `audioChunkBase64: string`
  - `sampleRate: number`
- response:
  - `accepted: boolean`

### `POST /v1/intent/analyze`
- request: `{ userRequest: string, sessionId: string }`
- response:
  - `intent: string`
  - `confidence: number`
  - `entities: Record<string, string>`

### `POST /v1/plan/generate`
- request: `{ userRequest: string, sessionId: string }`
- response:
  - `planId: string`
  - `goal: string`
  - `actions: Action[]`
  - `toolsNeeded: string[]`
  - `risks: string[]`

### `POST /v1/approval/request`
- request:
  - `taskId: string`
  - `planId: string`
  - `approvalModes: ('voice' | 'keyboard' | 'mouse')[]`
- response:
  - `approvalId: string`
  - `tokenExpiresAt: string`
  - `state: 'Waiting Approval'`

### `POST /v1/approval/respond`
- request:
  - `approvalId: string`
  - `decision: 'approved' | 'rejected' | 'modify'`
  - `approvedBy: string`
  - `reason?: string`
- response:
  - `status: string`
  - `nextStep: 'execute' | 'replan' | 'stop'`

### `POST /v1/task/execute`
- request:
  - `taskId: string`
  - `approvalId: string`
  - `approvalToken: string`
- response:
  - `executionId: string`
  - `status: 'executing'`

### `POST /v1/task/interrupt`
- request: `{ taskId: string, command: 'stop' | 'cancel' | 'abort' | 'pause' | 'freeze' }`
- response: `{ status: 'interrupted' }`

### `GET /v1/history/audit`
- query: `q`, `eventType`, `from`, `to`
- response: `{ rows: AuditLog[] }`

## WebSocket (Socket.IO)

Namespace: `/ws`

### Client -> Server events
- `voice:start-listening`
- `voice:stop-listening`
- `approval:respond`
- `task:interrupt`

### Server -> Client events
- `overlay:show`
- `overlay:hide`
- `state:update` (Listening/Thinking/Planning/Waiting Approval/Executing/Completed/Error)
- `waveform:update`
- `plan:proposed`
- `approval:requested`
- `approval:resolved`
- `task:queue:update`
- `task:completed`
- `task:failed`
- `audit:appended`

## Approval Token Rules

- Signed token includes `taskId`, `planHash`, `approvedBy`, `expiresAt`, `nonce`.
- Execution fails if token expired, hash mismatch, or decision not approved.
- A token is one-time-use and invalidated after execution starts.
