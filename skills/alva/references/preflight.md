# Preflight

Run this before the first Alva action in a session, and again after context
loss or profile changes.

## Rule 0

`alva <command> --help` is the source of truth. Every time you are about to call
an `alva` CLI command you have not used in this session, run its help first.
The help text is authoritative for subcommands, flags, response fields, naming,
and runnable examples. The `references/api/*.md` files record gotchas the help
text misses; if this skill and help disagree, trust help and note the doc drift.

```bash
alva --help
alva <command> --help
```

## Version And CLI

Run the skill updater:

```bash
bash "<this skill's directory>/scripts/version_check.sh"
```

No output means up to date. Any output should be shown to the user, applied,
and then rechecked.

The Alva CLI (`@alva-ai/toolkit`) is the only supported platform interface for
this skill. If `alva --help` is unavailable, install it. If it is present,
upgrade to the latest version when a task depends on new commands or fixes.

```bash
npm install -g @alva-ai/toolkit
npm install -g @alva-ai/toolkit@latest
```

## ALFS-Native Agent Tool Mode

When this skill is running in a PI/jagent-style agent environment with an
`alva` model tool plus ALFS-native `read`/`write`/`edit` tools, use those tools
for file preparation. Do not route through local-file upload flags such as
`alva fs write --file`, `alva run --local-file`, `--params-schema-file`, or
screenshot `--out`.

In that mode, prepare or edit content directly in ALFS, then call Alva commands
with ALFS paths or inline JSON/data:

- Use `alva fs write --data ...` or the ALFS write/edit tool for source, HTML,
  README, and schema files.
- Use `alva run --entry-path <alfs-js-path>` or `alva run --code <inline-js>`;
  do not use `--local-file`.
- Use `alva functions register --params-schema '<json>'` when the schema was
  prepared in ALFS or memory; do not use `--params-schema-file`.

CLI examples that use local files are fallback instructions for shell-only
Node.js sessions.

Third-party vendor secrets belong in Alva Secret Manager
(`require("secret-manager")`), not CLI config, source files, or chat.

## Auth And User Scope

Run:

```bash
alva whoami
```

If it fails because no API key is configured, run `alva auth login`, then rerun
`alva whoami`.

Capture these session variables:

- `username`: public URLs and ALFS paths.
- `subscription_tier`: `pro` or `free`; controls private/paid playbook flow.
- `active_channel`: `telegram`, `discord`, `slack`, or null; web notifications
  always work, external delivery depends on this field.
- `telegram_username` / `discord_username` / `slack_username`: external IM
  display fields.

All write, deploy, draft, release, and visibility operations must target the
requesting user from `alva whoami`. Do not write to or release under another
namespace unless the user explicitly asks for a cross-user operation such as
remix lineage.

## Arrays JWT

Data Skills require `ARRAYS_JWT`. In `alva whoami`, inspect
`_meta.arrays_jwt`. If it is missing, absent, or has `renewal_needed: true`,
use:

```bash
alva arrays token status
alva arrays token ensure
```

Runtime scripts load it with `secret.loadPlaintext("ARRAYS_JWT")` and call
Arrays endpoints using `Authorization: Bearer <ARRAYS_JWT>`. Do not use
`X-API-Key`.

## Memory

If you have not read the user's Alva memory in this conversation, read it:

```bash
alva fs read --path '~/memory/MEMORY.md'
```

If the index exists, read the files it names, at minimum `user.md`. If
`~/memory/` is absent or empty, skip. Memory is a claim, not truth: verify any
feed, cronjob, preference, or parameter before acting on it in a new session.
Read [memory.md](memory.md) before writing memory.
