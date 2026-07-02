"""Journey control module — FlowState snapshot, phase advance, gate tracking, YAML I/O.

The Journey control module owns the plan identity so that advance and resume
always use the exact FlowState that produced the original plan. The CLI
remains a thin adapter; all plan-identity logic lives here.
"""

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

    version: int = 2
    slug: str = ""
    task_kind: str = "feature_idea"
    delivery_mode: str = "single_session"
    user_description: str = ""
    current_phase_id: str = ""
    phases_done: list[str] = field(default_factory=list)
    gates_satisfied: list[str] = field(default_factory=list)
    current_issue: str | None = None
    plan_hash: str = ""
    # FlowState snapshot — preserved so advance always uses the same plan
    state_has_codebase: bool = True
    state_issue_tracker_configured: bool = False
    state_needs_runnable_answer: bool = False
    state_triage_unclear: bool = False
    state_explore_requested: bool = False

    def phase_index(self, plan: FlowPlan) -> int:
        if self.current_phase_id == TERMINAL_PHASE_ID:
            return max(0, len(plan.phases) - 1)
        for i, phase in enumerate(plan.phases):
            if phase.phase_id == self.current_phase_id:
                return i
        raise ValueError(
            f"Unknown phase '{self.current_phase_id}' for journey '{self.slug}'"
        )


# ─── Plan identity ───────────────────────────────────────────────────────────


def plan_hash_from_phases(phases: tuple) -> str:
    """Deterministic hash from phase IDs — detects plan drift on resume."""
    return "|".join(p.phase_id for p in phases)


def state_from_snapshot(journey: JourneyState) -> FlowState:
    """Reconstruct FlowState from the snapshot stored in JourneyState."""
    return FlowState(
        task_kind=journey.task_kind,  # type: ignore[arg-type]
        has_codebase=journey.state_has_codebase,
        issue_tracker_configured=journey.state_issue_tracker_configured,
        needs_runnable_answer=journey.state_needs_runnable_answer,
        delivery_mode=journey.delivery_mode,  # type: ignore[arg-type]
        triage_unclear=journey.state_triage_unclear,
        explore_requested=journey.state_explore_requested,
    )


def snapshot_to_state(state: FlowState) -> dict[str, bool]:
    """Extract snapshot fields from FlowState for storage."""
    return {
        "state_has_codebase": state.has_codebase,
        "state_issue_tracker_configured": state.issue_tracker_configured,
        "state_needs_runnable_answer": state.needs_runnable_answer,
        "state_triage_unclear": state.triage_unclear,
        "state_explore_requested": state.explore_requested,
    }


# ─── State mutation ──────────────────────────────────────────────────────────


def initial_journey(state: FlowState, slug: str, user_description: str) -> JourneyState:
    plan = plan_flow(state)
    first = plan.phases[0].phase_id if plan.phases else ""
    snap = snapshot_to_state(state)
    return JourneyState(
        slug=slug,
        task_kind=state.task_kind,
        delivery_mode=state.delivery_mode,
        user_description=user_description,
        current_phase_id=first,
        plan_hash=plan_hash_from_phases(plan.phases),
        **snap,
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
        plan_hash=journey.plan_hash,
        state_has_codebase=journey.state_has_codebase,
        state_issue_tracker_configured=journey.state_issue_tracker_configured,
        state_needs_runnable_answer=journey.state_needs_runnable_answer,
        state_triage_unclear=journey.state_triage_unclear,
        state_explore_requested=journey.state_explore_requested,
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
    """Parse a flow.state.yaml file into JourneyState.

    Handles both v1 (no state snapshot) and v2 files.
    """
    text = path.read_text(encoding="utf-8")
    data: dict[str, object] = {}
    current_list_key: str | None = None
    in_state_block = False

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

        # Detect nested state: block
        if key == "state" and raw == "":
            in_state_block = True
            continue

        # Fields inside state: block (indented)
        if in_state_block and line.startswith("  ") and not line.startswith("    "):
            state_key = f"state_{key}"
            if raw == "true":
                data[state_key] = True
            elif raw == "false":
                data[state_key] = False
            elif raw == "null":
                data[state_key] = None
            elif raw.isdigit():
                data[state_key] = int(raw)
            else:
                data[state_key] = raw.strip('"').strip("'")
            continue

        in_state_block = False

        if raw == "" or raw.startswith("#"):
            current_list_key = key
            data[key] = []
        elif raw == "null":
            data[key] = None
        elif raw == "[]":
            data[key] = []
        elif raw == "true":
            data[key] = True
        elif raw == "false":
            data[key] = False
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
        plan_hash=str(data.get("plan_hash", "")),
        state_has_codebase=bool(data.get("state_has_codebase", True)),
        state_issue_tracker_configured=bool(data.get("state_issue_tracker_configured", False)),
        state_needs_runnable_answer=bool(data.get("state_needs_runnable_answer", False)),
        state_triage_unclear=bool(data.get("state_triage_unclear", False)),
        state_explore_requested=bool(data.get("state_explore_requested", False)),
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
    # plan_hash
    if journey.plan_hash:
        lines.append(f"plan_hash: {journey.plan_hash}")
    else:
        lines.append("plan_hash: null")
    # FlowState snapshot
    lines.append("state:")
    lines.append(f"  has_codebase: {str(journey.state_has_codebase).lower()}")
    lines.append(f"  issue_tracker_configured: {str(journey.state_issue_tracker_configured).lower()}")
    lines.append(f"  needs_runnable_answer: {str(journey.state_needs_runnable_answer).lower()}")
    lines.append(f"  triage_unclear: {str(journey.state_triage_unclear).lower()}")
    lines.append(f"  explore_requested: {str(journey.state_explore_requested).lower()}")

    path.write_text("\n".join(lines) + "\n", encoding="utf-8")
