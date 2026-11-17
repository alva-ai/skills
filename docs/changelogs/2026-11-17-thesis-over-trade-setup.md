# fix(alva): choose the next step after a ticker read, Thesis first

## 1. Background and Current State

- 2026-11-17 PRD (skills v1.30.0): a user opened "Create a thesis" and pasted a
  finished NVDA draft (title, bullish call, reasoning, earnings catalyst). Alva
  tested the view, then ended with "Want to turn those confirmation and failure
  conditions into an automation that watches your NVDA setup?" The user had to
  say twice that they only wanted to post the Thesis.
- The App's Thesis greeting is display-only and never reaches the model, so the
  agent saw only the pasted text and treated it as discussion.
- `references/ticker-read.md` made a Trade Setup automation follow-up mandatory
  after any single-instrument read that named a thesis, catalyst, risk,
  confirmation, or invalidation condition. The Thesis offer in
  `request-routing.md` and `thesis.md` was a softer option that also required a
  "settled" view, so the mandatory rule won.
- `SKILL.md` had no route for discussing the user's own view, so a pasted draft
  did not have to load `thesis.md` at all.
- Preferred Automation Setup Skills defined Trade Setup as watching "the user's
  own free-form trade thesis", the same intent a Thesis serves.

## 2. Problem Model and End-to-End Behavior

- B1: After a named single-instrument read, Alva always offers one next step,
  the first that fits: a Thesis when the user has voiced their own view or has
  a Thesis on the instrument and did not ask a setup-like question; Trade Setup
  for setup-like asks or concrete levels; otherwise one specific follow-up
  question. A declined kind is not repeated.
- B2: A Thesis offer needs only a direction with a reason in the user's words;
  the view need not be final. A lean without a reason gets a question about
  what drives it. A finished pasted draft is offered for publication as written.
- B3: Researching, creating, and updating the user's own Thesis is preferred
  over an Automation or Trade Setup suggestion the user did not ask for.
  Explicit requests for levels, entries, exits, stops, alerts, or a recurring
  check keep their own route.
- B4: Trade Setup watches explicit execution conditions. Following the view
  itself for new evidence is Thesis tracking.
- B5: Publication still requires the existing preview and confirmation.

## 3. Research, Findings, and Architecture Decision

- D1: Fix precedence in the skill. Published Theses already receive platform
  research and Signals, so a monitoring Automation duplicates them.
- D2: Keep the post-read trigger broad so Alva stays proactive; change which
  next step it picks.
- D3: Each rule has one home. The offer form and the explicit-request exception
  live in Useful Next Step After Ask; `ticker-read.md` and `thesis.md` point to
  it.
- D4: Carrying the "Create a thesis" entry intent into the model context is a
  Backend/Frontend change and is out of scope here.

## 4. Implementation Design

- `references/ticker-read.md`: "Trade Setup follow-up" becomes "Next step after
  a ticker read" (B1); the offer form follows Useful Next Step After Ask.
- `references/thesis.md` Thesis discussion: offer threshold and pasted drafts
  (B2).
- `references/request-routing.md`: the Thesis next step is listed first and
  carries B3, including the existing-Thesis check or Update; Preferred
  Automation Setup Skills is narrowed to execution conditions (B4).
- `SKILL.md`: the Thesis deliverable is the user's own view to research,
  publish, track, and update; discussing the user's own view or a pasted draft
  routes to Thesis discussion, merged with the quoted-Thesis row. Version
  v1.31.2.
- `evals/alva-skill-docs`: case `platform-data.ticker-read-trade-setup-follow-up`
  rewritten, `target.thesis-conversation-flow` updated, scenario
  `scenario.pasted-own-view-offers-thesis` added, eight mutations added.

## 5. Verification and E2E Design

- `node evals/alva-skill-docs/skill-doc-eval.mjs`,
  `node evals/alva-skill-docs/mutation-smoke.mjs`,
  `node --test evals/alva-skill-docs/durable-agent.test.mjs`.

## 6. Human Decisions and Interaction

- 2026-11-17: fix the skill first; leave the entry-intent change for later.
- 2026-11-17: keep Alva proactive after ticker reads; only the choice of next
  step changes.
- 2026-11-17: a lean is enough to start guiding the user toward a Thesis, and
  Thesis research, creation, and updates are stated as the most valuable step.

## 7. Outcome and Evidence

- Doc eval 128/128, mutation smoke 70/70, durable-agent 5/5.
- No live model replay yet.

## 8. Remaining Work

- Replay on STG: a pasted draft, "NVDA key levels", and a plain "how is NVDA".
- Trade Setup offers will drop for reads that only name risks or catalysts;
  check with the Trade Setup owner if its conversion is tracked.
- Pass the "Create a thesis" entry intent to the model (Backend/Frontend).
- sandbox-agent-ts `config/CLAUDE.md` and `config/profiles/CHANNEL.md` name
  Thesis as a product and a next step in a separate change.
