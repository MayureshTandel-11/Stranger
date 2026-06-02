# Stranger Core API (Scaffold)

## Intent + Planning

- `POST /v1/intent/analyze`
- `POST /v1/plan/generate`

## Approval Workflow

- `POST /v1/approval/request`
- `POST /v1/approval/respond`
- `GET /v1/approval/:id`

## Execution + Safety

- `POST /v1/task/execute` (blocked unless approval is approved)
- `POST /v1/emergency/stop`

## Audit + Memory

- `GET /v1/audit/search?q=...`
- `POST /v1/memory/store`
- `GET /v1/memory/search?q=...`
