# Service Accounts (Restricted Run-As Identities)

Open this when a long-running UDF, cronjob, or automation should execute with a
**narrower identity than the owner's full account** — i.e. you want the script
to reach only an explicit set of files, not everything the user can touch.

## Mental Model

A **Service Account (SA)** is a restricted execution identity owned by a real
user (the **owner**). It has:

- **No login / no home of its own.** It only ever runs as the `run-as` identity
  of a UDF or cronjob.
- **Exactly the access you grant it** — specific ALFS paths, nothing else. It
  does **not** inherit the owner's files.

The key split:

| Dimension | Whose identity | Notes |
| --- | --- | --- |
| File access (ALFS), secrets, `env.userId` | **the SA** | only the paths explicitly granted |
| Billing, credits, audit, `~` / `env.username` / home | **the owner / caller** | unchanged — the real user always pays and is attributed |

So a UDF "run as SA" reads/writes only the SA's granted paths, but the run is
still billed and audited to the owner. This is **opt-in**: a UDF/cronjob with no
`run-as` set runs as the owner exactly as before.

Why use it: a scheduled job or shared UDF that only needs one feed's data should
not run with the power to read every file in your account. Scoping it to an SA
limits the blast radius if the script is buggy or the logic is reused widely.

## Workflow

```
1. Create an SA (once)            → alva service-account create
2. Grant it the paths it needs    → alva service-account grant ...
3. Register/deploy with run-as    → alva service register ... --run-as-service-account <sa-id>
                                     alva deploy create   ... --run-as-service-account <sa-id>
4. (later) revoke / delete        → alva service-account revoke / delete
```

The SA must be granted **the entry script path itself** plus any data
directories the script reads or writes — otherwise the run fails closed with a
permission error (see Troubleshooting).

## CLI

All SA management uses `alva service-account <subcommand>`. Only the owner (a
real user) can manage SAs; an SA cannot manage SAs, mint keys, or own a
cronjob/UDF.

### Create

```bash
alva service-account create --name "fintwit-bot"
# { "service_account": { "id": 90123, "display_name": "fintwit-bot", ... } }
```

`--name` is the human-readable label (SAs have no username, so this is the only
way to tell them apart). Note the returned `id` — you need it for grants and
run-as.

### List

```bash
alva service-account list
```

### Grant an ALFS path

```bash
alva service-account grant --id 90123 \
  --path '~/feeds/fintwit-alpha/v1/src/index.js' --permission read
alva service-account grant --id 90123 \
  --path '~/feeds/fintwit-alpha/v1/' --permission read
```

`--permission` is one of `read`, `write`, `import`. Grant the **entry script**
(`read` + the loader needs `import`) and the data dirs the script touches.

### Revoke a path

```bash
alva service-account revoke --id 90123 --path '~/feeds/fintwit-alpha/v1/' --permission read
```

### Delete

```bash
alva service-account delete --id 90123
```

Deleting an SA revokes its keys. Any cronjob/UDF still pointing at it will
**fail closed** on its next run (it will NOT silently fall back to the owner) —
clear `run-as` on those first (see below) or recreate them.

## Setting run-as on a UDF / cronjob

```bash
# UDF: run invocations under the SA
alva service register --name myfn --path '~/feeds/x/v1/src/fn.js' \
  --run-as-service-account 90123

# Cronjob: run the scheduled job under the SA
alva deploy create --name x-update --path '~/feeds/x/v1/src/index.js' \
  --cron "0 */4 * * *" --run-as-service-account 90123
```

- The SA must be **owned by you** and **granted the entry script path** (UDF
  registration auto-grants the entry script; a cronjob does **not** — grant it
  yourself first).
- To return a cronjob to run-as-owner later, update it with
  `--run-as-service-account 0` (clears it).
- Billing/credits for these runs still go to **you** (consumer-pays UDFs bill
  the caller; cronjobs bill the owner) — the SA never pays.

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| UDF/cronjob run fails with a permission / `ErrPermission` error | the SA isn't granted a path the script reads/writes (commonly the entry script or a data dir) | `alva service-account grant` the missing path, then re-run |
| Cronjob suddenly fails every run after you deleted an SA | run-as points at a deleted SA → fail-closed | update the cronjob `--run-as-service-account 0` (run as owner) or point it at a live SA |
| Script can't read `~/other-project/...` even though you (owner) can | SA only has the paths you granted; owner access does **not** carry over | grant that path to the SA, or don't run-as if the job legitimately needs full access |
| Billing/credits look like they're charged to the SA | they aren't — billing always resolves to the owner/caller; an SA has no balance | (no action) |

## When NOT to use it

- One-off `alva run` during development — no SA needed; run as yourself.
- A job that genuinely needs broad access to your workspace — an SA would just
  mean granting it everything, with no benefit.
