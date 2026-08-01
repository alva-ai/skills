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

if ! update_version=$(printf '%s' "$response" | node -e '
let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => { input += chunk; });
process.stdin.on("end", () => {
  try {
    const versionPattern = /^v0\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
    const parseVersion = (value) => {
      const match = versionPattern.exec(value);
      if (!match) throw new Error();
      return [0n, BigInt(match[1]), BigInt(match[2])];
    };
    const compareVersions = (left, right) => {
      for (let index = 0; index < left.length; index += 1) {
        if (left[index] < right[index]) return -1;
        if (left[index] > right[index]) return 1;
      }
      return 0;
    };
    const localVersion = process.argv[1];
    const localParts = parseVersion(localVersion);
    const body = JSON.parse(input);
    if (body === null || typeof body !== "object" || Array.isArray(body)) throw new Error();
    if (!Array.isArray(body.entries) || body.entries.length === 0) throw new Error();
    const names = [];
    const seen = new Set();
    for (const entry of body.entries) {
      if (entry === null || typeof entry !== "object" || Array.isArray(entry)) throw new Error();
      if (entry.is_dir !== true) throw new Error();
      if (typeof entry.name !== "string") throw new Error();
      parseVersion(entry.name);
      if (seen.has(entry.name)) throw new Error();
      seen.add(entry.name);
      names.push(entry.name);
    }
    let latest = names[0];
    for (const name of names.slice(1)) {
      if (compareVersions(parseVersion(name), parseVersion(latest)) > 0) latest = name;
    }
    if (compareVersions(parseVersion(latest), localParts) > 0) process.stdout.write(latest);
  } catch {
    process.exitCode = 1;
  }
});
' "$local_version"); then
  fail "registry response is invalid"
fi

if [ -n "$update_version" ]; then
  cat <<EOF
Alva Slim update available.
  Installed: $local_version
  Latest:    $update_version
Reload or install the exact package $PACKAGE@$update_version through the active Alva
Skill package resolver. Keep the package on the Alva Slim v0 release line.
EOF
fi
