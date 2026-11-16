# fix(alva): align the Full skill with runtime behavior

## 1. Background and Current State

- Several references in the Full skill (`skills/alva`, v1.32.0) described
  platform behavior that the services no longer match: trading signal units,
  broker venues, jagent globals and module versions, Feed grouped records,
  Worldline keyword matching, Playbook visibility and bundled Feeds, remix
  sources, annotation tags, and the skill update check.
- Each claim was re-checked against the source repositories at `origin/main`
  before editing; claims are cited in section 3.

## 2. Problem Model and End-to-End Behavior

- B1: a signal written in seconds after one in milliseconds is skipped silently
  (live dedup is `date <= watermark`), and `--execute-latest` trades a live
  account without a dry run.
- B2: indicator examples passed positional numbers; the SDK reads an options
  object, so the period was silently ignored.
- B3: agents wrapped code to avoid top-level `await`/timers/`fetch` that the
  runtime supports, and pinned `:v1.0.0` expecting exactly 1.0.0.
- B4: the "cross-run accumulation" pattern lost data (a later `append()` at the
  same date replaces the row), and docs said CLI reads were unflattened.
- B5: agents made private Feeds public to publish a Playbook, released publicly
  before switching to private/paid, and remixed from an unreleased root
  `index.html`.
- B6: the update check also reported an older remote tag as an "update".

## 3. Research, Findings, and Architecture Decision

- trex `README.md`, `pkg/signal/spec_test.go` (ms dates), `pkg/engine/engine.go`
  (`signal.Date <= state.Watermark` skip), `internal/services/trading/signal_reader.go`
  (last array element), `pkg/types/types.go` (`allocate`, `order`/`orders`,
  `predict`); alva-gateway `pkg/handler/trading.go` (`ExecuteLatest` executes
  without dry run, errors only logged).
- trex `internal/services/broker/wire.go`: ccxt set, alpaca, robinhood, webull,
  `ibkr_mcp` (reader + user-submitted instructions, `CreateOrder: false`).
- sdk-monorepo `sdks/algorithm/src/indicator/**` (`ema/rsi/bb(values, {period})`,
  bb fixed at 2σ); sdkhub `relative-strength-index-rsi/v1.0.0/code.js` exports
  `rsi`.
- jagent `internal/runner/script_execution.go` (top-level await/return),
  `built-ins/browser-compat.js` (timers, global `fetch`),
  `modules/require_spec.go` (omitted or `v1.0.0` → `^1.0.0`; `=x.y.z` pins).
- sdk-monorepo `sdks/feed/src/feed/core/timeSeries.ts` (grouping only within
  one `append()`); alfs `internal/fs/synth/filesystem.go` + `record.go`
  (reads flatten grouped rows); synthdb `timeseries.go` (`@range`/`@count` are
  `(from, to]`); jagent `modules/alfs` (`readFile` returns a Promise).
- worldline `api/proto/worldline/v2/worldline.proto` (keyword two-thirds rule,
  quoted phrases, fold of copies/referenced posts, category list); changelog
  `2026-11-04-remove-channel-commentary-decoder.md`; sdkhub `serper-search`
  exports `getSerperSearch`.
- alva-backend `playbook_publish.go` (release keeps `access_state`; bundled
  non-public Feed confirmation), `playbook_exposure_confirmation.go`,
  `playbook_visibility.go` (paid needs a price; widening re-checks bundled
  Feeds), `alfsview_index_types.go` (`layout_html`, `feed_major`); toolkit-ts
  `commandDefinitions.ts` / `dispatch.ts` (`playbooks set-visibility`,
  `release playbook --confirm-bundled-feed-exposure`, no Playbook delete).
- frontend-monorepo `inspectorAnnotations.ts` (`new-text`, body `originalText`).
- D1: teach the bundled-Feed confirmation instead of making Feeds public; make
  a Feed public only for direct public reads.
- D2: port the Slim annotation and remix wording, adapted to Full's CLI.

## 4. Implementation Design

- `references/api/trading.md`: one signal object, last-element rule, `order`/
  `orders`, millisecond example, `--execute-latest` and live-subscription
  warnings.
- `references/api/broker.md`: read venues from `alva broker describe`; add
  `webull`, `ibkr_mcp`.
- `references/jagent-runtime.md`, `altra-v1-legacy.md`, `feed-sdk.md`,
  `operational-pitfalls.md`: options-object indicators, `rsi` module name,
  `^1.0.0` default, supported top-level await/timers/`fetch`.
- `references/feed-sdk.md`, `api/filesystem.md`: no cross-run grouping, read-merge
  -append example, flattened reads, `await alfs.readFile`, `@count/<from>..<to>`,
  `(from, to]`.
- `references/search.md`: keyword semantics, drop `person_commentary`, fold
  wording, `getSerperSearch`.
- `references/deployment.md`: `alva playbooks --help`; no CLI Playbook delete.
- `references/remix-workflow.md`: read `releases[0].layout_html`; `v{feed_major}`
  paths; bundled Feed exposure.
- `references/playbook-creation.md`, `feed-lifecycle.md`: new "Visibility and
  bundled Feeds"; set private/paid after draft, read back, then release;
  `--confirm-bundled-feed-exposure` after telling the user.
- `references/annotation-edits.md`: real tag format, question-vs-change, an
  annotation is not permission to publish.
- `references/fintwit.md`: Alva client `fs.read` in playbook HTML.
- `references/preflight.md`, `scripts/version_check.sh`: `sort -V` comparison
  (newer only), record `last_check` after fetch and compare, documented silent
  cases.
- `SKILL.md`: drop "close or delete" from the Thesis verify sentence and
  "draft/private" stopping; version v1.32.1.
- `evals/alva-skill-docs`: new `target.runtime-contract-alignment` and
  `target.playbook-publication-alignment`; `retained.runtime`, mainline
  version and draft-only strings updated; four new mutations.

## 5. Verification and E2E Design

- `node evals/alva-skill-docs/skill-doc-eval.mjs --skill-dir skills/alva`
  (exit 0, 128/128 cases, 1540/1540 checks).
- `node evals/alva-skill-docs/mutation-smoke.mjs --skill-dir skills/alva`
  (64/64).
- `node --test evals/alva-skill-docs/durable-agent.test.mjs` (5/5).
- Against `origin/main` text the new and updated cases fail (123/128).
- `scripts/version_check.sh` run with a stubbed `curl`: newer tag reports,
  equal/older tags stay silent, fetch failure stays silent without writing
  `last_check`, second run within 8 hours is throttled, missing `sort -V`
  falls back to reporting any difference.

## 6. Human Decisions and Interaction

- Left unchanged pending product decisions: feed data reset / hand-written
  `@append`, `alva secrets get` plaintext, remix default scope, the Arrays
  data-tools host, Playbook tag/trading-symbol overlap, Thesis creation
  confirmation.

## 7. Outcome and Evidence

- Checks above pass.

## 8. Remaining Work

- `alva playbooks set-visibility` has no `--confirm-bundled-feed-exposure`;
  the gateway (`pkg/handler/playbook.go`) confirms the exposure automatically
  on that endpoint, so widening silently exposes bundled non-public Feeds. The
  skill now requires asking the user first; an explicit flag in toolkit-ts and
  the gateway would make this enforceable.
- Paid visibility needs a price, which the CLI cannot set.
