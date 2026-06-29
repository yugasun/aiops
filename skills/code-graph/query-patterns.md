# Query Patterns

How to query the code graph and what each subcommand returns. Queries read from `graphify-out/graph.json` (graphify structural data) + `.scratch/graph/annotations.json` (model semantic layer). Queries never modify the graph.

## `modules` — List all nodes

**When to use**: First step of any skill that needs a project overview.

**Output format**:

```
## Modules (42 nodes · 5 communities)

| Module | Community | Depth | Purpose | In | Out | Confidence |
|--------|-----------|-------|---------|----|----|------------|
| src/auth/login.ts | Authentication | deep | User login handler | 5 | 3 | 100% EXTRACTED |
| src/api/routes.ts | API Layer | shallow | HTTP route defs | 2 | 8 | 100% EXTRACTED |
| lib/parser.ts | Config | deep | Config parser | 5 | 1 | 80% EXTRACTED, 20% INFERRED |
```

Sorted by in-degree descending (most depended-upon first). Depth and Purpose come from annotations.json; In/Out come from graph.json links.

## `deps <node>` — Outgoing dependencies

**When to use**: Understanding what a module depends on before modifying it.

**Output format**:

```
## Dependencies of src/api/routes.ts

| Dependency | Relation | Confidence |
|------------|----------|------------|
| src/auth/login.ts | IMPORTS | 1.0 EXTRACTED |
| src/auth/middleware.ts | IMPORTS | 1.0 EXTRACTED |
| src/utils/format.ts | IMPORTS | 0.5 INFERRED |
```

Data source: graph.json links filtered by `source === node_id`, plus annotations for each target.

## `rdeps <node>` — Incoming dependencies (reverse)

**When to use**: Understanding the impact radius of a module — who will break if I change this.

**Output format**:

```
## Dependents of src/auth/login.ts

| Dependent | Relation | Confidence |
|-----------|----------|------------|
| src/api/routes.ts | IMPORTS | 1.0 EXTRACTED |
| src/api/webhooks.ts | CALLS | 1.0 EXTRACTED |
| tests/auth.test.ts | IMPORTS | 1.0 EXTRACTED |
```

Data source: graph.json links filtered by `target === node_id`.

## `impact <file>` — Change impact analysis

**When to use**: Before modifying a file — what else needs updating.

Uses annotations.json impact_map for pre-computed data. Falls back to transitive closure on graph.json links if not pre-computed.

**Output format**:

```
## Impact of changing src/auth/login.ts

### Direct impact (confidence: EXTRACTED)
- src/api/routes.ts — IMPORTS login()
- tests/auth.test.ts — IMPORTS login()

### Transitive impact
- src/api/middleware.ts — uses routes that call login
- src/pages/dashboard.ts — loads after auth middleware

### Community context
- Part of "Authentication" community (cohesion: 0.67)
- 3 other community members may be affected

### Risk assessment
- 2 modules directly affected (EXTRACTED confidence)
- 2 modules transitively affected (INFERRED)
- Test coverage: 1/4 affected modules have tests
```

## `hotspot` — High-coupling + recently changed

**When to use**: Identifying architectural friction — nodes that are both complex and actively changing.

**Output format**:

```
## Hotspots

| Module | In-degree | Community | Recent changes | Risk |
|--------|-----------|-----------|----------------|------|
| src/core/engine.ts | 18 | Core | 12 commits (30d) | 🔴 High |
| src/api/routes.ts | 2 | API Layer | 8 commits (30d) | 🟡 Medium |
```

Data source: annotations.json hotspots + graph.json in_degree + `git log --oneline -30`.

## `god-nodes` — Top nodes by degree

**When to use**: Understanding the architecture's critical path — which nodes everything depends on.

**Output format**:

```
## God Nodes (top 10)

1. **src/types/** — degree: 24 — Type definitions (community: Shared)
2. **lib/logger.ts** — degree: 18 — Logging utility (community: Infrastructure)
3. **src/config/** — degree: 15 — Configuration (community: Config)
```

Data source: graph.json nodes sorted by degree (from graphify's text report).

## `shallow` — Shallow nodes

**When to use**: Finding deepening candidates for `/improve-codebase-architecture`.

**Output format**:

```
## Shallow Nodes

| Module | Depth | Purpose | Community | Suggestion |
|--------|-------|---------|-----------|------------|
| src/utils/helpers.ts | shallow | Grab-bag utils | Utils | Split by domain |
| src/api/routes.ts | shallow | Route defs + handlers | API Layer | Extract handler logic |
```

Data source: annotations.json entries where `depth === "shallow"`.

## `orphans` — Zero in-degree nodes

**When to use**: Finding potential dead code or standalone utilities.

**Output format**:

```
## Orphan Nodes (nothing depends on them)

- scripts/migrate.ts — may be a CLI script (expected)
- src/legacy/old-api.ts — potential dead code
- docs/examples/ — documentation (expected)
```

Data source: graph.json nodes with zero incoming links.

## `communities` — Detected community clusters

**When to use**: Understanding the codebase's natural module groupings.

**Output format**:

```
## Communities (Louvain clustering)

### Authentication (cohesion: 0.67)
- src/auth/login.ts
- src/auth/middleware.ts
- src/auth/session.ts
- src/models/user.ts

### API Layer (cohesion: 0.42)
- src/api/routes.ts
- src/api/handlers/
- src/api/middleware.ts

### Infrastructure (cohesion: 0.31)
- lib/logger.ts
- lib/config.ts
- lib/cache.ts
```

Data source: graph.json community assignments + graphify community_labels + cohesion scores.
