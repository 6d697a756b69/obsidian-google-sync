#!/usr/bin/env bash
set -euo pipefail

# Verify Google Sync + Templater onboarding setup in an Obsidian vault.
# Usage:
#   ./scripts/verify-setup.sh /path/to/vault

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

pass() { echo "PASS: $1"; }
warn() { echo "WARN: $1"; }
fail() { echo "FAIL: $1"; FAILED=1; }

FAILED=0
TP_DATA="$VAULT_PATH/.obsidian/plugins/templater-obsidian/data.json"

# Hard requirements
[[ -d "$VAULT_PATH/events" ]] && pass "events/ folder exists" || fail "Missing events/ folder"
[[ -d "$VAULT_PATH/tasks" ]] && pass "tasks/ folder exists" || fail "Missing tasks/ folder"
[[ -f "$VAULT_PATH/templates/google-sync/event-template.md" ]] && pass "event template exists" || fail "Missing templates/google-sync/event-template.md"
[[ -f "$VAULT_PATH/templates/google-sync/task-template.md" ]] && pass "task template exists" || fail "Missing templates/google-sync/task-template.md"

# Soft checks for Templater settings/mappings
if [[ -f "$TP_DATA" ]]; then
  pass "Templater config exists (.obsidian/plugins/templater-obsidian/data.json)"
  python3 - <<'PY' "$TP_DATA" || true
import json,sys
p=sys.argv[1]
try:
    with open(p,'r',encoding='utf-8') as f:
        data=json.load(f)
except Exception as e:
    print(f"WARN: Could not parse templater config JSON: {e}")
    raise SystemExit(0)

templates_folder = data.get('templates_folder')
trigger = data.get('trigger_on_file_creation')
raw = json.dumps(data)

if templates_folder == 'templates':
    print('PASS: Templater templates_folder is set to "templates"')
else:
    print('WARN: Templater templates_folder is not "templates"')

if trigger is True:
    print('WARN: Templater trigger_on_file_creation is enabled. If you import from Google, this can corrupt imported notes unless automatic templates are limited to non-managed draft folders.')
else:
    print('PASS: Templater trigger_on_file_creation is disabled or unset')

has_events_mapping = 'events' in raw and 'templates/google-sync/event-template.md' in raw
has_tasks_mapping = 'tasks' in raw and 'templates/google-sync/task-template.md' in raw

if has_events_mapping:
    print('WARN: Templater config appears to map an event template to an events-like folder. Do not auto-map Google Sync managed import folders.')
else:
    print('PASS: No events folder-template mapping detected')

if has_tasks_mapping:
    print('WARN: Templater config appears to map a task template to a tasks-like folder. Do not auto-map Google Sync managed import folders.')
else:
    print('PASS: No tasks folder-template mapping detected')
PY
else
  warn "Templater config not found (this is okay if you configure Templater manually)"
fi

echo
echo "Verification complete for: $VAULT_PATH"
if [[ "$FAILED" -eq 1 ]]; then
  echo "Result: FAIL (required items missing)"
  exit 1
fi

echo "Result: PASS (required items present; review warnings for risky Templater automation)"
