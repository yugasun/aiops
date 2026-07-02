"""Tests for code_graph_query.py — graph query module with synthetic data."""

import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from code_graph_query import (  # noqa: E402
    load_annotations,
    load_graph,
    query_communities,
    query_deps,
    query_god_nodes,
    query_hotspot,
    query_impact,
    query_modules,
    query_orphans,
    query_rdeps,
    query_shallow,
)

# ─── Synthetic test data ─────────────────────────────────────────────────────

SAMPLE_GRAPH = {
    "directed": True,
    "multigraph": False,
    "graph": {
        "community_labels": {"0": "Auth", "1": "API"},
        "built_from_commit": "abc123",
    },
    "nodes": [
        {
            "id": "src/auth/login.ts",
            "community": "0",
            "community_name": "Auth",
            "degree": 8,
            "in_degree": 5,
            "out_degree": 3,
        },
        {
            "id": "src/api/routes.ts",
            "community": "1",
            "community_name": "API",
            "degree": 6,
            "in_degree": 2,
            "out_degree": 4,
        },
        {
            "id": "src/utils/helpers.ts",
            "community": "1",
            "community_name": "API",
            "degree": 2,
            "in_degree": 0,
            "out_degree": 2,
        },
        {
            "id": "tests/auth.test.ts",
            "community": "0",
            "community_name": "Auth",
            "degree": 1,
            "in_degree": 0,
            "out_degree": 1,
        },
    ],
    "links": [
        {"source": "src/api/routes.ts", "target": "src/auth/login.ts", "relation": "IMPORTS", "confidence_score": 1.0},
        {"source": "src/api/routes.ts", "target": "src/utils/helpers.ts", "relation": "IMPORTS", "confidence_score": 1.0},
        {"source": "src/auth/login.ts", "target": "src/utils/helpers.ts", "relation": "CALLS", "confidence_score": 0.5},
        {"source": "tests/auth.test.ts", "target": "src/auth/login.ts", "relation": "IMPORTS", "confidence_score": 1.0},
    ],
}

SAMPLE_ANNOTATIONS = {
    "build_time": "2026-07-01T10:00:00Z",
    "git_ref": "abc123",
    "annotations": {
        "src/auth/login.ts": {
            "purpose": "User login handler",
            "depth": "deep",
            "tags": ["auth"],
            "complexity": "high",
            "is_test_file": False,
        },
        "src/utils/helpers.ts": {
            "purpose": "Grab-bag utils",
            "depth": "shallow",
            "tags": ["utils"],
            "complexity": "low",
            "is_test_file": False,
        },
    },
    "hotspots": [
        {"node_id": "src/auth/login.ts", "in_degree": 5, "recent_commits": 12, "reason": "high coupling + churn"},
    ],
    "impact_map": {
        "src/auth/login.ts": {
            "direct": ["src/api/routes.ts"],
            "transitive": ["src/pages/dashboard.ts"],
        },
    },
}


