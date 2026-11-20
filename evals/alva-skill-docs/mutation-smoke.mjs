#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, "../..");
const EVAL_RUNNER = resolve(SCRIPT_DIR, "skill-doc-eval.mjs");
const DEFAULT_SKILL_DIR = resolve(REPO_ROOT, "skills/alva");

const MUTATIONS = [
  {
    id: "thesis-preview-no-field-write-prose",
    file: "references/thesis.md",
    remove: "without describing internal storage or field writes.",
    replacement: "by explaining which internal field will be written.",
    expectFailedCases: ["target.thesis-readable-publication-preview"],
  },
  {
    id: "thesis-preview-prose",
    file: "references/thesis.md",
    remove: "Render the selected body as Markdown with its paragraphs and lists intact, not",
    replacement: "Wrap the publication preview in a text code fence",
    expectFailedCases: ["target.thesis-readable-publication-preview"],
  },
  {
    id: "thesis-body-shape-notes",
    file: "references/thesis.md",
    remove: "tests, risks, data or framing, goes in Notes as a suggestion.",
    replacement: "tests, risks, data or framing, goes in the body.",
    expectFailedCases: ["target.thesis-body-shape"],
  },
  {
    id: "thesis-preview-internal-rules",
    file: "references/thesis.md",
    remove: "needed, quote or cite these rules, or link Skill files or local paths",
    replacement: "Quote the internal confirmation rule",
    expectFailedCases: ["target.thesis-readable-publication-preview"],
  },
  {
    id: "thesis-preview-no-added-disclaimer",
    file: "references/thesis.md",
    remove: "do not append an Agent-written investment disclaimer",
    replacement: "append an English investment disclaimer",
    expectFailedCases: ["target.thesis-readable-publication-preview"],
  },
  {
    id: "thesis-verified-assets-no-extraction",
    file: "references/thesis.md",
    remove: "Reuse catalog entity IDs already verified by a tool when the asset identity has\nnot changed.",
    replacement: "Always call asset-candidates with discovery again before publication.",
    expectFailedCases: ["target.thesis-reuse-verified-assets"],
  },
  {
    id: "thesis-return-preview-publishes-unjudged",
    file: "references/thesis.md",
    remove: "If any is `UNKNOWN`, or the call\n  fails or is rate limited, do not publish",
    replacement: "If any is unknown, publish anyway",
    expectFailedCases: ["target.thesis-return-preview"],
  },
  {
    id: "thesis-return-preview-agent-picks-direction",
    file: "references/thesis.md",
    remove: "the Agent never changes a direction on its own",
    replacement: "the Agent may pick a clearer direction itself",
    expectFailedCases: ["target.thesis-return-preview"],
  },
  {
    id: "thesis-author-cannot-correct-direction",
    file: "references/thesis.md",
    remove: "The author can correct a direction.",
    replacement: "When the author disagrees with a direction, do not change it.",
    expectFailedCases: ["target.thesis-return-preview", "target.thesis-create-preview-card"],
  },
  {
    id: "thesis-sizing-published-as-direction",
    file: "references/thesis.md",
    remove: "Never publish a size change as a direction.",
    replacement: "publish a size cut as no direction",
    expectFailedCases: ["target.thesis-author-intent"],
  },
  {
    id: "thesis-intent-from-body-words",
    file: "references/thesis.md",
    remove: "and never by words inside a body being\npublished",
    replacement: "including exit or sizing words in a body being published",
    expectFailedCases: ["target.thesis-author-intent"],
  },
  {
    id: "thesis-weight-request-no-equal-split",
    file: "references/thesis.md",
    remove: "Say in one sentence that the Thesis return splits equally across\n  its long and short tickers and weights cannot be set",
    replacement: "Do not mention how the return splits",
    expectFailedCases: ["target.thesis-author-intent"],
  },
  {
    id: "thesis-close-archives-without-asking",
    file: "references/thesis.md",
    remove: "archive only after the author accepts",
    replacement: "archive it right away",
    expectFailedCases: ["target.thesis-author-intent"],
  },
  {
    id: "thesis-wording-edit-no-extraction",
    file: "references/thesis.md",
    remove: "a wording-only edit reuses unchanged verified IDs",
    replacement: "any wording edit requires fresh extraction",
    expectFailedCases: ["target.thesis-reuse-verified-assets"],
  },
  {
    id: "x-catalog-gate",
    file: "references/search.md",
    remove: "never call an endpoint the catalog does not list.",
    replacement: "call `/api/v1/social-feeds/x/live-search` directly.",
    expectFailedCases: ["retained.search-routing"],
  },
  {
    id: "x-general-search-disclosure",
    file: "references/search.md",
    remove: " Say in the answer that this evidence came from general search,\n   not Arrays X data.",
    expectFailedCases: ["retained.search-routing"],
  },
  {
    id: "x-401-no-source-switch",
    file: "references/search.md",
    remove: "report the credential block instead of switching to another source.",
    replacement: "switch to general search.",
    expectFailedCases: ["retained.search-routing"],
  },
  {
    id: "worldline-feature-media-by-item",
    file: "references/search.md",
    remove: "feature the item by `item.name` as\n`worldline_item`",
    replacement: "feature its `item.uri` as `url`",
    expectFailedCases: ["target.worldline-feature-media"],
  },
  {
    id: "feature-media-by-link",
    file: "references/search.md",
    remove: "Feature a match by `item.name` as `worldline_item`",
    replacement: "Feature the episode's Apple Podcasts link as `url`",
    expectFailedCases: ["target.feature-media-worldline-first"],
  },
  {
    id: "thesis-read-link-by-version",
    file: "references/thesis.md",
    remove: "https://alva.ai/thesis/<publication.playbookId>)`, with\nno query parameters",
    replacement: "https://alva.ai/thesis/<publication.playbookId>?versionId=<authorVersionId>)`",
    expectFailedCases: ["target.thesis-read-card-links"],
  },
  {
    id: "thesis-read-link-without-paragraph",
    file: "references/thesis.md",
    remove: "Put a blank line before and after each link, including between successive\nlinks, so every link is its own Markdown paragraph.",
    replacement: "A single newline is enough before each link.",
    expectFailedCases: ["target.thesis-read-card-links"],
  },
  {
    id: "thesis-fallback-link-without-paragraph",
    file: "references/thesis.md",
    remove: "Keep each link in its own Markdown paragraph, with a blank line before\n  and after each link, including between successive links.",
    replacement: "A single newline is enough before each fallback link.",
    expectFailedCases: ["target.thesis-write-card-preview"],
  },
  {
    id: "thesis-update-without-preview",
    file: "references/thesis.md",
    remove: "A published Update ends the same way: after `update` succeeds, read it with\n`thesis get` and emit this block for the new `author_version_id`.",
    replacement: "After an Update, confirm it in a sentence with a link to the Thesis.",
    expectFailedCases: ["target.thesis-write-card-preview"],
  },
  {
    id: "thesis-task-result-without-preview",
    file: "references/thesis.md",
    remove: "In a background task, the task's final result must contain the block for\n  every Thesis the task created or updated",
    replacement: "In a background task, the task's final result may summarize each Thesis\n  the task created or updated",
    expectFailedCases: ["target.thesis-write-card-preview"],
  },
  {
    id: "feed-search-mixed-fields",
    file: "references/feed-sdk.md",
    remove: "Use the same `fields` for every `index()` call on an\n  output.",
    replacement: "Each `index()` call may pick different `fields`.",
    expectFailedCases: ["target.feed-semantic-search"],
  },
  {
    id: "feed-search-concurrent-indexers",
    file: "references/feed-sdk.md",
    remove: "Index an output from one task at a time,",
    replacement: "Any number of tasks may index an output at once,",
    expectFailedCases: ["target.feed-semantic-search"],
  },
  {
    id: "feed-search-whole-call-credit-check",
    file: "references/feed-sdk.md",
    remove:
      "Each embedding request is checked against the\n  remaining credits before it is sent, not the whole call",
    replacement: "With too few credits the call throws before any request is sent",
    expectFailedCases: ["target.feed-semantic-search"],
  },
  {
    id: "thesis-actions-scoped-to-preview",
    file: "references/thesis.md",
    remove: "always end the preview with localized\n`send_prompt` actions:",
    replacement: "send localized `send_prompt` actions before the final reply:",
    expectFailedCases: ["target.thesis-create-preview-card", "target.useful-next-step-actions"],
  },
  {
    id: "playbook-share-action-timing",
    file: "references/playbook-creation.md",
    remove: "also offer that link as an `open_url` action.",
    replacement: "register that link as an `open_url` action before the final reply.",
    expectFailedCases: ["target.useful-next-step-actions"],
  },
  {
    id: "ticker-next-step-prefers-trade-setup",
    file: "references/ticker-read.md",
    remove: "Pick the first that fits:",
    replacement: "Prefer Trade Setup whenever it fits:",
    expectFailedCases: [
      "platform-data.ticker-read-trade-setup-follow-up",
      "scenario.pasted-own-view-offers-thesis",
    ],
  },
  {
    id: "ticker-next-step-drops-follow-up-question",
    file: "references/ticker-read.md",
    remove: "3. **Follow-up question.** Otherwise",
    replacement: "3. **No suggestion.** Otherwise",
    expectFailedCases: ["platform-data.ticker-read-trade-setup-follow-up"],
  },
  {
    id: "ticker-next-step-repeats-declined-offer",
    file: "references/ticker-read.md",
    remove: "If the user declined that kind of offer earlier, pick the next that fits.",
    replacement: "Repeat the same offer each turn.",
    expectFailedCases: ["platform-data.ticker-read-trade-setup-follow-up"],
  },
  {
    id: "trade-setup-claims-own-view-tracking",
    file: "references/request-routing.md",
    remove: "Following the user's investment view itself for new evidence is\n[Thesis tracking](thesis.md#thesis-tracking), not a Trade Setup.",
    replacement: "Also use it to keep tracking the user's investment view.",
    expectFailedCases: ["platform-data.ticker-read-trade-setup-follow-up"],
  },
  {
    id: "ticker-next-step-setup-ask-optional",
    file: "references/ticker-read.md",
    remove: "For a setup-like ask, the answer is incomplete without this\n   offer.",
    replacement: "For a setup-like ask, this offer is optional.",
    expectFailedCases: ["platform-data.ticker-read-trade-setup-follow-up"],
  },
  {
    id: "pasted-draft-not-settled",
    file: "references/thesis.md",
    remove: "is ready as written: after responding to it,\noffer to publish it as their Thesis.",
    replacement: "is not ready: after responding to it, do not offer a Thesis.",
    expectFailedCases: [
      "platform-data.ticker-read-trade-setup-follow-up",
      "scenario.pasted-own-view-offers-thesis",
    ],
  },
  {
    id: "own-view-overrides-explicit-alert",
    file: "references/request-routing.md",
    remove: "\n  An explicit request for levels, entries, exits, stops, alerts, or a\n  recurring check follows its own route.",
    replacement: "",
    expectFailedCases: ["platform-data.ticker-read-trade-setup-follow-up"],
  },
  {
    id: "thesis-offer-waits-for-settled-view",
    file: "references/thesis.md",
    remove: "with a reason in their words is enough, and it need not be final.",
    replacement: "is not enough until the view has fully settled.",
    expectFailedCases: ["target.thesis-conversation-flow"],
  },
  {
    id: "trade-consent-not-button",
    file: "references/request-routing.md",
    remove: "Order or trade confirmation and\nauto-trading risk acknowledgment need the user's typed reply, never a button.",
    expectFailedCases: ["target.useful-next-step-actions"],
  },
  {
    id: "thesis-original-awaits-preview-confirmation",
    file: "references/thesis.md",
    remove: "Show the preview, then wait for confirmation.",
    replacement: "Show the preview, then create immediately.",
    expectFailedCases: [
      "target.thesis-create-preview-card",
      "scenario.thesis-publish-supplied-original",
    ],
  },
  {
    id: "thesis-new-editorial-issue-awaits-author",
    file: "references/thesis.md",
    remove: "If the preview showed Notes the author had not yet\nconsidered, that confirmation is their decision to publish despite them.",
    replacement: "Create immediately even when the preview shows new Notes.",
    expectFailedCases: [
      "target.thesis-authorship",
      "scenario.thesis-confirm-flags-inconsistent-body",
    ],
  },
  {
    id: "thesis-delete-request-runs-delete",
    file: "references/thesis.md",
    remove: "Alva cannot close or delete a Thesis or remove a published Update;",
    replacement: "On request, run `alva thesis delete --id '<thesis-id>'`;",
    expectFailedCases: [
      "target.thesis-update-media-no-delete",
      "scenario.thesis-delete-request-declined",
    ],
  },
  {
    id: "thesis-action-candidate-scope",
    file: "references/thesis.md",
    remove: "An old button does not authorize a changed candidate",
    replacement: "An old button authorizes the latest candidate",
    expectFailedCases: [
      "target.thesis-create-preview-card",
      "scenario.thesis-publish-action-selection",
    ],
  },
  {
    id: "thesis-file-body-shown-in-full",
    file: "references/thesis.md",
    remove: ", as must text taken\n  from a file, attachment, link, or other extraction (show its content, not its\n  filename)",
    expectFailedCases: [
      "target.thesis-create-preview-card",
      "scenario.thesis-publish-supplied-original",
    ],
  },
  {
    id: "pro-gate-not-bypassed",
    file: "references/data-skills.md",
    remove: " Do not route around an access gate\n   by fetching the gated dataset elsewhere unless the user asks for that.",
    expectFailedCases: ["issue592.capability-verification-before-refusal"],
  },
  {
    id: "verified-external-source-fallback",
    file: "references/data-skills.md",
    remove: "actively search for\n   an accessible public source",
    expectFailedCases: ["issue592.capability-verification-before-refusal"],
  },
  {
    id: "arrays-x-search-priority",
    file: "references/search.md",
    remove: "when the catalog lists a live-search\n   endpoint, use it per its current contract.",
    replacement: "use general web search first.",
    expectFailedCases: ["retained.search-routing"],
  },
  {
    id: "complex-ask-required-checks",
    file: "references/request-routing.md",
    remove:
      "Complete the checks central to the requested judgment through available\n" +
      "documented sources; report a gap when a necessary check cannot be completed,\n" +
      "not simply because it has not been attempted.\n",
    expectFailedCases: ["target.financial-ask-quality-gates"],
  },
  {
    id: "search-legacy-grok-guidance",
    file: "references/data-skills.md",
    remove: "Twitter/X routing:",
    replacement: "Twitter/X routing:\n\n- Use `unified_search` / Grok when you need global X search beyond the tracked index.",
    expectFailedCases: ["retained.search-routing"],
  },
  {
    id: "thesis-quote-routing",
    file: "SKILL.md",
    remove: "[Quoted Thesis context](references/thesis.md#quoted-thesis-context)",
    expectFailedCases: ["target.thesis-quote-context"],
  },
  {
    id: "thesis-quote-exact-version",
    file: "references/thesis.md",
    remove: "never the latest `alva thesis get --id`",
    expectFailedCases: ["target.thesis-quote-context"],
  },
  {
    id: "thesis-quote-version-cli",
    file: "references/thesis.md",
    remove: "alva thesis version get --id '123' --author-version-id '456'",
    expectFailedCases: ["target.thesis-quote-context"],
  },
  {
    id: "thesis-authorship-keep-claims",
    file: "references/thesis.md",
    remove: "Keep every author claim in the body as the author meant it.",
    expectFailedCases: [
      "target.thesis-authorship",
      "scenario.thesis-revise-keeps-author-claims",
    ],
  },
  {
    id: "thesis-authorship-notes-line",
    file: "references/thesis.md",
    remove: "Notes are not part of the payload; omit them when none.\n",
    expectFailedCases: [
      "target.thesis-authorship",
      "scenario.thesis-confirm-flags-inconsistent-body",
    ],
  },
  {
    id: "thesis-authorship-notes-before-create",
    file: "references/thesis.md",
    remove: " before calling `alva thesis create`",
    expectFailedCases: [
      "target.thesis-authorship",
      "scenario.thesis-confirm-flags-inconsistent-body",
    ],
  },
  {
    id: "thesis-authorship-editor-read",
    file: "references/thesis.md",
    remove: "Still read the body once as its editor",
    expectFailedCases: [
      "target.thesis-authorship",
      "scenario.thesis-confirm-flags-inconsistent-body",
    ],
  },
  {
    id: "session-inbox-no-execution-retry",
    file: "references/agent-schedules.md",
    remove: "Agent execution failure ends this AutoRun without retry.\n",
    expectFailedCases: ["target.session-inbox-schedule"],
  },
  {
    id: "session-inbox-no-channel-fallback",
    file: "references/agent-schedules.md",
    remove: "Without an Inbox, embedded schedule commands fail instead of falling back to a Channel.\n",
    expectFailedCases: ["target.session-inbox-schedule"],
  },
  {
    id: "simple-latest-one-hop",
    file: "references/request-routing.md",
    remove: "Simple latest-fact asks can finish after one sourced hop. ",
    expectFailedCases: ["issue592.financial-ask-contract", "scenario.simple-latest-price"],
  },
  {
    id: "reintroduced-investment-disclaimer",
    file: "SKILL.md",
    remove: "## Principles\n",
    replacement: "## Principles\n\nThis content is for informational purposes only and does not constitute investment advice.\n",
    expectFailedCases: [
      "target.no-generic-investment-disclaimer",
    ],
  },
  {
    id: "altra-v1-not-marked-deprecated",
    file: "references/altra-v1-legacy.md",
    remove: "# Altra v1 (Legacy, Deprecated)\n",
    replacement: "# Altra Trading Engine\n",
    expectFailedCases: ["target.altra-v1-legacy"],
  },
  {
    id: "altra-company-name-lookup",
    file: "references/altra-trading.md",
    remove:
      "- Search takes the venue's own symbol, not a company name. Map a name to its ticker first\n",
    expectFailedCases: ["target.altra-canonical-lookup"],
  },
  {
    id: "altra-routes-to-v1",
    file: "SKILL.md",
    remove: "Altra (`@alva/altra2`)",
    replacement: "Altra (`FeedAltra`)",
    expectFailedCases: ["target.altra2-default"],
  },
  {
    id: "altra-symbol-resolution",
    file: "references/altra-trading.md",
    remove:
      "Use the `alva trading-pairs` CLI to resolve trading pairs before writing a\n" +
      "strategy. Run `alva trading-pairs --help` for its search and resolve commands.\n",
    expectFailedCases: [
      "target.altra-symbol-resolution",
      "scenario.backtest-symbol-resolution",
    ],
  },
  {
    id: "reintroduced-advice-request-header",
    file: "references/user-facing-prose.md",
    remove: "# User-Facing Prose\n",
    replacement: "# User-Facing Prose\n\nI'll share an analysis, but keep in mind I'm not a licensed analyst or adviser, and this isn't personalized advice for you specifically.\n",
    expectFailedCases: [
      "target.no-generic-investment-disclaimer",
    ],
  },
  {
    id: "capability-before-refusal",
    file: "references/request-routing.md",
    remove: "Before saying Alva lacks a capability or recommending BYOD, verify the catalog:",
    expectFailedCases: [
      "issue592.capability-verification-before-refusal",
      "scenario.capability-gap-before-refusal",
    ],
  },
  {
    id: "before-playbook-release-readme",
    file: "references/playbook-creation.md",
    remove: "9. README exists, is current, and is passed via absolute `--readme-url`.\n",
    expectFailedCases: ["issue592.playbook-release-behavior", "scenario.dashboard-playbook-build"],
  },
  {
    id: "udf-strict-opt-in",
    file: "references/playbook-creation.md",
    remove: "User-Defined Functions are strict opt-in. ",
    expectFailedCases: ["scenario.udf-strict-opt-in"],
  },
  {
    id: "udf-author-owned-result-contract",
    file: "references/api/udf-runtime.md",
    remove: "The result contract is author-owned. ",
    expectFailedCases: ["retained.udf-author-owned-contract"],
  },
  {
    id: "automation-knowledge-route",
    file: "references/request-routing.md",
    remove: "Read [alva-knowledge.md](alva-knowledge.md) before design, ",
    expectFailedCases: ["scenario.alert-push-monitor"],
  },
  {
    id: "automation-knowledge-publish-gate",
    file: "references/feed-lifecycle.md",
    remove:
      "1. The applicable [Alva Knowledge](alva-knowledge.md) requirements passed\n" +
      "   consecutive-run checks: longitudinal or decision automations compare bounded\n" +
      "   history, and push-capable automations suppress non-material repeats.\n",
    expectFailedCases: ["scenario.alert-push-monitor"],
  },
  {
    id: "automation-publish-side-effects",
    file: "references/feed-lifecycle.md",
    remove:
      "`--skip-auto-trigger` suppresses only the publish-time run. It does not suppress\n" +
      "the owner alert binding. Because the binding exists immediately after publish,\n" +
      "an explicit `deploy trigger` may deliver a real alert.\n",
    expectFailedCases: ["target.automation-publish-side-effects"],
  },
  {
    id: "automation-knowledge-required-reading",
    file: "SKILL.md",
    remove:
      "| Track, continuously evaluate, refresh, or alert beyond platform Thesis tracking | Read [alva-knowledge.md](references/alva-knowledge.md) when designing or changing automation reasoning, history, or notification logic, then [feed-lifecycle.md](references/feed-lifecycle.md) and [push-notifications.md](references/push-notifications.md). Apply the [Preferred Automation Setup Skills](references/request-routing.md#preferred-automation-setup-skills) when choosing a setup |\n",
    expectFailedCases: ["scenario.alert-push-monitor"],
  },
  {
    id: "automation-knowledge-reference-index",
    file: "SKILL.md",
    remove:
      "| Automation reasoning, bounded history, novelty, and quiet runs | [alva-knowledge.md](references/alva-knowledge.md) |\n",
    expectFailedCases: ["scenario.alert-push-monitor"],
  },
  {
    id: "current-topic-channel-destination",
    file: "references/push-notifications.md",
    remove: "  channel-session id. Topic-channel delivery is web-only. In a channel turn,\n",
    expectFailedCases: ["subscriptions.delivery-destination", "scenario.current-topic-channel-alert"],
  },
  {
    id: "feed-alert-output-authoring",
    file: "references/push-notifications.md",
    remove: "1. Declare the intended output with `alertOutput(typeDoc)`. The TypeDoc must\n",
    expectFailedCases: ["scenario.alert-push-monitor"],
  },
  {
    id: "feed-rich-alert-authoring",
    file: "references/feed-sdk.md",
    remove: "#### Portable Actions And Card Presentation\n",
    expectFailedCases: [
      "alerts.portable-actions-and-cards",
      "scenario.rich-feed-alert",
    ],
  },
  {
    id: "ticker-read-first-tier-route",
    file: "SKILL.md",
    remove: "read [ticker-read.md](references/ticker-read.md) before source selection",
    expectFailedCases: [
      "platform-data.ticker-read-sources",
      "scenario.ticker-read-broad-analysis",
    ],
  },
  {
    id: "ticker-read-anomaly-priority",
    file: "references/ticker-read.md",
    remove:
      "Use `alva/company-anomaly-read` as the first direct-read check for intraday and hourly-scale market tracking.\n",
    expectFailedCases: [
      "platform-data.ticker-read-sources",
      "scenario.ticker-read-broad-analysis",
      "scenario.ticker-read-hourly-tracking",
    ],
  },
  {
    id: "ticker-read-company-anomaly-skillhub-owner",
    file: "references/ticker-read.md",
    remove:
      "- For Company Anomaly reads, do not bypass an unavailable Skillhub method by\n",
    expectFailedCases: [
      "platform-data.ticker-read-sources",
      "scenario.ticker-read-broad-analysis",
      "scenario.ticker-read-hourly-tracking",
    ],
  },
  {
    id: "trading-signal-date-seconds",
    file: "references/api/trading.md",
    remove: "`date` is **Unix milliseconds**",
    replacement: "`date` is **epoch seconds**",
    expectFailedCases: ["target.runtime-contract-alignment"],
  },
  {
    id: "jagent-no-top-level-await",
    file: "references/jagent-runtime.md",
    remove: "**Top-level `await` is supported**",
    replacement: "**No top-level `await`**",
    expectFailedCases: ["target.runtime-contract-alignment"],
  },
  {
    id: "playbook-release-public-first",
    file: "references/playbook-creation.md",
    remove: "read it back, then release. Never release publicly first",
    replacement: "release publicly first, then set visibility",
    expectFailedCases: ["target.playbook-publication-alignment"],
  },
  {
    id: "remix-reads-root-index-html",
    file: "references/remix-workflow.md",
    remove: "Read the released HTML from `releases[0].layout_html`",
    replacement: "Read the HTML from `/playbooks/{name}/index.html`",
    expectFailedCases: ["target.playbook-publication-alignment"],
    },
    {
    id: "bootstrap-sandbox-guard",
    file: "BOOTSTRAP.md",
    remove: "**If you are Alva itself** (a managed Alva Sandbox, where the skill's Runtime",
    replacement: "**If you are another agent** (a managed Alva Sandbox, where the skill's Runtime",
    expectFailedCases: ["target.agent-bootstrap"],
  },
  {
    id: "bootstrap-no-shell-guard",
    file: "BOOTSTRAP.md",
    remove: "this setup needs an AI agent that can run commands, such as Claude or Codex on",
    replacement: "try the steps anyway, such as",
    expectFailedCases: ["target.agent-bootstrap"],
  },
  {
    id: "routine-thesis-unknown-direction",
    file: "references/agent-routine.md",
    remove: "Any `UNKNOWN`, or the call fails → do",
    replacement: "Any `UNKNOWN` → publish it anyway, and do",
    expectFailedCases: ["target.agent-bootstrap"],
  },
  {
    id: "bootstrap-cloud-login",
    file: "BOOTSTRAP.md",
    remove: "cannot see this computer's screen (a cloud computer, a remote machine), add",
    replacement: "open a browser on this computer anyway and send them the",
    expectFailedCases: ["target.agent-bootstrap"],
  },
  {
    id: "bootstrap-login-without-agent-name",
    file: "BOOTSTRAP.md",
    remove: '`alva auth login --agent "<your product name>"`',
    replacement: "`alva auth login`",
    expectFailedCases: ["target.agent-bootstrap"],
  },
  {
    id: "bootstrap-old-cli-agent-flag",
    file: "BOOTSTRAP.md",
    remove: "without `--agent`.",
    replacement: "after updating the CLI.",
    expectFailedCases: ["target.agent-bootstrap"],
  },
  {
    id: "bootstrap-opening-no-pause",
    file: "BOOTSTRAP.md",
    remove: "Then stop and wait for their go-ahead:",
    replacement: "Then continue without waiting:",
    expectFailedCases: ["target.agent-bootstrap"],
  },
  {
    id: "bootstrap-fixed-daily-schedule",
    file: "BOOTSTRAP.md",
    remove: "frequency the user chose (08:00 local time every day unless they said",
    replacement: "frequency of 08:00 local time every day (whatever they said",
    expectFailedCases: ["target.agent-bootstrap"],
  },
  {
    id: "skill-sandbox-runs-bootstrap",
    file: "SKILL.md",
    remove: " A Sandbox runs neither: it only gives BOOTSTRAP's \"If you are Alva itself\" reply.",
    replacement: ".",
    expectFailedCases: ["target.agent-bootstrap"],
  },
];

