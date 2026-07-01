# aiops

[中文文档](README.zh-CN.md)

Personal agent skills bundle for AI-assisted software development — one `/aiops` command guides you through alignment, implementation, and delivery with hard quality gates. Install once, use across **6 AI IDEs**.

Entry: `**/aiops**` (Flow Conductor — step-by-step guidance, resumable via `flow.state.yaml`).

## Key features

- **One command** — describe your goal in natural language; resume with `/aiops continue`
- **23 skills** — full lifecycle: alignment → design review → planning → delivery → review → ship + code graph infrastructure
- **9 specialized agents** — artifact contracts and dispatch (optional for experts)
- **Code graph** — graphify deterministic extraction (Tree-sitter AST + Louvain clustering) + AI semantic annotations for structured code understanding
- **Zero-config default** — local markdown issues unless `aiops.yaml` specifies GitHub/GitLab
- **Always-on lean discipline** — YAGNI ladder auto-injected on coding turns
- **Multi-IDE portability** — single `SKILL.md` source, adapter compiles to native IDE formats

## Quick start

```bash
npx -y github:yugasun/aiops
```

### Code Graph (optional enhancement)

Of aiops's 23 skills, `/code-graph` is optional — it builds a structured code understanding using [graphify](https://github.com/safishamsi/graphify) (Tree-sitter AST parsing + Louvain community detection). The other 22 skills **require zero additional dependencies**.

**When do you need it?** When you run `/aiops check my architecture for optimization opportunities`, the code graph provides more precise analysis. Without it, aiops still works — just with organic exploration instead of structured graph data.

**Install steps:**

```bash
# Step 1: Install uv (Python package manager) — skip if you already have uv or pip
# macOS / Linux
curl -LsSf https://astral.sh/uv/install.sh | sh
# Windows
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"

# Step 2: Install graphify (PyPI package: graphifyy, CLI command: graphify)
uv tool install graphifyy

# Step 3: Verify
graphify --version
```

> **Don't want uv?** Use pip: `pip install graphifyy`, or pipx: `pipx install graphifyy`.
> **Don't want graphify?** Totally fine. Alignment, design, implementation, and quality gates all work independently.

In your project chat:

```
/aiops Add a health check endpoint
```

Resume later:

```
/aiops continue
```

### CLI options

```bash
npx -y github:yugasun/aiops --ide cursor
npx -y github:yugasun/aiops -g
npx -y github:yugasun/aiops --skills-only
npx -y github:yugasun/aiops --agents-only
npx -y github:yugasun/aiops --list
npx -y github:yugasun/aiops --uninstall
```

### Claude Code Plugin (alternate)

```
/plugin marketplace add yugasun/aiops
/plugin install aiops@aiops
```

## Supported IDEs


| IDE                 | Skills Path         | Always-On                         | Agents                  | Hooks                        |
| ------------------- | ------------------- | --------------------------------- | ----------------------- | ---------------------------- |
| **Claude Code**     | `.claude/skills/`   | via `/lean`                       | `.claude/agents/*.md`   | SessionStart + SubagentStart |
| **Cursor**          | `.cursor/skills/`   | `.cursor/rules/lean.mdc`          | `.cursor/agents/*.md`   | —                            |
| **Codex CLI**       | `.agents/skills/`   | via `AGENTS.md`                   | `.codex/agents/*.toml`  | —                            |
| **Windsurf**        | `.windsurf/skills/` | `.windsurf/rules/lean.mdc`        | `.windsurf/agents/*.md` | —                            |
| **GitHub Copilot**  | `.github/skills/`   | `.github/copilot-instructions.md` | `.github/agents/*.md`   | —                            |
| **Generic harness** | —                   | `AGENTS.md`                       | —                       | —                            |


## What you get

### Skills (23 Tier 1)


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


### Lean discipline

Delivery sequence: **lean → TDD → prune → review → commit** (only when you explicitly approve).

## In a target project

1. Run `/aiops` — first run bootstraps silently (local markdown issues by default)
2. Add `aiops.yaml` at repo root for GitHub/GitLab teams
3. Default single-session; split into PRD + issues for large multi-module work

Details: [**docs/getting-started.md**](docs/getting-started.md)

## Docs

- [Getting started](docs/getting-started.md)
- [Agent registry](docs/agent-registry.md)
- [Skill registry](docs/skill-registry.md)
- [Website](website/index.html)

## Demo walkthroughs

> Real run logs based on [aiops-demo](https://github.com/yugasun/aiops-demo). [Full index →](docs/demos/)

- [Health check walkthrough](docs/demos/health-check-walkthrough.md) — TDD + prune + review, +32 lines, 4 tests pass
- [Architecture scan + code graph](docs/demos/architecture-scan-walkthrough.md) — graphify → 4-perspective sweep → deepening a God module
- [Effect analysis](docs/demos/effect-analysis.md) — two experiments: add feature (-52% code) + fix bug (TDD eliminates silent bugs)
- [Automated benchmark](docs/demos/benchmark.sh) — `bash docs/demos/benchmark.sh` runs the comparison

## License

Apache 2.0 — see [LICENSE](LICENSE). Contributing: [CONTRIBUTING.md](CONTRIBUTING.md).