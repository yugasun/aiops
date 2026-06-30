#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MANIFEST="$ROOT/skills/manifest.json"
SKILLS="$ROOT/skills"
AGENTS="$ROOT/agents"

python3 - "$ROOT" "$MANIFEST" "$SKILLS" "$AGENTS" <<'PY'
import json
import re
import sys
from pathlib import Path

root = Path(sys.argv[1])
manifest = json.loads(Path(sys.argv[2]).read_text())
skills_root = Path(sys.argv[3])
agents_root = Path(sys.argv[4])
frontmatter = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.DOTALL)
forbidden = ("router.py", "test_router.py", "UPSTREAM.md")
errors = 0

# --- bundle: tier1 SKILL.md + frontmatter ---
for entry in manifest["tier1"]:
    name = entry["name"]
    skill_dir = skills_root / name
    skill_md = skill_dir / "SKILL.md"
    if not skill_md.is_file():
        print(f"ERROR {name}: missing SKILL.md")
        errors += 1
        continue
    text = skill_md.read_text()
    m = frontmatter.match(text)
    if not m or "name:" not in m.group(1) or "description:" not in m.group(1):
        print(f"ERROR {name}: invalid frontmatter")
        errors += 1
    for artifact in forbidden:
        if (skill_dir / artifact).is_file():
            print(f"ERROR {name}: dev artifact present: {artifact}")
            errors += 1

# --- agents: verify agent definitions ---
required_sections = ("## Identity", "## Available Skills", "## Inputs", "## Outputs", "## Constraints", "## Downstream")
for agent_entry in manifest.get("agents", []):
    name = agent_entry["name"]
    agent_md = agents_root / f"{name}.md"
    if not agent_md.is_file():
        print(f"ERROR agent {name}: missing agents/{name}.md")
        errors += 1
        continue
    text = agent_md.read_text()
    for section in required_sections:
        if section not in text:
            print(f"ERROR agent {name}: missing section '{section}'")
            errors += 1

# --- claude plugin ---
plugin = json.loads((root / ".claude-plugin/plugin.json").read_text())
marketplace = json.loads((root / ".claude-plugin/marketplace.json").read_text())
release = manifest.get("version")
if not release:
    print("ERROR manifest: missing version")
    errors += 1
elif plugin.get("version") != release:
    print(f"ERROR plugin.json version {plugin.get('version')!r} != manifest {release!r}")
    errors += 1
elif marketplace.get("metadata", {}).get("version") != release:
    print("ERROR marketplace metadata.version != manifest")
    errors += 1
if marketplace.get("name") != "aiops":
    print("ERROR marketplace.name must be aiops")
    errors += 1
plugins = marketplace.get("plugins", [])
if len(plugins) != 1 or plugins[0].get("name") != "aiops":
    print("ERROR marketplace must list single plugin aiops")
    errors += 1
elif plugins[0].get("source") != "./":
    print("ERROR plugin source must be ./")
    errors += 1
elif plugins[0].get("strict") is not False:
    print("ERROR plugin strict must be false")
    errors += 1

# --- skill refs ---
tier1 = {entry["name"] for entry in manifest["tier1"]}
tier1_slash = {f"/{name}" for name in tier1}
slash_ref = re.compile(r"`(/[a-z][a-z0-9-]*)`")
for path in sorted(skills_root.rglob("*.md")):
    text = path.read_text()
    rel = path.relative_to(skills_root.parent)
    for m in slash_ref.finditer(text):
        ref = m.group(1)
        if ref not in tier1_slash and ref not in {"/settings"}:
            if ("-" in ref[1:] or ref[1:] in ("aiops", "tdd")) and ref.count("/") == 1:
                print(f"ERROR {rel}: unregistered skill reference {ref}")
                errors += 1

if errors:
    print(f"verify: {errors} error(s)")
    sys.exit(1)
agent_count = len(manifest.get("agents", []))
print(f"verify: ok ({len(manifest['tier1'])} tier1 skills, {agent_count} agents, release {release})")
PY
