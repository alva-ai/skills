# Alva Knowledge

Read this chapter before designing, modifying, or evaluating any automation. It
owns the history decision for every automation, cross-run judgment for
longitudinal or decision automations, and notification novelty for push-capable
automations. Feed construction and delivery mechanics remain in
[feed-lifecycle.md](feed-lifecycle.md) and
[push-notifications.md](push-notifications.md).

## Use History To Improve Judgment

Do not default an automation to an isolated scheduled run. First decide whether
prior state, inputs, outputs, or decisions can improve the current result. A
pure data refresh may correctly remain current-state-only; make that decision
explicit. For a longitudinal or decision automation, define:

- the decision subject and stable identity, such as asset, topic, event, or
  monitored condition;
- the bounded history source and lookback window;
- the baseline to compare against, such as the previous state, rolling norm, or
  last emitted decision;
- the first-run and missing-history behavior.

On every relevant run, read the prior inputs, outputs, or decisions and compare
them with current evidence before reaching a conclusion. Use only the bounded
history needed for the decision; do not load an entire unbounded stream. Keep
the current state, relevant history, material delta, and resulting action
distinct so the reasoning can be inspected.

For LLM-backed automations, use the historical-reference pattern in
[alpi.md](alpi.md#historical-reference-feed-as-memory). Historical context
supports judgment but never replaces fresh factual data or repairs missing
coverage; the provenance rules in
[content-legitimacy.md](content-legitimacy.md) still apply.

## Decide Novelty Before Writing The Notification

Notification deduplication is semantic, not textual. Feed SDK timestamp
deduplication only controls stored records; it does not stop an automation from
rephrasing and pushing the same conclusion on every run.

For a push-capable automation, use this order before writing user-facing
notification copy:

1. Normalize the candidate decision into a stable subject, state or direction,
   severity, evidence timestamp, and evidence identifiers.
2. Read recent decisions or notifications for that subject within the defined
   lookback window.
3. Identify what is materially new: a new event, a state transition, a
   meaningful severity or confidence change, or new evidence that changes the
   action.
4. Push only when that delta is useful to the user. A rewritten summary,
   unchanged conclusion, or insignificant value movement is not novelty.
5. Persist enough structured decision state for the next run to make the same
   comparison. If no material delta exists, take the quiet-run path described in
   [push-notifications.md](push-notifications.md).

Repeated notifications are valid only when the automation defines a reminder
or escalation policy. The repeated message must state the new elapsed-time,
severity, or escalation reason instead of presenting unchanged content as a new
finding.

## Automation Review

Before publishing, test consecutive runs against the applicable rules above. A
longitudinal or decision automation must cover unchanged input, material change,
and missing history. A push-capable automation must additionally prove that an
unchanged conclusion takes the quiet-run path and that any policy-defined
reminder or escalation states why the repeat is warranted.
