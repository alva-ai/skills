# Push Notifications

Use after a playbook is released or kept as draft, or when the user's primary
goal is a recurring digest, threshold tracker, stream watch, or alert.

## Identify Push-Worthy Feeds

Recommend push when a feed produces actionable or time-sensitive content: price
signals, crossovers, breakouts, anomaly alerts, trading instructions, or
periodic research summaries.

Skip static fundamentals, historical snapshots, and low-frequency reference
data.

For heartbeat/watchlist/monitor feeds, recommend quiet behavior: notify only on
material changes. In a new V2 feed, return without appending to the declared
alert output when there is nothing worth sending.

## Choose The Delivery Destination

A personal FEED alert has one viewer-scoped delivery resource per Automation.
That resource can contain Alva channel destinations and verified-account email
at the same time. Updating email does not move or clear the current Alva/IM
destination, and updating Alva channels does not change email.

Read the canonical state before deciding whether a mutation is needed:

```bash
alva automation delivery get --id <automation_id>
```

Update only the field the user requested. Do not read-modify-write the whole
resource:

```bash
# Enable email while preserving every Alva/IM destination.
alva automation delivery update --id <automation_id> --email-enabled

# Disable email while preserving every Alva/IM destination.
alva automation delivery update --id <automation_id> --no-email-enabled

# Replace only Alva destinations. 0 is the default Agent destination.
alva automation delivery update --id <automation_id> --alva-channel-ids 0,123

# Clear only Alva destinations.
alva automation delivery update --id <automation_id> --alva-channel-ids=
```

Email can be enabled only when the account currently has an eligible verified
address. The get/update result returns the complete address because this is an
owner-scoped authenticated resource. Never ask the user to supply an arbitrary
recipient address.

Choose Alva delivery destinations as follows:

Creating a new automation with `alva automation publish` immediately creates
the owner's ACTIVE binding. It uses the owned origin-session channel when one
can be resolved and otherwise uses the default personal destination. Pass
`--skip-auto-trigger` when this binding must be inspected or moved before the
first producer run; the flag skips the run, not the binding.

- **Default personal destination:** omit `--channel-id`. The service stores
  `channel_id=0`; web delivery is available immediately, and external DM
  delivery uses `active_im_provider` plus its matching username from
  `alva whoami`.
- **Alva topic channel:** resolve the feed id and run
  `alva alert enable --automation-ids <id,id> --channel-id <channel_id>`. This
  binds the alert to that in-product web channel. Its channel id is not a
  channel-session id. Topic-channel delivery is web-only. In a channel turn,
  read the current id from
  `<session-prefill-channel-memory channel-id="…">`; a non-`alva` slug denotes
  a topic channel. If the user says "this channel" or "current channel" there,
  this is the required destination.
The name-addressed `alva alert enable --automation <owner>/<feed>` command has
no destination flag. When the user says "this channel", use the id-addressed
form with `--channel-id`; do not silently fall back to the default destination.
Do not infer Telegram, Discord, Slack, or another transport from the generic
`channel` session profile. Only name an external transport when current context
explicitly identifies it; otherwise describe a topic destination as the
`current Alva topic channel (channel id <id>)`.

If no active IM provider exists for the default personal destination, say web
notifications already work and, when `PresentActions` is available, offer one
`open_url` action to <https://alva.ai/settings?tab=alvaAgent> with a short
imperative label; otherwise include that link in the sentence.

## Configure And Verify

A push is set up only after all of these succeed:

