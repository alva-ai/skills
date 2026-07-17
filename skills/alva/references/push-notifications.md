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
material changes and emit `<|SKIP_NOTIFICATION|>` otherwise.

## Choose The Delivery Destination

A personal FEED alert has one delivery binding per viewer and feed. Enabling
the same alert for another destination moves the personal alert; it does not
create a second copy. Choose the destination before mutating it:

- **Default personal destination:** omit `--channel-id`. The service stores
  `channel_id=0`; web delivery is available immediately, and external DM
  delivery uses `active_channel` plus its matching username from `alva whoami`.
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

If no active IM channel exists for the default personal destination, say web
notifications will work immediately and the user can connect Telegram,
Discord, or Slack at <https://alva.ai/settings>.

## Configure And Verify

A push is set up only after all of these succeed:

1. Add the intended push sidecar:
   - `signal/targets` for playbook signals and trading targets.
   - `notify/message` for feed completion, AlvaAsk reports, heartbeat checks,
     and proactive alerts.
2. Run the feed through [feed-lifecycle.md](feed-lifecycle.md), including
   `before-automation-publish`.
3. Read `@last/1` of the sidecar written by the lifecycle test and confirm the
   message is non-empty or contains `<|SKIP_NOTIFICATION|>` for a quiet run.
4. Enable publisher push on the cronjob:
   `alva deploy update --id <ID> --push-notify`.
5. Enable the FEED alert for the intended destination using
   [Choose The Delivery Destination](#choose-the-delivery-destination). For the
   default personal destination, use `alva alert enable --automation
   <owner>/<feed>` or `alva alert enable --automation-ids <id,id>`. For the
   current Alva topic channel, use `alva alert enable --automation-ids <id,id>
   --channel-id <current_channel_id>`; never replace this with the
   name-addressed default-personal command.

Do not trigger the cronjob or wait for its next scheduled run solely to verify
setup. A successful enable proves that alert delivery is configured for the
selected destination; it does not prove that a message has already been
delivered. A sidecar record alone is also not delivery proof. Claim real
delivery only when an existing `alva alert history` row for the intended
destination records the run as `sent`.

If the automation is unpublished, the feed has no sidecar record, or the record
has an empty body, do not claim push is set up. Diagnose and fix first.

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
