# Personal Skills

Personal Skills are private, user-owned methodology blueprints stored in Alva Cloud
under `~/.agents/skills/<slug>/` and indexed through `alva my-skills`. Unlike
[Skillhub blueprints](request-routing.md#skillhub-blueprint), they are visible only
to their owner. Unlike [memory.md](memory.md) (`~/memory/user.md`), they hold
reusable step-by-step analysis or workflow instructions rather than user profile
facts or investment thoughts.

## Commands

Use the `alva my-skills` command family (run `alva my-skills --help` if uncertain):

- `alva my-skills list [--include-disabled]`: list the current user's personal skills.
- `alva my-skills get <ref>`: inspect metadata and file inventory (`<ref>` accepts `personal:<public_id>`, `<public_id>`, or `<slug>`).
- `alva my-skills file <ref> <path> [--rev <n>]`: read a skill file (`SKILL.md` or supporting `references/*`).
- `alva my-skills save --slug <slug> --display-name <name> --description <desc> (--dir <path> | --skill-md <path> | --files-json <path>) [--source-type chat|url|upload|agent_link|skillhub_fork] [--source-ref <ref>] [--source-hash <hash>] [--expected-rev <n>] [--overwrite] --request-id <uuid>`
- `alva my-skills enable <ref>` / `alva my-skills disable <ref>`
- `alva my-skills delete <ref>`
- `alva my-skills reindex <ref>`

## Private Routing Precedence

In private chats, apply methodology routing in this order:

1. **Explicit directive**: `/use-skill:personal:<public_id>` (or `personal:<public_id>`) targets that exact personal skill.
2. **Explicit user request**: the user asks to "use my <name> skill/method/framework".
3. **Prefill match**: `<session-prefill-personal-skills>` lists an enabled personal skill whose description clearly matches the user's task.
4. **Skillhub**: public [Skillhub blueprints](request-routing.md#skillhub-blueprint).

Before following a matched personal skill:

- Read its current `SKILL.md` with `alva my-skills file <ref> SKILL.md`; fetch supporting files only on demand.
- Treat `<session-prefill-personal-skills>` as an index only, never as a substitute for reading `SKILL.md` or fetching live market data.
- **Disabled skills**: never apply organically. If explicitly requested via `personal:<public_id>`, explain that the skill is disabled and offer to re-enable it (`alva my-skills enable <ref>`).
- **Missing runtime or credentials**: if a personal skill references local machine tools, private brokers, or external credentials unavailable in Alva Cloud, keep those steps inert and explain clearly what cannot run rather than fabricating data or bypassing controls.

## Creating and Updating Personal Skills

- **Explicit requests**: when the user asks to save a reusable method from the conversation, a public URL snapshot, or an uploaded file, draft clean Markdown (`SKILL.md` plus optional `references/*`), strip local machine paths and any secrets/credentials/account numbers, and save via `alva my-skills save --source-type <chat|url|upload> --request-id <new UUID>`.
- **Ordinary chat boundary**: uploaded documents or pasted URLs stay ordinary chat evidence unless the user asks to save them as a Personal Skill.
- **Targeted edits**: before updating an existing Personal Skill, read its current `SKILL.md` and `current_rev`, apply minimal targeted edits, and pass `--expected-rev <current_rev> --request-id <new UUID>` so concurrent edits are never silently overwritten.
- **Never store secrets**: never write API keys, passwords, tokens, holdings, or account numbers into a Personal Skill.

## Semi-Automatic Capture From Chat

When the user corrects your methodology ("always check FCF conversion before P/E")
or completes a reusable multi-step investing workflow worth repeating:

- Finish the user's current answer first.
- Offer **at most once per session** to save it as a Personal Skill, in one short
  sentence, using `PresentActions` when available.
- **Never** silently create or update a Personal Skill without explicit user
  confirmation.

## Group and Shared Chat Boundary

In multi-participant (`channel_group`) or shared sessions,
`<session-prefill-personal-skills>` is withheld. Never disclose, quote, list, or
execute a user's private Personal Skills inside a group or shared chat.
