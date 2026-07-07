#!/usr/bin/env bash
set -euo pipefail

# aiops installer
# Usage: curl -fsSL https://raw.githubusercontent.com/yugasun/aiops/main/install.sh | bash
#        curl -fsSL ... | bash -s -- --ide cursor
# Pin a ref: AIOPS_REF=v1.4.1 curl -fsSL ... | bash

REPO="yugasun/aiops"
GITHUB="https://github.com/${REPO}"
RAW="https://raw.githubusercontent.com/${REPO}/main"

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

resolve_latest_ref() {
  if [[ -n "${AIOPS_REF:-}" ]]; then
    printf '%s\n' "$AIOPS_REF"
    return 0
  fi

  local resolver=""
  local tmp_resolver=""

  if [[ -f "${SCRIPT_DIR}/scripts/resolve-release-ref.js" ]]; then
    resolver="${SCRIPT_DIR}/scripts/resolve-release-ref.js"
  else
    tmp_resolver="$(mktemp)"
    curl -fsSL "${RAW}/scripts/resolve-release-ref.js" -o "$tmp_resolver"
    resolver="$tmp_resolver"
  fi

  node "$resolver"
  if [[ -n "$tmp_resolver" ]]; then
    rm -f "$tmp_resolver"
  fi
}

download_archive_url() {
  local ref="$1"
  if [[ "$ref" == "main" ]]; then
    printf '%s/archive/refs/heads/main.tar.gz\n' "$GITHUB"
  else
    printf '%s/archive/refs/tags/%s.tar.gz\n' "$GITHUB" "$ref"
  fi
}

# --- Main ---
bold "aiops installer"
echo ""

check_node

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Local clone: run installer directly
if [[ -f "$SCRIPT_DIR/bin/install.js" ]]; then
  green "Local install.js found, running..."
  exec node "$SCRIPT_DIR/bin/install.js" "$@"
fi

REF="$(resolve_latest_ref)"
ARCHIVE_URL="$(download_archive_url "$REF")"
TMP_DIR="$(mktemp -d)"

cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

green "Downloading ${REPO}@${REF}..."
curl -fsSL "$ARCHIVE_URL" | tar -xz -C "$TMP_DIR" --strip-components=1
exec node "$TMP_DIR/bin/install.js" "$@"
