# Alva Skill Module Map

Read this before editing the Alva skill. It records ownership, dependency
chains, hard gates, and the source-to-destination map used to keep `SKILL.md`
as a lean platform capability map without losing behavior.

## Layer model

| Layer | Owns | Files |
| --- | --- | --- |
| Capability map | Platform panorama, capability discovery, when to act, the one must-not-miss rule, and the exact reference to open | `../SKILL.md` |
| Workflow references | Ordered procedures, gates, criteria, examples that affect behavior | `preflight.md`, `request-routing.md`, `content-legitimacy.md`, `data-skills.md`, `feed-lifecycle.md`, `playbook-release.md`, `push-notifications.md`, `remix-workflow.md`, `annotation-edits.md` |
| Module references | API surfaces, runtime/module details, examples, gotchas | `jagent-runtime.md`, `feed-sdk.md`, `altra-trading.md`, `adk.md`, `onnx.md`, `search.md`, `secret-manager.md`, `memory.md` |
| Design references | Tokens, layout, widgets, components, strategy UI templates | `design-system.md`, `design-widgets.md`, `design-components.md`, `design-playbook-trading-strategy.md`, `design-tokens.css` |
| CLI gotcha references | Details the CLI help omits or currently states incorrectly | `api/filesystem.md`, `api/release.md`, `api/trading.md`, `api/error-responses.md` |
| Voice references | User-facing vocabulary, narrative style, post-release notes | `language.md`, `narrative-voice.md`, `creators-note.md` |
| Eval artifacts | Regression cases and reports for capability coverage, gates, and full application workflows | `../evals/*` |

## Dependency chains

### Any session

`SKILL.md` → `preflight.md` → `language.md` + `memory.md` → command-specific
reference from the help-first routing table.

### Dashboard / playbook

`request-routing.md` → `content-legitimacy.md` → `data-skills.md` or
`search.md` → `feed-lifecycle.md` → `playbook-release.md` →
`design-system.md` plus widget/component reference → `api/release.md`.

### Backtest / strategy

`request-routing.md` → `altra-trading.md` → `feed-lifecycle.md` →
`design-playbook-trading-strategy.md` → `playbook-release.md` →
`api/trading.md` if orders/signals/accounts are involved.

### Push workflow

`feed-sdk.md` Patterns D/E → `feed-lifecycle.md` →
`push-notifications.md` → `deployment.md` → `playbook-release.md` item 9.

### Scheduled digest / LLM pipeline

Ordinary scheduled agent digest: `feed-sdk.md` Pattern E (AlvaAsk) →
`feed-lifecycle.md` → `push-notifications.md` if alerts are enabled.

Custom ADK tool loop: `adk.md` → `jagent-runtime.md` →
`content-legitimacy.md` → `feed-lifecycle.md` → `playbook-release.md` if a
playbook publishes the output.

### Remix / annotation edit

`remix-workflow.md` or `annotation-edits.md` →
`content-legitimacy.md` → changed feed/design reference →
`feed-lifecycle.md` and/or `playbook-release.md`.

### Model inference

`onnx.md` → `jagent-runtime.md` → `feed-sdk.md` → `feed-lifecycle.md` →
`playbook-release.md`.

## Hard gates

| Gate | Canonical file | Must stay visible in `SKILL.md` |
| --- | --- | --- |
| `before-feed-release` | `feed-lifecycle.md` | Yes |
| `before-build-html` | `playbook-release.md` | Yes |
| `before-playbook-draft` | `playbook-release.md` | Yes |
| `before-playbook-release` | `playbook-release.md` | Yes |

`SKILL.md` may summarize a gate in one sentence, but full criteria live only in
the canonical file.

## Duplication-prone facts

| Fact | Canonical home | Pointer rule |
| --- | --- | --- |
| CLI help is authoritative | `preflight.md` | Other files say "run help" but do not copy command surfaces. |
| Data must come from SDK/feed/BYOD, never agent/search/LLM literals | `content-legitimacy.md` | Design/release refs point here instead of restating all criteria. |
| Arrays discovery is list → summary → endpoint | `data-skills.md` | `SKILL.md` and feed docs only name the pipeline. |
| Direct financial answers require a fresh fetch or an explicit could-not-fetch response | `data-skills.md` | Do not preserve estimate-caveat wording elsewhere. |
| Feed lifecycle and release gate | `feed-lifecycle.md` | `feed-sdk.md` owns SDK API; deployment owns cronjob API. |
| Browser playbook reads use the public ALFS helper, never `$ALVA_ENDPOINT` | `playbook-release.md` | `feed-sdk.md` points to the same helper for web pages. |
| Public feed grants are on the feed root, not version or synth data paths | `feed-lifecycle.md`, `api/filesystem.md` | Examples should grant `~/feeds/<name>`. |
| README, `--readme-url`, tags, `--skill-id` | `api/release.md` | `playbook-release.md` owns when to apply them. |
| Browser public read helper | `playbook-release.md` | Content legitimacy points here. |
| Push requires sidecar + feed release + push flag + subscription + real-run verification | `push-notifications.md` | Feed SDK owns output schemas only. |
| Runtime absent globals and limits | `jagent-runtime.md` | `operational-pitfalls.md` lists common symptoms. |
| Legacy `require("@arrays/...")` data examples are invalid for new feeds | `data-skills.md` | Feed, deployment, and ADK examples use Data Skills HTTP with `ARRAYS_JWT`. |
| Ordinary scheduled agent digests prefer AlvaAsk; ADK is for custom tool loops | `adk.md`, `feed-sdk.md` | `SKILL.md` says this once and routes to both. |
| Fiscal vs calendar fundamentals | `fundamentals-periods.md` | Content legitimacy points here. |
| Product vocabulary | `language.md` | User-facing prose rules point here. |
| AI-tell ban and ADK voice block | `narrative-voice.md` | `adk.md` points here for narrative outputs. |

