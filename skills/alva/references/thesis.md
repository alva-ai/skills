# Thesis: publish the selected viewpoint

Use this route when the user asks to publish/create a Thesis, maintain an
existing Thesis, or polish a viewpoint using the Thesis capability. Merely
discussing, researching, or remembering a viewpoint is not publication consent.
When the selected original text is ambiguous, clarify that text only. An
explicitly requested dashboard or custom tracker still uses Playbook Creation.

## Discover the available command

Run `alva thesis --help` and the relevant subcommand help first. The terminal
and embedded Agent both use `alva thesis`; authentication belongs to their
existing host/CLI setup. If the command or API is unavailable, report that
dependency. Do not fall back to HTML, Playbook draft/release, direct gRPC/ALFS
writes, custom Automation code, or an invented URL/Feed/Channel identity.

## Confirm before creating

The user's request to create or publish establishes the intent. Before invoking
`alva thesis create`, show the final Thesis that will be created—at minimum the
final body, and any title or visibility that will be used—and ask the user to
confirm that result. Do not run `create` until the user confirms the displayed
Thesis. If the user asks for changes, update the displayed result and ask again;
if the user declines, stop without creating anything.

This confirmation is about the final Thesis content, not a second approval of
the user's original intent. A natural acknowledgement or direct instruction to
create the displayed Thesis is enough; do not require a special confirmation
phrase or repeat the publication warning. Reads and candidate-only rewrites may
proceed under their own rules below; showing a rewrite candidate does not
confirm its later publication.

## Create without rewriting

One sentence is enough. Title and entity IDs are optional. Creation is public
by default; explain that default when displaying the final Thesis. Honor an
explicit private request. Do not generate a title, expand the text, add
arguments, or run `rewrite` as a prerequisite. Preserve whitespace, line breaks
and language.

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

## Return the created Thesis card

After `create` succeeds, run `alva thesis get --id '<returned thesis id>'` and
treat that authoritative readback—not the submitted draft or prose in the
conversation—as the created result. Then emit exactly one Thesis preview XML
block for the frontend to render. This completion card is not another
confirmation gate.

The `thesis get` response is authoritative for the Thesis ID,
`author_version_id`, `material_version_id`, body, `entity_ids`, `author_kind`,
and `author_ref`. It does not include the presentation metadata required by the
card: author display name/avatar or entity ticker/logo. Do not claim those
fields came from `thesis get`. Hydrate them through the current authenticated
environment instead:

1. Run `alva whoami` and use `_meta.endpoint`; never hard-code staging or
   production. Append `/query` after removing any trailing slash.
2. Run `alva run` with `require("net/http").fetch` to POST GraphQL to that
   query endpoint. Pass the endpoint and readback IDs through `--args`; do not
   bake profile-specific values into the runtime script.
3. For `author_kind: alva_user`, resolve `author_ref` with
   `node(id: "PublicUser:<author_ref>")`, selecting `id`, `username`,
   `displayName`, and `avatarUrl` on `PublicUser`. The card uses `displayName`
   and `avatarUrl`. Treat another author kind as unsupported unless its
   canonical profile lookup is documented and verified.
4. Resolve every readback `entity_id` with
   `market.entity(input: { id: "<entity_id>" })`, selecting `id`, `ticker`,
   `name`, `logo`, and `kind`. Preserve the original `entity_ids` order when
   building `<ticker>` children.

The runtime query shapes are:

```graphql
node(id: "PublicUser:<author_ref>") {
  __typename
  ... on PublicUser { id username displayName avatarUrl }
}

market {
  entity(input: { id: "<entity_id>" }) { id ticker name logo kind }
}
```

Treat GraphQL errors, an unexpected author type, a missing requested entity, or
an ID mismatch as hydration failure. `alva run` is the transport for this
canonical lookup; scanning the body, web-searching a ticker, or substituting
`alva whoami`'s username does not produce authoritative presentation data.

Populate the card with the canonical readback and hydrated values:

- the author's display name and avatar URL from the hydrated `PublicUser`;
- the exact body from the post-create readback;
- each entity's stable ID, ticker symbol, and icon URL resolved from its
  canonical entity record; and
