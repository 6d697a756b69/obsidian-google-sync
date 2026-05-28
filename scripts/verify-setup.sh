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

pass() { echo "✅ $1"; }
warn() { echo "⚠️  $1"; }
fail() { echo "❌ $1"; FAILED=1; }

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
    print(f"⚠️  Could not parse templater config JSON: {e}")
    raise SystemExit(0)

templates_folder = data.get('templates_folder')
trigger = data.get('trigger_on_file_creation')
raw = json.dumps(data)

if templates_folder == 'templates':
    print('✅ Templater templates_folder is set to "templates"')
else:
    print('⚠️  Templater templates_folder is not "templates"')

if trigger is True:
    print('✅ Templater trigger_on_file_creation is enabled')
else:
    print('⚠️  Templater trigger_on_file_creation is not enabled')

if 'events' in raw and 'templates/google-sync/event-template.md' in raw:
    print('✅ Found events folder-template mapping in Templater config')
else:
    print('⚠️  Could not confirm events folder-template mapping in Templater config')

if 'tasks' in raw and 'templates/google-sync/task-template.md' in raw:
    print('✅ Found tasks folder-template mapping in Templater config')
else:
    print('⚠️  Could not confirm tasks folder-template mapping in Templater config')
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

echo "Result: PASS (required items present; check warnings for optional improvements)"
