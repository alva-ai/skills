# Fintwit Digest SDK Guide

Use this reference to write scripts with the official `@alva/fintwit-digest`
SDK. It documents the public API, run profile, pipeline state, ability
contracts, and override rules. It is not the Fintwit Intelligence query guide;
for read-only leaderboard/account/ticker data, use [fintwit.md](fintwit.md).

## What The SDK Does

`@alva/fintwit-digest` runs an opinionated FinTwit digest pipeline:

1. source digest items from configured KOL tracker feeds,
2. classify rows into digest-usable views/signals,
3. select ticker-level digest units,
4. enrich selected units with market context,
5. assemble evidence packets,
6. generate per-ticker cards,
7. render the digest document,
8. publish feed outputs.

The normal user script is intentionally thin. It supplies a run profile and, if
needed, overrides one or more abilities. Platform modules such as `@alva/feed`,
`alfs`, `net/http`, and `@alva/pi` are wired by the SDK adapter.

## Entry Point Shape

The standard jagent entry script only imports the SDK and supplies runtime-only
ports. Business inputs normally come from the run profile, not from script
constants.

```javascript
const { runFintwitDigest } = require("@alva/fintwit-digest");
const secret = require("secret-manager");

(async () => {
  await runFintwitDigest({ secret });
})();
```

In jagent, `runFintwitDigest()` resolves the profile in this order:

1. `input.profile` passed directly to `runFintwitDigest({ profile })`;
2. otherwise `require("env").args`.

The automation/runtime caller owns how `env.args` is populated. This SDK guide
documents the shape and consumption of that object; CLI and deployment mechanics
live in the Alva CLI docs and runtime references.

Override only the abilities whose business behavior changes. Omitted abilities
keep the default implementation. Ability overrides receive both the stage
`state` and `context.input`, so custom parameters should be read from
`context.input.ctx` or from explicit profile fields.

```javascript
const { runFintwitDigest } = require("@alva/fintwit-digest");
const secret = require("secret-manager");

(async () => {
  await runFintwitDigest({
    secret,
    abilities: {
      selectDigestUnits: async (state, context) => {
        const next = await context.runtimeCore().selectDigestUnits(state);
        return {
          ...next,
          selectedUnits: (next.selectedUnits || []).slice(0, 2),
        };
      },
    },
  });
})();
```

For the example above, the selector does not read `config` directly. It first
calls the default `selectDigestUnits` stage, which has already received source
rows constrained by the normalized profile, then trims the selected units to two.

## Public API

The runtime module exports:

```javascript
const {
  runFintwitDigest,
  createFintwitDigest,
  FINTWIT_DIGEST_ABILITY_NAMES,
} = require("@alva/fintwit-digest");
```

### `runFintwitDigest(input?)`

Jagent-first helper. Use this in Alva runtime scripts.

```typescript
function runFintwitDigest<TCtx = unknown>(
  input?: FintwitDigestJagentRunInput<TCtx>
): Promise<DigestPublishResult>;
```

`FintwitDigestJagentRunInput`:

| Field | Type | Required | Meaning |
| --- | --- | --- | --- |
| `profile` | `DigestRunProfile` | no | Explicit run profile. If omitted, the helper reads `require("env").args`. |
| `feedName` | `string` | no | Feed name override used by the default publisher. If omitted, the default output feed name is `fintwit-alpha-radar`. |
| `kolList` | `string[]` | no | Caller-owned compatibility field. Default abilities do not use it; custom abilities can read it from `context.input.kolList`. |
| `language` | `string` | no | Caller-owned compatibility field. Default abilities do not use it; use `profile.config.language` for default output language. |
| `ctx` | `TCtx` | no | Caller-owned context passed through to abilities as `context.input.ctx`. Prefer this for custom business parameters. |
| `abilities` | `Partial<FintwitDigestAbilities>` | no | Ability overrides. |
| `secret` | `{ loadPlaintext(name): string | Promise<string> }` | no | Secret port. Pass `require("secret-manager")` in production scripts. |
| `now` | `() => number` | no | Clock override for tests or deterministic runs. |

`runFintwitDigest` wires the jagent platform internally:

