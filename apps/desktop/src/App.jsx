import { useEffect, useMemo, useState } from "react";
import { analyzeIntent, executeTask, generatePlan, interruptTask, requestApproval, submitApproval } from "./api.js";
import { initTauriBridge } from "./tauri-bridge.js";

const overlayStates = ["Listening", "Thinking", "Planning", "Waiting Approval", "Executing", "Completed", "Error"];

export function App() {
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [overlayState, setOverlayState] = useState("Idle");
  const [sessionId] = useState(() => `session-${Date.now()}`);
  const [taskId, setTaskId] = useState(null);
  const [userRequest, setUserRequest] = useState("Play Safar by Bayaan on YouTube.");
  const [queue, setQueue] = useState([]);
  const [plan, setPlan] = useState(null);
  const [approvalId, setApprovalId] = useState(null);
  const [approvalMode, setApprovalMode] = useState("voice");
  const [statusText, setStatusText] = useState("Idle");
  const [events, setEvents] = useState([]);

  const pendingCount = useMemo(
    () => queue.filter((item) => item.status === "pending" || item.status === "executing").length,
    [queue]
  );

  useEffect(() => {
    if (!overlayVisible) {
      return;
    }
    if (overlayState === "Waiting Approval" || overlayState === "Executing") {
      return;
    }
    const timer = window.setTimeout(() => {
      setOverlayVisible(false);
      setOverlayState("Idle");
      setStatusText("Idle");
    }, 8000);
    return () => window.clearTimeout(timer);
  }, [overlayVisible, overlayState]);

  useEffect(() => {
    let cleanup = () => {};
    void initTauriBridge((eventName, payload) => {
      if (eventName === "overlay:show") {
        setOverlayVisible(true);
      }
      if (eventName === "overlay:hide") {
        setOverlayVisible(false);
      }
      if (eventName === "wake.detected") {
        setOverlayVisible(true);
        setOverlayState("Listening");
        setStatusText("Wake word detected: Hey Stranger");
      }
      if (eventName === "state:update" && payload?.state) {
        setOverlayState(payload.state);
      }
      pushEvent(`${eventName}:${JSON.stringify(payload ?? {})}`);
    }).then((stop) => {
      cleanup = stop;
    });

    return () => cleanup();
  }, []);

  function pushEvent(message) {
    setEvents((prev) => [message, ...prev].slice(0, 8));
  }

  function activateOverlayFromWakeWord() {
    setOverlayVisible(true);
    setOverlayState("Listening");
    setStatusText("Wake word detected: Hey Stranger");
    pushEvent("wake.detected");
  }

  async function startFlow() {
    const nextTaskId = `task-${Date.now()}`;
    setTaskId(nextTaskId);
    setOverlayVisible(true);
    setOverlayState("Thinking");
    setStatusText("Analyzing intent...");
    pushEvent("intent.analyze.started");
    await analyzeIntent(userRequest);

    setOverlayState("Planning");
    setStatusText("Generating execution plan...");
    const nextPlan = await generatePlan(sessionId, userRequest);
    setPlan(nextPlan);
    setQueue([{ id: nextTaskId, text: userRequest, status: "pending" }]);
    pushEvent(`plan.proposed:${nextPlan.planId}`);

    const approval = await requestApproval(nextTaskId, nextPlan);
    setApprovalId(approval.approvalId);
    setOverlayState("Waiting Approval");
    setStatusText("Waiting for explicit approval");
    pushEvent(`approval.requested:${approval.approvalId}`);
  }

  async function handleApproval(decision) {
    if (!approvalId || !plan || !taskId) {
      return;
    }
    await submitApproval({ approvalId, decision, mode: approvalMode });
    pushEvent(`approval.${decision}:${approvalId}`);

    if (decision !== "approved") {
      setQueue((items) => items.map((item) => ({ ...item, status: "rejected" })));
      setOverlayState("Completed");
      setStatusText(decision === "modify" ? "Plan modification requested." : "Execution rejected.");
      return;
    }

    setQueue((items) => items.map((item) => ({ ...item, status: "approved" })));
    setOverlayState("Executing");
    setStatusText("Executing approved plan...");
    setQueue((items) => items.map((item) => ({ ...item, status: "executing" })));
    const response = await executeTask({
      taskId,
      userId: "local-user",
      userRequest,
      approvalId,
      plan
    });
    setQueue((items) => items.map((item) => ({ ...item, status: "completed" })));
    setOverlayState("Completed");
    setStatusText(response.message);
    pushEvent("task.completed");
  }

  async function handleInterrupt(command) {
    if (!taskId) {
      return;
    }
    await interruptTask(taskId, command);
    setQueue((items) => items.map((item) => ({ ...item, status: "failed" })));
    setOverlayState("Error");
    setStatusText(`Interrupted: ${command}`);
    pushEvent(`task.interrupted:${command}`);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at top, #111827 0%, #06080e 65%)",
        color: "#e5e7eb",
        padding: 20,
        fontFamily: "Inter, system-ui, sans-serif"
      }}
    >
      <h1 style={{ marginTop: 0 }}>Stranger Overlay Prototype</h1>
      <p style={{ opacity: 0.8, marginTop: 0 }}>
        Voice-first AI assistant with strict approval-first execution controls.
      </p>
      <section style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        <button onClick={activateOverlayFromWakeWord}>Simulate "Hey Stranger"</button>
        <button onClick={() => void startFlow()}>Capture Command</button>
        <button onClick={() => void handleInterrupt("stop")} disabled={!taskId}>Stop</button>
        <button onClick={() => void handleInterrupt("cancel")} disabled={!taskId}>Cancel</button>
        <button onClick={() => void handleInterrupt("abort")} disabled={!taskId}>Abort</button>
        <button onClick={() => void handleInterrupt("pause")} disabled={!taskId}>Pause</button>
        <button onClick={() => void handleInterrupt("freeze")} disabled={!taskId}>Freeze</button>
      </section>
      <section style={{ marginBottom: 14, display: "grid", gap: 10 }}>
        <label htmlFor="request">Voice command transcript</label>
        <input
          id="request"
          value={userRequest}
          onChange={(event) => setUserRequest(event.target.value)}
          style={{
            width: "100%",
            background: "#0f172a",
            color: "#f9fafb",
            border: "1px solid #334155",
            borderRadius: 10,
            padding: 10
          }}
        />
        <label htmlFor="approval-mode">Approval mode</label>
        <select
          id="approval-mode"
          value={approvalMode}
          onChange={(event) => setApprovalMode(event.target.value)}
          style={{
            width: 240,
            background: "#0f172a",
            color: "#f9fafb",
            border: "1px solid #334155",
            borderRadius: 10,
            padding: 10
          }}
        >
          <option value="voice">Voice</option>
          <option value="keyboard">Keyboard</option>
          <option value="mouse">Mouse</option>
        </select>
      </section>
      {overlayVisible ? (
        <section
          style={{
            backdropFilter: "blur(14px)",
            background: "rgba(15, 23, 42, 0.6)",
            border: "1px solid rgba(148, 163, 184, 0.25)",
            borderRadius: 16,
            padding: 16,
            marginBottom: 14
          }}
        >
          <h2 style={{ marginTop: 0 }}>Overlay State: {overlayState}</h2>
          <p style={{ marginTop: 0 }}>Mic: {overlayState === "Listening" ? "Active" : "Standby"}</p>
          <p>{statusText}</p>
          <div style={{ display: "flex", gap: 6, alignItems: "end", height: 42 }}>
            {Array.from({ length: 18 }).map((_, index) => {
              const dynamicHeight = overlayState === "Listening" ? 12 + ((index * 7) % 28) : 6;
              return (
                <div
                  key={`wave-${index}`}
                  style={{
                    width: 5,
                    height: dynamicHeight,
                    borderRadius: 999,
                    background: "#60a5fa",
                    opacity: 0.8
                  }}
                />
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button onClick={() => void handleApproval("approved")} disabled={!approvalId || overlayState !== "Waiting Approval"}>
              Approve
            </button>
            <button onClick={() => void handleApproval("rejected")} disabled={!approvalId || overlayState !== "Waiting Approval"}>
              Reject
            </button>
            <button onClick={() => void handleApproval("modify")} disabled={!approvalId || overlayState !== "Waiting Approval"}>
              Modify Plan
            </button>
          </div>
        </section>
      ) : null}
      <section style={{ marginBottom: 14 }}>
        <h3>State Progression</h3>
        <p style={{ marginTop: 0 }}>{overlayStates.join(" -> ")}</p>
      </section>
      <section style={{ marginBottom: 14 }}>
        <h3>Task Queue ({pendingCount} active)</h3>
        {queue.length === 0 ? <p>No queued tasks.</p> : null}
        {queue.map((item) => (
          <div key={item.id} style={{ border: "1px solid #334155", borderRadius: 10, padding: 10, marginBottom: 8 }}>
            <strong>{item.text}</strong>
            <p style={{ marginBottom: 0 }}>Status: {item.status}</p>
          </div>
        ))}
      </section>
      <section style={{ marginBottom: 14 }}>
        <h3>Transparency Panel</h3>
        <p>Goal: {plan?.goal ?? "-"}</p>
        <p>Actions: {plan ? plan.actions.map((item) => item.label).join(" | ") : "-"}</p>
        <p>Tools: {plan ? plan.toolsNeeded.join(", ") : "-"}</p>
        <p>Risks: {plan ? plan.risks.join(", ") : "-"}</p>
      </section>
      <section>
        <h3>Events</h3>
        {events.length === 0 ? <p>No events yet.</p> : null}
        {events.map((item) => (
          <p key={item} style={{ margin: "4px 0", fontFamily: "monospace" }}>{item}</p>
        ))}
      </section>
    </main>
  );
}
