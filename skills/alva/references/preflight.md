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

This skill runs with an authenticated `alva` model tool and ALFS-native
`read`/`write`/`edit` tools. Use the native file tools for every ALFS artifact,
including workspace files, memory, playbooks, feed source, feed output,
directory projections such as `@last/N`, and readable cross-user paths. Use
the `alva` tool for platform control-plane operations.

Prepare and edit content directly in ALFS, then call Alva commands with ALFS
paths or inline JSON/data:

- Use the native write/edit tools for source, HTML, README, and schema files.
- Use `alva run --entry-path <alfs-js-path>` or `alva run --code <inline-js>`.
- Use `alva functions register --params-schema '<json>'` for JSON Schema.
- Keep screenshot results in the tool response unless a task explicitly needs
  a persisted ALFS artifact.

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
- `active_im_provider`: `telegram`, `discord`, `slack`, or empty; web
  notifications always work, external delivery depends on this field.
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

If you have not read the user's Alva memory index in this conversation, use the
native read tool on `~/memory/MEMORY.md`.

If `~/memory/` is absent or empty, skip the global scope. `MEMORY.md` and
`user.md` are default context when present; read `user.md` and topic files only
when they exist or are named by the index/relevant to the task. Pack files are
read on demand. Read [memory.md](memory.md) before writing memory.

**Channel sessions:** if the prefill includes a
`<session-prefill-channel-memory root="...">` block, the channel has its own
memory alongside `~/memory/`. Read that root's `MEMORY.md` when present too,
even when `~/memory/` is empty — the index is separate. Channel roots do not
have their own `user.md`. Write channel-specific facts there; keep user-global
facts in `~/memory/user.md`. Do not load full `journal/` history at startup; use
the bounded Carry Forward prelude when supplied or read a relevant day on demand.
For feature- or skill-specific facts, first resolve the scope root: use
`~/memory/` by default; use the prefill channel root only for facts specific to
this channel; do not invent a channel root when no prefill block is present.
Then write the pack under `<resolved-scope-root>/packs/<pack-name>/`, for
example `<resolved-scope-root>/packs/alvest/`, with `MEMORY.md`, `state.md`,
`rules.md`, and optional `data/` ledger storage. If a skill helper accepts
`--root`, pass the pack root, not the raw scope root. Pack Markdown files are
read on demand, and append-only ledger streams are never default prompt context.
Memory is a claim, not truth: verify any feed, cronjob, parameter, position,
price, or feed state before acting on it in a new session; apply stable
preferences unless the user corrects them. See [memory.md](memory.md).
