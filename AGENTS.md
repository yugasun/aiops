## Agent skills

### aiops bundle

Install globally via Skills CLI:

```bash
npx skills@latest add yugasun/aiops -g -y --skill '*'
```

Claude Code plugin: `/plugin marketplace add yugasun/aiops` → `/plugin install aiops@aiops`

**Docs:** [README.md](README.md) · [Getting started](docs/getting-started.md) · [Skill registry](docs/agents/skill-registry.md)

Entry skill in target projects: `/aiops` (Skills CLI) or `/aiops:aiops` (Claude Plugin).

### Issue tracker

Issues live as markdown under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default role strings (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
