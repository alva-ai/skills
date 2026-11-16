# Annotation-Driven Edits

An annotation points at one element of a playbook's rendered DOM. It may carry
a question about that element or a request to change it; the request arrives
as one or more `<annotation>` tags. Determine intent first: do not write,
draft, or release merely because a tag is present. For a change, find the
logic that *generates* that element and edit it there.

---

## Tag Format

```
<annotation index="1" selector="div.playbook-container > div.hero-card > h2" tag-name="h2" new-text="BTC trend" instruction="Shorten the title">Bitcoin price trend overview</annotation>
```

| Field         | Description                                                     |
| ------------- | --------------------------------------------------------------- |
| `index`       | Order within this message only, not a persistent element id     |
| `selector`    | CSS path to the target element in the **rendered** playbook DOM; a location hint for the current render |
| `tag-name`    | The target element's tag                                        |
| `new-text`    | Replacement text the user previewed in the iframe (optional)    |
| `instruction` | The user's instruction or question (optional)                   |
| tag body      | `originalText`: the element's text when annotated               |

A `new-text` already visible in the iframe does not mean the source changed;
write it back to the generator and verify it through a rerender.

The tag carries no playbook identity — an annotation applies to the playbook
already in session context (just built, remixed, or read). If none is in
context, ask which playbook, then read its HTML locally before editing:

```bash
alva fs read --path '/alva/home/{owner}/playbooks/{name}/index.html' > ./index.html
```

## Question or Change

- A question about an element's content, source, or meaning: read the
  Playbook and its data and answer directly. Do not edit a file, create a
  draft, or release.
- A change: confirm the target and ownership first (`alva whoami` against the
  owner). A non-owner's page cannot be edited in place; use
  [remix-workflow.md](remix-workflow.md) only when the user explicitly wants
  their own version, never as a silent copy.
- Preserve the Playbook's name, visibility, Feed refs, UDFs, Skillhub binding,
  and all unmentioned behavior.

Process the annotations in `index` order as targeted edits combined into one
minimal patch — change only what each `instruction` (or `new-text`) asks of the
annotated element, nothing around it. Stop and confirm if they conflict. When
the selector has no unique match, cross-reference its leaf class, `tag-name`,
`originalText`, and `new-text`; ask the user if ambiguity remains.

When the instruction is a bug fix, fix the named defect only — do not change
what displayed data *means* (its period basis, units, or source) as a side
effect; and if the correct fix does change a number the user has already seen,
say so explicitly rather than letting it change silently.

---

Never freeze rendered feed values into static text; converting a live Playbook
to a [static snapshot](playbook-creation.md#static-snapshot) is a separate
explicit request. HTML edits re-enter `before-build-html` in
[playbook-creation.md](playbook-creation.md).

## Locate the Generator

The `selector` describes the DOM **after** the playbook's JavaScript has run,
so the target is one of two cases:

- **Static markup** — the selector's tag and classes appear literally in
  `index.html`. Edit them in place.
- **JS-generated** (common) — a render function builds the element from feed
  data, so the `selector` is **not** in the HTML verbatim. Search for the leaf
  class (e.g. `hero-card`); it surfaces the CSS rule that styles it and the
  render function that emits it — those are what you edit.

---

## Edit the Generator, Never Freeze the Output

Do not copy the element's rendered DOM and paste it back as static HTML with
the instruction applied. That hardcodes the live feed value into a literal
(breaking the [Content Legitimacy Rules](content-legitimacy.md)),
so the element stops reflowing on the next feed update, and it usually drops
design-system tokens.

Instead, change what *produces* the element — its CSS rule, the markup its
render function emits, or the component factory it calls — so every render
keeps the change and stays data-driven.

Editing playbook HTML re-enters the `before-build-html` gate: read
[design.md](design.md), plus
[design-components.md](design-components.md) for component-level changes.

---

## Re-release

An annotation is not permission to publish or re-release. Annotating a session
preview or an unreleased draft keeps that state, and a draft-only request
still stops at draft. For a released playbook the user asked to change, write
the HTML back to ALFS and re-release: a version bump through `alva release
playbook-draft` then `alva release playbook` with the new version (Step 7),
keeping its visibility and Feed refs. Report only the state actually reached.
