#!/usr/bin/env bash

# Return success only when the first SemVer prerelease is newer than the second.
alva_prerelease_is_newer() {
  local remote_pre="$1"
  local local_pre="$2"
  local LC_ALL=C
  local remote_ids local_ids
  IFS=. read -r -a remote_ids <<< "$remote_pre"
  IFS=. read -r -a local_ids <<< "$local_pre"

  local identifier
  for identifier in "${remote_ids[@]}" "${local_ids[@]}"; do
    [[ "$identifier" =~ ^[0-9A-Za-z-]+$ ]] || return 1
    if [[ "$identifier" =~ ^[0-9]+$ && \
          ${#identifier} -gt 1 && "$identifier" == 0* ]]; then
      return 1
    fi
  done

  local limit=${#remote_ids[@]}
  if ((${#local_ids[@]} < limit)); then
    limit=${#local_ids[@]}
  fi

  local index remote_id local_id
  for ((index = 0; index < limit; index++)); do
    remote_id="${remote_ids[$index]}"
    local_id="${local_ids[$index]}"
    [[ "$remote_id" == "$local_id" ]] && continue

    if [[ "$remote_id" =~ ^[0-9]+$ && "$local_id" =~ ^[0-9]+$ ]]; then
      ((10#$remote_id > 10#$local_id)) && return 0
      return 1
    fi
    [[ "$remote_id" =~ ^[0-9]+$ ]] && return 1
    [[ "$local_id" =~ ^[0-9]+$ ]] && return 0
    [[ "$remote_id" > "$local_id" ]] && return 0
    return 1
  done

  ((${#remote_ids[@]} > ${#local_ids[@]}))
}

# Return success only when the first SemVer is newer than the second.
# Release tags use a leading "v"; build metadata does not affect precedence.
alva_version_is_newer() {
  local remote_version="${1#v}"
  local local_version="${2#v}"
  remote_version="${remote_version%%+*}"
  local_version="${local_version%%+*}"

  local remote_pre=""
  local local_pre=""
  if [[ "$remote_version" == *-* ]]; then
    remote_pre="${remote_version#*-}"
    remote_version="${remote_version%%-*}"
  fi
  if [[ "$local_version" == *-* ]]; then
    local_pre="${local_version#*-}"
    local_version="${local_version%%-*}"
  fi

  local remote_major remote_minor remote_patch remote_extra
  local local_major local_minor local_patch local_extra
  IFS=. read -r remote_major remote_minor remote_patch remote_extra <<< "$remote_version"
  IFS=. read -r local_major local_minor local_patch local_extra <<< "$local_version"

  local value
  for value in \
    "$remote_major" "$remote_minor" "$remote_patch" \
    "$local_major" "$local_minor" "$local_patch"; do
    [[ "$value" =~ ^[0-9]+$ ]] || return 1
  done
  [[ -z "$remote_extra" && -z "$local_extra" ]] || return 1

  local remote_parts=("$remote_major" "$remote_minor" "$remote_patch")
  local local_parts=("$local_major" "$local_minor" "$local_patch")
  local index
  for index in 0 1 2; do
    if ((10#${remote_parts[$index]} > 10#${local_parts[$index]})); then
      return 0
    fi
    if ((10#${remote_parts[$index]} < 10#${local_parts[$index]})); then
      return 1
    fi
  done

  # A stable release is newer than a prerelease of the same core version.
  [[ -z "$remote_pre" && -n "$local_pre" ]] && return 0
  [[ -n "$remote_pre" && -z "$local_pre" ]] && return 1
  [[ -z "$remote_pre" && -z "$local_pre" ]] && return 1
  alva_prerelease_is_newer "$remote_pre" "$local_pre"
}
