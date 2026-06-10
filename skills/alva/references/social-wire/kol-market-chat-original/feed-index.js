const { Feed, feedPath, makeDoc, str, num } = require("@alva/feed");
const { ask } = require("@alva/alvaask");
const env = require("env");
const http = require("net/http");
const secret = require("secret-manager");

const FEED_NAME = "kol-market-chat";
const OWNER_DISPLAY_NAME = "Algostonk";
const AGENT_DISPLAY_NAME = "Algostonk Bot";
const SOURCE_USER = "zet";
const SOURCE_FEED = "alva-kol-leaderboard";
const SOURCE_PLAYBOOK_URL = "https://alva.ai/u/zet/playbooks/alva-kol-leaderboard";
const ARRAYS_BASE = "https://data-tools.prd.space.id";
const LOOKBACK_SECONDS = 36 * 60 * 60;
const WATCHLIST_REFRESH_MS = 24 * 60 * 60 * 1000;
const WATCHLIST_BATCH_SIZE = Number(env.args && env.args.batch_size || 16);
const MAX_WATCHLIST_HANDLES = 150;
const POST_DEDUP_RETENTION_MS = 14 * 24 * 60 * 60 * 1000;
const POST_DEDUP_MAX_IDS = 5000;
const AGENT_VERSION = "algostonk-bot-kol-wire-v9";

const CHANNELS = [
  { channel: "market-wire", name: "market-wire", description: "Cross-asset KOL market tape" },
  { channel: "ai-infra", name: "ai-infra", description: "AI compute, semis, memory, data centers" },
  { channel: "crypto", name: "crypto", description: "Crypto, miners, perps, token narratives" },
  { channel: "macro", name: "macro", description: "Rates, commodities, energy, liquidity" },
  { channel: "semis", name: "semis", description: "Chip supply chain and hardware leaders" },
];

const VOICE = `VOICE -- strict. The reader is a finance professional. Sound like a human
operator dropping the one thing worth reading in a busy market chat.

POSITIVE PATTERNS:
- Verbs over abstract nouns ("PANW crashed into the top-5", not
  "PANW's ranking improved").
- Short digest, not a report. One hook, one reason, one source trail.
- Make people want to click through to the source context.
- Use handles and tickers as anchors. Avoid generic "market is watching" filler.
- Dry over hype. "NVDA is still the room's center of gravity" beats padding.
- End by pointing to the source context or the KOL handles when useful.

BANNED OPENERS: Overall, At its core, For [audience], A key point is,
A notable claim is, The wrong question is, It is worth noting,
This marks a (pivotal/major/key) moment.

BANNED CONNECTORS: rather than, less about X (and) more about Y,
not just X but Y, both X and Y, while also.

BANNED VERBS: reinforces / reinforcing, reflects / reflecting,
underscores / underscoring, unlocks, serves as, continues to validate,
keeps alive, frames, highlights, emphasizes, symbolizes.

BANNED ADVERBS / INTENSIFIERS: decisively, firmly, sharply, notably,
importantly, ultimately, broadly, significantly.

BANNED HEDGES: may potentially, in order to, due to the fact that,
arguably, on balance, we believe.

BANNED SHAPES:
- Triplets of abstract nouns ("structures, platforms, and strategic
  choices").
- -ing analysis chains ("symbolizing X, reflecting Y, reinforcing Z").
- Header + body that paraphrases the header. If a label precedes a
  body sentence, the body must add a new fact, not restate the label.
- Em dashes.
- Four-or-more-way enumerations in a single sentence. If you need four
  items, use a list.`;

const feed = new Feed({ path: feedPath(FEED_NAME) });

feed.def("config", {
  channels: makeDoc("Owner Channels", "Predefined channel list for the KOL market chat", [
    str("channel"),
    str("name"),
    str("description"),
  ]),
});

feed.def("agent", {
	  kols: makeDoc("Top KOL Snapshot", "Top FinTwit leaderboard rows used by the market-chat agent", [
	    str("primary_board"),
	    num("best_rank"),
	    str("handle"),
	    str("display_name"),
	    num("metric_value"),
	    num("signal_count"),
	    num("best_roi_pct"),
	    str("best_roi_profile"),
	    str("best_call_ticker"),
	    num("best_call_return_pct"),
	    str("asset_class"),
	    str("focus"),
	    str("top_tickers_json"),
	    str("rank_tags_json"),
	    str("spotlight_i18n_json"),
	    str("playbook_url"),
	    str("snapshot_iso"),
	  ]),
	  posts: makeDoc("Watched KOL Posts", "Recent unpushed KOL posts considered by the wire agent", [
	    str("post_id"),
	    str("handle"),
	    str("display_name"),
	    str("published_at"),
	    str("text"),
	    str("url"),
	    str("tickers_json"),
	    num("kol_best_rank"),
	    str("rank_tags_json"),
	    str("source_status"),
	  ]),
	  tickers: makeDoc("Ticker Context", "Readable ticker-first context from recent top-KOL mentions", [
    str("ticker"),
    str("channel"),
    str("reason_en"),
    str("reason_cn"),
    str("reason_kr"),
    str("source_handles_json"),
    str("source_urls_json"),
    num("mention_score"),
    str("source_basis"),
    str("snapshot_iso"),
  ]),
});

feed.def("chat", {
  messages: makeDoc("Channel Messages", "Viewer and agent messages posted into predefined channels", [
    str("channel"),
    str("author_type"),
    str("author_name"),
    str("headline"),
    str("headline_i18n_json"),
    str("body"),
    str("body_i18n_json"),
    str("source_url"),
    str("source_handles_json"),
    str("tickers_json"),
    str("meta_json"),
  ]),
});

feed.def("notify", {
  message: makeDoc("Notification", "Push-ready Algostonk Bot notification body", [
    str("title"),
    str("title_i18n_json"),
    str("body"),
    str("body_i18n_json"),
    str("lang"),
    str("meta_json"),
  ]),
});

function query(params) {
  const out = [];
  Object.keys(params).forEach((key) => {
    const value = params[key];
    if (value === undefined || value === null || value === "") return;
    if (Array.isArray(value)) {
      value.forEach((item) => out.push(key + "=" + encodeURIComponent(String(item))));
    } else {
      out.push(key + "=" + encodeURIComponent(String(value)));
    }
  });
  return out.join("&");
}

async function fetchJson(url, headers) {
  const res = await http.fetch(url, { headers: headers || {} });
  if (!res || res.status < 200 || res.status >= 300) {
    const status = res && res.status ? res.status : "NO_RESPONSE";
    const text = res && res.text ? await res.text() : "";
    throw new Error("HTTP " + status + " for " + url + (text ? ": " + text.slice(0, 240) : ""));
  }
  const body = await res.text();
  return JSON.parse(body);
}

async function readAlfs(path) {
  const endpoint = env.endpoint || "https://api-llm.prd.alva.ai";
  const headers = env.apiKey ? { "X-Alva-Api-Key": env.apiKey } : {};
  return fetchJson(endpoint + "/api/v1/fs/read?path=" + encodeURIComponent(path), headers);
}

function sourcePath(series) {
  return "/alva/home/" + SOURCE_USER + "/feeds/" + SOURCE_FEED + "/v1/data/leaderboard/" + series + "/@last/1";
}

function compactTickerList(row) {
  try {
    return JSON.parse(row.top_tickers_json || "[]")
      .slice(0, 5)
      .map((item) => String(item.ticker || "").toUpperCase())
      .filter(Boolean);
  } catch (_) {
    return [];
  }
}

