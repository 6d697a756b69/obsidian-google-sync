#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "[obsidian-google-sync] 1/3 build"
npm run -s build

echo "[obsidian-google-sync] 2/3 unit tests"
npm run -s test:unit

if [[ "${RUN_E2E:-0}" == "1" ]]; then
  echo "[obsidian-google-sync] 3/3 e2e tests (RUN_E2E=1)"
  npm run -s test:e2e
else
  echo "[obsidian-google-sync] 3/3 e2e tests skipped (set RUN_E2E=1 to enable)"
fi

echo "[obsidian-google-sync] ✅ smoke-local passed"
