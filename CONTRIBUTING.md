# Contributing

## Bundle changes

1. Edit skills under `skills/<name>/` — never commit installed copies to `.agents/skills/`.
2. Update `skills/manifest.json` when adding or removing tier1 skills.
3. On release: bump `version` in `skills/manifest.json`, `.claude-plugin/plugin.json`, and `.claude-plugin/marketplace.json` (keep all three equal).
4. Before PR:

   ```bash
   bash scripts/verify.sh           # fast, no npm
   ```

5. Router changes: `skills/aiops/scripts/router.py` + `skills/aiops/scripts/test_router.py` + `skills/aiops/scripts/flow_cli.py`.
6. New skill references: update `docs/skill-registry.md`.

## Skill authoring

- Keep `SKILL.md` lean; sibling `.md` only for progressive disclosure.
- Delivery gates live in `/aiops-implement` only.
- No repo-relative links in `SKILL.md` that break after `npx skills` install.

## Docs

User-facing: `README.md`, `docs/getting-started.md`. Domain: `CONTEXT.md`. Architecture: `docs/adr/`.

## Code style

- **File size limit: 500 lines.** Split files that approach this limit.
- Mirror existing package layout — don't invent new patterns.
- For conventions that apply to target projects using aiops, see `docs/target-project-conventions.md`.
