# Remix Workflow

Remix lets users create a new playbook based on an existing published playbook.
The user copies a prompt from the Remix button on any playbook page and pastes
it into their agent. The agent then fetches the source playbook's code and UI,
customizes them per the user's preferences, and deploys a new playbook.

---

## Prompt Format

The Remix prompt arrives in this shape:

```
Use Alva skill to remix this Playbook(@alice/btc-momentum) into my own version:

1. Customize it based on my preferences
2. Deploy as a new playbook under my account

If I don't specify what to change, ask me what I'd like to customize.
```

The `@{owner}/{name}` token after "Playbook(" contains the two key fields:

| Field   | Description                                  | Extracted From        |
| ------- | -------------------------------------------- | --------------------- |
| `owner` | Username of the original creator             | Before the `/`        |
| `name`  | Filesystem name (URL-safe slug used in ALFS) | After the `/`         |

For the example above: owner = `alice`, name = `btc-momentum`.

Together they resolve to the ALFS base path (quote in CLI):

```
'/alva/home/{owner}/playbooks/{name}/'
```

**Behavior note**: If the user's prompt does not specify what to change (only
the default "Customize it based on my preferences"), the agent should **ask the
user what they'd like to customize** before proceeding.

---

## Step 1 — Read Playbook Metadata

```bash
alva fs read --path '/alva/home/{owner}/playbooks/{name}/playbook.json'
```

Returns JSON with structure:

```json
{
  "playbook_id": 42,
  "name": "btc-momentum",
  "description": "...",
  "releases": [
    {
      "version": "v1.0.0",
      "feeds": [
        { "feed_id": 100, "feed_name": "btc-ema", "feed_major": 1 }
      ]
    }
  ]
}
```

`releases` is ordered newest-first, so `releases[0]` is the latest
release. From `releases[0].feeds`, collect the feed refs you need to
inspect — each entry carries both `feed_name` (for ALFS paths) and
`feed_id` (for API calls).

---

## Step 2 — Download UI Layer (HTML Source)

**Download to a local file — do not regenerate from memory.** Redirect
`alva fs read` output into a local file so you can edit it in place
(e.g. with the `Edit` tool). Reconstructing the HTML from what you
remember of the read output drops layout details, comments, and working
code that the user expects to inherit.

```bash
alva fs read --path '/alva/home/{owner}/playbooks/{name}/index.html' > ./index.html
```

This is the full HTML source of the playbook dashboard — the ECharts
charts, metric cards, layout, and data-fetching logic. Edit this local
file directly in Step 5; do not rewrite it from scratch.

---

## Step 3 — Download Code Layer (Feed Scripts)

Each entry in `releases[0].feeds` carries `feed_name` — download each
feed's script source the same way:

```bash
alva fs read --path '/alva/home/{owner}/feeds/{feed_name}/v1/src/index.js' > ./{feed_name}.js
```

This contains the strategy logic, data fetching, and indicator
computations. As with the HTML, **modify the downloaded file in place**
rather than re-typing the script from your reading of it.

Optionally, read sample feed output to understand the data schema (this
one stays in stdout — it's reference, not a file you'll edit):

```bash
alva fs read --path '/alva/home/{owner}/feeds/{feed_name}/v1/data/{group}/{output}/@last/5'
```

---

## Step 4 — Content Legitimacy Audit

