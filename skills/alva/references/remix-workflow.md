# Remix Workflow

Remix lets users create a new playbook based on an existing published playbook.
The user copies a prompt from the Remix button on any playbook page and pastes
it into their agent. The agent then fetches the source playbook's code and UI,
customizes them per the user's preferences, and deploys a new playbook.

---

## Prompt Format

The Remix prompt arrives as a `<remix>` tag emitted by the Remix button.
A typical message looks like:

```
<remix title="energy-dashboard" type="playbook" url="/u/henryliu/playbooks/energy-dashboard" playbook-kind="dashboard">Remix Playbook: Deploy as a new playbook under my account</remix>
hi
```

Parse the tag's attributes:

| Attribute       | Description                                                            | Used For                                  |
| --------------- | ---------------------------------------------------------------------- | ----------------------------------------- |
| `url`           | Canonical web path: `/u/{owner}/playbooks/{name}`                      | **Authoritative** source of owner + name  |
| `title`         | Filesystem name (URL-safe slug, same as `{name}` in `url`)             | Cross-check against `url`                 |
| `type`          | Resource type — currently always `playbook`                            | Routing (skip if not `playbook`)          |
| `playbook-kind` | Sub-kind of playbook (e.g. `dashboard`)                                | Context only; doesn't change the workflow |

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
**outside** the tag (in the example above, just "hi"). If that text is
empty, a greeting, or otherwise doesn't describe what to customize,
**ask the user what they'd like to customize** before proceeding —
do not start editing on the strength of the tag alone.

> Legacy: older sessions may still arrive as
> `Use Alva skill to remix this Playbook(@{owner}/{name}) ...` plain
> text. Same two fields (`owner`, `name`) apply; the rest of this
> workflow is unchanged.

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
inspect — each entry carries `feed_name` (for ALFS paths), `feed_id` (for API
calls), and usually `feed_major` (for the versioned ALFS path). Use
`v{feed_major}` when reading source feed scripts; do not hardcode `v1` unless
metadata is missing and you have verified that only `v1` exists.

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

## Step 3 — Download README And Code Layer

Download the source README before adapting copy or methodology. Do not
fabricate the source's rationale from memory.

```bash
alva fs read --path '/alva/home/{owner}/playbooks/{name}/README.md' > ./README.md
```

Update this README during deployment so sources, methodology, cadence, caveats,
and provenance match the new feed scripts and topic.

## Step 4 — Download Code Layer (Feed Scripts)

Each entry in `releases[0].feeds` carries `feed_name` and usually
`feed_major` — download each feed's script source the same way:

```bash
alva fs read --path '/alva/home/{owner}/feeds/{feed_name}/v{feed_major}/src/index.js' > ./{feed_name}.js
```

This contains the strategy logic, data fetching, and indicator
computations. As with the HTML, **modify the downloaded file in place**
rather than re-typing the script from your reading of it.

If `feed_major` is absent, inspect the source feed directory and choose the
version referenced by the latest release metadata. If you cannot determine the
version, stop and ask rather than guessing.

Optionally, read sample feed output to understand the data schema (this
one stays in stdout — it's reference, not a file you'll edit):

```bash
alva fs read --path '/alva/home/{owner}/feeds/{feed_name}/v{feed_major}/data/{group}/{output}/@last/5'
```

---

## Step 5 — Content Legitimacy Audit

Remix inherits the source's provenance — don't propagate fabricated content
into a new namespace. Apply [content-legitimacy.md](content-legitimacy.md)
to both the source HTML and feed scripts: any value the user will see must
fetch from a feed at runtime. If the source has hardcoded arrays, inline
analyst ratings, procedural/RNG output, or pasted-in literals, either
refactor them into your own feed, strip the offending sections, or refuse
the remix and tell the user why. Do not `sed`-replace the username and
re-release a source whose data layer was never legitimate.

---

## Scope of Changes — Default Is Data, Not Design

A remix is a **data/topic swap on top of an existing design**, not a
redesign. Before editing anything, classify what the user asked for:

