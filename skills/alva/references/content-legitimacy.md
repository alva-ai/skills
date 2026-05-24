# Content Legitimacy

Read this before any response or artifact that surfaces financial values:
answers, charts, tables, metric cards, playbook HTML, remixes, edits, follow-up
claims, and generated methodology text.

## Core rule

The agent's job is to build the pipeline, not to be the data source. Any
quantitative value the user sees must trace to one of:

- an Alva SDK / Data Skills endpoint,
- a published Alva feed,
- a BYOD HTTP source that the user supplied or that was explicitly validated
  and wired into the feed pipeline.

Agent knowledge, LLM output, WebSearch snippets, random or synthetic
generators, and user-pasted snapshots are not legitimate data sources. They are
invalid even when hidden inside HTML literals, feed-script literals, backfilled
history, or agent-authored opinion columns.

If the requested domain has no SDK coverage, report the gap and stop or ask for
a legitimate BYOD source. Do not manufacture plausible-looking data.

## Data sourcing rules

1. All quantitative data displayed in charts, tables, or metric cards must
   originate from feed outputs. Never hardcode data as inline JavaScript
   literals in playbook HTML.
2. Playbook HTML must fetch quantitative data at runtime from feed output
   paths. Use the browser-safe public ALFS read gateway in
   [playbook-release.md](playbook-release.md#browser-safe-feed-reads), not
   `$ALVA_ENDPOINT`, sandbox env vars, or guessed API hosts.
3. Static labels, colors, and layout config can be inline. Quantitative values
   cannot.
4. Verification claims and quoted tool outputs must come from actual tool
   responses. Copy returned values such as `feed_id`, `published_url`, and ALFS
   paths verbatim.
5. Do not present `published_url` as the canonical share link. The share link is
   `https://alva.ai/u/<username>/playbooks/<playbook_name>`.

## Prohibited sources

- **WebSearch / WebFetch** may be used for documentation, BYOD endpoint
  discovery, or understanding requirements. Search results must not be quoted as
  the answer or embedded as static data in feed scripts or HTML.
- **LLM / ADK output** is for reasoning, classification, summarization, and
  synthesis of real data. It must not produce numbers, events, or reports that
  claim to come from real sources. If quantitative ADK output is unavoidable,
  label it clearly as AI-generated analysis.
- **Agent training knowledge** must not fill data gaps.
- **User-pasted examples** can define intent or expected shape, but they are not
  production data unless the user explicitly supplies them as a BYOD source and
  accepts the limitations.

These rules still apply when API auth fails. Report the failure; do not
substitute web-sourced numbers.

## Feed scope isolation

When building a playbook, read only feeds created for this playbook in the
current session. Reference an existing feed only when the user explicitly asks
for it, such as "reuse my `btc-ema` feed" or "pull from
`@alice/macro-dashboard`."

Qualitative analysis is not data. Ratings, theses, outlook text, and narrative
sections must not appear as feed output columns or HTML data tables unless they
are explicitly labelled as AI analysis or computed from real inputs with a
stated formula.

## Coverage gaps and fallbacks

When an SDK partition lacks the requested data type:

1. Omit the unavailable section and note the gap.
2. Use BYOD only when the user supplied a source URL or a public source was
   explicitly validated and wired into the feed.
3. Do not hardcode point-in-time values.
4. Do not fabricate events or fill gaps from training knowledge.

When more than 20% of requested symbols fail SDK lookup, report a data-quality
blocker. Do not silently substitute estimated or fabricated values marked
`live: false`.

Some asset classes, including forex pairs and traditional index or commodity
futures, may sit outside structured Data Skills. State the limitation up front,
then try `searchPerplexityFinance` in [search.md](search.md); suggest BYOD only
if that also cannot answer the request.

## Release declaration rule

`alva release playbook --feeds '[]'` is valid only when released HTML renders no
quantitative values at runtime. If the HTML shows numbers, charts, tables, or
metric cards, the release must reference deployed feeds in `--feeds`, and the
HTML must fetch them at runtime.

If you used `alva run` to source data, deploy the same logic as a feed and
reference it before release. See [feed-lifecycle.md](feed-lifecycle.md) and
[playbook-release.md](playbook-release.md).

## Ticker curation

For sector or thematic dashboards:

1. Do not rely on agent knowledge for ticker-to-sector mapping.
2. Cross-check every ticker's sector with an SDK call such as
   `getStockCompanyDetail`.
3. Remove mismatches before building the feed. One wrong ticker can distort the
   analysis.

## Data convention alignment

A financial figure is meaningful only with its conventions: fiscal/calendar
period, price adjustment, currency, units, seasonal adjustment, and
point-in-time versus restated basis.

Before charting, tabulating, comparing, or answering with data series:

- Read each convention from the record's own fields.
- Do not infer conventions from your knowledge of the company or market.
- Every series in one chart, table, or comparison must share conventions.
- Labels must state the convention they carry, derived from records.

For quarterly or annual fundamentals, read
[fundamentals-periods.md](fundamentals-periods.md) before computing YoY/QoQ or
comparing companies.

## Description and provenance accuracy

Playbook descriptions, README files, methodology sections, creator's notes, and
HTML copy may list only sources that were actually called successfully. Do not
claim sources such as Brave Search or ClinicalTrials.gov unless the feed script
fetches them at runtime.

Update-frequency claims must match actual deployment. If cronjob deployment
failed, remove "updates every N hours" or fix the cronjob before release.
