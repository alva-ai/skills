# SDK

Browse the built-in runtime library modules — including 50+ technical
indicators (SMA, RSI, MACD, Bollinger Bands), crypto fundamentals, and
feed widgets.

> **Note:** Financial data APIs (crypto/equity/ETF market data, fundamentals,
> macro, on-chain metrics) are now served by the Arrays backend — see the
> Data Skills section in `SKILL.md`. The `alva sdk` commands only cover
> runtime library modules.

## Get Module Doc

```
alva sdk doc --name <module_name>
```

| Parameter | Type   | Required | Description                                                          |
| --------- | ------ | -------- | -------------------------------------------------------------------- |
| name      | string | yes      | Full module name (e.g. `@alva/technical-indicators/rsi:v1.0.0`)      |

```
alva sdk doc --name "@alva/technical-indicators/relative-strength-index-rsi:v1.0.0"
→ {"name":"@alva/technical-indicators/relative-strength-index-rsi:v1.0.0","doc":"..."}
```

## List Module Groups

```
alva sdk partitions
```

```
alva sdk partitions
→ {"partitions":["feed_widgets","technical_indicator_calculation_helpers","unified_search"]}
```

## Get Module Group Summary

```
alva sdk partition-summary --partition <partition>
```

| Parameter | Type   | Required | Description       |
| --------- | ------ | -------- | ----------------- |
| partition | string | yes      | Module group name |

```
alva sdk partition-summary --partition technical_indicator_calculation_helpers
→ {"summary":"@alva/technical-indicators/relative-strength-index-rsi:v1.0.0 — RSI\n@alva/technical-indicators/macd:v1.0.0 — MACD\n..."}
```
