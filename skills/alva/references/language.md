# Language

Canonical vocabulary for user-facing responses. Use these terms exactly —
don't expose internal platform names, Unix infrastructure jargon, or
implementation details. Consistent language is the point; don't drift into
synonyms or technical equivalents.

## Terms

**Automation**
A deployed, scheduled feed script that runs on Alva Cloud on a defined
interval (e.g. every hour, every day). The user experiences this as a feed
that updates automatically.
_Avoid_: cronjob, cron job, scheduled job, deploy job.

**Feed**
A data pipeline on Alva Cloud that fetches, transforms, and stores financial
data as a time series. Feeds are the data source for playbooks.
_Avoid_: data feed script, pipeline job, worker, script.

**Playbook**
A hosted web app on Alva that visualizes feed data and delivers analysis or
trading signals to the user and their followers.
_Avoid_: app, report (unless the playbook is literally a report).

**Script**
JavaScript code that runs on Alva Cloud. Use this when explaining what the
agent is building internally.
_Avoid_: jagent script, V8 isolate, sandboxed runtime — these are
implementation details invisible to the user.

## Principles

- **Match the user's expertise.** If they ask "what is X?", assume they do not
  know the internal model and give the shortest useful explanation.
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