class CodeGraphQueryTests(unittest.TestCase):
    def test_query_modules_lists_all_nodes(self):
        result = query_modules(SAMPLE_GRAPH, SAMPLE_ANNOTATIONS)
        self.assertIn("Modules", result)
        self.assertIn("4 nodes", result)
        self.assertIn("2 communities", result)
        self.assertIn("src/auth/login.ts", result)
        self.assertIn("deep", result)

    def test_query_modules_empty_graph(self):
        result = query_modules({}, {})
        self.assertIn("No graph data", result)

    def test_query_deps_outgoing(self):
        result = query_deps("src/api/routes.ts", SAMPLE_GRAPH, SAMPLE_ANNOTATIONS)
        self.assertIn("Dependencies of src/api/routes.ts", result)
        self.assertIn("src/auth/login.ts", result)
        self.assertIn("IMPORTS", result)
        self.assertIn("EXTRACTED", result)

    def test_query_deps_no_deps(self):
        result = query_deps("src/utils/helpers.ts", SAMPLE_GRAPH, SAMPLE_ANNOTATIONS)
        self.assertIn("No outgoing", result)

    def test_query_rdeps_incoming(self):
        result = query_rdeps("src/auth/login.ts", SAMPLE_GRAPH, SAMPLE_ANNOTATIONS)
        self.assertIn("Dependents of src/auth/login.ts", result)
        self.assertIn("src/api/routes.ts", result)
        self.assertIn("tests/auth.test.ts", result)

    def test_query_rdeps_no_dependents(self):
        result = query_rdeps("src/api/routes.ts", SAMPLE_GRAPH, SAMPLE_ANNOTATIONS)
        self.assertIn("No incoming", result)

    def test_query_impact_precomputed(self):
        result = query_impact("src/auth/login.ts", SAMPLE_GRAPH, SAMPLE_ANNOTATIONS)
        self.assertIn("Impact of changing", result)
        self.assertIn("src/api/routes.ts", result)
        self.assertIn("src/pages/dashboard.ts", result)

    def test_query_impact_computed_from_graph(self):
        # helpers.ts has incoming from routes.ts and login.ts
        result = query_impact("src/utils/helpers.ts", SAMPLE_GRAPH, {})
        self.assertIn("Direct impact", result)
        self.assertIn("src/api/routes.ts", result)

    def test_query_hotspot(self):
        result = query_hotspot(SAMPLE_GRAPH, SAMPLE_ANNOTATIONS)
        self.assertIn("Hotspots", result)
        self.assertIn("src/auth/login.ts", result)
        self.assertIn("12 commits", result)

    def test_query_hotspot_no_data(self):
        result = query_hotspot(SAMPLE_GRAPH, {})
        self.assertIn("No hotspot data", result)

    def test_query_god_nodes(self):
        result = query_god_nodes(SAMPLE_GRAPH, SAMPLE_ANNOTATIONS, top_n=2)
        self.assertIn("God Nodes (top 2)", result)
        self.assertIn("src/auth/login.ts", result)
        self.assertIn("degree: 8", result)

    def test_query_shallow(self):
        result = query_shallow(SAMPLE_GRAPH, SAMPLE_ANNOTATIONS)
        self.assertIn("Shallow Nodes", result)
        self.assertIn("src/utils/helpers.ts", result)
        self.assertIn("Grab-bag utils", result)

    def test_query_shallow_none(self):
        result = query_shallow(SAMPLE_GRAPH, {"annotations": {}})
        self.assertIn("No shallow nodes", result)

    def test_query_orphans(self):
        result = query_orphans(SAMPLE_GRAPH, SAMPLE_ANNOTATIONS)
        self.assertIn("Orphan Nodes", result)
        # routes.ts and tests have zero incoming edges
        self.assertIn("src/api/routes.ts", result)
        self.assertIn("tests/auth.test.ts", result)
        # helpers.ts has incoming edges, so NOT an orphan
        self.assertNotIn("src/utils/helpers.ts", result)

    def test_query_communities(self):
        result = query_communities(SAMPLE_GRAPH, SAMPLE_ANNOTATIONS)
        self.assertIn("Communities", result)
        self.assertIn("Auth", result)
        self.assertIn("API", result)
        self.assertIn("src/auth/login.ts", result)

    def test_load_graph_missing_file(self):
        result = load_graph("/nonexistent/path/graph.json")
        self.assertEqual(result, {})

    def test_load_annotations_missing_file(self):
        result = load_annotations("/nonexistent/path/annotations.json")
        self.assertEqual(result, {})

    def test_load_graph_roundtrip(self):
        with __import__("tempfile").TemporaryDirectory() as tmpdir:
            path = Path(tmpdir) / "graph.json"
            path.write_text(json.dumps(SAMPLE_GRAPH))
            loaded = load_graph(str(path))
            self.assertEqual(len(loaded["nodes"]), 4)
            self.assertEqual(len(loaded["links"]), 4)


if __name__ == "__main__":
    unittest.main()
