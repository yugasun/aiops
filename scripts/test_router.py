import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent / "lib"))

from router import FlowState, plan_flow  # noqa: E402


class PlanFlowTests(unittest.TestCase):
    def test_feature_unconfigured_prepends_setup(self) -> None:
        plan = plan_flow(FlowState(task_kind="feature_idea", issue_tracker_configured=False))
        skills = [step.skill for step in plan.route]
        self.assertEqual(skills[0], "/aiops-setup")
        self.assertIn("/grill-with-docs", skills)
        self.assertEqual(skills[-1], "/aiops-implement")

    def test_bug_skips_grill(self) -> None:
        plan = plan_flow(FlowState(task_kind="bug_fix", issue_tracker_configured=True))
        skills = [step.skill for step in plan.route]
        self.assertEqual(skills, ["/diagnosing-bugs", "/aiops-implement"])

    def test_incoming_routes_triage(self) -> None:
        plan = plan_flow(FlowState(task_kind="incoming_queue", issue_tracker_configured=True))
        skills = [step.skill for step in plan.route]
        self.assertEqual(skills, ["/triage", "/aiops-implement"])

    def test_architecture_health_grill_only(self) -> None:
        plan = plan_flow(
            FlowState(task_kind="architecture_health", issue_tracker_configured=True)
        )
        skills = [step.skill for step in plan.route]
        self.assertIn("/grill-with-docs", skills)
        self.assertNotIn("/improve-codebase-architecture", skills)
        self.assertEqual(skills[-1], "/aiops-implement")

    def test_new_personal_skill(self) -> None:
        plan = plan_flow(
            FlowState(task_kind="new_personal_skill", issue_tracker_configured=True)
        )
        skills = [step.skill for step in plan.route]
        self.assertEqual(skills, ["skill-authoring"])
        self.assertNotIn("/writing-great-skills", skills)

    def test_feature_no_codebase_uses_grilling(self) -> None:
        plan = plan_flow(
            FlowState(task_kind="feature_idea", has_codebase=False, issue_tracker_configured=True)
        )
        skills = [step.skill for step in plan.route]
        self.assertEqual(skills[0], "/grilling")
        self.assertNotIn("/grill-me", skills)

    def test_delivery_gates_not_in_router(self) -> None:
        plan = plan_flow(FlowState(task_kind="bug_fix", issue_tracker_configured=True))
        skills = [step.skill for step in plan.route]
        self.assertNotIn("/tdd", skills)
        self.assertNotIn("/prune", skills)
        self.assertNotIn("/review", skills)


if __name__ == "__main__":
    unittest.main()
