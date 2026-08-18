# Agent Schedules

Agent Schedules create durable future turns for a Channel Agent. They do not
execute an ALFS script. Use `alva deploy` when the occurrence must run a
deterministic producer script; use `alva schedule` when it must ask the Agent to
resume reasoning or judgment in a Channel.

Run `alva schedule --help` before use. The active Toolkit contract is
authoritative if these examples ever drift.

During the cutover, older Toolkit versions may still accept
`alva loop create` while not recognizing `alva schedule`. That old command
creates the legacy Automation/Cronjob/runner resources described below; it is
not an alias for an Agent Schedule. Do not use it for new work. If
`alva schedule --help` is unavailable, a Toolkit upgrade is required before
creating a new Schedule. Existing legacy Loops can still be managed with the
Automation lifecycle commands in this reference.

## Future Channel Agent Turns

`put` creates or replaces a Schedule by its stable name:

```bash
alva schedule put \
  --name market-open \
  --message "Review the market open and report material changes" \
  --cron "30 9 * * 1-5" \
  --timezone America/New_York \
  --until "2026-12-31T21:00:00Z"
```

Choose exactly one of `--after`, `--at`, `--every`, or `--cron`:

```bash
# One future turn, relative to the current request.
alva schedule put --name follow-up --message "Recheck the filing" --after PT30M

# One future turn at an absolute instant.
alva schedule put --name earnings --message "Review released results" \
  --at "2026-08-20T20:05:00Z"

# Fixed-interval recurrence.
alva schedule put --name thesis-check --message "Re-evaluate the thesis" \
  --every PT6H --max-occurrences 8
```

Cron rules require an IANA `--timezone`. `--starts-at`, `--until`, and
`--max-occurrences` are recurrence bounds and therefore apply only to `--every`
and `--cron`; `--at` and `--after` do not accept them. Schedule-semantic
timestamps and durations use whole seconds. Do not truncate or round a
fractional input; ask for or construct a whole-second value. `after` is resolved
from the time of each request, so a retry must send `--after` again rather than
reuse a previously calculated timestamp.

Omit `--channel-id` for the authenticated user's Agent Channel. Supply it only
when the user explicitly selected another owned Channel. The engine persists
and hands off each occurrence as a durable Channel turn; the CLI does not need
to stay running.

`put` replaces the complete definition for that name. Read the existing
Schedule before changing one field, then send the intended complete rule,
bounds, and message:

```bash
alva schedule list
alva schedule pause --name market-open
alva schedule resume --name market-open
alva schedule delete --name market-open
```

Pause and resume affect future occurrences. Delete removes the named Schedule.
Do not claim an occurrence ran merely because `put` succeeded; use the returned
status, `nextFireAt`, and subsequent Channel turn as the relevant evidence.

## Auto-Trading Consent

Interactive orders still require explicit per-order confirmation. A scheduled
auto-trading instruction may use the narrow exception in `SKILL.md` only when:

1. the user explicitly grants it;
2. the Schedule `--message` carries the canonical consent reference;
3. each occurrence performs the required one-read record verification;
4. the recurring Schedule is bounded by `--until` or `--max-occurrences`; and
5. dry-run, fresh intent-id, and trex risk rules still pass.

Do not copy consent from an old Loop or another Schedule during migration. A
new Schedule needs the user's explicit consent-bearing message.

## Legacy Channel Loop Compatibility

Toolkit versions before the named Schedule cutover created a legacy Channel
Loop as three existing resources:

- an Automation whose description begins with `Channel loop:`;
- a producer Cronjob pointing to `~/loops/_runner/index.js`; and
- the shared runner file in ALFS.

These rows are not Agent Schedules. `alva schedule list` does not list legacy
loops, and replacing a legacy Loop with a same-named Schedule does not stop the
old Cronjob. Do not create new legacy loops and do not recreate the retired
`alva loop create` command in shell code.

The removed Loop CLI is not required to manage existing rows. Inventory all
statuses, inspect candidates as JSON, and confirm both the description and
producer before mutation:

```bash
alva automation list --status all --json
alva automation inspect --id <automation_id> --json
alva deploy get --id <cronjob_id>
```

Only treat an Automation as a legacy Loop when the inspect result has the
`Channel loop:` description and its producer path is
`~/loops/_runner/index.js`. A `loop-` name alone is not proof.

Use the normal Automation lifecycle for the existing Loop:

```bash
alva automation stop --id <automation_id>
alva automation resume --id <automation_id>
alva automation delete --id <automation_id>
```

Deletion removes the producer Cronjob on a best-effort basis. If cleanup
matters, verify the returned result and confirm the former Cronjob no longer
exists; do not delete the shared runner while any legacy Loop still references
it.

When the user explicitly requests migration, inspect and record the legacy
goal, cadence, remaining bounds, target Channel, producer id, and consent state.
Then stop the old Automation and verify it is quiescent before creating the
named Schedule: no future tick is admitted, and any already-admitted run has
finished or failed. If quiescence cannot be confirmed, do not activate the
replacement. After the new Schedule is created and verified, keep the old
Automation stopped until the user accepts deletion. If Schedule creation is
uncertain, list Schedules before deciding whether to resume the old Automation;
never run both. There is no automatic history, run-count, or
in-flight-occurrence migration.
