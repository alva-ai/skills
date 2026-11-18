# fix: separate fallback Thesis links into Markdown paragraphs

## 1. Background and Current State

alva-ai/skills#686 requires a fallback Thesis link on a line of its own. The
App's `playbookMarkdown.soleLink` checks a whole Markdown paragraph, so a single
newline after a summary, or between links, still produces no card.

## 2. Problem Model and End-to-End Behavior

- B1: Each fallback Thesis link occupies its own Markdown paragraph, with a
  blank line separating it from text and other links.
- B2: Complete `<thesis-preview>` blocks remain the preferred output and are
  preserved through task result relay.
- F1: A missing complete block uses only a known Thesis ID and a descriptive
  standalone link without query parameters; no invented preview fields.

## 3. Research, Findings, and Architecture Decision

- D1: Correct the producer instructions, matching the existing App parser; no
  frontend/parser/API change is needed.
- D2: Keep read guidance, write fallback and task/channel relay consistent. Show
  the actual blank-line layout in examples and retain existing checks.
- R1: Prompt checks prove the instructions exist, not that every model run
  follows them. No real model run is claimed.
- Evidence: actual native Markdown parser plus `playbookMarkdown` returns zero
  cards for `summary\nlink` and adjacent link lines, one for `summary\n\nlink`,
  and two for links separated by a blank line.

## 4. Implementation Design

Amend the relevant prompt/reference, examples and existing doc assertions; add a
focused doc mutation check where supported. Append to the existing PR without
rewriting its commits or changing its unreleased version. Companion:
alva-ai/sandbox-agent-ts#460.

Serial checklist: update instructions/examples; run relevant doc/prompt checks;
review the full PR diff in six main-agent passes; scan staged/committed changes
and PR text; push additive commits to the existing PRs and monitor CI/reviews.

## 5. Verification and E2E Design

Run existing repository checks for the edited documentation and prompt tests,
format/lint where provided, and `git diff --check`. Retain the App parser
reproduction evidence separately from prompt-presence assertions. E2E Required:
no. No live Thesis write, model task, release or deployment.

## 6. Human Decisions and Interaction

Alan requested this follow-up after review finding R295-1 in Raft #refer; source
744842b5-5127-428d-a2ff-307eeff96589. Only the blank-paragraph gap and its
directly related examples/checks are in scope. No merge/deploy authorized.

## 7. Outcome and Evidence

| ID    | Implementation / evidence                                                                 | Status |
| ----- | ----------------------------------------------------------------------------------------- | ------ |
| B1    | Blank-paragraph rule and multi-link example; actual App parser accepts both example links | DONE   |
| B2    | Existing raw block creation/update and task relay instructions retained                   | DONE   |
| F1    | Known ID, descriptive label and no-query fallback retained; no new metadata guesses       | DONE   |
| D1/D2 | Producer-only fix, consistent reference and task/channel instructions                     | DONE   |
| R1    | Prompt-presence checks distinguished from parser behavior; no model compliance claim      | DONE   |

The complete PR net diff against `origin/main`, including the original commits
and this follow-up, was reviewed in six serial main-agent passes: behavior and
scope; architecture and retry/result boundaries; test quality; security and
compatibility; migration and operations; documentation. No remaining finding. No
generated, dependency, API or schema changes. Existing unreleased version
retained. No plan deviation.

Actual parser verification: the native App parser and `playbookMarkdown` passed
40 checks, including all three final examples (each gives two cards), and the
counterexamples with blank lines removed (zero cards). The temporary probe was
removed; no frontend product change was made. Existing Thesis XML and link
parser regressions also passed. This is local deterministic evidence, not a live
Agent or device E2E run.

Repository checks (repository root):

- `node evals/alva-skill-docs/skill-doc-eval.mjs`: no failed cases; the two new
  assertions failed before the instruction fix.
- `node evals/alva-skill-docs/mutation-smoke.mjs`: 74/74 mutations rejected,
  including both new blank-paragraph removals.
- No repository Makefile/lint target exists; no substitute linter was used.
- Targeted Prettier check on this changelog and `git diff --check`: passed.

## 8. Remaining Work

CI and review feedback are monitored on the updated PR heads. No live Agent run
was requested or performed. After the normal Skill/runtime rollout, verify a
foreground Update, a background Update relayed to the main chat and an
incomplete-GET fallback. Merge, release and deployment require separate
authorization and were not performed here.
