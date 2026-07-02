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

from gates import check_all_gates, check_phase_gates, is_gate_in_phase, satisfy_gate  # noqa: E402
from journey_state import (  # noqa: E402
    JourneyState,
    advance_journey,
    initial_journey,
    plan_hash_from_phases,
    read_journey,
    state_from_snapshot,
    write_journey,
)
from phases import (  # noqa: E402
    TERMINAL_PHASE_ID,
    FlowPhase,
    FlowState,
    plan_flow,
)

_SCRATCH_ROOT = Path(".scratch")


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
        "plan_hash": j.plan_hash,
        "state": {
            "has_codebase": j.state_has_codebase,
            "issue_tracker_configured": j.state_issue_tracker_configured,
            "needs_runnable_answer": j.state_needs_runnable_answer,
            "triage_unclear": j.state_triage_unclear,
            "explore_requested": j.state_explore_requested,
        },
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
        explore_requested=args.explore,
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
            "explore_requested": state.explore_requested,
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

    write_journey(journey, path)
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

    journey = read_journey(path)

    if journey.current_phase_id == TERMINAL_PHASE_ID:
        print(f"Journey '{args.slug}' is already done.", file=sys.stderr)
        return 1

    # Reconstruct FlowState from persisted snapshot — same plan every time
    state = state_from_snapshot(journey)
    plan = plan_flow(state)

    # Detect plan drift
    expected_hash = plan_hash_from_phases(plan.phases)
    if journey.plan_hash and expected_hash != journey.plan_hash:
        print(
            f"Warning: plan hash mismatch (expected {journey.plan_hash}, "
            f"got {expected_hash}). Phase definitions may have changed.",
            file=sys.stderr,
        )

    journey = advance_journey(journey, plan)

    write_journey(journey, path)
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

    journey = read_journey(path)
    scratch_dir = _SCRATCH_ROOT / args.slug

    # Check current phase's required gates
    phase_results = check_phase_gates(journey.current_phase_id, scratch_dir)
    if phase_results:
        print(f"Phase '{journey.current_phase_id}' gates:")
        for gate_name, passed, msg in phase_results:
            status = "✅" if passed else "⬜"
            print(f"  {status} {gate_name}: {msg}")
        print()
        if any(not passed for _, passed, _ in phase_results):
            print(
                f"Phase gate validation failed for '{args.slug}'.",
                file=sys.stderr,
            )
            return 1

    # Check all satisfied gates
    if not journey.gates_satisfied:
        if not phase_results:
            print(f"No gates satisfied and no phase gates for '{args.slug}'.")
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


def _cmd_satisfy_gate(args: argparse.Namespace) -> int:
    """Mark a gate as satisfied after verifying its artifact."""
    path = _SCRATCH_ROOT / args.slug / "flow.state.yaml"
    if not path.exists():
        print(f"Error: {path} not found.", file=sys.stderr)
        return 1

    journey = read_journey(path)
    scratch_dir = _SCRATCH_ROOT / args.slug

    # Verify the gate belongs to a phase
    if not is_gate_in_phase(args.phase_id, args.gate):
        print(
            f"Error: gate '{args.gate}' is not required by phase '{args.phase_id}'.",
            file=sys.stderr,
        )
        return 1

    # Verify the artifact exists before marking satisfied
    from gates import check_gate

    passed, msg = check_gate(args.gate, scratch_dir)
    if not passed:
        print(f"Error: artifact check failed — {msg}", file=sys.stderr)
        return 1

    journey, message = satisfy_gate(journey, args.phase_id, args.gate)
    write_journey(journey, path)
    print(message)
    return 0


def _cmd_phase_gates(args: argparse.Namespace) -> int:
    """List required gates for a phase and their artifact status."""
    from gates import PHASE_GATES

    required = PHASE_GATES.get(args.phase_id, [])
    if not required:
        print(f"Phase '{args.phase_id}' has no required gates.")
        return 0

    scratch_dir = _SCRATCH_ROOT / args.slug if args.slug else None
    print(f"Phase '{args.phase_id}' required gates:")
    for gate_name in required:
        status = "⬜"
        if scratch_dir and scratch_dir.exists():
            from gates import check_gate

            passed, _ = check_gate(gate_name, scratch_dir)
            status = "✅" if passed else "⬜"
        print(f"  {status} {gate_name}")
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
        p.add_argument("--explore", action="store_true")

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

    # satisfy-gate
    p_satisfy = sub.add_parser(
        "satisfy-gate", help="Mark a phase gate as satisfied"
    )
    p_satisfy.add_argument("--slug", required=True)
    p_satisfy.add_argument("--phase-id", required=True, help="Phase that owns the gate")
    p_satisfy.add_argument("--gate", required=True, help="Gate name to satisfy")

    # phase-gates
    p_pgates = sub.add_parser(
        "phase-gates", help="List required gates for a phase"
    )
    p_pgates.add_argument("--slug", help="Journey slug (optional, for artifact check)")
    p_pgates.add_argument("--phase-id", required=True, help="Phase to inspect")

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
        "satisfy-gate": _cmd_satisfy_gate,
        "phase-gates": _cmd_phase_gates,
    }
    sys.exit(handlers[args.command](args))


if __name__ == "__main__":
    main()
