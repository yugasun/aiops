# Getting started

Install aiops in a **target project** (your app repo, not this aiops meta-repo), then start by describing the work you want done.

## Prerequisites

- Node.js 18+
- Cursor, Claude Code, Codex, Copilot, or OpenCode
- A codebase for agent-assisted development

## 1. Install

```bash
npx -y github:yugasun/aiops
```

Default is interactive (`↑↓` / `space` / `ctrl+a` for IDEs, then scope and hooks). For CI: `npx -y github:yugasun/aiops --yes`.

Skills always install under your home directory (never into the project tree). Project scope only places agents / hooks / rules in the repo.

Options: `--yes` / `--all`, `--ide cursor`, `-g` (global), `--list`, `--skills-only`, `--commands-only`, `--no-hooks`, `--agents-only`, `--agents-md` (optional append to `AGENTS.md`, never overwrites), `uninstall`.

Or:

```bash
curl -fsSL https://raw.githubusercontent.com/yugasun/aiops/main/install.sh | bash
```

Skills CLI: `npx skills@latest add yugasun/aiops -g -y --skill '*'`

Claude Plugin: `/plugin marketplace add yugasun/aiops` then `/plugin install aiops@aiops` (commands use `aiops:` prefix).

Restart your IDE after install.

## 2. Start in your project

Usually there is **no separate setup step**. Open your project in the AI IDE and type:

```
/aiops Add a health check endpoint
```

aiops tracks work locally by default. Add `aiops.yaml` at repo root only when your team wants GitHub/GitLab issue tracking.

Resume:

```
/aiops continue
```

Explicit setup is available as `/aiops-setup`, but most projects do not need it.

## 3. Example — health endpoint

A small feature usually stays in one session:

1. Clarify scope and acceptance criteria
2. Agree the API shape before coding
3. Write a failing test first
4. Implement the smallest working change
5. Prune excess code and review the diff
6. Commit only when you ask

Bug reports take a shorter path: reproduce, diagnose, add a regression test, make the minimal fix, then review.

## 4. Resume later

Every task writes progress to `.scratch/<slug>/flow.state.yaml`. When you run `/aiops continue`, aiops restores the saved step and checks required gate artifacts before moving forward.

You normally do not edit the state file by hand.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| `/aiops` not found | Re-run installer; restart IDE |
| Remove aiops completely | `npx -y github:yugasun/aiops uninstall` (add `--ide codex` to target one IDE) |
| Stale skill behavior | Re-install to refresh `skills/aiops/` |
| The flow chose the wrong path | Say so in chat; aiops can re-triage the task |
| Wrong skill cited | Check [skill-registry.md](skill-registry.md) |

## Next steps

- [README.md](../README.md)
- [agent-registry.md](agent-registry.md)
- [skill-registry.md](skill-registry.md)
