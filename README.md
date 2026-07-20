# aiops

[中文文档](README.zh-CN.md)

aiops is a set of AI engineering best practices — lean-gated, resumable workflow delivered as skills and agents to **5 IDEs** (Cursor, Claude Code, Codex CLI, GitHub Copilot, OpenCode) plus a generic AGENTS.md harness. Type `/aiops` in your AI IDE and describe the work you want done; aiops guides the task from clarification to implementation, review, and final approval.

Entry: `**/aiops**` (guided workflow, resumable via `flow.state.yaml`).

## What it helps you do

- **Start from the task** — describe a feature, bug, or refactor in natural language
- **Follow a guided flow** — aiops asks for missing decisions, shows the current step, and saves progress
- **Keep AI changes small** — lean discipline, TDD, prune, and review run before delivery
- **Resume later** — continue from `.scratch/<feature>/flow.state.yaml` with `/aiops continue`
- **Stay in control** — commits only happen after you explicitly approve them
- **Go deeper when needed** — optional agents, skills, and code graph tooling support larger work

## Quick start

```bash
npx -y github:yugasun/aiops
```

In your project chat:

```
/aiops Add a health check endpoint
```

Resume later:

```
/aiops continue
```

## What happens next

For a small feature, aiops usually runs:

1. Clarify scope and acceptance criteria
2. Agree the design before coding
3. Write tests first
4. Implement the smallest working change
5. Prune excess code and review the diff
6. Wait for your approval before commit

Bug reports skip the alignment ceremony and go straight to diagnosis. Larger features can be turned into a PRD and vertical-slice issues before implementation.

### Code Graph (optional enhancement)

