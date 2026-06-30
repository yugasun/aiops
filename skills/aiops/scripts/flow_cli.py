"""CLI for /aiops Flow Conductor — plan, init, advance, validate subcommands.

Usage:
    python3 <aiops>/skills/aiops/scripts/flow_cli.py plan [flags]
    python3 <aiops>/skills/aiops/scripts/flow_cli.py init --slug X ...
    python3 <aiops>/skills/aiops/scripts/flow_cli.py advance --slug X
    python3 <aiops>/skills/aiops/scripts/flow_cli.py validate --slug X
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from router import (  # noqa: E402
    TERMINAL_PHASE_ID,
    FlowPhase,
    FlowState,
    JourneyState,
    advance_journey,
    check_all_gates,
    initial_journey,
    plan_flow,
)

# ─── Simple YAML I/O (no PyYAML dependency) ─────────────────────────────────

_SCRATCH_ROOT = Path(".scratch")


def _read_journey(path: Path) -> JourneyState:
    """Parse a flow.state.yaml file into JourneyState.

    Handles the known schema only — scalars, simple lists, null.
    """
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
            # Next lines may be list items
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


def _write_journey(journey: JourneyState, path: Path) -> None:
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


def _journey_to_dict(j: JourneyState) -> dict:
    return {
        "version": j.version,
        "slug": j.slug,
        "task_kind": j.task_kind,
        "delivery_mode": j.delivery_mode,
        "user_description": j.user_description,
        "current_phase_id": j.current_phase_id,
        "phases_done": j.phases_done,
        "gates_satisfied": j.gates_satisfied,
        "current_issue": j.current_issue,
    }


def _phase_to_dict(phase: FlowPhase) -> dict:
    return {
        "phase_id": phase.phase_id,
        "skill": phase.skill,
        "agent": phase.agent,
        "narration_key": phase.narration_key,
        "reason": phase.reason,
    }


def _state_from_args(args: argparse.Namespace) -> FlowState:
    task = args.task_kind
    if getattr(args, "ui", False):
        task = "feature_with_ui"
    return FlowState(
        task_kind=task,
        has_codebase=not args.greenfield,
        issue_tracker_configured=args.configured,
        needs_runnable_answer=args.prototype,
        delivery_mode="multi_session" if args.multi else "single_session",
        triage_unclear=args.triage_unclear,
    )


# ─── Subcommands ─────────────────────────────────────────────────────────────

def _cmd_plan(args: argparse.Namespace) -> int:
    """Print canonical flow plan from FlowState flags."""
    state = _state_from_args(args)
    plan = plan_flow(state)
    journey = initial_journey(state, args.slug, args.description)
    out = {
        "state": {
            "task_kind": state.task_kind,
            "has_codebase": state.has_codebase,
            "issue_tracker_configured": state.issue_tracker_configured,
            "needs_runnable_answer": state.needs_runnable_answer,
            "delivery_mode": state.delivery_mode,
            "triage_unclear": state.triage_unclear,
        },
        "phases": [_phase_to_dict(p) for p in plan.phases],
        "overlays": list(plan.overlays),
        "questions": list(plan.questions),
        "journey": _journey_to_dict(journey),
    }
    print(json.dumps(out, indent=2, ensure_ascii=False))
    return 0


def _cmd_init(args: argparse.Namespace) -> int:
    """Write initial flow.state.yaml for a new journey."""
    state = _state_from_args(args)
    plan = plan_flow(state)
    journey = initial_journey(state, args.slug, args.description)
    path = _SCRATCH_ROOT / args.slug / "flow.state.yaml"

    if path.exists() and not args.force:
        print(f"Error: {path} already exists. Use --force to overwrite.", file=sys.stderr)
        return 1

    _write_journey(journey, path)
    print(f"Wrote {path}")
    print(f"  task_kind: {state.task_kind}")
    print(f"  delivery_mode: {state.delivery_mode}")
    print(f"  first_phase: {journey.current_phase_id}")
    print(f"  total_phases: {len(plan.phases)}")
    return 0


def _cmd_advance(args: argparse.Namespace) -> int:
    """Advance the current phase and update flow.state.yaml."""
    path = _SCRATCH_ROOT / args.slug / "flow.state.yaml"
    if not path.exists():
        print(f"Error: {path} not found. Run 'init' first.", file=sys.stderr)
        return 1

    journey = _read_journey(path)

    if journey.current_phase_id == TERMINAL_PHASE_ID:
        print(f"Journey '{args.slug}' is already done.", file=sys.stderr)
        return 1

    # Reconstruct FlowState from journey to get the plan
    state = FlowState(
        task_kind=journey.task_kind,
        delivery_mode=journey.delivery_mode,
        # Conservative defaults — caller can override via flags if needed
        has_codebase=True,
        issue_tracker_configured=True,
    )
    plan = plan_flow(state)
    journey = advance_journey(journey, plan)

    _write_journey(journey, path)
    print(f"Advanced: {args.slug}")
    print(f"  current_phase_id: {journey.current_phase_id}")
    print(f"  phases_done: {journey.phases_done}")
    return 0


def _cmd_validate(args: argparse.Namespace) -> int:
    """Check that gate artifacts exist for all satisfied gates."""
    path = _SCRATCH_ROOT / args.slug / "flow.state.yaml"
    if not path.exists():
        print(f"Error: {path} not found.", file=sys.stderr)
        return 1

    journey = _read_journey(path)
    scratch_dir = _SCRATCH_ROOT / args.slug

    if not journey.gates_satisfied:
        print(f"No gates satisfied in '{args.slug}'.")
        return 0

    results = check_all_gates(journey.gates_satisfied, scratch_dir)
    has_failure = False
    for gate_name, passed, msg in results:
        status = "✅" if passed else "❌"
        print(f"  {status} {gate_name}: {msg}")
        if not passed:
            has_failure = True

    if has_failure:
        print(f"\nGate validation failed for '{args.slug}'.", file=sys.stderr)
        return 1

    print(f"\nAll gates verified for '{args.slug}'.")
    return 0


# ─── Argument parser ─────────────────────────────────────────────────────────

def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="aiops Flow Conductor CLI")
    sub = parser.add_subparsers(dest="command")

    # Common state flags (shared by plan and init)
    def add_state_flags(p: argparse.ArgumentParser) -> None:
        p.add_argument(
            "--task-kind", dest="task_kind", default="feature_idea",
            choices=[
                "feature_idea", "feature_with_ui", "bug_fix",
                "incoming_queue", "architecture_health",
                "new_personal_skill", "prototype",
            ],
        )
        p.add_argument("--greenfield", action="store_true")
        p.add_argument("--configured", action="store_true")
        p.add_argument("--multi", action="store_true")
        p.add_argument("--prototype", action="store_true")
        p.add_argument("--ui", action="store_true")
        p.add_argument("--triage-unclear", action="store_true")

    # plan
    p_plan = sub.add_parser("plan", help="Print flow plan as JSON")
    add_state_flags(p_plan)
    p_plan.add_argument("--slug", default="my-feature")
    p_plan.add_argument("--description", default="")

    # init
    p_init = sub.add_parser("init", help="Write initial flow.state.yaml")
    add_state_flags(p_init)
    p_init.add_argument("--slug", required=True)
    p_init.add_argument("--description", default="")
    p_init.add_argument("--force", action="store_true")

    # advance
    p_adv = sub.add_parser("advance", help="Advance current phase")
    p_adv.add_argument("--slug", required=True)

    # validate
    p_val = sub.add_parser("validate", help="Check gate artifacts")
    p_val.add_argument("--slug", required=True)

    return parser


def main() -> None:
    parser = _build_parser()
    args = parser.parse_args()

    if args.command is None:
        # Backward compat: no subcommand → treat as 'plan'
        args.command = "plan"
        args = parser.parse_args(["plan"] + sys.argv[1:])

    handlers = {
        "plan": _cmd_plan,
        "init": _cmd_init,
        "advance": _cmd_advance,
        "validate": _cmd_validate,
    }
    sys.exit(handlers[args.command](args))


if __name__ == "__main__":
    main()
