# aiops

[中文文档](README.zh-CN.md)

Personal agent skills bundle for AI-assisted software development — grill, plan, implement, and ship with hard quality gates. Install once, use in any codebase across **6 AI IDEs**.

Entry skill: `/aiops`.

## Key features

- **19 skills** covering the full dev lifecycle: alignment → planning → delivery → review → ship
- **8 specialized agents** with artifact contracts and dispatch sequences
- **Always-on lean discipline** — YAGNI ladder auto-injected into every coding turn (Cursor `.mdc`, Copilot instructions, Windsurf `.mdc`)
- **Multi-IDE portability** — one source of truth (`SKILL.md`), adapter seam compiles to each IDE's native format
- **Lifecycle hooks** — SessionStart/SubagentStart injection for Claude Code and Codex
- **AGENTS.md generation** — project-level agent protocol file for any compatible harness

## Quick start

```bash
# Install to all detected AI IDEs (project-local, default)
npx -y github:yugasun/aiops

# Or via curl
curl -fsSL https://raw.githubusercontent.com/yugasun/aiops/main/install.sh | bash
```

### CLI options

```bash
# Target a specific IDE
npx -y github:yugasun/aiops --ide cursor
npx -y github:yugasun/aiops --ide claude
npx -y github:yugasun/aiops --ide codex
npx -y github:yugasun/aiops --ide copilot
npx -y github:yugasun/aiops --ide windsurf

# Global install (to ~/)
npx -y github:yugasun/aiops -g

# Selective install
npx -y github:yugasun/aiops --skills-only
npx -y github:yugasun/aiops --agents-only

# List detected IDEs without installing
npx -y github:yugasun/aiops --list

# Uninstall
npx -y github:yugasun/aiops --uninstall
```

### Claude Code Plugin (alternate)

```
/plugin marketplace add yugasun/aiops
/plugin install aiops@aiops
```

## Supported IDEs

| IDE | Skills Path | Always-On | Agents | Hooks |
| --- | --- | --- | --- | --- |
| **Claude Code** | `.claude/skills/` | via `/lean` trigger | `.claude/agents/*.md` | SessionStart + SubagentStart |
| **Cursor** | `.cursor/skills/` | `.cursor/rules/lean.mdc` | `.cursor/agents/*.md` | — |
| **Codex CLI** | `.agents/skills/` | via `AGENTS.md` | `.codex/agents/*.toml` | — |
| **Windsurf** | `.windsurf/skills/` | `.windsurf/rules/lean.mdc` | `.windsurf/agents/*.md` | — |
| **GitHub Copilot** | `.github/skills/` | `.github/copilot-instructions.md` | `.github/agents/*.md` | — |
| **Generic harness** | — | `AGENTS.md` (project root) | — | — |

## What you get

### Skills (19 Tier 1)

| Layer | Skills |
| --- | --- |
| **Router** | `/aiops` — pick task type and flow |
| **Setup** | `/aiops-setup` — issue tracker, triage labels, domain docs |
| **Alignment** | `/grill-with-docs`, `/grilling`, `/domain-modeling` |
| **Planning** | `/to-prd`, `/to-issues`, `/handoff`, `/prototype` |
| **Delivery** | `/aiops-implement` → `/lean` → `/tdd` → `/prune` → `/review` |
| **Architecture** | `/improve-codebase-architecture` — scan for deepening opportunities |
| **Other paths** | `/diagnosing-bugs`, `/triage`, `/ui-mockup`, `/gitops` |

Full list: [`skills/manifest.json`](skills/manifest.json)

### Agents (8)

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

### Lean discipline (always-on)

The YAGNI ladder is auto-injected into every coding turn for supported IDEs:

```
1. Does this need to exist? (YAGNI)
2. Stdlib does it?
3. Native platform feature?
4. Already-installed dependency?
5. One line?
6. Minimum code that works
```

Delivery sequence: **lean → TDD → prune → review → commit** (only on user approval).

## Architecture

```
                    ┌─── build scripts ──→ .cursor/rules/lean.mdc
                    │                      .github/copilot-instructions.md
                    │                      .windsurf/rules/lean.mdc
                    │                      AGENTS.md
                    │
skills/lean/SKILL.md ─── install time ──→ Cursor: .cursor/rules/lean.mdc (always-on)
                    │                     Copilot: .github/copilot-instructions.md
                    │                     Windsurf: .windsurf/rules/lean.mdc
                    │                     Claude/Codex: skills dir (copy)
                    │
                    └─── hooks ──────────→ SessionStart: lean ladder in context
                                           SubagentStart: compact lean reminder
```

**Adapter seam** (`scripts/adapters/`) converts `SKILL.md` to IDE-native formats at install time. Adding a new IDE = writing one adapter file.

**Build scripts** (`scripts/build/`) pre-generate artifacts for repo-committed output:

```bash
node scripts/build/build-all.js    # Generate all IDE-native artifacts
```

## In a target project

1. Run `/aiops-setup` once (issue tracker, labels, `CONTEXT.md` layout).
2. Run `/aiops` for every new task.

Details: **[docs/getting-started.md](docs/getting-started.md)**.

## Verify (maintainers)

```bash
bash scripts/verify.sh          # source checks (skills + agents)
node scripts/build/build-all.js # generate IDE-native artifacts
```

## Docs

- [Getting started](docs/getting-started.md) — install, setup, example dev flow
- [Agent registry](docs/agent-registry.md) — agents, dispatch sequences, artifact contracts
- [Skill registry](docs/skill-registry.md) — install paths + allowed references

## License

Apache 2.0 — see [LICENSE](LICENSE). Contributing: [CONTRIBUTING.md](CONTRIBUTING.md).
