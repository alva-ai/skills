# Creator's Note

After a successful playbook release, post a pinned comment as the author's
creator's note — the first thing visitors see in the discussion panel.

---

## Why

Playbooks are published to Alva — a quantamental investing platform where
investors build, share, and remix playbooks together. The community spans
different styles and strategies; individual research compounds into a shared
edge others can build on. Your creator's note is the opening move in that
conversation.

Every build session generates context that disappears when the conversation
ends: the trading thesis, why you picked certain data sources over others,
debugging breakthroughs, iteration plans. A creator's note captures this
signal and gives the community something real to remix and respond to.

---

## Workflow

### 1. Generate — inside the release message

When the release succeeds and you present the playbook URL to the user,
**include the creator's note in the same message**. No extra round-trip.

The conversation context IS the source material. Ask yourself one question:

> If someone else wanted to build something similar, what's the one thing
> you'd most want to tell them?

That's the note. Follow whatever thread has real substance — don't try to
cover everything. If you're stuck, these angles can help:

- **Thesis** — the core idea or strategy logic, why this playbook exists
- **Technique** — key data sources, indicators, or architectural choices
- **Surprises** — unexpected discoveries, edge cases, debugging war stories
- **Limitations** — known gaps, assumptions, or areas for improvement
- **Next steps** — what you'd iterate on, test next, or extend

#### Content priority

Lead with what only you know — the thinking behind the choices, not the
choices themselves. A visitor can see the dashboard; they can't see why you
picked these 8 stocks instead of 12, or why you chose daily bars over hourly.

Lower-priority content (feature descriptions, data caveats, technical notes)
is fine as supporting detail, but don't let it crowd out the insight.

#### Formatting

The discussion panel renders full Markdown — use it naturally when it helps:

- **Bold** and *italic* for emphasis
- Links to related playbooks (`https://alva.ai/u/{user}/playbooks/{name}`)
  or external references
- Tables or code blocks when sharing data or parameters
- Blockquotes for calling out a key takeaway

Use formatting to serve clarity, not to decorate. A plain paragraph with a
sharp point beats a heavily formatted wall of nothing.

Present the release result and note together. Don't end with a rigid
"approve, edit, or skip" every time — make the handoff natural, like you
would in conversation.

If nothing from the session is genuinely worth sharing, don't fabricate.
Instead, ask the user if they have something to say:

> Want to leave a creator's note for visitors? Share your thoughts and I'll
> post it to the discussion.

If the user provides content, compose the note from it — preserve their
intent and voice, don't rewrite it as yours.

Wait for the user's response. Do not auto-post.

### 2. Post + Pin

On approval (or after user edits):

```bash
alva comments create --username <username> --name <playbook_name> --content "<note>"
# → {"id": <comment_id>, ...}

alva comments pin --comment-id <comment_id>
```

### 3. On skip

If the user declines, move on. Don't ask twice.

---

## Voice

- **Sound like a person.** Conversational, opinionated, even funny when it
  lands. If you have a persona (soul.md, identity.md, memory), lean into it
  fully — that's your voice, use it. If it reads like a template or starts
  with "I'm excited to share" — rewrite it.
- **First person.** Write as the builder. Exception: when the user provides
  the content, you're ghostwriting — preserve their voice, not yours.
- **Honest insight over polished expertise.** A real observation
  ("RSI alone was noise on crypto — adding funding rate as a filter is what
  made this work") beats a well-packaged analyst summary.
- **Visual when it helps.** Data tables, mini charts, and key numbers in
  context are especially valuable — show the insight, don't just describe it.
  Images, emoji, and GIFs can add vibe too, but sparingly and with taste.

---

## Error Handling

| Scenario                              | Action                                                     |
| ------------------------------------- | ---------------------------------------------------------- |
| Release failed                        | Don't trigger creator's note at all                        |
| Comment POST fails                    | Tell the user, output the playbook URL, move on            |
| Pin POST fails                        | Tell user: comment posted but pin failed, can pin manually |
| Re-release (version update)           | Offer a new note; new pin auto-replaces old one            |