- `@alva/feed` for schemas and writes,
- `alfs` for source feed reads,
- `net/http` for market context fetches,
- `@alva/pi` for LLM card generation,
- the passed `secret` port for secret reads.

Do not pass platform ports to `runFintwitDigest`. If a script needs to own
platform wiring, use `createFintwitDigest()` instead.

### `createFintwitDigest(options?)`

Lower-level runner factory. Use this for tests, custom harnesses, or non-jagent
contexts where the caller supplies platform ports.

```typescript
function createFintwitDigest<TCtx = unknown>(
  options?: FintwitDigestOptions<TCtx>
): FintwitDigestRunner<TCtx>;
```

`FintwitDigestOptions`:

| Field | Type | Required | Meaning |
| --- | --- | --- | --- |
| `abilities` | `Partial<FintwitDigestAbilities>` | no | Override one or more pipeline abilities. |
| `platform` | `FintwitDigestPlatform` | no for all-custom abilities; yes for default abilities | Platform ports used by the default runtime core. |

`FintwitDigestRunner`:

| Field | Type | Meaning |
| --- | --- | --- |
| `run(input?)` | `(FintwitDigestRunInput) => Promise<DigestPublishResult>` | Runs the full ability pipeline. |
| `abilities` | `FintwitDigestAbilities` | The merged default + overridden ability map. |

`FintwitDigestRunInput`:

| Field | Type | Required | Meaning |
| --- | --- | --- | --- |
| `profile` | `DigestRunProfile` | no | Run profile. |
| `feedName` | `string` | no | Feed name override. |
| `kolList` | `string[]` | no | Caller-owned compatibility field visible to custom abilities only. |
| `language` | `string` | no | Caller-owned compatibility field visible to custom abilities only. |
| `ctx` | `TCtx` | no | Caller-owned context visible at `context.input.ctx`. |
| `platform` | `FintwitDigestPlatform` | no | Per-run platform override merged with options.platform. |

### `FINTWIT_DIGEST_ABILITY_NAMES`

Ordered public ability names:

```javascript
[
  "sourceDigestItems",
  "classifyDigestItems",
  "selectDigestUnits",
  "enrichDigestContext",
  "assembleEvidencePackets",
  "generateDigestCards",
  "renderDigestDocument",
  "publishDigestOutputs",
]
```

The SDK validates that every final ability is a function before running.

## Run Profile

`DigestRunProfile` is the default pipeline's business input. Keep source fields
at the top level and default digest settings under `config`.

```typescript
interface DigestRunProfile {
  flow_id?: string;
  channel_session_id?: number;
  source_user?: string;
  source_feed_root?: string;
  arrays_base_url?: string;
  config?: {
    fintwit_handles?: string[];
    window_hours?: number;
    cron_expression?: string;
    language?: string;
  };
  runtime?: {
    user_prompt?: string;
  };
}
```

Normalized defaults and constraints:

| Field | Required | Default | Constraint / meaning |
| --- | --- | --- | --- |
| `config.fintwit_handles` | yes | none | Handles to include. `@` is optional. Normalized to lowercase `@handle`, deduplicated, sorted. |
| `config.window_hours` | no | `24` | Integer lookback window, 1 through 168. |
| `config.language` | no | `zh-CN` | `zh-CN` or `en-US`; `zh`, `zh_cn`, `en`, and `en_us` normalize to those values. |
| `config.cron_expression` | no | `0 * * * *` | Stored schedule preference with 5 cron fields. The SDK normalizes it but does not schedule runs. |
| `runtime.user_prompt` | no | empty | Optional generation instruction, trimmed, max 2000 runes. |
| `flow_id` | no | `fintwit_daily_digest` | Must equal `fintwit_daily_digest` if provided. |
| `channel_session_id` | no | `1` | Positive integer automation compatibility field. |
| `source_user` | no | `zet` | Upstream tracker feed owner. |
| `source_feed_root` | no | `/alva/home/<source_user>/feeds` | Absolute upstream tracker feed root; trailing slash removed. |
| `arrays_base_url` | no | `https://data-tools.prd.space.id` | Market context API root. |

Unsupported keys under `config` are rejected. Do not put `source_user`,
`source_feed_root`, or `arrays_base_url` inside `config`.

