# Playbook Assembly

Use this reference when the request is to build, update, publish, or push-enable
a playbook. It owns the order of operations; module references own module
details.

## Route

Enter this flow for Dashboard / Playbook and Backtest / Strategy requests. For
Remix requests, use [remix-workflow.md](remix-workflow.md) first, then re-enter
this flow when deploying the remixed artifact.

Resolve the user's goal with one plan gate: either ask the one missing blocking
question, or present a short plan and build after approval. If the request
includes `/use-skill:<username>/<name>` with a concrete topic, fetch that
Skillhub blueprint first, state the chosen blueprint in the plan, then build
without stacking extra clarifying gates.

Completion means the delivered artifact matches the user's goal. If the goal
included a shareable playbook, release it, verify the published URL renders,
and summarize what is delivered.

## Assembly Order

1. **Choose data sources.** Discover the relevant Alva data skills or runtime
   modules before writing code. If SDK coverage is missing, follow the Content
   Legitimacy Rules in `SKILL.md`; do not fill gaps from agent knowledge.
2. **Build feeds.** Model every quantitative value as feed output. Use
   [feed-sdk.md](feed-sdk.md) for schema and output patterns. Strategy,
   backtest, target, alert, and portfolio feeds must use
   [altra-trading.md](altra-trading.md).
3. **Deploy feeds.** Run the feed, inspect output shape, grant public read on
   the feed path, deploy the cronjob, and release the feed. The
   `before-feed-release` gate lives in `SKILL.md`; [deployment.md](deployment.md)
   owns deploy details.
4. **Build HTML.** Pass `before-build-html`, then build HTML that reads
   quantitative data from feed outputs at runtime. Do not use inline
   quantitative literals or sandbox-only endpoints.
5. **Write release artifacts.** Write `index.html` and `README.md` under
   `~/playbooks/<name>/`. The README shape and absolute `--readme-url` rules
   live in [api/release.md](api/release.md#playbook-readme).
6. **Draft and release.** Pass `before-playbook-draft`, then create or update
   the draft. Pass `before-playbook-release` before publishing. Use
   `published_url` only for verification; give the user the canonical
   `https://alva.ai/u/<username>/playbooks/<name>` share URL.
7. **Verify.** Screenshot the deployed `published_url`; before reading the
   file, confirm the output is a PNG. If feed data is stale, missing, or not
   deployed, fix it before claiming success.
8. **Evaluate push.** After release or private draft completion, recommend push
   only for actionable, time-sensitive output. Push is not configured until the
   feed has the sidecar output, the cronjob has `--push-notify`, the feed was
   released after that change, a subscription exists, and a real run produces a
   fresh push body or `<|SKIP_NOTIFICATION|>`.

## HTML Gate

<HARD-GATE id="before-build-html">
Before writing or rewriting playbook HTML, read the applicable design guidance
for this session.

Required evidence:

- [design-system.md](design-system.md) has been read first.
- The relevant companion reference has been read when applicable:
  [design-widgets.md](design-widgets.md) for widget layouts,
  [design-components.md](design-components.md) for component details, and
  [design-playbook-trading-strategy.md](design-playbook-trading-strategy.md)
  for strategy/backtest playbooks.
- If a `/use-skill:` blueprint or template is active, its layout and data
  contract have been read before HTML work starts.

If this evidence is missing, stop and read the required design/reference file
before creating or editing HTML. Do not rely on memory of prior sessions.
</HARD-GATE>

Use this helper for published playbook HTML:

```javascript
const PUBLIC_ALFS_READ_URL = "https://api-llm.prd.alva.ai/api/v1/fs/read?path=";

async function readAlfsJson(path) {
  const resp = await fetch(PUBLIC_ALFS_READ_URL + encodeURIComponent(path));
  if (!resp.ok) {
    throw new Error(`Failed to load ${path}: HTTP ${resp.status}`);
  }
  return resp.json();
}
```

`$ALVA_ENDPOINT` is available to sandbox scripts and CLI verification only. Do
not emit it into browser HTML; anonymous viewers need the public gateway above.

## Draft Gate

<HARD-GATE id="before-playbook-draft">
Before running `alva release playbook-draft`, verify:

- The HTML has been written to `~/playbooks/{name}/index.html`.
- The README has been written to `~/playbooks/{name}/README.md`.
- The target `name` and owner namespace match `alva whoami`.
- Every feed included in `--feeds` has already passed `before-feed-release`.
- Draft metadata (`display_name`, description, tags, trading symbols, and feed
  list) matches the approved plan.
- `--tags` and `--trading-symbols` satisfy the overlap rule in
  [api/release.md](api/release.md#trading-symbols-and-tags).
- If any Skillhub skill informed this build, `--skill-id <username>/<name>` is
  set to that id ([api/release.md](api/release.md#skill-id)).

If any item is missing, do not create the draft. Fix the missing artifact or ask
the user for the missing metadata first.
</HARD-GATE>

Re-run `alva release playbook-draft` before each `alva release playbook` when
metadata, backing feeds, HTML, or README changed.

## Release Gate

<HARD-GATE id="before-playbook-release">
Before running `alva release playbook`, verify every item below. A successful
draft is necessary but not sufficient: release requires fresh feed coverage,
README coverage, and HTML/data consistency.

Required evidence:

1. Every backing feed has passed `before-feed-release`.
2. Every feed read by released HTML had a successful `alva deploy create`, and
   its `feed_id` appears in `--feeds`.
3. Cronjobs are active for all feeds referenced by the playbook.
4. HTML reads quantitative data from feed output paths at runtime, not from
   inline literals.
5. Latest data from each referenced feed is fresh for its cron interval.
6. Description/source/cadence claims match actual feed scripts and cronjobs.
7. The playbook is being released under the requesting user's namespace.
8. `~/playbooks/{name}/README.md` exists, is accurate, and is passed via
   absolute `--readme-url`.
9. Every push-notify cronjob has a current `alva release feed --cronjob-id`
   after the push sidecar was written.

If any item fails, do not release. Fix the issue, re-run
`alva release playbook-draft` if metadata or backing files changed, then
re-enter this gate.
</HARD-GATE>

Free users may hold at most one published playbook. If release would exceed the
cap, ask whether to delete the old playbook with `alva playbook delete --name
<old-name>` or keep both by upgrading; do not clear ALFS files as a substitute.
