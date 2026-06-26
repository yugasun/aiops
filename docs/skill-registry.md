# Skill Registry

Single reference for which skills exist in the aiops bundle, which are deferred, and which must not be cited.

## Install

| Channel | Command |
| --- | --- |
| **Skills CLI** (all tier1, global) | `npx skills@latest add yugasun/aiops -g -y --skill '*'` |
| **Skills CLI** (list only) | `npx skills@latest add yugasun/aiops --list` |
| **Claude Code Plugin** | `/plugin marketplace add yugasun/aiops` then `/plugin install aiops@aiops` |

Skills CLI installs invoke `/aiops`, `/tdd`, etc. Claude Plugin installs use the `aiops:` namespace (e.g. `/aiops:aiops`).

## Tier 1 (installed)

From [`skills/manifest.json`](../../skills/manifest.json) — invoke as `/skill-name`:

| Skill | Role |
| --- | --- |
| `/aiops` | Entry router |
| `/aiops-implement` | Delivery overlay |
| `/aiops-setup` | Per-project tracker + domain config |
| `/lean` | Minimal-code ladder (delivery only) |
| `/prune` | Over-engineering gate before review |
| `/grill-with-docs` | Alignment with CONTEXT + ADRs |
| `/grilling` | Interview loop |
| `/domain-modeling` | Glossary + ADR discipline |
| `/tdd` | Test-driven development |
| `/diagnosing-bugs` | Bug diagnosis |
| `/triage` | Incoming request state machine |
| `/to-prd` | Conversation → PRD |
| `/to-issues` | PRD → vertical slices |
| `/handoff` | Cross-session context |
| `/prototype` | Throwaway prototypes |
| `/review` | Standards + spec review |
| `/git-ops` | Git operations: sync, commit, push |

## Tier 2 deferred (not installed)

Listed in `manifest.json` → `tier2Deferred`. Do **not** invoke these from bundle skills — use Tier 1 handoffs instead.

| Name | Handoff |
| --- | --- |
| `improve-codebase-architecture` | `/aiops` → Architecture health, or `/grill-with-docs` for one item |
| `codebase-design` | `/domain-modeling` + `/grill-with-docs` until forked |
| `writing-great-skills` | CONTEXT.md authoring principles + new-skill checklist in `/aiops` |
| `teach` | Not part of the engineering bundle |

## Agents

Agents wrap skills with specialized identity and constraints. See [agent-registry.md](agent-registry.md) for full documentation.

| Agent | Skills |
| --- | --- |
| `architect` | grilling, grill-with-docs, domain-modeling |
| `planner` | to-prd, to-issues, handoff, aiops-setup |
| `builder` | aiops-implement, tdd, lean |
| `code-reviewer` | review |
| `git-ops` | git-ops |

## External (environment)

| Tool | Notes |
| --- | --- |
| Cursor `create-skill` | Author new skills; not part of this bundle |

## Deprecated (do not reference)

| Name | Replacement |
| --- | --- |
| `/ask-matt` | `/aiops` |
| `/setup-matt-pocock-skills` | `/aiops-setup` |
| `/grill-me` | `/grilling` |
| `/implement` | `/aiops-implement` |
| `/ponytail` | `/lean` |

`scripts/verify.sh` enforces this list in `skills/**/*.md`.
