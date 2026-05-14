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
| `alpaca`       | US Equities | `XNAS_SPOT_AAPL_USD`             |

## `--signal` JSON schema for `alva trading execute`

The CLI help example shows `{symbol, side, qty}` — that is **not** the
accepted schema. `--signal` takes an array of signal objects with one of
two `instruction.type` values:

- **`allocate`** — target portfolio weights. `weight: 0` closes the
  position; `weight: 0.5` sets it to 50% of equity.
- **`predict`** — prediction market orders (Polymarket only).

```bash
# Allocate 10% to BTC perp on a binance account (dry run)
alva trading execute \
  --account-id <id> \
  --signal '[{"date":1735689600,"instruction":{"type":"allocate","weights":[{"symbol":"BINANCE_PERP_BTC_USDT","weight":0.1}]}}]' \
  --dry-run
```

`date` is **epoch seconds**, not milliseconds.

## Operational rules

- **Always dry-run first.** Show simulated orders and confirm before
  re-running without `--dry-run`.
- **One active subscription per account.** `alva trading subscribe`
  fails until you `unsubscribe` the existing one.
- `--execute-latest` on subscribe fires the playbook's last signal
  immediately — only works if the feed has a stored `lastSignal`.
