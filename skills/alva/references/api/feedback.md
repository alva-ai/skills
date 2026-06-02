# Feedback — agent-discovered Alva issues

Run `alva feedback --help` first. This file covers the behavior guardrails the
CLI help cannot enforce.

## Trigger

Use feedback only for likely Alva platform issues: API/runtime failures,
missing or wrong Alva data, confusing docs, auth problems, or product behavior
that blocked the task. Do not use it for user preferences, feature ideas that
did not block the task, or bugs in local code you wrote.

## Required confirmation

When you discover a likely Alva issue yourself, ask in English and in the
Alva voice whether the user wants you to send feedback to Alva. Do not quote a
fixed script; make the message brief, specific to the problem, and clear that
the user controls whether anything is submitted.

Submit only after the user clearly agrees. If they decline or ignore the prompt,
continue the task without submitting.

## Payload

Keep the report small and actionable:

- `summary`: one sentence naming the failure.
- `details`: what the agent was doing, expected behavior, actual behavior, and
  the most relevant error text.
- `category`: `api_error`, `data_quality`, `docs`, `runtime`, `auth`,
  `billing`, or `other`.
- `severity`: `low`, `medium`, `high`, or `critical`.
- `evidence`: compact JSON with command, endpoint, status code, error code,
  correlation/request id, and sanitized snippets.
- `context`: compact JSON with CLI version, profile/environment, session or
  task id, and any non-secret repro notes.

Never include API keys, bearer tokens, cookies, private user data, raw
portfolio holdings, or full proprietary source files. The server also redacts
obvious secrets, but you must scrub before sending.

## Example

```bash
alva feedback submit \
  --summary "runtime command returned INTERNAL" \
  --category runtime \
  --severity high \
  --details "While running alva run for a BTC automation, the runtime returned INTERNAL before user code started." \
  --evidence-json '{"command":"alva run --entry-path ~/tasks/btc/src/index.js","error_code":"INTERNAL"}' \
  --context-json '{"toolkit_version":"0.11.0","profile":"default"}'
```
