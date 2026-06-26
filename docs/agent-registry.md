# Agent Registry

Single reference for agents in the aiops bundle — their roles, skills, and artifact contracts.

## What is an Agent?

Agents are specialized identities that wrap skills. **Skills are verbs** (what to do), **agents are nouns** (who does it, with what perspective and constraints).

The Router (`/aiops`) dispatches agents based on task type. Users can also invoke agents directly:

```
/aiops <task description>              # auto-dispatch
/aiops architect <task description>    # direct invocation
```

## Tier 1 (installed)

From [`skills/manifest.json`](../skills/manifest.json) `agents` array:

| Agent | Role | Skills | Key Outputs |
|-------|------|--------|-------------|
| `architect` | alignment | grilling, grill-with-docs, domain-modeling | NOTES.md, tech-spec.md |
| `planner` | planning | to-prd, to-issues, handoff, aiops-setup | PRD.md, plan.md, issues/ |
| `builder` | delivery | aiops-implement, tdd, lean | source code + tests |
| `code-reviewer` | delivery-gate | review | REVIEW.md |
| `git-ops` | delivery | git-ops | commit + push |

## Tier 2 (deferred)

From `agentsTier2` in manifest — not installed by default:

| Agent | Role | Skills | Key Outputs |
|-------|------|--------|-------------|
| `quality-auditor` | delivery-gate | prune | prune findings |
| `prototyper` | prototype | prototype, lean | VERDICT.md, prototype/ |
| `ui-designer` | design | _(pending)_ | mockups/ |

## Agent definitions

Each agent is defined in `agents/<name>.md`:

| File | Agent |
|------|-------|
| `agents/architect.md` | Architect |
| `agents/planner.md` | Planner |
| `agents/builder.md` | Builder |
| `agents/code-reviewer.md` | Code Reviewer |
| `agents/git-ops.md` | Git Ops |

## Dispatch sequences

| Task type | Agent sequence |
|-----------|---------------|
| **Feature** | architect → planner → builder → code-reviewer → git-ops |
| **Bug** | builder → code-reviewer → git-ops |
| **Incoming** | router triage → builder → code-reviewer → git-ops |
| **Architecture health** | architect → builder → code-reviewer → git-ops |

## Artifact contracts

Agents communicate through `.scratch/<feature>/` files:

| Artifact | Producer | Consumers |
|----------|----------|-----------|
| `NOTES.md` | architect | planner, builder, code-reviewer |
| `tech-spec.md` | architect | planner, builder, code-reviewer |
| `PRD.md` | planner | builder |
| `plan.md` | planner | builder |
| `issues/*.md` | planner | builder |
| `REVIEW.md` | code-reviewer | builder, git-ops |
| `VERDICT.md` | prototyper | architect |
| `mockups/` | ui-designer | builder, code-reviewer |

Full artifact formats: see [design spec](superpowers/specs/2026-06-26-agents-team-design.md).
