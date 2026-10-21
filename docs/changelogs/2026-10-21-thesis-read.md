# Read published Theses

## 1–3. Context, behavior and architecture
Depends on Skills PR #650 at 05ea621cdeed6b6067b7aabbe7c10a2d30b73d9c.
Add reading routes for author/entity lists and related current publications;
retain publication, discussion, quoted-version and tracking workflows unchanged.
Primary implementation record: [Toolkit changelog](https://github.com/alva-ai/toolkit-ts/blob/leo/thesis-read/docs/changelogs/2026-10-21-thesis-read.md).

## 4–6. Implementation, verification and decisions
Approved handoff (2026-10-21); incremental changes in SKILL.md and thesis.md, plus a narrow existing-Thesis
route qualifier in request-routing.md to keep list/Related reads out of Signals.
Check anchors, CLI spelling, existing workflow preservation and full dependency diff.
No runtime deployment, version bump, global Sandbox rule or new publication behavior.

## 7. Outcome and evidence
Reading section and route added; publication opening, Authorship, discussion,
tracking and quoted-version sections preserved. Parameter spelling and new
anchors checked against Toolkit terminal/embedded help.
`node evals/alva-skill-docs/skill-doc-eval.mjs --out /tmp/df07-skill-eval.md` passed:
106 cases / 1,237 static checks. `git diff --check` passed. Main-agent scope,
authorization, routing and dependency review found no unresolved issue.

## 8. Remaining work
Ship only after Toolkit commands are installed in Sandbox and ALPI Dispatch.
Real Agent routing/conversation acceptance requires that deployed version; static
Skill review does not prove runtime behavior. PR #650 is still an open dependency.

## 9. Review follow-up
Aligned with Toolkit #191 after its simplification: both reads continue with
one `nextCursor`; `--person-id`/`--user-id` are gone and an author follow-up
uses `publisher.__typename` with `slug` (`--person`) or `username` (`--user`).
Owner author lists include private Theses, so those are omitted from any
conversation that includes someone else. Dropped the misleading `thesisId`
caveat (Gateway resolves it to `playbookId`). Doc eval: 106/106 cases; mutation
smoke 35/35; durable-agent tests pass.
