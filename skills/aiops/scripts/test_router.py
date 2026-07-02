"""Tests for skills/aiops/scripts/ — canonical Flow Conductor routes."""

import sys
import tempfile
import unittest
from pathlib import Path

# Allow running from repo root: python3 -m unittest skills.aiops.scripts.test_router
sys.path.insert(0, str(Path(__file__).resolve().parent))

from gates import (  # noqa: E402
    GATE_ARTIFACTS,
    PHASE_GATES,
    check_all_gates,
    check_gate,
    check_phase_gates,
    is_gate_in_phase,
    satisfy_gate,
)
from journey_state import (  # noqa: E402
    advance_journey,
    initial_journey,
    narration_progress,
    plan_hash_from_phases,
    read_journey,
    state_from_snapshot,
    write_journey,
)
from phases import TERMINAL_PHASE_ID, FlowState, plan_flow  # noqa: E402


class PlanFlowTests(unittest.TestCase):
    def test_feature_single_session_has_design_review_before_delivery(self):
        state = FlowState(
            task_kind="feature_idea",
            issue_tracker_configured=True,
            delivery_mode="single_session",
        )
        plan = plan_flow(state)
        ids = [p.phase_id for p in plan.phases]
        self.assertIn("alignment", ids)
        self.assertIn("design_review", ids)
        self.assertIn("delivery", ids)
        self.assertLess(ids.index("design_review"), ids.index("delivery"))
        self.assertNotIn("planning_prd", ids)
        # P1.1: single-session includes lightweight task_breakdown
        self.assertIn("task_breakdown", ids)
        self.assertLess(ids.index("task_breakdown"), ids.index("delivery"))
        self.assertGreater(ids.index("task_breakdown"), ids.index("design_review"))

    def test_feature_multi_session_inserts_planning(self):
        state = FlowState(
            task_kind="feature_idea",
            issue_tracker_configured=True,
            delivery_mode="multi_session",
        )
        plan = plan_flow(state)
        ids = [p.phase_id for p in plan.phases]
        self.assertIn("planning_prd", ids)
        self.assertIn("planning_issues", ids)
        self.assertLess(ids.index("planning_issues"), ids.index("delivery"))

    def test_feature_with_ui_has_mockup_before_design_review(self):
        state = FlowState(task_kind="feature_with_ui", issue_tracker_configured=True)
        plan = plan_flow(state)
        ids = [p.phase_id for p in plan.phases]
        self.assertIn("ui_mockup", ids)
        self.assertLess(ids.index("ui_mockup"), ids.index("design_review"))

    def test_bug_skips_alignment(self):
        plan = plan_flow(FlowState(task_kind="bug_fix"))
        ids = [p.phase_id for p in plan.phases]
        self.assertEqual(ids[0], "diagnose")
        self.assertNotIn("alignment", ids)

    def test_architecture_health_starts_with_graph_build(self):
        state = FlowState(task_kind="architecture_health", issue_tracker_configured=True)
        plan = plan_flow(state)
        ids = [p.phase_id for p in plan.phases]
        self.assertEqual(ids[0], "graph_build")
        self.assertEqual(plan.phases[0].skill, "/code-graph")
        self.assertEqual(ids[1], "architecture_scan")
        self.assertIn("improve-codebase-architecture", plan.phases[1].skill)

    def test_unconfigured_prepends_bootstrap(self):
        plan = plan_flow(FlowState(task_kind="feature_idea"))
        self.assertEqual(plan.phases[0].phase_id, "bootstrap")

    def test_greenfield_uses_grilling(self):
        state = FlowState(task_kind="feature_idea", has_codebase=False, issue_tracker_configured=True)
        plan = plan_flow(state)
        align = next(p for p in plan.phases if p.phase_id == "alignment")
        self.assertEqual(align.skill, "/grilling")

    def test_each_phase_has_skill_agent_narration(self):
        plan = plan_flow(FlowState(task_kind="feature_idea", issue_tracker_configured=True))
        for phase in plan.phases:
            self.assertTrue(phase.phase_id)
            self.assertTrue(phase.narration_key)
            self.assertTrue(phase.skill or phase.agent)

    # ── P1.1: Universal task breakdown ──

    def test_architecture_health_has_task_breakdown(self):
        state = FlowState(task_kind="architecture_health", issue_tracker_configured=True)
        plan = plan_flow(state)
        ids = [p.phase_id for p in plan.phases]
        self.assertIn("task_breakdown", ids)
        self.assertLess(ids.index("design_review"), ids.index("task_breakdown"))
        self.assertLess(ids.index("task_breakdown"), ids.index("delivery"))

    def test_multi_session_keeps_full_planning_pipeline(self):
        state = FlowState(
            task_kind="feature_idea",
            issue_tracker_configured=True,
            delivery_mode="multi_session",
        )
        plan = plan_flow(state)
        ids = [p.phase_id for p in plan.phases]
        self.assertIn("planning_prd", ids)
        self.assertIn("planning_issues", ids)
        self.assertIn("issue_session", ids)
        # multi_session does NOT use task_breakdown
        self.assertNotIn("task_breakdown", ids)
        self.assertLess(ids.index("planning_issues"), ids.index("delivery"))

    def test_bug_fix_skips_task_breakdown(self):
        state = FlowState(task_kind="bug_fix", issue_tracker_configured=True)
        plan = plan_flow(state)
        ids = [p.phase_id for p in plan.phases]
        self.assertNotIn("task_breakdown", ids)
        self.assertIn("delivery", ids)

    # ── P1.2: Explore phase ──

    def test_explore_default_off(self):
        state = FlowState(task_kind="feature_idea", issue_tracker_configured=True)
        plan = plan_flow(state)
        ids = [p.phase_id for p in plan.phases]
        self.assertNotIn("explore", ids)

    def test_explore_inserted_before_alignment(self):
        state = FlowState(
            task_kind="feature_idea",
            issue_tracker_configured=True,
            explore_requested=True,
        )
        plan = plan_flow(state)
        ids = [p.phase_id for p in plan.phases]
        self.assertIn("explore", ids)
        self.assertLess(ids.index("explore"), ids.index("alignment"))

    # ── P1.3: Drift check ──

    def test_drift_check_between_delivery_and_ship(self):
        state = FlowState(task_kind="feature_idea", issue_tracker_configured=True)
        plan = plan_flow(state)
        ids = [p.phase_id for p in plan.phases]
        self.assertIn("drift_check", ids)
        self.assertLess(ids.index("delivery"), ids.index("drift_check"))
        self.assertLess(ids.index("drift_check"), ids.index("ship"))

    def test_drift_check_gate_registered(self):
        self.assertIn("drift_check_pass", GATE_ARTIFACTS)


