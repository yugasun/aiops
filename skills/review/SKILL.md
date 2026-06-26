---
name: review
description: Review diff since a fixed point on Standards and Spec axes in parallel sub-agents. Use for branch/PR/WIP review or "review since X".
---

Two-axis review of `git diff <fixed-point>...HEAD`:

- **Standards** — matches repo coding standards?
- **Spec** — matches originating issue/PRD?

Run `/aiops-setup` if `docs/agents/issue-tracker.md` is missing.

## Process

1. **Pin fixed point** — commit, branch, tag, or `main`. Confirm ref resolves and diff is non-empty.
2. **Find spec** — issue refs in commits (`docs/agents/issue-tracker.md`), user path, or `docs/`/`.scratch/` PRD. No spec → Spec axis skips.
3. **Find standards** — `CODING_STANDARDS.md`, `CONTRIBUTING.md`, etc.
4. **Parallel sub-agents** — one Standards, one Spec (if spec exists). Each under 400 words, cite sources.
5. **Aggregate** — `## Standards` and `## Spec` verbatim. One-line summary per axis; don't merge axes.

A change can pass one and fail the other — keep them separate.
