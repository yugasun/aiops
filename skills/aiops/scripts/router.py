"""Canonical flow plan for /aiops Flow Conductor. Maintainer-tested; not installed to target projects."""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable, Literal

TaskKind = Literal[
    "feature_idea",
    "feature_with_ui",
    "bug_fix",
    "incoming_queue",
    "architecture_health",
    "new_personal_skill",
    "prototype",
]

DeliveryMode = Literal["single_session", "multi_session"]

TERMINAL_PHASE_ID = "done"


@dataclass(frozen=True)
class FlowPhase:
    """One step in the journey — skill + agent + user narration key."""

    phase_id: str
    skill: str
    agent: str
    narration_key: str
    reason: str


@dataclass(frozen=True)
class FlowState:
    task_kind: TaskKind = "feature_idea"
    has_codebase: bool = True
    issue_tracker_configured: bool = False
    needs_runnable_answer: bool = False
    delivery_mode: DeliveryMode = "single_session"
    triage_unclear: bool = False


@dataclass(frozen=True)
class FlowPlan:
    state: FlowState
    phases: tuple[FlowPhase, ...]
    overlays: tuple[str, ...] = ()
    questions: tuple[str, ...] = ()


@dataclass
class JourneyState:
    """Persisted at .scratch/<slug>/flow.state.yaml — resumable conductor state."""

    version: int = 1
    slug: str = ""
    task_kind: TaskKind = "feature_idea"
    delivery_mode: DeliveryMode = "single_session"
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

    def current_phase(self, plan: FlowPlan) -> FlowPhase | None:
        if self.current_phase_id == TERMINAL_PHASE_ID:
            return plan.phases[-1] if plan.phases else None
        for phase in plan.phases:
            if phase.phase_id == self.current_phase_id:
                return phase
        return plan.phases[0] if plan.phases else None


# ─── Gate validation ────────────────────────────────────────────────────────

@dataclass(frozen=True)
class GateCheck:
    """Defines what artifact a gate requires before it can be marked satisfied."""

    filename: str
    content_check: str | None = None  # If set, file must contain this string


GATE_ARTIFACTS: dict[str, GateCheck] = {
    "bootstrap_done": GateCheck("docs/agents/"),
    "design_review_approve": GateCheck("DESIGN_REVIEW.md", "APPROVE"),
    "prototype_verdict": GateCheck("VERDICT.md"),
    "prune_done": GateCheck("PRUNE.md"),
    "review_approve": GateCheck("REVIEW.md", "APPROVE"),
    "ready_for_commit": GateCheck("REVIEW.md", "APPROVE"),
}


def check_gate(gate_name: str, scratch_dir: Path) -> tuple[bool, str]:
    """Verify that a gate's artifact exists and meets content requirements.

    Returns (passed, message). The scratch_dir is the .scratch/<slug>/ directory
    where gate artifacts are expected.
    """
    spec = GATE_ARTIFACTS.get(gate_name)
    if spec is None:
        return True, f"Gate '{gate_name}' has no artifact spec — pass by convention."

    artifact_path = scratch_dir / spec.filename

    # Directory gate (e.g. docs/agents/)
    if spec.filename.endswith("/"):
        if not artifact_path.exists():
            return False, f"Directory missing: {spec.filename}"
        return True, f"Directory exists: {spec.filename}"

    if not artifact_path.exists():
        return False, f"Artifact missing: {spec.filename}"

    if spec.content_check is not None:
        content = artifact_path.read_text(encoding="utf-8")
        if spec.content_check not in content:
            return (
                False,
                f"{spec.filename} exists but does not contain '{spec.content_check}'",
            )

    return True, f"Artifact verified: {spec.filename}"


def check_all_gates(
    gates_satisfied: list[str], scratch_dir: Path
) -> list[tuple[str, bool, str]]:
    """Validate every gate in gates_satisfied against its artifact.

    Returns list of (gate_name, passed, message).
    """
    results = []
    for gate in gates_satisfied:
        passed, msg = check_gate(gate, scratch_dir)
        results.append((gate, passed, msg))
    return results


# ─── Phase planning ──────────────────────────────────────────────────────────

def plan_flow(state: FlowState) -> FlowPlan:
    phases: list[FlowPhase] = []
    overlays: list[str] = []
    questions: list[str] = []

    if state.task_kind == "prototype":
        phases.append(
            FlowPhase(
                "prototype",
                "/prototype",
                "prototyper",
                "prototype",
                "Throwaway code to answer a runnable question.",
            )
        )
        return _finalize(state, phases, overlays, questions)

    if state.task_kind == "new_personal_skill":
        phases.append(
            FlowPhase(
                "skill_authoring",
                "/aiops",
                "",
                "skill_authoring",
                "Follow new-skill checklist; author SKILL.md.",
            )
        )
        questions.append(
            "User-invoked router, model-invoked discipline, or helper called by another skill?"
        )
        return _finalize(state, phases, overlays, questions)

    if not state.issue_tracker_configured and state.task_kind in {
        "feature_idea",
        "feature_with_ui",
        "incoming_queue",
        "architecture_health",
    }:
        phases.append(
            FlowPhase(
                "bootstrap",
                "/aiops-setup",
                "planner",
                "bootstrap",
                "Configure issue tracker, triage labels, and domain doc layout.",
            )
        )

    if state.task_kind == "incoming_queue":
        phases.extend(_incoming_phases(state))
        return _finalize(state, phases, overlays, questions)

    if state.task_kind == "bug_fix":
        phases.extend(_bug_phases())
        return _finalize(state, phases, overlays, questions)

    if state.task_kind == "architecture_health":
        phases.extend(_architecture_health_phases(state))
        overlays.append(
            "Pick one deepening candidate from the architecture report before grill continues."
        )
        _append_feature_tail(state, phases, overlays, questions)
        return _finalize(state, phases, overlays, questions)

    # feature_idea | feature_with_ui
    phases.extend(_feature_alignment_phases(state))
    _append_feature_tail(state, phases, overlays, questions)
    return _finalize(state, phases, overlays, questions)


