import { randomUUID } from "node:crypto";

function toYouTubePlan(userRequest) {
  const query = userRequest.replace(/play/gi, "").trim();
  return {
    id: randomUUID(),
    goal: userRequest,
    toolsNeeded: ["browser-agent", "safety-policy", "capability-executor"],
    risks: ["Browser state may change", "Media playback may interrupt current workflow"],
    actions: [
      {
        id: randomUUID(),
        label: "Open Chrome",
        tool: "browser.open",
        risk: "low",
        args: { app: "Google Chrome" }
      },
      {
        id: randomUUID(),
        label: "Open YouTube",
        tool: "browser.navigate",
        risk: "low",
        args: { url: "https://www.youtube.com" }
      },
      {
        id: randomUUID(),
        label: "Search requested media",
        tool: "browser.search",
        risk: "low",
        args: { provider: "youtube", query }
      },
      {
        id: randomUUID(),
        label: "Play first result",
        tool: "browser.play",
        risk: "medium",
        args: { strategy: "first-result" }
      }
    ]
  };
}

function toSystemPlan(userRequest) {
  return {
    id: randomUUID(),
    goal: userRequest,
    toolsNeeded: ["system-agent", "safety-policy", "capability-executor"],
    risks: ["System state may change", "Explicit approval is mandatory"],
    actions: [
      {
        id: randomUUID(),
        label: "Run requested system command",
        tool: "system.execute",
        risk: "medium",
        args: { request: userRequest }
      }
    ]
  };
}

export function createPlanFromRequest(userRequest) {
  const normalized = userRequest.toLowerCase();
  if (normalized.includes("youtube") || normalized.includes("play")) {
    return toYouTubePlan(userRequest);
  }
  return toSystemPlan(userRequest);
}
