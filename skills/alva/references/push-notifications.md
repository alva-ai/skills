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

## Delivery Channel

Web notifications are always available. External DM delivery depends on
`active_channel` plus a matching `telegram_username`, `discord_username`, or
`slack_username` from `alva whoami`.

If no active IM channel exists, say web notifications will work immediately and
the user can connect Telegram, Discord, or Slack at <https://alva.ai/settings>.

## Configure And Verify

A push is set up only after all of these succeed:

1. Add the intended push sidecar:
   - `signal/targets` for playbook signals and trading targets.
   - `notify/message` for feed completion, AlvaAsk reports, heartbeat checks,
     and proactive alerts.
2. Run the feed through [feed-lifecycle.md](feed-lifecycle.md), including
   `before-automation-publish`.
3. Enable publisher push on the cronjob:
   `alva deploy update --id <ID> --push-notify`.
4. Enable the personal alert: `alva alert enable --automation <owner>/<feed>` or
   `alva alert enable --playbook <owner>/<playbook>`. For groups, use
   `/alva subscribe feed <id>` or `/alva subscribe playbook <id>` in the group.
5. Trigger or wait for a real run, read `@last/1` of the sidecar, and confirm
   the record is fresh and the message is non-empty or contains
   `<|SKIP_NOTIFICATION|>` for a quiet run.

If the automation is unpublished, the feed has no sidecar record, or the record
has an empty body, do not claim push is set up. Diagnose and fix first.

Confirm to the user with specifics: which automation/playbook alert is enabled,
what the next push will say, and when it will fire. For monitors, say quiet runs
skip notifications.

## Inventory And Unsubscribe

- `alva alert list --first 200` — rows carry `kind`, playbook identity,
  `following`, `target_status`. If `items` < `total_count`, keep paginating;
  never report a truncated page as the full inventory.
- `alva alert follows --limit 100` — the playbook follow list. Keep paginating
  with `--cursor` when `has_next` is true.
- Disable by name (`alva alert disable --playbook owner/name` or
  `--automation owner/name`) for live targets; by id
  (`alva alert disable --playbook-ids a,b --automation-ids c`) for bulk and for
  `TARGET_DELETED` ghosts (name-addressed 404s on deleted targets).
- Resolve ids with `alva playbooks get --ids a,b` / `--ref owner/name`; list a
  user's playbooks with `alva playbooks list --owner <username>`.
- Never probe with mutating calls — the read surface answers all identity
  questions.
