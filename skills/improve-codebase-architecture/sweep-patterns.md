# Sweep Patterns

Prompt templates and output schemas for the 4 perspective agents used by the multi-modal sweep. Each agent runs independently and queries the code graph from a distinct angle.

## Agent 1: Structure agent

**Purpose**: Identify shallow modules and deepening candidates.

**Prompt template**:

```
You are the Structure agent in an architecture review.

Query /code-graph query modules and /code-graph query god-nodes for the project overview.

Then query:
1. /code-graph query shallow — list modules where interface ≈ implementation
2. /code-graph query god-nodes — list modules with highest in-degree
3. Cross-reference: shallow modules that are ALSO god-nodes are the highest-priority deepening candidates

For each candidate, apply the deletion test:
- Would deleting this module concentrate complexity (good — it was a pass-through)?
- Or would it scatter complexity across N callers (bad — it was earning its keep)?

Output a JSON array of findings:
[
  {
    "module": "src/utils/helpers.ts",
    "issue": "shallow",
    "evidence": "12 exports, 14 total symbols — ratio 0.86",
    "deletion_test": "scatters — 8 callers depend on it",
    "impact": "high",
    "confidence": "high"
  }
]
```

**Output schema**:
```json
{
  "findings": [
    {
      "module": "string — module id",
      "issue": "shallow | pass-through | god-node-with-shallow-depth",
      "evidence": "string — what makes it shallow",
      "deletion_test": "concentrates | scatters",
      "impact": "high | medium | low",
      "confidence": "high | medium | low"
    }
  ]
}
```

## Agent 2: Data-flow agent

**Purpose**: Trace cross-module data flow and identify seam leakage.

**Prompt template**:

```
You are the Data-flow agent in an architecture review.

Query /code-graph query modules and /code-graph query god-nodes for the project overview.

Query /code-graph query modules to get the full module list.
For the top 10 modules by edge count, query their deps and rdeps.

Identify:
1. Modules where data crosses a seam unnecessarily — e.g. Module A passes raw data through Module B just to reach Module C
2. Modules that transform data they shouldn't own — e.g. an auth module doing JSON serialization
3. Circular dependencies — Module A depends on B which depends on A
4. Configuration leakage — modules reading config from unrelated modules

For each finding, trace the data path through the graph.

Output a JSON array:
[
  {
    "type": "leakage",
    "path": ["src/api/", "src/utils/format.ts", "src/auth/"],
    "description": "Auth token passes through format.ts unnecessarily",
    "modules_affected": ["src/auth/", "src/api/"],
    "confidence": "high"
  }
]
```

**Output schema**:
```json
{
  "findings": [
    {
      "type": "leakage | circular | config-leakage | unnecessary-passthrough",
      "path": ["string — ordered module ids forming the data path"],
      "description": "string — what's wrong",
      "modules_affected": ["string — module ids"],
      "confidence": "high | medium | low"
    }
  ]
}
```

## Agent 3: Change agent

**Purpose**: Identify friction from change patterns — hotspots and high-churn modules.

**Prompt template**:

```
You are the Change agent in an architecture review.

1. Query /code-graph query hotspot for high-coupling + recently changed modules
2. Run git log --oneline -30 to find the most-changed files in the last 30 commits
3. Cross-reference: modules appearing in BOTH the hotspot list AND the git log are high-confidence friction signals
4. For each hotspot, check if the churn is concentrated in a few files or spread across many

A module that changes often AND has high in-degree is an architectural smell:
- Either it has too many responsibilities (violation of depth)
- Or its dependents are too tightly coupled to its internals

Output a JSON array:
[
  {
    "module": "src/core/engine.ts",
    "in_degree": 18,
    "out_degree": 6,
    "recent_commits": 12,
    "churn_files": 3,
    "friction_signal": "high-coupling + high-churn",
    "confidence": "high"
  }
]
```

**Output schema**:
```json
{
  "findings": [
    {
      "module": "string — module id",
      "in_degree": 0,
      "out_degree": 0,
      "recent_commits": 0,
      "churn_files": 0,
      "friction_signal": "string — what pattern you see",
      "confidence": "high | medium | low"
    }
  ]
}
```

