#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORKDIR="$(mktemp -d)"
trap 'rm -rf "$WORKDIR"' EXIT
MANIFEST="$ROOT/skills/manifest.json"
SKILLS_TARGET="$WORKDIR/.agents/skills"

bash "$ROOT/scripts/verify.sh"

echo "Installing from $ROOT into $WORKDIR via skills CLI ..."
cd "$WORKDIR"
npx skills@latest add "$ROOT" --copy -y --skill '*' -a cursor

python3 - "$MANIFEST" "$SKILLS_TARGET" <<'PY'
import json
import sys
from pathlib import Path

manifest = json.loads(Path(sys.argv[1]).read_text())
target = Path(sys.argv[2])
if not target.is_dir():
    print("error: skills CLI did not install to .agents/skills", file=sys.stderr)
    sys.exit(1)
missing = [e["name"] for e in manifest["tier1"] if not (target / e["name"] / "SKILL.md").is_file()]
if missing:
    print("error: missing after install:", ", ".join(missing), file=sys.stderr)
    sys.exit(1)
print(f"install smoke: ok ({len(manifest['tier1'])} skills)")
PY

cd "$ROOT" && python3 -m unittest scripts/test_router.py -v
echo "All checks passed."