class JourneyTests(unittest.TestCase):
    def test_initial_journey_starts_at_first_phase(self):
        state = FlowState(task_kind="bug_fix")
        plan = plan_flow(state)
        journey = initial_journey(state, "login-fix", "fix login 500")
        self.assertEqual(journey.current_phase_id, plan.phases[0].phase_id)
        self.assertEqual(journey.slug, "login-fix")

    def test_advance_journey_moves_forward(self):
        state = FlowState(task_kind="bug_fix")
        plan = plan_flow(state)
        journey = initial_journey(state, "x", "y")
        journey = advance_journey(journey, plan)
        self.assertEqual(journey.current_phase_id, plan.phases[1].phase_id)
        self.assertIn(plan.phases[0].phase_id, journey.phases_done)

    def test_advance_journey_reaches_done_sentinel(self):
        state = FlowState(task_kind="bug_fix", issue_tracker_configured=True)
        plan = plan_flow(state)
        journey = initial_journey(state, "x", "y")
        # Advance through all phases
        for _ in range(len(plan.phases)):
            journey = advance_journey(journey, plan)
        self.assertEqual(journey.current_phase_id, TERMINAL_PHASE_ID)
        self.assertEqual(len(journey.phases_done), len(plan.phases))

    def test_advance_journey_no_delivery_sub_phase(self):
        """JourneyState should not have delivery_sub_phase field."""
        state = FlowState(task_kind="bug_fix")
        journey = initial_journey(state, "x", "y")
        self.assertFalse(hasattr(journey, "delivery_sub_phase"))

    def test_phase_index_with_done_sentinel(self):
        state = FlowState(task_kind="bug_fix", issue_tracker_configured=True)
        plan = plan_flow(state)
        journey = initial_journey(state, "x", "y")
        for _ in range(len(plan.phases)):
            journey = advance_journey(journey, plan)
        # phase_index should return last phase index when done
        idx = journey.phase_index(plan)
        self.assertEqual(idx, len(plan.phases) - 1)

    def test_phase_index_rejects_unknown_phase(self):
        state = FlowState(task_kind="bug_fix", issue_tracker_configured=True)
        plan = plan_flow(state)
        journey = initial_journey(state, "x", "y")
        journey.current_phase_id = "missing_phase"
        with self.assertRaises(ValueError):
            journey.phase_index(plan)

    def test_narration_progress(self):
        state = FlowState(task_kind="bug_fix")
        plan = plan_flow(state)
        journey = initial_journey(state, "x", "y")
        step, total = narration_progress(journey, plan)
        self.assertEqual(step, 1)
        self.assertEqual(total, len(plan.phases))

    def test_narration_progress_at_done(self):
        state = FlowState(task_kind="bug_fix", issue_tracker_configured=True)
        plan = plan_flow(state)
        journey = initial_journey(state, "x", "y")
        for _ in range(len(plan.phases)):
            journey = advance_journey(journey, plan)
        step, total = narration_progress(journey, plan)
        self.assertEqual(step, total)

    # ── Journey control module: state snapshot ──

    def test_initial_journey_stores_state_snapshot(self):
        state = FlowState(
            task_kind="feature_idea",
            has_codebase=False,
            issue_tracker_configured=True,
            explore_requested=True,
        )
        journey = initial_journey(state, "test-snap", "snapshot test")
        self.assertFalse(journey.state_has_codebase)
        self.assertTrue(journey.state_issue_tracker_configured)
        self.assertTrue(journey.state_explore_requested)
        self.assertFalse(journey.state_triage_unclear)

    def test_state_snapshot_roundtrips_through_yaml(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            state = FlowState(
                task_kind="feature_idea",
                has_codebase=False,
                issue_tracker_configured=True,
                needs_runnable_answer=True,
                triage_unclear=True,
                explore_requested=True,
            )
            journey = initial_journey(state, "roundtrip", "test yaml")
            path = Path(tmpdir) / "flow.state.yaml"
            write_journey(journey, path)

            loaded = read_journey(path)
            self.assertFalse(loaded.state_has_codebase)
            self.assertTrue(loaded.state_issue_tracker_configured)
            self.assertTrue(loaded.state_needs_runnable_answer)
            self.assertTrue(loaded.state_triage_unclear)
            self.assertTrue(loaded.state_explore_requested)
            self.assertEqual(loaded.task_kind, "feature_idea")

    def test_state_from_snapshot_produces_same_plan(self):
        state = FlowState(
            task_kind="feature_with_ui",
            has_codebase=False,
            issue_tracker_configured=True,
            explore_requested=True,
        )
        plan1 = plan_flow(state)
        journey = initial_journey(state, "x", "y")

        # Reconstruct state from snapshot
        state2 = state_from_snapshot(journey)
        plan2 = plan_flow(state2)

        ids1 = [p.phase_id for p in plan1.phases]
        ids2 = [p.phase_id for p in plan2.phases]
        self.assertEqual(ids1, ids2)

    def test_plan_hash_computed_on_init(self):
        state = FlowState(task_kind="bug_fix", issue_tracker_configured=True)
        plan = plan_flow(state)
        journey = initial_journey(state, "hash-test", "")
        expected = plan_hash_from_phases(plan.phases)
        self.assertEqual(journey.plan_hash, expected)
        self.assertTrue(len(journey.plan_hash) > 0)

    def test_plan_hash_detects_drift(self):
        state = FlowState(task_kind="bug_fix", issue_tracker_configured=True)
        plan = plan_flow(state)
        journey = initial_journey(state, "drift", "")

        # Simulate a different plan by changing the hash
        journey.plan_hash = "different|plan|hash"
        reconstructed = state_from_snapshot(journey)
        new_plan = plan_flow(reconstructed)
        new_hash = plan_hash_from_phases(new_plan.phases)

        self.assertNotEqual(journey.plan_hash, new_hash)

    def test_yaml_v1_backward_compat(self):
        """V1 files (no state: block) should read with defaults."""
        with tempfile.TemporaryDirectory() as tmpdir:
            path = Path(tmpdir) / "flow.state.yaml"
            path.write_text(
                "version: 1\n"
                "slug: legacy\n"
                "task_kind: bug_fix\n"
                "delivery_mode: single_session\n"
                'user_description: "old format"\n'
                "current_phase_id: diagnose\n"
                "phases_done: []\n"
                "gates_satisfied: []\n"
                "current_issue: null\n",
                encoding="utf-8",
            )
            journey = read_journey(path)
            self.assertEqual(journey.version, 1)
            self.assertEqual(journey.slug, "legacy")
            # Defaults for missing state fields
            self.assertTrue(journey.state_has_codebase)
            self.assertFalse(journey.state_issue_tracker_configured)
            self.assertEqual(journey.plan_hash, "")


class GateValidationTests(unittest.TestCase):
    def test_check_gate_unknown_gate_passes(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            passed, msg = check_gate("custom_gate", Path(tmpdir))
            self.assertTrue(passed)
            self.assertIn("convention", msg)

    def test_check_gate_missing_artifact_fails(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            passed, msg = check_gate("design_review_approve", Path(tmpdir))
            self.assertFalse(passed)
            self.assertIn("missing", msg.lower())

    def test_check_gate_artifact_exists_but_no_content_check_fails(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            # Create file without APPROVE keyword
            (Path(tmpdir) / "DESIGN_REVIEW.md").write_text("needs changes")
            passed, msg = check_gate("design_review_approve", Path(tmpdir))
            self.assertFalse(passed)
            self.assertIn("does not contain", msg)

    def test_check_gate_artifact_with_content_passes(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            (Path(tmpdir) / "DESIGN_REVIEW.md").write_text("Verdict: APPROVE")
            passed, msg = check_gate("design_review_approve", Path(tmpdir))
            self.assertTrue(passed)

    def test_check_gate_directory_artifact(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            # Missing directory
            passed, _ = check_gate("bootstrap_done", Path(tmpdir))
            self.assertFalse(passed)
            # Create directory
            (Path(tmpdir) / "docs" / "agents").mkdir(parents=True)
            passed, _ = check_gate("bootstrap_done", Path(tmpdir))
            self.assertTrue(passed)

    def test_bootstrap_gate_uses_project_root_from_scratch_dir(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            root = Path(tmpdir)
            scratch = root / ".scratch" / "feature"
            scratch.mkdir(parents=True)
            passed, _ = check_gate("bootstrap_done", scratch)
            self.assertFalse(passed)

            (root / "docs" / "agents").mkdir(parents=True)
            passed, _ = check_gate("bootstrap_done", scratch)
            self.assertTrue(passed)

    def test_check_all_gates(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            (Path(tmpdir) / "DESIGN_REVIEW.md").write_text("APPROVE")
            results = check_all_gates(
                ["design_review_approve", "prototype_verdict"],
                Path(tmpdir),
            )
            self.assertEqual(len(results), 2)
            # design_review_approve passes
            self.assertTrue(results[0][1])
            # prototype_verdict fails (no VERDICT.md)
            self.assertFalse(results[1][1])

    # ── Phase-aware gate lifecycle ──

    def test_phase_gates_mapping_covers_gate_phases(self):
        self.assertIn("bootstrap", PHASE_GATES)
        self.assertIn("design_review", PHASE_GATES)
        self.assertIn("delivery", PHASE_GATES)
        self.assertIn("drift_check", PHASE_GATES)

    def test_is_gate_in_phase(self):
        self.assertTrue(is_gate_in_phase("design_review", "design_review_approve"))
        self.assertTrue(is_gate_in_phase("delivery", "review_approve"))
        self.assertFalse(is_gate_in_phase("alignment", "design_review_approve"))
        self.assertFalse(is_gate_in_phase("design_review", "review_approve"))

    def test_check_phase_gates_empty_for_gateless_phase(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            results = check_phase_gates("alignment", Path(tmpdir))
            self.assertEqual(results, [])

    def test_check_phase_gates_design_review(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            (Path(tmpdir) / "DESIGN_REVIEW.md").write_text("APPROVE")
            results = check_phase_gates("design_review", Path(tmpdir))
            self.assertEqual(len(results), 1)
            self.assertTrue(results[0][1])  # design_review_approve passes

    def test_satisfy_gate_adds_to_journey(self):
        state = FlowState(task_kind="bug_fix", issue_tracker_configured=True)
        journey = initial_journey(state, "x", "y")
        updated, msg = satisfy_gate(journey, "delivery", "prune_done")
        self.assertIn("prune_done", updated.gates_satisfied)
        self.assertIn("satisfied", msg)

    def test_satisfy_gate_rejects_unknown_gate_for_phase(self):
        state = FlowState(task_kind="bug_fix", issue_tracker_configured=True)
        journey = initial_journey(state, "x", "y")
        updated, msg = satisfy_gate(journey, "design_review", "review_approve")
        self.assertNotIn("review_approve", updated.gates_satisfied)
        self.assertIn("not required", msg)

    def test_satisfy_gate_idempotent(self):
        state = FlowState(task_kind="bug_fix", issue_tracker_configured=True)
        journey = initial_journey(state, "x", "y")
        updated, _ = satisfy_gate(journey, "delivery", "prune_done")
        updated2, msg = satisfy_gate(updated, "delivery", "prune_done")
        self.assertIn("already satisfied", msg)
        self.assertEqual(updated.gates_satisfied, updated2.gates_satisfied)

    def test_satisfy_gate_preserves_state_snapshot(self):
        state = FlowState(
            task_kind="feature_idea",
            has_codebase=False,
            issue_tracker_configured=True,
            explore_requested=True,
        )
        journey = initial_journey(state, "snap", "test")
        updated, _ = satisfy_gate(journey, "delivery", "prune_done")
        # Snapshot fields survive gate satisfaction
        self.assertFalse(updated.state_has_codebase)
        self.assertTrue(updated.state_explore_requested)
        self.assertEqual(updated.plan_hash, journey.plan_hash)


class TaskDagTests(unittest.TestCase):
    def test_topological_sort_linear(self):
        from task_dag import topological_sort
        tasks = [
            {"id": "t1", "blocked_by": []},
            {"id": "t2", "blocked_by": ["t1"]},
            {"id": "t3", "blocked_by": ["t2"]},
        ]
        waves = topological_sort(tasks)
        self.assertEqual(waves, [["t1"], ["t2"], ["t3"]])

    def test_topological_sort_parallel(self):
        from task_dag import topological_sort
        tasks = [
            {"id": "t1", "blocked_by": []},
            {"id": "t2", "blocked_by": ["t1"]},
            {"id": "t3", "blocked_by": ["t1"]},
            {"id": "t4", "blocked_by": ["t2", "t3"]},
        ]
        waves = topological_sort(tasks)
        self.assertEqual(len(waves), 3)
        self.assertEqual(waves[0], ["t1"])
        self.assertEqual(sorted(waves[1]), ["t2", "t3"])
        self.assertEqual(waves[2], ["t4"])

    def test_topological_sort_detects_cycle(self):
        from task_dag import topological_sort
        tasks = [
            {"id": "t1", "blocked_by": ["t2"]},
            {"id": "t2", "blocked_by": ["t1"]},
        ]
        with self.assertRaises(ValueError):
            topological_sort(tasks)

    def test_get_ready_tasks(self):
        from task_dag import get_ready_tasks
        tasks = [
            {"id": "t1", "blocked_by": []},
            {"id": "t2", "blocked_by": ["t1"]},
            {"id": "t3", "blocked_by": ["t1"]},
        ]
        self.assertEqual(get_ready_tasks(tasks, set()), ["t1"])
        self.assertEqual(get_ready_tasks(tasks, {"t1"}), ["t2", "t3"])
        self.assertEqual(get_ready_tasks(tasks, {"t1", "t2", "t3"}), [])


if __name__ == "__main__":
    unittest.main()