function safeNum(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatPct(value) {
  const n = safeNum(value);
  if (!n) return "0%";
  return (Math.round(n * 10) / 10).toString().replace(/\.0$/, "") + "%";
}

function uniqueTickers(values) {
  const seen = {};
  const out = [];
  values.forEach((value) => {
    const ticker = normalizeTicker(value);
    if (ticker && !seen[ticker]) {
      seen[ticker] = true;
      out.push(ticker);
    }
  });
  return out;
}

function extractCashtags(text) {
  const matches = String(text || "").match(/\$[A-Za-z][A-Za-z0-9.\-]{1,15}/g) || [];
  return uniqueTickers(matches.map((item) => item.slice(1)));
}

function compactKol(row, board) {
  const metricValue = safeNum(row.metric_value);
  const rank = Number(row.rank || 0);
  return {
	    board,
	    rank,
	    rank_key: String(row.rank_key || board + "_all_all_s10"),
	    metric: String(row.metric || board),
	    metric_label: String(row.metric_label || boardLabel(board)),
	    handle: String(row.handle || "").replace(/^@+/, ""),
	    display_name: String(row.display_name || row.handle || ""),
	    metric_value: metricValue,
	    signal_count: Number(row.metric_signal_count || row.signal_tweet_count || 0),
	    best_strategy_roi_pct: safeNum(row.best_strategy_roi_pct),
	    best_strategy_profile: String(row.best_strategy_profile || ""),
	    best_call_ticker: normalizeTicker(row.best_call_ticker || ""),
	    best_call_return_pct: safeNum(row.best_call_return_pct),
	    asset_class: String(row.asset_class || row.asset_type || ""),
	    primary_domain: String(row.primary_domain || ""),
	    style_tag: String(row.style_tag || row.analysis_style || ""),
	    focus: String(row.focus || row.primary_domain || ""),
	    note: String(row.note || ""),
	    top_tickers: compactTickerList(row),
	    playbook_url: String(row.playbook_url || ""),
	    snapshot_iso: String(row.rank_snapshot_at_iso || row.summary_updated_at_iso || row.updated_at_iso || row.next_rank_update_at_iso || ""),
	  };
}

async function loadLeaderboards() {
  const boards = [
    ["win", "win_all_all_s10"],
    ["roi", "roi_all_all_s10"],
    ["bestcall", "bestcall_all_all_s10"],
  ];
  const out = {};
	  for (const item of boards) {
	    const board = item[0];
	    const rows = await readAlfs(sourcePath(item[1]));
	    if (!Array.isArray(rows) || !rows.length) throw new Error("empty leaderboard series: " + item[1]);
	    out[board] = rows.slice(0, 50).map((row) => compactKol(row, board));
	  }
	  return out;
}

function metricPhrase(tag, lang) {
  if (!tag) return "";
  const locale = lang || "en";
  if (tag.board === "win") {
    if (locale === "cn") return "胜率 " + formatPct(tag.metric_value) + "（" + tag.signal_count + " 次喊单）";
    if (locale === "kr") return "승률 " + formatPct(tag.metric_value) + " (" + tag.signal_count + "회 콜)";
    return formatPct(tag.metric_value) + " win rate on " + tag.signal_count + " calls";
  }
  if (tag.board === "roi") {
    if (locale === "cn") return "ROI " + formatPct(tag.metric_value);
    if (locale === "kr") return "ROI " + formatPct(tag.metric_value);
    return formatPct(tag.metric_value) + " ROI";
  }
  if (tag.board === "bestcall") {
    if (tag.best_call_ticker) {
      if (locale === "cn") return "$" + tag.best_call_ticker + " 最佳喊单 " + formatPct(tag.best_call_return_pct);
      if (locale === "kr") return "$" + tag.best_call_ticker + " 베스트 콜 " + formatPct(tag.best_call_return_pct);
      return "$" + tag.best_call_ticker + " best call at " + formatPct(tag.best_call_return_pct);
    }
    if (locale === "cn") return "最佳喊单分 " + formatPct(tag.metric_value);
    if (locale === "kr") return "베스트 콜 점수 " + formatPct(tag.metric_value);
    return formatPct(tag.metric_value) + " best-call score";
  }
  return formatPct(tag.metric_value);
}

function roiPhrase(value, lang) {
  if (!value) return "";
  if (lang === "cn") return "最佳 ROI " + formatPct(value);
  if (lang === "kr") return "최고 ROI " + formatPct(value);
  return "best ROI " + formatPct(value);
}

function callPhrase(ticker, value, lang) {
  if (!ticker) return "";
  if (lang === "cn") return "最佳喊单 $" + ticker + " " + formatPct(value);
  if (lang === "kr") return "베스트 콜 $" + ticker + " " + formatPct(value);
  return "best call $" + ticker + " " + formatPct(value);
}

function boardRankTag(row) {
  return {
    board: row.board,
    rank: row.rank,
    rank_key: row.rank_key,
    metric: row.metric,
    metric_label: row.metric_label,
    metric_value: row.metric_value,
    signal_count: row.signal_count,
    best_strategy_roi_pct: row.best_strategy_roi_pct,
    best_strategy_profile: row.best_strategy_profile,
    best_call_ticker: row.best_call_ticker,
    best_call_return_pct: row.best_call_return_pct,
  };
}

function buildSpotlight(kol) {
  const primary = kol.rank_tags[0] || {};
  const handle = "@" + kol.handle;
  const topTickers = kol.top_tickers.slice(0, 3).map((t) => "$" + t).join(", ");
  const boardText = primary.rank ? "#" + primary.rank + " on the " + boardLabel(primary.board) : "Top-50 leaderboard KOL";
  const boardTextCn = primary.rank ? boardLabel(primary.board, "cn") + "第 " + primary.rank + " 名" : "Top 50 榜单 KOL";
  const boardTextKr = primary.rank ? boardLabel(primary.board, "kr") + " #" + primary.rank : "Top 50 리더보드 KOL";
  const metric = {
    en: metricPhrase(primary, "en"),
    cn: metricPhrase(primary, "cn"),
    kr: metricPhrase(primary, "kr"),
  };
  const roi = {
    en: roiPhrase(kol.best_roi_pct, "en"),
    cn: roiPhrase(kol.best_roi_pct, "cn"),
    kr: roiPhrase(kol.best_roi_pct, "kr"),
  };
  const call = {
    en: callPhrase(kol.best_call_ticker, kol.best_call_return_pct, "en"),
    cn: callPhrase(kol.best_call_ticker, kol.best_call_return_pct, "cn"),
    kr: callPhrase(kol.best_call_ticker, kol.best_call_return_pct, "kr"),
  };
  const edge = {
    en: [kol.asset_class || kol.focus, topTickers ? "watchlist: " + topTickers : "", roi.en || call.en].filter(Boolean).join("; "),
    cn: [kol.asset_class || kol.focus, topTickers ? "关注标的：" + topTickers : "", roi.cn || call.cn].filter(Boolean).join("；"),
    kr: [kol.asset_class || kol.focus, topTickers ? "관심 티커: " + topTickers : "", roi.kr || call.kr].filter(Boolean).join("; "),
  };

  if (kol.best_rank <= 10) {
    return {
      en: handle + " is " + boardText + (metric.en ? " (" + metric.en + ")" : "") + ".",
      cn: handle + " 是" + boardTextCn + (metric.cn ? "（" + metric.cn + "）" : "") + "。",
      kr: handle + "는 " + boardTextKr + (metric.kr ? " (" + metric.kr + ")" : "") + "입니다.",
    };
  }
  if (kol.best_rank > 25) {
    return {
      en: handle + " is a lower-board specialist; the hook is " + (edge.en || metric.en || "a focused KOL niche") + ".",
      cn: handle + " 不是头部排名，亮点是" + (edge.cn || metric.cn || "垂直 KOL 领域") + "。",
      kr: handle + "는 중하위권 스페셜리스트입니다. 포인트는 " + (edge.kr || metric.kr || "집중된 KOL 니치") + "입니다.",
    };
  }
  return {
    en: handle + " sits mid-board with " + (metric.en || roi.en || call.en || "repeatable leaderboard evidence") + ".",
    cn: handle + " 位于榜单中段，线索是" + (metric.cn || roi.cn || call.cn || "可复核的榜单记录") + "。",
    kr: handle + "는 중위권이며 포인트는 " + (metric.kr || roi.kr || call.kr || "반복 확인되는 리더보드 근거") + "입니다.",
  };
}

function buildKolWatchlist(boards) {
  const byHandle = {};
  ["win", "roi", "bestcall"].forEach((board) => {
    (boards[board] || []).forEach((row) => {
      if (!row.handle) return;
      if (!byHandle[row.handle]) {
        byHandle[row.handle] = {
          handle: row.handle,
          display_name: row.display_name,
          best_rank: row.rank || 999,
          primary_board: row.board,
          metric_value: row.metric_value,
          signal_count: row.signal_count,
          best_roi_pct: row.best_strategy_roi_pct,
          best_roi_profile: row.best_strategy_profile,
          best_call_ticker: row.best_call_ticker,
          best_call_return_pct: row.best_call_return_pct,
          asset_class: row.asset_class,
          primary_domain: row.primary_domain,
          style_tag: row.style_tag,
          focus: row.focus,
          note: row.note,
          top_tickers: [],
          playbook_url: row.playbook_url,
          snapshot_iso: row.snapshot_iso,
          rank_tags: [],
          top50_board_count: 0,
        };
      }
      const kol = byHandle[row.handle];
      kol.rank_tags.push(boardRankTag(row));
      kol.top50_board_count += 1;
      row.top_tickers.forEach((ticker) => {
        if (ticker && kol.top_tickers.indexOf(ticker) < 0) kol.top_tickers.push(ticker);
      });
      if (row.rank && row.rank < kol.best_rank) {
        kol.best_rank = row.rank;
        kol.primary_board = row.board;
        kol.metric_value = row.metric_value;
        kol.signal_count = row.signal_count;
      }
      if (row.best_strategy_roi_pct > kol.best_roi_pct) {
        kol.best_roi_pct = row.best_strategy_roi_pct;
        kol.best_roi_profile = row.best_strategy_profile;
      }
      if (row.best_call_return_pct > kol.best_call_return_pct) {
        kol.best_call_ticker = row.best_call_ticker;
        kol.best_call_return_pct = row.best_call_return_pct;
      }
      kol.focus = kol.focus || row.focus;
      kol.asset_class = kol.asset_class || row.asset_class;
      kol.primary_domain = kol.primary_domain || row.primary_domain;
      kol.style_tag = kol.style_tag || row.style_tag;
      kol.note = kol.note || row.note;
      kol.playbook_url = kol.playbook_url || row.playbook_url;
      kol.snapshot_iso = kol.snapshot_iso || row.snapshot_iso;
    });
  });

  return Object.keys(byHandle)
    .map((handle) => {
      const kol = byHandle[handle];
      kol.rank_tags.sort((a, b) => a.rank - b.rank);
      kol.top_tickers = kol.top_tickers.slice(0, 8);
      kol.spotlight = buildSpotlight(kol);
      kol.priority_score =
        Math.max(0, 80 - kol.best_rank) +
        kol.top50_board_count * 10 +
        Math.min(50, Math.max(0, kol.best_roi_pct || 0) / 4);
      return kol;
    })
    .sort((a, b) => {
      if (b.priority_score !== a.priority_score) return b.priority_score - a.priority_score;
      return a.best_rank - b.best_rank;
    })
    .slice(0, MAX_WATCHLIST_HANDLES);
}

function uniqueTopHandles(boards) {
  const seen = {};
  const handles = [];
  ["win", "roi", "bestcall"].forEach((board) => {
    (boards[board] || []).slice(0, 50).forEach((row) => {
      if (row.handle && !seen[row.handle]) {
        seen[row.handle] = true;
        handles.push(row.handle);
      }
    });
  });
  return handles.slice(0, MAX_WATCHLIST_HANDLES);
}

async function loadWatchlistState(ctx, now) {
  const force = !!(env.args && (env.args.force_watchlist || env.args.forceWatchlist));
  const cachedRaw = await ctx.kv.load("kol_watchlist_v2");
  const cachedBoardsRaw = await ctx.kv.load("kol_leaderboard_boards_v2");
  const refreshedAt = Number(await ctx.kv.load("kol_watchlist_refreshed_at") || 0);
  if (!force && cachedRaw && now - refreshedAt < WATCHLIST_REFRESH_MS) {
    try {
      const watchlist = JSON.parse(cachedRaw);
      const boards = cachedBoardsRaw ? JSON.parse(cachedBoardsRaw) : {};
      if (Array.isArray(watchlist) && watchlist.length) {
        return { watchlist, boards, refreshed: false, refreshed_at: refreshedAt };
      }
    } catch (_) {}
  }

  const boards = await loadLeaderboards();
  const watchlist = buildKolWatchlist(boards);
  await ctx.kv.put("kol_watchlist_v2", JSON.stringify(watchlist));
  await ctx.kv.put("kol_leaderboard_boards_v2", JSON.stringify(boards));
  await ctx.kv.put("kol_watchlist_refreshed_at", String(now));
  return { watchlist, boards, refreshed: true, refreshed_at: now };
}

async function nextKolBatch(ctx, watchlist) {
  const rows = Array.isArray(watchlist) ? watchlist : [];
  if (!rows.length) return [];
  const batchSize = Math.max(1, Math.min(WATCHLIST_BATCH_SIZE || 16, rows.length));
  const cursor = Math.max(0, Number(await ctx.kv.load("kol_watchlist_cursor") || 0)) % rows.length;
  const batch = [];
  for (let i = 0; i < batchSize; i += 1) {
    batch.push(rows[(cursor + i) % rows.length]);
  }
  await ctx.kv.put("kol_watchlist_cursor", String((cursor + batchSize) % rows.length));
  return batch;
}

function postIdentifier(post, fallbackHandle) {
  const raw = post || {};
  const id = String(raw.platform_id || raw.tweet_id || raw.id_str || raw.post_id || raw.id || "").trim();
  if (id && id !== "0") return id;
  const url = String(raw.url || "").trim();
  if (url) return url;
  return String(fallbackHandle || "") + ":" + String(raw.published_at || raw.created_at || "") + ":" + String(raw.full_text || raw.text || "").slice(0, 40);
}

async function loadPushedPostMap(ctx, now) {
  const cutoff = now - POST_DEDUP_RETENTION_MS;
  const raw = await ctx.kv.load("pushed_post_ids_v1");
  const out = {};
  try {
    const parsed = raw ? JSON.parse(raw) : {};
    Object.keys(parsed || {}).forEach((id) => {
      const ts = Number(parsed[id] || 0);
      if (id && ts >= cutoff) out[id] = ts;
    });
  } catch (_) {}
  return out;
}

async function savePushedPostMap(ctx, map) {
  const entries = Object.entries(map || {})
    .filter(([id]) => String(id || "").trim())
    .sort((a, b) => Number(b[1] || 0) - Number(a[1] || 0))
    .slice(0, POST_DEDUP_MAX_IDS);
  const compact = {};
  entries.forEach(([id, ts]) => { compact[id] = Number(ts || Date.now()); });
  await ctx.kv.put("pushed_post_ids_v1", JSON.stringify(compact));
}

function postScore(post) {
  const rankBoost = Math.max(0, 80 - Number(post.kol_best_rank || 80));
  const engagement = Math.log10(1 + Number(post.like_count || 0) + Number(post.repost_count || 0) * 2 + Number(post.view_count || 0) / 1000);
  const tickerBoost = (post.tickers || []).length ? 8 : 0;
  return rankBoost + engagement + tickerBoost;
}

async function loadRecentPosts(kolBatch) {
  const jwt = secret.loadPlaintext("ARRAYS_JWT");
  if (!jwt) throw new Error("ARRAYS_JWT secret missing");
  const since = Math.floor(Date.now() / 1000) - LOOKBACK_SECONDS;
  const headers = { Authorization: "Bearer " + jwt };
  const posts = [];
  let failures = 0;
  let attempted = 0;

  for (const kol of kolBatch) {
    const handle = String(kol && kol.handle || "").replace(/^@+/, "");
    if (!handle) continue;
    attempted += 1;
    try {
      const url = ARRAYS_BASE + "/api/v1/social-feeds/x/by-handle?" + query({
        twitter_handle: handle,
        since,
        content_type: "original",
        limit: 6,
      });
      const body = await fetchJson(url, headers);
      const rows = Array.isArray(body.data) ? body.data : [];
      rows.slice(0, 4).forEach((post) => {
        const postId = postIdentifier(post, handle);
        posts.push({
          post_id: postId,
          handle: String(post.twitter_handle || handle),
          display_name: String(post.display_name || kol.display_name || ""),
          published_at: String(post.published_at || ""),
          text: String(post.full_text || "").slice(0, 420),
          url: String(post.url || ""),
          like_count: Number(post.like_count || 0),
          repost_count: Number(post.retweet_count || 0),
          view_count: Number(post.view_count || 0),
          tickers: uniqueTickers(
            ((post.entity_mentions || {}).tickers || [])
              .map((t) => String(t.symbol || t.ticker || t))
              .concat(extractCashtags(post.full_text || ""))
	          ).slice(0, 8),
	          topics: ((post.entity_mentions || {}).topics || []).map((t) => String(t.name || t.topic || t)).filter(Boolean).slice(0, 8),
          kol_best_rank: Number(kol.best_rank || 0),
          kol_primary_board: String(kol.primary_board || ""),
          kol_metric_value: Number(kol.metric_value || 0),
          kol_signal_count: Number(kol.signal_count || 0),
          kol_best_roi_pct: Number(kol.best_roi_pct || 0),
          kol_best_call_ticker: String(kol.best_call_ticker || ""),
          kol_best_call_return_pct: Number(kol.best_call_return_pct || 0),
          kol_focus: String(kol.focus || ""),
          kol_asset_class: String(kol.asset_class || ""),
          kol_playbook_url: String(kol.playbook_url || ""),
          rank_tags: Array.isArray(kol.rank_tags) ? kol.rank_tags.slice(0, 5) : [],
          spotlight: kol.spotlight || {},
        });
      });
    } catch (err) {
      failures += 1;
      console.log("recent posts skipped for @" + handle + ": " + (err && err.message ? err.message : err));
    }
  }

  if (failures >= attempted && attempted > 0) {
    throw new Error("all recent-post lookups failed");
  }

  return posts
    .sort((a, b) => {
      const scoreDiff = postScore(b) - postScore(a);
      if (scoreDiff) return scoreDiff;
      return Date.parse(b.published_at || 0) - Date.parse(a.published_at || 0);
    })
    .slice(0, 32);
}

function flattenBoards(boards) {
  const rows = [];
  ["win", "roi", "bestcall"].forEach((board) => {
    (boards[board] || []).slice(0, 5).forEach((row) => rows.push(row));
  });
  return rows;
}

function normalizeTicker(value) {
  return String(value || "")
    .replace(/^\$/, "")
    .toUpperCase()
    .replace(/[^A-Z0-9.\-]/g, "")
    .replace(/[.\-]+$/, "")
    .slice(0, 18);
}

function addTickerEvidence(index, tickerValue, weight, evidence) {
  const ticker = normalizeTicker(tickerValue);
  if (!ticker) return;
  if (!index[ticker]) {
    index[ticker] = {
      ticker,
      score: 0,
      handles: [],
      urls: [],
      boards: [],
      focuses: [],
      basis: {},
      latest_ts: 0,
    };
  }
  const row = index[ticker];
  row.score += weight;
  if (evidence.handle && row.handles.indexOf(evidence.handle) < 0) row.handles.push(evidence.handle);
  if (evidence.url && row.urls.indexOf(evidence.url) < 0) row.urls.push(evidence.url);
  if (evidence.board && row.boards.indexOf(evidence.board) < 0) row.boards.push(evidence.board);
  if (evidence.focus && row.focuses.indexOf(evidence.focus) < 0) row.focuses.push(evidence.focus);
  if (evidence.basis) row.basis[evidence.basis] = true;
  if (evidence.ts && evidence.ts > row.latest_ts) row.latest_ts = evidence.ts;
}

function buildTickerCandidates(boards, posts) {
  const index = {};
  const boardWeights = { win: 5, roi: 4, bestcall: 4 };

  flattenBoards(boards).forEach((row) => {
    row.top_tickers.slice(0, 5).forEach((ticker, tickerIdx) => {
      const rankWeight = Math.max(1, 7 - Number(row.rank || 6));
      addTickerEvidence(index, ticker, (boardWeights[row.board] || 3) + rankWeight + Math.max(0, 4 - tickerIdx), {
        handle: row.handle,
        url: row.playbook_url,
        board: row.board,
        focus: row.focus,
        basis: "leaderboard",
        ts: Date.parse(row.snapshot_iso || 0) || 0,
      });
    });
  });

  posts.forEach((post) => {
    const ts = Date.parse(post.published_at || 0) || 0;
    post.tickers.slice(0, 8).forEach((ticker, tickerIdx) => {
      addTickerEvidence(index, ticker, 10 + Math.max(0, 4 - tickerIdx), {
        handle: post.handle,
        url: post.url,
        board: "",
        focus: post.text,
        basis: "recent_posts",
        ts,
      });
    });
  });

  return Object.keys(index)
    .map((key) => index[key])
    .sort((a, b) => {
      if (b.latest_ts !== a.latest_ts) return b.latest_ts - a.latest_ts;
      return b.score - a.score;
    })
    .slice(0, 10);
}

function collectTickers(boards, posts) {
  return buildTickerCandidates(boards, posts).map((item) => item.ticker).slice(0, 8);
}

function chooseChannel(tickers, boards, posts) {
  const text = JSON.stringify({ tickers, boards: flattenBoards(boards).slice(0, 8), posts }).toLowerCase();
  if (/btc|eth|sol|crypto|perp|miner|hype|token|defi|bitcoin/.test(text)) return "crypto";
  if (/nvda|mu|amd|avgo|asml|tsm|hbm|memory|semiconductor|semis|chip/.test(text)) return "semis";
  if (/ai|compute|datacenter|data center|inference|gpu|iren|corz|crwv/.test(text)) return "ai-infra";
  if (/rate|fed|treasury|oil|gold|brent|energy|shipping|commodity|macro/.test(text)) return "macro";
  return "market-wire";
}

function parseAgentJson(text) {
  const raw = String(text || "").trim();
  try {
    return JSON.parse(raw);
  } catch (_) {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(raw.slice(start, end + 1));
      } catch (_) {}
    }
  }
  return { body: raw };
}

