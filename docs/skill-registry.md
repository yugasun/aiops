# Skill Registry

Reference for the capabilities behind the guided `/aiops` workflow.

Most users should start with `/aiops` and let the router choose the path. Use this page when you want to inspect the underlying skills, invoke one directly, or understand which capabilities are intentionally deferred.

## Install

| Channel | Command |
| --- | --- |
| **Skills CLI** (all tier1, global) | `npx skills@latest add yugasun/aiops -g -y --skill '*'` |
| **Skills CLI** (list only) | `npx skills@latest add yugasun/aiops --list` |
| **Claude Code Plugin** | `/plugin marketplace add yugasun/aiops` then `/plugin install aiops@aiops` |

Skills CLI installs invoke `/aiops`, `/tdd`, etc. Claude Plugin installs use the `aiops:` namespace (e.g. `/aiops:aiops`).

## Tier 1 (installed)

From [`skills/manifest.json`](../../skills/manifest.json). These can be invoked directly as `/skill-name`, but the normal path is still `/aiops <task>`:

| Skill | Role |
| --- | --- |
| `/aiops` | Main entry: infer task type, show the current step, and keep progress resumable |
| `/aiops-implement` | Delivery path: lean, TDD, prune, review, then approval |
| `/aiops-setup` | Optional team setup for trackers, labels, and domain docs |
| `/explore` | Think through an idea without creating delivery artifacts |
| `/lean` | Keep the change small and avoid unrequested code |
| `/file-refactor` | Split oversized files before they become hard to review |
| `/prune` | Remove over-engineering before final review |
| `/grill-with-docs` | Align decisions with CONTEXT.md and ADRs |
| `/grilling` | Ask the missing questions until scope is clear |
| `/domain-modeling` | Build shared vocabulary and decision records |
| `/tdd` | Write the test first, then implement |
| `/diagnosing-bugs` | Reproduce, find root cause, and keep the fix minimal |
| `/triage` | Classify incoming work and route it to the right path |
| `/to-prd` | Turn conversation into a PRD |
| `/to-issues` | Split a PRD into vertical implementation slices |
| `/handoff` | Preserve context for another session |
| `/prototype` | Validate a risky idea with disposable code |
| `/review` | Three modes: code (diff vs standards/spec), design (NOTES + tech-spec gate), drift (implementation vs spec before ship) |
| `/gitops` | Commit and push after explicit approval |
| `/ui-mockup` | Generate previewable HTML/CSS mockups for UI work |
| `/improve-codebase-architecture` | Find evidence-backed architecture improvement opportunities |
| `/architect-design` | Turn aligned requirements into a technical design |
| `/code-graph` | Optional graphify-backed code graph for architecture and impact analysis |

## Tier 2 deferred (not installed)

Listed in `manifest.json` → `tier2Deferred`. Do **not** invoke these from bundle skills — use Tier 1 handoffs instead.

| Name | Handoff |
| --- | --- |
| `codebase-design` | [design-vocabulary.md](../skills/architect-design/design-vocabulary.md) in tier1; full skill deferred until forked |
| `writing-great-skills` | CONTEXT.md authoring principles + new-skill checklist in `/aiops` |
| `teach` | Not part of the engineering bundle |

## Agents

Agents group these skills into phase owners. See [agent-registry.md](agent-registry.md) for how a task moves between them.

| Agent | Skills |
| --- | --- |
| `architect` | explore, grilling, grill-with-docs, domain-modeling, architect-design, improve-codebase-architecture, code-graph |
| `design-reviewer` | review |
| `planner` | to-prd, to-issues, handoff, aiops-setup |
| `prototyper` | prototype, lean |
| `builder` | aiops-implement, tdd, lean, code-graph |
| `ui-designer` | ui-mockup |
| `code-reviewer` | review |
| `quality-auditor` | prune |
| `gitops` | gitops |

## External (environment)

| Tool | Notes |
| --- | --- |
| Cursor `create-skill` | Author new skills; not part of this bundle |