### Where Profile Values Are Consumed

The default runtime calls `normalizeFintwitDigestRunProfile(profile)` during
`initializeRuntimeState()` and then copies normalized values into its internal
runtime context. Default abilities consume the normalized context, not the raw
profile object.

| Profile field | Consumed by default SDK behavior |
| --- | --- |
| `config.fintwit_handles` | `sourceDigestItems` turns handles into `<handle>-tweet-tracker` feed slugs and reads only those upstream tracker feeds. |
| `config.window_hours` | Initialization builds the digest window; `sourceDigestItems` filters source rows to that window; publisher writes `window_hours` metadata. |
| `config.language` | Classification labels, evidence text, card generation, renderer copy, and notification payload choose `zh` or `en` from this value. |
| `config.cron_expression` | Normalized and preserved for automation metadata. It is not used to schedule the run inside the SDK. |
| `runtime.user_prompt` | Added to LLM brief/card prompts as user run preferences. It does not change source selection or market data fetching. |
| `source_user` | Derives the default upstream tracker root when `source_feed_root` is omitted. |
| `source_feed_root` | `sourceDigestItems` reads tracker feeds below this root. |
| `arrays_base_url` | `enrichDigestContext` uses this as the Arrays/Data Tools API root for market context requests. |
| `flow_id` | Validated for automation compatibility; must be `fintwit_daily_digest` when present. |
| `channel_session_id` | Validated and carried through the normalized profile for automation compatibility. |

`feedName` is not part of `DigestRunProfile`. It is a run input field used by
the default publisher to choose the output feed path through `@alva/feed`.

### Custom Parameters

Do not add custom keys under `profile.config`; the SDK rejects unsupported
`config.*` keys before any ability runs. Use one of these patterns instead:

| Need | Put it where | Read it from |
| --- | --- | --- |
| Default SDK behavior should change for all users | Add a typed field to `DigestRunProfile` and update the SDK normalizer/default ability that owns it. | The new normalized profile/runtime context field. |
| One script needs custom ability behavior | `ctx` in `runFintwitDigest({ ctx, abilities })` | `context.input.ctx` |
| A custom ability needs a temporary top-level profile value | a namespaced top-level profile key, for example `custom_selection` | `context.input.profile.custom_selection` |
| A custom stage needs to preserve derived data for later stages | returned pipeline `state` | later ability `state` |

Top-level extra profile keys are preserved by TypeScript shape, but default
abilities ignore them unless the SDK is explicitly changed to consume them.
Prefer `ctx` for script-local behavior so default profile semantics stay stable.

Example using `ctx` for script-local behavior:

```javascript
const { runFintwitDigest } = require("@alva/fintwit-digest");
const secret = require("secret-manager");

(async () => {
  await runFintwitDigest({
    secret,
    ctx: {
      maxCards: 2,
    },
    abilities: {
      selectDigestUnits: async (state, context) => {
        const next = await context.runtimeCore().selectDigestUnits(state);
        const ctx = context.input.ctx || {};
        return {
          ...next,
          selectedUnits: (next.selectedUnits || []).slice(0, ctx.maxCards || 3),
        };
      },
    },
  });
})();
```

Example using a namespaced top-level profile field:

```javascript
await runFintwitDigest({
  profile: {
    config: {
      fintwit_handles: ["@aleabitoreddit"],
      window_hours: 24,
      language: "en-US",
    },
    custom_selection: {
      max_cards: 2,
    },
  },
  abilities: {
    selectDigestUnits: async (state, context) => {
      const next = await context.runtimeCore().selectDigestUnits(state);
      const custom = (context.input.profile || {}).custom_selection || {};
      return {
        ...next,
        selectedUnits: (next.selectedUnits || []).slice(0, custom.max_cards || 3),
      };
    },
  },
});
```

Do not write the same value as `profile.config.max_cards`; the default profile
normalizer will reject it before `selectDigestUnits` runs.

## Default Source Convention

The default `sourceDigestItems` ability reads KOL tracker feeds below:

```text
<source_feed_root>/<handle-slug>-tweet-tracker/v1/data/<source>/@last/<n>
```

For `@aleabitoreddit`, the default slug is:

```text
aleabitoreddit-tweet-tracker
```

