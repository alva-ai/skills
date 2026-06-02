# Feedback — agent-discovered Alva issues

Run `alva feedback --help` first; it is the command contract. This file only
adds the guardrails the CLI cannot enforce.

## Trigger

Use feedback only for likely Alva platform issues that blocked the task, such
as API/runtime failures, bad Alva data, docs gaps, auth problems, or confusing
product behavior. Do not use it for user preferences, non-blocking feature
ideas, or bugs in local code you wrote.

## Required confirmation

When you discover a likely Alva issue yourself, ask in English and in the
Alva voice whether the user wants you to send feedback to Alva. Do not quote a
fixed script; make the message brief, specific to the problem, and clear that
the user controls whether anything is submitted.

Submit only after the user clearly agrees. If they decline or ignore the prompt,
continue the task without submitting.

Never include API keys, bearer tokens, cookies, private user data, raw
portfolio holdings, or full proprietary source files. The server also redacts
obvious secrets, but you must scrub before sending.
