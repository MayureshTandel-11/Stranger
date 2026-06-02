# Stranger Implementation Plan

## 1) Full Project Architecture

Stranger uses an approval-first orchestration architecture where **all mutating actions are gated by explicit user consent**.

High-level runtime:

1. Wake + capture audio
2. Streaming local STT
3. Intent detection + plan generation
4. Plan explanation via TTS/UI
5. User approval capture
6. Execution with emergency interrupt support
7. Spoken + visual result
8. Audit persistence

Core modules:

- `Voice Agent`: wake word, VAD, STT stream, TTS stream
- `Planning Agent`: intent parsing, tool planning, risk classification
- `Security Agent`: identity checks, approval policy, emergency stop
- `Audit Agent`: immutable action journal + search
- `System/File/Browser/Calendar/Email/Coding/Research Agents`: capability adapters
- `Memory Agent`: long-term memory + semantic retrieval
- `Vision Agent`: screenshot/document understanding

Cross-cutting invariants:

- No action execution without approval token
- Every plan explains goal, tools, risks
- Every request creates audit entry
- Every task can be cancelled with emergency commands

## 2) Folder Structure

```text
Stranger/
  apps/
    core/            # Backend orchestration runtime
    desktop/         # macOS UI shell and local UX
  packages/
    shared/          # Shared contracts/types/events
  docs/              # Architecture, API, roadmap
```

## 3) Database Schema

Primary DB: SQLite (local-first) with upgrade path to Postgres.

Tables:

- `users`: identity profile + voiceprint metadata
- `sessions`: assistant sessions
- `memories`: long-term memory entries + embeddings
- `tasks`: task lifecycle + status
- `plans`: proposed action plans
- `approvals`: explicit grants/denials (never implicit)
- `audit_logs`: immutable event trail
- `artifacts`: generated summaries/reports/files metadata

## 4) API Design

Transport:

- Internal API: Fastify HTTP + WebSocket events
- Agent bus: typed in-process event bus (upgradeable to NATS)

Main endpoints:

- `POST /v1/intent/analyze`
- `POST /v1/plan/generate`
- `POST /v1/approval/request`
- `POST /v1/approval/respond`
- `POST /v1/task/execute`
- `POST /v1/emergency/stop`
- `GET /v1/audit/search`
- `GET /v1/memory/search`

## 5) Agent Communication Design

Pattern:

- Planner emits `plan.proposed`
- Security checks policy and emits `approval.requested`
- UI/Voice surfaces plan
- User response emits `approval.granted` or `approval.denied`
- Executor only accepts tasks with a valid approval record
- Audit records all transitions

Event contract examples in `packages/shared/src/events.js`.

## 6) Technology Stack Recommendations

Core runtime:

- Node.js 22+
- TypeScript
- Fastify + Zod
- Better-SQLite3 or SQLite via Prisma/Drizzle

Voice pipeline:

- Wake word: Porcupine/openWakeWord
- STT local: faster-whisper/Whisper.cpp streaming
- TTS local: Piper/CosyVoice-compatible local runtime

Desktop:

- Electron + React + Tailwind (or Tauri + React if minimizing footprint)

Automation:

- Browser: Playwright
- macOS control: AppleScript + native command wrappers with strict allowlist

AI:

- Local LLM: llama.cpp/Ollama integration
- Cloud model: pluggable provider adapter
- Model router picks local/cloud based on policy + complexity

## 7) MVP Roadmap

MVP (6-8 weeks):

1. Voice I/O skeleton (wake + STT + TTS)
2. Planning + explicit approval gate
3. System controls (safe subset)
4. Browser YouTube flow
5. Audit log + history viewer
6. Memory basics + semantic search
7. Emergency stop path hardening

## 8) Production Roadmap

Phase 2:

- Calendar/email adapters
- richer vision + PDF understanding
- robust identity verification
- plugin SDK for new agents

Phase 3:

- policy editor
- enterprise audit exports
- advanced memory ranking
- reliability SLOs and telemetry

## 9) Complete Implementation Plan

Implementation sequence:

1. Shared contracts/events and approval invariants
2. Core API and event bus
3. Planner + Security + Audit baseline
4. System and Browser agents
5. Desktop UX + voice surface
6. Memory and retrieval
7. Hardening: retries, cancellation, observability

Definition of done for each action-capable feature:

- Plan shown
- Risk shown
- Approval captured
- Execution trace recorded
- Interrupt/cancel validated

## 10) Initial Codebase Scaffolding

Scaffold included in this repository:

- Monorepo setup
- Shared event/type contracts
- Core service with approval-guarded execution route
- SQLite schema bootstrap
- Agent stubs and policy engine
- Desktop UI skeleton for plan/approval/audit views