Architecture scans can use `/code-graph` for structured code understanding with [graphify](https://github.com/safishamsi/graphify): Tree-sitter AST parsing plus Louvain community detection. This is optional; the core aiops flow works without extra Python tooling.

Install it only when you want stronger architecture and impact analysis:

```bash
uv tool install graphifyy
graphify --version
```

If you do not use uv, `pip install graphifyy` or `pipx install graphifyy` also works. The PyPI package name is `graphifyy` (double-y) — the CLI command is `graphify`.

### CLI options

Default install is **interactive** (arrow keys + space to pick IDEs, `ctrl+a` for all, then project vs global and hooks). Use `--yes` in CI.

```bash
npx -y github:yugasun/aiops                        # interactive install
npx -y github:yugasun/aiops --yes                  # non-interactive: all detected IDEs, project agents/hooks, skills in ~/
npx -y github:yugasun/aiops --all                  # same as --yes
npx -y github:yugasun/aiops --ide claude           # Claude Code only (still prompts scope/hooks unless --yes)
npx -y github:yugasun/aiops --ide cursor           # Cursor only
npx -y github:yugasun/aiops --ide codex            # Codex CLI only
npx -y github:yugasun/aiops --ide copilot          # GitHub Copilot only
npx -y github:yugasun/aiops --ide opencode         # OpenCode only
npx -y github:yugasun/aiops -g                     # global agents/hooks/skills under ~/
npx -y github:yugasun/aiops --skills-only          # slash-command skills only (no hooks/agents/always-on lean)
npx -y github:yugasun/aiops --commands-only        # alias for --skills-only
npx -y github:yugasun/aiops --agents-only          # only install agents
npx -y github:yugasun/aiops --agents-md            # append aiops block to AGENTS.md (never overwrites)
npx -y github:yugasun/aiops --no-hooks             # skills + agents, skip SessionStart hooks
npx -y github:yugasun/aiops --list                 # show detected IDEs and install targets
npx -y github:yugasun/aiops uninstall              # remove installed files
npx -y github:yugasun/aiops uninstall --ide codex  # uninstall from Codex only
npx -y github:yugasun/aiops --uninstall            # alias for uninstall
```

### Claude Code Plugin (alternate)

```
/plugin marketplace add yugasun/aiops
/plugin install aiops@aiops
```

## Supported IDEs

5 IDEs plus a generic AGENTS.md harness for any tool that reads it.

**Skills always install to user-global directories** (never into the project tree). Project scope only places agents / hooks / always-on rules in the repo. Global scope puts those under `~/` as well.

| IDE                 | Skills Path (global)              | Always-On (project scope)         | Agents (project scope)  | Hooks                        |
| ------------------- | --------------------------------- | --------------------------------- | ----------------------- | ---------------------------- |
| **Claude Code**     | `~/.claude/skills/`               | via `/lean`                       | `.claude/agents/*.md`   | SessionStart + SubagentStart |
| **Cursor**          | `~/.cursor/skills/`               | `.cursor/rules/lean.mdc`          | `.cursor/agents/*.md`   | —                            |
| **Codex CLI**       | `~/.agents/skills/`               | SessionStart hooks                | `.codex/agents/*.toml`  | SessionStart + SubagentStart |
| **GitHub Copilot**  | `~/.github/skills/`               | `.github/copilot-instructions.md` | `.github/agents/*.md`   | —                            |
| **OpenCode**        | `~/.config/opencode/skills/`      | via `/lean`                       | `.opencode/agents/*.md` | —                            |
| **Generic harness** | —                                 | optional `AGENTS.md` append       | —                       | —                            |

`AGENTS.md` is **off by default**. Pass `--agents-md` (or say yes in the interactive prompt) to append a marked aiops block — never overwrite your existing file.

### Codex / Claude persistence

Full install (interactive default, or `--yes`) writes skills, agents, always-on lean, and hooks. Existing `hooks.json` entries are **merged**, not replaced.

| Mode | Skills | Hooks | Agents | Always-on lean |
| --- | --- | --- | --- | --- |
| default | yes | yes (merged) | yes | yes (SessionStart / IDE rules; no `AGENTS.md`) |
| `--skills-only` / `--commands-only` | yes | no | no | no |
| `--no-hooks` | yes | no | yes | yes |
| `--agents-only` | no | no | yes | no |
| `--agents-md` | (with agents) | — | — | append marked block to `AGENTS.md` |

To opt out of lean after a full install: run `npx -y github:yugasun/aiops uninstall`, or remove aiops entries from `~/.codex/hooks.json` / `~/.claude/hooks.json` manually.


## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  /aiops (Flow Conductor)                                │
│  ├── journey state  →  .scratch/<slug>/flow.state.yaml  │
│  └── phase dispatch →  agents/*.md + skills/*/SKILL.md  │
├─────────────────────────────────────────────────────────┤
│  Adapter seam (scripts/adapters/*)                      │
│  ├── skills   → ~/…/skills/ (always global, never in repo) │
│  ├── cursor   → .cursor/rules/*.mdc + .cursor/agents/   │
│  ├── claude   → .claude/agents/ (+ ~/.claude/skills)    │
│  ├── codex    → .codex/agents/*.toml + optional AGENTS.md │
│  ├── copilot  → .github/copilot-instructions.md         │
│  └── opencode → .opencode/agents/                       │
└─────────────────────────────────────────────────────────┘
```

## Under the hood

You do not need to memorize these to use aiops. They are documented for teams that want to inspect or customize the workflow.

### Skills


| Layer            | Skills                                                                   |
| ---------------- | ------------------------------------------------------------------------ |
| **Router**       | `/aiops` — Flow Conductor                                                |
| **Setup**        | `/aiops-setup`                                                           |
| **Alignment**    | `/explore`, `/grill-with-docs`, `/grilling`, `/domain-modeling`, `/architect-design` |
| **Planning**     | `/to-prd`, `/to-issues`, `/handoff`, `/prototype`                        |
| **Delivery**     | `/aiops-implement` → `/lean` → `/tdd` → `/prune` → `/review`             |
| **Architecture** | `/improve-codebase-architecture` — multi-modal sweep + deepening         |
| **Infrastructure** | `/code-graph` — graphify code graph for all skills to query            |
| **Other**        | `/diagnosing-bugs`, `/triage`, `/ui-mockup`, `/gitops`                   |


Full list: [`skills/manifest.json`](skills/manifest.json)

### Agents (9)


| Agent             | Role               | Key Output               |
| ----------------- | ------------------ | ------------------------ |
| `architect`       | Design + tech-spec | NOTES.md, tech-spec.md   |
| `design-reviewer` | Design gate        | DESIGN_REVIEW.md         |
| `planner`         | Breakdown + plan   | PRD.md, plan.md, issues/ |
| `prototyper`      | Rapid validation   | VERDICT.md, prototype/   |
| `builder`         | TDD implementation | source + tests           |
| `ui-designer`     | HTML mockups       | mockups/                 |
| `code-reviewer`   | Code review        | REVIEW.md                |
| `quality-auditor` | YAGNI check        | prune findings           |
| `gitops`          | Git ops            | commit + push            |


### Delivery discipline

Delivery sequence: **lean → TDD → prune → review → commit**. The final commit runs only when you explicitly approve it.

Before writing any code, stop at the first rung that holds:

```
1. Does this need to exist? (YAGNI)
2. Stdlib does it?
3. Native platform feature?
4. Already-installed dependency?
5. One line?
6. Minimum code that works
```

**Rules**: No unrequested abstractions. Deletion over addition; shortest working diff. Mark deliberate shortcuts with `// lean: <ceiling and upgrade path>`.

**Never cut**: Trust-boundary validation, data-loss prevention, security, accessibility, explicitly requested behavior.

## In a target project

1. Open the project in your AI IDE and run `/aiops <task>`
2. Follow the prompted steps; aiops saves progress automatically
3. Resume with `/aiops continue` whenever you come back
4. Add `aiops.yaml` only if your team wants GitHub/GitLab issue tracking

Details: [**docs/getting-started.md**](docs/getting-started.md)

## Docs

- [Getting started](docs/getting-started.md)
- [Agent registry](docs/agent-registry.md)
- [Skill registry](docs/skill-registry.md)
- [Website](website/index.html)

## Demo walkthroughs

> Real run logs based on [aiops-demo](https://github.com/yugasun/aiops-demo). [Full index →](docs/demos/)

- [Health check walkthrough](docs/demos/health-check-walkthrough.md) — a small API feature through clarification, TDD, review, and approval
- [Architecture scan + code graph](docs/demos/architecture-scan-walkthrough.md) — evidence-backed architecture scan, then one chosen refactor
- [Effect analysis](docs/demos/effect-analysis.md) — direct AI coding compared with the guided aiops flow
- [Automated benchmark](docs/demos/benchmark.sh) — `bash docs/demos/benchmark.sh` runs the comparison

## License

Apache 2.0 — see [LICENSE](LICENSE). Contributing: [CONTRIBUTING.md](CONTRIBUTING.md).
