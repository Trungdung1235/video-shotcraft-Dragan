#!/usr/bin/env bash
set -euo pipefail
shotcraft_repo="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$shotcraft_repo"

for shotcraft_tool in node npm ffmpeg ffprobe rsync; do
  command -v "$shotcraft_tool" >/dev/null
done
test -x "${SHOTCRAFT_BROWSER_EXECUTABLE:-/usr/bin/chromium-headless-shell}"

npm ci
npm ci --prefix template
npm ci --prefix workbench
node workbench/scripts/open.mjs template --link-only --no-open
echo 'Motion Workbench installed. Port 5198 will start automatically.'
