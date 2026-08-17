# Remix Workflow

Remix lets users create a new playbook based on an existing published playbook.
The user copies a prompt from the Remix button on any playbook page and pastes
it into their agent. The agent then fetches the source playbook's code and UI,
customizes them per the user's preferences, and deploys a new playbook.

---

## Prompt Format

The Remix prompt arrives as a `<remix>` tag emitted by the Remix button. A
typical message looks like:

```
<remix title="energy-dashboard" type="playbook" url="/u/henryliu/playbooks/energy-dashboard" playbook-kind="dashboard">Remix Playbook: Deploy as a new playbook under my account</remix>
hi
```

Parse the tag's attributes:

| Attribute       | Description                                                | Used For                                  |
| --------------- | ---------------------------------------------------------- | ----------------------------------------- |
| `url`           | Canonical web path: `/u/{owner}/playbooks/{name}`          | **Authoritative** source of owner + name  |
| `title`         | Filesystem name (URL-safe slug, same as `{name}` in `url`) | Cross-check against `url`                 |
| `type`          | Resource type — currently always `playbook`                | Routing (skip if not `playbook`)          |
| `playbook-kind` | Sub-kind of playbook (e.g. `dashboard`)                    | Context only; doesn't change the workflow |

Extract `owner` and `name` from the `url` attribute (between `/u/` and
`/playbooks/`, and after `/playbooks/`). For the example above: owner =
`henryliu`, name = `energy-dashboard`.

Together they resolve to the ALFS base path (quote in CLI):

```
'/alva/home/{owner}/playbooks/{name}/'
```

**Behavior note**: The tag's inner text ("Remix Playbook: Deploy as a new
playbook under my account") is a fixed instruction, **not** the user's
customization request. The user's actual ask is whatever text they typed
**outside** the tag (in the example above, just "hi"). If that text is empty, a
greeting, or otherwise doesn't describe what to customize, **ask the user what
they'd like to customize** before proceeding — do not start editing on the
strength of the tag alone.

> Legacy: older sessions may still arrive as
> `Use Alva skill to remix this Playbook(@{owner}/{name}) ...` plain text. Same
> two fields (`owner`, `name`) apply; the rest of this workflow is unchanged.

---

## Step 1 — Read Playbook Metadata

Use the native read tool on
`/alva/home/{owner}/playbooks/{name}/playbook.json`.

Returns JSON with structure:

```json
{
  "playbook_id": 42,
  "name": "btc-momentum",
  "description": "...",
  "releases": [
    {
      "version": "v1.0.0",
      "feeds": [{ "feed_id": 100, "feed_name": "btc-ema", "feed_major": 1 }]
    }
  ]
}
```

`releases` is ordered newest-first, so `releases[0]` is the latest release. From
`releases[0].feeds`, collect the feed refs you need to inspect — each entry
carries both `feed_name` (for ALFS paths) and `feed_id` (for API calls).

If the source playbook has registered UDFs, collect each function's
`function_name`, `entry_script_path`, and `params_schema` before editing. Read
[udf-runtime.md](api/udf-runtime.md) for the `alva functions` registration flow.
A remix must preserve source UDF methods unless the user explicitly asks to
remove or replace them: copy every source UDF entry script into the new
playbook's ALFS tree, rewrite its path to the new playbook namespace, and later
register the same `function_name` and `params_schema` on the remixed playbook.

---

## Step 2 — Read UI Layer (HTML Source)

Use the native read tool to inspect
`/alva/home/{owner}/playbooks/{name}/index.html`, then use the native edit tool
on the inherited ALFS source. Reconstructing the HTML from memory drops layout
details, comments, and working code that the user expects to inherit.

This is the full HTML source of the playbook dashboard — the ECharts charts,
metric cards, layout, and data-fetching logic. Edit this source directly in Step
5; do not rewrite it from scratch.

---

## Step 3 — Read Code Layer (Feed Scripts)

Each entry in `releases[0].feeds` carries `feed_name` — use the native read tool
to inspect `/alva/home/{owner}/feeds/{feed_name}/v1/src/index.js`.

This contains the strategy logic, data fetching, and indicator computations. As
with the HTML, **modify the inspected source in place** rather than re-typing
the script from your reading of it.

If Step 1 found registered UDFs, use the native read tool to inspect each UDF
entry script from its `entry_script_path` as well.

Treat these as inherited source code. Edit only the path-sensitive or
topic-specific pieces required by the remix; do not recreate the methods from
memory.

Optionally, use the native read tool on
`/alva/home/{owner}/feeds/{feed_name}/v1/data/{group}/{output}/@last/5` to
understand the data schema.

---

## Step 4 — Content Legitimacy Audit

Remix inherits the source's provenance — don't propagate fabricated content into
a new namespace. Apply the [Content Legitimacy Rules](content-legitimacy.md) to
both the source HTML and feed scripts: any value the user will see must fetch
from a feed at runtime. If the source has hardcoded arrays, inline analyst
ratings, procedural/RNG output, or pasted-in literals, either refactor them into
your own feed, strip the offending sections, or refuse the remix and tell the
user why. Do not `sed`-replace the username and re-release a source whose data
layer was never legitimate.

---

## Scope of Changes — Default Is Data, Not Design

A remix is a **data/topic swap on top of an existing design**, not a redesign.
Before editing anything, classify what the user asked for:

