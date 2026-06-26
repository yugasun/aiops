---
name: to-issues
description: Break a plan or PRD into vertical-slice issues on the project issue tracker.
disable-model-invocation: true
---

Break work into **tracer-bullet** vertical slices — each cuts all layers end-to-end, demoable alone.

Run `/aiops-setup` if tracker config is missing.

## Process

1. **Context** — conversation or fetched issue/PR from `docs/agents/issue-tracker.md`.
2. **Explore** (optional) — codebase, domain vocabulary, prefactor opportunities.
3. **Draft slices** — title, blocked-by, user stories covered. Prefactor slices first.
4. **Quiz user** — granularity, dependencies, merge/split. Iterate until approved.
5. **Publish** — dependency order; `ready-for-agent` unless told otherwise. Don't close parent.

## Issue template

**Parent** — link if applicable.

**What to build** — end-to-end behavior, not layer checklist.

**Acceptance criteria** — checkboxes.

**Blocked by** — issue refs or "None".
