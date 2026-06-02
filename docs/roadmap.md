# Stranger Delivery Roadmap

## Phase 0 - Foundations (Week 1)
- finalize architecture, DB schema, API contracts, and event model
- stand up gateway, ai-core, local infra, and audit baseline
- enforce no-execution-without-approval at policy layer

## Phase 1 - Voice + Overlay MVP (Weeks 2-4)
- integrate wake word engine (`Hey Stranger`) with low-power loop
- stream audio to Whisper-based STT pipeline
- implement Siri-like overlay state machine and waveform
- wire approval controls (voice/keyboard/mouse)

## Phase 2 - Core Agents (Weeks 5-7)
- system agent adapters (app launch, lock, wifi, bluetooth, volume, brightness)
- browser agent via Playwright (search, YouTube, form flow)
- file agent with strict deletion approval hard-stop
- task queue lifecycle with retries, cancellation, dead-letter handling

## Phase 3 - Memory + Knowledge (Weeks 8-10)
- long-term memory ingestion and retrieval with Qdrant embeddings
- document indexing (PDF/Markdown/notes/repos)
- retrieval-augmented planning and preference-aware responses

## Phase 4 - Productivity Agents (Weeks 11-13)
- calendar and email adapters with draft-only defaults
- research + coding + knowledge agents
- proactive suggestions without autonomous execution

## Phase 5 - Hardening + Release (Weeks 14-16)
- reliability, telemetry, battery/CPU optimization, and stress testing
- security audits, prompt-injection defenses, token hardening
- packaging/signing/notarization for macOS production release
