# Stranger Runbook (Entire Project)

This runbook starts the full Stranger stack locally (core + gateway + ai-core + infra).  
It intentionally skips tests and focuses on execution only.

## 1) Prerequisites

- Node.js 22+
- PNPM (`npm i -g pnpm`)
- Python 3.11
- Docker Desktop (or Docker Engine)
- Rust toolchain (`rustup`, `cargo`) for Tauri desktop shell
- macOS for LaunchAgent flow (optional during development)

## 2) Install Dependencies

From repo root:

```bash
pnpm install
```

## 3) Start Infra Services

From repo root:

```bash
docker compose -f infra/docker/docker-compose.yml up -d
```

This starts:

- Ollama on `http://127.0.0.1:11434`
- Qdrant on `http://127.0.0.1:6333`

## 4) Start AI Core (Python / FastAPI)

From repo root:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r apps/ai-core/requirements.txt
uvicorn main:app --app-dir apps/ai-core --host 127.0.0.1 --port 8340 --reload
```

Keep this terminal open.

## 5) Start Core Service (Node / Fastify)

Open a new terminal at repo root:

```bash
pnpm --filter @stranger/core dev
```

Expected bind: `http://127.0.0.1:7331`

## 6) Start Gateway Service (Node / Express + Socket.IO)

Open another terminal at repo root:

```bash
pnpm --filter @stranger/gateway dev
```

Expected bind: `http://127.0.0.1:7332`

## 7) Start Desktop Overlay UI (Vite)

Open another terminal at repo root:

```bash
pnpm --filter @stranger/desktop dev
```

Expected bind: `http://127.0.0.1:5173`

Open the URL in your browser to use the overlay prototype.

## 8) Start Desktop Native App (Tauri)

From repo root:

```bash
pnpm --filter @stranger/desktop tauri:dev
```

Notes:

- This opens Stranger as a native desktop window shell.
- It uses the Vite dev server at `http://127.0.0.1:5173` under the hood.
- The overlay starts hidden in background mode.
- Use global shortcut `Cmd+Shift+Space` (macOS) to show/hide overlay.
- Left-click the Stranger tray icon to show/hide overlay.
- Native shell emits overlay/state events to the React UI bridge automatically.

To create a production desktop build:

```bash
pnpm --filter @stranger/desktop tauri:build
```

## 9) Health Checks

Run these from another terminal:

```bash
curl http://127.0.0.1:8340/health
curl http://127.0.0.1:7332/health
curl http://127.0.0.1:7331/v1/audit/search
```

## 10) Shutdown

- Stop node/python services with `Ctrl+C` in each terminal.
- Stop infra:

```bash
docker compose -f infra/docker/docker-compose.yml down
```

## 11) Optional: Auto-start on macOS Login

From repo root:

```bash
bash infra/macos/bootstrap-launchagent.sh
```

This installs `com.stranger.agent.plist` under `~/Library/LaunchAgents`.

## 12) Common Issues

- **`pnpm: command not found`**  
  Install PNPM globally: `npm i -g pnpm`

- **`ModuleNotFoundError` for FastAPI deps**  
  Ensure venv is active and rerun: `pip install -r apps/ai-core/requirements.txt`

- **Port already in use (7331/7332/8340)**  
  Stop conflicting process or change env vars and run commands again.

- **Desktop port conflict (5173)**  
  Run with a different port:
  `pnpm --filter @stranger/desktop dev -- --port 5180`

- **Tauri command fails (`cargo`/`rustc` not found)**  
  Install Rust toolchain via [rustup](https://rustup.rs/) and retry.