## Source-to-destination map

| Original `SKILL.md` source | Canonical destination |
| --- | --- |
| What is Alva / capability overview | Kept in `SKILL.md` introduction |
| Rule 0 help-first | `preflight.md`; one hard pointer in `SKILL.md` |
| Version, CLI setup, auth, user profile, Arrays JWT, memory load | `preflight.md`; memory details in `memory.md` |
| Communication vocabulary and result-first style | `language.md`, `narrative-voice.md`; short rule in `SKILL.md` |
| Request routing table, Skillhub directive, guided planning, completion gate | `request-routing.md` |
| Capability verification before rejecting data coverage | `request-routing.md` and `data-skills.md` |
| Content legitimacy, prohibited sources, feed isolation, SDK gaps, ticker curation, conventions, provenance | `content-legitimacy.md`; fundamentals depth in `fundamentals-periods.md` |
| Narrative voice rules | `narrative-voice.md` |
| ALFS overview, synth suffixes, grants, reset commands | `api/filesystem.md`, `operational-pitfalls.md` |
| JS runtime absent globals and module list | `jagent-runtime.md`, `operational-pitfalls.md` |
| Data Skills coverage and lookup pipeline | `data-skills.md` |
| Runtime libraries quick reference | `jagent-runtime.md`; search specifics in `search.md` |
| Content Search | `search.md`; legitimacy rules in `content-legitimacy.md` |
| Altra quick reference and code sample | `altra-trading.md`; `SKILL.md` keeps the always-use rule |
| Deploy on Alva Cloud, cronjobs, lifecycle row boundaries | `deployment.md`; feed-specific flow in `feed-lifecycle.md` |
| Push notification streams and post-release flow | `push-notifications.md`; schema examples in `feed-sdk.md` |
| Build playbook HTML hard gate and public read helper | `playbook-release.md`; design details in design references |
| Release common steps, subscription flow, draft/release gates, screenshot | `playbook-release.md`; CLI gotchas in `api/release.md` |
| Remix workflow | `remix-workflow.md` |
| Annotation-driven edits | `annotation-edits.md` |
| Detailed sub-documents table | Replaced by `SKILL.md` reference index plus this map |
| CLI reference table | `preflight.md` command routing and `SKILL.md` compact CLI index |
| Feed SDK quick reference, data modeling, debugging | `feed-sdk.md`, `feed-lifecycle.md`, `api/filesystem.md` |
| App-level fresh-context eval for direct data, feed-backed playbooks, release, Altra, push, remix, annotation, secrets, fundamentals, and ADK | `evals/app_workflow_cases.json`, `evals/app_workflow_eval.js`, app workflow reports |
| Error transparency and subscription-gated SDKs | `content-legitimacy.md` |
| Memory | `memory.md` with preflight pointer |
| Secret Manager | `secret-manager.md` |
| ADK quick reference | `adk.md`; narrative constraints in `narrative-voice.md` |
| Deployment quick reference | `deployment.md`, `feed-lifecycle.md`, `playbook-release.md` |
| Design system routing | `design-system.md` plus design companion refs |
| Filesystem layout, common pitfalls, resource limits | `operational-pitfalls.md`, `api/filesystem.md`, `jagent-runtime.md` |

Items intentionally deduplicated:

- Repeated feed data reset examples now live in `api/filesystem.md`.
- Repeated deployment examples now live in `deployment.md`.
- Repeated release README/tag/skill-id rules now live in `api/release.md`.
- Repeated design "read design-system first" rules now live in
  `playbook-release.md` and `design-system.md`.

## Reference inbound pointers

Every markdown reference must be reachable from `SKILL.md`, this map, or
another reference. The validation script in `evals/routing_eval.js` checks
critical capability-map coverage; use `rg` for a full inbound-link pass after
edits.
