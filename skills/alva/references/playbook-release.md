# Playbook Build And Release

Read this before writing playbook HTML, creating a draft, releasing a playbook,
or verifying a published playbook. This file owns the HTML, draft, and release
hard gates. Detailed design rules live in the design references; release CLI
gotchas live in [api/release.md](api/release.md).

## User scope enforcement

All write, deploy, draft, and release operations must target only the requesting
user's namespace. Before `fs write`, `release playbook-draft`, or
`release playbook`, verify the target path and username match `alva whoami`.

Do not write to or release playbooks under another user unless the request
explicitly asks for cross-user work such as remix lineage.

## Hard gate: before build HTML

<HARD-GATE id="before-build-html">

Before writing or rewriting playbook HTML, read design guidance for this
session.

Required evidence:

- [design-system.md](design-system.md) has been read first.
- Read [design-widgets.md](design-widgets.md) for widget layouts, chart cards,
  metric cards, tables, feed cards, free text cards, and group titles.
- Read [design-components.md](design-components.md) when using buttons, tags,
  dropdowns, tabs, modals, selects, inputs, markdown, tooltips, or switches.
- Read
  [design-playbook-trading-strategy.md](design-playbook-trading-strategy.md)
  only for strategy dashboards or blueprints that use its
  Overview/Analytics/Strategy/Feed tab structure.
- If a Skillhub blueprint is active, read its layout and data contract before
  HTML work starts.

If evidence is missing, stop and read the required file. Do not rely on memory
of prior sessions.

</HARD-GATE>

## Browser-safe feed reads

Published playbook HTML runs in the viewer's browser. It must fetch quantitative
data from public feed output paths at runtime. Use no inline literals for data
that appears in charts, tables, metric cards, or numerical prose.

Use this helper:

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

Do not emit `$ALVA_ENDPOINT`, sandbox env vars, or guessed API hosts into
browser HTML.

## Required files

Before a draft or release:

1. Write HTML to:

   ```bash
   alva fs write --path '~/playbooks/<name>/index.html' --file ./index.html --mkdir-parents
   ```

2. Write README to:

   ```bash
   alva fs write --path '~/playbooks/<name>/README.md' --file ./README.md --mkdir-parents
   ```

Every released playbook must have a README at that exact path. The README is
attached with `--readme-url`; do not add an in-HTML README chip or methodology
modal unless the active Skillhub blueprint explicitly requires one. The README
content shape, absolute `--readme-url` requirement, tags, trading symbols, and
`--skill-id` rules are canonical in [api/release.md](api/release.md).

## Hard gate: before playbook draft

<HARD-GATE id="before-playbook-draft">

Before running `alva release playbook-draft`, verify:

1. HTML exists at `~/playbooks/<name>/index.html`.
2. README exists at `~/playbooks/<name>/README.md`.
3. Target `name` and owner namespace match `alva whoami`.
4. Every feed included in `--feeds` has passed
   [feed-lifecycle.md](feed-lifecycle.md#hard-gate-before-feed-release).
5. Draft metadata (`display_name`, description, tags, trading symbols, feed
   list) matches the approved plan.
6. `--tags` and `--trading-symbols` satisfy
   [api/release.md](api/release.md#trading-symbols-and-tags).
7. If any Skillhub skill informed the build, `--skill-id <username>/<name>` is
   set.

If any item is missing, do not create the draft. Fix the artifact or ask for
missing metadata.

</HARD-GATE>

Run `playbook-draft` before every `release playbook`, including version bumps
and re-releases. It must include both URL-safe `name` and human-readable
`display_name`. Use subject first, keep display names within 40 characters, and
avoid `My`, `Test`, `V2`, and generic-only names.

## Release path by subscription

Resolve `subscription_tier` from `alva whoami`.

- **Pro users**: show the draft share URL
  `https://alva.ai/u/<username>/playbooks/<playbook_name>`, then ask whether
  to publish publicly or keep private. Publish only on approval.
- **Free users**: publish directly. Free users can create and publish unlimited
  public playbooks; free playbooks are always public. Do not proactively upsell.
  Mention Pro only when the user hits a private/paid/resource gated feature.

Use the canonical share URL in user-facing responses. Use `published_url` only
for verification such as screenshots.

## Hard gate: before playbook release

<HARD-GATE id="before-playbook-release">

Before running `alva release playbook`, verify:

1. Every backing feed has passed `before-feed-release`.
2. Every feed the HTML reads at runtime had a successful `alva deploy create`,
   and its `feed_id` appears in `--feeds`.
3. All referenced cronjobs are active.
4. HTML reads quantitative data from feed output paths at runtime, not inline
   literals, consistent with [content-legitimacy.md](content-legitimacy.md).
5. **Data is fresh**: enumerate every feed output path read by the HTML and
   every push sidecar (`signal/targets` or `notify/message`). Verify each exact
   `@last/1` or relevant path is non-empty and fresh. If any output is older
   than 2x its cron interval, warn the user before release or fix freshness.
6. Description and README source/cadence claims match actual feed scripts and
   deployed cronjobs.
7. The target user namespace is correct.
8. README is present, accurate, and passed via absolute
   `/alva/home/<username>/playbooks/<name>/README.md`.
9. Every push-only cronjob deployed with `push_notify: true` has a current
   `alva release feed --cronjob-id <that cronjob>` after the latest sidecar
   source write.

If any item fails, do not release. Fix the issue, rerun `playbook-draft` if
metadata or backing files changed, then re-enter this gate.
If any required release input is missing, stop here; do not infer metadata,
reuse stale ids, or publish a partial release.

</HARD-GATE>

## Screenshot verification

After release, take a screenshot from `published_url`:

```bash
alva screenshot --url <published_url> --out /tmp/screenshot.png \
  --compress --compress-quality 70 --compress-max-width 1280
```

If compressed capture returns `HTTP 500`, `HTTP 403`, `SCREENSHOT_FAILED`, or no
file, retry once without compression flags.

Before reading the output, verify it is a PNG:

```bash
head -c4 /tmp/screenshot.png | grep -q PNG || echo "SCREENSHOT_FAILED"
```

Do not describe a screenshot you did not take.

## Post-release note

After a public release, consider a pinned creator's note when it would help the
reader understand thesis, data choices, caveats, or future direction. Read
[creators-note.md](creators-note.md) before posting or pinning comments.
