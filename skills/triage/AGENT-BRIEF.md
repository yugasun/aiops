# Agent Brief

Contract for AFK agents when an issue/PR moves to `ready-for-agent`.

**Durable:** interfaces and behavior, not file paths or line numbers.
**Behavioral:** what the system should do, not step-by-step edits.
**Complete:** testable acceptance criteria + explicit out-of-scope.

```markdown
## Agent Brief

**Category:** bug | enhancement
**Summary:** one line

**Current behavior:** …
**Desired behavior:** …

**Key interfaces:**
- `TypeName` / `function()` — what changes and why

**Acceptance criteria:**
- [ ] …

**Out of scope:**
- …
```

For PRs: current behavior = state of the diff; desired = finish/fix gaps on existing code.
