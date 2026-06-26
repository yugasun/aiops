---
name: aiops
description: Entry router for the aiops skills bundle. Picks task type, dispatches agents, enforces setup gate, routes to the next skill in the flow.
disable-model-invocation: true
---

# aiops

Single entry for the bundle. Routes tasks through specialized **agents**.

## Invocation

```
/aiops <task description>              # Router auto-dispatches agents
/aiops <agent-name> <task description> # Direct agent invocation
```

Direct agent names: `architect`, `planner`, `prototyper`, `builder`, `ui-designer`, `code-reviewer`, `quality-auditor`, `gitops`

## How to route

1. **Parse invocation**: If `<agent-name>` is specified, dispatch directly to that agent (load `agents/<name>.md`). Otherwise continue.
2. Identify **Task type** (Feature, Bug, Incoming, Architecture health, New personal skill).
3. If `docs/agents/` is missing in the target project → run `/aiops-setup` first.
4. Dispatch agents per the task type sequence below.
5. **Delivery hard gates** (lean → tdd → prune → review → user-approved commit) live entirely inside `/aiops-implement` — do not interleave them from this router.

## Agent dispatch sequences

| Task type | Agent sequence |
|-----------|---------------|
| **Feature** | architect → planner → builder → code-reviewer → quality-auditor → gitops |
| **Feature + UI** | architect → ui-designer → planner → builder → code-reviewer → quality-auditor → gitops |
| **Bug** | builder → code-reviewer → gitops |
| **Incoming** | router triage → builder → code-reviewer → gitops |
| **Prototype** | prototyper |
| **Architecture health** | architect → builder → code-reviewer → gitops |

## Agent dispatch protocol

1. **Load agent**: Read `agents/<name>.md` for Identity + Constraints
2. **Gather inputs**: Read upstream artifacts from `.scratch/<feature>/` per agent's Inputs section
3. **Execute**: Run agent with its available skills, following Constraints
4. **Write outputs**: Agent writes artifacts per its Outputs section
5. **Transition**: Load next agent in sequence, repeat from step 2

## Feature slug

Router generates a kebab-case slug from the task description (e.g. "做一个用户登录功能" → `login`). User can override. All `.scratch/` artifacts are stored under `.scratch/<slug>/`.

## Conditional gates

- **Grill**: Feature, Architecture health, New personal skill; Incoming only if still unclear after triage
- **Prototype verdict**: if Prototyper ran (Tier 2), require `VERDICT.md` before Planner or Builder

Lean is **not** active during grill/alignment.

## Multi-session heuristic

Recommend **multi-session** when: 3+ modules, multiple slices, near smart zone, or AFK per-issue. Recommend **single-session** when: one module, one tracer bullet, under ~30 minutes. **User confirms** before Planner runs `/to-prd`.

## New personal skill checklist

1. Purpose and trigger scenarios
2. User-invoked vs model-invoked
3. Steps vs reference files (progressive disclosure)
4. Author `SKILL.md` — use Cursor **create-skill** (External; see `docs/skill-registry.md`)

## Canonical routes

Maintainer-tested routing logic lives in this repository at `scripts/lib/router.py` (`plan_flow`). After install, use the task-type table above — you do not need that file in target projects.

Task type vocabulary: see your target project's `CONTEXT.md` if present. Skill registry: `docs/skill-registry.md` in the target project after `/aiops-setup`.
