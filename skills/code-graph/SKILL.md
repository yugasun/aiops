---
name: code-graph
description: >
  Build and query a persistent code graph for the target project. Uses
  graphify (Tree-sitter + Louvain clustering) for deterministic structural
  extraction, then the model adds semantic annotations. Use when the user
  says build graph, code graph, dependency graph, impact analysis, or when
  other skills need structured code understanding before proceeding.
---

# Code Graph

Build, query, and incrementally update a persistent knowledge graph for the target project. The graph captures module boundaries, dependency edges, call relationships, community structure, and semantic annotations.

This is **infrastructure**, not a one-off report. Other skills consume the graph through the query interface; the Flow Conductor checks freshness on session start.

## Architecture: Two-tier extraction

The graph is built in two tiers:

| Tier | Tool | Output | Role |
|------|------|--------|------|
| **Tier 1 — Structural** | [graphify](https://github.com/safishamsi/graphify) | AST-parsed nodes, edges, communities, confidence scores | Deterministic: same input → same output |
| **Tier 2 — Semantic** | Model (LLM) | Purpose annotations, depth classification, impact analysis | Contextual: varies with project knowledge |

graphify handles what models are bad at (parsing 20+ languages, community detection, confidence scoring). The model handles what graphify can't (understanding *why* a module exists, classifying depth, reasoning about change impact).

## Prerequisites

graphify must be installed for deterministic code graph extraction. It's a Python tool that uses Tree-sitter to parse 20+ languages — no manual grep guessing.

**If the user doesn't have graphify installed**, offer these options in order of preference:

```bash
# Option 1: uv (recommended — isolated environment, no conflicts)
# First install uv if not present: curl -LsSf https://astral.sh/uv/install.sh | sh
uv tool install graphifyy

# Option 2: pipx (also isolated)
pipx install graphifyy

# Option 3: pip (simplest, may conflict with other packages)
pip install graphifyy
```

After install, verify: `graphify --version`. If the command isn't found after uv install, suggest `uv tool update-shell`.

The PyPI package name is `graphifyy` (double-y) — the CLI command is `graphify`.

**If the user declines to install**, tell them: "代码图谱功能跳过，其他 skill 正常使用。" and proceed without the graph. Do not block or error.

## Storage

Structural data lives where graphify writes it. Model-generated artifacts live in `.scratch/graph/`:

| Path | Format | Source | Purpose |
| --- | --- | --- | --- |
| `graphify-out/graph.json` | JSON | graphify | Structured graph — nodes, edges, communities, confidence |
| `graphify-out/` | Mixed | graphify | Studio visualization, SVG, wiki, text report |
| `.scratch/graph/annotations.json` | JSON | Model | Semantic annotations layered on graph.json |

This avoids duplication — if the user already ran graphify standalone, aiops reads `graphify-out/` directly. The model only writes `annotations.json`; everything else comes from graphify.

See [graph-schema.md](graph-schema.md) for the graph.json schema (graphify format).

## Operations

### `/code-graph build`

Full scan. Use when no graph exists or a full rebuild is requested.

**Step 1 — Verify prerequisites**

```bash
which graphify || uv tool install graphifyy
```

If not found, prompt the user:
> graphify is required for deterministic code graph extraction. Install with `uv tool install graphifyy`. If `graphify` isn't found after, run `uv tool update-shell`.

**Step 2 — Run graphify**

```bash
graphify .
```

Key flags:
- `--wiki` — generate wiki articles for communities and god nodes (recommended for aiops)
- `--mode deep` — aggressive extraction for thorough coverage
- `--exclude 'node_modules' --exclude 'dist' --exclude '.scratch'` — skip build output

graphify produces:
- `graphify-out/graph.json` — the structured graph
- `graphify-out/` — studio visualization, SVG, wiki articles, text report (god nodes, communities, surprising connections, knowledge gaps)

**Step 3 — Semantic annotation (model)**

Read `graphify-out/graph.json` and add model-generated annotations to `.scratch/graph/annotations.json`:

```json
{
  "build_time": "2026-06-29T10:00:00Z",
  "git_ref": "abc123",
  "annotations": {
    "node_id": {
      "purpose": "Authentication and session management",
      "depth": "deep",
      "tags": ["auth", "security"],
      "complexity": "high",
      "is_test_file": false
    }
  },
  "hotspots": [
    { "node_id": "src/core/engine", "reason": "high in-degree + recent changes" }
  ],
  "impact_map": {
    "src/auth/login.ts": ["src/api/routes.ts", "tests/auth.test.ts"]
  }
}
```

For each node, the model annotates:
- `purpose` — one-line semantic description
- `depth` — `deep` (small interface, rich impl) | `shallow` (interface ≈ impl) | `unknown`
- `tags` — domain tags from CONTEXT.md vocabulary
- `complexity` — `low` | `medium` | `high`
- `is_test_file` — whether this is a test file

For hotspots, cross-reference graphify's god nodes with `git log --oneline -30` to find modules that are both high-coupling and recently changed.

**Step 4 — Update .gitignore if needed**

If `graphify-out/` and `.scratch/graph/` are not in `.gitignore`, suggest adding them.

### `/code-graph query <subcommand>`

Query the existing graph without rebuilding. Requires `graphify-out/graph.json` to exist.

Query execution reads `graphify-out/graph.json` + `.scratch/graph/annotations.json` and produces structured text output. See [query-patterns.md](query-patterns.md) for output formats.

Maintainers: executable query implementation lives at `skills/aiops/scripts/code_graph_query.py`. Run it as `python3 <aiops-root>/skills/aiops/scripts/code_graph_query.py <subcommand>`.

| Subcommand | Output | Data source |
| --- | --- | --- |
| `modules` | List all nodes with purpose, depth, edge count | graph.json nodes + annotations |
| `deps <node>` | Outgoing edges from a node | graph.json links (filtered by source) |
| `rdeps <node>` | Incoming edges to a node (who depends on it) | graph.json links (filtered by target) |
| `impact <file>` | Affected nodes if file changes (transitive) | graph.json links + model reasoning |
| `hotspot` | High-coupling + recently changed nodes | graph.json + annotations + git log |
| `god-nodes` | Top N nodes by edge count | graph.json nodes |
| `shallow` | Nodes marked depth=shallow | annotations.json |
| `orphans` | Nodes with zero incoming edges | graph.json links |
| `communities` | Detected community clusters | graph.json community data |

Query output is emitted as structured text suitable for other skills to consume.

### `/code-graph update`

Incremental update based on graphify's SHA256 caching.

```bash
graphify --update .
```

graphify handles change detection internally:
1. SHA256 content hashing with file size/mtime optimization
2. Cache stored in `.graphify/cache/`
3. Only changed files are re-extracted
4. Community remapping aligns new IDs with old ones

After graphify updates, re-run Step 4 (semantic annotation) only for changed nodes. Compare `graphify-out/graph.json` topology_signature to detect what changed.

If more than 30% of nodes changed, fall back to full `build`.

## Constraints

- **graphify is the structural backbone** — all dependency extraction, community detection, and confidence scoring comes from graphify's Tree-sitter + Louvain pipeline. The model does NOT replace these with grep-based guessing.
- **Model adds semantic layer only** — purpose annotations, depth classification, impact analysis, and aiops-specific queries. Never override graphify's structural data.
- **Read from graphify-out/** — do not copy graph.json to `.scratch/`. Model-generated artifacts (annotations, report) go in `.scratch/graph/`.
- **Incremental by default** — prefer `update` over `build` when a graph already exists.
- **Non-blocking** — if graphify fails or is unavailable, downstream skills proceed without the graph. Emit a warning, not an error.
- **Respect .gitignore** — pass appropriate `--exclude` flags to graphify.
- **Confidence-aware** — when querying, distinguish EXTRACTED (1.0) from INFERRED (0.5) and AMBIGUOUS (0.2) edges. Downstream skills should weight their analysis accordingly.

## Integration with Flow Conductor

The Flow Conductor checks for `graphify-out/graph.json` freshness at session start (via the `aiops-graph.js` hook). If stale or missing, it suggests running `/code-graph build` but does not block.

Architecture health task type (`task_kind: architecture_health`) should run `/code-graph build` before `/improve-codebase-architecture` to give the multi-modal sweep a deterministic foundation.