- the readback Thesis ID and `author_version_id` as `thesis-id` and
  `version-id`. The body is the author document, so do not substitute
  `material_version_id` when the two versions differ.

Use this exact wire format, without a Markdown code fence:

```xml
<thesis-preview schema-version="1" thesis-id="123" version-id="456" author-name="Ada Lovelace" author-avatar-url="https://example.com/avatar.png"><body>NVDA can compound if inference demand grows.</body><tickers><ticker entity-id="789" symbol="NVDA" icon-url="https://example.com/nvda.svg"/></tickers></thesis-preview>
```

The example fence documents the contract only; actual replies emit the raw XML
block. Keep the element and attribute names exactly as shown. The four
identity/presentation attributes plus `schema-version="1"` are required.
`<body>` occurs exactly once, followed by exactly one `<tickers>` container
with zero or more self-closing `<ticker entity-id="..." symbol="..."
icon-url="..."/>` children. All three ticker attributes are required. Map
them from the canonical entity `id`, `ticker`, and `logo` fields respectively;
do not put the symbol in ticker element text. Use `<tickers/>` for an
authoritative empty entity set. Preserve the readback `entity_ids` order and
canonical ticker spelling.

XML-escape `&`, `<`, `>`, `"`, and `'` as `&amp;`, `&lt;`, `&gt;`, `&quot;`,
and `&apos;` in every attribute or text value. The frontend decodes those
entities exactly once; the decoded `<body>` value must equal the
post-create readback byte-for-byte, including whitespace and line breaks. Do
not add indentation or formatting whitespace inside `<body>`. Emit the block
only after its closing `</thesis-preview>` is complete; surrounding
explanatory prose stays outside the block. The frontend consumes a complete,
valid block as one card segment and leaves malformed, unsupported-version, or
unclosed markup as ordinary text.

Do not derive tickers by scanning the body, substitute a username for a missing
display name, invent an avatar, or otherwise guess presentation data. An
authoritative empty entity set produces `<tickers/>`. If a required
profile field or any entity's `id`, `ticker`, or `logo` hydration is
unavailable, do not emit a partial XML block: identify the missing card fields
and provide a human-readable fallback containing only verified fields. An
explicitly absent canonical avatar or entity logo is represented by
`author-avatar-url=""` or `icon-url=""`; an unknown avatar or logo is a
hydration failure, not an empty value. A failed readback means the create
response may be reported, but no authoritative preview card may be emitted.

## Explicit polishing only

```sh
alva thesis rewrite --body '<text the user asked to polish>' --mode reformat
```

Rewrite is explicit and returns candidate text only. Choose the mode the user
asked for; otherwise omit `--mode`, which sends the canonical `reformat`
default. Do not pass an empty, whitespace, `null`, or guessed mode. The only
valid modes are:

- `reformat` (default): improve structure, paragraphs, and readability while
  preserving every substantive fact, reason, qualifier, and conclusion.
- `shorten`: remove redundancy while retaining the core view, reasons, and
  qualifiers.
- `enrich`: expand the reasoning already supplied. State assumptions and
  inferences conditionally; never invent evidence, numbers, citations, or
  research, or present new entities/causal relationships as established facts.

Every mode preserves the original language, stance, uncertainty, and
qualifications. Do not choose a mode from body length or errors. Do not impose
a title, report template, or minimum word count.

Show the candidate to the user. Do not publish it or overwrite an existing
Thesis unless the user subsequently selects it for that separate operation.
An unavailable rewrite model is an error, not permission to pretend the
service rewrote or saved the text. Original-text creation remains a separate
operation and does not depend on subjective polishing quality.

Rewrite does not create or update a Thesis, retry, or fall back to a different
mode. Incomplete model output returns a readable `FailedPrecondition` HTTP 412
error and no partial candidate. Unconfigured/unavailable service or admission
returns HTTP 503; invalid model output is `Internal`/HTTP 500. Quota exhaustion
is HTTP 429, with `Retry-After` when the server supplies a valid positive delay.
Report actual errors; let the user decide whether to try again, without automatic retries.

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
