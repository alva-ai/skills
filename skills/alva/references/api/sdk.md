# SDK

Browse the 250+ SDK modules available in the runtime — covering
crypto/equity/ETF market data (OHLCV, fundamentals, on-chain metrics), 60+
technical indicators (SMA, RSI, MACD, Bollinger Bands…), macro & economic series
(GDP, CPI, Treasury yields), and alternative data (news, social sentiment,
DeFi). All endpoints are under `/api/v1/sdk/`.

## Get SDK Doc

```
GET /api/v1/sdk/doc?name={module_name}
```

| Parameter | Type   | Required | Description                                           |
| --------- | ------ | -------- | ----------------------------------------------------- |
| name      | string | yes      | Full module name (e.g. `@arrays/crypto/ohlcv:v1.0.0`) |

```
GET /api/v1/sdk/doc?name=@arrays/crypto/ohlcv:v1.0.0
→ {"name":"@arrays/crypto/ohlcv:v1.0.0","doc":"..."}
```

## List SDK Partitions

```
GET /api/v1/sdk/partitions
```

```
GET /api/v1/sdk/partitions
→ {"partitions":["spot_market_price_and_volume","crypto_onchain_and_derivatives",...]}
```

## Get Partition Summary

```
GET /api/v1/sdk/partitions/:partition/summary
```

| Parameter | Type   | Required | Description                                  |
| --------- | ------ | -------- | -------------------------------------------- |
| partition | string | yes      | Partition name (URL-encoded if contains `/`) |

```
GET /api/v1/sdk/partitions/spot_market_price_and_volume/summary
→ {"summary":"@arrays/crypto/ohlcv:v1.0.0 — Spot OHLCV for crypto\n@arrays/data/stock/ohlcv:v1.0.0 — Spot OHLCV for equities\n..."}
```
