#!/usr/bin/env bash
# Intentionally no `set -e` — this script must never abort or block the agent.
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SKILL_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

REPO="alva-ai/skills"
LOCK_FILE="$SKILL_DIR/.skill-lock.json"
CHECK_INTERVAL=28800 # 8 hours in seconds

# Read lock file fields (portable JSON parsing without jq)
read_lock() {
  if [ ! -f "$LOCK_FILE" ]; then
    echo ""
    return
  fi
  local key="$1"
  sed -n "s/.*\"${key}\": *\"\{0,1\}\([^\",}]*\)\"\{0,1\}.*/\1/p" "$LOCK_FILE" 2>/dev/null | head -1
}

# Write lock file
write_lock() {
  local tag="$1"
  local ts="$2"
  cat >"$LOCK_FILE" <<EOF
{
  "remote_tag": "$tag",
  "last_check": $ts
}
EOF
}

# Throttle: skip if checked recently
last_check=$(read_lock "last_check")
if [ -n "$last_check" ]; then
  now=$(date +%s 2>/dev/null || echo "0")
  elapsed=$((now - last_check)) 2>/dev/null || elapsed=$CHECK_INTERVAL
  if [ "$elapsed" -lt "$CHECK_INTERVAL" ]; then
    exit 0
  fi
fi

# Fetch latest release tag from GitHub API (timeout 5s)
remote_tag=$(curl -sf --max-time 5 \
  "https://api.github.com/repos/${REPO}/releases/latest" \
  | sed -n 's/.*"tag_name": *"\([^"]*\)".*/\1/p' || true)

if [ -z "$remote_tag" ]; then
  exit 0 # Network error or no releases, skip silently
fi

now=$(date +%s 2>/dev/null || echo "0")

# First run: record current tag and exit
local_tag=$(read_lock "remote_tag")
if [ -z "$local_tag" ]; then
  write_lock "$remote_tag" "$now"
  exit 0
fi

# Update last_check timestamp
write_lock "$local_tag" "$now"

# Compare — notify only when a new release is published
if [ "$local_tag" != "$remote_tag" ]; then
  cat <<EOF
Alva skill update available.
  Installed: $local_tag
  Latest:    $remote_tag
  Run:       npx skills add alva-ai/skills
EOF
fi
