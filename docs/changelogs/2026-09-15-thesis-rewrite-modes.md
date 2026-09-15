# feat: documented Thesis rewrite modes

## 1. Current state and scope

Public Skill PR #634 already routes explicit Thesis publication and polishing to
`references/thesis.md`. This focused follow-up documents the shared Toolkit
mode contract. It changes only public-Skill guidance; Toolkit PR #174 owns its
SDK/CLI surface, and Backend/Gateway remain out of scope.

## 2. Behaviors and failure rules

- B1: a user can explicitly select `reformat`, `shorten`, or `enrich`; omitted
  mode is canonical `reformat`.
- B2: rewrite stays candidate-only and preserves language, stance, uncertainty,
  qualifications, and the stated mode boundary.
- F1: agents do not default empty, whitespace, `null`, or unknown modes; do not
  infer one from length/errors, create/update, or retry.
- F2: unavailable rewrite support, invalid model output, and quota errors are
  reported as Backend outcomes, without a substitute artifact or auto-retry.

## 3. Design decisions

- D1: detailed mode constraints live in `references/thesis.md`; the 911-line
  entrypoint remains a one-line router/pointer.
- D2: `enrich` may develop supplied reasoning and conditional assumptions or
  inferences, but may never fabricate evidence, numbers, citations, research,
  or confidence.

## 4. Implementation checklist

- [x] Add exact mode and candidate-only boundaries to the Thesis reference.
- [x] Keep a minimal discoverable entrypoint pointer without exceeding 911
  lines.
- [x] Record Backend error and no-auto-retry boundaries without claiming a
  deployed service.

## 5. Verification design

Run the existing frontmatter validator with cached PyYAML when available and
the existing Skill documentation regression suite. Check entrypoint line count
and preserve all prior evaluation coverage. Do not call a live model or server.

## 6. Integration boundary

Toolkit PR #174 validates and sends the mode. Backend owns execution:
`FailedPrecondition`/HTTP 412 for incomplete output, HTTP 503 for unavailable
service/admission, `Internal` for invalid model body, and HTTP 429 plus
`Retry-After` when a valid positive delay is supplied. This Skill
does not claim those paths are deployed or accepted end-to-end.

## 7. Outcome and evidence

- Offline cached-PyYAML Skill Creator frontmatter validation passed.
- `node evals/alva-skill-docs/skill-doc-eval.mjs` passed: 91/91 cases and
  944/944 checks.
- `skills/alva/SKILL.md` remains exactly 911 lines; `git diff --check` passed.
- No live model or Thesis/server request was run for this public-Skill change.

## 8. Remaining work

Backend/Gateway implementation, live-model behavior, and publication remain
outside this public-Skill-only change.