Default sources:

| Source | Rows read | Purpose |
| --- | --- | --- |
| `quality/mentions` | `@last/100` | curated mention rows |
| `quality/signals` | `@last/100` | curated signal rows |
| `signals/raw` | `@last/100` | raw classified signal rows |
| `tweets/views` | `@last/80` | qualitative market views |
| `tweets/view` | `@last/80` | legacy view alias |

The runtime filters source rows to the normalized window. A handle with no
current rows simply contributes nothing. A custom source layout should override
`sourceDigestItems` instead of changing profile fields to mimic an unsupported
path.

## Pipeline State Model

Every ability receives the previous stage state and returns a new state. Keep
state additive: spread the input state, then add or replace fields owned by the
current ability.

Common state fields:

| Field | Type | Produced by | Meaning |
| --- | --- | --- | --- |
| `now` | `number` | initialization | Run timestamp in milliseconds. |
| `window` | `{ start, end, key, windowHours? }` | initialization | Active digest window. |
| `skip` | `DigestSkipState or null` | any ability | Run-level skip. Publisher writes skip output instead of normal digest tables. |
| `sourceItems` / `items` / `rows` | `DigestSourceItem[]` | `sourceDigestItems` | Source rows. Aliases are synced by the runner. |
| `classifiedItems` / `items` / `rows` | `ClassifiedDigestItem[]` | `classifyDigestItems` | Classified source rows. |
| `selectedUnits` / `selectedRows` | `DigestSelectionUnit[]` | `selectDigestUnits` | Selected ticker/unit rows. |
| `ranking` | `DigestSelectionUnit[]` | `selectDigestUnits` | Ranking used by later stages and metadata. |
| `marketContext` | `unknown` | `enrichDigestContext` | Market data/context for selected tickers. |
| `candidatePackets` / `preliminaryPackets` | `DigestEvidencePacket[]` | `assembleEvidencePackets` | All candidate evidence packets. |
| `selectedPackets` / `packets` | `DigestEvidencePacket[]` | `assembleEvidencePackets` or `generateDigestCards` | Packets used for card generation. |
| `packetRanking` | `DigestEvidencePacket[]` | `assembleEvidencePackets` | Packet ranking metadata. |
| `cards` | `GeneratedDigestCard[]` | `generateDigestCards` | Per-ticker digest cards. |
| `output` / `renderedDocument` / `rendered` | `RenderedDigestDocument` | `renderDigestDocument` | Final digest document. |

The runner synchronizes common aliases after each stage. For example,
returning `sourceItems` also populates `items` and `rows` for downstream
default abilities. Still, custom abilities should use the canonical field for
their stage and preserve incoming aliases when practical.

## Ability Context

Each ability receives `context?: FintwitDigestAbilityContext`:

```typescript
interface FintwitDigestAbilityContext<TCtx = unknown> {
  input: FintwitDigestRunInput<TCtx>;
  platform: FintwitDigestPlatform;
  runtimeCore(): FintwitDigestRuntimeCore;
  initializeRuntimeState(): Promise<DigestPipelineState>;
}
```

Use:

- `context.input` to read the original input/profile/context.
- `context.platform` only when an override truly needs direct platform access.
- `context.initializeRuntimeState()` in `sourceDigestItems` or full custom
  starts to get the normalized base state once.
- `context.runtimeCore().<ability>(state)` to call a default stage and then
  modify its result.

Do not call `initializeRuntimeState()` repeatedly to reset the pipeline. It is
memoized for the run; treat it as the initialized base, not a data reload API.

## Ability Contracts

### `sourceDigestItems(input, context) => SourceDigestItemsResult`

Input: `FintwitDigestRunInput`.

Output fields:

| Field | Required | Meaning |
| --- | --- | --- |
| `sourceItems` or `items` | yes, unless `skip` is set | Source rows to classify. |
| `sourceDebugRows` | optional | Rows written to `source/rows` by the default publisher. |
| `skip` | optional | Run-level skip when no digest should be produced. |

`DigestSourceItem` shape:

```typescript
interface DigestSourceItem {
  id?: string;
  sourceType?: string;
  sourceName?: string;
  handle?: string;
  authorName?: string;
  text?: string;
  publishedAt?: string;
  publishedAtMs?: number;
  tickers?: readonly string[];
  topics?: readonly string[];
  links?: readonly { url?: string; label?: string; sourceId?: string }[];
  raw?: unknown;
}
```

Custom source rules:

- Use real upstream rows; never synthesize rows only to avoid an empty digest.
- Set `publishedAtMs` when possible so window filtering and diagnostics are
  meaningful.
- Preserve original upstream payload in `raw` for traceability.
- Return an empty array for a valid no-current-data case; throw for upstream
  auth, HTTP, or schema failures.

Example:

```javascript
sourceDigestItems: async (input, context) => {
  const state = await context.initializeRuntimeState();
  const rows = await loadRowsSomehow();
  const sourceItems = rows.map((row) => ({
    id: String(row.id),
    sourceType: "custom-fintwit",
    sourceName: "custom-source",
    handle: row.handle,
    authorName: row.author_name || row.handle,
    text: row.text,
    publishedAt: row.published_at,
    publishedAtMs: Date.parse(row.published_at),
    tickers: row.tickers || [],
    links: row.url ? [{ url: row.url, label: "source" }] : [],
    raw: row,
  }));

  return { ...state, sourceItems, items: sourceItems };
}
```

### `classifyDigestItems(state, context) => ClassifyDigestItemsResult`

Input: `SourceDigestItemsResult`.

Output fields:

| Field | Required | Meaning |
| --- | --- | --- |
| `classifiedItems` or `items` | yes, unless `skip` is set | Source rows annotated for selection. |

`ClassifiedDigestItem` extends `DigestSourceItem`:

```typescript
interface ClassifiedDigestItem extends DigestSourceItem {
  classification?: Record<string, unknown>;
  viewType?: string;
  viewStance?: string;
  digestUse?: string;
  tickerRelevance?: string | number;
}
```

Custom classifier rules:

- Classification says what a row is; it should not select tickers or write
  final prose.
- Preserve source fields, especially `handle`, `text`, timestamps, tickers,
  links, and `raw`.
- Use `digestUse`, `viewStance`, and `tickerRelevance` consistently if later
  custom stages rely on them.

Example:

```javascript
classifyDigestItems: async (state) => {
  const classifiedItems = (state.sourceItems || state.items || []).map((item) => ({
    ...item,
    digestUse: item.tickers && item.tickers.length ? "candidate" : "context",
    viewStance: item.raw && item.raw.direction,
    classification: {
      confidence: item.raw && item.raw.confidence,
    },
  }));

  return { ...state, classifiedItems, items: classifiedItems };
}
```

### `selectDigestUnits(state, context) => SelectDigestUnitsResult`

Input: `ClassifyDigestItemsResult`.

Output fields:

| Field | Required | Meaning |
| --- | --- | --- |
| `selectedUnits` or `selectedRows` | yes, unless `skip` is set | Ticker/unit rows selected for digest. |
| `ranking` | strongly recommended | Ordered ranking for metadata and downstream "also discussed" logic. |

`DigestSelectionUnit` shape:

```typescript
interface DigestSelectionUnit {
  ticker?: string;
  score?: number;
  items?: readonly ClassifiedDigestItem[];
}
```

Custom selector rules:

- Selection decides what the digest covers. Keep LLM card candidates small;
  three selected card units is the default product shape.
- Include enough evidence items for packet assembly or later custom stages.
- Return deterministic ordering for stable output.

Example:

```javascript
selectDigestUnits: async (state) => {
  const byTicker = {};
  for (const item of state.classifiedItems || []) {
    for (const ticker of item.tickers || []) {
      const key = String(ticker).toUpperCase();
      if (!byTicker[key]) byTicker[key] = [];
      byTicker[key].push(item);
    }
  }

  const ranking = Object.entries(byTicker)
    .map(([ticker, items]) => ({ ticker, items, score: items.length }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return { ...state, selectedUnits: ranking, ranking };
}
```

### `enrichDigestContext(state, context) => EnrichDigestContextResult`

Input: `SelectDigestUnitsResult`.

Output fields:

