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

if ! versions=$(printf '%s' "$response" | node -e '
let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => { input += chunk; });
process.stdin.on("end", () => {
  try {
    const body = JSON.parse(input);
    if (body === null || typeof body !== "object" || Array.isArray(body)) throw new Error();
    if (!Array.isArray(body.entries) || body.entries.length === 0) throw new Error();
    const names = [];
    const seen = new Set();
    for (const entry of body.entries) {
      if (entry === null || typeof entry !== "object" || Array.isArray(entry)) throw new Error();
      if (entry.is_dir !== true) throw new Error();
      if (typeof entry.name !== "string" || !/^v0\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(entry.name)) {
        throw new Error();
      }
      if (seen.has(entry.name)) throw new Error();
      seen.add(entry.name);
      names.push(entry.name);
    }
    process.stdout.write(names.join("\n"));
  } catch {
    process.exitCode = 1;
  }
});
'); then
  fail "registry response is invalid"
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
