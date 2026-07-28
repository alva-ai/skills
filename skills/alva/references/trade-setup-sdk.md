# Trade Setup SDK Guide

Use this reference to create, edit, and diagnose **Trade Setup** automations
conversationally with the user. It documents the product model, the exact
config the SDK accepts, the provisioning flow, the editing flow, and how to
read a run for diagnosis. This is a behavior guide for you, the Alva agent —
not an end-user manual and not the SDK's internal API reference.

A Trade Setup watches **one instrument** against **one free-form trade setup**
the user describes in their own words. The SDK (`@alva/trade-setup-sdk`) owns
the pipeline; your job is to compose a correct config with the user, provision
the automation through the documented steps, relay the receipt the first run
delivers, and later help edit or explain it. Do not hand-roll the pipeline, and
do not touch the internals the SDK owns.

## What The SDK Does

`@alva/trade-setup-sdk` runs one opinionated trade-monitoring loop. Each
scheduled run makes exactly **one Trader Agent call** that:

1. maintains a persistent **Setup Card** (`thesis` / `position` / `what_now` /
   `decision_conditions`) for the instrument,
2. routes every new evidence item to exactly one of `discard` / `summary` /
   `alert`,
3. emits at most one user-facing message per run: an **Alert**, the daily
   **Routine Summary** (default 16:30 ET), or a quiet run (no delivery).

Everything else — evidence collection and dedup, output validation, delivery,
retries, quiet runs, and cross-run state — is enforced by code. The guiding
rule is **"Agent judges; code enforces."** The Trader Agent decides; it never
gets to skip validation, invent prices, or double-deliver.

The package is `@alva/trade-setup-sdk` v1.0.0 on the ALFS artifact registry
(staging now, production imminent). A user's entry script is ~6 lines: it
requires the package and calls `runTradeSetup`.

## Entry Contract

The Jagent entry script is a thin runtime wrapper. There is one hard
requirement that, if missed, silently breaks market data.

**`secret-manager` is main-script-only.** The entry script MUST
`require('secret-manager')` itself and pass the resulting `secret` port into
`runTradeSetup`. A registry-resolved package cannot load `secret-manager` from
inside itself; omit the explicit pass and every market-data fetch fails with an
Arrays 401, degrading the run to blind. Always write the canonical entry
below — do not "simplify" it by dropping the `secret` wiring.

```js
const secret = require('secret-manager');
const { runTradeSetup } = require('@alva/trade-setup-sdk');

(async () => {
  const result = await runTradeSetup({ feedName: 'trade-setup-<slug>', secret });
  console.log('TRADE_SETUP_RESULT ' + JSON.stringify({ runStatus: result.runStatus, reason: result.reason }));
})();
```

Notes on the entry:

- `feedName` names the output feed. Use `trade-setup-<slug>` (for example
  `trade-setup-tsla`) and keep it identical to the automation `--name` you
  publish under.
- The profile is **not** hard-coded in the script. When `profile` is omitted,
  `runTradeSetup` reads it from `env.args` — which the platform populates from
  the cronjob `--args` you pass at deploy time. That is where the config lives.
- `result.runStatus` is `completed` | `failed` | `quiet`; `result.reason` is the
  schedule reason (`in_window`, `after_hours_checkpoint`, `summary_checkpoint`,
  `force_run`, `setup_maintenance`, or `outside_window`). Logging both makes a
  run self-describing.

## Config Schema

The profile passed as `--args` has exactly four top-level blocks: `setup`,
`schedule`, `sources`, `test`. Validation is allow-list strict — an unknown key
anywhere throws a `ProfileError` naming the field, tickers are canonicalized and
deduped, HH:mm times are validated against the timezone, and text lengths are
bounded in runes. Compose the config to pass validation the first time.

### `setup` — the setup identity

| Field | Type | Required | Meaning / bound |
| --- | --- | --- | --- |
| `instrument` | ticker string | yes | The one watched instrument. Canonicalized (`GOOG`→`GOOGL`, `FB`→`META`, `BABA`→`9988.HK`). |
| `setup_text` | string | yes | The user's free-form setup, in their own words. ≤4000 runes. This is the heart of the automation. |
| `time_horizon` | string | yes | Free text, ≤64 runes (e.g. `swing`, `intraday`, `multi-week`). |
| `position` | string \| null | no | User/broker position fact, free text ≤500 runes. `null` when unknown. **Never inferred** — supply only what the user states. |
| `benchmarks` | ticker[] | no | 0–4 benchmark tickers (e.g. `["SPY","QQQ"]`). |
| `comparators` | ticker[] | no | 0–8 peer/relative-value tickers. |
| `setup_revision` | integer ≥1 | yes | Monotonic edit counter. Start at `1`; bump on every edit. |
| `init_context_note` | string \| null | no | One-shot background used only on the first (init) run, ≤2000 runes. Not evidence; never supplied again. |
| `language` | `zh-CN` \| `en-US` | no | Output language, default `zh-CN`. `zh`/`en` normalize. |
| `timezone` | IANA tz | yes | Validated via `Intl` (e.g. `America/New_York`). |

