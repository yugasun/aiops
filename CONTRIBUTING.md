# Contributing

## Bundle changes

1. Edit skills under `skills/<name>/` — never commit installed copies to `.agents/skills/`.
2. Update `skills/manifest.json` when adding or removing tier1 skills.
3. Prefer [Conventional Commits](https://www.conventionalcommits.org/) on `main`:
   - `feat:` → minor release
   - `fix:` → patch release
   - `feat!:` / `fix!:` / `BREAKING CHANGE` → major release
4. Merge to `main` with a `feat`/`fix` commit → GitHub Actions bumps version (`skills/manifest.json`, `package.json`, Claude plugin metadata), tags `v<version>`, and creates a GitHub Release. Release commits use `chore(release): vX.Y.Z [skip ci]`.
5. Manual override: **Actions → Release → Run workflow** with a version, or bump locally before merge:

   ```bash
   node scripts/sync-version.js 1.4.2  # bump + sync all version files
   ```

   If the merge commit already changed `skills/manifest.json` version, Release uses that version (no second bump).
6. Before PR:

   ```bash
   node scripts/sync-version.js        # propagate manifest.version (if you edited manifest only)
   bash scripts/verify.sh              # fast, no npm
   ```

7. Router changes: `skills/aiops/scripts/router.py` + `skills/aiops/scripts/test_router.py` + `skills/aiops/scripts/flow_cli.py`.
8. New skill references: update `docs/skill-registry.md`.

`install.sh` resolves the latest GitHub release at install time (no pinned version in the script).

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
