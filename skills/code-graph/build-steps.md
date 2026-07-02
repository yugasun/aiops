# Build and Update Steps

## `/code-graph build`

Full scan. Use when no graph exists or a full rebuild is requested.

### Step 1 — Verify prerequisites

See [prerequisites.md](prerequisites.md). Quick check:

```bash
which graphify || uv tool install graphifyy
```

### Step 2 — Run graphify

```bash
graphify .
```

Key flags:
- `--wiki` — generate wiki articles for communities and god nodes (recommended for aiops)
- `--mode deep` — aggressive extraction for thorough coverage
- `--exclude 'node_modules' --exclude 'dist' --exclude '.scratch'` — skip build output

graphify produces:
- `graphify-out/graph.json` — the structured graph
- `graphify-out/` — studio visualization, SVG, wiki articles, text report

### Step 3 — Semantic annotation (model)

Read `graphify-out/graph.json` and add model-generated annotations to `.scratch/graph/annotations.json`. Schema: [graph-schema.md](graph-schema.md#annotationsschema).

For each node, annotate: `purpose`, `depth` (`deep` | `shallow` | `unknown`), `tags`, `complexity`, `is_test_file`.

For hotspots, cross-reference graphify's god nodes with `git log --oneline -30`.

### Step 4 — Update .gitignore if needed

If `graphify-out/` and `.scratch/graph/` are not in `.gitignore`, suggest adding them.

## `/code-graph query <subcommand>`

Requires `graphify-out/graph.json`. Output formats: [query-patterns.md](query-patterns.md).

Maintainers: `python3 <aiops-root>/skills/aiops/scripts/code_graph_query.py <subcommand>`

| Subcommand | Purpose |
| --- | --- |
| `modules` | All nodes with purpose, depth, edge count |
| `deps <node>` | Outgoing edges |
| `rdeps <node>` | Incoming edges |
| `impact <file>` | Transitive blast radius |
| `hotspot` | High-coupling + recently changed |
| `god-nodes` | Top N by edge count |
| `shallow` | depth=shallow nodes |
| `orphans` | Zero incoming edges |
| `communities` | Louvain clusters |

## `/code-graph update`

```bash
graphify --update .
```

graphify SHA256-caches in `.graphify/cache/`. Re-run semantic annotation only for changed nodes. If >30% of nodes changed, fall back to full `build`.
