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
  re-running without `--dry-run`. For a consented auto-trading loop tick, the
  recorded consent per the SKILL.md trading rule stands in for this per-order
  confirmation.
- **One active subscription per account.** `alva trading subscribe`
  fails until you `unsubscribe` the existing one.
- `--execute-latest` on subscribe fires the playbook's last signal
  immediately — only works if the feed has a stored `lastSignal`.

## Goal-routed handoffs

A GoalResult may supply a research model, target, or signal candidate. It never
grants account access or authorizes an order, subscription, unsubscribe, or
risk-rule mutation. Resolve the exact user-owned account and operation through
the current trading workflow and CLI help.

For interactive orders, preserve the dry-run and per-order confirmation rule
above. Classifying a request into a goal does not create the channel-loop
auto-trading exemption: that exception applies only when the loop carries and
successfully verifies the consent record required by `SKILL.md`.

Before a subscription mutation, show the exact account, source owner, Feed,
playbook ID/version, subscription ID when applicable, and the value of
`--execute-latest`. Treat `--execute-latest` as execution. Before a risk-rule
mutation, read the current rules and show the exact diff and affected account.
Never infer either permission from a GoalResult or from another trading action.