### `schedule` — when the run is active

| Field | Type | Bound | Meaning |
| --- | --- | --- | --- |
| `active_windows` | `[start,end][]` | 1–4 ranges | HH:mm windows of active monitoring; `start` < `end` within each. |
| `after_hours_checks` | HH:mm[] | 0–4 | Extra checkpoint times outside the windows. |
| `summary_time` | HH:mm | required | When the daily Routine Summary is due (default product time 16:30). |

The cron expression itself is **backend-owned** and set at deploy time (not in
this block). The schedule block tells the run whether it is active/summary-due
at the instant it fires; the cron tells it *when* to fire. Keep them coherent —
e.g. a `*/30 12-23 * * 1-5` UTC cron covers an `08:00`–`16:30` ET window.

### `sources` — evidence sources

Every non-market source is optional and **degrades rather than fails** the run.

| Source | Shape | Default | Notes |
| --- | --- | --- | --- |
| `news` | `{enabled, keywords[], lookback_days, relevance_min, max_records}` | enabled | `keywords`: 0–40 strings (≤64 runes each) — ticker + company + theme terms. `lookback_days` 1–14 (5), `relevance_min` 0–1 (0.55), `max_records` 1–20 (8). |
| `earnings` | `{enabled}` | enabled | Earnings calendar/results source. |
| `anomaly` | `{enabled, feed_path}` | enabled | Price/volume anomaly source; `feed_path` (absolute `/alva/…`) optional, `null` by default. |
| `wilf` | `{enabled, feed_path}` | disabled | Fundamental source. Has **no default path** — if you enable it you MUST set `feed_path` to an absolute `/alva/…` feed. |

### `test` — run overrides

All boolean, all default `false`: `force_run` (run even outside window),
`force_summary` (force the summary), `preview` (full run, **no** user delivery),
`trace` (capture the full model prompt/packet/responses into a `debug.trace`
row). Leave `trace: true` for a live-test automation you may need to diagnose;
turn it off for long-lived production automations.

### A complete profile

This is the exact object you pass as the cronjob `--args` (composed with the
user for a TSLA swing breakout):

```json
{
  "setup": {
    "instrument": "TSLA",
    "setup_text": "Robotaxi rollout plus Q3 delivery reacceleration set up a technical breakout above the prior swing high; watching for a confirmed break on rising volume, invalidated on a close back below the range.",
    "position": null,
    "time_horizon": "swing",
    "benchmarks": ["SPY", "QQQ"],
    "comparators": [],
    "init_context_note": null,
    "setup_revision": 1,
    "language": "zh-CN",
    "timezone": "America/New_York"
  },
  "schedule": {
    "active_windows": [["08:00", "16:30"]],
    "after_hours_checks": ["18:00"],
    "summary_time": "16:30"
  },
  "sources": {
    "news": { "enabled": true, "keywords": ["TSLA", "Tesla", "robotaxi", "deliveries", "FSD"] },
    "earnings": { "enabled": true },
    "anomaly": { "enabled": true },
    "wilf": { "enabled": false, "feed_path": null }
  },
  "test": { "trace": true, "force_run": false, "force_summary": false, "preview": false }
}
```

## Conversation Flow: Creating A Setup

When a user wants to watch an instrument against a trade idea, drive the
conversation in this order. Do not skip the confirmation step — `setup_text` is
the whole automation.

1. **Gather the instrument.** One ticker. Confirm the canonical listing if the
   user gives an alias.
2. **Gather the setup idea.** Get the user's thesis in their own words. This
   becomes `setup_text` verbatim-in-spirit. Ask what would confirm it and what
   would invalidate it — that sharpens the text the Agent formalizes into the
   card, but keep it the user's language, not yours.
3. **Gather optional facts.** Time horizon (default to a sensible `swing` /
   `intraday` and confirm); position **only if the user states one** (never
   infer); benchmarks/comparators if relevant; news keywords (ticker + company
   name + theme terms).
4. **Compose and confirm `setup_text`.** Read the composed setup back to the
   user in one or two sentences and get explicit agreement before provisioning.
   This is the point of no cheap return — a wrong `setup_text` means a wrong
   card on the first run.
