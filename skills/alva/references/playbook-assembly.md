# Playbook Assembly

Use this reference when the request is to build, update, publish, or push-enable
a playbook. It owns the order of operations; module references own module
details.

## Route

Enter this flow for Dashboard / Playbook, Backtest / Strategy, playbook update,
playbook release, and push-enabled playbook requests. For Remix requests, use
[remix-workflow.md](remix-workflow.md) first, then re-enter this flow when
deploying the remixed artifact.

Use this file as the assembly manual. `SKILL.md` only routes here; this file
owns Skillhub blueprint selection, planning, feed lifecycle, HTML gates, draft
and release gates, screenshot verification, and push evaluation.

## Planning and Skillhub

Resolve the user's goal with one plan gate: either ask the one missing blocking
question, or present a short plan and build after approval. Do not ask
clarifying questions and then require a second plan approval in the same
session.

If the request includes `/use-skill:<username>/<name>`, fetch that Skillhub
blueprint before planning:

1. Run `alva skillhub get <username>/<name>` and confirm a blueprint file is
   present. Convention is `template.md`; if absent, look for `README.md` or ask
   which file is the blueprint.
2. On 404 / not found, run `alva skillhub list` and look for close matches
   leniently: case-insensitive, substring on both halves of the id, and ignore
   separator differences. If exactly one obvious match exists, proceed and tell
   the user which id you corrected to; otherwise ask the user to choose.
3. Read the blueprint with
   `alva skillhub file <username>/<name> template.md` or the selected file. Do
   not proceed from memory of a prior session.
4. Pull additional files only when needed. Do not bulk-download a skill.
5. Treat the blueprint as authoritative for layout, sections, widgets, data
   contracts, and cadence. Deviate only where the user explicitly overrides it.

If the request is push-first, such as a digest, threshold tracker, stream watch,
or periodic alert, consider offering `alva/ai-digest` during planning. Push can
also be added to another playbook; the skill is a good option, not a
requirement.

Content arrangement is flexible. A blueprint's default sections are a floor,
not a ceiling: lead with the user's core question, add sections the request
demands, and fold near-empty sections instead of padding them.

Completion means the delivered artifact matches the user's goal. If the goal
included a shareable playbook, release it, verify the published URL renders,
return the canonical share URL, and summarize what was delivered.

## Data and Scope Rules

The global Content Legitimacy Rules in `SKILL.md` still apply. These additional
rules are specific to creating, updating, and releasing playbooks.

- **Build the pipeline, do not become the data source.** Every quantitative
  value shown in charts, tables, metric cards, or data-driven copy must come
  from an Alva SDK module, a published Alva feed, or a validated BYOD HTTP
  source wired into the feed pipeline.
- **Playbook HTML fetches data at runtime.** Static labels, colors, and layout
  config are fine, but quantitative data must not be embedded as inline
  literals in HTML.
- **`--feeds []` is only valid for UI-only releases.** If released HTML shows
  any numbers, charts, tables, or metric cards, `alva release playbook` must
  reference the deployed feeds in `--feeds`, and the HTML must fetch those feed
  outputs at runtime.
- **Keep playbooks self-contained.** Create new feeds for the current playbook
  unless the user explicitly asks to reuse an existing feed or another
  playbook's feed. Create new playbooks from scratch unless this is a version
  update.
- **Verify values from actual tool output.** When citing `published_url`,
  `feed_id`, ALFS paths, or screenshot results, copy them from the relevant
  command output. Use `published_url` for verification; give the user
  `https://alva.ai/u/<username>/playbooks/<name>` as the share link.
- **Stay in the requesting user's namespace.** Before any write, draft, release,
  deploy, or push-subscription operation, verify the target path/name and owner
  match `alva whoami`, unless the user explicitly asked for cross-user work.
- **Use Altra for strategy outputs.** Any feed that produces `signal/targets`,
  `signal/alerts`, backtests, portfolio simulation, equity curves, drawdowns,
  Sharpe, positions, or rebalancing logic must use
  [altra-trading.md](altra-trading.md).
- **Keep qualitative analysis separate.** Ratings, theses, and outlook text are
  not feed data. Either compute them from SDK data with a stated formula, or
  label them as AI analysis outside data tables.