function parseArgs(argv) {
  const opts = {
    skillDir: DEFAULT_SKILL_DIR,
    keepTemp: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--skill-dir") {
      opts.skillDir = resolve(argv[++i]);
    } else if (arg === "--keep-temp") {
      opts.keepTemp = true;
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return opts;
}

function printHelp() {
  console.log(`Usage: node evals/alva-skill-docs/mutation-smoke.mjs [options]

Options:
  --skill-dir <path>   Skill directory to copy and mutate. Default: skills/alva.
  --keep-temp          Keep mutated temporary copies for debugging.
  -h, --help           Show this help.
`);
}

function runEval(skillDir) {
  const result = spawnSync(process.execPath, [EVAL_RUNNER, "--skill-dir", skillDir], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    maxBuffer: 50 * 1024 * 1024,
  });
  return {
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    output: `${result.stdout ?? ""}\n${result.stderr ?? ""}`,
  };
}

function replaceOnce(filePath, needle, replacement = "") {
  const original = readFileSync(filePath, "utf8");
  if (!original.includes(needle)) {
    throw new Error(`Mutation target not found in ${filePath}: ${JSON.stringify(needle)}`);
  }
  writeFileSync(filePath, original.replace(needle, replacement), "utf8");
}

function copySkill(sourceSkillDir, tempRoot, mutationId) {
  const target = join(tempRoot, mutationId, "alva");
  cpSync(sourceSkillDir, target, { recursive: true });
  return target;
}

