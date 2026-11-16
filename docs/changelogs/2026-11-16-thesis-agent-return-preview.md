# feat(alva): preview Thesis directions and the return switch, and explain returns

Local record. Primary record: alva-backend `docs/changelogs/2026-11-16-thesis-agent-return-preview.md` (behaviors B1–B10, decisions D1–D7).

## 1. Background and Current State

- `skills/alva/references/thesis.md` "Publication preview": since #654 the
  Agent judges tickers and directions itself, calls `asset-candidates` only
  for unresolved identity, and lets the user's explicit direction win; labels
  are 看多 / 看空 / 未表明方向.
- "Confirmation": the preview ends with `PresentActions` publish and edit
  actions; a click equals the typed reply.
- No switch, no `none`, no typed-error handling, no return explanation.

## 2. Problem Model and End-to-End Behavior

- **B1:** After verifying tickers, the Agent asks for their directions with the
  body (and the Thesis on an Update) and shows the stored directions.
- **B2:** The switch line and a "turn off and publish" action appear only when
  the response says to ask; one confirmation publishes.
- **B3:** Directions follow the text: the Agent suggests clarifying the body
  instead of overriding a direction.
- **B4:** Tracked Theses keep a long or short ticker; kept exits are explained;
  the two typed errors are explained.
- **B5:** A returns section explains the whole return, each Update's return
  and each position's move, using `alva thesis return`.
- Requires the new toolkit-ts in the sandbox.

## 3. Research, Findings, and Architecture Decision

- **D1:** The skill renders Backend decisions; it encodes no switch rule.
- **D2:** Wording uses placeholders until product supplies labels.

## 4. Implementation Design

See the primary record section 4 (contracts, copy table, rollout) for this
repository's row of the impact table and its checklist step.

Code notes (2026-11-16): any `UNKNOWN` preview direction counts as "directions
unavailable" (Backend fails open on a Jev error). Two still-true phrases stay
word for word ("Name the displayed candidate in the publish prompt…", "Use
localized direction labels") so existing eval cases keep guarding them; cases
whose behavior changed (directions follow the body; every Update previews
directions) now assert the new text, and two mutations were retargeted and two
added for the new case.

## 5. Verification and E2E Design

See the primary record section 5 for this repository's tests. E2E Required: no.

## 6. Human Decisions and Interaction

See the primary record section 6.
