from dataclasses import dataclass
from typing import Callable


@dataclass(frozen=True)
class AgentDefinition:
    name: str
    description: str
    requires_approval: bool = True


def build_agent_registry() -> dict[str, AgentDefinition]:
    names = [
        "voice_agent",
        "wake_word_agent",
        "planning_agent",
        "permission_agent",
        "memory_agent",
        "browser_agent",
        "system_agent",
        "file_agent",
        "vision_agent",
        "research_agent",
        "calendar_agent",
        "email_agent",
        "coding_agent",
        "knowledge_agent",
        "task_agent",
        "audit_agent",
        "security_agent",
    ]
    return {
        item: AgentDefinition(
            name=item,
            description=item.replace("_", " "),
            requires_approval=True,
        )
        for item in names
    }


def with_approval_guard(fn: Callable) -> Callable:
    def wrapper(*args, **kwargs):
        approval = kwargs.get("approval")
        if not approval or approval.get("decision") != "approved":
            raise PermissionError("Execution blocked: explicit approval required.")
        return fn(*args, **kwargs)

    return wrapper
