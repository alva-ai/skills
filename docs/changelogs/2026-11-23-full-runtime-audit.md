# fix(alva): align trading, Playbook, Thesis, and runtime facts with the code (v1.32.6)

## 1. Background and Current State

Full is the skill the in-app chat Agent (sandbox-agent, Cube sandboxes) loads for
essentially all production chat, pinned to `@alva/toolkit-cli` v0.37.0. A
read-only audit of `skills/alva` v1.32.5 against toolkit v0.37.0, gateway
v0.49.1, backend v0.55.1, jagent, trex, and sdk-monorepo found statements that
make the Agent fail or act without consent.

## 2. Problem Model and End-to-End Behavior

- US equity execution: `api/trading.md` told the Agent to send
  `US_SPOT_AAPL_USD` and called `XNAS_SPOT_AAPL_USD` invalid. trex
  `pkg/signal/symbol.go` resolves only `XNAS`/`XNYS`/`XASE` prefixes to the
  configured equity broker (ibkr, alpaca, robinhood) and trades the plain
  ticker; `US_SPOT` maps to no venue, and neither the CLI nor the gateway
  translates it, so `trading execute` failed.
- Re-release: `playbook-creation.md` read `latest_release.feeds` from
  `playbook.json`; the file has `releases[]` (newest first) and `draft`
  (backend `alfsview_index_types.go`). `remix-workflow.md` already used
  `releases[0].feeds`.
- Narrowing a paid Playbook: through REST the backend treats an unset
  `confirm_end_paid_renewals` as confirmed (`playbook_visibility.go:113-121`),
  so subscribers' renewals stop without a prompt.
- Thesis create or unarchive can fail with `THESIS_ACTIVE_LIMIT_EXCEEDED`
  (`api/go/thesiserror/errors.go`); the skill had no branch for it.
- Remix: the page route adds a deployment `<script>` before `</head>`, a
  watermark before `</body>`, and a viewer bootstrap for token requests
  (gateway `playbook_page.go`, `htmlinject`); a curl copy carried them into the
  remix, which is injected again when served. A private source returns 404
  without a viewer token.
- Tags: "required asset overlap" is not enforced; the backend only trims,
  dedupes, and limits tags (`tagsutil.Validate`). The `/explore` tag filter is
  an exact, case-sensitive match, so ticker tags stay a discovery convention.
- jagent registers `path`, `url`, `crypto`, `buffer` (and `node:` forms); the
  skill said no Node built-ins exist.
- Sandbox: there is no package manager, but `onnx.md` said to install PyTorch
  and similar packages.
- Feed alerts: the SDK and jagent allow 256 records (32 KiB body, 1 MiB total)
  with distinct `publicationKey`s per source; the skill said 1 per source and
  16 total.
- Cronjobs: timeout defaults to 1800 s (max 3600 s); heap max 2046 MB; `deploy
  update` also takes heap, timeout, and run-as flags.
- Brokers: alpaca has no options and quantity orders only; robinhood has
  single-leg options.

## 3. Research, Findings, and Architecture Decision

Every changed statement was checked against the code paths above. Fixes stay
in the skill; product rules that need an owner (BYOK, the auto-trade consent
rule duplicated in sandbox-agent `CHANNEL.md`) are left out.

## 4. Implementation Design

- `references/api/trading.md`: equity rows use `XNAS_/XNYS_/XASE_SPOT_<T>_USD`;
  map from a resolved `US_SPOT_<T>_USD`; `US_SPOT_*`/`US_ETF_*` fail in
  execute.
- `references/api/broker.md`: alpaca and robinhood capabilities.
- `references/playbook-creation.md`: `releases[0].feeds`; ticker tags as a
  convention; consent before narrowing a paid Playbook.
- `references/api/release.md`: "Tickers in tags (convention)".
- `references/thesis.md`: `THESIS_ACTIVE_LIMIT_EXCEEDED` branch; tracking stops
  for paused or archived Theses (no close/delete).
- `references/remix-workflow.md`: strip serve-time additions; private sources
  404; step numbering.
- `references/jagent-runtime.md`, `references/operational-pitfalls.md`: Node
  built-ins.
- `references/onnx.md`: no package installs in the managed Sandbox.
- `references/feed-sdk.md`, `references/feed-lifecycle.md`: alert limits.
- `references/deployment.md`: cronjob limits and update flags.
- `references/annotation-edits.md`: dangling step reference.
- `SKILL.md`: version v1.32.6.
- `evals/alva-skill-docs`: new `target.runtime-audit-2026-11-23`; retained
  strings updated.

## 5. Verification and E2E Design

`node evals/alva-skill-docs/skill-doc-eval.mjs` passes; mutation smoke 83/83;
`durable-agent.test.mjs` 5/5.

## 6. Human Decisions and Interaction

Full is the source of truth for product policy. BYOK and the duplicated
auto-trade consent rule wait for owner decisions.

## 7. Outcome and Evidence

The Agent sends executable equity symbols, keeps Feed refs on re-release, asks
before stopping paid renewals, explains the active Thesis limit, and no longer
copies serve-time HTML into remixes.

## 8. Remaining Work

- BYOK: runtime allows the user's own OpenAI key and blocks Anthropic even with
  one; `alpi.md`, `SKILL.md`, `durable-agent.md`, and `secret-manager.md`
  disagree. Needs a product rule.
- Auto-trade consent: sandbox-agent `config/profiles/CHANNEL.md` and
  `references/agent-schedules.md` give opposite rules. Needs one owner.
- Runtime: altra2 `signal/targets` emits `US_SPOT_*`, which trex cannot
  execute, so equity Signal subscriptions fail.
- Low: `push-notifications.md` (`--channel-id` with name targets),
  `api/error-responses.md` (usage errors are plain text), alfs `~` expansion,
  `fintwit-digest-sdk.md` source list.
