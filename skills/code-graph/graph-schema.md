# Graph Schema

The code graph uses two locations:

1. **`graphify-out/graph.json`** — graphify's native output (structural data: nodes, edges, communities, confidence). Read directly from graphify's output directory.
2. **`.scratch/graph/annotations.json`** — model-generated semantic layer (purpose, depth, tags, hotspots).

## graph.json (graphify format)

Produced by `graphify` (PyPI: `graphifyy`), stored at `graphify-out/graph.json`. This is graphify's native schema.

```json
{
  "directed": true,
  "multigraph": false,
  "graph": {
    "provenance": "graphify v0.17.1",
    "community_labels": { "0": "Authentication", "1": "API Layer" },
    "built_from_commit": "abc1234"
  },
  "topology_signature": "sha256-hash-of-sorted-ids-and-edges",
  "nodes": [ ... ],
  "links": [ ... ],
  "hyperedges": [ ... ]
}
```

### nodes[]

Each node represents a file, function, class, or concept extracted from the codebase.

```json
{
  "id": "src/auth/login.ts",
  "community": "0",
  "community_name": "Authentication",
  "file_type": "ts",
  "source_file": "src/auth/login.ts",
  "description": "User login handler with OAuth support",
  "degree": 8,
  "in_degree": 5,
  "out_degree": 3
}
```

Fields:
- `id` — unique node identifier (usually file path or symbol name)
- `community` — Louvain community assignment
- `community_name` — human-readable community label
- `file_type` — file extension
- `source_file` — relative path to source file
- `description` — auto-generated or LLM-generated description
- `degree` / `in_degree` / `out_degree` — connectivity metrics

### links[]

Each link represents a relationship between two nodes.

```json
{
  "source": "src/api/routes.ts",
  "target": "src/auth/login.ts",
  "relation": "IMPORTS",
  "confidence_score": 1.0
}
```

Fields:
- `source` — source node id (consumer)
- `target` — target node id (dependency)
- `relation` — edge type: `CONTAINS` | `CALLS` | `INHERITS` | `IMPORTS` | `SEMANTICALLY_SIMILAR_TO` | ...
- `confidence_score` — extraction certainty:
  - `1.0` = **EXTRACTED** — directly from AST (import statement, explicit call)
  - `0.5` = **INFERRED** — inferred from patterns (shared data structures, naming conventions)
  - `0.2` = **AMBIGUOUS** — uncertain, needs verification

### hyperedges[]

Groups of nodes that collectively participate in a pattern (e.g., "MDX Content Rendering Pipeline").

### graph metadata

- `provenance` — build metadata (graphify version, build context)
- `community_labels` — mapping from community ID to human-readable label
- `built_from_commit` — git commit hash at build time
- `topology_signature` — hash of sorted node IDs and edges for change detection

## annotations.json (model-generated)

Produced by the model during `/code-graph build` Step 5. Layered on top of graph.json without modifying it.

```json
{
  "build_time": "2026-06-29T10:00:00Z",
  "git_ref": "abc1234def",
  "annotations": {
    "src/auth/login.ts": {
      "purpose": "User login handler with OAuth and session management",
      "depth": "deep",
      "tags": ["auth", "security"],
      "complexity": "high",
      "is_test_file": false
    },
    "src/utils/helpers.ts": {
      "purpose": "Grab-bag of utility functions with no clear domain",
      "depth": "shallow",
      "tags": ["utils"],
      "complexity": "low",
      "is_test_file": false
    }
  },
  "hotspots": [
    {
      "node_id": "src/core/engine.ts",
      "in_degree": 18,
      "recent_commits": 12,
      "reason": "high in-degree + frequent changes = architectural friction"
    }
  ],
  "impact_map": {
    "src/auth/login.ts": {
      "direct": ["src/api/routes.ts", "tests/auth.test.ts"],
      "transitive": ["src/pages/dashboard.ts", "e2e/login.spec.ts"]
    }
  }
}
```

### annotations (per-node)

- `purpose` — one-line semantic description (model-generated from CONTEXT.md vocabulary)
- `depth` — `deep` | `shallow` | `unknown`
  - **deep**: small interface, rich implementation (good architecture)
  - **shallow**: interface nearly as complex as implementation (candidate for deepening)
  - **unknown**: not enough signal to classify
- `tags` — domain tags using CONTEXT.md vocabulary
- `complexity` — `low` | `medium` | `high`
- `is_test_file` — boolean flag

### hotspots

Modules that are both high-coupling AND recently changed:
- `node_id` — matching graph.json node id
- `in_degree` — from graph.json
- `recent_commits` — from `git log --oneline -30`
- `reason` — why this is flagged

### impact_map

Pre-computed transitive closure for high-degree nodes:
- Key = node id
- `direct` — nodes directly connected by edges
- `transitive` — nodes reachable through multiple hops

## Computed fields (in `/code-graph query` output)

Not stored in JSON but computed during report generation:

- **God nodes** — top N nodes by degree (from graphify)
- **Communities** — Louvain clusters with cohesion scores (from graphify)
- **Surprising connections** — unexpected edges (from graphify)
- **Knowledge gaps** — isolated nodes, thin clusters (from graphify)
- **Edge confidence** — percentage breakdown of EXTRACTED/INFERRED/AMBIGUOUS (from graphify)
- **Shallow modules** — nodes with `depth=shallow` (from annotations)
- **Orphans** — nodes with zero in-degree (from graph.json links)
