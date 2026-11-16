# Trading — extras not in CLI help

Run `alva trading --help` first for subcommands, flags, and examples.
This file covers only details the help text omits.

## Exchange ↔ symbol naming

No suffix on `exchange` = perpetuals, `_spot` = spot. Symbols mirror the
exchange field. Mismatching symbol type to account exchange errors.

| `exchange`     | Market      | Symbol format                    |
| -------------- | ----------- | -------------------------------- |
| `binance`      | Perp        | `BINANCE_PERP_BTC_USDT`          |
| `binance_spot` | Spot        | `BINANCE_SPOT_BTC_USDT`          |
| `okx`          | Unified     | `OKX_PERP_*` / `OKX_SPOT_*`      |
| `hyperliquid`  | Unified     | `HYPERLIQUID_PERP_*` / `_SPOT_*` |
| `alpaca`       | US Equities | `US_SPOT_AAPL_USD`               |

Symbols are canonical Arrays identities, not exchange aliases. Resolve them
with `alva trading-pairs search` and then verify the selected complete pair
with `alva trading-pairs resolve --pair <tradingPair> --json`. Use the returned
`tradingPair` unchanged;
`XNAS_SPOT_AAPL_USD`, `US_ETF_SPY_USD`, lowercase variants, and
`BINANCE_FUTURES_BTC_USDT` are invalid inputs.

## `--signal` JSON schema for `alva trading execute`

The CLI help example shows `{symbol, side, qty}` — that is **not** the
accepted schema. `--signal` takes one signal object. An array is accepted,
but only its **last** element executes. `instruction.type` is one of:

- **`allocate`** — target portfolio weights. `weight: 0` closes the
  position; `weight: 0.5` sets it to 50% of equity.
- **`order`** / **`orders`** — explicit market orders: `orders[]` of
  `{symbol, side: "buy"|"sell", amount: {type, value}}`.
- **`predict`** — prediction market orders (Polymarket only).

```bash
# Allocate 10% to BTC perp on a binance account (dry run)
alva trading execute \
  --account-id <id> \
  --signal '{"date":1735689600000,"instruction":{"type":"allocate","weights":[{"symbol":"BINANCE_PERP_BTC_USDT","weight":0.1}]}}' \
  --dry-run
```

`date` is **Unix milliseconds**, the same unit Feed records use. A live
signal whose `date` is not newer than the account's last processed signal is
skipped silently, so a seconds value after a milliseconds one never executes.

## Operational rules

- **Always dry-run first.** Show simulated orders and confirm before
  re-running without `--dry-run`. For a consented auto-trading Schedule
  occurrence or legacy Channel Loop tick, recorded consent per the [Agent Schedule](../agent-schedules.md#auto-trading-consent)
  rule stands in for this per-order confirmation.
- **One active subscription per account.** `alva trading subscribe`
  fails until you `unsubscribe` the existing one.
- `--execute-latest` on subscribe fires the playbook's last signal
  immediately — only works if the feed has a stored `lastSignal`. It
  executes **live, without a dry run**, and an execution error is only
  logged, not returned. Before using it, dry-run that signal with
  `alva trading execute --dry-run` and get the per-order confirmation.
- **Subscribing a live account bypasses per-order confirmation** — every
  later signal trades automatically. Default to a paper account; subscribe a
  live account only with the user's explicit consent to auto-trade it.
