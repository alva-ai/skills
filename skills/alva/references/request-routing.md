# Request Routing

Use this file when choosing the path for an Alva task. The goal is to select the
smallest useful route, ask at most one blocking question, and then build or
answer with evidence.

## Routes

| Request type | Objective |
| --- | --- |
| Dashboard / Playbook | Identify data sources, validate data flow, then produce a usable dashboard or playbook when the user wants a shareable artifact. |
| Backtest / Strategy | Use Altra, run the backtest correctly, and package the result as a visual playbook, dashboard, or concise summary. |
| Data Query | Fetch the requested data accurately and answer directly unless the user asks for a richer artifact. |
| Remix | Read the source artifact, apply the requested customization, and produce a new result under the requesting user. |
| Push / Alert | Build or modify a feed that emits actionable `signal/targets` or `notify/message`, then verify subscription and delivery path. |
| Debug / Edit | Inspect existing code, logs, playbook source, feed output, or annotations, then change the generator rather than rendered values. |

## Skillhub Blueprint

If the user's message contains `/use-skill:<username>/<name>`, the Skillhub path
is mandatory before Guided Planning or build work.

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
   data coverage blocks it.
7. If any Skillhub skill informed the build, pass
   `--skill-id <username>/<name>` during playbook draft. See
   [api/release.md](api/release.md#skill-id).

The directive plus a concrete topic is a strong build directive: present one
short plan, then build. Do not stack extra clarification questions on top.

## Guided Planning

For all routes except simple Data Query, present a plan once before building.

Exactly one blocking question per session:

1. If key parameters are missing and have no obvious default, ask one
   clarifying question. Prefer concrete choices.
2. If real strategic alternatives exist, offer 2-3 approaches and lead with
   your recommendation.
3. If the request is clear, or a `/use-skill:` directive pins the shape, give a
   5-8 line plan naming feeds, data sources, widgets, release path, and any
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
When a shareable playbook was part of the task, this normally means a released
playbook and a canonical share URL:

`https://alva.ai/u/<username>/playbooks/<playbook_name>`

If the user only asked for code, analysis, debugging help, or an intermediate
artifact, do not force release. Summarize what is delivered, what was verified,
and any remaining blocker or risk.
