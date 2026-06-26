# Out-of-Scope KB

`.out-of-scope/<concept>.md` records **rejected enhancements** (not bugs, not already-built features).

```markdown
# Concept Name

**Decision:** rejected
**Reason:** durable why (scope, architecture, strategy)
**Prior requests:** #42, #87
```

**During triage:** read all files; match by concept similarity; surface matches to maintainer.

**On wontfix (enhancement):** create or append file, comment with link, close.

**Already implemented:** close with pointer to code — do **not** write `.out-of-scope/`.

Maintainer may delete a file to reconsider; old issues stay closed.