| Layer                   | Default in a remix | When it's allowed to change                                       |
| ----------------------- | ------------------ | ----------------------------------------------------------------- |
| Data sources / symbols  | **Change**         | Always — this is the point of a remix                             |
| Strategy parameters     | **Change**         | Always (thresholds, windows, cron frequency, namespace paths)     |
| Topic / domain wording  | **Change**         | Always (titles, copy, README narrative — to fit the new subject)  |
| **Tab names + order**   | **Preserve**       | Only if the user explicitly says so                               |
| **Section structure**   | **Preserve**       | Only if the user explicitly says so                               |
| **Card / chart layout** | **Preserve**       | Only if the user explicitly says so                               |
| **README outline**      | **Preserve**       | Only if the user explicitly says so                               |

"Customize it based on my preferences", "make a semiconductor version",
"do one for healthcare" are **topic swaps** — they do **not** authorize
restructuring tabs, sections, or layout. Only explicit structural
requests do, e.g. "drop the Risks tab", "add a Summary section at the
bottom", "merge News and Social into one tab".

If the source structure conflicts with the new topic (e.g. source has a
"News & Social" tab but the new topic has no usable news feed), **ask
the user** whether to leave the tab empty/hidden or remove it. Do not
silently restructure.

Concretely, before uploading the edited HTML, diff its tab list and
top-level section headings against the source. If they don't match and
the user didn't ask for the change, revert the structure and re-apply
only the data swap.

---

## Step 6 — Deploy as New Playbook

Follow the standard playbook creation flow (see SKILL.md), starting from
the local files you downloaded in Steps 2–3. **Edit those files in
place** with the `Edit` tool — swap data paths to your own namespace,
adjust strategy parameters, and apply the user's customization request
**within the scope defined above** (data/topic by default; structure
only on explicit request). Do not write fresh files from scratch.

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
7. **Write README** (mandatory) — adapt the downloaded source README to your
   data sources, methodology, cadence, caveats, and provenance, then upload:
   `alva fs write --path '~/playbooks/{new-name}/README.md' --file ./README.md --mkdir-parents`.
   See [release.md → Playbook README](api/release.md#playbook-readme).
8. **Draft playbook**: `alva release playbook-draft --name {new-name} --display-name "..." --feeds '[{"feed_id":ID}]'`
9. **Release playbook**: `alva release playbook --name {new-name} --version v1.0.0 --feeds '[{"feed_id":ID}]' --changelog "..." --readme-url '/alva/home/<username>/playbooks/{new-name}/README.md'` (absolute ALFS path; resolve `<username>` via `alva whoami` — the relative shorthand is no longer accepted)

**Important**: The new playbook must use a unique name in your user space. The
feed scripts must use **your own** ALFS paths (not the original owner's) for
data storage — copy the logic, not the paths.

---

## Step 7 — Save Remix Lineage

After the new playbook is created, record the parent-child relationship:

```bash
alva remix --child-username {your_username} --child-name {new-name} --parents '[{"username":"{owner}","name":"{source-playbook-name}"}]'
```

alva remix is only for lineage. It does not copy files, validate provenance,
deploy feeds, draft the playbook, or release anything.

---

## Example

Given prompt:

```
<remix title="btc-momentum" type="playbook" url="/u/alice/playbooks/btc-momentum" playbook-kind="dashboard">Remix Playbook: Deploy as a new playbook under my account</remix>
Add a summary section at the bottom.
```

Extracted from the `url` attribute: owner = `alice`, name =
`btc-momentum`. The user's customization request is the text after the
tag: "Add a summary section at the bottom."

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
`./btc-momentum.js` (Step 5), edits those local files in place to apply
the user's customization, then uploads them under the user's own
namespace with a new name (e.g. `my-btc-strategy`) and releases.

Save lineage (assuming current user is `bob`, new playbook name is `my-btc-strategy`):

```bash
# 7. Save remix lineage
alva remix --child-username bob --child-name my-btc-strategy --parents '[{"username":"alice","name":"btc-momentum"}]'
```

---

## Key Differences from Building from Scratch

| Aspect         | From Scratch                 | Remix                                      |
| -------------- | ---------------------------- | ------------------------------------------ |
| SDK discovery  | Search partitions, read docs | Already chosen in source feed              |
| Data modeling  | Design schema from scratch   | Reuse source feed's `def()` schema         |
| HTML structure | Build per design system      | **Preserve tabs/sections/layout**, change only data paths and topic copy |
| Strategy logic | Write from requirements      | Modify existing logic per user preferences |
| Feed name      | User decides                 | Must be unique, distinct from source       |
