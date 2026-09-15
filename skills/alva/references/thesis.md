# Thesis: publish the selected viewpoint

Use this route when the user explicitly asks to publish/create a Thesis,
maintain an existing Thesis, or polish a viewpoint using the Thesis capability.
Merely discussing, researching, or remembering a viewpoint is not publication
consent. When the selected original text is ambiguous, clarify that text only.
An explicitly requested dashboard or custom tracker still uses Playbook Creation.

## Discover the available command

Run `alva thesis --help` and the relevant subcommand help first. The terminal
and embedded Agent both use `alva thesis`; authentication belongs to their
existing host/CLI setup. If the command or API is unavailable, report that
dependency. Do not fall back to HTML, Playbook draft/release, direct gRPC/ALFS
writes, custom Automation code, or an invented URL/Feed/Channel identity.

## Create without rewriting

One sentence is enough. Title and entity IDs are optional. Creation is public
by default; explain that default without adding a repeated confirmation when
the user has already explicitly requested publication. Honor an explicit
private request. Do not generate a title, expand the text, add arguments, or
run `rewrite` as a prerequisite. Preserve whitespace, line breaks and language.

Choose one new nonzero UUID per creation intent and retain it with the exact
payload. Supply it as `--request-id`; do not ask the user to invent internal
IDs. A later, genuinely different creation uses a new UUID.

```sh
alva thesis create --request-id '<new-uuid>' --body '<selected original text>'
alva thesis get --id '<returned thesis id>'
```

The terminal can use exactly one of `--body`, `--body-file`, or `--body-stdin`.
The embedded Agent accepts literal `--body` only: use its existing read tool
when the user selects a file, then pass the file's complete text. Never submit
the filename as the viewpoint. Quote/escape text safely for the actual command
invocation; shell interpolation must not change the selected text.

Body input is bounded to 65536 UTF-8 bytes, and an optional title to 500 bytes.
These are transport limits, not minimum research/word-count requirements.
Report invalid, empty or oversized input; do not silently truncate it.
Keep every returned Thesis/version/entity ID as a decimal string.

## Explicit polishing only

```sh
alva thesis rewrite --body '<text the user asked to polish>'
```

Polishing returns candidate text only. Preserve the original language,
meaning, stance, uncertainty and qualifications; improve clarity and
concision. One sentence is enough. Do not add facts, prices, evidence,
citations, entities, causal claims or confidence the user did not supply.
Do not impose a title, report template or minimum word count.

Show the candidate to the user. Do not publish it or overwrite an existing
Thesis unless the user subsequently selects it for that separate operation.
An unavailable rewrite model is an error, not permission to pretend the
service rewrote or saved the text. Original-text creation remains a separate
operation and does not depend on subjective polishing quality.

## Updates and lifecycle

- `get --id` reads the current document and version.
- `update` replaces the author document. Read the current fields, retain all
  fields the user did not change, and submit `--id`, a new `--request-id`,
  `--expected-author-version-id`, `--body`, and explicit `--visibility`. Include
  the existing title and entity IDs when retaining them. Omitting title/entities
  clears them; never default an existing private Thesis to public.
- `close` requires `--id` and `--expected-author-version-id`; `--note` is an
  optional closing note, not a replacement of the original body.
- `delete --id` withdraws the resource only when the user requests deletion.

On a version conflict, show the conflict rather than fetching a new version
and silently overwriting it. Do not set `--editorial` merely to bypass a version
or material-content change; use only the established editorial semantics.

## Report evidence, not inferred success

Creation is separate from background research. Report the actual returned
Thesis identity/version and exact readback. Backend owns first Signal execution
and author Alert setup; never call another command to start them, create a
parallel schedule, or guess a destination. The current CRUD response may lack
first-run status: in that case say it is unverified, not queued/running/silent.

An actual successful run without a Signal is normal silent. A failed run is
failure, not silent; do not automatically rerun it or create another Thesis.
Signal output and delivered notification are different facts; only claim
delivery with its real receipt. Never fabricate content to fill a silent run.

If a create/update response is lost, do not automatically retry or mint a
replacement identity. If the same intent is resubmitted to resolve ambiguity,
reuse the same request UUID and exact payload, including expected version.
Same UUID with changed input is a conflict. Permission, dependency and other
errors are reported without a Playbook/Automation fallback.