function truncateClean(text, limit) {
  if (text.length <= limit) return text;
  const slice = text.slice(0, limit - 1);
  const sentenceEnd = Math.max(
    slice.lastIndexOf(". "),
    slice.lastIndexOf("。"),
    slice.lastIndexOf("! "),
    slice.lastIndexOf("? "),
    slice.lastIndexOf("！"),
    slice.lastIndexOf("？")
  );
  if (sentenceEnd >= Math.floor(limit * 0.55)) return slice.slice(0, sentenceEnd + 1).trim();
  const spaceEnd = slice.lastIndexOf(" ");
  const base = spaceEnd >= Math.floor(limit * 0.6) ? slice.slice(0, spaceEnd) : slice;
  return base.replace(/[,;:、，；：.]+$/, "").trim() + "…";
}

function sanitizeLine(value, limit) {
  const text = String(value || "").replace(/[—–]/g, " - ").replace(/\s+/g, " ").trim();
  return truncateClean(text, limit);
}

function validChannel(channel, fallback) {
  return CHANNELS.some((c) => c.channel === channel) ? channel : fallback;
}

function boardLabel(board, lang) {
  const labels = {
    en: { win: "win board", roi: "ROI board", bestcall: "best-call board" },
    cn: { win: "胜率榜", roi: "ROI 榜", bestcall: "最佳喊单榜" },
    kr: { win: "승률 보드", roi: "ROI 보드", bestcall: "베스트 콜 보드" },
  };
  const locale = lang || "en";
  return (labels[locale] && labels[locale][board]) || labels.en[board] || board || "leaderboard";
}

