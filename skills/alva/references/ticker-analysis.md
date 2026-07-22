# Ticker Analysis

Use this chapter for broad analysis of one named equity, such as "analyze MU"
or "what is the setup in META?" It is the default single-ticker research
method, not a separate artifact route. Narrow latest-price, single-metric, or
single-event questions can stay on their smaller Financial Analysis subroute.

## Answer Contract

Answer first. Do not make the user supply a thesis before receiving value. If
the user's time horizon would materially change the conclusion, give the
initial read and then offer an easy choice between the next catalyst and the
6-12 month thesis.

Assume the user can see the quote. Do not lead with the last price or the day's
move unless it is unusual or changes the setup. Start with whether the setup
looks buyable here, needs a pullback or confirmation, is extended, or has no
clean entry. This is a conditional market setup, not an unconditional trade
instruction.

Use price relationally: trend structure, key levels, breakout quality, relative
strength, volume, and volatility. State what would improve or break the setup,
including the level, event, or evidence that invalidates the current read.

Move naturally from setup into the company thesis, catalysts, and risks. Do not
emit mechanical source-by-source sections. Keep the answer compact and
human-sounding, follow [user-facing-prose.md](user-facing-prose.md), cite facts
inline, and state confidence where missing evidence matters.

## Required Research

Before answering a broad single-ticker question:

