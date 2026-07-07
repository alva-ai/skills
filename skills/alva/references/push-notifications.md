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
   `alva channel group-subscriptions subscribe --session-id <id> --target-type feed --target-id <feed_id>`
   or the same command with `--target-type playbook --target-id <playbook_id>`.
5. Trigger or wait for a real run, read `@last/1` of the sidecar, and confirm
   the record is fresh and the message is non-empty or contains
   `<|SKIP_NOTIFICATION|>` for a quiet run.
6. Check delivery history with `alva alert history --automation <owner>/<feed>`
   or `alva alert history --playbook <owner>/<playbook>`; filter with
   `--channel`, `--status`, or `--since` when diagnosing a missing push.

If the automation is unpublished, the feed has no sidecar record, or the record
has an empty body, do not claim push is set up. Diagnose and fix first.

Confirm to the user with specifics: which automation/playbook alert is enabled,
what the next push will say, and when it will fire. For monitors, say quiet runs
skip notifications.

## Inventory And Unsubscribe

- `alva alert list --first 200` lists personal alert opt-ins. Rows carry
  `kind`, `target`, `target_status`, feed or playbook identity, and pagination
  fields. If `items` < `total_count`, keep paginating; never report a truncated
  page as the full inventory. Use `--json` when ids or raw statuses matter.
- `alva subscriptions follows` lists playbook follows, not the alert inventory.
  Use it only when the user asks what they follow.
- Disable live personal alerts by name: `alva alert disable --automation owner/name`
  or `alva alert disable --playbook owner/name`.
- Disable in bulk or clear `TARGET_DELETED` ghosts by target id:
  `alva alert disable --automation-ids c --playbook-ids a,b`.
  `--feed-ids` is only a legacy alias for `--automation-ids`; prefer
  `--automation-ids` in new docs and examples.
- Resolve ids with `alva playbooks get --ids a,b` / `--ref owner/name`; list a
  user's playbooks with `alva playbooks list --owner <username>`.
- Group subscriptions are separate from personal alerts. Inspect them with
  `alva channel group-subscriptions context --session-id <id>` and
  `alva channel group-subscriptions list --session-id <id>`; remove one with
  `alva channel group-subscriptions unsubscribe --session-id <id> --target-type feed --target-id <feed_id>`
  or the playbook variant.
- Use `alva alert preferences`, `alva alert enable-session-completed`, and
  `alva alert disable-session-completed` only for global alert preferences.
- Never probe with mutating calls — the read surface answers all identity
  questions.
