# Getting started

Install and use the bundle in a **target project** (your app repo, not the aiops meta-repo).

## Prerequisites

- Node.js 18+
- Cursor, Claude Code, Codex, Copilot, or Windsurf
- A codebase for agent-assisted development

## 1. Install

```bash
npx -y github:yugasun/aiops
```

Options: `--ide cursor`, `-g` (global), `--list`, `--skills-only`, `--agents-only`.

Or:

```bash
curl -fsSL https://raw.githubusercontent.com/yugasun/aiops/main/install.sh | bash
```

Skills CLI: `npx skills@latest add yugasun/aiops -g -y --skill '*'`

Claude Plugin: `/plugin marketplace add yugasun/aiops` then `/plugin install aiops@aiops` (commands use `aiops:` prefix).

Restart your IDE after install.

## 2. Start in your project

Usually **no separate setup step**:

```
/aiops Add a health check endpoint
```

First run bootstraps silently (local markdown issues by default). Add `aiops.yaml` at repo root for GitHub/GitLab teams.

Resume:

```
/aiops continue
```

Explicit setup: `/aiops-setup`

## 3. Example — health endpoint

Single-session feature: align → design → design review → implement (lean → tdd → prune → review) → commit only when you ask.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| `/aiops` not found | Re-run installer; restart IDE |
| Stale skill behavior | Re-install to refresh `skills/aiops/` |
| Wrong skill cited | [skill-registry.md](skill-registry.md) |

## Next steps

- [README.en.md](../README.en.md)
- [agent-registry.md](agent-registry.md)
- [skill-registry.md](skill-registry.md)
