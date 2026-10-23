# Reuse verified Thesis assets before publication

## 1. Background

The user identified redundant asset extraction in the App channel Agent.
Toolkit already accepts verified entity IDs and author stances directly, but
Skill #643 made asset-candidates an unconditional preview step and required
re-extraction after every body edit. This added an auxiliary model call even
when the Agent already knew the identity and direction, or no asset existed.

## 2. Behavior

B1: Identify assets/directions in the Agent; reuse tool-verified catalog IDs and
explicit author direction. No second extraction for unchanged verified assets.
B4: Concrete names/tickers without an ID first use existing read-only Thesis
list catalog resolution and scope.id, with kind/venue validation. Ignore other
authors' opinions; ambiguous catalog results still require clarification.
B2: No specific asset/requested binding allows empty assets without extraction.
B3: A wording-only edit reuses IDs; asset/direction changes require rechecking
those fields and a fresh preview confirmation, not unconditional extraction.
F1: Missing identity can use existing asset-candidates as a fallback. Never guess
an ID or turn an unspecified semiconductor ETF into SMH; clarify ambiguity.
F2: Preserve preview/confirmation, exact text and author direction. Tool errors
cannot justify silently dropping direction or bypassing publication consent.

## 3. Decision

Remove the unconditional Skill dependency, retaining the existing read-only
fallback for unresolved identities. No Backend, model, provider or API change.
Do not promise a fixed total-turn speedup or claim real-model behavior from
static documentation tests. Align body-only update teaching with Toolkit #196.

## 4. Implementation

Update the Thesis reference and bump Alva Skill to v1.26.2. Add a focused doc
contract and two mutations that reintroduce repeated extraction. Slim Skill
mirrors are maintained in sdk-monorepo's dependent Skill #396.

## 5. Verification

Run all three CI commands with Node 20: skill-doc-eval.mjs, mutation-smoke.mjs
and node --test durable-agent.test.mjs. Check JSON and diff whitespace; format
only changed files using the repository Prettier configuration. No model or
production calls in these deterministic checks.

## 6. Human decisions

User authorized fixing the redundant-extraction Skill and STG verification of
the direction-update fix. Retain confirmation and ambiguity handling; production
publication and edits to existing user content are outside scope.

## 7. Outcome and evidence

Node 20.19.5 Linux checks passed:
- node evals/alva-skill-docs/skill-doc-eval.mjs --skill-dir skills/alva:
  107/107 cases, 1268/1268 checks.
- node evals/alva-skill-docs/mutation-smoke.mjs --skill-dir skills/alva:
  45/45 expected mutation failures.
- node --test evals/alva-skill-docs/durable-agent.test.mjs: 5/5 passed.
- git diff --check and JSON parsing passed. CI defines no separate lint command.
The live STG CLI catalog lookup for SMH returned Entity 6157289 (ETF, NASDAQ)
in 2438ms without asset-candidates; this validates the existing lookup path,
not a real-model instruction-following experiment or an end-to-end speed claim.

## 8. Remaining work

Publish and merge this Skill for STG sandbox consumption. The App image takes
Skills main and Toolkit next at build time, so verify the new image before
claiming App acceptance. Toolkit npm authentication is a separate prerequisite.