- **Verify thematic ticker lists.** For sector or theme dashboards, cross-check
  each ticker's sector with an SDK call before building the feed; remove
  mismatches before release.
- **Descriptions and methodology must match reality.** Mention only data
  sources actually fetched by the feed script, and only claim an update cadence
  when deployment succeeded on that cadence.

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
   `before-feed-release` gate below owns the release evidence;
   [deployment.md](deployment.md) owns deploy command details.
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

Resource names for feeds, cronjobs, and playbooks must be 1-63 lowercase
alphanumeric characters or hyphens, and cannot start or end with a hyphen. Check
`~/feeds` and `~/playbooks` before choosing names to avoid conflicts.

## Feed Lifecycle

Every feed created or recreated for a playbook follows this lifecycle:

1. **Write** -- define schema and incremental logic with `ctx.kv`.
2. **Upload** -- write the script to `~/feeds/<name>/v1/src/index.js`.
3. **Test** -- run
   `alva run --entry-path '~/feeds/<name>/v1/src/index.js'` and inspect the
   output shape. For SDK modules not used yet in this session, run a small
   shape-check snippet first so the script matches the actual response nesting.
4. **Grant** -- make the feed root publicly readable with
   `alva fs grant --path '~/feeds/<name>' --subject "special:user:*" --permission read`.
5. **Deploy** -- create the scheduled cronjob with `alva deploy create`.
6. **Release** -- register the feed with `alva release feed` using the
   `cronjob_id` from deploy.

`alva run` is only a test step. It does not write production `@last` output.
Never proceed to grant, deploy, or release after a failed run, empty output, or
response shape mismatch.

### Feed Release Gate

<HARD-GATE id="before-feed-release">
Before running `alva release feed`, verify the exact feed script that will be
released has run successfully in this session.

Required evidence:

1. `alva run --entry-path '~/feeds/<name>/v1/src/index.js'` completed
   successfully after the latest source write.
2. The run produced the expected output groups and fields.
3. If the script changed after the run, re-run before release.
4. `special:user:*` read permission exists on the feed root path.
5. A public unauthenticated read of the feed data path returns HTTP 200, not
   403.
6. If the feed backs HTML, at least one public `@last` path that the HTML will
   read has a non-empty result after grant.

If any evidence is missing or stale, do not release. Re-run the feed, inspect
the output, and only then proceed.
</HARD-GATE>

If a build is interrupted and resumed, re-enter this gate from the top before
release.

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

## Push Setup

Subscriptions target feed/playbook resources, not output paths. The output path
only chooses the feed-alert source:

| Output stream | Feed-alert source | Use for | Delivery eligibility |
| --- | --- | --- | --- |
| `signal/targets` | `signal/targets` | Playbook signals, trading targets, actionable alerts | Users or groups explicitly subscribed to the feed or to a playbook that references the feed |
| `notify/message` | `notify/message` | Feed results, AlvaAsk reports, heartbeat checks, proactive alerts | Users or groups explicitly subscribed to the feed or to a playbook that references the feed |

Rules:

- Both streams dispatch the canonical `feed_alert_ready` event. Do not use the
  legacy names `playbook_data_ready` or `feed_run_complete` in new docs or
  agent instructions.
- A push-capable feed needs `--push-notify` on `alva deploy create`, then a
  feed release bound to that cronjob after the sidecar output exists.
- `--push-notify` only marks the feed publisher as capable of emitting alerts.
  It does not subscribe any user or group, and it does not bypass notification
  preferences.
- For `notify/message`, `body`/`text` containing `<|SKIP_NOTIFICATION|>`
  advances fanout without sending a user-visible push. Use it for quiet
  AlvaAsk, heartbeat, and monitor runs.
- Real delivery always requires an explicit subscription:
  `alva push-subscriptions subscribe-feed --username <owner> --name <feed>`,
  `alva push-subscriptions subscribe-playbook --username <owner> --name <playbook>`,
  or a group `/alva subscribe feed <id>` / `/alva subscribe playbook <id>`.

Keep stream schema examples in [feed-sdk.md](feed-sdk.md) Patterns D/E.
