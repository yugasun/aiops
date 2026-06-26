---
name: aiops-implement
description: Delivery overlay for the aiops bundle. Implements PRD or issues with lean ladder, tdd, prune, review; commits only on user approval.
disable-model-invocation: true
---

# aiops-implement

Implement work from a PRD or issue brief. **Not** for grill/alignment — lean is active here only while writing code.

## Delivery sequence (hard gates)

1. **Lean ladder** — write minimal code (stdlib/native first)
2. **`/tdd`** — red-green-refactor at agreed public interfaces (user may exempt mechanical fixes)
3. **`/prune`** — remove over-engineering from the diff
4. **`/review`** — standards + spec review
5. **Commit** — **only when the user explicitly asks**. Never commit autonomously.

Run typechecking and targeted tests during implementation; full suite once at the end.

## Prototype verdict (conditional)

If this work absorbed a `/prototype`, require `NOTES.md` with the verdict before merging prototype learnings into code or PRD.

## Lean off during grill

Alignment phases use `/grill-with-docs` without lean. Switch to lean when implementation starts.
