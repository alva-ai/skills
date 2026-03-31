#!/usr/bin/env bash
# Intentionally no `set -e` — this script must never abort or block the agent.
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SKILL_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

REPO="alva-ai/skills"
SKILL_MD="$SKILL_DIR/SKILL.md"
CONFIG_FILE="$SKILL_DIR/.env"
CHECK_INTERVAL=28800 # 8 hours in seconds

# Read a field from .env (KEY=VALUE format)
read_field() {
  if [ ! -f "$CONFIG_FILE" ]; then
    echo ""
    return
  fi
  local key="$1"
  sed -n "s/^${key}=\(.*\)/\1/p" "$CONFIG_FILE" 2>/dev/null | head -1
}

# Read version from SKILL.md frontmatter (metadata.version)
read_local_version() {
  if [ ! -f "$SKILL_MD" ]; then
    echo ""
    return
  fi
  sed -n 's/^[[:space:]]*version:[[:space:]]*\(.*\)/\1/p' "$SKILL_MD" 2>/dev/null | head -1
}

# Write last_check to .env, preserving api_key
write_check() {
  local ts="$1"
  local api_key
  api_key=$(read_field "api_key")
  cat >"$CONFIG_FILE" <<EOF
api_key=${api_key}
last_check=${ts}
EOF
}

# Throttle: skip if checked recently
last_check=$(read_field "last_check")
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

# Read local version from SKILL.md frontmatter
local_tag=$(read_local_version)
if [ -z "$local_tag" ]; then
  write_check "$now"
  exit 0
fi

# Update last_check timestamp
write_check "$now"

# Compare — notify only when a new release is published
if [ "$local_tag" != "$remote_tag" ]; then
  cat <<EOF
Alva skill update available.
  Installed: $local_tag
  Latest:    $remote_tag
Update with one of:
  npx skills add https://github.com/alva-ai/skills/tree/${remote_tag}/skills/alva --skill alva -y
  clawhub update alva
  git clone --branch ${remote_tag} --depth 1 https://github.com/alva-ai/skills ./tmp/alva-skills && cp -r ./tmp/alva-skills/skills/alva/* "${SKILL_DIR}/" && rm -rf ./tmp/alva-skills
EOF
fi
