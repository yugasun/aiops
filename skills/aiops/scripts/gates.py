"""Gate validation for Flow Conductor artifacts."""

from __future__ import annotations

from dataclasses import dataclass, replace
from pathlib import Path
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from journey_state import JourneyState


@dataclass(frozen=True)
class GateCheck:
    """Defines what artifact a gate requires before it can be marked satisfied."""

    filename: str
    content_check: str | None = None  # If set, file must contain this string
    root: str = "scratch"  # "scratch" for .scratch/<slug>, "project" for repo root


GATE_ARTIFACTS: dict[str, GateCheck] = {
    "bootstrap_done": GateCheck("docs/agents/", root="project"),
    "design_review_approve": GateCheck("DESIGN_REVIEW.md", "APPROVE"),
    "prototype_verdict": GateCheck("VERDICT.md"),
    "prune_done": GateCheck("PRUNE.md"),
    "review_approve": GateCheck("REVIEW.md", "APPROVE"),
    "ready_for_commit": GateCheck("REVIEW.md", "APPROVE"),
    "drift_check_pass": GateCheck("DRIFT_REPORT.md"),
}


def _project_root_from_scratch(scratch_dir: Path) -> Path:
    """Infer project root from .scratch/<slug>, falling back to scratch_dir."""
    if scratch_dir.parent.name == ".scratch":
        return scratch_dir.parent.parent
    return scratch_dir


def check_gate(
    gate_name: str, scratch_dir: Path, project_root: Path | None = None
) -> tuple[bool, str]:
    """Verify that a gate's artifact exists and meets content requirements.

    Returns (passed, message). The scratch_dir is the .scratch/<slug>/ directory
    where gate artifacts are expected.
    """
    spec = GATE_ARTIFACTS.get(gate_name)
    if spec is None:
        return True, f"Gate '{gate_name}' has no artifact spec — pass by convention."

    root = scratch_dir
    if spec.root == "project":
        root = project_root or _project_root_from_scratch(scratch_dir)
    artifact_path = root / spec.filename

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
    gates_satisfied: list[str], scratch_dir: Path, project_root: Path | None = None
) -> list[tuple[str, bool, str]]:
    """Validate every gate in gates_satisfied against its artifact.

    Returns list of (gate_name, passed, message).
    """
    results = []
    for gate in gates_satisfied:
        passed, msg = check_gate(gate, scratch_dir, project_root)
        results.append((gate, passed, msg))
    return results


# ─── Phase-aware gate lifecycle ──────────────────────────────────────────────


PHASE_GATES: dict[str, list[str]] = {
    "bootstrap": ["bootstrap_done"],
    "design_review": ["design_review_approve"],
    "delivery": ["prune_done", "review_approve", "ready_for_commit"],
    "drift_check": ["drift_check_pass"],
}


def satisfy_gate(
    journey: JourneyState, phase_id: str, gate_name: str
) -> tuple[JourneyState, str]:
    """Mark a gate as satisfied after verifying its artifact.

    Returns (updated_journey, message). The gate must belong to the phase's
    required gates — unknown gates are rejected.
    """
    required = PHASE_GATES.get(phase_id, [])
    if gate_name not in required:
        return (
            journey,
            f"Gate '{gate_name}' is not required by phase '{phase_id}'. "
            f"Required: {required or 'none'}",
        )
    if gate_name in journey.gates_satisfied:
        return journey, f"Gate '{gate_name}' already satisfied."
    gates = list(journey.gates_satisfied) + [gate_name]
    return (
        replace(journey, gates_satisfied=gates),
        f"Gate '{gate_name}' satisfied for phase '{phase_id}'.",
    )


def is_gate_in_phase(phase_id: str, gate_name: str) -> bool:
    """Check whether a gate belongs to a phase's required gates."""
    return gate_name in PHASE_GATES.get(phase_id, [])


def check_phase_gates(
    phase_id: str, scratch_dir: Path, project_root: Path | None = None
) -> list[tuple[str, bool, str]]:
    """Check artifacts for all gates required by a phase.

    Returns list of (gate_name, passed, message). Empty list when the phase
    has no gate requirements.
    """
    required = PHASE_GATES.get(phase_id, [])
    if not required:
        return []
    results = []
    for gate_name in required:
        passed, msg = check_gate(gate_name, scratch_dir, project_root)
        results.append((gate_name, passed, msg))
    return results
