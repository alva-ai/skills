# SDK

Browse the 250+ SDK modules available in the runtime — covering
crypto/equity/ETF market data (OHLCV, fundamentals, on-chain metrics), 60+
technical indicators (SMA, RSI, MACD, Bollinger Bands…), macro & economic series
(GDP, CPI, Treasury yields), and alternative data (news, social sentiment,
DeFi).

## Get SDK Doc

```
alva sdk doc --name <module_name>
```

| Parameter | Type   | Required | Description                                           |
| --------- | ------ | -------- | ----------------------------------------------------- |
| name      | string | yes      | Full module name (e.g. `@arrays/crypto/ohlcv:v1.0.0`) |

```
alva sdk doc --name "@arrays/crypto/ohlcv:v1.0.0"
→ {"name":"@arrays/crypto/ohlcv:v1.0.0","doc":"..."}
```

## List SDK Partitions

```
alva sdk partitions
```

```
alva sdk partitions
→ {"partitions":["spot_market_price_and_volume","crypto_onchain_and_derivatives",...]}
```

## Get Partition Summary

```
alva sdk partition-summary --partition <partition>
```

| Parameter | Type   | Required | Description    |
| --------- | ------ | -------- | -------------- |
| partition | string | yes      | Partition name |

```
alva sdk partition-summary --partition spot_market_price_and_volume
→ {"summary":"@arrays/crypto/ohlcv:v1.0.0 — Spot OHLCV for crypto\n@arrays/data/stock/ohlcv:v1.0.0 — Spot OHLCV for equities\n..."}
```
