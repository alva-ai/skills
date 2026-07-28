# docs(alva): require disclaimers on price and strategy answers

## 1. Background

- Problem/outcome: Alva answers that discuss security prices or investment
  strategies do not consistently carry an investment disclaimer. Require one
  canonical, localized footer across direct Ask answers, strategy answers,
  `answer_only` chat artifacts, and user-facing `Agent.ask()` prose.
- Verified constraints: this is a Skill-owned prompt contract. It must not
  weaken provenance, computation, or recommendation guardrails, and it must not
  turn pure capability, implementation, or operational replies into financial
  answers.

## 2. End-to-End Behavior

- B1 - A user-facing answer that states or analyzes a security's current,
  historical, forecast, or target price ends with the canonical disclaimer in
  the answer's language.
- B2 - A user-facing answer that designs, evaluates, backtests, or recommends an
  investment strategy, signal, allocation, rebalance, or trade decision ends
  with the same disclaimer.
- B3 - B1/B2 apply to Financial Analysis / Ask Question, Strategy / Trading
  Analysis answers, Trade Setup conversational replies, `answer_only` chat
  artifacts, and user-facing prose produced through `Agent.ask()`.
- B4 - Citations, conclusions, and any useful-next-step sentence precede the
  disclaimer so the disclaimer remains the final standalone paragraph.
- B5 - Pure platform capability, code/debug, configuration, and operational
  status replies without a price or strategy conclusion do not add the footer.
- F1 - The disclaimer never repairs unsourced prices or unsupported actionable
  guidance; existing provenance and refusal rules still apply first.

## 3. Findings

- Evidence/pattern: `SKILL.md` already routes Financial Analysis through
  `user-facing-prose.md`, while strategy answers and Chat-as-Artifact have
  separate route summaries. `content-legitimacy.md` already says a disclaimer
  cannot sanitize unsupported buy/sell guidance.
- Chosen direction: make `user-facing-prose.md` the single source of truth for
  trigger scope, bilingual copy, placement, exclusions, and the prompt block;
  keep route-level reminders and pointers in `SKILL.md`, `request-routing.md`,
  and `content-legitimacy.md`.
- Risks/unknowns: Skill guidance is prompt-level rather than runtime
  enforcement. Scoped static scenarios, mutation smoke, and selected LLM traces
  provide regression evidence but cannot guarantee every downstream model run.

## 4. Change Specification

- `skills/alva/references/user-facing-prose.md`: add the canonical disclaimer
  contract and user-facing `Agent.ask()` prompt instruction.
- `skills/alva/SKILL.md`: add compact Ask, Strategy, Chat-as-Artifact, and final
  checklist pointers while preserving the 910-line ceiling.
- `skills/alva/references/request-routing.md`: make Ask and Strategy answer
  routes apply the shared disclaimer contract.
- `skills/alva/references/content-legitimacy.md`: apply the same trigger to
  `answer_only` while retaining the anti-laundering rule.
- `skills/alva/references/trade-setup-sdk.md`: apply the shared contract to
  conversational setup/edit/diagnosis replies without rewriting SDK-owned
  alerts or summaries.
- `evals/alva-skill-docs/{cases.json,scenarios.json,mutation-smoke.mjs}`: protect
  the canonical copy, route coverage, exclusions, and deletion sensitivity.
- Contract/config/schema/deployment impact: no API, schema, runtime config, or
  deployment changes. Installed agents receive the behavior after the normal
  Skill version release/update.
- Compatibility/rollback: additive prompt behavior. Revert the docs/eval commit
  to roll back; mark the PR as requiring a later version bump.

## 5. Verification Strategy

- Affected packages/components: Alva Skill docs and `evals/alva-skill-docs`.
- Relevant dependents: installed Alva Skill consumers; no code package compile
  dependency.
- Focused commands: static Skill eval with refreshed baseline/final reports,
  mutation smoke, LLM checker self-test, and `git diff --check`.
- Escalation triggers: unexpected scenario collisions, top-level Skill growth
  beyond 910 lines, or live trace evidence that the actor ignores the footer.
- Full suite required: no service suite; run the complete Alva Skill doc eval.
- E2E Required: no - prompt/document behavior has no service stack path.

| Behavior | Evidence |
|----------|----------|
| B1/B3 | equity-price Ask scenario plus scoped contract checks |
| B2/B3 | strategy/backtest scenario plus route checks |
| B4/B5 | canonical section and non-financial capability boundary scenario |
| F1 | Chat-as-Artifact scoped check retaining the anti-laundering rule |

### Implementation Checklist

- [x] Add eval/scenario/mutation coverage and confirm the intended RED failures.
- [x] Add the canonical reference contract and compact route pointers.
- [x] Refresh reports and run the complete scoped verification set.
- [x] Self-review the net diff and record the outcome for publication.

## 6. Human Interaction

None

## 7. Outcome

- Result: security-price and investment-strategy answers now end with one exact,
  localized disclaimer across Ask, Altra strategy answers, `answer_only`,
  user-facing `Agent.ask()` prose, and Trade Setup conversational replies. The
  footer stays last and does not weaken sourcing/refusal rules.
- Changes: `user-facing-prose.md` owns the full contract and self-contained
  prompt block; top-level routes and focused references point to it; scoped
  evals and mutation smoke protect the behavior and the non-financial exclusion.
- Deviations: latest `origin/main` added the Trade Setup SDK after planning. Its
  conversational setup/edit/diagnosis replies were included because they are an
  investment-strategy answer surface. SDK-owned alerts and summaries remain
  outside this Skill prompt-only change.
- Verification: baseline against `origin/main` failed the four intended new
  contracts (62/66, 654/664); final static eval passed 66/66 cases and 682/682
  checks; mutation smoke passed 13/13; LLM checker self-test passed 17/17 cases
  and 202/202 checks; JSON parsing, link target, 909-line ceiling, and
  `git diff --check` passed. Live LLM actor trace was not run because
  `OPENAI_API_KEY`/`ALVA_SKILL_LLM_EVAL_MODEL` were not configured locally.
- Migration: None.

## 8. Remaining Tasks

- Publish a separate Skill version bump after this behavior PR merges.
- The scheduled or manually dispatched live LLM actor trace remains the
  non-blocking runtime adherence check; prompt guidance has no hard runtime
  enforcement by design.