## Agent 4: Test agent

**Purpose**: Map test coverage gaps at the module level.

**Prompt template**:

```
You are the Test agent in an architecture review.

1. Query /code-graph query modules to get all modules
2. For each module, search for corresponding test files:
   - grep for test files matching the module name pattern
   - Check if test files import from the module
3. Identify untested critical modules — those with high in-degree but no test coverage
4. Identify untested seams — module boundaries where behavior could change without a test catching it

Rank by risk: high in-degree + no tests = highest risk.

Output a JSON array:
[
  {
    "module": "src/auth/",
    "in_degree": 12,
    "has_tests": false,
    "test_files": [],
    "risk": "high",
    "reason": "Core auth module with 12 dependents, zero test coverage"
  }
]
```

**Output schema**:
```json
{
  "findings": [
    {
      "module": "string — module id",
      "in_degree": 0,
      "has_tests": false,
      "test_files": ["string — test file paths"],
      "risk": "high | medium | low",
      "reason": "string — why this matters"
    }
  ]
}
```

## Cross-validation

After all 6 agents complete, a synthesis agent receives all findings and:

1. **De-duplicates**: Same module flagged by multiple agents = higher confidence
2. **Ranks by convergence**: 3+ agents agree → Strong. 2 agents → Worth exploring. 1 agent → Speculative
3. **Applies deletion test** to top candidates
4. **Produces the final candidate list** for the HTML report

The convergence count is recorded as the recommendation strength badge on each candidate card.

## Agent 5: Security agent

**Purpose**: Identify modules where untrusted data enters or secrets are mishandled.

**Prompt template**:

```
You are the Security agent in an architecture review.

1. Query /code-graph query modules to get all modules
2. Identify trust boundaries — where does external input enter the system?
   - HTTP handlers, CLI argument parsers, file readers, env var consumers
3. For each boundary, check if input validation happens AT the boundary or deeper
   - Validation pushed downstream = architectural smell (the seam owns too little)
4. Look for modules that mix auth/authz logic with business logic
5. Check for secret handling patterns: hardcoded strings, unguarded env reads

Output a JSON array:
[
  {
    "module": "src/api/handlers.ts",
    "issue": "validation-downstream",
    "evidence": "raw request body passed to service layer without sanitisation",
    "trust_boundary": true,
    "risk": "high",
    "confidence": "high"
  }
]
```

**Output schema**:
```json
{
  "findings": [
    {
      "module": "string — module id",
      "issue": "validation-downstream | mixed-auth-logic | secret-exposure | unguarded-input",
      "evidence": "string — what makes it risky",
      "trust_boundary": true,
      "risk": "high | medium | low",
      "confidence": "high | medium | low"
    }
  ]
}
```

## Agent 6: Performance agent

**Purpose**: Identify structural causes of performance risk — not profiler data, but architectural patterns that make performance hard to improve.

**Prompt template**:

```
You are the Performance agent in an architecture review.

1. Query /code-graph query god-nodes for modules with the highest in-degree
2. Identify synchronous-looking call chains that span 3+ modules (deep call stacks with no async boundary)
3. Look for modules that load broad state to serve narrow queries
   - A module that reads 10 fields to return 1 is a depth problem, not a query problem
4. Identify missing caching seams — hot paths (high in-degree modules) with no observable cache layer
5. Check for modules that make multiple external calls (DB, HTTP, filesystem) in a single interface

Output a JSON array:
[
  {
    "module": "src/data/loader.ts",
    "issue": "broad-state-narrow-query",
    "evidence": "loads full user record for email-only lookups — 12 callers",
    "upgrade_path": "add projection parameter to loader interface",
    "impact": "high",
    "confidence": "medium"
  }
]
```

**Output schema**:
```json
{
  "findings": [
    {
      "module": "string — module id",
      "issue": "broad-state-narrow-query | deep-sync-chain | missing-cache-seam | fan-out-calls",
      "evidence": "string — structural pattern observed",
      "upgrade_path": "string — architectural change that would fix it",
      "impact": "high | medium | low",
      "confidence": "high | medium | low"
    }
  ]
}
```