| Field | Required | Meaning |
| --- | --- | --- |
| `marketContext` | optional but expected by default renderer/cards | Market data and context for selected tickers. |
| `mentionsByTicker` | optional | Grouped classified items by ticker. |

Custom enrichment rules:

- Financial values must come from Data Skills, official feed outputs, or a
  validated BYOD source.
- Preserve `selectedUnits`, `selectedRows`, and `ranking`.
- If extending the default market context, call the default stage first.

Example:

```javascript
enrichDigestContext: async (state, context) => {
  const next = await context.runtimeCore().enrichDigestContext(state);
  return {
    ...next,
    marketContext: {
      ...(next.marketContext || {}),
      custom_note: "extra validated context",
    },
  };
}
```

### `assembleEvidencePackets(state, context) => AssembleEvidencePacketsResult`

Input: `EnrichDigestContextResult`.

Output fields:

| Field | Required | Meaning |
| --- | --- | --- |
| `candidatePackets` or `preliminaryPackets` | recommended | All candidate packets. |
| `selectedPackets` or `packets` | yes, unless `skip` is set | Packets used for card generation. |
| `packetRanking` | recommended | Ordered packet metadata. |

`DigestEvidencePacket` shape:

```typescript
interface DigestEvidencePacket {
  ticker?: string;
  items?: readonly ClassifiedDigestItem[];
  selectedUnit?: DigestSelectionUnit;
  diagnostics?: Record<string, unknown>;
}
```

Default internals may also carry snake-case fields such as `selected_ticker`,
`tweets`, `ticker_brief`, `evidence_row_count`, and `distinct_handles`. If you
keep the default renderer/publisher, preserve those fields when calling the
default packet stage.

Custom packet rules:

- A packet should contain evidence that can support card logic for one ticker or
  slot.
- If one ticker has no card-worthy evidence, omit that packet or mark it as a
  fallback; do not fail the whole run.
- Keep diagnostics on the packet instead of hiding filtering decisions.

Example:

```javascript
assembleEvidencePackets: async (state, context) => {
  const next = await context.runtimeCore().assembleEvidencePackets(state);
  const selectedPackets = (next.selectedPackets || []).filter((packet) => {
    return (packet.items || packet.tweets || []).length > 0;
  });

  return {
    ...next,
    selectedPackets,
    packets: selectedPackets,
    packetRanking: selectedPackets,
  };
}
```

### `generateDigestCards(state, context) => GenerateDigestCardsResult`

Input: `AssembleEvidencePacketsResult`.

Output fields:

| Field | Required | Meaning |
| --- | --- | --- |
| `cards` | yes | Generated per-ticker cards. |

`GeneratedDigestCard` public shape:

```typescript
interface GeneratedDigestCard {
  ticker?: string;
  title?: string;
  body?: string;
  markdown?: string;
  generatedBy?: string;
  diagnostics?: Record<string, unknown>;
}
```

Default publisher compatibility:

- Use `generated_by` if the default publisher will write `digest/cards` or
  `notify/message` metadata.
- Keeping `generatedBy` as well is fine for consumers using the public
  camel-case shape.
- Use `error` on a card for per-card failures that should not fail the run.

Custom card rules:

- Cards synthesize evidence; they must not invent prices, events, or citations.
- Prefer fallback/skip cards for weak single-ticker evidence over thrown errors.
- Keep card count bounded; the default runtime only sends the top selected
  packets through card generation.

Example:

```javascript
generateDigestCards: async (state) => {
  const cards = (state.selectedPackets || []).map((packet) => ({
    ticker: packet.ticker,
    title: "$" + packet.ticker,
    markdown: "# $" + packet.ticker + "\n\n- Custom summary from packet evidence.",
    generated_by: "custom-script",
    generatedBy: "custom-script",
    diagnostics: {
      evidence_count: (packet.items || []).length,
    },
  }));

  return { ...state, cards };
}
```

### `renderDigestDocument(state, context) => RenderDigestDocumentResult`

Input: `GenerateDigestCardsResult`.

Output fields:

| Field | Required | Meaning |
| --- | --- | --- |
| `output` or `renderedDocument` | yes for custom renderer | Final document in public shape. |
| `rendered` | required if keeping the default publisher with a fully custom renderer | Internal default publisher shape. |