5. **Provision** through the four steps below.
6. **Relay the receipt.** The first run creates the Setup Card and delivers a
   **"Trade Setup 已就绪"** init receipt to the user's bound channel. Confirm in
   chat that the automation is live and summarize the card it created.

## Provisioning: Four Steps, Order Matters

All four are done via the `alva` CLI / platform tools. Each has a distinct
failure mode when skipped; do all four, in order.

1. **Write the entry script.** Write the canonical entry (see
   [Entry Contract](#entry-contract)) to `~/tasks/<name>/src/index.js`. The
   `entry_path` must live under the user's home; pass it to `deploy create` in
   absolute `/alva/home/<user>/…` form.

2. **Create the cronjob.**

   ```bash
   alva deploy create \
     --name trade-setup-tsla \
     --path /alva/home/<user>/tasks/trade-setup-tsla/src/index.js \
     --cron "*/30 12-23 * * 1-5" \
     --push-notify \
     --args '<profile JSON from above>'
   ```

   Pass exactly one of `--push-notify` / `--no-push-notify`. *Missed entirely:*
   the automation never runs.

3. **Publish the automation.**

   ```bash
   alva automation publish \
     --name trade-setup-tsla \
     --version 1.0.0 \
     --cronjob-id <id from step 2> \
     --description "TSLA robotaxi/Q3 swing breakout watch"
   ```

   Returns the `feed_id`, and this is the step that first makes the automation
   real: the first validating run fires here, creating Setup Card v1 and
   delivering the **"Trade Setup 已就绪"** init receipt push. *Missed:* the
   automation is invisible in the Alva App and every push arrives with an EMPTY
   body.

4. **Enable the alert.**

   ```bash
   alva alert enable --automation <user>/trade-setup-tsla
   ```

   Creates the `FEED_ALERT` subscription that actually delivers to the user.
   *Missed:* the automation runs and writes feeds, but no push ever reaches the
   user.

Keep the automation `--name`, the entry `feedName`, and the cronjob/publish
names identical across all four steps.

## Editing Flow

The **only** user-editable surface is `setup_text` plus a few structured facts
(`position`, `time_horizon`, news `keywords`, source toggles). The **Setup Card
itself is agent-authored and never directly editable** — no tool, API, or skill
may write `setup/current` outside the SDK's own run. When a user asks to change
what's being watched:

1. **Rewrite `setup_text` with the user** (or update the structured fact they
   named), the same way you composed it originally. Confirm the new wording.
2. **Bump `setup_revision`** by one (e.g. `1` → `2`) in the profile.
3. **Update the cronjob `--args`** with the new profile (new `setup_text` +
   incremented `setup_revision`), leaving everything else in place.
4. On the **next run**, the Trader Agent reconciles the existing Setup Card
   *minimally* against the new setup description (preserving position, instrument,
   and language; changing only what the revision changes) and delivers a
   **"Trade Setup 已更新"** receipt. Relay that to the user.

Never rebuild the card yourself, never edit `setup/current`, and never edit any
field outside the editable surface to "fix" a card — a revision bump is the only
correct path.

## Diagnosis

When the user asks "why didn't I get an alert?", "why was that discarded?", or
"why did the run fail?", read the automation's feed tables and KV state. Never
force-trigger a run to reproduce (see [Red Lines](#red-lines)) — the answer is
already written in the last run's tables.

### Data Dictionary

Feed tables live under `<feed>/v1/data/<group>/<name>`; every row carries a
`date` (epoch ms) timeseries index.

| Table | Holds | Use it to answer |
| --- | --- | --- |
| `setup/current` | The current Setup Card: `card_markdown`, `card_json`, `decision_note`, `setup_revision`, `run_status`. | "What is the automation watching / thinking right now?" |
| `setup/history` | One row per **visibly changed** card (`card_markdown`, `decision_note`). Append-only. | "How did the thesis/what_now evolve?" |
| `monitor/evidence` | Per-run audit: `source_statuses_json`, `new_evidence_json`, `evidence_decisions_json` (each item's `route` + `reason`), `decision_note` (with live prices), `run_status`, `failure_reason`, `attempts_json` (LLM attempt meta). | "Why was this evidence discarded? What did the run see? Why quiet?" |
| `notify/message` | The push message `{date, title, body}`. Quiet runs write the `<|SKIP_NOTIFICATION|>` sentinel as the body. | "What was actually delivered (or why nothing)?" |
| `summary/daily` | The delivered Routine Summary `body`. | "What did the daily summary say?" |
| `debug/trace` | FULL forensic record: the entire model `prompt`, the rendered `packet_json`, and the full `attempts_json` with raw responses. Only written when `test.trace` is on. | "What did the model actually see and say?" — the only input-side source. |

Cross-run state lives in `@kv` keys: `setupCard`, `lastDecisionNote`,
`processedEvidenceIds`, `recentTechnicalIds`, `pendingSummary`,
`recentDeliveries`, `appliedSetupRevision`, `initReceiptSent`, `lastRunAtMs`.

Delivery audit is separate from the feed: `alva notification-history list-feed`
shows what actually pushed to the user's bound channel (Slack / Telegram / web
via `FEED_ALERT`).

### Diagnostic Order

Work outside-in; most questions are answered by the first two tables.

1. **Start with `setup/current` (the card) + its `decision_note`.** These
   answer most "why is it quiet / why unchanged" questions directly — the note
   is the Agent's own one-or-two-sentence rationale, with live prices.
2. **Drill into `monitor/evidence`** for routing and failures: read
   `evidence_decisions_json` for the per-item `route`+`reason` ("why discarded"),
   `source_statuses_json` for a degraded source, and `failure_reason` +
   `attempts_json` when `run_status` is `failed`.
3. **Open `debug/trace`** only for input-side forensics — "what did the model
   actually see in the packet, and what did it literally respond?" Requires
   `test.trace` to have been on for that run.

### Diagnosis Q&A

- **"Why no alert this run?"** A quiet run is normal and correct when nothing
  crossed the alert bar. Check `notify/message` — a `<|SKIP_NOTIFICATION|>` body
  means the Agent deliberately stayed quiet. Confirm with the `decision_note`
  and the `evidence_decisions` routes (all `discard`/`summary` → no alert). An
  alert is only written when at least one new evidence item is routed `alert`.
- **"Why was <this news> discarded?"** Find the item in
  `evidence_decisions_json`; its `reason` states why (irrelevant, repetitive, or
  not useful enough to interrupt the user). Repeats of already-delivered facts
  are discarded by design — check `recentDeliveries`.
- **"Why did the run fail?"** `run_status: failed` in `monitor/evidence`;
  `failure_reason` names it and `attempts_json` shows the LLM attempts. Market
  data failing with a 401 across sources points at a broken entry (missing
  `secret` pass — see [Entry Contract](#entry-contract)).
- **"Did the user actually get it?"** The feed writing a message is not proof of
  delivery. Confirm with `alva notification-history list-feed`. Empty push
  bodies point at a missing `automation publish` (step 3); no delivery at all
  points at a missing `alert enable` (step 4) or a severed producer cronjob.
- **"Why didn't my edit take effect?"** Compare `setup_revision` in the profile
  against `appliedSetupRevision` in KV. The reconcile only happens when the
  config revision is strictly greater; if you updated `--args` but didn't bump
  the revision, the run treats it as a stale re-render and does nothing.

## Lifecycle: Updating An Automation

Every change you will be asked for in conversation has an in-place path — you
never replace a cronjob:

- **Config change (setup edit, keywords, source toggles, schedule windows):**
  `alva deploy update --id <cronjob> --args '<new profile JSON>'` — remember
  the `setup_revision` bump for setup edits.
- **Cron timetable change:** `alva deploy update --id <cronjob> --cron "<expr>"`.
- **SDK upgrade:** a new registry version; entries and cronjobs are untouched.
- **Entry-script change:** overwrite `~/tasks/<name>/src/index.js` via
  `alva fs write`; the next run picks it up.

**True redeploys (replacing the cronjob) are an operations procedure — never
perform one in conversation.** They are only needed for incident recovery,
renames, or cross-environment migration, and doing them out of order silently
severs push delivery. If you see the fingerprint — runs completing and feeds
writing normally, but `alva notification-history list-feed` empty after some
lifecycle change — tell the user the automation's producer binding is severed
and needs an operator rebind (documented in the SDK repo's README); do not
attempt the repair yourself.

## Red Lines

These are hard constraints. Violating them has corrupted live automations in
practice.

- **Never force-trigger a run against a live automation's feed to debug it.** A
  run consumes one-shot state — evidence processed-marks and the single init
  receipt. Reproducing against the live feed destroys exactly the state you are
  trying to explain. Read the already-written tables instead; if you truly must
  replay, that is a throwaway-sandbox operation, never the live feed.
- **Never write the Setup Card directly.** `setup/current` and the `setupCard`
  KV are agent-authored through the SDK's own persistence path only. To change
  what's watched, edit `setup_text` and bump `setup_revision`.
- **Never delete a producer cronjob.** The feed is bound to its cronjob
  server-side; deleting it severs the binding, drops the automation to a
  no-producer state, and the platform then silently drops every push. Lifecycle
  changes (redeploys, rebinds) go through the documented deploy flow.
- **Never claim delivery you haven't verified.** A written feed row is not a
  delivered push; confirm via notification history.
