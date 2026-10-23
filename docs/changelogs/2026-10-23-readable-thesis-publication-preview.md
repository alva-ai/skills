# Readable Thesis publication previews

## 1. Background

Harry's two reports show internal asset IDs/direction fields and a text fence,
and a later preview repeats the internal confirmation instruction and appends
an English investment disclaimer. The old template was removed in #650, but
the current guide does not explicitly separate executable instructions from
user-visible preview copy or scope the disclaimer exception to this confirmation.

## 2. Approved behavior

B1: Show the exact selected body as ordinary prose, with readable ticker/name,
author direction and visibility. Hide internal IDs, API fields and rule text.
B2: A publication-only preview does not append an Agent-written disclaimer.
Preserve any such text already authored by the user. General analysis and push
disclaimer rules remain unchanged.
B3: Keep preview and confirmation. Do not create before confirmation; changed
content still requires the updated preview and confirmation.

## 3. Decision

Apply a narrow change to the public App Skill's Thesis publication preview.
Do not change the created-card XML contract, Backend, Toolkit, general prose
policy or Slim Skill's distinct publication-consent workflow.

## 4. Implementation checklist

- [x] Clarify prose presentation, localized stance labels, internal-only fields
  and rules, and the publication-only disclaimer boundary in thesis.md.
- [x] Bump the public Skill patch version and its existing version assertion.
- [x] Add both reported failure patterns to doc/scenario checks and mutations.
- [x] Validate synthetic previews for both cases with the configured model;
  report rendered output separately from deterministic documentation checks.
- [x] Review the complete diff and prepare the PR with scoped verification.

## 5. Verification

Repository CI uses Node 20 and defines these three commands (no separate lint):

- node evals/alva-skill-docs/skill-doc-eval.mjs --skill-dir skills/alva
- node evals/alva-skill-docs/mutation-smoke.mjs --skill-dir skills/alva
- node --test evals/alva-skill-docs/durable-agent.test.mjs

Run on Node 20.19.5 Linux, plus JSON parsing, diff whitespace and secret scan.
Use two synthetic Chinese publication cases modeled on the reports: leaked
asset metadata/fenced body and leaked confirmation instruction/extra English.
Check body preservation, readable ticker/stance/visibility, no internal values,
no rule copy, no wrapper fence, no added disclaimer and a confirmation request.
Model previews are local isolated tests, not Harry conversation writes or App
runtime acceptance. A model result is evidence for those samples only.

## 6. Human decisions

The user approved the minimal proposal and implementation, retaining preview
and confirmation and limiting changes to publication-preview presentation.
No production rollout, existing user content changes, messages or credential
changes are authorized.

## 7. Outcome

Implemented in public Skill v1.26.3. Only the Thesis publication-preview
presentation changes; the generic disclaimer reference and created-card XML
contract are unchanged. The new doc checks failed on the original guide and
pass with the change.

Node 20.19.5 Linux: 110/110 doc/scenario cases, 1293/1293 checks,
48/48 mutation regressions detected, durable Agent tests 5/5. CI defines no
separate formatter/lint command; git diff --check and JSON parsing pass.

Local model validation: Codex CLI 0.163.0, gpt-6.1-sol, medium, ephemeral runs,
with model_instructions_file containing SKILL.md, thesis.md and
user-facing-prose.md. All tool results are synthetic; no product tools connect.
An initial invocation used an unsupported instruction override and was discarded;
the reported runs load the supported instruction file without config errors.
These are reconstructions of the reported failure patterns, not exact replays
of Harry's full original conversations or the deployed App runtime.

Case 1: metadata/fenced-body exposure. An attachment body with two Chinese
lines and a verified SMH entity/direction returned an ordinary-prose preview:

> **正文**
>
> 我看空 SMH。
> 半导体估值已经反映了过高增长，库存去化仍需时间。
>
> **可见性：**公开
> **资产与方向：**VanEck Semiconductor ETF（SMH）：看空
>
> **备注：**估值已反映过高增长、库存去化仍需时间这两项判断尚未核实；正文保留你的原意。
>
> 按这个版本发布吗？

Case 2: internal-rule/English-disclaimer exposure returned:

> **正文**
>
> 我看空 SMH，库存去化仍需时间，当前估值缺少安全边际。
>
> **可见性：**公开
> **资产：**SMH（VanEck Semiconductor ETF）：看空
>
> 按这个原文版本发布吗？

Both retain the complete body and publication confirmation and omit internal
metadata, rule copies, extra code fences and Agent-added disclaimer text.
A third case retains the author's own English disclaimer exactly once.
The checker also rejects synthetic copies of both reported bad outputs.
No commands or product tools were called in any of the accepted model runs.
A fixture without connected tools cannot establish live tool gating after
confirmation; the existing confirmation doc/scenario/mutation checks remain.
Local report: /tmp/thesis-readable-preview-validation/report.json.

## 8. Remaining work

Review/merge and deployed App acceptance are separate from local validation.
