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

# Write .env, preserving all fields
write_check() {
  cat >"$CONFIG_FILE" <<EOF
ALVA_API_KEY=${ALVA_API_KEY:-}
ALVA_ENDPOINT=${ALVA_ENDPOINT:-https://api-llm.${ENV:-prd}.alva.ai}
last_check=$1
ENV=${ENV:-prd}
EOF
}

# Load .env variables: ALVA_API_KEY, ALVA_ENDPOINT, last_check, ENV
if [ -f "$CONFIG_FILE" ]; then
  source "$CONFIG_FILE"
fi

# Default ENV to prd if empty
if [ -z "${ENV:-}" ]; then
  ENV=prd
  _env_changed=1
fi

# Default ALVA_ENDPOINT based on ENV if empty
if [ -z "${ALVA_ENDPOINT:-}" ]; then
  ALVA_ENDPOINT="https://api-llm.${ENV}.alva.ai"
  _env_changed=1
fi

# Persist defaults back to .env if anything was missing
if [ "${_env_changed:-}" = "1" ]; then
  write_check "${last_check:-0}"
fi

# Symlink to ~/.alva.env for short access
SYMLINK="$HOME/.alva.env"
if [ ! -L "$SYMLINK" ] || [ "$(readlink "$SYMLINK")" != "$CONFIG_FILE" ]; then
  ln -sf "$CONFIG_FILE" "$SYMLINK"
fi

# Skip version check for local/stg environments (env vars and symlink already set above)
if [ "${ENV:-}" = "local" ] || [ "${ENV:-}" = "stg" ]; then
  write_check "${last_check:-0}"
  exit 0
fi

# Throttle: skip if checked recently
if [ -n "${last_check:-}" ]; then
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
