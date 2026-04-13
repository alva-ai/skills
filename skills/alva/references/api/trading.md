# Trading

Manage trading accounts, portfolios, orders, subscriptions, and risk rules.

## List Accounts

```bash
alva trading accounts
```

Returns all trading accounts for the authenticated user, with active subscriptions.

| Field         | Type     | Description                          |
| ------------- | -------- | ------------------------------------ |
| id            | string   | Account ID                           |
| name          | string   | Account display name                 |
| exchange      | string   | Exchange identifier (see below)      |
| paper         | boolean  | Whether this is a paper trading account |
| identifier    | string   | Exchange-specific account identifier |
| createdAtMs   | int      | Creation timestamp (epoch ms)        |
| subscriptions | array    | Active subscriptions on this account |

**Exchange naming convention:** No suffix = perpetual contracts, `_spot` suffix = spot trading.

| Exchange field  | Type         | Symbol format                  |
| --------------- | ------------ | ------------------------------ |
| `binance`       | Perp         | `BINANCE_PERP_BTC_USDT`       |
| `binance_spot`  | Spot         | `BINANCE_SPOT_BTC_USDT`       |
| `okx`           | Unified      | `OKX_PERP_*` or `OKX_SPOT_*`  |
| `hyperliquid`   | Unified      | `HYPERLIQUID_PERP_*` / `_SPOT_*` |
| `alpaca`        | US Equities  | `XNAS_SPOT_AAPL_USD`          |

Mismatching symbol type to account exchange (e.g. `BINANCE_SPOT_*` to a `binance` perp account) will error.

## Get Portfolio

```bash
alva trading portfolio --account-id <id>
```

| Field         | Type    | Description                       |
| ------------- | ------- | --------------------------------- |
| equity        | float   | Total equity                      |
| cash          | float   | Available cash                    |
| unrealizedPnl | float   | Unrealized P&L (optional)         |
| assets        | array   | Current positions                 |

Each asset:

| Field         | Type   | Description           |
| ------------- | ------ | --------------------- |
| symbol        | string | Instrument symbol     |
| side          | string | `long` or `short`     |
| quantity      | float  | Position size         |
| entryPrice    | float  | Average entry price   |
| currentPrice  | float  | Current market price  |
| marketValue   | float  | Current market value  |
| unrealizedPnl | float  | Unrealized P&L        |
| allocation    | float  | Portfolio allocation  |

## List Orders

```bash
alva trading orders --account-id <id> [--limit <n>] [--source <source>] [--since <timestamp>]
```

| Field          | Type    | Description                        |
| -------------- | ------- | ---------------------------------- |
| orderId        | string  | Order ID                           |
| symbol         | string  | Instrument symbol                  |
| side           | string  | `open_long`, `close_long`, etc.    |
| requestedQty   | float   | Requested quantity                 |
| filledQty      | float   | Filled quantity                    |
| price          | float   | Fill price                         |
| status         | string  | `filled`, `rejected`, etc.         |
| rejectReason   | string  | Rejection reason (if rejected)     |
| source         | string  | Signal source                      |
| sourcePlaybook | string  | Source playbook name               |
| dryRun         | boolean | Whether this was a dry run         |
| createdAtMs    | int     | Creation timestamp (epoch ms)      |

## List Subscriptions

```bash
alva trading subscriptions --account-id <id>
```

Returns active copy-trading subscriptions for an account.

## Execute Signal

```bash
alva trading execute --account-id <id> --signal '<json>' --dry-run
```

**Always dry-run first.** Show the simulated orders and confirm before running with real execution (omit `--dry-run`).

Signal JSON is an array of signal objects. Only two instruction types are supported:

- **`allocate`** — target portfolio weights. `weight: 0` = close position, `0.5` = 50% of equity.
- **`predict`** — prediction market orders (Polymarket only).

```bash
# Dry-run: allocate 10% to BTC
alva trading execute \
  --account-id <id> \
  --signal '[{"date":1735689600,"instruction":{"type":"allocate","weights":[{"symbol":"BINANCE_PERP_BTC_USDT","weight":0.1}]}}]' \
  --dry-run
```

The `date` field uses **epoch seconds** (not milliseconds).

## Subscribe / Unsubscribe

```bash
# Subscribe an account to a playbook feed
alva trading subscribe \
  --account-id <id> \
  --source-username <user> \
  --source-feed <feed> \
  --playbook-id <pid> \
  --playbook-version <ver> \
  [--execute-latest]

# Unsubscribe
alva trading unsubscribe --subscription-id <id>
```

- One account can only have **one active subscription** — unsubscribe first if needed.
- `--execute-latest` immediately executes the playbook's last signal after subscribing. Only works if the feed has a stored `lastSignal`.

## Risk Rules

```bash
# View current rules
alva trading risk-rules

# Update rules
alva trading update-risk-rules \
  --max-single-order-value 10000 --max-single-order-enabled true \
  --max-daily-turnover-value 50000 --max-daily-turnover-enabled true \
  --max-daily-orders-value 100 --max-daily-orders-enabled true
```

## Equity History

```bash
alva trading equity-history --account-id <id> [--timeframe 1d] [--since-ms <ms>] [--until-ms <ms>]
```

Returns equity curve time series (timestamp, equity, pnl, pnlPct).
