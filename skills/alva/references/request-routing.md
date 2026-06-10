# Request Routing

Use this file when choosing the path for an Alva task. The goal is to select the
smallest useful route, ask at most one blocking question, and then answer or
build with evidence. Do not let playbook creation become the default: only enter
that tree when the user wants a hosted/shareable surface, remix, release, or
playbook edit.

Decision order:

0. Route every financial task through shared data and execution first: Data
   Skills, search, BYOD, `alva run` / jagent, and provenance checks are common
   to answers and artifacts.
1. If the user wants an explanation, comparison, valuation, rank, or current
   market fact in chat, route to Financial Analysis / Ask Question.
2. If the user wants persistence, cadence, alerting, trading signals, or a
   reusable dataset, route to the durable artifact that fits, not automatically
   to a playbook.
3. If the user wants a hosted app, share URL, remix, annotation edit, release,
   or playbook version update, enter the Playbook Creation tree.

## Routes

| Request type | Objective |
| --- | --- |
| Financial Analysis / Ask Question | Answer market, asset, portfolio, valuation, comparison, and "why" questions with fresh data/search/`alva run` evidence. Comparison baselines are figures too: fetch or qualify them. Every answer must read [user-facing-prose.md](user-facing-prose.md), then pass the ask evidence gate. |
| Playbook Creation | Build, remix, edit, release, or update a hosted/shareable playbook. Read [playbook-creation.md](playbook-creation.md) for the subroute tree and gates. |
| Strategy / Trading Analysis | Use Altra for backtests, signals, portfolio simulation, rebalancing, or trading analysis; deliver an answer, feed, signal, or playbook as requested. |
| Automation / Push | Build or modify a feed that emits actionable `signal/targets` or `notify/message`, then verify subscription and delivery path. |
| Debug / Edit | Inspect existing code, logs, playbook source, feed output, or annotations, then change the generator rather than rendered values. |
| Capability Verification | Verify Data Skills, Skillhub, runtime, trading, or search coverage before saying Alva lacks a capability. |

## Skillhub Blueprint

If the user's message contains `/use-skill:<username>/<name>`, the Skillhub path
is mandatory before analysis, Guided Planning, or build work.

Describe Skillhub to users as a catalog of methodologies. Keep gateway/file
listing details internal unless the user is debugging blueprint retrieval.

1. Run `alva skillhub --help` if unused this session.
2. Inspect the exact catalog id with `alva skillhub get <username>/<name>`.
   Do not guess namespace, case, filename, or template path.
3. If the id is not found, use `alva skillhub list` and look leniently for
   case-insensitive or separator-insensitive close matches. Proceed only when
   exactly one match is obvious; otherwise ask the user to choose.
4. Read the blueprint fresh with `alva skillhub file <username>/<name> <file>`.
   Use the blueprint file from the listing, conventionally `template.md`.
5. Pull supporting files only on demand. Do not bulk-download.
6. Treat the blueprint as authoritative for layout, fields, sections, cadence,
   and guardrails. Deviate only when the user explicitly overrides it or live
   data coverage blocks it. Preserve the blueprint's platform boundary by
   default: avoid replacing platform chrome such as `<playbook-header>` with a
   hand-written page header unless the user explicitly wants custom in-iframe
   chrome.
7. If any Skillhub skill informed the build, pass
   `--skill-id <username>/<name>` during playbook draft. See
   [api/release.md](api/release.md#skill-id).

The directive plus a concrete topic is a strong method directive: fetch the
blueprint, then answer or build according to the user's requested artifact. Do
not turn every Skillhub task into a playbook unless the blueprint or user asks
for one.

## Guided Planning

For Financial Analysis / Ask Question, usually answer directly after fetching
or computing evidence, but first read
[user-facing-prose.md](user-facing-prose.md), then apply the answer gate from
`SKILL.md`: decomposition, source path, coverage gaps, and
sourced-vs-inference boundary. Simple asks can satisfy the gate with one hop.
For build routes, present a plan once before building.

Exactly one blocking question per session:

1. If key parameters are missing and have no obvious default, ask one
   clarifying question. Prefer concrete choices.
2. If real strategic alternatives exist, offer 2-3 approaches and lead with
   your recommendation.
3. If the request is clear, or a `/use-skill:` directive pins the shape, give a
   5-8 line plan naming the intended artifact. For analysis, name sources and
   comparison baselines. For playbooks, name feeds, widgets, release path, and
   defaults.

If the user says "just do it", skip further clarifying questions for the rest
of the session and proceed after the short plan.

## Capability Verification

Before saying Alva lacks a capability or recommending BYOD, verify the catalog:

```bash
alva data-skills list | grep -i <topic>
```

Decompose compound asks such as "darkpool L2 realtime" and verify each
component independently. Never reject the whole as one unit from memory.

For official template-like work, especially what-if, event-study, quant
research, factor, ML signal, or strategy work, check whether an official
Skillhub template fits before inventing a new method. Disabled blueprints must
not be recommended organically, but an explicit `/use-skill:` directive should
be honored while recording the disabled state or platform blocker.

## Completion Gate

Before finishing, verify the delivered result matches the user's actual goal.
For Financial Analysis, this means sourced figures, sourced or qualified
comparison baselines, clear uncertainty when data is missing, user-facing prose
reference read, and the answer gate for direct answers. When a shareable
playbook was part of the task, this normally means a released playbook and a
canonical share URL:

`https://alva.ai/u/<username>/playbooks/<playbook_name>`

If the user only asked for code, analysis, debugging help, or an intermediate
artifact, do not force release. Summarize what is delivered, what was verified,
and any remaining blocker or risk.
