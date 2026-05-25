# Push Notifications

Read this after a playbook is released or kept as draft, and before claiming
push alerts are configured. This file owns push-worthy feed selection,
publisher setup, subscriptions, and verification.

## Mental model

Subscriptions target feed or playbook resources, not output paths. The output
path only chooses the feed-alert source:

| Output stream | Feed-alert source | Use for |
| --- | --- | --- |
| `signal/targets` | `signal/targets` | Playbook signals, trading targets, actionable alerts |
| `notify/message` | `notify/message` | Feed results, AlvaAsk reports, heartbeat checks, proactive alerts |

Both dispatch the canonical `feed_alert_ready` event. Do not use legacy event
names such as `playbook_data_ready` or `feed_run_complete` in new docs or
instructions.

`--push-notify` marks the cronjob publisher as capable of emitting alerts. It
does not subscribe anyone and does not bypass notification preferences. Delivery
requires an explicit personal or group subscription to the feed or to a
playbook that references the feed.

For `notify/message`, a `body` or `text` containing `<|SKIP_NOTIFICATION|>`
advances fanout without sending a user-visible push. Use it for quiet AlvaAsk,
heartbeat, and monitor runs.

Schema examples live in [feed-sdk.md](feed-sdk.md) Patterns D/E.

## Identify push-worthy feeds

After the draft/release flow in [playbook-release.md](playbook-release.md),
proactively inspect the playbook's feeds.

Recommend push for actionable, time-sensitive outputs:

- price signals,
- crossovers and breakouts,
- trading instructions,
- anomaly detection,
- periodic research summaries,
- heartbeat/watchlist/monitor feeds that notify only on material changes.

Skip static fundamentals, historical snapshots, and low-frequency reference
data.

If no feed qualifies, skip the push flow.

## Check delivery channel

Web notifications always work. For external DM delivery, read `active_channel`,
`telegram_username`, and `discord_username` from `alva whoami`.

- If Telegram or Discord is active and has a matching display field, proceed.
- If no active IM channel exists, still recommend push and tell the user web
  notifications work immediately; to also receive Telegram or Discord, connect
  and activate a channel at <https://alva.ai/settings>.

## Recommendation

Present a concrete recommendation:

> This playbook's BTC EMA crossover signal feed produces alerts when the trend
> flips. Want to enable push notifications for it?

For monitors, say quiet behavior up front: material changes notify; quiet checks
emit `<|SKIP_NOTIFICATION|>` without pushing.

If the user says yes, configure end-to-end. If no, move on. If they request a
different feed, honor that choice.

## Configure and verify

A push is set up only after every step succeeds:

1. Add the intended sidecar:
   - `signal/targets` for signal-style alerts.
   - `notify/message` for feed completion, reports, or monitor text.
   - For skippable AlvaAsk feeds, prompt the feed to output only
     `<|SKIP_NOTIFICATION|>` when no update is material.
2. Run the feed through [feed-lifecycle.md](feed-lifecycle.md), including
   `before-feed-release`.
3. Enable the flag:

   ```bash
   alva deploy update --id <ID> --push-notify
   ```

4. Subscribe the delivery target:

   ```bash
   alva push-subscriptions subscribe-feed --username <owner> --name <feed>
   alva push-subscriptions subscribe-playbook --username <owner> --name <playbook>
   ```

   For group push, use `/alva subscribe feed <id>` or
   `/alva subscribe playbook <id>` in the group.

5. Verify `alva release feed --cronjob-id <this cronjob>` ran after the sidecar
   was added. This must be the current released feed for the same cronjob; a
   previous release before the sidecar change is not enough.
6. Trigger a real run or wait for the next cron fire, then read `@last/1` of the
   configured sidecar. Confirm the record is fresh and body/text is non-empty or
   contains `<|SKIP_NOTIFICATION|>`.
7. Confirm to the user with specifics: subscribed feed/playbook, what the next
   push will say, and when it will fire. For monitors, say quiet runs skip
   notifications.

If the feed is unreleased, the run has no record, or the body is empty, do not
claim push is set up. Do not claim push is set up until release, subscription,
and real-run verification all succeed. Diagnose missing release, missing
sidecar write, wrong path, or run failure, then fix it.
