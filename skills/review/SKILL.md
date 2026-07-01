---
name: review
description: Review diff since a fixed point on Standards and Spec axes in parallel sub-agents. Use for branch/PR/WIP review or "review since X".
---

Two-axis review of `git diff <fixed-point>...HEAD`:

- **Standards** — matches repo coding standards?
- **Spec** — matches originating issue/PRD?

When `CONSTITUTION.md` exists at repo root, add a third axis:

- **Constitution** — violates any non-negotiable principle?

Run `/aiops-setup` if `docs/agents/issue-tracker.md` is missing.

## Process

1. **Pin fixed point** — commit, branch, tag, or `main`. Confirm ref resolves and diff is non-empty.
2. **Find spec** — issue refs in commits (`docs/agents/issue-tracker.md`), user path, or `docs/`/`.scratch/` PRD. No spec → Spec axis skips.
3. **Find standards** — `CODING_STANDARDS.md`, `CONTRIBUTING.md`, etc.
4. **Find constitution** — `CONSTITUTION.md` at repo root. Missing → Constitution axis skips.
5. **Parallel sub-agents** — one per active axis (Standards, Spec, Constitution). Each under 400 words, cite sources.
6. **Aggregate** — one section per axis verbatim. One-line summary per axis; don't merge axes.

A change can pass one and fail another — keep axes separate.

## Drift mode (drift_check phase)

When invoked as the `drift_check` phase, add a third axis:

- **Drift** — does the implementation match `tech-spec.md`?
  - Input: `.scratch/<slug>/tech-spec.md` + `git diff`
  - Check: Are all spec requirements implemented? Are there behaviors not in the spec?
  - Output: `DRIFT_REPORT.md` with drift items and overall verdict