Remix inherits the source's provenance — don't propagate fabricated content
into a new namespace. Apply the [Content Legitimacy Rules](../SKILL.md#content-legitimacy-rules)
to both the source HTML and feed scripts: any value the user will see must
fetch from a feed at runtime. If the source has hardcoded arrays, inline
analyst ratings, procedural/RNG output, or pasted-in literals, either
refactor them into your own feed, strip the offending sections, or refuse
the remix and tell the user why. Do not `sed`-replace the username and
re-release a source whose data layer was never legitimate.

---

## Step 5 — Deploy as New Playbook

Follow the standard playbook creation flow (see SKILL.md), starting from
the local files you downloaded in Steps 2–3. **Edit those files in
place** with the `Edit` tool — change strategy parameters, swap data
paths to your own namespace, apply the user's customization request —
and only then upload them. Do not write fresh files from scratch.

1. **Edit local feed script** (the `./{feed_name}.js` from Step 3) and
   upload to ALFS:
   `alva fs write --path '~/feeds/{new-name}/v1/src/index.js' --file ./{feed_name}.js --mkdir-parents`
2. **Test** via `alva run --entry-path '~/feeds/{new-name}/v1/src/index.js'`
3. **Grant** public read: `alva fs grant --path '~/feeds/{new-name}' --subject "special:user:*" --permission read`
4. **Deploy cronjob**: `alva deploy create --name {new-name} --path '~/feeds/{new-name}/v1/src/index.js' --cron "..."`
5. **Release feed**: `alva release feed --name {new-name} --version 1.0.0 --cronjob-id ID --description "..."`
6. **Edit local HTML** (the `./index.html` from Step 2 — update data
   paths to point to your own feed) and upload:
   `alva fs write --path '~/playbooks/{new-name}/index.html' --file ./index.html --mkdir-parents`
7. **Write README** (mandatory) — adapt the source playbook's README to
   your data sources and methodology, then upload:
   `alva fs write --path '~/playbooks/{new-name}/README.md' --file ./README.md --mkdir-parents`.
   See [release.md → Playbook README](api/release.md#playbook-readme).
8. **Draft playbook**: `alva release playbook-draft --name {new-name} --display-name "..." --feeds '[{"feed_id":ID}]'`
9. **Release playbook**: `alva release playbook --name {new-name} --version v1.0.0 --feeds '[{"feed_id":ID}]' --changelog "..." --readme-url '~/playbooks/{new-name}/README.md'` (same ALFS path you wrote to in step 7; quote it to prevent local `~` expansion)

**Important**: The new playbook must use a unique name in your user space. The
feed scripts must use **your own** ALFS paths (not the original owner's) for
data storage — copy the logic, not the paths.

---

## Step 6 — Save Remix Lineage

After the new playbook is created, record the parent-child relationship:

```bash
alva remix --child-username {your_username} --child-name {new-name} --parents '[{"username":"{owner}","name":"{source-playbook-name}"}]'
```

---

## Example

Given prompt:

```
Use Alva skill to remix this Playbook(@alice/btc-momentum) into my own version:

1. Customize it based on my preferences
2. Deploy as a new playbook under my account

Add a summary section at the bottom.
```

Extracted: owner = `alice`, name = `btc-momentum`.

Agent downloads sources to local files (so they can be edited in place,
not retyped):

```bash
# 1. Metadata — releases[0].feeds carries feed_name + feed_id per ref
alva fs read --path '/alva/home/alice/playbooks/btc-momentum/playbook.json'

# 2. HTML source — saved locally for in-place editing
alva fs read --path '/alva/home/alice/playbooks/btc-momentum/index.html' > ./index.html

# 3. Feed source code (use feed_name from playbook.json) — saved locally
alva fs read --path '/alva/home/alice/feeds/btc-momentum/v1/src/index.js' > ./btc-momentum.js

# 4. (Optional) Sample data for schema understanding — reference only, no redirect
alva fs read --path '/alva/home/alice/feeds/btc-momentum/v1/data/market/ohlcv/@last/3'
```

Agent then runs the content-legitimacy audit on `./index.html` and
`./btc-momentum.js` (Step 4), edits those local files in place to apply
the user's customization, then uploads them under the user's own
namespace with a new name (e.g. `my-btc-strategy`) and releases.

Save lineage (assuming current user is `bob`, new playbook name is `my-btc-strategy`):

```bash
# 6. Save remix lineage
alva remix --child-username bob --child-name my-btc-strategy --parents '[{"username":"alice","name":"btc-momentum"}]'
```

---

## Key Differences from Building from Scratch

| Aspect         | From Scratch                 | Remix                                      |
| -------------- | ---------------------------- | ------------------------------------------ |
| SDK discovery  | Search partitions, read docs | Already chosen in source feed              |
| Data modeling  | Design schema from scratch   | Reuse source feed's `def()` schema         |
| HTML structure | Build per design system      | Adapt source HTML, change data paths       |
| Strategy logic | Write from requirements      | Modify existing logic per user preferences |
| Feed name      | User decides                 | Must be unique, distinct from source       |
