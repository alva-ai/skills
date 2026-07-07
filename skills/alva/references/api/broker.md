# Broker — agentic order execution (extras not in describe)

Run `alva broker describe` first for the live command grammar and the
per-venue capability matrix (`venues[]`). This file covers only the judgment
`describe` cannot: the three-way result model, retry discipline, and venue
quirks. `describe` is always authoritative for *what commands/venues exist*;
this file is *how to use them safely*.

## Start here: `alva broker accounts`

Run `alva broker accounts` first — it lists the caller's connected accounts
(`id`, `venue`, `paper`, `readOnly`, `name`). Every per-account command needs an
`--account <id>` from here; this is where you discover them.

## Mental model

Venue-native in, one neutral envelope out. Three command families:

- **Account-domain reads** (trex's own data, no `--venue`): `accounts` (and,
  as they land, portfolio / equity-history / risk-rules).
- **Venue reads** (venue-native raw JSON, need `--venue`): `balance`,
  `positions`, `order get/list`, `quote`, `ohlcv`, `funding-rate`, `raw`.
- **Writes** (`order place`, `order cancel`) → a minimal neutral spine:
  `status`, `reason`, `filled`, `price`, ids, `ts` (full venue payload in `raw`).

## The three-way result — the rule that prevents double orders

Every write lands in exactly one of three, encoded in the exit code:

| Exit | `status` | Meaning | Next safe action |
| ---- | -------- | ------- | ---------------- |
| 0 | `filled` `partial` `open` `canceled` `expired` | Done (terminal or resting) | Nothing / poll |
| 1 | `rejected` | Definitively **never placed** | Fix the args, submit a **new** intent |
| 2 | `error` | Outcome **UNKNOWN** (transport/venue failure) | Retry the **SAME** intent-id, or poll — **never re-place** |

Mistaking `error` (2) for `rejected` (1) is a double fill. Never re-place after
an `error`.

## Idempotency & retry discipline

- A live `order place` **requires `--intent-id`**. Mint it **once**, before the
  first attempt (a UUID). It is your only safe retry handle.
- On `error`/exit 2: retry with the **same** `--intent-id` — it replays the
  prior outcome or returns `duplicate_in_flight` (poll, don't re-place).
- On `rejected`/exit 1: the order never placed; a fresh intent is safe.
- Poll a pending order with `order get --intent-id <id>` (or `--id`).

## Always dry-run first

`order place ... --dry-run` runs the full admission gate (ownership, price
collar ~12%, daily budget/velocity/open-order limits) and returns
`admitted:true` + the deterministic `clientOrderId` **without placing**.
Confirm, then re-run without `--dry-run`.

## Capabilities are per-venue — read them from describe

`describe` → `venues[]` gives `createOrder / options / testnet / noCoidLookup /
markets` per venue. Do not assume; check. Notably:

| Venue | Assets | Paper (`testnet`) | Idempotency | Notes |
| ----- | ------ | ----------------- | ----------- | ----- |
| `alpaca` | US equities + crypto + options | yes | coid wired | |
| `robinhood` | US equities (long only) | **no** | **`noCoidLookup`** | a paper-provisioned account is rejected; a lost order id can't be reconciled — treat writes conservatively |
| `binance` `okx` `bybit` `gate` `bitget` `coinbase` `hyperliquid` | crypto | per venue testnet | coid wired | ccxt-served |

## Symbols, account, paper

- **Symbols are venue-native** — pass what the venue expects: ccxt unified
  (`BTC/USDT` spot, `BTC/USDT:USDT` perp), alpaca/robinhood plain tickers
  (`AAPL`). Reads pass through, so use the venue's own symbol format.
- `--account <trex account id>` (from `alva trading accounts`).
- **Paper vs live is set by the account, not a flag** — there is no `--paper`;
  the server uses the account's mode and authority-checks it.

## Venue-native params & raw

Anything the venue supports beyond the spine flags goes through repeatable
`--param key=value` (passed to the venue untouched). `alva broker raw --venue
<v> --method <m> --params <json>` is the read-only escape hatch for
venue-specific endpoints.
