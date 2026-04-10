#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

UI_HOST="${ORKET_UI_HOST:-127.0.0.1}"
UI_PORT="${ORKET_UI_PORT:-3010}"
UI_DIST_INDEX="$REPO_ROOT/UI/dist/index.html"
FORCE_REBUILD="${ORKET_UI_REBUILD:-0}"

if [[ -z "${ORKET_UI_API_KEY:-}" && -n "${ORKET_API_KEY:-}" ]]; then
  export ORKET_UI_API_KEY="$ORKET_API_KEY"
fi

if [[ "$FORCE_REBUILD" == "1" || ! -f "$UI_DIST_INDEX" ]]; then
  echo "Building React UI..."
  npm --prefix UI install
  npm --prefix UI run build
fi

echo "Launching OrketUI at http://${UI_HOST}:${UI_PORT}"
echo "Host base URL: ${ORKET_UI_HOST_BASE_URL:-http://127.0.0.1:8082 (default)}"
if [[ -z "${ORKET_UI_API_KEY:-}" ]]; then
  echo "Warning: ORKET_UI_API_KEY is not set. Host-backed /v1/* reads will fail closed until ORKET_UI_API_KEY or ORKET_API_KEY is set."
fi
echo "Press Ctrl+C to stop."

python -m uvicorn orket_ui_app.server:app --app-dir src --host "$UI_HOST" --port "$UI_PORT" --no-access-log
