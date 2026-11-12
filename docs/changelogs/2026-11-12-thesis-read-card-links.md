# docs(alva): link presented Theses so the App shows their cards

## Problem

After the Agent publishes a Thesis, it emits `<thesis-preview>` and the Alva
App shows a Thesis card. When it presents other people's Theses from `thesis
list`, `related`, or `get`, the reading rules only ask for "available source
links". The read results carry no URL, so replies either have no link or a
plain `alva.ai/thesis/<id>` link. In PRD over the 7 days to 2026-11-12, 18
sessions read Theses, and assistant replies in them contained only a handful
of `/thesis/` links.

## Change

- `references/thesis.md`, Reading published Theses (and the For You section of
  `references/request-routing.md`, which points to it): link each presented
  Thesis on its own line as `[author or short label](https://alva.ai/thesis/<publication.playbookId>)`
  with no query parameters, and summarize the view instead of repeating its
  full body.
- The Alva App renders such links as the published-Thesis card from the
  Thesis's latest publication (frontend-monorepo PR, linked from the skills
  PR). Without that App change the link still opens the Thesis.
- Links with `versionId` or `signalId` stay plain links in the App, which is
  why the rule forbids query parameters.

## Verification

- `node evals/alva-skill-docs/skill-doc-eval.mjs`: no failed cases, including
  the new `target.thesis-read-card-links`.
- `node evals/alva-skill-docs/mutation-smoke.mjs`: 55/55 mutations failed as
  expected, including `thesis-read-link-by-version`.
- No live Agent turn was run against the new rule.
