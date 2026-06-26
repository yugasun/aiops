# aiops

Personal agent skills bundle for AI-assisted software development — grill, plan, implement, and ship with hard quality gates.

Install once globally, use in any codebase. Entry skill: `/aiops`.

## What you get

| Layer | Skills |
| --- | --- |
| **Router** | `/aiops` — pick task type and flow |
| **Setup** | `/aiops-setup` — issue tracker, triage labels, domain docs (per project) |
| **Alignment** | `/grill-with-docs`, `/grilling`, `/domain-modeling` |
| **Planning** | `/to-prd`, `/to-issues`, `/handoff`, `/prototype` |
| **Delivery** | `/aiops-implement` → `/lean` → `/tdd` → `/prune` → `/review` |
| **Other paths** | `/diagnosing-bugs`, `/triage` |

18 Tier 1 skills. Full list: [`skills/manifest.json`](skills/manifest.json) and [`docs/skill-registry.md`](docs/skill-registry.md).

## Agents

8 specialized agents that wrap skills with identity, constraints, and artifact contracts:

| Agent | Role | Key Output |
| --- | --- | --- |
| `architect` | Design decisions + tech-spec | NOTES.md, tech-spec.md |
| `planner` | Task breakdown + plan | PRD.md, plan.md, issues/ |
| `prototyper` | Rapid validation | VERDICT.md, prototype/ |
| `builder` | TDD implementation | source code + tests |
| `ui-designer` | HTML mockups | mockups/ |
| `code-reviewer` | Code review | REVIEW.md |
| `quality-auditor` | YAGNI check | prune findings |
| `gitops` | Git operations | commit + push |

Usage:
```
/aiops <task>                # Router auto-dispatches agents
/aiops architect <task>      # Direct agent invocation
```

See [agent-registry.md](docs/agent-registry.md) for dispatch sequences and artifact contracts.

## Quick start

### One-line install (recommended)

```bash
# Install skills + agents to all detected AI IDEs
npx -y github:yugasun/aiops

# Or via curl
curl -fsSL https://raw.githubusercontent.com/yugasun/aiops/main/install.sh | bash
```

### CLI options

```bash
# Install to a specific IDE
npx -y github:yugasun/aiops --ide cursor
npx -y github:yugasun/aiops --ide claude-code

# Only install agents (skip skills)
npx -y github:yugasun/aiops --agents-only

# Only install skills (skip agents)
npx -y github:yugasun/aiops --skills-only

# List detected IDEs without installing
npx -y github:yugasun/aiops --list

# Project-local install (to .claude/, .cursor/, etc.)
npx -y github:yugasun/aiops --local

# Uninstall agents
npx -y github:yugasun/aiops --uninstall
```

### Supported IDEs

| IDE | Install Path | Format |
| --- | --- | --- |
| Claude Code | `~/.claude/agents/` | Markdown + YAML |
| Cursor | `~/.cursor/agents/` | Markdown + YAML |
| GitHub Copilot | `~/.github/agents/` | Markdown + YAML |
| Codex CLI | `~/.codex/agents/` | TOML |

### Claude Code Plugin (alternate)

```
/plugin marketplace add yugasun/aiops
/plugin install aiops@aiops
```

Plugin skills use the `aiops:` namespace (e.g. `/aiops:aiops`).

Then in **any target project**:

1. Run `/aiops-setup` once (issue tracker, labels, `CONTEXT.md` layout).
2. Run `/aiops` for every new task.

Details: **[docs/getting-started.md](docs/getting-started.md)**.

## Project layout

```
aiops/
├── README.md
├── package.json              # CLI entry (npx -y github:yugasun/aiops)
├── install.sh                # curl | bash bootstrap
├── bin/
│   └── install.js            # Main installer (detects IDEs, installs all)
├── agents/                   # Agent definitions (source of truth)
│   └── <agent-name>.md
├── .claude-plugin/           # Claude Code marketplace + plugin manifest
├── skills/                   # Bundle source (Skills CLI discovers this)
│   ├── manifest.json
│   └── <skill-name>/SKILL.md
├── docs/
│   ├── getting-started.md
│   ├── agent-registry.md
│   ├── skill-registry.md
│   └── superpowers/specs/
└── scripts/
    ├── install-agents.sh     # Standalone agent installer (bash)
    ├── smoke-install.sh      # CI: npx skills install + router tests
    └── verify.sh             # bundle + plugin + skill-ref checks
```

**Source of truth:** `agents/` for agents, `skills/` for skills.

## Verify (maintainers)

```bash
bash scripts/verify.sh          # source checks (skills + agents)
bash scripts/smoke-install.sh   # full CI (needs Node.js)
```

## Docs

- [Getting started](docs/getting-started.md) — install, setup, example dev flow
- [Agent registry](docs/agent-registry.md) — agents, dispatch sequences, artifact contracts
- [Skill registry](docs/skill-registry.md) — install paths + allowed references
- [CONTEXT.md](CONTEXT.md) — vocabulary for the bundle
- [Design spec](docs/superpowers/specs/2026-06-26-agents-team-design.md) — agents team architecture
- [ADR index](docs/adr/) — design history

## License

Apache 2.0 — see [LICENSE](LICENSE). Contributing: [CONTRIBUTING.md](CONTRIBUTING.md).