1. Declare the intended output with `alertOutput(typeDoc)`. The TypeDoc must
   have a root `body` string field and may have a root `title` string field;
   ordinary extra fields remain ALFS data. For portable buttons, also declare
   `messageActionsField()` and write `openUrlAction()` or
   `sendPromptAction()` values. For a platform-neutral card, declare
   `messagePresentationField()` and write `cardPresentation()`. Discord renders
   the card as one Embed and can attach both action kinds to it; unsupported
   presentation falls back to canonical `title` + `body`. A free-standing
   `url` field does not become a button, and conversational `PresentActions`
   must not be used by a Feed. See
   [Portable Actions And Card Presentation](feed-sdk.md#portable-actions-and-card-presentation).
   Use a descriptive, non-reserved source such as `market/brief` or
   `monitor/anomaly`.
2. Run the feed through [feed-lifecycle.md](feed-lifecycle.md), including
   `before-automation-publish`. Publish creates the owner binding and starts the
   producer once by default. When the destination must be selected explicitly,
   publish with `--skip-auto-trigger`.
3. Exercise a material branch with `alva run`, read `@last/1` of the declared
   output, and confirm it contains a non-empty `body`. Exercise a quiet branch
   and confirm it does not append a new record.
4. Enable publisher push on the cronjob:
   `alva deploy update --id <ID> --push-notify`.
5. Inspect the owner FEED alert created by publish with `alva automation
   delivery get --id <automation_id>` and confirm every requested destination.
   If email was requested, update only email with `alva automation delivery
   update`; this preserves the Alva/IM destination. If an Alva destination is
   missing or wrong, fix it when alert delivery was requested; when optional,
   explain the benefit and offer one `send_prompt` action to enable the named
   Automation's alert. If already correct, do not re-enable it. To select the
   default personal destination, use
   `alva alert enable --automation <owner>/<feed>` or `alva alert enable --automation-ids
   <id,id>`. For the current Alva topic channel, use `alva alert enable --automation-ids
   <id,id> --channel-id <current_channel_id>`; never replace this with the
   name-addressed default-personal command.

Do not trigger the cronjob or wait for its next scheduled run solely to verify
setup. A default publish already admitted the first producer run; triggering it
again duplicates the pipeline. `alva deploy trigger` is not a dry run: after
publish creates the owner binding, Run Now can notify that destination. Use
`alva run` for non-delivering script checks before publish. When publish used
`--skip-auto-trigger`, route the binding first and trigger at most once only if
a real delivery run is required. A successful partial update proves that alert
delivery is configured for that destination without changing the other medium;
an already-correct resource proves the same without another mutation. It does
not prove that a message has already been delivered. An ALFS record alone is
also not delivery proof.
Claim real delivery only when an existing
`alva alert history` row for the intended destination records the run as
`sent`.

If the automation is unpublished, the feed has no declared alert output, or
the material test record has an empty body, do not claim push is set up.
Diagnose and fix first.

Confirm to the user with specifics: which automation alerts are enabled, the
intended destination, what the next push will say, and when it will fire. A
global "subscribed" state is not sufficient evidence that an alert targets the
requested Alva topic channel. For a topic binding, report it as an Alva web
topic channel with its id, never as Telegram or another external DM. For
monitors, say quiet runs skip notifications.

There is no playbook alert target. Following or unfollowing a playbook never
changes alerts. If the user explicitly asks to enable every current automation
behind a playbook, resolve the feed ids from that playbook's latest release and
submit those ids with `alva alert enable --automation-ids <id,id>`. Treat this
as a snapshot: feeds added by a later release are not subscribed automatically.

## Legacy Compatibility

Existing `signal/targets` and `notify/message` producers continue to dispatch
through the legacy fanout path. Keep existing Altra/trading producers intact:
Altra owns `signal/targets`. Do not wrap either reserved source in
`alertOutput()`, and do not use these paths as templates for a new general Feed.
V2 and legacy deliveries both enter the canonical `feed_alert_ready`
notification domain.

`<|SKIP_NOTIFICATION|>` remains a legacy `notify/message` sentinel only. New
V2 feeds express a quiet run by not appending to an alert output. Changing,
adding, or removing an `alertOutput()` declaration in an already active Feed
does not require republishing; the next successful scheduled or Run Now
execution carries the current declarations and writes.

## Inventory And Unsubscribe

- `alva alert list --first 200` — rows carry `kind`, `target_status`, feed
  identity, `feed_status`, and `last_pushed_at_ms` when available. If `items` <
  `total_count`, keep paginating; never report a truncated page as the full
  inventory. Alert enablement is an active `FEED_ALERT`. Social playbook follows
  are separate and must not be used as delivery state.
- `alva alert follows --limit 100` — the playbook follow list. Keep paginating
  with `--cursor` when `has_next` is true.
- Disable by name (`alva alert disable --automation owner/name`) for live
  targets; use `alva alert disable --automation-ids a,b` for bulk and for
  `TARGET_DELETED` feed ghosts (name-addressed calls 404 on deleted targets).
- Use the `target.id` returned by `alva alert list` for a deleted feed row.
- Never probe with mutating calls — the read surface answers all identity
  questions.
