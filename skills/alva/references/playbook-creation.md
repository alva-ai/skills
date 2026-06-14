# Playbook Creation

This is the concrete task guide for building, drafting, releasing, verifying,
and updating Alva playbooks. Read it for hosted app/share URL, screener app,
report surface, strategy UI, remix, annotation edit, release, version update,
and playbook subscription tasks.

The playbook tree has subroutes: new build, Skillhub-guided build, remix,
annotation/edit, release/version update, and push after release. Use this guide
only after routing confirms the user wants a hosted or shareable playbook
surface; ordinary financial-analysis questions should answer directly.

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
7. Draft, lint, publish, then screenshot the deployed `published_url` unless
   the user explicitly asks to stop at draft/private.
8. Evaluate push setup with [push-notifications.md](push-notifications.md).

## HARD-GATE: before-build-html

<HARD-GATE id="before-build-html">
Before writing or rewriting playbook HTML, verify:

- [design.md](design.md) has been read first.
- The needed companion design reference has been read.
- If a `/use-skill:` blueprint is active, its layout and data contract have
  been read.
- [content-legitimacy.md](content-legitimacy.md) has been applied.
- The HTML follows the Browser request rule below for every Alva data request,
  including cloned blueprints, templates, and existing HTML.
- The iframe HTML starts with useful playbook content by default, not a second
  title/header area. The hosted shell already renders playbook-level chrome;
  see [design.md#hosted-shell-boundary](design.md#hosted-shell-boundary).
  Add custom in-iframe chrome only when the user explicitly asks for it or the
  blueprint requires a distinct app-level header.

Do not rely on memory of prior sessions.
</HARD-GATE>

## Browser-Safe Feed Reads

Published HTML runs in the viewer's browser. It must not use `$ALVA_ENDPOINT`,
hard-coded API origins, raw browser `fetch()` calls to Alva APIs, or hand-written
auth headers for feed data. Load the browser SDK and use
`AlvaToolkit.AlvaClient`:

```html
<script src="https://unpkg.com/@alva-ai/toolkit/dist/browser.global.js"></script>
<script>
function createAlvaClientConfig() {
  const params = new URLSearchParams(window.location.search);
  const pbsvToken = window.alva?.udf?.getViewerToken?.();
  const apiOrigin = params.get("api_origin");
  return {
    ...(pbsvToken ? { pbsvToken } : {}),
    ...(apiOrigin ? { baseUrl: apiOrigin.replace(/\/$/, "") } : {}),
  };
}

function createAlvaClient() {
  return new AlvaToolkit.AlvaClient(createAlvaClientConfig());
}

async function readAlfsJson(path) {
  return createAlvaClient().fs.read({ path });
}
</script>
```

All quantitative data in charts, tables, and metric cards must be fetched from
feed output paths at runtime, not embedded as inline literals.

Browser request rule: generated playbook HTML uses `AlvaToolkit.AlvaClient`
SDK resource methods or `_request(...)` for Alva API requests. Initialize the
client immediately before each request so refreshed PBSV is included, pass
`api_origin` as `baseUrl` when present, and never pass `parent_origin` to
`AlvaClient`. This single path works for public and private playbooks; an
anonymous `/api/v1/fs/read` fetch is public-only and breaks after private
visibility changes.

## UDFs

User-Defined Functions are strict opt-in. Use them only when the user asks for
a registerable/shareable interactive function such as "register a UDF", "let
viewers run this function", or "add a button that calls my analysis function".
Do not introduce UDFs for ordinary dashboards, scheduled refresh, filters, or
feed-backed charts.

When triggered, read [api/udf-runtime.md](api/udf-runtime.md). The reference
covers PBSV browser authentication, `alva functions` creator registration,
`window.alva.udf`, allowance consent, and release checks. Never hand-write
bearer headers in playbook HTML or raw service requests for UDF setup.

## README

Every released playbook ships a README at:

`~/playbooks/<name>/README.md`

It is the single source of truth for the playbook's "How does this work?"
surface. For every release, version bump, or rerelease, regenerate it from the
current HTML, feeds, metadata, and blind spots, then write it to ALFS again
before release. Do not reuse a prior-version README.

The canonical content shape lives in [api/release.md](api/release.md#playbook-readme).

## Draft

Before `alva release playbook-draft`, write:

Use ALFS-native write/edit tools when available. The `--file` examples below
are for shell-only CLI sessions; in PI/jagent agent tool mode, write the same
content directly to the target ALFS paths.

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
   function is registered with `alva functions`, and HTML uses
   `window.alva.udf`.
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
12. Header duplication has been reviewed. If the iframe repeats the outer
    playbook title, description, last-updated text, automation controls, or
    share/open controls, confirm that the user explicitly requested custom
    in-iframe chrome or the blueprint requires a distinct app-level header.

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

A PNG or page shell is not enough. Pass screenshot verification only when the
image or targeted capture shows real feed-backed chart marks, table rows, or
KPI values. Blank frames, headers-only tables, loading/error fallbacks, and
fetch failures are data-rendering failures that must be fixed before claiming
the playbook is done.

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
