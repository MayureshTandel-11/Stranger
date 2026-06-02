# Wake Word + Voice Architecture

## Wake Word Engine

- Engine: `openWakeWord` or `Porcupine` (offline)
- Wake phrase: `Hey Stranger`
- Runtime mode: always listening, low-power, frame-based inference
- CPU target: keep idle under 2-3% on MacBook Air M4

## Signal Path

1. Mic stream enters Voice Agent ring buffer.
2. VAD discards silence and suppresses unnecessary compute.
3. Wake model processes short frames continuously.
4. On hit, publish `wake.detected` event and open overlay.
5. STT stream starts for command capture.

## STT + Intent Path

- STT engine: Whisper (local, streaming mode)
- partial transcripts: emitted as `voice.partial`
- final transcript: emitted as `voice.final`
- Planner receives final transcript and starts plan generation

## Interrupt Handling (Immediate)

Reserved interrupt intents:

- stop
- cancel
- abort
- pause
- freeze

Interrupt detection has higher priority than all task executions and triggers:

- running task cancellation
- overlay state transition to `Error` or `Completed`
- audit log entry `task.interrupted`
