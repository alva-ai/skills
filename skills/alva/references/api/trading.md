# Trading — Signal and Broker execution

Run `alva trading --help` first. The Slim tree deliberately separates shared
execution controls from the two execution models:

```text
trading
├── accounts
├── risk-rules
├── signals
│   ├── subscriptions
│   │   ├── list
│   │   ├── subscribe
│   │   └── unsubscribe
│   └── execute
└── broker
```

`accounts` lists execution-capable TREX accounts. `risk-rules` is read-only and
shows the admission limits enforced for both Signal and Broker orders. Account
holdings, activity, order history, and equity history belong to the separate
`alva portfolio` tree.

## Legacy Signal surface

Signal is the legacy playbook/copy-trading workflow. Keep it under
`alva trading signals`; do not infer Signal semantics from Broker commands.

Symbols must match the account's exchange type. No suffix on `exchange` means
perpetuals and `_spot` means spot.

| `exchange`     | Market      | Symbol format                    |
| -------------- | ----------- | -------------------------------- |
| `binance`      | Perp        | `BINANCE_PERP_BTC_USDT`          |
| `binance_spot` | Spot        | `BINANCE_SPOT_BTC_USDT`          |
| `okx`          | Unified     | `OKX_PERP_*` / `OKX_SPOT_*`      |
| `hyperliquid`  | Unified     | `HYPERLIQUID_PERP_*` / `_SPOT_*` |
| `alpaca`       | US Equities | `XNAS_SPOT_AAPL_USD`             |

### Execute one Signal

`--signal` takes an array of signal objects. `date` is epoch seconds, not
milliseconds. Supported instruction types include `allocate` for target
portfolio weights and `predict` for prediction-market orders.

```bash
alva trading signals execute \
  --account-id <id> \
  --signal '[{"date":1735689600,"instruction":{"type":"allocate","weights":[{"symbol":"BINANCE_PERP_BTC_USDT","weight":0.1}]}}]'
```

Execution is dry-run by default. Show the simulated result and obtain the
required confirmation before repeating the exact command with `--live`. For a
consented auto-trading loop tick, the recorded consent defined by the main Skill
trading rule stands in for per-order confirmation.

### Subscriptions

Only one Signal subscription may be active per account. Unsubscribe the current
one before subscribing to another. Subscription creation never executes the
latest stored signal; use the explicit `signals execute` flow when execution is
intended.