def _incoming_phases(state: FlowState) -> list[FlowPhase]:
    phases = [
        FlowPhase(
            "triage",
            "/triage",
            "",
            "triage",
            "Move raw requests into clear triage states.",
        ),
    ]
    if state.triage_unclear:
        skill = "/grill-with-docs" if state.has_codebase else "/grilling"
        phases.append(
            FlowPhase(
                "alignment",
                skill,
                "architect",
                "align",
                "Clarify unclear incoming item before delivery.",
            )
        )
    phases.extend(_delivery_and_ship())
    return phases


def _bug_phases() -> list[FlowPhase]:
    return [
        FlowPhase(
            "diagnose",
            "/diagnosing-bugs",
            "builder",
            "diagnose",
            "Reproduce, minimize, hypothesize, fix.",
        ),
        *_delivery_and_ship(),
    ]


def _architecture_health_phases(state: FlowState) -> list[FlowPhase]:
    return [
        FlowPhase(
            "architecture_scan",
            "/improve-codebase-architecture",
            "architect",
            "architecture_scan",
            "Scan for deepening opportunities; user picks one candidate.",
        ),
        FlowPhase(
            "alignment",
            "/grill-with-docs" if state.has_codebase else "/grilling",
            "architect",
            "align_architecture",
            "Grill the chosen deepening item; update CONTEXT.md or ADRs.",
        ),
        FlowPhase(
            "design_spec",
            "/architect-design",
            "architect",
            "design",
            "Produce NOTES.md + tech-spec.md for the deepening work.",
        ),
        FlowPhase(
            "design_review",
            "/review",
            "design-reviewer",
            "design_review",
            "Design gate — DESIGN_REVIEW.md must APPROVE before planning.",
        ),
    ]


def _feature_alignment_phases(state: FlowState) -> list[FlowPhase]:
    skill = "/grill-with-docs" if state.has_codebase else "/grilling"
    phases = [
        FlowPhase(
            "alignment",
            skill,
            "architect",
            "align",
            "Align on the idea before building.",
        ),
        FlowPhase(
            "design_spec",
            "/architect-design",
            "architect",
            "design",
            "Structured design → NOTES.md + tech-spec.md.",
        ),
    ]
    if state.task_kind == "feature_with_ui":
        phases.append(
            FlowPhase(
                "ui_mockup",
                "/ui-mockup",
                "ui-designer",
                "ui_mockup",
                "HTML/CSS mockups before design review.",
            )
        )
    phases.append(
        FlowPhase(
            "design_review",
            "/review",
            "design-reviewer",
            "design_review",
            "Design gate — DESIGN_REVIEW.md must APPROVE before planning.",
        )
    )
    return phases


def _append_feature_tail(
    state: FlowState,
    phases: list[FlowPhase],
    overlays: list[str],
    questions: list[str],
) -> None:
    if state.needs_runnable_answer:
        phases.extend(
            [
                FlowPhase(
                    "prototype_handoff_out",
                    "/handoff",
                    "",
                    "prototype_branch",
                    "Branch into a fresh prototype session.",
                ),
                FlowPhase(
                    "prototype",
                    "/prototype",
                    "prototyper",
                    "prototype",
                    "Answer the runnable question with throwaway code.",
                ),
                FlowPhase(
                    "prototype_handoff_back",
                    "/handoff",
                    "architect",
                    "prototype_return",
                    "Bring prototype verdict back; require VERDICT.md.",
                ),
            ]
        )
        overlays.append("Prototype verdict: require VERDICT.md before planner or builder.")

    if state.delivery_mode == "multi_session":
        phases.extend(
            [
                FlowPhase(
                    "planning_prd",
                    "/to-prd",
                    "planner",
                    "planning_prd",
                    "Turn alignment into PRD.md.",
                ),
                FlowPhase(
                    "planning_issues",
                    "/to-issues",
                    "planner",
                    "planning_issues",
                    "Split PRD into vertical-slice issues.",
                ),
                FlowPhase(
                    "issue_session",
                    "/handoff",
                    "planner",
                    "issue_session",
                    "Fresh session per issue — set current_issue in journey.",
                ),
            ]
        )
        questions.append("Confirm multi-session: one chat per issue after to-issues.")
    else:
        questions.append("Confirm single-session delivery (skip to-prd/to-issues)?")

    phases.extend(_delivery_and_ship())


def _delivery_and_ship() -> list[FlowPhase]:
    return [
        FlowPhase(
            "delivery",
            "/aiops-implement",
            "builder",
            "implement",
            "Delivery overlay: lean → tdd → prune → review; commit only on user ask.",
        ),
        FlowPhase(
            "ship",
            "/gitops",
            "gitops",
            "ship",
            "Commit and push only after delivery gates pass and user approves.",
        ),
    ]


def _finalize(
    state: FlowState,
    phases: Iterable[FlowPhase],
    overlays: Iterable[str],
    questions: Iterable[str],
) -> FlowPlan:
    phase_tuple = tuple(phases)
    return FlowPlan(
        state=state,
        phases=phase_tuple,
        overlays=tuple(overlays),
        questions=tuple(questions),
    )


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
