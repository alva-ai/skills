# Thesis

Use this route only when the user asks to create, publish, rewrite, or maintain
a Thesis. Discussion, research, and memory are not publication consent. A
dashboard or tracker remains a Playbook.

Run `alva thesis --help` and the relevant subcommand help first. Use only
`alva thesis`; if unavailable, report it instead of falling back to HTML,
Playbooks, Automation, direct service writes, or invented identities.

## Create

Before `alva thesis create`, show the exact payload in this format:

```text
Ready to create this Thesis:

Title: <title or (none)>
Visibility: <public (default) or the requested visibility>
Body:
<exact body>
Entity IDs: <none, or IDs in the supplied order>

Create this Thesis?
```

Show the complete body, including file content rather than its filename, and
preserve its wording, language, whitespace, and line breaks. Do not summarize,
rewrite, translate, correct, expand, generate a title, or infer entities from
the body. If the user requests changes, show the complete updated payload
again. Create only after a natural confirmation of that displayed payload; no
special phrase is required. Stop if declined.

One sentence is valid. Title and entity IDs are optional. Visibility defaults
to public. Generate one nonzero UUID per creation intent and keep it with the
exact payload as `--request-id`; a changed intent requires a new UUID.

```sh
alva thesis create --request-id '<uuid>' --body '<exact body>'
alva thesis get --id '<returned thesis id>'
```

The terminal accepts exactly one of `--body`, `--body-file`, or
`--body-stdin`. The embedded Agent accepts literal `--body`; read selected
files first. Quote input without changing it. Body is limited to 65536 UTF-8
bytes and title to 500 bytes; reject invalid, empty, or oversized input without
truncation. Treat all returned IDs as decimal strings.

## Created Thesis preview

After creation, `thesis get` is the sole source for the preview. Use:

- `response.thesis.id`, `body`, `author_version_id`, and ordered
  `entity_ids`;
- `response.author`: `id`, `kind`, `display_name`, `avatar_url`,
  `username`;
- `response.entities`: one ordered object per entity ID, each with `id`,
  `ticker`, `name`, `icon_url`, and `kind`.

Use only those returned fields; do not supplement them with secondary lookups
or body scanning. Reject missing, malformed, extra, or out-of-order
author/entity data. Never substitute
`material_version_id` for `author_version_id`.

Emit exactly one raw XML block, without a Markdown fence:

```xml
<thesis-preview schema-version="1" thesis-id="123" version-id="456" author-name="Ada Lovelace" author-avatar-url="https://example.com/avatar.png"><body>NVDA can compound if inference demand grows.</body><tickers><ticker entity-id="789" symbol="NVDA" icon-url="https://example.com/nvda.svg"/></tickers></thesis-preview>
```

The fence above documents the contract only. Required structure:

- `<body>` occurs once and is followed by one `<tickers>` container.
- Map ticker `entity-id`, `symbol`, and `icon-url` from entity `id`,
  `ticker`, and `icon_url`; use self-closing ticker elements in GET order.
- Use `<tickers/>` only for an authoritative empty entity set.
- XML-escape `& < > " '` in all values. After one XML decode, body must equal
  GET body byte-for-byte; add no formatting whitespace inside `<body>`.

Do not guess a display name, avatar, entity, ticker, or icon. An explicitly
empty avatar/icon URL may be emitted as an empty attribute; an omitted or
malformed field is failure. On incomplete GET data, report the created ID and
only verified fields in plain text; do not emit partial XML. The preview is a
completion card, not another confirmation gate.

## Rewrite

Rewrite only when explicitly requested. It returns a candidate and never
creates or updates a Thesis.

```sh
alva thesis rewrite --body '<text>' [--mode reformat|shorten|enrich]
```

Omit `--mode` for the `reformat` default. Never guess or pass an empty mode.

- `reformat`: improve structure and readability without changing substance.
- `shorten`: remove redundancy while retaining reasons and qualifiers.
- `enrich`: expand existing reasoning; mark inference and never invent evidence,
  numbers, citations, entities, or causal claims.

All modes preserve language, stance, uncertainty, facts, and conclusions. Show
the candidate; publish it only after a separate create/update request and its
required confirmation. Report rewrite errors without retry or fallback.

## Existing Thesis lifecycle

### Change visibility only

For an explicit request to make an existing Thesis public or private, use the
dedicated visibility command. Do not reconstruct a full update payload.

1. Run `alva thesis get --id '<thesis id>'`. Record the returned Thesis
   `id`, `visibility`, `body`, `author_version_id`,
   `material_version_id`, `title`, and ordered `entity_ids`.
2. State the current-to-target visibility change. An explicit request may
   proceed directly; do not add another formal confirmation gate.
3. Run exactly once:

   ```sh
   alva thesis set-visibility --id '<thesis id>' --visibility public|private
   ```

4. Run `alva thesis get --id '<thesis id>'` again. Verify the requested
   visibility is returned and the ID, body, author version, material version,
   title, and ordered entity IDs are unchanged.

Setting the current value is a valid idempotent request. On invalid input,
authorization failure, missing Thesis, ambiguous write result, failed readback,
or any comparison mismatch, report what is verified and stop. Do not retry,
fall back to `thesis update`, call GraphQL, or use Playbook visibility
commands. This maintenance action does not emit the creation-only
`<thesis-preview>` block.

- `get --id`: read the current document and version.
- `update`: retain unchanged fields and send `--id`, a new
  `--request-id`, `--expected-author-version-id`, `--body`, explicit
  `--visibility`, plus retained title/entity IDs. Omitting title/entities clears
  them; never default an existing private Thesis to public.
- `close`: require `--id` and `--expected-author-version-id`; `--note`
  is only a closing note.
- `delete --id`: withdraw only on explicit request.

Report version conflicts instead of silently rereading and overwriting. Do not
use `--editorial` to bypass a material or version conflict.

## Evidence and retries

Report only returned identity, versions, readback, run state, Signal, and
delivery evidence. Missing first-run status is unverified; a successful silent
run differs from a failed run, and Signal output differs from delivery.

Do not automatically retry a lost create/update response or mint a replacement
identity. If the user resubmits the same intent, reuse the same request UUID and
exact payload; the same UUID with changed input is a conflict. Report other
errors without creating another Thesis or falling back to Playbooks/Automation.
