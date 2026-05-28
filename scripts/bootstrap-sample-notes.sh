#!/usr/bin/env bash
set -euo pipefail

# Create one sample event note and one sample task note for a quick sync smoke test.
# Usage:
#   ./scripts/bootstrap-sample-notes.sh /path/to/vault

VAULT_PATH="${1:-}"
if [[ -z "$VAULT_PATH" ]]; then
  echo "Usage: $0 /absolute/or/relative/vault/path"
  exit 1
fi

VAULT_PATH="$(python3 - <<'PY' "$VAULT_PATH"
import os,sys
print(os.path.abspath(sys.argv[1]))
PY
)"

if [[ ! -d "$VAULT_PATH" ]]; then
  echo "Vault path does not exist: $VAULT_PATH"
  exit 1
fi

EVENTS_DIR="$VAULT_PATH/events"
TASKS_DIR="$VAULT_PATH/tasks"
mkdir -p "$EVENTS_DIR" "$TASKS_DIR"

STAMP="$(date +%Y%m%d-%H%M%S)"
EVENT_FILE="$EVENTS_DIR/sample-event-$STAMP.md"
TASK_FILE="$TASKS_DIR/sample-task-$STAMP.md"

cat > "$EVENT_FILE" <<'EOF'
---
title: Sample Event (Google Sync smoke test)
date: 2026-06-15T09:00
end: 2026-06-15T10:00
timezone: Pacific/Auckland
location:
attendees:
  -
---

Created by scripts/bootstrap-sample-notes.sh for sync verification.
EOF

cat > "$TASK_FILE" <<'EOF'
---
title: Sample Task (Google Sync smoke test)
due: 2026-06-15
completed: false
---

Created by scripts/bootstrap-sample-notes.sh for sync verification.
EOF

echo "Created sample notes:"
echo "- $EVENT_FILE"
echo "- $TASK_FILE"
echo
echo "Next in Obsidian:"
echo "1) Run 'Sync now'"
echo "2) Confirm event/task appears in Google"
echo "3) (Optional) Set completed: true on the task and sync again"
