"""Gate validation for Flow Conductor artifacts."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path


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
    "drift_check_pass": GateCheck("DRIFT_REPORT.md"),
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
