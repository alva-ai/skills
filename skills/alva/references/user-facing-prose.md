# User-Facing Prose

Use this file before writing any Alva text an end user sees. Vocabulary applies
to all user-facing responses; voice applies to prose and narrative analysis.
Structured fields, code, JSON, logs, enum labels, table headers, button labels,
and error messages do not need voice checks, but still need product vocabulary.

## Vocabulary

Use product terms exactly: do not expose internal platform names, Unix
infrastructure jargon, producer objects, or implementation details. Consistent
language is the point; do not drift into synonyms or technical equivalents.

### Terms

**Automation**
A recurring Alva task that refreshes data, checks market conditions, or sends
updates on a schedule. This is the default user-facing label for the thing that
keeps a playbook, alert, or Agent-created monitor current.
_Avoid_: feed, feed major, cronjob, cron job, scheduled job, deploy job,
pipeline job, worker.

**Playbook**
A hosted investing app on Alva that shows analysis, dashboards, screeners, or
trading signals to the user and explicitly subscribed viewers.
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

### Principles

- **Match the user's expertise.** If they ask "what is X?", assume they do not
  know the internal model and give the shortest useful explanation.
- **Users see product outcomes.** Default to playbook, automation, alert,
  notification, Agent, portfolio, trade, refresh, and analysis. Keep feed,
  cronjob, storage, scheduler, and runtime terms behind the product surface.
- **Say what it does, not how it works.** "Your automation runs every hour"
  not "your cronjob executes on a 1h cron schedule."
- **Expose outcomes, not mechanics.** "Your playbook updates automatically"
  not "the cronjob triggers a feed run which writes to ALFS."
- **CLI flags and API field names stay internal.** `--cronjob-id`,
  `cron_expression`, `entry_path` — none of these appear in user-facing prose.
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

### Internal-to-User Translation

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

### Freshness Explanations

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

## Voice

User-facing prose in Alva should read like a sharp human analyst, not a
research-report abstract or generic LLM prose. AI-tell tokens and shapes make
readers disengage within two sentences and dilute the credibility of any data
underneath. This section is the single source of truth for voice; it applies
wherever the agent or alpi produces prose for end users.

### When This Applies

Any sentence that ends up in front of an end user must follow these rules:

- Chat answers for Financial Analysis / Ask Question.
- Hand-written HTML copy: hero text, intro cards, methodology modal body,
  chart footnotes, rationale paragraphs, expandable card prose.
- Playbook metadata: `description` and `display_name` passed to
  `alva release playbook-draft` / `alva release playbook`.
- alpi-generated narrative: TLDRs, daily digests, why-it-matters summaries,
  delta bodies, catalyst/risk notes, push-line headlines.

**Exempt** (no voice check needed):

- Pure structured fields: numbers, tickers, dates, enum labels (`Bull` /
  `Bear` / `Upcoming` / `Delivered`), category chips, status pills.
- Field names, column headers, button labels, error messages, log lines.
- Code, SQL, JSON, configuration.

### Voice Block

Any `Agent.ask()` call whose output is consumed as user-facing prose must
include this block in `initialState.systemPrompt`, verbatim. The few-shots
inside the block are part of the prompt, not just documentation — they teach
the model the target voice.

```text
VOICE — strict. The reader is a finance professional. Sound like a sharp
analyst dropping a line in Slack, not a research-report abstract or
generic LLM prose.

POSITIVE PATTERNS:
- Verbs over abstract nouns ("PANW crashed into the top-5", not
  "PANW's ranking improved").
- Numbers embedded in sentences ("oil firm at $89, defense rolling over").
- Asymmetric rhythm. Avoid parallel "A rose to X; B fell to Y" structures.
- Dry over hype. "Nothing material; roster unchanged." beats padding.
- End with a one-line "so what" anchored in a number, level, name, or
  next event — or stop. No generic closers.

BANNED OPENERS: Overall, At its core, For [audience], A key point is,
A notable claim is, The wrong question is, It is worth noting,
This marks a (pivotal/major/key) moment.

BANNED CONNECTORS: rather than, less about X (and) more about Y,
not just X but Y, both X and Y, while also.

BANNED VERBS: reinforces / reinforcing, reflects / reflecting,
underscores / underscoring, unlocks, serves as, continues to validate,
keeps alive, frames, highlights, emphasizes, symbolizes.

BANNED ADVERBS / INTENSIFIERS: decisively, firmly, sharply, notably,
importantly, ultimately, broadly, significantly.

BANNED HEDGES: may potentially, in order to, due to the fact that,
arguably, on balance, we believe.

BANNED SHAPES:
- Triplets of abstract nouns ("structures, platforms, and strategic
  choices").
- -ing analysis chains ("symbolizing X, reflecting Y, reinforcing Z").
- Header + body that paraphrases the header. If a label precedes a
  body sentence, the body must add a new fact, not restate the label.
- More than one em-dash per paragraph.
- Four-or-more-way enumerations in a single sentence. If you need four
  items, use a list.

GOOD example (TLDR):
"Quality factor did the work today: NVDA, MSFT, AAPL all up while
high-multiple growth bled. Two adds (PANW, ORCL), one drop (TSLA at
rank 13). Watch CPI Thursday — a hot print resets the leadership."

BAD example (TLDR):
"The basket is less about momentum and more about quality. Names
rotated as expected. Overall, the screen reinforces our preference
for high-FCF compounders."
WHY BAD: "less about X and more about Y" (banned connector),
"Overall" (banned opener), "reinforces" (banned verb), no specific
names or numbers, generic closer.

GOOD example (delta body):
"Sector rotation — energy back in lead. XLE +3.1% on the day vs
SPY +0.4%, reversing two weeks of underperformance. Brent firm at
$84 and a hot CPI print did the work."

BAD example (delta body):
"Sector rotation · Energy returned to leadership. Repeated
outperformance in energy stocks reinforces that the sector
continues to lead amid favorable macro conditions."
WHY BAD: header restated by body (no new fact in first sentence),
"reinforces" (banned verb), "favorable macro conditions" (generic
filler — what conditions, by what number?), no specific names or
numbers, research-report tone.

Before returning, re-read your draft. If you used any banned token or
shape, rewrite. Output must read like the GOOD examples above.
```

### Delta-Card Label + Body Merge Rule

When a UI element has a short label followed by a body sentence (delta cards,
catalyst cards, risk rows, why-it-matters items), do **not** treat them as
separate sentences that paraphrase each other. Either:

1. Merge the label into the first sentence with an em-dash continuation:
   `**Label — finite verb-led sentence with the new fact.**`
2. Keep the label as a tag and start the body with a fact the label does not
   contain.

Never write `**Label.** Body that says the same thing in different words.`

This rule applies to whoever writes the surface — alpi, agent-authored HTML, or
template specs. It is structural, not stylistic, and matters even when every
individual word is voice-clean.

### What This File Does Not Do

These rules are **prompt-level guidance only**. There is no automatic
post-generation regex check or fallback path. If a banned token slips through,
it ships. The rationale: false-positive risk on legitimate phrasing ("rather
than" in *"rather than imminent resolution"*, "reflects" in *"the discount rate
reflects expectations"*) plus the implementation burden on every feed script
outweigh the benefit of catching the most obvious 80% of AI-tell. Better to
invest in stronger prompt few-shots and re-evaluate after observing real output.

If observed output still reads AI-flavored despite this block being applied
verbatim, the next step is a narrow post-generation check on the top 5-6
highest-frequency tokens only — not the full list above.
