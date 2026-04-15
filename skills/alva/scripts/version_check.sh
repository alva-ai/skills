#!/usr/bin/env bash
# Intentionally no `set -e` — this script must never abort or block the agent.
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SKILL_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

REPO="alva-ai/skills"
SKILL_MD="$SKILL_DIR/SKILL.md"
CONFIG_FILE="$SKILL_DIR/.env"
CHECK_INTERVAL=28800 # 8 hours in seconds

# Read version from SKILL.md frontmatter (metadata.version)
read_local_version() {
  if [ ! -f "$SKILL_MD" ]; then
    echo ""
    return
  fi
  sed -n 's/^[[:space:]]*version:[[:space:]]*\(.*\)/\1/p' "$SKILL_MD" 2>/dev/null | head -1
}

# Load last_check timestamp from .env
last_check=0
if [ -f "$CONFIG_FILE" ]; then
  last_check=$(sed -n 's/^last_check=\(.*\)/\1/p' "$CONFIG_FILE" 2>/dev/null | head -1 || echo "0")
  last_check=${last_check:-0}
fi

# Throttle: skip if checked recently
now=$(date +%s 2>/dev/null || echo "0")
elapsed=$((now - last_check)) 2>/dev/null || elapsed=$CHECK_INTERVAL
if [ "$elapsed" -lt "$CHECK_INTERVAL" ]; then
  exit 0
fi

# Fetch latest release tag from GitHub API (timeout 5s)
remote_tag=$(curl -sf --max-time 5 \
  "https://api.github.com/repos/${REPO}/releases/latest" \
  | sed -n 's/.*"tag_name": *"\([^"]*\)".*/\1/p' || true)

if [ -z "$remote_tag" ]; then
  exit 0 # Network error or no releases, skip silently
fi

# Update last_check timestamp in .env
if [ -f "$CONFIG_FILE" ]; then
  # Update existing last_check line, or append if absent
  if grep -q "^last_check=" "$CONFIG_FILE"; then
    sed -i '' "s/^last_check=.*/last_check=$now/" "$CONFIG_FILE"
  else
    echo "last_check=$now" >> "$CONFIG_FILE"
  fi
else
  echo "last_check=$now" > "$CONFIG_FILE"
fi

# Read local version from SKILL.md frontmatter
local_tag=$(read_local_version)
if [ -z "$local_tag" ]; then
  exit 0
fi

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
