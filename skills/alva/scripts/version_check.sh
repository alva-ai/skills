#!/usr/bin/env bash
# Read-only version notice for the immutable @alva/alva-slim release line.
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SKILL_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
SKILL_MD="$SKILL_DIR/SKILL.md"
PACKAGE="@alva/alva-slim"
RELEASES_PATH="/alva/registry/skill/alva/alva-slim/releases"
REGISTRY_ENDPOINT="${ALVA_SLIM_REGISTRY_ENDPOINT:-https://api-llm.prd.alva.ai}"
REGISTRY_ENDPOINT="${REGISTRY_ENDPOINT%/}"

fail() {
  printf 'Alva Slim version check failed: %s\n' "$1" >&2
  exit 1
}

if [ ! -f "$SKILL_MD" ]; then
  fail "local SKILL.md is missing"
fi

local_version=$(sed -n 's/^[[:space:]]*version:[[:space:]]*\(v0\.[0-9][0-9]*\.[0-9][0-9]*\)[[:space:]]*$/\1/p' "$SKILL_MD" | head -1)
if [ -z "$local_version" ]; then
  fail "local Slim version is missing or invalid"
fi

if ! response=$(curl -fsS --max-time 5 --get \
  --data-urlencode "path=$RELEASES_PATH" \
  "$REGISTRY_ENDPOINT/api/v1/fs/readdir"); then
  fail "registry request failed"
fi

versions=$(printf '%s' "$response" \
  | grep -oE '"name"[[:space:]]*:[[:space:]]*"v0\.[0-9]+\.[0-9]+"' \
  | sed -E 's/.*"(v0\.[0-9]+\.[0-9]+)"/\1/')
if [ -z "$versions" ]; then
  fail "no stable v0 releases were returned"
fi

version_is_newer() {
  local left_major left_minor left_patch right_major right_minor right_patch
  IFS=. read -r left_major left_minor left_patch <<EOF
${1#v}
EOF
  IFS=. read -r right_major right_minor right_patch <<EOF
${2#v}
EOF
  if ((10#$left_major != 10#$right_major)); then
    ((10#$left_major > 10#$right_major))
  elif ((10#$left_minor != 10#$right_minor)); then
    ((10#$left_minor > 10#$right_minor))
  else
    ((10#$left_patch > 10#$right_patch))
  fi
}

latest="v0.0.0"
while IFS= read -r version; do
  if version_is_newer "$version" "$latest"; then
    latest="$version"
  fi
done <<EOF
$versions
EOF

if version_is_newer "$latest" "$local_version"; then
  cat <<EOF
Alva Slim update available.
  Installed: $local_version
  Latest:    $latest
Reload or install the exact package $PACKAGE@$latest through the active Alva
Skill package resolver. Keep the package on the Alva Slim v0 release line.
EOF
fi
