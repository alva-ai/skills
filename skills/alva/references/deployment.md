# Automation Lifecycle

Use the Slim `alva automation` tree for both the scheduled producer and the
registered Automation. The CLI resolves the backing cronjob internally; do not
teach or use a separate deploy/job command tree.

## Lifecycle

1. Write the producer script to ALFS.
2. Test it with `alva run`.
3. Create the producer and register the Automation in one
   `alva automation create` call.
4. Inspect or update it by Automation id.
5. Use `automation runs` for history, status, and logs.

Cron executions use the same Jagent runtime as `alva run`.
`require("env").args` contains the Automation's serialized `--args` value.

Always run:

```bash
alva automation --help
```

before relying on flags or response fields.

## Create

`automation create` is one product operation over two durable records: it
creates the producer first, then registers the Automation and its release
metadata.

```bash
alva automation create \
  --name btc-ema \
  --path '~/feeds/btc-ema/v1/src/index.js' \
  --cron '0 */4 * * *' \
  --version 1.0.0 \
  --args '{"symbol":"BTC"}' \
  --description 'BTC EMA monitor' \
  --push-notify
```

Required flags:

| Flag | Meaning |
| ---- | ------- |
| `--name` | Automation and producer name. |
| `--path` | ALFS entry script. |
| `--cron` | Standard five-field cron expression. |
| `--version` | Initial semantic version. |

Important optional flags:

| Flag | Meaning |
| ---- | ------- |
| `--args` | JSON exposed through `require("env").args`. |
| `--description`, `--changelog` | Product release metadata. |
| `--agent-type alpi` | Marks an alpi Agent feed with owner-editable instructions. |
| `--push-notify` | Lets successful runs deliver declared alert outputs. |
| `--skip-auto-trigger` | Creates the owner alert binding but suppresses the default first run. |
| `--run-as-service-account` | Runs the producer under a restricted service account. |
| `--max-heap-size-mb`, `--execution-timeout-seconds` | Producer resource bounds. |

Creation normally adds an ACTIVE owner alert binding and triggers the producer
once. `--skip-auto-trigger` suppresses only that first run. It does not suppress
the binding. Do not trigger again merely to verify creation.

If producer creation succeeds but Automation registration fails, the CLI
reports the producer id and leaves it intact so an operator can reconcile the
partial state safely. Do not blindly rerun the whole command or assume the
registration did not reach the service.

For a new alert-capable Automation, pass `--push-notify` unless the user asks
otherwise. This enables publisher fanout; it does not subscribe arbitrary
viewers. New producers use `alertOutput(typeDoc)`. Keep `signal/targets` and
`notify/message` only for recognized legacy producers.

## Read And Update

```bash
alva automation list --limit 20
alva automation inspect --id <automation_id>
```

`inspect` returns the Automation identity and its backing `cronjob_id`. Treat
the Automation id as the user-facing handle; lifecycle and run commands resolve
the producer from it.

`update` accepts producer fields, product fields, or both:

```bash
alva automation update \
  --id <automation_id> \
  --cron '0 */2 * * *' \
  --args '{"symbol":"ETH"}' \
  --version 1.0.1 \
  --description 'ETH EMA monitor'
```

Producer fields include name, cron, args, push-notify, run-as identity, heap,
and execution timeout. Product fields include version, description, changelog,
and agent type. Use the separate `automation trigger` command for a live run.

When one call changes both records, the producer update happens first. A later
product-metadata failure reports both ids and the partial update; inspect before
retrying. ALFS source edits themselves are already live and do not require an
update command unless release metadata or producer configuration also changes.

## Pause, Resume, Trigger, Delete

```bash
alva automation pause --id <automation_id>
alva automation resume --id <automation_id>
alva automation trigger --id <automation_id>
alva automation delete --id <automation_id>
```

- `pause` pauses the producer before pausing product delivery.
- `resume` enables product delivery before resuming the producer.
- `trigger` is live, not a dry run. It can send notifications when publisher
  fanout and alert bindings are enabled. Use `alva run` for isolated testing.
- `delete` pauses the producer, deletes the Automation, then removes the
  producer. A partial failure reports the remaining paused producer id.

Do not delete an Automation with `alva fs remove`. Removing ALFS files does not
remove its product identity, quota use, ACL, or alert binding.

## Runs

All run commands take the Automation id:

```bash
alva automation runs list --id <automation_id> --first 20
alva automation runs status \
  --id <automation_id> \
  --workflow-run-id <workflow_run_id>
alva automation runs logs \
  --id <automation_id> \
  --run-id <run_id>
```

`trigger` returns a workflow run id before persistence is necessarily visible.
Poll `runs status` with a bounded deadline. `PENDING` is not proof of failure:
the row may not exist yet. Stop on terminal state or on the caller's deadline.

Use `runs logs` only after a run id exists. It returns the captured producer
stdout/stderr for debugging.

## Visibility

```bash
alva automation set-visibility \
  --id <automation_id> \
  --visibility public
```

Use this product operation instead of an ALFS grant. It keeps product access
and the inherited feed-data projection consistent.

## Cron Format

Standard five-field format: `minute hour day-of-month month day-of-week`.

| Expression | Schedule |
| ---------- | -------- |
| `* * * * *` | Every minute. |
| `*/5 * * * *` | Every five minutes. |
| `0 * * * *` | Hourly at minute zero. |
| `0 */4 * * *` | Every four hours. |
| `0 0 * * *` | Daily at midnight UTC. |
| `0 9 * * 1-5` | Weekdays at 09:00 UTC. |

The minimum interval is one minute.

## Complete Example

```bash
alva fs mkdir --path '~/feeds/btc-hourly/v1/src'
```

Write and test `index.js` through ALFS-native tools, then:

```bash
alva run --entry-path '~/feeds/btc-hourly/v1/src/index.js'

alva automation create \
  --name btc-hourly \
  --path '~/feeds/btc-hourly/v1/src/index.js' \
  --cron '0 */4 * * *' \
  --version 1.0.0 \
  --description 'Hourly BTC market data'

alva automation set-visibility \
  --id <automation_id_from_create> \
  --visibility public

alva automation inspect --id <automation_id_from_create>
alva automation runs list --id <automation_id_from_create>
```

For a hosted surface, continue with `alva playbooks draft`, write the HTML and
README to ALFS, run `alva playbooks lint`, capture
`alva playbooks screenshot`, and finish with
`alva playbooks release`.
