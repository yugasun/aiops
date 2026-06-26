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

16 Tier 1 skills. Full list: [`skills/manifest.json`](skills/manifest.json) and [`docs/skill-registry.md`](docs/skill-registry.md).

## Quick start

### Skills CLI (Cursor, Codex, Claude Code, …)

```bash
npx skills@latest add yugasun/aiops -g -y --skill '*'
```

List skills before install:

```bash
npx skills@latest add yugasun/aiops --list
```

### Claude Code Plugin

In Claude Code:

```
/plugin marketplace add yugasun/aiops
/plugin install aiops@aiops
```

Plugin skills use the `aiops:` namespace (e.g. `/aiops:aiops`). Skills CLI installs use `/aiops` directly.

Then in **any target project**:

1. Run `/aiops-setup` once (issue tracker, labels, `CONTEXT.md` layout).
2. Run `/aiops` for every new task.

Details: **[docs/getting-started.md](docs/getting-started.md)**.

## Project layout

```
aiops/
├── README.md
├── .claude-plugin/           # Claude Code marketplace + plugin manifest
├── skills/                   # Bundle source (Skills CLI discovers this)
│   ├── manifest.json
│   └── <skill-name>/SKILL.md
├── docs/
│   ├── getting-started.md
│   ├── agents/
│   └── adr/
└── scripts/
    ├── smoke-install.sh      # CI: npx skills install + router tests
    └── verify.sh             # bundle + plugin + skill-ref checks
```

**Source of truth:** `skills/` only. Do not commit installed copies under `.agents/skills/` in this repo.

## Verify (maintainers)

```bash
bash scripts/smoke-install.sh   # full CI
bash scripts/verify.sh          # source checks only (no npm)
```

Requires Node.js for `smoke-install.sh` (runs `npx skills@latest`).

## Docs

- [Getting started](docs/getting-started.md) — install, setup, example dev flow
- [Skill registry](docs/skill-registry.md) — install paths + allowed references
- [CONTEXT.md](CONTEXT.md) — vocabulary for the bundle
- [ADR index](docs/adr/) — design history

## License

Apache 2.0 — see [LICENSE](LICENSE). Contributing: [CONTRIBUTING.md](CONTRIBUTING.md).
