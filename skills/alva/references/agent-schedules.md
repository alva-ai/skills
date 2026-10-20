# Agent Schedules

User agents support OpenAI models only. Omit model/provider for platform
defaults. Do not use Claude models, Anthropic SDK clients or BYOK, or Claude
relay routes. This also applies to automations, feed cronjobs, retries, and
durable agents. Retain historical Claude messages; use OpenAI for subsequent
runs.

Agent Schedules create durable future turns for a Channel Agent or an existing
ALPI Session Inbox. Each Session wake executes its fixed Agent entrypoint; it does not
select an arbitrary producer script. Use `alva deploy` when the occurrence must run a
deterministic producer script; use `alva schedule` when it must ask the Agent to
resume reasoning or judgment in the selected Channel or Session.

When the current Channel exposes `PutSchedule`, `ListSchedules`, and
`ManageSchedule`, use those tools and the Channel profile's consent protocol.
They bind to this Channel; do not replace them with the default-target CLI.
The CLI examples below apply when those tools are not exposed, or when the
user explicitly requests an existing ALPI Session Inbox target. For CLI work,
verify the destination: omitting `--channel-id` targets the default Agent Channel,
which may differ from the topic Channel the user is currently viewing.

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

## Existing Session Inbox

In a standard ALPI Session with Inbox enabled, the embedded `alva` tool targets
its own Inbox automatically. Use `schedule list`, `schedule put`, `schedule pause`,
`schedule resume`, and `schedule delete` without a target argument. The host supplies
the actual Inbox path; the model cannot change the target, identity, or endpoint.
Without an Inbox, embedded schedule commands fail instead of falling back to a Channel.

From the terminal CLI, select the existing Inbox explicitly on every operation:

```bash
alva schedule put --inbox-path /alva/home/alice/sessions/research.inbox.jsonl \
  --name follow-up --message "Recheck the filing" --after PT30M
alva schedule list --inbox-path /alva/home/alice/sessions/research.inbox.jsonl
alva schedule pause --inbox-path /alva/home/alice/sessions/research.inbox.jsonl --name follow-up
alva schedule resume --inbox-path /alva/home/alice/sessions/research.inbox.jsonl --name follow-up
alva schedule delete --inbox-path /alva/home/alice/sessions/research.inbox.jsonl --name follow-up
```

`--inbox-path` and `--channel-id` are mutually exclusive. Omitting both in the
terminal retains the Channel default above. Inbox paths must be canonical absolute
paths under the current human owner's home, not `~`, relative paths, or aliases.
The matching transcript must already exist with a valid Session header; the owner's
managed Alva API key must already be valid. This does not create a Channel, an Agent
record, a replacement Session, or an arbitrary script target.

The Backend Schedule service records the occurrence and a durable AutoRun wake.
AutoRun means persisted work that the Backend worker executes later. It appends a
stable-ID follow-up to the Inbox and executes `$cwd/agent.js` through metered Jagent.
That program reconstructs its tools, prompt and other configuration, then resumes
the same Session ID, cwd, and transcript. Provision the entry file before schedule
creation; see the [durable Agent contract](durable-agent.md).
Future waking is the Backend's responsibility; no client process must stay alive.

A temporary delivery failure before dispatch may defer. After dispatch, a busy
Session lock is terminal and is not retried. Agent execution failure ends this AutoRun without retry.
An unknown execution result is not blindly resent. Unacked messages remain pending
and may replay on ordinary Inbox recovery; no new failure marker is introduced.
An already-acked occurrence does not call the model again.

Pause, resume, and delete affect future schedule admissions; they do not retract
an already-admitted Inbox message or its wake. Verify processing via the transcript's
ack and the AutoRun result, not merely a successful `put` or an appended line.
See [alpi.md](alpi.md) for the distinction from application-level `Agent.ask()`.

## Auto-Trading Consent

Backtests and signals use Altra. Actual
orders require the trading surface, a dry run first, explicit user confirmation
before non-dry-run execution, and [api/trading.md](api/trading.md).
This per-order confirmation rule holds for any order placed in an ordinary
conversation. *Exemption (scheduled occurrences only):* an Agent Schedule
`--message` or verified legacy Channel Loop goal carrying
`[auto-trade-consent: granted <ISO8601-UTC>
record=~/memory/auto-trade-consent.md]` AND whose one-read verification finds
the record MAY place live orders without per-order user confirmation, subject
to dry-run validation, a fresh idempotent intent-id, and trex risk rules.
Verification checks only that the consent record exists: the timestamp is
provenance, not a match key, and a differing `granted_at` after re-grant is not
a mismatch. A missing or unreadable record means NO live orders. This applies
only to Agent Schedule occurrences and verified legacy Channel Loop ticks,
never interactive; recurring schedules also require `--until` or
`--max-occurrences`.

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
