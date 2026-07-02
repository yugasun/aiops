"""Phase definitions and flow planning for /aiops Flow Conductor."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

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
    explore_requested: bool = False


@dataclass(frozen=True)
class FlowPlan:
    state: FlowState
    phases: tuple[FlowPhase, ...]
    overlays: tuple[str, ...] = ()
    questions: tuple[str, ...] = ()


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
        return FlowPlan(state=state, phases=tuple(phases))

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
        return FlowPlan(state=state, phases=tuple(phases), questions=tuple(questions))

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

    if state.explore_requested:
        phases.append(
            FlowPhase(
                "explore",
                "/explore",
                "architect",
                "explore",
                "Think before committing — discuss ideas, compare options.",
            )
        )

    if state.task_kind == "incoming_queue":
        phases.extend(_incoming_phases(state))
        return FlowPlan(state=state, phases=tuple(phases), overlays=tuple(overlays), questions=tuple(questions))

    if state.task_kind == "bug_fix":
        phases.extend(_bug_phases())
        return FlowPlan(state=state, phases=tuple(phases), overlays=tuple(overlays), questions=tuple(questions))

    if state.task_kind == "architecture_health":
        phases.extend(_architecture_health_phases(state))
        overlays.append(
            "Pick one deepening candidate from the architecture report before grill continues."
        )
        _append_feature_tail(state, phases, overlays, questions)
        return FlowPlan(state=state, phases=tuple(phases), overlays=tuple(overlays), questions=tuple(questions))

    # feature_idea | feature_with_ui
    phases.extend(_feature_alignment_phases(state))
    _append_feature_tail(state, phases, overlays, questions)
    return FlowPlan(state=state, phases=tuple(phases), overlays=tuple(overlays), questions=tuple(questions))


# ─── Phase builders ──────────────────────────────────────────────────────────


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
            "graph_build",
            "/code-graph",
            "architect",
            "graph_build",
            "Build or refresh code graph when missing or stale; skip when graphify-out/graph.json is fresh.",
        ),
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

    # Task decomposition — always available, format depends on session mode
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
        phases.append(
            FlowPhase(
                "task_breakdown",
                "/to-issues",
                "planner",
                "task_breakdown",
                "Break delivery into ordered sub-tasks within the current session.",
            )
        )
        questions.append("Confirm single-session delivery with task breakdown?")

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
            "drift_check",
            "/review",
            "design-reviewer",
            "drift_check",
            "Verify implementation matches tech-spec before shipping.",
        ),
        FlowPhase(
            "ship",
            "/gitops",
            "gitops",
            "ship",
            "Commit and push only after delivery gates pass and user approves.",
        ),
    ]
