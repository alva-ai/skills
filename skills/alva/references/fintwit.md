# Fintwit Intelligence

A curated, read-only intelligence layer over Alva's financial-Twitter accounts
("fintwit", also called KOLs). Each account's tweets are parsed into two parallel
streams — qualitative **market views / theses** and quantitative **backtested
signals** — plus an identity **profile**. The corpus is queryable along three
axes: **by account**, **by ticker**, and **by ranking**.

This is the data behind Alva's public fintwit/KOL leaderboard playbooks. When a
user asks about top fintwit/KOL traders, a leaderboard ranking, whether an
X/Twitter handle is tracked, what an account thinks about a ticker or theme, or an
account's track record — read it here and answer from real data.

**Not raw tweet search.** For "what is @X tweeting right now" with no
curation/scoring, use Content Search (`getTwitterFeed`, see [search.md](search.md)).
Fintwit Intelligence returns *processed* records: classified signals, extracted
theses, backtested performance, computed rankings.

## Access

- **Host user is `zet`.** All paths are public-read under `/alva/home/zet/...`.
  Use **absolute paths** — never `~/` (that resolves to the querying user's home).
- Read in chat with `alva fs read --path '/alva/home/zet/...'` (no auth needed —
  data is granted `special:user:*`); from playbook HTML use
  `fetch("$ALVA_ENDPOINT/api/v1/fs/read?path=" + encodeURIComponent(absPath))`.
- Reads return a JSON array of flat records. Tabular outputs share one timestamp,
  so `@last/1` returns the whole current batch (the search index returns every
  tracked account; a leaderboard board returns its full ranked set).
- **Read `@last/1` to see current fields.** Schemas are richer than the hints
  below and evolve over time — inspect a live record, do not hardcode field lists.
- **Cite the snapshot timestamp** in answers (`rank_snapshot_at_iso`,
  `summary_updated_at_iso`, or `generated_at_iso` depending on the output).

## Axis 1 — Directory / Search (entry point)

Feed `alva-kol-search-index`:
```
/alva/home/zet/feeds/alva-kol-search-index/v1/data/search/index/@last/1
```
One read → every tracked account. Each row has `handle` (lowercase),
`display_name`, `playbook_url`, `feed_slug`, `signal_count`. Filter by `handle`
in code.

**Navigational spine:** `handle` → its `feed_slug` (from this index) → the
per-account dossier at `/alva/home/zet/feeds/<feed_slug>/v1/data/...`.

## Axis 2 — Leaderboard (ranking)

Feed `alva-kol-leaderboard`; rankings refresh weekly.

Overview / corpus stats (live account counts, top handle per metric,
`rank_snapshot_at_iso`):
```
/alva/home/zet/feeds/alva-kol-leaderboard/v1/data/leaderboard/summary/@last/1
```

A ranked board:
```
/alva/home/zet/feeds/alva-kol-leaderboard/v1/data/leaderboard/<key>/@last/1
```

**Board key grammar.** These keys are **not discoverable by listing** (synth-mount
outputs — `readdir` won't show them), so build the key from this grammar:
`<metric>_<horizon>_<window>_s<signalMin>`

| Segment | Values |
| --- | --- |
| `metric` | `win` (win rate), `roi`, `bestcall` |
| `horizon` | `h14`, `h60`, `h180`, `all` (hold 14 / 60 / 180 days / until now) |
| `window` | `w30`, `w90`, `w180`, `all` (calls from past 30 / 90 / 180 days / lifetime) |
| `signalMin` | `5`, `10`, `50` (minimum signals to qualify) |

**Default when the user doesn't specify:** `roi_all_all_s10`. State the
metric/horizon/window you used so the ranking is reproducible. Each row identifies
the account (`handle`, `feed_slug`, `playbook_url`, `rank`) and carries the ranked
`metric_value` plus identity and qualitative context; read `@last/1` for the
current field set.

## Axis 3 — Ticker lens

Feed `kol-ticker-sentiment` flips the view from account to ticker:
```
/alva/home/zet/feeds/kol-ticker-sentiment/v1/data/sentiment/tickers/@last/1
```
Each ticker row carries bull / bear / risk account and signal counts across
`7d / 30d / 90d / all`, `current_price`, `top_kols_json`, and two follow-on paths:
**`debate_path`** and **`signal_path`**. For "what do accounts think about
$TICKER", "who's bullish on $X", or "most-discussed tickers": read this, find the
ticker, then follow its embedded `debate_path` / `signal_path` — do not hand-build
the per-ticker key.

## Per-account dossier

Substitute the account's `feed_slug` into
`/alva/home/zet/feeds/<feed_slug>/v1/data/<output>`:

| Output | Layer | Holds |
| --- | --- | --- |
| `directory/summary`, `info/profile` | Identity | bio, archetype, style, focus, asset class, benchmark, "Alva's take", lifetime win rates, best calls — the one-shot account card |
| `tweets/views` | Market views | extracted finance views/theses (categorized, stance, bilingual summary + thesis) — qualitative commentary, not only trade calls |
| `signals/raw`, `quality/live_signals`, `quality/live_mentions` | Signals | classified calls (ticker, direction, intent, tradeability, current stance) |
| `portfolio/summary`, `portfolio/equity`, `portfolio/trades` | Performance | per-profile stats (win rate, ROI, Sharpe, alpha vs SPY), equity curve, trade log |
| `tweets/raw` | Raw tweets | every ingested tweet + engagement |

`directory/summary` is the richest single card for "who is this account / how good
are they". Use `tweets/views` for "what does X think about <theme/ticker>".

## Production boundary

Only the feeds above are public and fresh. Not public today — do not read or cite
them (future work pending a public grant): `fintwit-alpha-radar`,
`fintwit-alpha-leaderboard-current`, `leaderboard-daily-digest`.

## Legitimacy & freshness

1. **Read at runtime; never fabricate.** Rankings, win rates, prices, and counts
   must come from a live read of the paths above — not memory, web search, or LLM
   output.
2. **Cite the snapshot date** (leaderboard is up to a week old; check the row's
   ISO field).
3. **Views are extracted opinions, not facts.** Attribute them ("@X argues …") and
   keep them separate from platform claims.
4. **Read-only.** This data source is read-only; it does not authorize reading any
   other user's feeds, and does not apply when building or remixing playbooks
   (those still build their own self-contained feeds — see Feed Scope Isolation in
   [content-legitimacy.md](content-legitimacy.md)).