`RenderedDigestDocument` public shape:

```typescript
interface RenderedDigestDocument {
  title?: string;
  body?: string;
  markdown?: string;
  language?: string;
  cards?: readonly GeneratedDigestCard[];
  meta?: Record<string, unknown>;
}
```

Default publisher compatibility:

The default publisher reads `state.rendered`, not only `state.output`. The SDK
alias sync copies public `output` into `rendered` when it has `title` or
`markdown`, but the default publisher also expects internal fields for rich
metadata:

| `rendered` field | Used for |
| --- | --- |
| `title` | `digest/latest.title`, `notify/message.title` |
| `body` | `digest/latest.body`, `notify/message.body` |
| `markdown` | `digest/latest.markdown`, `digest/summary.markdown` |
| `bodyI18n` | `notify/message.body_i18n_json` |
| `selectedTickers` | selected ticker metadata |
| `handles` | source handle metadata |
| `slugs` | source feed slug metadata |
| `cards` | `digest/cards`, notification `generated_by` metadata |
| `packetsWithBriefs` | `digest/evidence` rows |

If you fully replace rendering and keep the default publisher, provide those
fields or accept sparse metadata. Safer pattern: call the default renderer and
modify `rendered.markdown` / `output.markdown`.

Example:

```javascript
renderDigestDocument: async (state, context) => {
  const next = await context.runtimeCore().renderDigestDocument(state);
  const rendered = {
    ...(next.rendered || {}),
    markdown: "# Custom Header\n\n" + ((next.rendered || {}).markdown || ""),
  };

  return {
    ...next,
    rendered,
    output: rendered,
    renderedDocument: rendered,
  };
}
```

### `publishDigestOutputs(state, context) => DigestPublishResult`

Input: `RenderDigestDocumentResult`.

Output:

```typescript
interface DigestPublishResult {
  published: boolean;
  output?: unknown;
  state?: DigestPipelineState;
}
```

The default publisher writes these feed outputs:

| Group / output | Meaning |
| --- | --- |
| `source/rows` | Source/debug rows. |
| `digest/selected` | Selected ticker/unit rows. |
| `digest/evidence` | Evidence packets and ticker briefs. |
| `digest/cards` | Per-card markdown, prompt, generated_by, and error. |
| `digest/summary` | Run summary, selected tickers, markdown, market context, metadata. |
| `digest/latest` | Latest rendered digest and `digest_json`. |
| `notify/message` | Push-friendly notification body and metadata. |

Override the publisher only when you intentionally do not want the default feed
contract. A dry-run publisher is useful for tests but not for scheduled
production automations:

```javascript
publishDigestOutputs: async (state) => ({
  published: false,
  output: state.output || state.rendered || null,
  state,
})
```

## Platform Ports

`FintwitDigestPlatform` exists for non-jagent harnesses and default runtime
internals:

```typescript
interface FintwitDigestPlatform {
  Feed?: FintwitDigestFeedConstructor;
  feedPath?: (feedName: string) => string;
  makeDoc?: (title: string, description: string, columns: unknown[]) => unknown;
  str?: (name: string) => unknown;
  num?: (name: string) => unknown;
  alfs?: unknown;
  http?: unknown;
  secret?: unknown;
  Agent?: unknown;
  getModel?: unknown;
  now?: () => number;
}
```

Ordinary jagent scripts should not construct this object. `runFintwitDigest()`
constructs it from official modules.

## Design Rules For Custom Abilities

- Override the smallest ability that owns the changed behavior.
- Preserve incoming state with `{ ...state }` unless intentionally replacing the
  whole pipeline branch.
- Prefer `context.runtimeCore().abilityName(state)` plus a small edit over
  copying default internals.
- Keep source, classification, selection, evidence, generation, rendering, and
  publishing responsibilities separate.
- Treat missing current rows as a valid empty/skip case; throw only for systemic
  failures.
- Do not let one weak ticker hard-fail a multi-ticker digest when it can be
  skipped or represented by a fallback card.
- Do not use LLM output as a factual data source. Cards may synthesize evidence;
  they may not invent facts.
- Keep production scripts thin. Move reusable business behavior into ability
  implementations or SDK changes, not into one-off runtime glue.
