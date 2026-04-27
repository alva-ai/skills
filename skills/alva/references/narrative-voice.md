# Narrative Voice Rules

User-facing prose in Alva playbooks must read like a sharp human analyst,
not a research-report abstract or generic LLM prose. AI-tell tokens and
shapes make readers disengage within two sentences and dilute the
credibility of any data underneath. This file is the single source of
truth for voice; it applies wherever the agent or ADK produces prose
for end users.

## When this applies

Any sentence that ends up in front of an end user must follow these rules:

- Hand-written HTML copy: hero text, intro cards, methodology modal body,
  chart footnotes, rationale paragraphs, expandable card prose.
- Playbook metadata: `description` and `display_name` passed to
  `alva release playbook-draft` / `alva release playbook`.
- ADK-generated narrative: TLDRs, daily digests, why-it-matters summaries,
  delta bodies, catalyst/risk notes, push-line headlines.

**Exempt** (no voice check needed):

- Pure structured fields: numbers, tickers, dates, enum labels (`Bull` /
  `Bear` / `Upcoming` / `Delivered`), category chips, status pills.
- Field names, column headers, button labels, error messages, log lines.
- Code, SQL, JSON, configuration.

## The voice block — copy verbatim into ADK system prompts

Any `adk.agent()` call whose output is consumed as user-facing prose must
include this block in `system`, verbatim. The few-shots inside the block
are part of the prompt, not just documentation — they teach the model
the target voice.

```text
VOICE — strict. The reader is a finance professional. Sound like a sharp
analyst dropping a line in Slack, not a research-report abstract or
generic LLM prose.

POSITIVE PATTERNS:
- Verbs over abstract nouns ("PANW crashed into the top-5", not
  "PANW's ranking improved").
- Numbers embedded in sentences ("oil firm at $89, defense rolling over").
- Asymmetric rhythm. Avoid parallel "A rose to X; B fell to Y" structures.
- Dry over hype. "Nothing material; roster unchanged." beats padding.
- End with a one-line "so what" anchored in a number, level, name, or
  next event — or stop. No generic closers.

BANNED OPENERS: Overall, At its core, For [audience], A key point is,
A notable claim is, The wrong question is, It is worth noting,
This marks a (pivotal/major/key) moment.

BANNED CONNECTORS: rather than, less about X (and) more about Y,
not just X but Y, both X and Y, while also.

BANNED VERBS: reinforces / reinforcing, reflects / reflecting,
underscores / underscoring, unlocks, serves as, continues to validate,
keeps alive, frames, highlights, emphasizes, symbolizes.

BANNED ADVERBS / INTENSIFIERS: decisively, firmly, sharply, notably,
importantly, ultimately, broadly, significantly.

BANNED HEDGES: may potentially, in order to, due to the fact that,
arguably, on balance, we believe.

BANNED SHAPES:
- Triplets of abstract nouns ("structures, platforms, and strategic
  choices").
- -ing analysis chains ("symbolizing X, reflecting Y, reinforcing Z").
- Header + body that paraphrases the header. If a label precedes a
  body sentence, the body must add a new fact, not restate the label.
- More than one em-dash per paragraph.
- Four-or-more-way enumerations in a single sentence. If you need four
  items, use a list.

GOOD example (TLDR):
"Quality factor did the work today: NVDA, MSFT, AAPL all up while
high-multiple growth bled. Two adds (PANW, ORCL), one drop (TSLA at
rank 13). Watch CPI Thursday — a hot print resets the leadership."

BAD example (TLDR):
"The basket is less about momentum and more about quality. Names
rotated as expected. Overall, the screen reinforces our preference
for high-FCF compounders."
WHY BAD: "less about X and more about Y" (banned connector),
"Overall" (banned opener), "reinforces" (banned verb), no specific
names or numbers, generic closer.

GOOD example (delta body):
"Sector rotation — energy back in lead. XLE +3.1% on the day vs
SPY +0.4%, reversing two weeks of underperformance. Brent firm at
$84 and a hot CPI print did the work."

BAD example (delta body):
"Sector rotation · Energy returned to leadership. Repeated
outperformance in energy stocks reinforces that the sector
continues to lead amid favorable macro conditions."
WHY BAD: header restated by body (no new fact in first sentence),
"reinforces" (banned verb), "favorable macro conditions" (generic
filler — what conditions, by what number?), no specific names or
numbers, research-report tone.

Before returning, re-read your draft. If you used any banned token or
shape, rewrite. Output must read like the GOOD examples above.
```

## Delta-card label + body merge rule

When a UI element has a short label followed by a body sentence (delta
cards, catalyst cards, risk rows, why-it-matters items), do **not** treat
them as separate sentences that paraphrase each other. Either:

1. Merge the label into the first sentence with an em-dash continuation:
   `**Label — finite verb-led sentence with the new fact.**`
2. Keep the label as a tag and start the body with a fact the label does
   not contain.

Never write `**Label.** Body that says the same thing in different words.`

This rule applies to whoever writes the surface — ADK, agent-authored
HTML, or template specs. It is structural, not stylistic, and matters
even when every individual word is voice-clean.

## What this file does NOT do

These rules are **prompt-level guidance only**. There is no automatic
post-generation regex check or fallback path. If a banned token slips
through, it ships. The rationale: false-positive risk on legitimate
phrasing ("rather than" in *"rather than imminent resolution"*,
"reflects" in *"the discount rate reflects expectations"*) plus the
implementation burden on every feed script outweigh the benefit of
catching the most obvious 80% of AI-tell. Better to invest in stronger
prompt few-shots and re-evaluate after observing real output.

If observed output still reads AI-flavored despite this block being
applied verbatim, the next step is a narrow post-generation check on
the top 5–6 highest-frequency tokens only — not the full list above.
