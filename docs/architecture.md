# Stranger Production Architecture (macOS, MacBook Air M4)

## Runtime Topology

Stranger is a local-first, approval-gated voice OS with four runtime layers:

1. `apps/desktop` (Tauri + React overlay) for wake feedback, approval UX, and status states.
2. `apps/gateway` (Node.js + Express + Socket.IO) for orchestration, queueing, and typed APIs.
3. `apps/ai-core` (Python FastAPI) for STT, planning, memory retrieval, and agent execution logic.
4. Local service dependencies (Ollama, Qdrant, SQLite, Playwright workers).

All action-capable flows must pass through `approval.required` policy checks before execution.

## Activation Flow ("Hey Stranger")

1. LaunchAgent starts Stranger at login and keeps it alive.
2. Wake engine runs low-power keyword spotting (`Hey Stranger`) continuously.
3. On detection, desktop overlay opens instantly with `Listening` state.
4. Audio stream flows to AI Core STT pipeline (Whisper).
5. Intent is parsed and transformed into an execution plan.
6. Plan is surfaced in overlay (`Planning` -> `Waiting Approval`).
7. User approves/rejects by voice/keyboard/mouse.
8. Gateway executes only after approval token validation.
9. Overlay transitions to `Executing` and then `Completed`/`Error`.

## Mandatory State Machine

`Idle -> Listening -> Thinking -> Planning -> Waiting Approval -> Executing -> Completed|Error`

Global interrupt states:

- `Stop`
- `Cancel`
- `Abort`
- `Pause`
- `Freeze`

Interrupt commands are high-priority and preempt any ongoing action.

## Agent Communication Design

Agents are modular and isolated by capability domain:

- Voice Agent
- Wake Word Agent
- Planning Agent
- Permission Agent
- Memory Agent
- Browser Agent
- System Agent
- File Agent
- Vision Agent
- Research Agent
- Calendar Agent
- Email Agent
- Coding Agent
- Knowledge Agent
- Task Agent
- Audit Agent
- Security Agent

Interaction pattern:

1. Voice Agent emits `intent.detected`.
2. Planning Agent emits `plan.proposed`.
3. Permission Agent emits `approval.requested`.
4. User response emits `approval.granted|approval.denied`.
5. Task Agent emits `task.execution.started|finished|failed`.
6. Audit Agent persists all transitions to `audit_logs`.

## Security Model (Non-Bypassable)

- Every mutable action requires explicit approval.
- Approval token contains: `task_id`, `plan_hash`, `approved_by`, `expires_at`, `nonce`.
- Executor verifies token freshness and exact plan hash match.
- No direct agent-to-adapter execution path is allowed.
- Destructive actions (delete, shutdown, logout, send) require elevated confirmation prompts.
- All requests/plans/approvals/executions/errors are immutable audit events.

## macOS Integration Architecture

- LaunchAgent for startup/background lifecycle.
- AppleScript wrappers for app/system controls.
- Accessibility APIs for UI automation with explicit approval.
- Notifications API for proactive suggestions (never auto-execution).
- Screen capture/screenshot pipeline for Vision Agent context.

## Overlay UI Architecture

Desktop overlay requirements:

- dark glassmorphism shell
- waveform animation
- microphone status
- current state badge
- plan + risk + tools panel
- approval controls: Approve/Reject/Modify
- auto-hide timeout after inactivity

UI state updates are pushed via Socket.IO event stream from gateway.

## Observability + Reliability

- Structured logs across gateway and ai-core.
- Health endpoints for all services.
- Queue retries with idempotency keys.
- Dead-letter queue for failed actions.
- Audit replay for forensic analysis.
- CPU guardrails for wake word loop to remain battery-friendly.
