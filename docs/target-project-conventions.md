# Target project conventions

These conventions apply to codebases where aiops skills are installed — not to the aiops skills package itself.

## File size limit

**Keep every source file under 500 lines.** When a file approaches the limit, split it before it crosses it.

### When to split

- A file exceeds 500 lines
- A module mixes types, utils, handlers, rendering, and constants in one file
- A screen component contains inline sub-components that are extractable

### TypeScript / React splitting order

1. **Types** — interfaces, type aliases, enums → `types.ts`
2. **Pure utilities** — formatting, grouping, data transforms → `utils.ts`
3. **Complex state logic** → `hooks/useXxx.ts`
4. **Sub-components** — UI pieces → `components/XxxYyy.tsx`
5. **Constants / config** — hardcoded arrays, config objects → `constants.ts`

### Rules

- Each file does one thing (single responsibility)
- Related code stays together (cohesion)
- Never break existing imports — re-export from the original file if needed
- Mirror the existing package layout — don't invent a new pattern if neighbors already have one
- After splitting: typecheck + lint must pass
