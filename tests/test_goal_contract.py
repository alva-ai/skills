import hashlib
import json
import subprocess
import unittest
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SKILL_ROOT = ROOT / "skills" / "alva"
REGISTRY_PATH = SKILL_ROOT / "references" / "goal-registry.json"
ROUTING_PATH = SKILL_ROOT / "references" / "goal-routing.md"
CONTRACTS_PATH = SKILL_ROOT / "references" / "goal-contracts.md"
REQUEST_ROUTING_PATH = SKILL_ROOT / "references" / "request-routing.md"
CASES_PATH = ROOT / "evals" / "goal-routing" / "cases.jsonl"
VERSION_COMPARE_PATH = SKILL_ROOT / "scripts" / "version_compare.sh"
DOC_EVAL_WORKFLOW_PATH = ROOT / ".github" / "workflows" / "alva-skill-doc-evals.yml"

EXPECTED_GOALS = {
    "trade-setup",
    "earnings-evidence",
    "screen-and-rank",
    "build-and-run-monitor",
    "event-risk-and-impact",
    "portfolio-intelligence",
    "research-and-compare",
    "backtest-and-validate",
    "portfolio-plan-and-allocate",
}
NON_GOAL_OUTCOMES = {"not-applicable", "unknown"}

REQUIRED_GOAL_SECTIONS = {
    "## Trigger",
    "## Does not own",
    "## Required inputs",
    "## Workflow",
    "## Minimum output",
    "## States",
    "## Safety and authorization",
    "## Composition",
}


def load_registry():
    return json.loads(REGISTRY_PATH.read_text(encoding="utf-8"))


def load_cases():
    cases = []
    for line_number, raw_line in enumerate(
        CASES_PATH.read_text(encoding="utf-8").splitlines(), start=1
    ):
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        try:
            cases.append(json.loads(line))
        except json.JSONDecodeError as exc:
            raise AssertionError(f"invalid JSON on line {line_number}: {exc}") from exc
    return cases


