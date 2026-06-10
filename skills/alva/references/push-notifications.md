# Push Notifications

Use after a playbook is released or kept as draft, or when the user's primary
goal is a recurring digest, threshold tracker, stream watch, or alert.

## Identify Push-Worthy Feeds

Recommend push when a feed produces actionable or time-sensitive content:
price signals, crossovers, breakouts, anomaly alerts, trading instructions, or
periodic research summaries.

Skip static fundamentals, historical snapshots, and low-frequency reference
data.

For heartbeat/watchlist/monitor feeds, recommend quiet behavior: notify only
on material changes and emit `<|SKIP_NOTIFICATION|>` otherwise.

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
   `before-feed-release`.
3. Enable publisher push on the cronjob:
   `alva deploy update --id <ID> --push-notify`.
4. Subscribe the target:
   `alva subscriptions subscribe-feed --username <owner> --name <feed>`
   or
   `alva subscriptions subscribe-playbook --username <owner> --name <playbook>`.
   For groups, use `/alva subscribe feed <id>` or
   `/alva subscribe playbook <id>` in the group.
5. Trigger or wait for a real run, read `@last/1` of the sidecar, and confirm
   the record is fresh and the message is non-empty or contains
   `<|SKIP_NOTIFICATION|>` for a quiet run.

If the feed is unreleased, has no sidecar record, or has an empty body, do not
claim push is set up. Diagnose and fix first.

Confirm to the user with specifics: which feed/playbook is subscribed, what the
next push will say, and when it will fire. For monitors, say quiet runs skip
notifications.

## Three Concepts Named "Subscribe"

Disambiguate before acting on "subscribe"/"unsubscribe" requests — three
distinct relations share the word:

| Concept | What it is | Surface |
|---|---|---|
| **follow** | Social relation (the UI's "Subscribed Playbooks") | `alva subscriptions follows` |
| **alerts** | Push/notification opt-ins | `alva subscriptions list` |
| **purchase** | Paid playbook access / SaaS plan | NOT the subscriptions command |

`subscribe-playbook` touches the first two (follow + playbook-level alert,
one call) and reports both on unsubscribe (`{unfollowed,
wildcard_disabled}`). Never route an "unsubscribe" request to anything
billing-related without explicit confirmation.

## Inventory And Unsubscribe

To answer "what am I subscribed to" or "unsubscribe me from X":

1. `alva subscriptions list --first 200` — every row is self-describing:
   - `kind`: `PLAYBOOK_ALERTS` (playbook-level wildcard) or `FEED_ALERT`;
   - `playbook {owner_username, name, display_name}` for playbook rows —
     never guess names from bare ids;
   - `following`: whether the playbook is also followed;
   - `target_status`: `ACTIVE` | `TARGET_DELETED` (ghost row — the target
     was deleted) | `PAUSED`;
   - `total_count`: when `items` length is below it, keep paginating with
     `--cursor` — never report a truncated page as the full inventory.
2. `alva subscriptions follows` — the follow list, with identity per row.
3. Unsubscribe:
   - by name (live targets):
     `alva subscriptions unsubscribe-playbook|unsubscribe-feed --username
     <owner> --name <name>`;
   - by TARGET ID (bulk, idempotent, and the ONLY way to clear
     `TARGET_DELETED` ghosts — name-addressed unsubscribe 404s on deleted
     targets):
     `alva subscriptions unsubscribe --playbook-ids <a,b> --feed-ids <c>`.
4. Resolve unknown ids with `alva playbooks get --ids <a,b>` (or
   `--ref <owner/name>`), and enumerate a user's playbooks with
   `alva playbooks list --owner <username>`.

Never probe with mutating calls (subscribe-then-unsubscribe to learn an id,
unsubscribe as an existence check) — the read surface above answers every
identity question.
