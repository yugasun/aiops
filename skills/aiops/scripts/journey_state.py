"""Journey state management for /aiops Flow Conductor — init, advance, progress, YAML I/O."""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

from phases import (
    TERMINAL_PHASE_ID,
    FlowPlan,
    FlowState,
    plan_flow,
)


@dataclass
class JourneyState:
    """Persisted at .scratch/<slug>/flow.state.yaml — resumable conductor state."""

    version: int = 1
    slug: str = ""
    task_kind: str = "feature_idea"
    delivery_mode: str = "single_session"
    user_description: str = ""
    current_phase_id: str = ""
    phases_done: list[str] = field(default_factory=list)
    gates_satisfied: list[str] = field(default_factory=list)
    current_issue: str | None = None

    def phase_index(self, plan: FlowPlan) -> int:
        if self.current_phase_id == TERMINAL_PHASE_ID:
            return max(0, len(plan.phases) - 1)
        for i, phase in enumerate(plan.phases):
            if phase.phase_id == self.current_phase_id:
                return i
        return 0


# ─── State mutation ──────────────────────────────────────────────────────────


def initial_journey(state: FlowState, slug: str, user_description: str) -> JourneyState:
    plan = plan_flow(state)
    first = plan.phases[0].phase_id if plan.phases else ""
    return JourneyState(
        slug=slug,
        task_kind=state.task_kind,
        delivery_mode=state.delivery_mode,
        user_description=user_description,
        current_phase_id=first,
    )


def advance_journey(journey: JourneyState, plan: FlowPlan) -> JourneyState:
    """Mark current phase done and move to next. Sets 'done' sentinel at end."""
    if not plan.phases:
        return journey
    idx = journey.phase_index(plan)
    current = plan.phases[idx]
    done = list(journey.phases_done)
    if current.phase_id not in done:
        done.append(current.phase_id)
    next_idx = idx + 1
    if next_idx >= len(plan.phases):
        next_phase_id = TERMINAL_PHASE_ID
    else:
        next_phase_id = plan.phases[next_idx].phase_id
    return JourneyState(
        version=journey.version,
        slug=journey.slug,
        task_kind=journey.task_kind,
        delivery_mode=journey.delivery_mode,
        user_description=journey.user_description,
        current_phase_id=next_phase_id,
        phases_done=done,
        gates_satisfied=list(journey.gates_satisfied),
        current_issue=journey.current_issue,
    )


def narration_progress(journey: JourneyState, plan: FlowPlan) -> tuple[int, int]:
    """1-based step index and total phases for user-facing progress."""
    total = len(plan.phases)
    if total == 0:
        return 0, 0
    if journey.current_phase_id == TERMINAL_PHASE_ID:
        return total, total
    idx = journey.phase_index(plan)
    return idx + 1, total


# ─── YAML I/O (no PyYAML dependency) ────────────────────────────────────────


def read_journey(path: Path) -> JourneyState:
    """Parse a flow.state.yaml file into JourneyState."""
    text = path.read_text(encoding="utf-8")
    data: dict[str, object] = {}
    current_list_key: str | None = None

    for line in text.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue

        # List item
        if stripped.startswith("- ") and current_list_key:
            val = stripped[2:].strip().strip('"').strip("'")
            lst = data.setdefault(current_list_key, [])
            assert isinstance(lst, list)
            lst.append(val)
            continue

        current_list_key = None

        if ":" not in stripped:
            continue

        key, _, raw = stripped.partition(":")
        key = key.strip()
        raw = raw.strip()

        if raw == "" or raw.startswith("#"):
            current_list_key = key
            data[key] = []
        elif raw == "null":
            data[key] = None
        elif raw == "[]":
            data[key] = []
        elif raw.isdigit():
            data[key] = int(raw)
        else:
            data[key] = raw.strip('"').strip("'")

    return JourneyState(
        version=int(data.get("version", 1)),
        slug=str(data.get("slug", "")),
        task_kind=data.get("task_kind", "feature_idea"),  # type: ignore[arg-type]
        delivery_mode=data.get("delivery_mode", "single_session"),  # type: ignore[arg-type]
        user_description=str(data.get("user_description", "")),
        current_phase_id=str(data.get("current_phase_id", "")),
        phases_done=data.get("phases_done", []),  # type: ignore[arg-type]
        gates_satisfied=data.get("gates_satisfied", []),  # type: ignore[arg-type]
        current_issue=data.get("current_issue"),  # type: ignore[arg-type]
    )


def write_journey(journey: JourneyState, path: Path) -> None:
    """Serialize JourneyState to flow.state.yaml."""
    path.parent.mkdir(parents=True, exist_ok=True)
    lines = [
        f"version: {journey.version}",
        f"slug: {journey.slug}",
        f"task_kind: {journey.task_kind}",
        f"delivery_mode: {journey.delivery_mode}",
        f'user_description: "{journey.user_description}"',
        f"current_phase_id: {journey.current_phase_id}",
    ]
    # phases_done
    if journey.phases_done:
        lines.append("phases_done:")
        for item in journey.phases_done:
            lines.append(f"  - {item}")
    else:
        lines.append("phases_done: []")
    # gates_satisfied
    if journey.gates_satisfied:
        lines.append("gates_satisfied:")
        for item in journey.gates_satisfied:
            lines.append(f"  - {item}")
    else:
        lines.append("gates_satisfied: []")
    # current_issue
    if journey.current_issue:
        lines.append(f"current_issue: {journey.current_issue}")
    else:
        lines.append("current_issue: null")

    path.write_text("\n".join(lines) + "\n", encoding="utf-8")
