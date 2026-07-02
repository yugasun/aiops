#!/usr/bin/env bash
set -euo pipefail

# aiops installer
# Usage: curl -fsSL https://raw.githubusercontent.com/yugasun/aiops/main/install.sh | bash
#        curl -fsSL ... | bash -s -- --ide cursor

REPO="yugasun/aiops"
PINNED_REF="v1.4.0"

# --- Color helpers ---
red()   { printf '\033[31m%s\033[0m\n' "$*"; }
green() { printf '\033[32m%s\033[0m\n' "$*"; }
bold()  { printf '\033[1m%s\033[0m\n' "$*"; }

# --- Check Node.js ---
check_node() {
  if ! command -v node &>/dev/null; then
    red "ERROR: Node.js is required but not found."
    red "Install from https://nodejs.org (v18+)"
    exit 1
  fi

  local version
  version="$(node -v | sed 's/^v//' | cut -d. -f1)"
  if [[ "$version" -lt 18 ]]; then
    red "ERROR: Node.js 18+ required (found $(node -v))"
    exit 1
  fi
}

# --- Main ---
bold "aiops installer"
echo ""

check_node

# If running from local clone (bin/install.js exists relative to this script)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -f "$SCRIPT_DIR/bin/install.js" ]]; then
  green "Local install.js found, running..."
  exec node "$SCRIPT_DIR/bin/install.js" "$@"
fi

# Otherwise, use npx to fetch from GitHub
green "Fetching from github:${REPO}..."
exec npx -y "github:${REPO}#${PINNED_REF}" "$@"
