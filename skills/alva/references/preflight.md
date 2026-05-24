# Help-First Preflight

Read this before using Alva in a session. It owns Rule 0, CLI setup,
authentication, profile capture, Arrays token status, and memory loading.

## Rule 0: help is authoritative

Every time you are about to call an `alva` CLI command you have not used in
this session, run its help first:

```bash
alva --help
alva <command> --help
```

The help text is the source of truth for subcommands, flags, response fields,
naming conventions, and runnable examples. The `references/api/*.md` files only
record gotchas the help text misses or currently states incorrectly. If a
reference and `--help` disagree on a flag, trust `--help` and tell the user the
doc needs an update.

## Session preflight

Run these checks once per session before any Alva work:

1. **Version check**

   ```bash
   bash "<this skill's directory>/scripts/version_check.sh"
   ```

   No output means up to date. If output appears, show it to the user, apply the
   update, then proceed.

2. **CLI setup**

   The `alva` CLI (`@alva-ai/toolkit`) is the only supported way this skill
   interacts with Alva. Check whether it is installed:

   ```bash
   alva --help
   ```

   If missing, install it:

   ```bash
   npm install -g @alva-ai/toolkit
   ```

   If present, upgrade before substantial work:

   ```bash
   npm install -g @alva-ai/toolkit@latest
   ```

   Third-party vendor secrets belong in Alva Secret Manager, not in CLI config.

3. **Authentication check**

   Run:

   ```bash
   alva whoami
   ```

   If it fails because no API key is configured, run `alva auth login`, then
   rerun `alva whoami`.

4. **Capture session variables**

   Keep these from `alva whoami`:

   - `username`: public URLs and ALFS paths.
   - `subscription_tier`: `pro` or `free`; determines private/public release
     flow.
   - `active_channel`: `telegram`, `discord`, or null; web notifications always
     work, this controls external DM delivery.
   - `telegram_username` / `discord_username`: external delivery requires the
     active channel to match a non-empty display field.
   - `_meta.arrays_jwt`: data-skills token status.

5. **Arrays JWT check**

   Data skills require `ARRAYS_JWT`. If `_meta.arrays_jwt` is missing,
   `renewal_needed: true`, or absent, use:

   ```bash
   alva arrays token status
   alva arrays token ensure
   ```

   In runtime code, load the token from Secret Manager as
   `secret.loadPlaintext("ARRAYS_JWT")`.

6. **Load memory**

   If you have not read the user's memory in this conversation, read:

   ```bash
   alva fs read --path '~/memory/MEMORY.md'
   ```

   If it exists, read every file listed in the index, at minimum `user.md`.
   If `~/memory/` does not exist or is empty, skip it. See
   [memory.md](memory.md) for the storage layout, write rules, and the
   "memory is a claim, not truth" rule.

## Help-first command routing

Before acting on a command family, run help and then read the listed reference
when the task touches that command's gotchas:

| Command | Reference to open |
| --- | --- |
| `fs` | [api/filesystem.md](api/filesystem.md) before feed data suffixes, public grants, or synth mounts |
| `release` | [api/release.md](api/release.md) before feed release, playbook draft, playbook release, README, tags, or `--skill-id` |
| `trading` | [api/trading.md](api/trading.md) before `execute`, signal JSON, exchange/symbol naming, or live/paper operations |
| `deploy` | [deployment.md](deployment.md) before cronjob creation, update, debugging, or deletion |
| `data-skills` | [data-skills.md](data-skills.md) before Arrays discovery or endpoint calls |
| `skillhub` | [request-routing.md](request-routing.md) when `/use-skill:` appears or you fetch a blueprint |
| `comments` | [creators-note.md](creators-note.md) before posting or pinning a creator's note |
| `secrets` | [secret-manager.md](secret-manager.md) before uploading, naming, rotating, listing, or using secrets |
| `push-subscriptions` / `channel` | [push-notifications.md](push-notifications.md) before claiming push is configured |
| `remix` | [remix-workflow.md](remix-workflow.md) before lineage registration |
| `screenshot` | [playbook-release.md](playbook-release.md) before visual verification |

For programmatic HTTP error handling, read
[api/error-responses.md](api/error-responses.md).
