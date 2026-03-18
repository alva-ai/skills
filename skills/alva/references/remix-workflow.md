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

Together they resolve to the ALFS base path:

```
/alva/home/{owner}/playbooks/{name}/
```

**Behavior note**: If the user's prompt does not specify what to change (only
the default "Customize it based on my preferences"), the agent should **ask the
user what they'd like to customize** before proceeding.

---

## Step 1 — Read Playbook Metadata

```
GET /api/v1/fs/read?path=/alva/home/{owner}/playbooks/{name}/playbook.json
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

```
GET /api/v1/fs/read?path=/alva/home/{owner}/playbooks/{name}/index.html
```

This returns the full HTML source of the playbook dashboard — the ECharts
charts, KPI cards, layout, and data-fetching logic. Use this as the template for
the new playbook's UI.

---

## Step 3 — Read Code Layer (Feed Scripts)

Each feed referenced in `playbook.json` has a symlink under the release's
`feeds/` directory pointing to the feed's ALFS path.

```
GET /api/v1/fs/readlink?path=/alva/home/{owner}/playbooks/{name}/releases/{version}/feeds/{feed_id}
→ {"target_path": "/alva/home/{owner}/feeds/{feed_name}"}
```

Then read the feed script source:

```
GET /api/v1/fs/read?path=/alva/home/{owner}/feeds/{feed_name}/v1/src/index.js
```

This contains the strategy logic, data fetching, and indicator computations.

Optionally, read sample feed output to understand the data schema:

```
GET /api/v1/fs/read?path=/alva/home/{owner}/feeds/{feed_name}/v1/data/{group}/{output}/@last/5
```

---

## Step 4 — Deploy as New Playbook

Follow the standard playbook creation flow (see SKILL.md):

1. **Write feed script** to `~/feeds/{new-name}/v1/src/index.js`
2. **Test** via `POST /api/v1/run` with `entry_path`
3. **Grant** public read: `POST /api/v1/fs/grant` on `~/feeds/{new-name}`
4. **Deploy cronjob**: `POST /api/v1/deploy/cronjob`
5. **Release feed**: `POST /api/v1/release/feed`
6. **Write HTML** to `~/playbooks/{new-name}/index.html` (update data paths to
   point to your own feed)
7. **Draft playbook**: `POST /api/v1/draft/playbook`
8. **Release playbook**: `POST /api/v1/release/playbook`

**Important**: The new playbook must use a unique name in your user space. The
feed scripts must use **your own** ALFS paths (not the original owner's) for
data storage — copy the logic, not the paths.

---

## Step 5 — Save Remix Lineage

After the new playbook is created, record the parent-child relationship:

```
POST /api/v1/remix
{
  "child": {"username": "{your_username}", "name": "{new-name}"},
  "parents": [{"username": "{owner}", "name": "{source-playbook-name}"}]
}
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
GET /api/v1/fs/read?path=/alva/home/alice/playbooks/btc-momentum/playbook.json

# 2. HTML source
GET /api/v1/fs/read?path=/alva/home/alice/playbooks/btc-momentum/index.html

# 3. Feed symlink → feed path
GET /api/v1/fs/readlink?path=/alva/home/alice/playbooks/btc-momentum/releases/v1.0.0/feeds/100
→ /alva/home/alice/feeds/btc-momentum

# 4. Feed source code
GET /api/v1/fs/read?path=/alva/home/alice/feeds/btc-momentum/v1/src/index.js

# 5. (Optional) Sample data for schema understanding
GET /api/v1/fs/read?path=/alva/home/alice/feeds/btc-momentum/v1/data/market/ohlcv/@last/3
```

Agent then modifies the feed script and HTML, deploys under the user's own
namespace with a new name (e.g. `my-btc-strategy`), and releases.

Save lineage (assuming current user is `bob`, new playbook name is `my-btc-strategy`):

```bash
# 6. Save remix lineage
POST /api/v1/remix  {"child": {"username": "bob", "name": "my-btc-strategy"}, "parents": [{"username": "alice", "name": "btc-momentum"}]}
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