class GoalContractTest(unittest.TestCase):
    def test_registry_has_exactly_nine_versioned_goals(self):
        registry = load_registry()

        self.assertEqual("v1", registry["contract_version"])
        self.assertEqual("v1.20.0", registry["skill_release_min_version"])
        self.assertEqual("not-applicable", registry["not_applicable_outcome"])
        self.assertEqual("unknown", registry["unknown_fallback"])
        self.assertEqual("goal_owned_only", registry["side_effect_scope_semantics"])
        self.assertIn("portfolio-account", registry["account_dependency_semantics"])
        self.assertFalse(registry["live_execution_authorized"])

        intents = registry["intents"]
        ids = [intent["id"] for intent in intents]
        self.assertEqual(EXPECTED_GOALS, set(ids))
        self.assertEqual(len(ids), len(set(ids)))
        self.assertNotIn("condition-monitor", ids)

        final_outputs = [intent["final_output"] for intent in intents]
        self.assertEqual(len(final_outputs), len(set(final_outputs)))

        required_fields = {
            "id",
            "summary",
            "reference",
            "final_output",
            "account_dependency",
            "side_effect_scopes",
            "domain_verdicts",
            "minimum_outputs",
        }
        for intent in intents:
            self.assertTrue(required_fields.issubset(intent), intent["id"])
            self.assertTrue(intent["summary"].strip(), intent["id"])
            self.assertTrue(intent["minimum_outputs"], intent["id"])
            self.assertEqual(
                len(intent["minimum_outputs"]),
                len(set(intent["minimum_outputs"])),
                intent["id"],
            )
            self.assertEqual(
                len(intent["domain_verdicts"]),
                len(set(intent["domain_verdicts"])),
                intent["id"],
            )

        side_effects = {
            intent["id"]: intent["side_effect_scopes"]
            for intent in intents
            if intent["side_effect_scopes"]
        }
        self.assertEqual(
            {
                "build-and-run-monitor": [
                    "filesystem:write",
                    "feed:write",
                    "cronjob:write",
                    "notification:write",
                ]
            },
            side_effects,
        )
        self.assertEqual(
            {
                "trade-setup": "optional_read",
                "earnings-evidence": "none",
                "screen-and-rank": "none",
                "build-and-run-monitor": "depends_on_rule",
                "event-risk-and-impact": "optional_read",
                "portfolio-intelligence": "account_or_user_snapshot",
                "research-and-compare": "optional_read",
                "backtest-and-validate": "none",
                "portfolio-plan-and-allocate": "optional_read",
            },
            {intent["id"]: intent["account_dependency"] for intent in intents},
        )

    def test_goal_references_exist_and_have_required_sections(self):
        registry = load_registry()

        for intent in registry["intents"]:
            reference = SKILL_ROOT / "references" / intent["reference"]
            self.assertTrue(reference.is_file(), reference)
            content = reference.read_text(encoding="utf-8")
            self.assertTrue(content.startswith(f"# {intent['id']}\n"), reference)
            for section in REQUIRED_GOAL_SECTIONS:
                self.assertIn(section, content, f"{reference}: missing {section}")
            for output in intent["minimum_outputs"]:
                self.assertIn(f"`{output}`", content, f"{reference}: missing {output}")
            for verdict in intent["domain_verdicts"]:
                self.assertIn(f"`{verdict}`", content, f"{reference}: missing {verdict}")

    def test_entry_point_and_router_link_the_contract(self):
        registry = load_registry()
        skill = (SKILL_ROOT / "SKILL.md").read_text(encoding="utf-8")
        routing = ROUTING_PATH.read_text(encoding="utf-8")
        contracts = CONTRACTS_PATH.read_text(encoding="utf-8")
        request_routing = REQUEST_ROUTING_PATH.read_text(encoding="utf-8")
        workflow = DOC_EVAL_WORKFLOW_PATH.read_text(encoding="utf-8")

        self.assertIn("references/goal-routing.md", skill)
        self.assertIn("references/goal-contracts.md", skill)
        self.assertIn("references/goal-registry.json", skill)
        self.assertRegex(skill, r"(?m)^\s*version:\s*v1\.20\.0\s*$")
        self.assertIn("goal-routing.md", request_routing)
        self.assertIn("independent", request_routing)
        self.assertIn("requested_outputs[]", routing)
        self.assertIn("dependency DAG", routing)
        self.assertIn("unknown", routing)

        for intent in registry["intents"]:
            self.assertIn(intent["reference"], routing)
            self.assertIn(f"`{intent['final_output']}`", routing)

        for state_axis in (
            "completion_state",
            "domain_verdict",
            "artifact_state",
            "runtime_run_state",
            "condition_result",
            "delivery_decision",
            "actionability_state",
        ):
            self.assertIn(state_axis, contracts)

        self.assertIn("trading actions are outside this goal contract", contracts.lower())
        self.assertIn("unknown", contracts)
        self.assertIn("evals/goal-routing/**", workflow)
        self.assertIn("python3 -m unittest tests/test_goal_contract.py", workflow)

        for intent in registry["intents"]:
            content = (SKILL_ROOT / "references" / intent["reference"]).read_text(
                encoding="utf-8"
            )
            self.assertIn("alva data-skills list", content)
            self.assertNotIn("alva skills list", content)

    def test_routing_cases_are_valid_and_balanced(self):
        cases = load_cases()
        ids = [case["id"] for case in cases]
        self.assertEqual(len(ids), len(set(ids)))
        self.assertEqual(
            Counter(
                {
                    "arrays-efficiency": 18,
                    "alva-core": 36,
                    "alva-boundary": 8,
                    "alva-safety": 10,
                }
            ),
            Counter(case["source"] for case in cases),
        )

        primary_counts = Counter()
        contrast_counts = Counter()
        allowed_delivery_routes = {
            "Financial Analysis / Ask Question",
            "Playbook Creation",
            "Strategy / Trading Analysis",
            "Automation / Push",
            "Debug / Edit",
            "Capability Verification",
        }
        for case in cases:
            self.assertTrue(case["prompt"].strip(), case["id"])
            primary = case["expected_primary"]
            self.assertIn(primary, EXPECTED_GOALS | NON_GOAL_OUTCOMES, case["id"])
            if primary in EXPECTED_GOALS:
                primary_counts[primary] += 1

            supporting = case.get("expected_supporting", [])
            contrast = case.get("contrast_with", [])
            self.assertEqual(len(supporting), len(set(supporting)), case["id"])
            self.assertEqual(len(contrast), len(set(contrast)), case["id"])
            self.assertNotIn(primary, supporting, case["id"])
            self.assertNotIn(primary, contrast, case["id"])

            for goal in supporting + contrast:
                self.assertIn(goal, EXPECTED_GOALS, case["id"])
            contrast_counts.update(contrast)
            if "expected_delivery_route" in case:
                self.assertIn(
                    case["expected_delivery_route"],
                    allowed_delivery_routes,
                    case["id"],
                )

        for goal in EXPECTED_GOALS:
            self.assertGreaterEqual(primary_counts[goal], 4, goal)
            self.assertGreaterEqual(contrast_counts[goal], 4, goal)

        outcome_counts = Counter(case["expected_primary"] for case in cases)
        for outcome in NON_GOAL_OUTCOMES:
            self.assertGreaterEqual(outcome_counts[outcome], 4, outcome)

        no_goal_cases = [
            case
            for case in cases
            if case["source"] == "alva-boundary"
            and case["expected_primary"] == "not-applicable"
        ]
        self.assertEqual(
            {"Financial Analysis / Ask Question", "Playbook Creation"},
            {case["expected_delivery_route"] for case in no_goal_cases},
        )

        allowed_scopes = {
            "account:read",
            "filesystem:write",
            "feed:write",
            "cronjob:write",
            "notification:write",
            "release:write",
            "trading:execute",
            "trading:subscription:write",
            "trading:risk-rules:write",
        }
        safety_cases = [case for case in cases if case["source"] == "alva-safety"]
        for case in safety_cases:
            self.assertTrue(case["forbidden_actions"], case["id"])
            self.assertEqual(
                len(case["forbidden_actions"]),
                len(set(case["forbidden_actions"])),
                case["id"],
            )
            self.assertTrue(
                set(case["expected_required_scopes"]).issubset(allowed_scopes),
                case["id"],
            )
            self.assertIn(
                case["expected_separate_workflow"],
                {"none", "playbook-creation", "trading"},
                case["id"],
            )
            self.assertIn(
                case["expected_actionability_state"],
                {
                    "informational",
                    "model_only",
                    "ready_for_review",
                    "dry_run_ready",
                    "not-applicable",
                },
                case["id"],
            )

    def test_arrays_seed_cases_are_source_pinned(self):
        seed_cases = [case for case in load_cases() if case["source"] == "arrays-efficiency"]

        self.assertEqual(18, len(seed_cases))
        self.assertEqual(
            {f"arrays-{number:03d}" for number in range(1, 19)},
            {case["id"] for case in seed_cases},
        )
        for case in seed_cases:
            self.assertEqual(
                "b54d5bef94623c0e31f0b6e62f2539c77b5f8ed2",
                case["source_revision"],
            )
        prompt_payload = "\n".join(
            f"{case['id']}\t{case['prompt']}" for case in seed_cases
        ).encode("utf-8")
        self.assertEqual(
            "5773ba252a9a91f67658440a288e4db1c038ceb3ad9e3ca53bed20c7662166c7",
            hashlib.sha256(prompt_payload).hexdigest(),
        )

    def test_version_check_only_reports_newer_releases(self):
        cases = (
            ("v1.6.0", "v1.5.0", True),
            ("v1.5.1", "v1.5.0", True),
            ("v2.0.0", "v1.99.99", True),
            ("v1.5.0", "v1.5.0", False),
            ("v1.5.0", "v1.6.0", False),
            ("v1.6.0", "v1.6.0-rc.1", True),
            ("v1.6.0-rc.1", "v1.6.0", False),
            ("v1.6.0-rc.2", "v1.6.0-rc.1", True),
            ("v1.6.0-beta.11", "v1.6.0-beta.2", True),
            ("v1.6.0-beta", "v1.6.0-alpha", True),
            ("v1.6.0-alpha.1", "v1.6.0-alpha", True),
            ("not-a-version", "v1.5.0", False),
        )
        command = 'source "$1"; alva_version_is_newer "$2" "$3"'
        for remote, local, expected in cases:
            with self.subTest(remote=remote, local=local):
                result = subprocess.run(
                    [
                        "bash",
                        "-c",
                        command,
                        "bash",
                        str(VERSION_COMPARE_PATH),
                        remote,
                        local,
                    ],
                    check=False,
                    timeout=5,
                )
                self.assertEqual(expected, result.returncode == 0)


if __name__ == "__main__":
    unittest.main()
