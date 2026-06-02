# Playbook Creation

This is the concrete task guide for building, drafting, releasing, verifying,
and updating Alva playbooks. Read it for Dashboard / Playbook, strategy UI,
release, version update, and playbook edit tasks.

## Build Order

1. Complete [preflight.md](preflight.md) and route the request with
   [request-routing.md](request-routing.md).
2. Verify data coverage with [data-skills.md](data-skills.md) or BYOD.
3. Build feeds through [feed-lifecycle.md](feed-lifecycle.md).
4. Read [design.md](design.md), then the relevant design companion:
   [design-widgets.md](design-widgets.md), [design-components.md](design-components.md),
   or [design-playbook-trading-strategy.md](design-playbook-trading-strategy.md).
5. Build HTML that reads feed outputs at runtime.
6. Write HTML and README to ALFS.
7. Draft, lint, screenshot, and publish publicly by default unless the user
   explicitly asks to stop at draft/private.
8. Evaluate push setup with [push-notifications.md](push-notifications.md).

## HARD-GATE: before-build-html

<HARD-GATE id="before-build-html">
Before writing or rewriting playbook HTML, verify:

- [design.md](design.md) has been read first.
- The needed companion design reference has been read.
- If a `/use-skill:` blueprint is active, its layout and data contract have
  been read.
- [content-legitimacy.md](content-legitimacy.md) has been applied.

Do not rely on memory of prior sessions.
</HARD-GATE>

## Browser-Safe Feed Reads

Published HTML runs in the viewer's browser. It must not use `$ALVA_ENDPOINT`
or authenticated headers for feed data. Use the public anonymous ALFS read
gateway:

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

All quantitative data in charts, tables, and metric cards must be fetched from
feed output paths at runtime, not embedded as inline literals.

## UDFs

User-Defined Functions are strict opt-in. Use them only when the user asks for
a registerable/shareable interactive function such as "register a UDF", "let
viewers run this function", or "add a button that calls my analysis function".
Do not introduce UDFs for ordinary dashboards, scheduled refresh, filters, or
feed-backed charts.

When triggered, read [api/udf-runtime.md](api/udf-runtime.md). The reference
covers PBSV browser authentication, creator registration, `window.alva.udf`,
allowance consent, and release checks. Never hand-write bearer headers in
playbook HTML.

## README

Every released playbook ships a README at:

`~/playbooks/<name>/README.md`

It is the single source of truth for the playbook's "How does this work?"
surface. For every release, version bump, or rerelease, regenerate it from the
current HTML, feeds, metadata, and blind spots, then upload it again before
release. Do not reuse a prior-version README.

The canonical content shape lives in [api/release.md](api/release.md#playbook-readme).

## Draft

Before `alva release playbook-draft`, write:

```bash
alva fs write --path '~/playbooks/{name}/index.html' --file ./index.html --mkdir-parents
alva fs write --path '~/playbooks/{name}/README.md' --file ./README.md --mkdir-parents
```

<HARD-GATE id="before-playbook-draft">
Before `alva release playbook-draft`, verify:

- HTML exists at `~/playbooks/{name}/index.html`.
- README exists at `~/playbooks/{name}/README.md`.
- Target name and owner namespace match `alva whoami`.
- Every feed in `--feeds` has passed `before-feed-release`.
- Draft metadata matches the approved plan.
- `--tags` includes required asset overlap plus material related people:
  investors, company figures, officials/policymakers, Twitter/X KOLs.
- If Skillhub informed the build, `--skill-id <username>/<name>` is set.

If any item is missing, do not create the draft.
</HARD-GATE>

Use both URL-safe `name` and human-readable `display_name`. Put the subject
first, keep display names under 40 characters, and avoid `My`, `Test`, `V2`, or
generic-only names such as `Stock Dashboard`.

## Release

`alva release playbook` requires `--readme-url`, and it must be the absolute
ALFS path:

`/alva/home/<username>/playbooks/<name>/README.md`

Resolve `<username>` once via `alva whoami`.

After `playbook-draft` succeeds and `before-playbook-release` passes, call
`alva release playbook` without asking whether to stop at the draft version,
unless the user explicitly requested draft-only/private. Draft is a separate
version state; visibility (`public` / `private` / `paid`) applies after
publication. The default published visibility is public.

```bash
alva release playbook ... \
  --readme-url '/alva/home/<username>/playbooks/{name}/README.md'
```

<HARD-GATE id="before-playbook-release">
Before `alva release playbook`, verify:

1. Every backing feed passed `before-feed-release`.
2. Every feed the HTML reads at runtime has a successful deploy and appears in
   `--feeds`.
3. Cronjobs for referenced feeds are active.
4. HTML fetches quantitative data from feeds, not inline literals.
5. If UDFs exist, [api/udf-runtime.md](api/udf-runtime.md) has been read, the
   function is registered, and HTML uses `window.alva.udf`.
6. Latest data from each referenced feed is fresh; if older than 2x cron
   interval, warn the user or fix the feed.
7. Description and README source/frequency claims match actual scripts and
   cronjobs.
8. Target user namespace is correct.
9. README exists, is current, and is passed via absolute `--readme-url`.
10. Push-only feeds with `push_notify: true` have a current `alva release feed`
    after the push sidecar was added.
11. `alva lint playbook ./index.html` passes, or an intentional
    `--bypass-lint` is documented.

If any item fails, do not release. Fix it, rerun draft if metadata or files
changed, then re-enter this gate.
</HARD-GATE>

## Screenshot

After release, screenshot the deployed `published_url`, not the canonical share
URL. Prefer compression:

```bash
alva screenshot --url <published_url> --out /tmp/screenshot.png \
  --compress --compress-quality 70 --compress-max-width 1280
head -c4 /tmp/screenshot.png | grep -q PNG || echo "SCREENSHOT_FAILED"
```

If compressed capture fails with HTTP 500/403, `SCREENSHOT_FAILED`, or no file,
retry once without compression.

## Tier Flow

Pro users:

- Publish publicly by default after gates pass.
- To change a published playbook later, use `alva playbooks set-visibility`
  after `alva playbooks --help`. Private/paid are Pro-gated.
- If the user wants draft-only/private before publishing, stop at draft and say
  how to publish later.

Free users:

- Publish directly. Free playbooks are always public.
- Do not proactively upsell. Mention Pro only when the user hits a Pro-gated
  feature such as private/paid visibility or a resource limit.

Always output the canonical share link to the user. Use `published_url` for
verification steps such as screenshotting.
