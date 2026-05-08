# Language

Canonical vocabulary for user-facing responses. Use product terms exactly:
do not expose internal platform names, Unix infrastructure jargon, producer
objects, or implementation details. Consistent language is the point; do not
drift into synonyms or technical equivalents.

## Terms

**Automation**
A recurring Alva task that refreshes data, checks market conditions, or sends
updates on a schedule. This is the default user-facing label for the thing that
keeps a playbook, alert, or Agent-created monitor current.
_Avoid_: feed, feed major, cronjob, cron job, scheduled job, deploy job,
pipeline job, worker.

**Playbook**
A hosted investing app on Alva that shows analysis, dashboards, screeners, or
trading signals to the user and their followers.
_Avoid_: app, report (unless the playbook is literally a report).

**Alert / Notification**
A delivered update from Alva Agent, a playbook, or an automation. Use this when
the user cares that something was sent or will be sent.
_Avoid_: push payload, fanout, notification event, dispatch event.

**Agent**
The user's ongoing Alva assistant relationship across Web, Telegram, and
Discord. Use this for conversation continuity, memory, persona, and proactive
follow-up.
_Avoid_: bot runtime, channel session, worker.

**Feed**
Internal or diagnostic term for the underlying data source behind an automation
or playbook release. Do not introduce it in normal user-facing prose. Use it
only when the user is looking at logs, raw data, API fields, release references,
or an Automation detail that already exposes the term. Define it once as "the
underlying data source for this automation."
_Avoid as default user wording_: feed, feed major, feed producer.

**Script**
JavaScript code that runs on Alva Cloud. Use this when explaining what the
agent is building internally.
_Avoid_: jagent script, V8 isolate, sandboxed runtime — these are
implementation details invisible to the user.

## Principles

- **Match the user's expertise.** If they ask "what is X?", assume they do not
  know the internal model and give the shortest useful explanation.
- **Users see product outcomes.** Default to playbook, automation, alert,
  notification, Agent, portfolio, trade, refresh, and analysis. Keep feed,
  cronjob, storage, scheduler, and runtime terms behind the product surface.
- **Say what it does, not how it works.** "Your automation runs every hour"
  not "your cronjob executes on a 1h cron schedule."
- **Expose outcomes, not mechanics.** "Your playbook updates automatically"
  not "the cronjob triggers a feed run which writes to ALFS."
- **CLI flags and API field names stay internal.** `--cronjob-id`, `cron_expression`,
  `entry_path` — none of these appear in user-facing prose.
- **Explain visible behavior first.** Start with what the user can see, then
  explain why.
- **Translate internal identifiers.** Field names, paths, logs, API parameters,
  and scheduler terms should become user concepts: when it refreshed, what date
  the page shows, what changed, what stayed the same, what happens next.
- **Define unavoidable jargon once.** If an internal term is necessary because
  the user is looking at logs, code, or raw data, add a one-clause explanation.
- **Feed stays behind Automation.** Say "automation", "underlying data source",
  "latest refresh", or "run history" unless the user is explicitly debugging
  feed-level details.
- **Do not teach the storage model by default.** Avoid buckets, dedupe,
  latest-wins, filesystem paths, epoch milliseconds, UTC day boundaries,
  scheduler expressions, cache keys, and raw record shapes unless needed.

## Internal-to-User Translation

Before using any internal term, ask: "What does this mean in the product?"
Use a plain label first, and put the internal name in parentheses only when it
helps debugging.

Examples:

- "Refresh time" instead of "write timestamp" or a raw timestamp field.
- "Analysis date" instead of a day key, partition key, or date field.
- "Next refresh" instead of a scheduler expression or trigger name.
- "Underlying data source" instead of "feed" when the user only needs to
  understand where the playbook data comes from.
- "Latest version for that day" instead of same-key overwrite, dedupe, or
  latest-wins.
- "The source data barely changed" instead of no-op run, unchanged snapshot, or
  stable input hash.
- "The page is reading the previous available data" instead of cache hit, stale
  read, empty result fallback, or missing partition.

## Freshness Explanations

When a user says data "didn't update" or "looks stale":

- State the plain conclusion first.
- Explain the visible reasons.
- Offer the fix in product language.

Avoid this style:

> `recordDate` is UTC start-of-day and same-date dedup keeps the max
> `generatedAt`, so `narrative/records/@last/5` returns one row.

Prefer this style:

> The playbook did refresh five hours ago. It looks unchanged because the page
> groups all refreshes from the same market day together, and the newest run
> reached the same conclusion as the earlier one.

For example, if a user asks "I don't know what generatedAt / recordDate means,"
answer like this:

> `generatedAt` means "when this analysis was refreshed." `recordDate` means
> "which date the page files that analysis under." In your case, Alva refreshed
> the analysis five hours ago, but it still filed it under April 30, so the page
> looked unchanged.
