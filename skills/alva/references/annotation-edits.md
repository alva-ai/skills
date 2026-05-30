# Annotation-Driven Edits

An annotation points at one element of a playbook the user is iterating on and
asks for a change to it. The request arrives as one or more `<annotation>`
tags. Find the logic that *generates* that element and edit it there.

---

## Tag Format

```
<annotation index="1" selector="div.playbook-container > div.tab-panel > div.hero-card" tag-name="div" instruction="Highlight this card"></annotation>
```

| Attribute     | Description                                                     |
| ------------- | --------------------------------------------------------------- |
| `index`       | Sequence number; a message may carry several annotations        |
| `selector`    | CSS path to the target element in the **rendered** playbook DOM |
| `tag-name`    | The target element's tag                                        |
| `instruction` | What the user wants done to that element                        |

The tag carries no playbook identity — an annotation applies to the playbook
already in session context (just built, remixed, or read). If none is in
context, ask which playbook, then read its HTML locally before editing:

```bash
alva fs read --path '/alva/home/{owner}/playbooks/{name}/index.html' > ./index.html
```

Process each `index` as a separate, targeted edit — change only what the
`instruction` asks of the annotated element, nothing around it.

When the instruction is a bug fix, fix the named defect only — do not change
what displayed data *means* (its period basis, units, or source) as a side
effect; and if the correct fix does change a number the user has already seen,
say so explicitly rather than letting it change silently.

---

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

After applying every annotation, write the HTML back to ALFS and re-release.
A change to an already-released playbook is a version bump: `alva release
playbook-draft` then `alva release playbook` with the new version (Step 7).