| Layer                   | Default in a remix | When it's allowed to change                                      |
| ----------------------- | ------------------ | ---------------------------------------------------------------- |
| Data sources / symbols  | **Change**         | Always — this is the point of a remix                            |
| Strategy parameters     | **Change**         | Always (thresholds, windows, cron frequency, namespace paths)    |
| Topic / domain wording  | **Change**         | Always (titles, copy, README narrative — to fit the new subject) |
| **Tab names + order**   | **Preserve**       | Only if the user explicitly says so                              |
| **Section structure**   | **Preserve**       | Only if the user explicitly says so                              |
| **Card / chart layout** | **Preserve**       | Only if the user explicitly says so                              |
| **README outline**      | **Preserve**       | Only if the user explicitly says so                              |

"Customize it based on my preferences", "make a semiconductor version", "do one
for healthcare" are **topic swaps** — they do **not** authorize restructuring
tabs, sections, or layout. Only explicit structural requests do, e.g. "drop the
Risks tab", "add a Summary section at the bottom", "merge News and Social into
one tab".

If the source structure conflicts with the new topic (e.g. source has a "News &
Social" tab but the new topic has no usable news feed), **ask the user** whether
to leave the tab empty/hidden or remove it. Do not silently restructure.

Concretely, before writing the edited HTML back to ALFS, diff its tab list and
top-level section headings against the source. If they don't match and the user
didn't ask for the change, revert the structure and re-apply only the data swap.

---

## Step 5 — Deploy as New Playbook

Follow the standard playbook creation flow (see SKILL.md), starting from the
sources you inspected in Steps 2–3. Edit those ALFS files directly with the
native edit tool. Swap data paths to your own namespace, adjust
strategy parameters, and apply the user's customization request **within the
scope defined above** (data/topic by default; structure only on explicit
request). Do not write fresh files from scratch.

1. **Write the edited feed script** with the native write/edit tool at
   `~/feeds/{new-name}/v1/src/index.js`.
2. **Test** via `alva run --entry-path '~/feeds/{new-name}/v1/src/index.js'`
3. **Deploy cronjob**:
   `alva deploy create --name {new-name} --path '~/feeds/{new-name}/v1/src/index.js' --cron "..."`
4. **Publish automation** and record the returned `feed_id`:
   `alva automation publish --name {new-name} --version 1.0.0 --cronjob-id ID --description "..."`
5. **Publish feed visibility** when the remixed playbook needs public reads:
   `alva feed set-visibility --id <feed_id> --visibility public`
6. **Verify public data** with an unauthenticated absolute-path read before the
   HTML depends on it.
7. **Write the edited HTML** with the native write/edit tool at
   `~/playbooks/{new-name}/index.html` after updating data paths to point to
   your own feed.
8. **Copy inherited UDF entry scripts when present**: for each source UDF, write
   the edited entry script with the native write/edit tool at
   `~/playbooks/{new-name}/udf/{function_name}.js`.
9. **Write README** (mandatory) — adapt the source playbook's README to your
   data sources and methodology, then write it with the native write/edit tool
   at `~/playbooks/{new-name}/README.md`.
   See [release.md → Playbook README](api/release.md#playbook-readme).
9. **Draft playbook**:
   `alva release playbook-draft --name {new-name} --display-name "..." --feeds '[{"feed_id":ID}]'`
10. **Register inherited UDFs when present**: after the draft command returns
    the remixed playbook ID, use `alva functions register` for each copied
    method with the same `function_name` and `params_schema`, with
    `entry_script_path` pointing at the new absolute ALFS path. Do not leave
    inherited `window.alva.udf` UI controls pointing at an unregistered
    function.
11. **Release playbook**:
    `alva release playbook --name {new-name} --version v1.0.0 --feeds '[{"feed_id":ID}]' --changelog "..." --readme-url '/alva/home/<username>/playbooks/{new-name}/README.md'`
    (absolute ALFS path; resolve `<username>` via `alva whoami` — the relative
    shorthand is no longer accepted)

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
<remix title="btc-momentum" type="playbook" url="/u/alice/playbooks/btc-momentum" playbook-kind="dashboard">Remix Playbook: Deploy as a new playbook under my account</remix>
Add a summary section at the bottom.
```

Extracted from the `url` attribute: owner = `alice`, name = `btc-momentum`. The
user's customization request is the text after the tag: "Add a summary section
at the bottom."

Agent inspects sources so they can be edited in place, not retyped. Use the
native read tool for these paths, then edit inherited sources with the native
edit tool:

1. `/alva/home/alice/playbooks/btc-momentum/playbook.json`
2. `/alva/home/alice/playbooks/btc-momentum/index.html`
3. `/alva/home/alice/feeds/btc-momentum/v1/src/index.js`
4. Optionally,
   `/alva/home/alice/feeds/btc-momentum/v1/data/market/ohlcv/@last/3` for schema
   understanding.

Agent then runs the content-legitimacy audit on the inspected HTML and feed
script (Step 4), edits them in place to apply the user's customization, then
writes them under the user's own namespace with a new name (e.g.
`my-btc-strategy`) and releases.

Save lineage (assuming current user is `bob`, new playbook name is
`my-btc-strategy`):

```bash
# 6. Save remix lineage
alva remix --child-username bob --child-name my-btc-strategy --parents '[{"username":"alice","name":"btc-momentum"}]'
```

---

## Key Differences from Building from Scratch

| Aspect         | From Scratch                 | Remix                                                                    |
| -------------- | ---------------------------- | ------------------------------------------------------------------------ |
| SDK discovery  | Search partitions, read docs | Already chosen in source feed                                            |
| Data modeling  | Design schema from scratch   | Reuse source feed's `def()` schema                                       |
| HTML structure | Build per design system      | **Preserve tabs/sections/layout**, change only data paths and topic copy |
| Strategy logic | Write from requirements      | Modify existing logic per user preferences                               |
| Feed name      | User decides                 | Must be unique, distinct from source                                     |
