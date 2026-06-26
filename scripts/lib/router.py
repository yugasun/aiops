from dataclasses import dataclass
from typing import Iterable, Literal


TaskKind = Literal[
    "feature_idea",
    "bug_fix",
    "incoming_queue",
    "architecture_health",
    "new_personal_skill",
]


@dataclass(frozen=True)
class FlowState:
    task_kind: TaskKind = "feature_idea"
    has_codebase: bool = True
    issue_tracker_configured: bool = False
    needs_runnable_answer: bool = False
    multi_session_build: bool = False


@dataclass(frozen=True)
class RouteStep:
    skill: str
    reason: str


@dataclass(frozen=True)
class FlowPlan:
    state: FlowState
    route: tuple[RouteStep, ...]
    overlays: tuple[str, ...]
    questions: tuple[str, ...]


def plan_flow(state: FlowState) -> FlowPlan:
    route: list[RouteStep] = []
    overlays: list[str] = []
    questions: list[str] = []

    if not state.issue_tracker_configured and state.task_kind in {
        "feature_idea",
        "incoming_queue",
        "architecture_health",
    }:
        route.append(
            RouteStep(
                "/aiops-setup",
                "Configure issue tracker, triage labels, and domain doc layout.",
            )
        )

    if state.task_kind == "incoming_queue":
        route.extend(
            [
                RouteStep("/triage", "Move raw requests into clear triage states."),
                RouteStep(
                    "/aiops-implement",
                    "Delivery overlay owns tdd, prune, review, and commit gates.",
                ),
            ]
        )
        return _finalize(state, route, overlays, questions)

    if state.task_kind == "architecture_health":
        route.append(
            RouteStep(
                "/grill-with-docs",
                "Sharpen the architecture item you picked; update CONTEXT.md or ADRs.",
            )
        )
        overlays.append(
            "Tier 2 deferred: codebase scan skills not installed — pick the deepening item yourself."
        )
        _append_build_path(state, route, overlays, questions)
        return _finalize(state, route, overlays, questions)

    if state.task_kind == "new_personal_skill":
        route.append(
            RouteStep(
                "skill-authoring",
                "Follow /aiops new-skill checklist; author SKILL.md (Cursor create-skill when ready).",
            )
        )
        questions.append(
            "User-invoked router, model-invoked discipline, or helper called by another skill?"
        )
        return _finalize(state, route, overlays, questions)

    if state.task_kind == "bug_fix":
        route.extend(
            [
                RouteStep("/diagnosing-bugs", "Reproduce, minimize, hypothesize, fix."),
                RouteStep(
                    "/aiops-implement",
                    "Delivery overlay owns tdd, prune, review, and commit gates.",
                ),
            ]
        )
        return _finalize(state, route, overlays, questions)

    start_skill = "/grill-with-docs" if state.has_codebase else "/grilling"
    route.append(RouteStep(start_skill, "Align on the idea before building."))
    _append_build_path(state, route, overlays, questions)
    return _finalize(state, route, overlays, questions)


def _append_build_path(
    state: FlowState,
    route: list[RouteStep],
    overlays: list[str],
    questions: list[str],
) -> None:
    if state.needs_runnable_answer:
        route.extend(
            [
                RouteStep("/handoff", "Branch into a fresh prototype session."),
                RouteStep("/prototype", "Answer the runnable question with throwaway code."),
                RouteStep("/handoff", "Bring the learned decision back."),
            ]
        )
        overlays.append("Prototype verdict: require NOTES.md before PRD or implement absorption.")

    if state.multi_session_build:
        route.extend(
            [
                RouteStep("/to-prd", "Turn the thread into a PRD."),
                RouteStep("/to-issues", "Split into vertical slices."),
                RouteStep("fresh session per issue", "One issue per session."),
                RouteStep(
                    "/aiops-implement",
                    "Delivery overlay owns tdd, prune, review, and commit gates.",
                ),
            ]
        )
    else:
        route.append(
            RouteStep(
                "/aiops-implement",
                "Delivery overlay owns tdd, prune, review, and commit gates.",
            )
        )

    questions.append("Confirm multi-session vs single-session before proceeding.")


def _finalize(
    state: FlowState,
    route: Iterable[RouteStep],
    overlays: Iterable[str],
    questions: Iterable[str],
) -> FlowPlan:
    return FlowPlan(
        state=state,
        route=tuple(route),
        overlays=tuple(overlays),
        questions=tuple(questions),
    )
