# graphify Prerequisites

graphify must be installed for deterministic code graph extraction. It's a Python tool that uses Tree-sitter to parse 20+ languages — no manual grep guessing.

**If the user doesn't have graphify installed**, offer these options in order of preference:

```bash
# Option 1: uv (recommended — isolated environment, no conflicts)
# First install uv if not present: curl -LsSf https://astral.sh/uv/install.sh | sh
uv tool install graphifyy

# Option 2: pipx (also isolated)
pipx install graphifyy

# Option 3: pip (simplest, may conflict with other packages)
pip install graphifyy
```

After install, verify: `graphify --version`. If the command isn't found after uv install, suggest `uv tool update-shell`.

The PyPI package name is `graphifyy` (double-y) — the CLI command is `graphify`.

**If the user declines to install**, tell them: "代码图谱功能跳过，其他 skill 正常使用。" and proceed without the graph. Do not block or error.
