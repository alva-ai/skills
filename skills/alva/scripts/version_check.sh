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

# Read local version from SKILL.md frontmatter
local_tag=$(read_local_version)
if [ -z "$local_tag" ]; then
  exit 0
fi

# version_gt A B: true when version A is strictly newer than B (a leading "v"
# is ignored). Uses `sort -V`; if that is unavailable, any difference counts.
version_gt() {
  a=${1#v}
  b=${2#v}
  [ "$a" = "$b" ] && return 1
  newest=$(printf '%s\n%s\n' "$a" "$b" | sort -V 2>/dev/null | tail -n 1)
  [ -z "$newest" ] && return 0
  [ "$newest" = "$a" ]
}

update_available=0
if version_gt "$remote_tag" "$local_tag"; then
  update_available=1
fi

# Record last_check only after a successful fetch and compare.
# Use a tmpfile rewrite instead of `sed -i` — BSD and GNU sed disagree on the
# -i flag's argument form, and the portable approach avoids that pitfall.
tmp_config=$(mktemp 2>/dev/null || echo "${CONFIG_FILE}.tmp.$$")
if [ -f "$CONFIG_FILE" ]; then
  grep -v "^last_check=" "$CONFIG_FILE" > "$tmp_config" 2>/dev/null || true
fi
echo "last_check=$now" >> "$tmp_config"
mv "$tmp_config" "$CONFIG_FILE" 2>/dev/null || rm -f "$tmp_config"

# A global install lives in a dot folder of the home directory
# (~/.agents/skills/alva, ~/.claude/skills/alva, ...); updating it needs -g,
# or the update lands in whatever project the agent runs in.
global_flag=""
case "$SKILL_DIR" in
  "$HOME"/.*/skills/*) global_flag=" -g" ;;
esac

# Notify only when the published release is newer than the installed one
if [ "$update_available" -eq 1 ]; then
  cat <<EOF
Alva skill update available.
  Installed: $local_tag
  Latest:    $remote_tag
Update with one of:
  npx skills add https://github.com/alva-ai/skills/tree/${remote_tag}/skills/alva --skill alva${global_flag} -y
  clawhub update alva
  git clone --branch ${remote_tag} --depth 1 https://github.com/alva-ai/skills ./tmp/alva-skills && cp -r ./tmp/alva-skills/skills/alva/* "${SKILL_DIR}/" && rm -rf ./tmp/alva-skills
EOF
fi
