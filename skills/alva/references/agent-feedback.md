# Agent Feedback

Use this when the user asks the Alva Agent to send product feedback, bug
reports, data coverage gaps, broken-doc reports, or feature ideas to the Alva
team.

## Current send surface

Before claiming feedback can be sent, verify the current CLI surface:

```bash
alva --help
```

If the help output does not list a dedicated command for feedback, support,
contact, or team messages, the skill has no supported team-feedback send path.
Do not substitute nearby surfaces:

- `comments` posts public or threaded playbook comments.
- `notify/message` is feed alert content delivered to subscribed users or
  groups.
- `notification-history` and `notification-preferences` only inspect or manage a
  user's own notifications.
- `channel` manages group subscriptions.

Those are not an Alva team inbox. Do not use raw HTTP endpoints, Slack, email,
or private contact channels from inside the skill unless the user explicitly
provides that channel and asks you to use it.

## Workflow

1. Classify the request. Feedback to Alva team includes platform bugs, missing
   data coverage, confusing product behavior, broken Alva docs/skills, or
   feature requests. It is not a creator's note, playbook comment, alert setup,
   or group subscription.
2. Verify the send surface with `alva --help`. If a dedicated command exists,
   run that command's `--help` and follow it. Use the command only if the help
   clearly says it submits feedback or support messages to Alva.
3. If no send surface exists, prepare the feedback packet below and tell the
   user the current CLI cannot send it to the team yet. Do not say it was sent.
4. If a send surface exists, redact secrets and private financial details that
   are not needed for triage. Show a compact preview and ask for confirmation
   unless the user already gave exact content plus an explicit send request.
5. After sending, report success only when the command succeeds. Include any
   returned id, status, or URL. If sending fails, report the error and leave the
   packet ready to retry.

## Feedback packet

Use a compact, triage-ready shape:

```text
Summary:
Category: bug | feature_request | data_gap | docs_gap | product_confusion | other
Impact:
Steps to reproduce:
Expected:
Actual:
Evidence:
Environment:
Suggested owner:
User contact preference:
```

Keep it short. Link to relevant playbooks, feed names, CLI command output, or
screenshots when they are material, but avoid dumping logs unless the team needs
them. Never include API keys, JWTs, private keys, raw account tokens, or
unrequested portfolio details.

## Product implementation gap

Skill documentation alone cannot create delivery. A real agent-to-team feedback
feature needs the full user-facing chain: backend storage or routing, gateway
REST exposure, toolkit CLI support, then this skill's send workflow. Until that
chain exists, the skill can only verify the absence of a send path and prepare a
packet for another channel.
