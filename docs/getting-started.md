# Getting started

This guide installs the aiops bundle and walks through a **standard single-session feature** in a target project.

## Prerequisites

- Node.js 18+ (for `npx skills`)
- Cursor, Claude Code, Codex, or another [supported agent](https://github.com/vercel-labs/skills#supported-agents)
- A codebase where you want agent-assisted development

## 1. Install the bundle

### Skills CLI (recommended)

Install all 17 tier1 skills globally:

```bash
npx skills@latest add yugasun/aiops -g -y --skill '*'
```

Agent-specific examples:

```bash
# Cursor only
npx skills@latest add yugasun/aiops -g -a cursor -y --skill '*'

# Claude Code (Skills CLI path — flat /aiops invocation)
npx skills@latest add yugasun/aiops -g -a claude-code -y --skill '*'
```

Preview available skills:

```bash
npx skills@latest add yugasun/aiops --list
```

### Claude Code Plugin (alternate)

In Claude Code chat:

```
/plugin marketplace add yugasun/aiops
/plugin install aiops@aiops
```

Plugin-installed skills are namespaced: use `/aiops:aiops` as entry (not `/aiops`). Skills CLI installs keep `/aiops`.

Restart your agent after install.

## 2. Configure your target project (once)

Open your **application repo** (not the aiops repo). In agent chat:

```
/aiops-setup
```

Answer the prompts:

| Section | Typical choice |
| --- | --- |
| Issue tracker | Local markdown (`.scratch/<feature>/`) or GitHub/GitLab |
| Triage labels | Default 1:1 role mapping |
| Domain docs | Single `CONTEXT.md` + `docs/adr/` |

This writes `docs/agents/issue-tracker.md`, `triage-labels.md`, `domain.md`, and updates `AGENTS.md`.

## 3. Example scenario — add a health endpoint

**Context:** You maintain `my-api`, a small HTTP service. You want `GET /health` returning `{ "status": "ok", "version": "<semver>" }` without over-engineering.

### 3.1 Start the flow

In `my-api`:

```
/aiops
```

Tell the agent:

> Task type: **Feature**. Add a health endpoint that returns status and app version from env or package metadata.

The router dispatches agents in sequence: **Architect** (grill + design) → **Planner** (break into issues) → **Builder** (implement) → **Code Reviewer** (review) → **Gitops** (commit + push).

You can also invoke agents directly:

```
/aiops architect 设计一个缓存层
/aiops builder 实现 issue 001
/aiops gitops 提交代码
```

See [agent-registry.md](agent-registry.md) for all agents and dispatch sequences.

### 3.2 Confirm delivery mode

`/aiops` recommends **single-session** when the change is one module and ~30 minutes. Confirm when asked.

Route continues to **`/aiops-implement`**.

### 3.3 Delivery hard gates (inside `/aiops-implement`)

The agent should follow this order — you can invoke steps explicitly if needed:

| Step | Skill | What happens |
| --- | --- | --- |
| 1 | `/lean` ladder | Minimal code, stdlib/framework defaults first |
| 2 | `/tdd` | One vertical red-green slice through the public HTTP interface |
| 3 | `/prune` | Cut over-engineering from the diff |
| 4 | `/review` | Standards + spec check vs your grill decisions |
| 5 | Commit | **Only when you ask** |

You review the diff; approve commit when satisfied.

### 3.4 Expected outcome

- `GET /health` returns JSON with `status` and `version`
- One integration-style test through the real HTTP stack
- `CONTEXT.md` mentions **Health check** if it was a new domain term
- No extra frameworks “for later”

---

## Alternate paths (same bundle)

### Bug — login returns 500 after deploy

```
/aiops
```

> Task type: **Bug**. Login fails with 500 since yesterday's deploy.

Skips grill. Route: **`/diagnosing-bugs`** → **`/aiops-implement`** (same delivery gates).

### Larger feature — multi-session

```
/aiops
```

> Task type: **Feature**. Add role-based access across API, admin UI, and audit log.

After grill, confirm **multi-session**. Route: **`/to-prd`** → **`/to-issues`** → **fresh chat per issue** → **`/aiops-implement`** each time.

### Incoming backlog

```
/triage
```

Process issues; when one is `ready-for-agent`, start a new session with **`/aiops-implement`** and the issue brief.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| Agent doesn't know `/aiops` | Re-run `npx skills@latest add yugasun/aiops -g -y --skill '*'`; restart agent |
| Claude Plugin: command not found | Use `/aiops:aiops` or install via Skills CLI for `/aiops` |
| Skills mention missing `docs/agents/` | Run `/aiops-setup` in the target project |
| Wrong skill cited | See [`skill-registry.md`](agents/skill-registry.md) |
| Maintainer smoke fails | `bash scripts/smoke-install.sh` from aiops repo root (needs Node) |

## Next steps

- Read [CONTEXT.md](../CONTEXT.md) for bundle vocabulary
- Browse [skills/](../skills/) for individual skill behavior
- Read [agent-registry.md](agent-registry.md) for agent roles and dispatch
- Contribute: `bash scripts/verify.sh`
