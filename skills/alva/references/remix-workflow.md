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
  "latest_release": {
    "version": "v1.0.0",
    "feeds_dir": "./releases/v1.0.0/feeds/",
    "feeds": [{ "feed_id": 100, "feed_major": 1 }]
  }
}
```

From `latest_release.feeds`, collect the feed IDs you need to inspect.

---

## Step 2 — Read UI Layer (HTML Source)

```bash
alva fs read --path '/alva/home/{owner}/playbooks/{name}/index.html'
```

This returns the full HTML source of the playbook dashboard — the ECharts
charts, metric cards, layout, and data-fetching logic. Use this as the template for
the new playbook's UI.

---

## Step 3 — Read Code Layer (Feed Scripts)

Each feed referenced in `playbook.json` has a symlink under the release's
`feeds/` directory pointing to the feed's ALFS path.

```bash
alva fs readlink --path '/alva/home/{owner}/playbooks/{name}/releases/{version}/feeds/{feed_id}'
# → {"target_path": "/alva/home/{owner}/feeds/{feed_name}"}
```

Then read the feed script source:

```bash
alva fs read --path '/alva/home/{owner}/feeds/{feed_name}/v1/src/index.js'
```

This contains the strategy logic, data fetching, and indicator computations.

Optionally, read sample feed output to understand the data schema:

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

Follow the standard playbook creation flow (see SKILL.md):

1. **Write feed script** to `'~/feeds/{new-name}/v1/src/index.js'`
2. **Test** via `alva run --entry-path '~/feeds/{new-name}/v1/src/index.js'`
3. **Grant** public read: `alva fs grant --path '~/feeds/{new-name}' --subject "special:user:*" --permission read`
4. **Deploy cronjob**: `alva deploy create --name {new-name} --path '~/feeds/{new-name}/v1/src/index.js' --cron "..."`
5. **Release feed**: `alva release feed --name {new-name} --version 1.0.0 --cronjob-id ID`
6. **Write HTML** to `'~/playbooks/{new-name}/index.html'` (update data paths to
   point to your own feed)
7. **Draft playbook**: `alva release playbook-draft --name {new-name} --display-name "..." --feeds '[{"feed_id":ID}]'`
8. **Release playbook**: `alva release playbook --name {new-name} --version v1.0.0 --feeds '[{"feed_id":ID}]' --changelog "..."`

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

Agent reads:

```bash
# 1. Metadata
alva fs read --path '/alva/home/alice/playbooks/btc-momentum/playbook.json'

# 2. HTML source
alva fs read --path '/alva/home/alice/playbooks/btc-momentum/index.html'

# 3. Feed symlink → feed path
alva fs readlink --path '/alva/home/alice/playbooks/btc-momentum/releases/v1.0.0/feeds/100'
# → /alva/home/alice/feeds/btc-momentum

# 4. Feed source code
alva fs read --path '/alva/home/alice/feeds/btc-momentum/v1/src/index.js'

# 5. (Optional) Sample data for schema understanding
alva fs read --path '/alva/home/alice/feeds/btc-momentum/v1/data/market/ohlcv/@last/3'
```

Agent then runs the content-legitimacy audit on the source HTML and feed
scripts (Step 4), modifies the feed script and HTML, deploys under the
user's own namespace with a new name (e.g. `my-btc-strategy`), and
releases.

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
