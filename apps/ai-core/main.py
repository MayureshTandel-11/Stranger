from datetime import datetime, timezone
from typing import Literal
from uuid import uuid4

from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="Stranger AI Core", version="0.1.0")


class PlanRequest(BaseModel):
    sessionId: str
    userRequest: str


class PlanAction(BaseModel):
    id: str
    label: str
    tool: str
    risk: Literal["low", "medium", "high"]
    args: dict


class PlanResponse(BaseModel):
    planId: str
    goal: str
    actions: list[PlanAction]
    toolsNeeded: list[str]
    risks: list[str]
    createdAt: str


@app.get("/health")
def health() -> dict:
    return {"ok": True, "service": "ai-core"}


@app.post("/v1/plan", response_model=PlanResponse)
def build_plan(request: PlanRequest) -> PlanResponse:
    # Stub planner: replace with LLM + policy-aware planning pipeline.
    return PlanResponse(
        planId=str(uuid4()),
        goal=request.userRequest,
        actions=[
            PlanAction(
                id=str(uuid4()),
                label="Interpret user goal and choose capable agent",
                tool="planning_agent",
                risk="low",
                args={"input": request.userRequest},
            ),
            PlanAction(
                id=str(uuid4()),
                label="Execute approved action through system/browser/file agent",
                tool="task_agent",
                risk="medium",
                args={"requiresApproval": True},
            ),
        ],
        toolsNeeded=["planning_agent", "permission_agent", "task_agent"],
        risks=["Action execution is blocked until explicit user approval"],
        createdAt=datetime.now(tz=timezone.utc).isoformat(),
    )