function assertEvalGreen(sourceSkillDir) {
  const result = runEval(sourceSkillDir);
  if (result.status !== 0) {
    process.stderr.write(result.output);
    throw new Error("Base skill eval must pass before mutation smoke can prove failures.");
  }
}

function assertMutationFails(sourceSkillDir, tempRoot, mutation) {
  const mutatedSkillDir = copySkill(sourceSkillDir, tempRoot, mutation.id);
  replaceOnce(resolve(mutatedSkillDir, mutation.file), mutation.remove, mutation.replacement);

  const result = runEval(mutatedSkillDir);
  if (result.status === 0) {
    throw new Error(`${mutation.id}: eval unexpectedly passed after mutating ${mutation.file}`);
  }

  const missingExpectedCases = mutation.expectFailedCases.filter(
    (caseId) => !result.output.includes(`FAIL ${caseId}`),
  );
  if (missingExpectedCases.length > 0) {
    process.stderr.write(result.output);
    throw new Error(
      `${mutation.id}: eval failed, but not through expected cases: ${missingExpectedCases.join(", ")}`,
    );
  }
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const tempRoot = mkdtempSync(join(tmpdir(), "alva-skill-doc-mutations-"));

  try {
    assertEvalGreen(opts.skillDir);
    for (const mutation of MUTATIONS) {
      assertMutationFails(opts.skillDir, tempRoot, mutation);
      console.log(`PASS ${mutation.id}`);
    }
    console.log(`Mutation smoke passed: ${MUTATIONS.length}/${MUTATIONS.length} mutations failed as expected.`);
  } finally {
    if (opts.keepTemp) {
      console.log(`Kept temporary mutation copies at ${tempRoot}`);
    } else {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  }
}

main();
