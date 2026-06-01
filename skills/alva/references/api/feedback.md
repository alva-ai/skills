# Feedback — agent-discovered Alva issues

Run `alva feedback --help` first. This file covers the behavior guardrails the
CLI help cannot enforce.

## Trigger

Use feedback only for likely Alva platform issues: API/runtime failures,
missing or wrong Alva data, confusing docs, auth problems, or product behavior
that blocked the task. Do not use it for user preferences, feature ideas that
did not block the task, or bugs in local code you wrote.

## Required confirmation

When you discover a likely Alva issue yourself, ask exactly:

> 哇，你遇到问题了，看起来好像Alva有些不太对的地方，要不要我们直接帮你反馈给Alva？

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
- `dedupe_key`: stable per-user key for repeated reports from the same failure
  shape, such as `runtime/<command>/<error_code>`.

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
  --context-json '{"toolkit_version":"0.9.5","profile":"default"}' \
  --dedupe-key "runtime/run/internal-before-user-code"
```
