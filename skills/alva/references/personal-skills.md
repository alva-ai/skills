# Personal skills

In the owner's private DM or Topic, the turn can include a list of personal
methods. When one matches the task, read its current instructions with
`alva fs read --path "~/skills/<slug>/SKILL.md"`. Read supporting text under
the same skill's `references/` directory as needed. Quote ALFS paths so the
gateway resolves the owner's home. In a group or shared conversation, keep
personal methods private and use the public Skillhub instead.

When the owner explicitly asks to save a method, write a UTF-8 Markdown file
to `~/skills/<slug>/SKILL.md`. Choose a lowercase slug using letters, digits
and hyphens. Begin the file with a short YAML header:

```yaml
---
name: earnings-review
description: Check cash conversion before comparing earnings multiples.
---
```

Keep instructions below the header and credentials out of the files. Read
existing files before editing and change only the files the owner requested.
Set `enabled: false` in the header to omit the method from automatic
discovery. Saving uses ordinary ALFS file operations.