function evidenceBasis(item) {
  return item.basis.recent_posts ? "recent_posts" : "leaderboard";
}

function cleanPostHook(text, ticker) {
  let value = String(text || "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\s+/g, " ")
    .trim();
  value = value.replace(new RegExp("^\\$?" + ticker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*:?\\s*", "i"), "");
  const sentence = value.split(/(?<=[.!?])\s+/)[0] || value;
  return sanitizeLine(sentence, 96);
}

function fallbackReason(item, lang) {
  const handles = item.handles.slice(0, 2).map((h) => "@" + h).join(", ");
  const boards = item.boards.slice(0, 2).map(boardLabel).join(" / ");
  const recent = item.basis.recent_posts;
  const focus = recent ? cleanPostHook(item.focuses[0], item.ticker) : sanitizeLine(item.focuses[0] || boards || "top-KOL attention", 92);
  if (recent && lang === "cn") {
    return sanitizeLine(item.ticker + " 来自" + (handles || "顶部 KOL") + "的近期帖子：" + focus + "。", 120);
  }
  if (recent && lang === "kr") {
    return sanitizeLine(item.ticker + "는 " + (handles || "상위 KOL") + "의 최근 게시물에서 나왔습니다: " + focus + ".", 130);
  }
  if (recent) {
    return sanitizeLine(item.ticker + " came from " + (handles || "a top KOL") + "'s recent post: " + focus + ".", 150);
  }
  if (lang === "cn") {
    return sanitizeLine(item.ticker + " 由" + (handles || "顶部 KOL") + "带出，核心线索是" + focus + "。", 120);
  }
  if (lang === "kr") {
    return sanitizeLine(item.ticker + "는 " + (handles || "상위 KOL") + " 언급에서 잡혔고, 핵심 맥락은 " + focus + "입니다.", 130);
  }
  return sanitizeLine(item.ticker + " is showing up with " + (handles || "top KOLs") + "; the hook is " + focus + ".", 150);
}

function fallbackDigest(candidates, boards, posts) {
  const leadPost = (posts || [])[0];
  if (leadPost) {
    const handle = "@" + leadPost.handle;
    const hook = cleanPostHook(leadPost.text, (leadPost.tickers || [])[0] || "");
    const spotlight = (leadPost.spotlight && leadPost.spotlight.en) || "";
    return {
      en: {
        headline: sanitizeLine(handle + " hits the KOL wire", 72),
        body: sanitizeLine((spotlight ? spotlight + " " : "") + hook, 260),
      },
      cn: {
        headline: sanitizeLine(handle + " 登上 KOL Wire", 72),
        body: sanitizeLine(((leadPost.spotlight && leadPost.spotlight.cn) || spotlight || "") + " " + hook, 160),
      },
      kr: {
        headline: sanitizeLine(handle + "가 KOL Wire에 포착", 92),
        body: sanitizeLine(((leadPost.spotlight && leadPost.spotlight.kr) || spotlight || "") + " " + hook, 180),
      },
    };
  }
  const tickers = candidates.map((item) => item.ticker).slice(0, 4);
  const handles = candidates.reduce((acc, item) => {
    item.handles.forEach((handle) => {
      if (acc.indexOf(handle) < 0) acc.push(handle);
    });
    return acc;
  }, []).slice(0, 3);
  const en = tickers.length
    ? tickers.join(", ") + " is the live KOL tape" + (handles.length ? " from " + handles.map((h) => "@" + h).join(", ") + "." : ".")
    : "No fresh KOL ticker cluster yet. The leaderboard source is the place to check first.";
  return {
    en: {
      headline: tickers.length ? tickers.slice(0, 2).join(" / ") + " leads the KOL tape" : "KOL tape is quiet",
      body: en,
    },
    cn: {
      headline: tickers.length ? tickers.slice(0, 2).join(" / ") + " 是 KOL 主线" : "KOL 盘面安静",
      body: tickers.length ? tickers.join(", ") + " 是当前 KOL 盘面主线。先看来源榜单和相关 handle，再决定是否跟进。" : "暂时没有新的 KOL ticker 集群。先看来源榜单确认上下文。",
    },
    kr: {
      headline: tickers.length ? tickers.slice(0, 2).join(" / ") + "가 KOL 테이프를 주도" : "KOL 테이프가 조용합니다",
      body: tickers.length ? tickers.join(", ") + "가 현재 KOL 테이프의 중심입니다. 움직임을 따라가기 전에 소스 리더보드와 관련 핸들을 먼저 보세요." : "새 KOL 티커 클러스터가 아직 없습니다. 소스 리더보드에서 맥락을 먼저 확인하세요.",
    },
  };
}

function fallbackCredibility(posts) {
  const lead = (posts || [])[0];
  if (!lead) return { en: "", cn: "", kr: "" };
  const primary = (lead.rank_tags || [])[0] || null;
  const handle = "@" + lead.handle;
  const out = {};
  ["en", "cn", "kr"].forEach((locale) => {
    const parts = [handle];
    if (primary && primary.rank) {
      parts.push("#" + primary.rank + " " + boardLabel(primary.board, locale));
    }
    const metric = primary ? metricPhrase(primary, locale) : "";
    if (metric) parts.push(metric);
    out[locale] = parts.join(" · ");
  });
  return out;
}

function normalizeCredibility(parsed, posts) {
  const fallback = fallbackCredibility(posts);
  const source = parsed.credibility || {};
  return {
    en: sanitizeLine(source.en || fallback.en, 90),
    cn: sanitizeLine(source.cn || fallback.cn, 70),
    kr: sanitizeLine(source.kr || fallback.kr, 80),
  };
}

function normalizeDigest(parsed, candidates, boards, posts) {
  const fallback = fallbackDigest(candidates, boards, posts);
  const source = parsed.digest || {};
  return {
    en: {
      headline: sanitizeLine((source.en && source.en.headline) || parsed.headline || fallback.en.headline, 72),
      body: sanitizeLine(stripSourceCta((source.en && source.en.body) || parsed.body || fallback.en.body), 300),
    },
    cn: {
      headline: sanitizeLine((source.cn && source.cn.headline) || fallback.cn.headline, 72),
      body: sanitizeLine(stripSourceCta((source.cn && source.cn.body) || fallback.cn.body), 200),
    },
    kr: {
      headline: sanitizeLine((source.kr && source.kr.headline) || fallback.kr.headline, 92),
      body: sanitizeLine(stripSourceCta((source.kr && source.kr.body) || fallback.kr.body), 220),
    },
  };
}

function normalizeTickerContext(parsed, candidates, fallbackChannel) {
  const rows = Array.isArray(parsed.ticker_context) ? parsed.ticker_context : [];
  const byTicker = {};
  rows.forEach((row) => {
    const ticker = normalizeTicker(row && row.ticker);
    if (ticker) byTicker[ticker] = row;
  });

  return candidates.slice(0, 8).map((item) => {
    const modelRow = byTicker[item.ticker] || {};
    return {
      ticker: item.ticker,
      channel: validChannel(modelRow.channel, chooseChannel([item.ticker], {}, [])) || fallbackChannel,
      reason_en: sanitizeLine(modelRow.reason_en || fallbackReason(item, "en"), 150),
      reason_cn: sanitizeLine(modelRow.reason_cn || fallbackReason(item, "cn"), 120),
      reason_kr: sanitizeLine(modelRow.reason_kr || fallbackReason(item, "kr"), 130),
      source_handles: (Array.isArray(modelRow.handles) ? modelRow.handles : item.handles)
        .map((h) => String(h).replace(/^@+/, ""))
        .filter(Boolean)
        .slice(0, 5),
      source_urls: item.urls.slice(0, 4),
      mention_score: Math.round(item.score),
      source_basis: evidenceBasis(item),
      snapshot_iso: "",
    };
  });
}

function digestFieldJson(digest, field) {
  return JSON.stringify({
    en: (digest.en && digest.en[field]) || "",
    cn: (digest.cn && digest.cn[field]) || "",
    kr: (digest.kr && digest.kr[field]) || "",
  });
}

function stripSourceCta(value) {
  let text = String(value || "").replace(/\s+/g, " ").trim();
  const patterns = [
    /\s*(?:Read|Open|Click|See)\s+(?:his|her|their|the|this|that)?\s*(?:tracker|thread|source|context|post|link)[^.?!。]*[.?!。]?$/i,
    /\s*(?:点开|点击|打开|查看|看)(?:他|她|它|这条|该)?(?:的)?\s*(?:tracker|追踪页|原帖|原推|来源|上下文|链接)[^。.!?]*[。.!?]?$/i,
    /\s*(?:원문|소스|tracker|트래커|링크)[^.?!。]*(?:확인|보라|보세요)[^.?!。]*[.?!。]?$/i,
  ];
  let changed = true;
  while (changed) {
    changed = false;
    patterns.forEach((pattern) => {
      const next = text.replace(pattern, "").trim();
      if (next !== text) {
        text = next;
        changed = true;
      }
    });
  }
  return text;
}

function pushLimit(lang) {
  if (lang === "cn") return { headline: 72, body: 200 };
  if (lang === "kr") return { headline: 92, body: 220 };
  return { headline: 72, body: 300 };
}

function firstSourceUrl(message) {
  const urls = Array.isArray(message.source_urls) ? message.source_urls : [];
  return urls.map((url) => String(url || "").trim()).filter(Boolean)[0] || SOURCE_PLAYBOOK_URL;
}

function normalizeSourceUrls(parsedUrls, postIds, posts) {
  const byId = {};
  posts.forEach((post) => {
    if (post.post_id && post.url) byId[String(post.post_id)] = String(post.url);
  });
  const out = [];
  const seen = {};
  function add(url) {
    const value = String(url || "").trim();
    if (!value || seen[value]) return;
    seen[value] = true;
    out.push(value);
  }
  postIds.forEach((id) => add(byId[String(id)]));
  (Array.isArray(parsedUrls) ? parsedUrls : []).forEach(add);
  posts.forEach((post) => add(post.url));
  return out.slice(0, 8);
}

function emptyTitleJson() {
  return JSON.stringify({ en: "", cn: "", kr: "" });
}

function pushBody(message, lang) {
  const digest = (message.digest && message.digest[lang]) || (message.digest && message.digest.en) || {};
  const limits = pushLimit(lang);
  const headline = sanitizeLine(stripSourceCta(digest.headline || message.headline), limits.headline);
  const body = sanitizeLine(stripSourceCta(digest.body || message.body), limits.body);
  const credibility = sanitizeLine((message.credibility && message.credibility[lang]) || (message.credibility && message.credibility.en) || "", 90);
  const prices = sanitizeLine(priceLine(message), 110);
  const source = firstSourceUrl(message);
  return [
    headline,
    body,
    credibility,
    prices,
    source,
  ].filter(Boolean).join("\n");
}

function fmtPrice(value) {
  const n = safeNum(value);
  if (!n) return "";
  if (n >= 1000) return String(Math.round(n));
  if (n >= 100) return n.toFixed(1);
  if (n >= 1) return n.toFixed(2);
  return n.toPrecision(3);
}

function parseBarTime(value) {
  if (typeof value === "number") return value * 1000;
  const t = Date.parse(value || "");
  return Number.isFinite(t) ? t : 0;
}

function priceFromBars(rows) {
  if (!Array.isArray(rows) || !rows.length) return null;
  const latest = rows[0];
  const price = safeNum(latest.price_close);
  if (!price) return null;
  const target = parseBarTime(latest.time_open) - 24 * 3600 * 1000;
  let base = null;
  let bestDiff = Infinity;
  rows.forEach((row) => {
    const diff = Math.abs(parseBarTime(row.time_open) - target);
    if (diff < bestDiff) {
      bestDiff = diff;
      base = row;
    }
  });
  const basePrice = safeNum(base && base.price_close);
  const chg = basePrice ? Math.round(((price - basePrice) / basePrice) * 10000) / 100 : null;
  return {
    price,
    chg24h_pct: chg,
    currency: String(latest.quote_currency || "USD"),
  };
}

async function fetchTickerPrice(ticker, headers) {
  const now = Math.floor(Date.now() / 1000);
  const attempts = ticker.indexOf(".") > 0
    ? [{
        source: "stock_non_us",
        url: ARRAYS_BASE + "/api/v1/stocks/non-us/kline?" + query({ symbol: ticker, start_time: now - 6 * 86400, end_time: now, interval: "1d", limit: 10 }),
      }]
    : [{
        source: "stock",
        url: ARRAYS_BASE + "/api/v1/stocks/kline?" + query({ symbol: ticker, start_time: now - 26 * 3600, end_time: now, interval: "5min", limit: 500 }),
      }, {
        source: "crypto",
        url: ARRAYS_BASE + "/api/v1/crypto/binance/spot/usdt/kline?" + query({ symbol: ticker, start_time: now - 26 * 3600, end_time: now, interval: "5min", limit: 500 }),
      }];
  for (const attempt of attempts) {
    try {
      const body = await fetchJson(attempt.url, headers);
      const info = priceFromBars(body && body.data);
      if (info) return { ...info, source: attempt.source };
    } catch (_) {}
  }
  return null;
}

async function fetchTickerPrices(tickers) {
  const out = {};
  let jwt = "";
  try {
    jwt = secret.loadPlaintext("ARRAYS_JWT");
  } catch (_) {}
  if (!jwt) return out;
  const headers = { Authorization: "Bearer " + jwt };
  for (const ticker of (tickers || []).slice(0, 6)) {
    const info = await fetchTickerPrice(ticker, headers);
    if (info) out[ticker] = info;
  }
  return out;
}

function priceLine(message) {
  const prices = message.ticker_prices || {};
  return (message.tickers || [])
    .filter((t) => prices[t] && safeNum(prices[t].price))
    .slice(0, 3)
    .map((t) => {
      const p = prices[t];
      const cur = p.currency && p.currency !== "USD" ? " " + p.currency : "";
      const chg = (p.chg24h_pct === null || p.chg24h_pct === undefined)
        ? ""
        : " " + (p.chg24h_pct >= 0 ? "+" : "") + p.chg24h_pct + "%/24h";
      return "$" + t + " " + fmtPrice(p.price) + cur + chg;
    })
    .join(" \u00b7 ");
}

function digestTickers(digest, posts, postIds, parsedTickers) {
  const text = [
    digest.en && digest.en.headline,
    digest.en && digest.en.body,
    digest.cn && digest.cn.body,
    digest.kr && digest.kr.body,
  ].filter(Boolean).join(" ");
  const fromText = extractCashtags(text);
  const byId = {};
  posts.forEach((p) => { byId[String(p.post_id)] = p; });
  const lead = byId[String((postIds || [])[0])] || posts[0];
  const fromLead = (lead && lead.tickers) || [];
  const out = uniqueTickers(fromText.concat(fromLead)).slice(0, 6);
  if (out.length) return out;
  return uniqueTickers(Array.isArray(parsedTickers) ? parsedTickers : []).slice(0, 4);
}

async function makeAgentMessage(boards, posts, previous, tickerCandidates, watchlistMeta) {
  const tickers = tickerCandidates.map((item) => item.ticker).slice(0, 8);
  const fallbackChannel = chooseChannel(tickers, boards, posts);
  const input = {
	    allowed_channels: CHANNELS.map((c) => c.channel),
	    default_channel: fallbackChannel,
    source: {
      playbook: SOURCE_PLAYBOOK_URL,
      leaderboard_snapshot_at: (boards.win && boards.win[0] && boards.win[0].snapshot_iso) || "",
    },
    leaderboard: {
      win: (boards.win || []).slice(0, 5),
      roi: (boards.roi || []).slice(0, 5),
      bestcall: (boards.bestcall || []).slice(0, 5),
    },
	    watchlist: {
	      refreshed_at: watchlistMeta && watchlistMeta.refreshed_at_iso || "",
	      size: watchlistMeta && watchlistMeta.size || 0,
	      batch_handles: watchlistMeta && watchlistMeta.batch_handles || [],
	    },
	    new_posts: posts.slice(0, 12).map((post) => ({
	      post_id: post.post_id,
	      handle: post.handle,
	      display_name: post.display_name,
	      published_at: post.published_at,
	      text: post.text,
	      url: post.url,
	      tickers: post.tickers,
	      topics: post.topics,
	      engagement: {
	        likes: post.like_count,
	        reposts: post.repost_count,
	        views: post.view_count,
	      },
	      kol: {
	        best_rank: post.kol_best_rank,
	        primary_board: post.kol_primary_board,
	        metric_value: post.kol_metric_value,
	        signal_count: post.kol_signal_count,
	        best_roi_pct: post.kol_best_roi_pct,
	        best_call_ticker: post.kol_best_call_ticker,
	        best_call_return_pct: post.kol_best_call_return_pct,
	        focus: post.kol_focus,
	        asset_class: post.kol_asset_class,
	        playbook_url: post.kol_playbook_url,
	        rank_tags: post.rank_tags,
	        spotlight: post.spotlight,
	      },
	    })),
	    previous_agent_messages: previous.slice(-6).map((m) => ({
	      channel: m.channel,
	      headline: m.headline,
      body: m.body,
    })),
    active_tickers: tickers,
    ticker_candidates: tickerCandidates.map((item) => ({
      ticker: item.ticker,
      mention_score: Math.round(item.score),
      handles: item.handles.slice(0, 5),
      boards: item.boards,
      focus_snippets: item.focuses.slice(0, 3).map((focus) => sanitizeLine(focus, 180)),
      source_basis: evidenceBasis(item),
    })),
  };

	  const prompt = `You are ${AGENT_DISPLAY_NAME}, the AI agent inside ${OWNER_DISPLAY_NAME}'s finance KOL chat playbook.
	Use only the data in INPUT. Do not add facts, events, prices, or performance numbers that are not in INPUT.
	Write one short KOL wire alert for the channel most relevant to the new post data.
	Goal: pull readers into the most interesting new KOL post, stay succinct, and keep every claim traceable to the source_urls field.
	The watchlist is refreshed from Top 50 leaderboard boards; new_posts are the only post content eligible for this alert.
	Do not recommend trades.
	Digest body rules:
	- The KOL's own track record (rank, board, win rate, ROI, best call) belongs ONLY in the credibility field. Never spend headline or body words restating it; the UI already renders the credibility line right under the body. Use the body entirely for the claim itself.
	- Write for a smart general reader, not a trading desk. When the post hinges on a technical term, product, or niche concept (for example high-NA EUV, HBM, basis trade, funding rate), weave in one short clause of widely-known background: what it is and why it matters to this thesis. Without that clause the alert is worthless to most readers.
	- That background clause is the ONLY place you may use knowledge outside INPUT, and it is limited to neutral, textbook definitions. Never add numbers, prices, dates, events, or performance data that are not in INPUT.
	- Keep body compact. Do not restate the headline.
	- Do not end with a call to action.
	- Never write "Read his tracker", "read the tracker", "click through", "open the source", "点开原帖", "看他的 tracker", "查看来源", or equivalent source-link boilerplate.
	- Put the actual source post URL only in source_urls, not inside digest.body.
	Translations: cn and kr are NOT literal renderings of en. Rewrite each as native-quality financial commentary in that language (cn reads like a sharp 财经快讯: 信达雅), preserving the same facts and the same background clause.
- en: English
- cn: Simplified Chinese
- kr: Korean
	Domain glossary, mandatory: a KOL's "call" is 喊单 in cn (NEVER 调用, never 电话) and 콜 in kr; "win rate" = 胜率 / 승률; "best call" = 最佳喊单 / 베스트 콜; "board" = 榜 / 보드; "long / short" = 做多 / 做空. Keep tickers, @handles, company and product names in their original form.
	Ticker context stays ticker-first: each row is one ticker plus one short reason why it is showing up in this KOL wire batch.
	Mandatory ticker_context rules:
	- Include the first 8 INPUT.ticker_candidates in order unless a ticker is invalid.
	- If source_basis is recent_posts, cite the actual post claim in plain language and include the handle.
	- Translate reason_cn and reason_kr. Do not copy an English sentence into those fields except tickers, handles, company names, and proper nouns.
	- Keep each reason to one sentence.
	- Prefer a source_url from INPUT.new_posts over the leaderboard URL.
	
	${VOICE}
	
	Return JSON only:
	{"channel":"one allowed channel","digest":{"en":{"headline":"max 72 chars","body":"1-3 sentences, max 300 chars"},"cn":{"headline":"max 72 chars","body":"1-3 sentences, max 200 chars"},"kr":{"headline":"max 92 chars","body":"1-3 sentences, max 220 chars"}},"credibility":{"en":"max 90 chars","cn":"max 70 chars","kr":"max 80 chars"},"source_handles":["handle"],"source_urls":["https://x.com/..."],"post_ids":["post id"],"tickers":["TICKER"],"ticker_context":[{"ticker":"TICKER","channel":"one allowed channel","reason_en":"max 150 chars","reason_cn":"max 120 chars","reason_kr":"max 130 chars","handles":["handle"]}]}

The top-level tickers field lists ONLY tickers this alert itself discusses, meaning they appear in the digest text or in the cited post. Never copy batch watchlist, leaderboard, or other KOLs' tickers into it.

The credibility field is one compact track-record line for the lead KOL of this alert, built ONLY from INPUT leaderboard data (rank, board, win rate, ROI, best call). Format like "@handle · #10 best-call board · $JEET +2319%". No prose, no claims outside INPUT.

INPUT:
${JSON.stringify(input)}`;

  let parsed = {};
  let generatedBy = "alvaask";
  try {
    const result = await ask(prompt);
    parsed = parseAgentJson(result && (result.text || result.content || result));
  } catch (err) {
    generatedBy = "fallback";
    console.log("alvaask failed, using deterministic fallback: " + (err && err.message ? err.message : err));
  }
  const handles = Array.isArray(parsed.source_handles) ? parsed.source_handles : uniqueTopHandles(boards).slice(0, 4);
  const digest = normalizeDigest(parsed, tickerCandidates, boards, posts);
  const tickerContext = normalizeTickerContext(parsed, tickerCandidates, fallbackChannel).map((row) => ({
    ...row,
    snapshot_iso: (boards.win && boards.win[0] && boards.win[0].snapshot_iso) || "",
  }));
  const postIds = (Array.isArray(parsed.post_ids) ? parsed.post_ids : posts.map((p) => p.post_id))
    .map((id) => String(id || ""))
    .filter(Boolean)
    .slice(0, 12);
  return {
	    channel: validChannel(parsed.channel, fallbackChannel),
	    headline: digest.en.headline,
	    body: digest.en.body,
	    digest,
	    credibility: normalizeCredibility(parsed, posts),
	    generated_by: generatedBy,
	    ticker_context: tickerContext,
	    source_handles: handles.map((h) => String(h).replace(/^@+/, "")).filter(Boolean).slice(0, 8),
	    source_urls: normalizeSourceUrls(parsed.source_urls, postIds, posts),
	    post_ids: postIds,
	    tickers: digestTickers(digest, posts, postIds, parsed.tickers),
	  };
}

(async () => {
  const now = Date.now();

  await feed.run(async (ctx) => {
    const watchState = await loadWatchlistState(ctx, now);
    const boards = watchState.boards || {};
    const watchlist = watchState.watchlist || [];
    const batch = await nextKolBatch(ctx, watchlist);
    const batchHandles = batch.map((kol) => kol.handle).filter(Boolean);
    const posts = await loadRecentPosts(batch);
    const pushedMap = await loadPushedPostMap(ctx, now);
    const newPosts = posts
      .filter((post) => post.post_id && !pushedMap[post.post_id])
      .sort((a, b) => postScore(b) - postScore(a))
      .slice(0, 10);
    const tickerCandidates = buildTickerCandidates(boards, newPosts);

    await ctx.self.ts("config", "channels").append(CHANNELS.map((channel) => ({
      date: now,
      channel: channel.channel,
      name: channel.name,
      description: channel.description,
    })));

    if (watchState.refreshed) {
      await ctx.self.ts("agent", "kols").append(watchlist.map((row, idx) => ({
        date: now + idx,
        primary_board: row.primary_board,
        best_rank: row.best_rank,
        handle: row.handle,
        display_name: row.display_name,
        metric_value: row.metric_value,
        signal_count: row.signal_count,
        best_roi_pct: row.best_roi_pct,
        best_roi_profile: row.best_roi_profile,
        best_call_ticker: row.best_call_ticker,
        best_call_return_pct: row.best_call_return_pct,
        asset_class: row.asset_class,
        focus: row.focus,
        top_tickers_json: JSON.stringify(row.top_tickers || []),
        rank_tags_json: JSON.stringify(row.rank_tags || []),
        spotlight_i18n_json: JSON.stringify(row.spotlight || {}),
        playbook_url: row.playbook_url,
        snapshot_iso: row.snapshot_iso,
      })));
    }

    if (posts.length > 0) {
      await ctx.self.ts("agent", "posts").append(posts.slice(0, 20).map((post, idx) => ({
        date: now + idx,
        post_id: post.post_id,
        handle: post.handle,
        display_name: post.display_name,
        published_at: post.published_at,
        text: post.text,
        url: post.url,
        tickers_json: JSON.stringify(post.tickers || []),
        kol_best_rank: post.kol_best_rank,
        rank_tags_json: JSON.stringify(post.rank_tags || []),
        source_status: pushedMap[post.post_id] ? "already_pushed" : "new",
      })));
    }

    if (!newPosts.length) {
      await ctx.self.ts("notify", "message").append([{
        date: now,
        title: AGENT_DISPLAY_NAME,
        title_i18n_json: JSON.stringify({ en: AGENT_DISPLAY_NAME, cn: AGENT_DISPLAY_NAME, kr: AGENT_DISPLAY_NAME }),
        body: "<|SKIP_NOTIFICATION|>",
        body_i18n_json: JSON.stringify({ en: "<|SKIP_NOTIFICATION|>", cn: "<|SKIP_NOTIFICATION|>", kr: "<|SKIP_NOTIFICATION|>" }),
        lang: "en",
        meta_json: JSON.stringify({
          source: "no_unpushed_posts",
          agent_version: AGENT_VERSION,
          watchlist_size: watchlist.length,
          batch_handles: batchHandles,
          recent_post_count: posts.length,
          watchlist_refreshed: !!watchState.refreshed,
        }),
      }]);
      await savePushedPostMap(ctx, pushedMap);
      console.log("agent message skipped before AlvaAsk: no unpushed posts in batch " + batchHandles.join(","));
      return;
    }

    const previous = await ctx.self.ts("chat", "messages").last(80);
    const message = await makeAgentMessage(
      boards,
      newPosts,
      previous.filter((m) => m.author_type === "agent"),
      tickerCandidates,
      {
        refreshed_at_iso: watchState.refreshed_at ? new Date(watchState.refreshed_at).toISOString() : "",
        size: watchlist.length,
        batch_handles: batchHandles,
      }
    );

    try {
      message.ticker_prices = await fetchTickerPrices(message.tickers);
    } catch (err) {
      message.ticker_prices = {};
      console.log("ticker price fetch failed: " + (err && err.message ? err.message : err));
    }

    await ctx.self.ts("agent", "tickers").append(message.ticker_context.map((row, idx) => ({
      date: now + idx,
      ticker: row.ticker,
      channel: row.channel,
      reason_en: row.reason_en,
      reason_cn: row.reason_cn,
      reason_kr: row.reason_kr,
      source_handles_json: JSON.stringify(row.source_handles),
      source_urls_json: JSON.stringify(row.source_urls),
      mention_score: row.mention_score,
      source_basis: row.source_basis,
      snapshot_iso: row.snapshot_iso,
    })));

    await ctx.self.ts("chat", "messages").append([{
      date: now,
      channel: message.channel,
      author_type: "agent",
      author_name: AGENT_DISPLAY_NAME,
      headline: message.headline,
      headline_i18n_json: digestFieldJson(message.digest, "headline"),
      body: message.body,
      body_i18n_json: digestFieldJson(message.digest, "body"),
      source_url: message.source_urls[0] || SOURCE_PLAYBOOK_URL,
      source_handles_json: JSON.stringify(message.source_handles),
      tickers_json: JSON.stringify(message.tickers),
      meta_json: JSON.stringify({
        source: "zet/alva-kol-leaderboard + Arrays X by-handle",
        leaderboard_snapshot_at: (boards.win && boards.win[0] && boards.win[0].snapshot_iso) || "",
        recent_post_count: posts.length,
        new_post_count: newPosts.length,
        post_ids: message.post_ids,
        source_urls: message.source_urls,
        watchlist_size: watchlist.length,
        batch_handles: batchHandles,
        watchlist_refreshed: !!watchState.refreshed,
        agent_version: AGENT_VERSION,
        owner_display_name: OWNER_DISPLAY_NAME,
        i18n: message.digest,
        credibility: message.credibility,
        ticker_prices: message.ticker_prices || {},
        context_tickers: message.ticker_context.map((row) => row.ticker),
        generated_by: message.generated_by,
      }),
    }]);
    await ctx.self.ts("notify", "message").append([{
      date: now,
      title: "",
      title_i18n_json: emptyTitleJson(),
      body: pushBody(message, "en"),
      body_i18n_json: JSON.stringify({
        en: pushBody(message, "en"),
        cn: pushBody(message, "cn"),
        kr: pushBody(message, "kr"),
      }),
      lang: "en",
      meta_json: JSON.stringify({
        agent: AGENT_DISPLAY_NAME,
        agent_version: AGENT_VERSION,
        owner_display_name: OWNER_DISPLAY_NAME,
        i18n: message.digest,
        credibility: message.credibility,
        ticker_prices: message.ticker_prices || {},
        generated_by: message.generated_by,
        source_url: message.source_urls[0] || SOURCE_PLAYBOOK_URL,
        post_ids: message.post_ids,
      }),
    }]);
    message.post_ids.forEach((id) => {
      if (id) pushedMap[id] = now;
    });
    await savePushedPostMap(ctx, pushedMap);
    console.log("agent message posted to #" + message.channel + ": " + message.headline);
  });
})();
