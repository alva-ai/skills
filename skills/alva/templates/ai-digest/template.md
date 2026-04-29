# AI Digest Template

For agentic topic, stream, or threshold-tracking playbooks whose primary
surface is an **AI-generated push digest**, not a dashboard. User can provide
either a rough topic or a full source plan; the agent researches the topic,
drafts a `CONFIG`, selects the smallest useful set of Alva search/feed/data inputs,
runs on cron, generates an opinionated grounded take via `@alva/alvaask`, and
pushes it to Telegram (via `signal/targets` for followers, or
`notify/message` for the owner). The HTML playbook is a **light feed-stream
replay** of past pushes — not an analytical dashboard.

> **Highest-priority standard — strictly follow. Template iterates; always
> work from the latest version of this file.**

Gotchas that bite first-time implementors are codified in §14.7 "Known
platform quirks" — scan that table before writing code.

---

## 0. Design System Compliance (READ FIRST)

**MANDATORY — strictly follow the Alva skill design guideline. Non-negotiable.**

Before writing HTML, read from the Alva skill:

- [`../../references/design-tokens.css`](../../references/design-tokens.css) — use spacing/color tokens as-is, do NOT override
- [`../../references/design-components.md`](../../references/design-components.md) — Tab / Dropdown / Pill / Markdown primitives
- [`../../references/design-system.md`](../../references/design-system.md) — `.playbook-container`, `.playbook-header` base rules

Default to the existing Alva light-theme tokens. Do not introduce dark mode,
black/slate page backgrounds, glow effects, gradients, or custom color palettes.

**Do NOT** apply `design-playbook-trading-strategy.md` — that's for trading
dashboards with Overview/Analytics/Strategy/Feed tabs. AI Digest is a
**timeline**, not a dashboard.

This template only documents AI Digest-unique rules on top of the base
design system — never re-spec a token or base that already exists.

---

## 0.1 Reference implementation (start here)

A working timeline UI lives at `example/index.html` next to this file —
**copy it directly.** Change `USERNAME` + `FEED_PATH` + `playbook-config`
JSON + the title; leave the rest. It already encodes the design system,
safe markdown rendering, source resolver, day separators, and pushed/skipped
cards. §10 and §11 only document what's
AI Digest-unique on top — do not re-derive the layout from them.

The feed-side scaffold lives in §14, built around a single
`@alva/alvaask` call with live-search tools (the model does its own
fetch + relevance + grounding, guided by a strict prompt). §6–§9 are
the behavior contract; §14 shows the smallest shape that satisfies it.

The §7 multi-stage pipeline is still valid for cases where you need
explicit source adapters or upstream feeds — pick whichever fits your
sources, but ship the §14 shape unless you have a reason to fork.

---

## Component Index

Read in this order:

- [When to use this template](#1-when-to-use-this-template) — confirm this is
  a push-first topic/stream/threshold tracker, not a dashboard.
- [User Intake](#2-user-intake--confirm-or-research-first) — produce a
  reviewable `CONFIG` draft; users may skip questions and let the model
  research first.
- [CONFIG object](#4-config-object) — frozen behavior surface.
- [Optional Alva Enrichment](#5-optional-alva-enrichment) — add structured
  Alva context only when it makes the push materially smarter.
- [Feed Contract](#6-feed-contract) — stored event shape and delivery sidecars.
- [Pipeline](#7-pipeline) — fetch, optional enrich, relevance, dedupe,
  materiality, rate-limit, generation, grounding, write, deliver.
- [Generation + grounding](#8-generation--grounding) — `@alva/alvaask`,
  prompt shape, all-or-nothing citation gates.
- [Push plumbing](#9-push-plumbing) — deterministic payload derivation.
- [Page Layout](#10-page-layout) and [Components](#11-components-ai-digest-unique)
  — feed-first timeline UI.
- [Hard Rules](#13-hard-rules) and [Known platform quirks](#147-known-platform-quirks-v1-test-findings-codified)
  — scan before implementation.

---

## 1. When to use this template

Use AI Digest when the playbook's main job is to **push a concise,
grounded update** about a topic, fixed stream, upstream feed, or deterministic
threshold.

Good fits:

- Daily/weekly synthesis across news, social, filings, podcasts, or media.
- Fixed-stream watches such as a specific X/KOL handle, channel, subreddit, or
  upstream Alva feed.
- Polling-based threshold watches such as BTC breaking a price level, funding
  dislocation, volume spike, or macro release crossing a rule.

**This template's defining traits:**

- **Push-first.** The HTML page is a replay of past pushes; it doesn't
  re-compute on view. All analysis happens in the feed on cron.
- **Opinionated by default.** The angle prompt drives tone; don't ship
  neutral wire-service rewrites when the user asked for a take.
- **Grounded numbers, cited facts.** Every claim in the body maps to a
  match URL or, when enrichment is enabled, a structured `context_facts[]`
  reference in `citations[]`; grounding failures fall back to empty body,
  not fabricated prose.

---

## 2. User Intake — confirm, or research first

Before writing code, produce a concrete `CONFIG` draft. The draft can come from
either a short user conversation or from model-led research when the user wants
to skip the back-and-forth.

### Fast path — ask only what changes the playbook

If the user is willing to clarify, keep it short. Confirm only the decisions
that materially affect the feed:

| Decision | Ask for | Why it matters |
|---|---|---|
| Topic boundary | What should this track, and what should it exclude? | Prevents broad keyword slop. |
| Sources | Topic search, fixed handles/channels, upstream feeds, market signals, or a mix? | Chooses `unified_search` vs `feed_widgets` and adapters. |
| Cadence / trigger | How often should it summarize or check? For thresholds, what exact condition matters? | Sets cron and materiality. |
| Audience | Followers or owner only? | Chooses `signal/targets` vs `notify/message`. |
| Angle | What kind of take should the update have? | Drives the generation prompt and voice. |
| Worth-pushing bar | What counts as material enough to notify? | Reduces noisy pushes. |

### Skip path — model plans first, user confirms

If the user says to skip questions, gives only a rough topic, or asks the model
to decide, **do not block on intake**. Do a quick research pass first, then
present a draft for confirmation before implementation:

1. Search the topic enough to identify common terms, source types, update
   frequency, and likely noise traps.
2. Draft `CONFIG.topic`, `sources`, optional `entities`/`enrichment`,
   `cadence`, `audience`, `angle`, and `quiet_day_policy` from that research.
3. State assumptions plainly. Mark unknowns as assumptions, not facts.
4. Ask the user to confirm or edit the draft. If they do not respond and have
   explicitly delegated decisions, proceed with conservative defaults.

Default assumptions for the skip path:

- `entities`: infer only obvious tickers/assets/companies/protocols/series;
  do not ask for or add entities just to make the config look richer.
- `sources`: start with `news` + `social`; add `podcast`, `youtube`, `reddit`,
  or `feed_widgets` only when the topic clearly benefits from them.
- `enrichment`: leave empty by default. Add structured Alva data only when it
  changes push quality: price/volume moves, fundamentals, earnings/filings,
  funding/open interest, on-chain flows, macro releases, or an upstream feed.
- `cadence`: infer the internal mode from the user's goal. Periodic synthesis
  becomes `mode: "digest"`; threshold/fixed-stream triggers become
  `mode: "watch"` with a tighter cron. Do not ask the user to choose a mode.
- `quiet_day_policy`: `"ping"` for paid/subscriber-facing briefs where silence
  is confusing; `"skip"` for noisy topics where no-news days should stay quiet.
- `audience`: `"followers"` for released playbooks; `"owner"` for private
  prototypes or platform environments where follower push is not available.
- `angle`: opinionated, but no buy/sell/hold calls, no price targets, no
  uncited numerical claims.

### Intake output

End intake with a short, reviewable `CONFIG` draft using the exact key shape in
§4. Include only the decisions that matter: topic boundary, source list,
cadence + quiet-day policy, audience, angle, and any non-default model choice.
Show optional entities/enrichment only when they materially improve the push.

Do not turn intake into a long questionnaire. The purpose is to make the
AI Digest useful, not to collect perfect requirements.

---

## 3. Cadence model — infer the mode

AI Digest is cron-based. Do **not** ask the user "digest or watch?" up front.
Infer the implementation mode from their goal:

| User goal | Internal mode | Cron shape |
|---|---|---|
| "Summarize what happened" | `digest` | Daily or weekly |
| "Tell me when X happens" | `watch` | 5-60 min polling, depending on source cost |

Both modes use the same pipeline and event contract. `watch` should usually use
`quiet_day_policy: "skip"`, a tighter `dedupe_window_hours`, and deterministic
materiality checks before generation. This is still polling, not a millisecond
realtime alert engine.

---

## 4. CONFIG object

Each AI Digest declares a **single `CONFIG` constant** at the top of
its feed script. This is the ground truth for behavior, and the HTML
may expose it in a secondary "about" surface if the outer playbook shell
supports one. Changes to CONFIG are template-remix-level decisions — not
runtime GUI knobs.

```javascript
const CONFIG = {
  topic: {
    name: "AI chip supply chain",
    description: `Monitoring TSMC, SMIC, HBM memory, AI accelerator capacity,
                  and delivery timelines. Emphasis on supply-chain disruption
                  (sanctions, fires, geopolitics, capacity planning) rather
                  than daily share-price moves.`,
  },

  // Every source produces a normalized match: {source, url, title, ts, snippet, ...meta}
  sources: [
    { type: "news",    query: "TSMC OR SMIC OR HBM3 OR NVIDIA supply", lookback_hours: 24 },
    { type: "social",  query: "$NVDA capacity OR shortage",            lookback_hours: 24, min_engagement: 50 },
    { type: "podcast", query: "AI chip supply chain OR semiconductor capacity", lookback_hours: 72 },
  ],

  cadence: {
    mode: "digest",                  // inferred: "digest" | "watch"; don't ask users to choose
    cron: "0 12 * * *",              // UTC
    quiet_day_policy: "ping",        // "ping" (default) | "skip"
  },

  audience: "followers",             // "followers" (signal/targets) | "owner" (notify/message)

  push_policy: {
    materiality: `Push when there is a fresh supply-chain disruption,
                  filing/earnings datapoint, large market move, or high-quality
                  source cluster that changes what a reader should watch next.`,
    max_pushes_per_day: 1,
    dedupe_window_hours: 48,
  },

  angle: `Focus on macro supply-chain disruption and capacity signals.
          Opinionated — tell the reader what to watch next, not just what
          happened. Every number must cite its source.`,

  body_max_chars: 1200,              // rendered body budget; push_line capped separately at 160

  // Full Alva model IDs — not short names, not dated Anthropic IDs.
  generation_model: "claude-sonnet-4-6",
  relevance_model: "claude-haiku-4-5",
};
```

Optional fields, used only when they materially improve the push:

- `entities`: conservative aliases for obvious tickers, assets, companies,
  protocols, people, or macro series.
- `enrichment`: structured Alva/BYOD/upstream facts that enter grounding as
  `context_facts[]`; keep it lean.

Additional source types (`reddit` via Brave/Serper, `youtube` via Serper
`site:youtube.com`, fixed-handle `feed_widgets`) follow the same shape — see
§7.1 for the adapter map. Structured financial context belongs in
`enrichment`, unless the data point itself is the event being monitored.

Watch-style triggers should change the minimum surface:

| Goal | Source shape | Cadence / policy |
|---|---|---|
| BTC crosses above 95000 | `{type:"market", symbol:"BTC", metric:"price", threshold:{above:95000}}` | `mode:"watch"`, 5-15 min cron, `quiet_day_policy:"skip"`, short dedupe window |
| KOL posts new BTC commentary | `{type:"feed", platform:"x", handle:"saylor", include:["original_posts"]}` | `mode:"watch"`, 30-60 min cron, `quiet_day_policy:"skip"`, event-id dedupe |

### CONFIG rules

- **Freeze the keys.** Don't rename to `topic_name` / `lookbackHours` /
  etc. Secondary "about" surfaces can render CONFIG directly — drift breaks it.
- **Infer `cadence.mode`; don't surface it as a user choice.** Ask for the
  user's goal, frequency, or trigger condition, then choose the mode yourself.
- **Angle is prose, not slots.** The string is pasted into the prompt
  as-is; natural language carries more than schema.
- **Duplicate source types are allowed** (two `news` entries with different
  queries). Dedup happens at the match layer via URL hash, not at
  source-config layer.
- **Entities are optional.** If inferred during skip-path intake, keep aliases
  conservative and expose them only in secondary metadata, not the main feed.
- **Enrichment is optional context, not dashboarding.** Add enough Alva data to
  make the push useful and grounded; do not turn this into a dashboard.
- **Push policy is code-facing prose.** Translate `materiality` into simple
  deterministic checks before generation; do not let the model alone decide
  whether to interrupt the user.
- **Dedupe window defaults to 48 h** via `push_policy.dedupe_window_hours` —
  long enough that a link reposted the next day doesn't re-fire. Lower it for
  `watch` mode thresholds that can validly re-cross intraday.

---

## 5. Optional Alva Enrichment

The default playbook can ship with only `topic`, `sources`, `cadence`,
`push_policy`, and `angle`. Add this section when the topic benefits from Alva's
structured data or existing feed outputs. The goal is still a push, not a
dashboard.

Use the lightest useful combination of:

- **Entities** — tickers, assets, companies, protocols, people, macro series,
  geographies, aliases.
- **Content matches** — news, social, Reddit, YouTube, podcasts, web, fixed
  handles/channels.
- **Context facts** — structured Alva data that makes the push smarter:
  price/volume, fundamentals, filings, earnings, funding/open interest,
  on-chain flows, macro releases, or upstream feed records.
- **Materiality policy** — what makes an update worth interrupting the user.

### 5.1 Capability map

| Need | Use | Output |
|---|---|---|
| Current narratives, news, social reaction | `unified_search` (`searchGrokX`, Serper, Brave, scrape-url) | `matches[]` |
| Fixed accounts/channels/subreddits/podcasts | `feed_widgets` | `matches[]` from subscribed streams |
| Equity / ETF / crypto market context | Alva data SDKs / Arrays APIs | `context_facts[]` |
| Macro, rates, inflation, GDP, Treasury context | Alva macro SDKs / Arrays APIs | `context_facts[]` |
| On-chain, DeFi, funding, exchange-flow context | Alva crypto/on-chain SDKs / Arrays APIs | `context_facts[]` |
| Existing playbook/feed output | Feed SDK / ALFS read from `~/feeds/...` | `context_facts[]` or upstream `matches[]` |
| Proprietary or external data | BYOD via ALFS upload or `net/http.fetch` | `context_facts[]` |

Run `alva sdk partition-summary --partition <name>` and
`alva sdk doc --name <module>` when selecting modules. Do not guess function
signatures from memory; SDK names drift. Prefer runtime SDK modules where they
exist. If you must call Arrays or another HTTP API directly, load credentials
from Alva Secret Manager inside the runtime; never hardcode secrets.

### 5.2 Context facts (optional)

If you add `CONFIG.enrichment`, emit compact facts, not prose:

```typescript
type ContextFact = {
  ref_id: string;      // stable id used by citations, e.g. "ctx:price:NVDA:1d"
  source: string;      // "Alva Stock SDK", "Alva Macro SDK", "upstream_feed", ...
  label: string;       // human label, e.g. "NVDA 1d price move"
  value: string;       // display-ready value, e.g. "+2.8%"
  ts: number;          // epoch ms for the observation
  evidence: string;    // exact text/value used for grounding
  url?: string;        // optional source URL or Alva feed/playbook URL
};
```

Keep facts lean: 3–10 high-signal facts is usually enough; only go beyond that
when the topic is broad and the facts are still easy to cite. Facts should help
answer one of two questions:

1. Is this run worth pushing?
2. What grounded number/context should the digest mention?

### 5.3 Materiality policy

Use `CONFIG.push_policy.materiality` to turn the user's "worth pushing" bar into
code. Prefer deterministic checks before generation. These checks can use
matches alone, or matches plus optional context facts:

- `newMatches.length > 0` plus source quality/engagement/freshness.
- context fact crosses a threshold (large price move, volume spike, funding
  dislocation, filing/earnings event, macro release surprise).
- upstream feed emits a new high-priority record.

When nothing crosses the bar, still append a `digest/events` record with
`delivery: { pushed: false, reason: "not_material" }`. Do not spend a
generation call just to explain non-events unless `quiet_day_policy: "ping"`.

---

## 6. Feed Contract

One frozen data shape so the playbook HTML, push plumbing, and future
remixers all agree on what an AI Digest event looks like.

### Storage

```
~/feeds/<name>/v1/data/
  digest/
    events/    ← append-only, one record per cron fire (pushed OR skipped)
  signal/
    targets/   ← written WHEN pushed AND audience="followers" (Pattern D)
  notify/
    message/   ← written WHEN pushed AND audience="owner"    (Pattern E)
```

`digest/events` is the **source of truth** for the HTML timeline.
`signal/targets` / `notify/message` are delivery sidecars — they hold the
push payload the platform broadcasts, not the rendered body. One LLM
generation per fire; the event record stores the canonical body, and the
delivery sidecar gets a lean projection of it.

All three are Feed SDK time-series
(`ctx.self.ts("digest", "events").append(...)`). Do **not** use
`alfs.writeFile` for them. Reads go through `@last/N`.

### `digest/events` — required fields

| key | type | notes |
|---|---|---|
| `date` | number (ms) | Cron-fire timestamp. Append it on every record; Feed SDK time-series may treat it as the built-in timestamp field rather than a declared schema field. |
| `delivery` | `{pushed: bool, reason: string}` | `pushed=false` carries a short `reason` (`quiet_day_skipped`, `grounding_failed`, `no_matches`, `all_deduped`, `not_material`, `rate_limited` — freeform, kept short) |
| `materiality` | `{is_material: bool, reason: string}` | Deterministic pre-generation decision derived from `CONFIG.push_policy`, matches, and optional context facts |
| `push_line` | string | ≤ 160 chars plain text. `""` on grounding failure |
| `body` | string | Markdown with inline `[N]` reference markers. `""` on grounding failure |
| `citations` | `[{ref, claim, url, source, source_ref}]` | One entry per `[N]` marker. `source_ref` is a match URL, `match.meta.event_key`, or, when using enrichment, `context_facts[].ref_id`. `[]` when body is `""` |
| `matches` | `[{source, url, title, ts, snippet, meta}]` | All matches considered this fire (post-relevance, post-dedupe) |
| `context_facts` | `[{ref_id, source, label, value, ts, evidence, url}]` | Optional structured Alva/BYOD/upstream facts used for materiality and grounding. Render cited facts as structured fact rows under Sources; do not fake them as news/social sources. `[]` in the lightweight default path. |
| `dedupe_keys` | `Array<{key: string}>` | Hashes consumed by this record. Feed SDK's `arr()` helper can't describe primitive-string arrays; each entry is wrapped as `{key: hash}`. Declare: `arr("dedupe_keys", [str("key")])`. |
| `source` | `"alvaask" \| "fallback"` | `"fallback"` when body is `""` |

### Why every fire writes a record (even when `pushed=false`)

Debugging churn ("why didn't I get a push yesterday?") needs a record.
Retro analysis of quiet periods needs a record. The HTML timeline can show
skipped fires dimmed-and-collapsed for author-facing transparency. **Append
always; let `delivery.pushed` drive rendering.**

### `signal/targets` (followers) — Altra format

When `audience: "followers"`, also append one record to `signal/targets` per
pushed fire. Format follows Altra's target schema (see `references/feed-sdk.md`
Pattern D); the platform reads `meta.reason` as the push body and truncates it
to 500 chars. Always pass the released playbook URL so the compact push can
reserve the final link line:

```javascript
const PLAYBOOK_URL = "https://<user>.playbook.alva.ai/<playbook>/<version>/index.html";

await ctx.self.ts("signal", "targets").append([{
  date: now,
  instruction: { type: "allocate", weights: [] },   // no-op — this is notify-only
  meta: { reason: composePushPayload(event, PLAYBOOK_URL) }, // ≤ 500 chars; see §9
}]);
```

> **On FeedAltra and this template.** SKILL.md states that feeds producing
> `signal/targets` "MUST use `FeedAltra`". For **trading** feeds that's
> correct and non-negotiable (bar alignment, look-ahead guards, portfolio
> sim). For **AI Digest feeds** it's architecturally incompatible:
> FeedAltra is event-triggered on OHLCV bars (no cron-only trigger), and
> its `strategyFn(sctx)` does not expose the feed-level ctx needed to
> `append()` records into custom groups like `digest/events`.
> In practice, a plain `Feed` + `ctx.self.ts()` write to
> `signal/targets` works end-to-end with `--push-notify` — we verified in
> v1 testing. **Use plain `Feed` for AI Digest playbooks.** If your
> environment later enforces the FeedAltra rule at the platform layer,
> switch `audience` to `"owner"` and write to `notify/message` (Pattern E)
> — that path is never FeedAltra-gated.

### `notify/message` (owner) — title + text

When `audience: "owner"`, write to `notify/message` instead. No FeedAltra
requirement; plain `Feed` suffices.

```javascript
const PLAYBOOK_URL = "https://<user>.playbook.alva.ai/<playbook>/<version>/index.html";

await ctx.self.ts("notify", "message").append([{
  date: now,
  title: `${CONFIG.topic.name} · ${fmtEst(now)}`,
  text: composePushPayload(event, PLAYBOOK_URL),
}]);
```

### Bedrock rules (shared with all Alva feeds)

1. `snake_case` for every key (`push_line`, `dedupe_keys` — not `pushLine`).
2. Epoch ms for every timestamp — no ISO strings.
3. No stringified JSON in field values. Use real nested objects/arrays.

---

## 7. Pipeline

```
cron fire
  │
  ├─ 1. FETCH — pull content matches per CONFIG.sources (see §7.1)
  │
  ├─ 2. ENRICH (optional) — pull structured Alva/BYOD/upstream context facts (see §5)
  │
  ├─ 3. RELEVANCE FILTER — keyword recall then batched Haiku yes/no (see §7.2)
  │
  ├─ 4. DEDUPE — drop matches whose hash is in the configured event window (see §7.3)
  │
  ├─ 5. MATERIALITY — deterministic check from push_policy + matches (+ optional context_facts)
  │      · not material + quiet_day_policy="skip"  → no call, write pushed=false record, stop
  │      · not material + quiet_day_policy="ping"  → short "nothing material" body
  │
  ├─ 6. RATE LIMIT — enforce max_pushes_per_day before spending generation
  │
  ├─ 7. GENERATE — Sonnet call with angle + matches (+ optional context_facts) → {push_line, body, citations} (see §8)
  │
  ├─ 8. GROUND — every [N] resolves; every citation resolves to a match or optional context fact; every number is in corpus (see §8.2)
  │
  └─ 9. WRITE + DELIVER — append digest/events (always);
                           write signal/targets or notify/message (only when pushed) (see §9)
```

### 7.1 FETCH — source adapters

Normalize every source to a common match shape:

```typescript
type Match = {
  source: "news" | "social" | "market" | "feed" | "podcast" | "youtube";
  url: string;
  title: string;
  ts: number;          // epoch ms — real publish time, NOT index time
  snippet: string;     // ≤ 300 chars
  meta: object;        // source-specific; use meta.event_key for threshold / stream events
};
```

### Two SDK partitions — pick the right one per source

| Partition | When to use | Shape |
|---|---|---|
| `unified_search` | Topic-keyword search for this run — "find items about X right now" | `getSerperSearch({q, type, tbs})` / `searchGrokX({query, from_date})` / `searchBrave({...})` — one-shot queries |
| `feed_widgets` | Subscribed stream of a **specific handle, channel, or subreddit** — "everything from @Acquired, even off-topic" | Declarative `targets[]` stream; results arrive as typed feed items over time |

**AI Digest defaults to `unified_search`** because the user's
primary intent is topic-tracking. Only switch to `feed_widgets` when the
config names specific handles/channels/subreddits to subscribe to.

### Module paths and function names (authoritative)

Look each up via `alva sdk doc --name <path>` before writing code; names
shown here may drift.

| Source | Module path | Exported function |
|---|---|---|
| `news` | `@arrays/data/search/serper-search:v1.0.0` | `getSerperSearch({q, type: "news", tbs: "qdr:d", num})` |
| `news` (alt) | `@arrays/data/search/search-brave:v1.0.0` | `searchBrave({q, freshness})` |
| `social` | `@arrays/data/search/search-grok-x:v1.0.0` | `searchGrokX({query, from_date, to_date, max_search_results})` |
| `market` | Alva Stock/Crypto SDKs (see `references/api/sdk.md`) | Emit a synthetic match only when the market signal itself is the event; otherwise use optional `context_facts` enrichment |
| `feed` | Feed SDK upstream or direct ALFS read | Each upstream record becomes one match |
| `podcast` | iTunes Search API via `net/http.fetch` | `https://itunes.apple.com/search?term=<encoded>&media=podcast&entity=podcastEpisode&limit=20` — title + description only |
| `youtube` | `@arrays/data/search/serper-search:v1.0.0` with `site:youtube.com` in `q` | Video metadata only; no transcript fetching in v1 |

**Gotchas** (drawn from v1 testing and `references/search.md`):

- **Serper `date` is index/observed time, NOT publish time.** Don't use it
  as `ts`. Fall back to `Date.now()` or scrape for a publish timestamp.
- **`searchGrokX`** returns items whose real publish time is `created_at`
  (epoch ms). Filter `like_count == 0 && retweet_count == 0` as noise.
- **External HTTP fetches (iTunes, etc.) hit the runtime's outbound proxy
  and can reset intermittently.** Wrap in a 1-retry loop with a short
  backoff; treat a failed source as "no matches this run", not a fatal.

**Oversampling:** fetch ~15 items per source then rank; don't take the SDK's
first 5. See `references/search.md` "Search Quality Patterns".

### 7.2 RELEVANCE FILTER (hybrid, required)

Keyword recall is noisy — `TSMC` matches a thousand irrelevant trivia items.
A cheap semantic pass is mandatory.

**SDK choice: `@alva/alvaask`, not `@alva/adk`.** `ask()` is the single LLM
path for this template — for both the per-item relevance check below and
the full digest generation in §8. `ask()` is **synchronous** (`{text,
session_id} = ask(prompt, {system, model})`), and supports the `model`
option; `adk.agent()` does not.

**Batch the calls.** Don't send one `ask()` per item — on 30 items that's
30 round-trips. Batch 10–20 items into one prompt and return a JSON
yes/no list. 3× cheaper and ~10× faster.

```javascript
const { ask } = require("@alva/alvaask");

function filterRelevanceBatch(matches, topic, relevanceModel) {
  const BATCH = 15;
  const out = [];
  for (let i = 0; i < matches.length; i += BATCH) {
    const slice = matches.slice(i, i + BATCH);
    const prompt =
      `For each item below, answer yes/no: is it actually about "${topic.name}"?\n\n` +
      `Topic context: ${topic.description}\n\n` +
      slice.map((m, j) =>
        `[${j}] title: ${m.title}\n    snippet: ${(m.snippet || "").slice(0, 200)}`
      ).join("\n\n") +
      `\n\nReturn strict JSON only: {"answers": {"0": "yes"|"no", ..., "${slice.length - 1}": "yes"|"no"}} — keyed by the [n] index of each item.`;
    const { text } = ask(prompt, { model: relevanceModel });
    try {
      const { answers } = JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, ""));
      slice.forEach((m, j) => { if (/^yes/i.test(answers[String(j)] || "")) out.push(m); });
    } catch (e) {
      // On parse failure, pass through un-filtered — better than dropping everything.
      out.push(...slice);
    }
  }
  return out;
}
```

**Don't skip this step.** Without it, generation quality degrades fast
(3–5 irrelevant items in a 10-item digest → "wire-service slop" tone).

### 7.3 DEDUPE

Maintain a short-term memory via the event log itself. The Feed SDK read
API is `.last(n)` / `.first(n)` / `.range(from, to)` — NOT
`.read({limit})` (that method doesn't exist).

```javascript
const DEDUPE_WINDOW_MS = (CONFIG.push_policy.dedupe_window_hours || 48) * 3600_000;
const windowMs = DEDUPE_WINDOW_MS;
const cutoff = Date.now() - windowMs;
const recent = await ctx.self.ts("digest", "events").last(100);
const seenHashes = new Set();
for (const r of (recent || [])) {
  if (r.date >= cutoff && Array.isArray(r.dedupe_keys)) {
    // dedupe_keys is Array<{key: string}> per §6 — unwrap
    r.dedupe_keys.forEach(k => seenHashes.add(typeof k === "string" ? k : k.key));
  }
}

const normalizeUrl = (u) => (u || "").replace(/[#?].*$/, "").replace(/\/$/, "").toLowerCase();
const hashMatch = (m) => {
  const key = (m.meta && m.meta.event_key)
    ? `${m.source}::${m.meta.event_key}`
    : (normalizeUrl(m.url) || `${m.source}::${m.title}`);
  let h = 0;
  for (let i = 0; i < key.length; i++) h = ((h << 5) - h + key.charCodeAt(i)) | 0;
  return "h" + (h >>> 0).toString(36);
};
const newMatches = matches.filter(m => !seenHashes.has(hashMatch(m)));
const dedupeKeys = newMatches.map(m => ({ key: hashMatch(m) }));   // NOTE: wrapped for feed schema
```

Normalize URLs (strip `utm_*` / trailing slashes / fragments) before hashing
so `example.com/x` and `example.com/x?utm_source=feed` collide. For market
thresholds or fixed streams, set `match.meta.event_key` to a stable semantic key
such as `BTC:price:cross-above:95000` or `x:saylor:<post_id>`; otherwise a
synthetic market title can dedupe too aggressively or not aggressively enough.
No crypto SDK needed; a stable string-hash is sufficient at this scale.

### 7.4 Quiet-day + materiality handling

```javascript
const contextFacts = []; // default path; populate from CONFIG.enrichment only when §5 is enabled
const materiality = assessMateriality({ newMatches, contextFacts, config: CONFIG });
if (!materiality.is_material && CONFIG.cadence.quiet_day_policy === "skip") {
  return writeEvent({
    materiality,
    delivery: { pushed: false, reason: materiality.reason || "not_material" },
  });
}
if (await reachedDailyPushLimit(ctx, now, CONFIG.push_policy.max_pushes_per_day || 1)) {
  return writeEvent({
    materiality,
    delivery: { pushed: false, reason: "rate_limited" },
  });
}
// Otherwise fall through to §8 generation — a quiet day with ping policy
// produces a short acknowledgement body.
return generateAndPush({ newMatches, contextFacts, materiality });
```

`reachedDailyPushLimit()` should count `digest/events` rows in the current UTC
day where `delivery.pushed === true`. Keep it deterministic; do not ask the
model to decide whether the user has been interrupted too often.

---

## 8. Generation + grounding

All LLM work in this template goes through **`@alva/alvaask`** — `ask()` is
synchronous, accepts `{system, model}`, and returns `{text, session_id}`.
Do **not** use `@alva/adk` here: `adk.agent()` doesn't accept a `model`
option and pulls in a ReAct loop we don't need. One SDK, two call sites:
batched yes/no in §7.2 and the structured JSON generation below.

### Prompt skeleton

Use verbatim; only the slots vary. Run with `model: CONFIG.generation_model`
(full Alva ID, e.g. `"claude-sonnet-4-6"`).

```text
You are writing today's update for the "<<TOPIC_NAME>>" AI Digest playbook.
Output feeds a Telegram push and an HTML timeline card.

TOPIC
  <<TOPIC_DESCRIPTION>>

ANGLE (authoritative — this defines voice and focus)
  <<ANGLE>>

RULES
- Every factual claim — number, date, named quote, ticker move — ends with
  "[N]" referencing an entry in the citations array.
- DO NOT invent facts or numbers. If a claim lacks a source in INPUT_MATCHES
  or optional CONTEXT_FACTS, drop the claim. Empty body beats invention.
- No buy/sell/hold recommendations; no price targets. Observation + framing.
- push_line ≤ 160 chars, plain text (no markdown), leads with the observation.
- body ≤ <<BODY_MAX_CHARS>> chars, markdown allowed.
- If MATERIALITY.is_material is false: write one short "nothing material"
  acknowledgement; only cite facts you actually mention.
- If INPUT_MATCHES and CONTEXT_FACTS are empty: write one short sentence
  acknowledging the quiet day, empty citations array.

MATERIALITY
<<MATERIALITY_JSON>>

INPUT_MATCHES   // relevance-filtered, deduped
<<MATCHES_JSON>>

CONTEXT_FACTS   // optional structured Alva/BYOD/upstream facts from §5; [] by default
<<CONTEXT_FACTS_JSON>>

Output strict JSON only, no preamble:
{
  "push_line": "<≤160 chars>",
  "body":      "<markdown with [N] markers>",
  "citations": [
    { "ref": 1, "claim": "<a short phrase that appears in body>",
      "url": "<source URL or empty string>",
      "source": "<short source name>",
      "source_ref": "<INPUT_MATCHES url, INPUT_MATCHES meta.event_key, or CONTEXT_FACTS ref_id>" }
  ]
}
```

### Call site

```javascript
const { ask } = require("@alva/alvaask");

function generate({ newMatches, contextFacts, materiality }) {
  const { text } = ask(
    userBlock({ newMatches, contextFacts, materiality }),
    { system: systemPrompt(), model: CONFIG.generation_model },
  );
  const clean = (text || "").replace(/^```(?:json)?\s*|\s*```$/gm, "").trim();
  try { return JSON.parse(clean); } catch { return null; }
}
```

`ask()` is **synchronous** — do NOT `await` it. Latency is paid upfront
per call, so if you need to parallelise, you parallelise dispatches in
plain JS control flow, not with `Promise.all` on `ask`.

### 8.1 Few-shot pack (optional)

First-run playbooks don't have a gold history yet — ship without few-shots
and let the angle + RULES carry the voice. After a week of real fires,
harvest 2–3 outputs the author liked and paste them into a local
`prompts/few-shots.json`, append to the system prompt under a
`FEW_SHOTS` header. Not required to ship.

### 8.2 Grounding check (all-or-nothing)

Three gates; any failure → fallback. Quiet-day mode (`matches: []` and
`context_facts: []`) bypasses Gates B and C after the basic result shape check.

```javascript
function passesGrounding(result, matches, contextFacts) {
  if (!result || typeof result.body !== "string") return false;
  const { body, citations } = result;
  if (matches.length === 0 && contextFacts.length === 0) return true;   // quiet-day bypass
  if (!Array.isArray(citations)) return false;

  // Gate A: every [N] in body has a citations entry
  const refs = [...body.matchAll(/\[(\d+)\]/g)].map(m => +m[1]);
  const citationRefs = new Set(citations.map(c => c.ref));
  for (const r of refs) if (!citationRefs.has(r)) return false;

  // Gate B: every citation resolves to a match URL, match event_key, or context fact ref_id
  const matchUrls = new Set(matches.map(m => normalizeUrl(m.url)));
  const matchEventKeys = new Set(matches.map(m => m.meta && m.meta.event_key).filter(Boolean));
  const factRefs = new Set(contextFacts.map(f => f.ref_id));
  for (const c of citations) {
    const byUrl = c.url && matchUrls.has(normalizeUrl(c.url));
    const byEventKey = c.source_ref && matchEventKeys.has(c.source_ref);
    const byRef = c.source_ref && factRefs.has(c.source_ref);
    if (!byUrl && !byEventKey && !byRef) return false;
  }

  // Gate C: every number in body appears verbatim in a match or optional context fact
  const numbers = [...body.matchAll(/-?\d+(\.\d+)?%?/g)].map(m => m[0]);
  const corpus = [
    matches.map(m => `${m.title}\n${m.snippet}`).join("\n"),
    contextFacts.map(f => `${f.label}\n${f.value}\n${f.evidence}`).join("\n"),
  ].join("\n");
  for (const n of numbers) if (!corpus.includes(n)) return false;

  return true;
}
```

`citations[].claim` is rendered as tooltip text on each `[N]` anchor but
is **not** a grounding gate — the model's claim field drifts too easily
from body wording to be enforced byte-wise, and A + B + C already block
the real failure modes.

On failure: write the event with `body: ""`, `push_line: ""`, `citations:
[]`, `source: "fallback"`, `delivery: { pushed: false, reason:
"grounding_failed" }`. **Do not push.** All-or-nothing beats partial prose.

---

## 9. Push plumbing

### `composePushPayload(event, playbookUrl)`

The push body is derived deterministically from the event record — one
`ask()` per fire, one payload shape. Keep Telegram copy compact but not
headline-only: treat it as the playbook page TLDR. Preserve the core point,
key numbers, and why-it-matters sentence from the playbook body. Prefer natural
prose for short/medium bodies, switch to concise bullet points only when the
body is already list-shaped or long and data-dense. Bullet count is not fixed;
fit as many meaningful short points as the remaining budget allows, then always
reserve room for the playbook link. Do **not** list sources in the Telegram
push; citations and full source rows live in the playbook. The hard budget is
500 chars because `/data/signal/targets` truncates at 500.

```javascript
function composePushPayload(event, playbookUrl) {
  const MAX_PUSH_CHARS = 500;
  const HEADLINE_CHARS = 140;
  const TLDR_BUDGET_CHARS = 330;
  const SHORT_BODY_CHARS = 180;
  const NATURAL_POINT_CHARS = 150;
  const BULLET_THRESHOLD_CHARS = 330;
  const MAX_BULLETS = 5;
  const MIN_BULLET_LINE_CHARS = 48;
  const BULLET_CHARS = 105;
  const linkLine = `Full update → ${playbookUrl}`;

  const stripMarkdown = (s) => String(s || "")
    .replace(/\[[0-9]+\]/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[`*_>#]/g, "")
    .replace(/\s+/g, " ")
    .replace(/\s+([.,!?;:。！？])/g, "$1")
    .trim();
  const tidyTruncation = (s) => String(s || "")
    .replace(/\s+\b(?:but|and|or|because|while|with|without|that|which|as|to|of|by|for|the|is|are)\s*…$/i, "…")
    .replace(/[,;:]\s*…$/, "…");
  const trimPoint = (s, limit) => {
    const clean = stripMarkdown(s);
    return clean.length > limit
      ? tidyTruncation(clean.slice(0, limit).replace(/\s+\S*$/, "") + "…")
      : clean;
  };
  const trimBlock = (s, limit) => {
    const clean = String(s || "").trim();
    return clean.length > limit
      ? tidyTruncation(clean.slice(0, limit).replace(/\s+\S*$/, "") + "…")
      : clean;
  };
  const fitSummary = (summary, limit) => {
    const clean = String(summary || "").trim();
    if (!clean || clean.length <= limit) return clean;
    if (!clean.includes("\n• ")) return trimBlock(clean, limit);

    const fitted = [];
    let used = 0;
    for (const line of clean.split("\n")) {
      const separator = fitted.length ? 1 : 0;
      const available = limit - used - separator;
      if (available <= 0) break;
      if (line.length <= available) {
        fitted.push(line);
        used += separator + line.length;
      } else if (fitted.length < 2 && available >= 48) {
        fitted.push(trimBlock(line, available));
        break;
      } else {
        break;
      }
    }
    return fitted.join("\n");
  };
  const sentencePoints = (body) => stripMarkdown(body)
    .split(/(?<=[.!?。！？])\s*/)
    .map(s => s.trim())
    .filter(Boolean);
  const bulletPoints = (body) => String(body || "")
    .split("\n")
    .map(s => s.trim())
    .filter(s => /^[-*•]\s+/.test(s))
    .map(s => s.replace(/^[-*•]\s+/, ""));
  const hasData = (s) => /[$€¥%]|\d|bps?\b|x\b|million|billion|trillion/i.test(s);
  const hasImpact = (s) =>
    /\b(guidance|margin|revenue|capex|inventory|orders?|shipments?|lead time|pricing|demand|supply|backlog|export|risk|watch|implies|means|matters|beat|miss|raise|cut)\b/i.test(s);
  const selectKeyPoints = (points, maxPoints = MAX_BULLETS) => {
    const cleaned = points.map(stripMarkdown).filter(Boolean);
    if (cleaned.length <= maxPoints) return cleaned;
    const selected = new Set([0]);
    const ranked = cleaned.slice(1).map((text, offset) => {
      const index = offset + 1;
      const score = (hasData(text) ? 3 : 0) + (hasImpact(text) ? 2 : 0) + (text.length <= 220 ? 1 : 0);
      return { index, score };
    }).sort((a, b) => b.score - a.score || a.index - b.index);
    for (const item of ranked) {
      if (selected.size >= maxPoints) break;
      selected.add(item.index);
    }
    return [...selected].sort((a, b) => a - b).map(index => cleaned[index]);
  };
  const bulletSummary = (points, budget) => {
    const selected = selectKeyPoints(points, MAX_BULLETS);
    const lines = [];
    let used = 0;
    for (const point of selected) {
      const separator = lines.length ? 1 : 0;
      const available = budget - used - separator;
      if (available < MIN_BULLET_LINE_CHARS) break;
      const lineLimit = Math.min(BULLET_CHARS, available - 2);
      const line = `• ${trimPoint(point, lineLimit)}`;
      if (line.length > available) break;
      lines.push(line);
      used += separator + line.length;
    }
    return lines.length >= 2 ? lines.join("\n") : trimPoint(selected[0] || "", budget);
  };

  function summarizeTldr(body, budget) {
    const compact = stripMarkdown(body);
    if (!compact) return "";
    const bullets = bulletPoints(body);
    const points = bullets.length >= 2 ? bullets : sentencePoints(body);
    const shouldUseBullets = bullets.length >= 2
      || (compact.length >= BULLET_THRESHOLD_CHARS && points.length >= 4 && points.filter(hasData).length >= 2);
    if (!shouldUseBullets && (compact.length < SHORT_BODY_CHARS || points.length < 2)) {
      return trimPoint(compact, TLDR_BUDGET_CHARS);
    }
    if (!shouldUseBullets) {
      return selectKeyPoints(points, 2)
        .map(p => trimPoint(p, NATURAL_POINT_CHARS))
        .join(" ");
    }
    return bulletSummary(points, budget);
  }

  const headline = trimPoint(event.push_line, HEADLINE_CHARS);
  const reserved = [headline, linkLine].filter(Boolean).join("\n").length + 2;
  const summaryBudget = Math.max(0, Math.min(TLDR_BUDGET_CHARS, MAX_PUSH_CHARS - reserved));
  const summary = fitSummary(summarizeTldr(event.body, summaryBudget), summaryBudget);
  const prefix = [
    headline,
    summary,
  ].filter(Boolean).join("\n");
  const prefixBudget = Math.max(0, MAX_PUSH_CHARS - linkLine.length - 1);

  return [
    prefix.slice(0, prefixBudget).trim(),
    linkLine,
  ].filter(Boolean).join("\n");
}
```

For `audience: "followers"` the output is the `meta.reason` of a
`signal/targets` record (§6). For `audience: "owner"` it's the `text` of a
`notify/message` record with `title = "${CONFIG.topic.name} · <date EST>"`.

### When to skip pushing

| Reason | `delivery.reason` | Notes |
|---|---|---|
| Quiet day + `quiet_day_policy: "skip"` | `quiet_day_skipped` | No `ask()` call; record still appended. |
| Below materiality bar | `not_material` | Deterministic materiality check rejected the run before generation. |
| Grounding failed | `grounding_failed` | Model output rejected; record appended with empty body. |
| All new matches were deduped | `all_deduped` | Record appended, `pushed=false`. |
| Daily push cap reached | `rate_limited` | Enforce `CONFIG.push_policy.max_pushes_per_day` before generation. |

Skipped events appear in the timeline as dimmed/collapsed rows — useful
for retro. Don't silently drop them.

### Deploy command

```bash
# Followers push (signal/targets on plain Feed; no FeedAltra)
alva deploy create --name <playbook-name> \
  --path '~/feeds/<name>/v1/src/index.js' \
  --cron "<CONFIG.cadence.cron>" --push-notify

# Owner push (notify/message) — same command; platform reads notify/message too
alva release feed --name <playbook-name> --version 1.0.0 \
  --cronjob-id <ID_FROM_DEPLOY> \
  --description "<one-sentence playbook purpose>"
```

See `references/feed-sdk.md` Patterns D and E for the full release flow;
for followers, `alva release feed` is mandatory or pushes arrive empty.

---

## 10. Page Layout

**Use `example/index.html` directly.** It's the canonical layout; do not
re-derive it from this section.

The rules the example already encodes — keep them when you adapt:

- Single vertical scroll. No tabs, filters, or snapshot picker. The
  timeline *is* the navigation.
- Container: `.playbook-container` on top of `design-tokens.css`.
- Reverse chronological; today on top, older days below; day separators
  in EST (`Today` / `Yesterday` / `Mon, Apr 14`).
- Read `digest/events/@last/N` on initial render. No live recomputation — the HTML is
  a view over stored records.
- No in-page header chrome above the feed. The outer playbook shell owns
  title, subscription, metadata, and any methodology/about surface. Keep
  `example/index.html` to the timeline only.

To adapt: change `USERNAME`, `FEED_PATH`, `<title>`, and the
`#playbook-config` JSON block. Leave the rest.

---

## 11. Components (AI Digest-unique)

The full markup and CSS for these components live in `example/index.html`.
This section names them and notes the contract — don't re-spec the styles.

- **Notification card** (`.notif-card`) — primary component, two states:
  `pushed` (full body) and `skipped` (collapsed header). Both render from
  the same event record.
- **Cite refs** (`.cite-ref`) — inline `[N]` anchors generated by
  replacing `[N]` markers in the rendered markdown body. Hover tooltip
  shows `citations[N].source` + `claim`; link to `citations[N].url` only
  when it is an `http:` or `https:` URL. Empty or structured-fact citations
  render as non-link refs.
- **Sources toggle** (`.notif-sources-toggle` / `.notif-sources`) — click
  to expand content matches plus cited `context_facts[]` under each pushed card.
- **Match row** (`.match-row`) — grid: source icon + label, title, and
  relative timestamp. Source-icon resolver (`sourceIcon()` in
  `example/index.html`) handles X/podcast/youtube/news favicons.
- **Fact row** (`.fact-row`) — structured fact row for cited
  `context_facts[]`, showing source, label/value, and timestamp.
- **Day separator** (`.day-separator`) — one per calendar day (EST).

Everything else reuses the shared design system and
`design-components.md` (markdown container, pills, typography). Do not
re-spec what those already provide.

---

## 12. Cron

Match frequency to the **slowest source you care about**. Over-polling
burns credits and produces low-value fires.

| Use case | Suggested cron |
|---|---|
| Daily brief | `0 12 * * *` (12:00 UTC ≈ 08:00 EDT / 07:00 EST) |
| Weekly brief | `0 13 * * 1` (Monday 13:00 UTC) |

**Cron in UTC; display times in EST in the HTML header and push title.**

`args.now` (ms, set when `alva deploy create --now` replays a missed run) is
honored throughout the pipeline — pass it into every timestamp-dependent
call. Do NOT use `args.now` to backfill pre-launch history; external search
APIs return currently-indexed results, not point-in-time state.

For `watch` mode, prefer polling intervals that match the source's freshness and
cost. A BTC price threshold can run every 5-15 min; a KOL stream or long-form
media watch usually doesn't need more than 30-60 min. This template should not
claim sub-minute delivery guarantees.

---

## 13. Hard Rules

- **Every cron fire appends one `digest/events` record** — even
  when `pushed=false`. The dedupe + retro workflow depends on it.
- **Every number in body must appear verbatim in a match or optional context fact**
  (grounding Gate C). Prevents LLM-fabricated figures.
- **Use plain `Feed`, not `FeedAltra`, for AI Digest feeds.** See §6 for the
  full `signal/targets` reasoning and fallback path.
- **Use `@alva/alvaask` only for LLM calls.** Relevance and generation both go
  through synchronous `ask()`; see §8 for call-site details.
- **If you use structured Alva numbers, route them through `context_facts`.**
  Do not paste SDK output into prose without a fact record that grounding can
  verify.
- **Honor `max_pushes_per_day` before generation.** Rate limiting is part of the
  user promise, not a UI preference.

---

## 14. Feed-script scaffold — single-call `@alva/alvaask`

The lowest-code AI Digest is **one `ask()` call per fire**: the model
runs its own search, filters, and writes grounded JSON, guided by a
strict prompt. Use this shape unless you need explicit source adapters
or structured numbers (§14.3).

### 14.1 The `ask()` contract

```javascript
const { ask } = require("@alva/alvaask");
const { text } = ask(userPrompt, {
  system: "<persona + must-use-live-search + JSON-only>",
  model: "claude-sonnet-4-6",   // full Alva ID; "sonnet" / dated IDs rejected
});
```

- **Synchronous.** Do not `await`. Parallelism = multiple call sites, not `Promise.all`.
- **`text` is raw.** May come fenced as ```` ```json ```` or with stray prose. Extract tolerantly:
  ```javascript
  const fence = text.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
  const parsed = JSON.parse(fence ? fence[1] : text);
  ```
- **Live search is on by default.** The system prompt MUST mandate tool use and forbid training-data recall — otherwise the digest silently cites year-old articles.
- **No `@alva/adk`.** `ask()` is the only LLM path for this template (relevance batching in §7.2 and digest generation both).

### 14.2 Prompt shape

Five sections, in order: (1) ISO `now` + lookback window, (2) scope +
named entities, (3) sourcing rules with **year discipline** — every
`match.ts` must fall in the window; older items are disqualified even
if topical, (4) exact JSON schema in a fenced code block with word
budgets and citation discipline spelled out, (5) a final self-check
("count words, verify citations are 1-indexed and contiguous"). The
self-check goes last because models follow checklists best when they
sit immediately before the output instruction.

### 14.3 Server-side gates after `ask()`

The model will sometimes cite stale items or repeat yesterday's news.
Three gates run in JS before writing the record:

1. **Freshness** — drop `match.ts < now - 48h`; if < 3 fresh remain, swap to a "quiet day" body.
2. **Dedupe** — 7-day rolling `dedupe_keys` in `ctx.kv`. All-seen → write `delivery.pushed=false`, no push.
3. **Throttle** — `lastRunMs` in `ctx.kv` short-circuits replays/double-deploys.

### 14.4 Skeleton

```javascript
const { Feed, feedPath, makeDoc, str, num, bool, obj, arr } = require("@alva/feed");
const { ask } = require("@alva/alvaask");

const feed = new Feed({ path: feedPath("<your-playbook-name>") });
const PLAYBOOK_URL = "https://<user>.playbook.alva.ai/<playbook>/<version>/index.html";

feed.def("digest", { events: makeDoc("AI Digest Events", "", [/* see §6 */]) });
feed.def("signal", { targets: makeDoc("Push Signal", "",      [/* see §6 */]) });

(async () => {
  await feed.run(async (ctx) => {
    const now = Date.now();

    // throttle
    const lastRun = Number(await ctx.kv.load("lastRunMs")) || 0;
    if (lastRun && now - lastRun < 6 * 3600_000) return;

    // one LLM call — model fetches, filters, grounds, writes JSON
    const { text } = ask(buildPrompt(now), { system: SYSTEM_PROMPT, model: "claude-sonnet-4-6" });
    const parsed = extractJson(text);

    // freshness + dedupe gates (§14.3)
    const fresh = (parsed.matches || []).filter(m => Number(m.ts) >= now - 48 * 3600_000);
    const seen = JSON.parse((await ctx.kv.load("seenKeys")) || "{}");
    const allOldDup = (parsed.dedupe_keys || []).length > 0
      && (parsed.dedupe_keys || []).every(d => seen[d.key]);
    const tooStale = fresh.length < 3;
    if (tooStale) Object.assign(parsed, quietDayPayload());

    // always write event; push only when material
    const record = { date: now, /* …push_line, body, citations, matches, dedupe_keys… */
      delivery: { pushed: !allOldDup && !tooStale, reason: ... } };
    await ctx.self.ts("digest", "events").append([record]);
    if (record.delivery.pushed) {
      await ctx.self.ts("signal", "targets").append([{ date: now,
        instruction: { type: "allocate", weights: [] },
        meta: { reason: composePushPayload(record, PLAYBOOK_URL) } }]);
    }

    // persist dedupe + throttle
    for (const d of parsed.dedupe_keys || []) seen[d.key] = now;
    await ctx.kv.put("seenKeys", JSON.stringify(seen));
    await ctx.kv.put("lastRunMs", String(now));
  });
})();
```

### 14.5 When to leave the single-call shape

Layer adapters in front of `ask()` and pass results as `INPUT_MATCHES` /
`CONTEXT_FACTS` (§8) when you need: fixed-handle subscriptions web
search misses (KOL feeds, subreddits, podcast RSS), structured Alva
numbers that must be quoted verbatim (§5), or threshold watches where
the trigger is a deterministic JS check.

### 14.6 Deploy

```bash
alva fs grant --path '~/feeds/<name>' --subject 'special:user:*' --permission read
alva deploy create --name <name> --path '~/feeds/<name>/v1/src/index.js' \
  --cron '<CONFIG.cadence.cron>' --push-notify
alva release feed --name <name> --version 1.0.0 --cronjob-id <ID> \
  --description "<one-sentence playbook purpose>"
```

### 14.7 Known platform quirks (v1 test findings, codified)

Surface of practical issues that surprised v1 implementors — if any bite
you during build, it's a template bug, not your bug.

| Area | Gotcha |
|---|---|
| Feed SDK schema | `arr("x")` without `fields` throws. Wrap primitive arrays; `dedupe_keys` uses `{key}` records. |
| Feed SDK read | Use `.last(n)` / `.first(n)` / `.range(from, to)`. There is no `.read({limit})`. |
| LLM SDK | Use `@alva/alvaask` `ask()` only. It is synchronous; do not `await` it. |
| Model IDs | Must be full Alva IDs (`claude-sonnet-4-6`, `claude-haiku-4-5`). Short names (`"sonnet"`) and dated Anthropic IDs (`"claude-haiku-4-5-20251001"`) are rejected. |
| FeedAltra | Pure AI Digest feeds use plain `Feed` even when writing `signal/targets` (see §6). |
| Outbound HTTP | Runtime's outbound proxy occasionally resets external fetches (iTunes, Serper). Wrap source adapters in a 1-retry loop; treat a failed source as "no matches", not fatal. |
| SDK discovery | Always `alva sdk doc --name <module>` before writing a new source adapter. Function names drift (e.g. `getSerperSearch`, not `searchSerper`). |