1. Review the relevant ticker in
   [WILF](https://alva.ai/u/eddiid/playbooks/wilf). Use WILF as the expectations
   baseline: identify what investors are waiting for, the live bull/bear
   tension, and the evidence that could change the thesis. If earnings or
   another material event is newer than the WILF snapshot, update the debate
   with fresh evidence. If WILF has no exact-ticker entry, record that coverage
   gap and continue; never substitute a sibling ticker's snapshot.
2. Read [company-anomaly.md](company-anomaly.md), then test exact-ticker Company
   Anomaly coverage. If covered, read the current anomaly state and the latest
   attribution joined to the active episode. Mention it only when it changes
   the setup; if attribution is uncertain, leave causality open. Missing
   coverage does not block the ordinary analysis.
3. Run the company-information sweep below. Select only recent developments
   with material positive or negative impact on the thesis. `keptByPipeline`
   means an item survived its source pipeline; it does not prove thesis
   materiality.
4. Make the live debate concrete when coverage exists. Look for one
   identifiable investor, operator, analyst, or industry expert whose view
   sharpens the thesis. Prefer the original post or source and explain why it
   matters. One clear voice is usually enough.
5. Use X/search to discover the live debate, but confirm company guidance,
   financial figures, and event facts with stronger evidence. Apply every
   matching [Complex Ask Router](request-routing.md#complex-ask-router) gate,
   including fundamentals, earnings, valuation, or news/social requirements.

Treat WILF, Company Anomaly, the company-information sweep, and other Alva data
as research inputs rather than output headings. Translate the synthesis into
plain market language without naming internal paths or producer feeds.

## Company-Information Sweep

Follow the current
[EVENTS_FEED_HOWTO](https://github.com/Space-ID/alva-data-feed/blob/main/portfolio-watch-anomaly/EVENTS_FEED_HOWTO.md).
Run a dedicated company-information feed for the ticker. Do not reuse or mutate
a production `*-portfolio-watch-anomaly` feed.

Run help-first preflight, identify `<owner>` from the current Alva identity,
ensure the Arrays token, and verify that the exact ticker's watch config exists
before executing the current watch-core entry point. If the config is missing,
do not borrow another ticker's config: continue with the remaining research,
state the sweep coverage gap, and lower confidence when it matters.

```bash
alva arrays token ensure

alva run --entry-path "~/feeds/_watch-core/v1/src/index.js" --args '{
  "driver": "daily",
  "configPath": "/alva/home/<owner>/library/watch-config/<ticker-slug>.json",
  "feedName": "<ticker-slug>-ticker-analysis-events",
  "ownerUsername": "<owner>"
}'
```

Read the complete latest persisted run and normalize it into a setup snapshot
plus thesis-relevant events:

```bash
alva fs read \
  --path "~/feeds/<ticker-slug>-ticker-analysis-events/v1/data/raw/records/@last/1" |
python3 -c '
import json, sys

payload = json.load(sys.stdin)
points = payload if isinstance(payload, list) else [payload]
rows = []

for point in points:
    if isinstance(point, dict) and isinstance(point.get("items"), list):
        for row in point["items"]:
            if isinstance(row, dict):
                row.setdefault("runAtMs", point.get("date"))
                rows.append(row)
    elif isinstance(point, dict):
        rows.append(point)

def kept(value):
    return value is True or str(value).lower() == "true"

def decode(value):
    if isinstance(value, (dict, list)):
        return value
    if not isinstance(value, str) or value.endswith("...<truncated>"):
        return None
    try:
        return json.loads(value)
    except (json.JSONDecodeError, TypeError):
        return None

def first(mapping, *keys):
    if not isinstance(mapping, dict):
        return None
    for key in keys:
        value = mapping.get(key)
        if value is not None and value != "":
            return value
    return None

event_types = {
    "market_news", "industry_news",
    "indexed_x", "industry_x",
    "analyst_target", "insider_form4", "congress_trade",
    "earnings_actual", "earnings_estimate",
    "earnings_guidance", "earnings_calendar",
    "peer_move", "soxx_flow", "brave_expansion",
    "macro_indicator", "macro_news", "dxi_index",
    "dram_contract", "dram_spot_snapshot",
    "nand_contract", "nand_spot_snapshot"
}

setup_types = {
    "1min:ETH", "1min:ETH:volume_median",
    "1min:current_volume", "intraday:summary",
    "self_market_metric", "price_anomaly", "volume_anomaly"
}

events = []
setup_rows = []

for row in rows:
    if not kept(row.get("keptByPipeline")):
        continue
    source_type = row.get("sourceType")
    if source_type not in event_types | setup_types:
        continue

    raw_json = row.get("rawJson")
    raw = decode(raw_json)
    key_fields = decode(row.get("keyFieldsJson"))
    item = {
        "sourceType": source_type,
        "title": row.get("title"),
        "summary": row.get("summary"),
        "url": row.get("url"),
        "sourceTimestampMs": row.get("sourceTimestampMs"),
        "runAtMs": row.get("runAtMs") or row.get("date"),
        "keyFields": key_fields,
        "raw": raw,
        "rawJsonTruncated": (
            isinstance(raw_json, str)
            and raw_json.endswith("...<truncated>")
        )
    }

    if source_type in {"indexed_x", "industry_x"}:
        item["x"] = {
            "authorName": first(raw, "display_name"),
            "authorHandle": (
                first(raw, "twitter_handle")
                or first(key_fields, "handle")
            ),
            "text": first(raw, "full_text") or row.get("summary"),
            "url": first(raw, "url") or row.get("url"),
            "publishedAt": first(raw, "published_at"),
            "contentType": (
                first(raw, "content_type")
                or first(key_fields, "contentType")
            ),
            "likes": first(raw, "like_count") or first(key_fields, "likes"),
            "reposts": (
                first(raw, "retweet_count")
                or first(key_fields, "reposts")
            ),
            "views": first(raw, "view_count") or first(key_fields, "views")
        }

    if source_type in setup_types:
        setup_rows.append(item)
    else:
        events.append(item)

events.sort(
    key=lambda row: int(row.get("sourceTimestampMs") or 0),
    reverse=True
)

def setup_value(source_type, many=False):
    matches = [row for row in setup_rows if row.get("sourceType") == source_type]
    values = [row.get("keyFields") or row.get("raw") for row in matches]
    return values if many else (values[0] if values else None)

market_metrics = {}
for row in setup_rows:
    if row.get("sourceType") != "self_market_metric":
        continue
    value = row.get("keyFields") or row.get("raw") or {}
    indicator = value.get("indicator")
    if indicator:
        market_metrics[indicator] = {
            "value": value.get("value"),
            "observedDate": value.get("observedDate")
        }

anomalies = []
for row in setup_rows:
    if row.get("sourceType") not in {"price_anomaly", "volume_anomaly"}:
        continue
    anomalies.append({
        "sourceType": row.get("sourceType"),
        "title": row.get("title"),
        "summary": row.get("summary"),
        "sourceTimestampMs": row.get("sourceTimestampMs"),
        "details": row.get("keyFields") or row.get("raw")
    })

run_at_ms = max(
    [int(row.get("runAtMs") or 0) for row in events + setup_rows],
    default=0
)

output = {
    "runAtMs": run_at_ms or None,
    "setupSnapshot": {
        "intraday": setup_value("intraday:summary"),
        "latestExtendedHoursBar": setup_value("1min:ETH"),
        "currentVolume": setup_value("1min:current_volume"),
        "volumeBaselines": setup_value("1min:ETH:volume_median", many=True),
        "marketMetrics": market_metrics,
        "anomalies": anomalies
    },
    "events": events
}

json.dump(output, sys.stdout, ensure_ascii=False, indent=2)
'
```

`@last/1` returns the complete latest persisted run, not one latest event. Check
`runAtMs` before relying on freshness. Start the setup read from `setupSnapshot`
and fetch extra bars or indicators only when they materially improve the answer.
Source types are configuration-dependent; absent optional lanes are missing
coverage, not zero evidence.

## Synthesis Order

Use this order as reasoning flow, not as mandatory visible headings:

1. Setup now: entry quality, trend, levels, relative strength, volume,
   volatility, and invalidation.
2. Expectations: what WILF says investors await and which bull/bear claim is
   under test.
3. Fresh evidence: earnings, guidance, estimates, material events, Company
   Anomaly context, and what changed after the expectation snapshot.
4. Thesis and catalysts: why the evidence changes or preserves the forward
   case, plus the next dated or observable catalyst.
5. Risks and confidence: strongest disconfirming evidence, missing coverage,
   and the condition that breaks the read.
6. Live voice: one relevant market participant when the original source adds
   information rather than decoration.

Do not pad the answer with every collected event, repeat the visible quote, or
force a causal story for an unattributed move. Use other Alva data when it
materially improves the read, and stop when the evidence no longer changes the
conclusion.
