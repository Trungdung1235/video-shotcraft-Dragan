#!/usr/bin/env bash
set -euo pipefail
shotcraft_repo="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$shotcraft_repo"
export SHOTCRAFT_BROWSER_EXECUTABLE="${SHOTCRAFT_BROWSER_EXECUTABLE:-/usr/bin/chromium-headless-shell}"
test -x "$SHOTCRAFT_BROWSER_EXECUTABLE"

# Reuse a healthy managed server on reconnect. Codespaces handles authentication
# and forwards this port privately by default; do not publish it or create tunnels.
node workbench/scripts/open.mjs --no-open --host 0.0.0.0
