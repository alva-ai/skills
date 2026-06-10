"use strict";

/*
 * Example only. This shows how snarketh/kol-market-chat could use the
 * prototype package while keeping leaderboard/watchlist/channel voice in
 * the playbook feed.
 */

const { Feed, feedPath } = require("@alva/feed");
const { ask } = require("@alva/alvaask");
const http = require("net/http");
const secret = require("secret-manager");
const { SocialWire, createArraysXByHandleAdapter } = require("../src");

const FEED_NAME = "kol-market-chat";
const CHANNELS = ["market-wire", "ai-infra", "crypto", "macro", "semis"];

const feed = new Feed({ path: feedPath(FEED_NAME) });

async function fetchJson(url, headers) {
  const res = await http.fetch(url, { headers: headers || {} });
  if (!res || res.status < 200 || res.status >= 300) {
    throw new Error("HTTP " + (res && res.status ? res.status : "NO_RESPONSE") + " for " + url);
  }
  return JSON.parse(await res.text());
}

function loadSecret(name) {
  return secret.loadPlaintext(name);
}

function chooseChannel(ticker, context) {
  const text = JSON.stringify({ ticker, context }).toLowerCase();
  if (/btc|eth|sol|crypto|token|defi/.test(text)) return "crypto";
  if (/nvda|mu|amd|avgo|asml|tsm|hbm|semiconductor|chip/.test(text)) return "semis";
  if (/ai|compute|datacenter|gpu|inference/.test(text)) return "ai-infra";
  if (/rate|fed|treasury|oil|gold|commodity|macro/.test(text)) return "macro";
  return "market-wire";
}

function voice() {
  return [
    "You are Algostonk Bot inside a finance KOL chat playbook.",
    "Write one short KOL wire alert. Dry, concise, source-led.",
    "Do not recommend trades. Do not invent facts outside INPUT.",
    "Return EN/CN/KR digest fields if possible.",
  ].join("\n");
}

async function loadKolWatchlist(ctx) {
  /*
   * Business-specific code remains outside the package:
   * - read zet/alva-kol-leaderboard
   * - refresh top-KOL watchlist every 24h
   * - return rows with handle/display_name/author_context/domain_context
   */
  const raw = await ctx.kv.load("kol_watchlist_v2");
  return raw ? JSON.parse(raw) : [];
}

async function nextKolBatch(ctx, watchlist) {
  const batchSize = 24;
  const cursor = Number(await ctx.kv.load("kol_watchlist_cursor") || 0);
  const rows = watchlist.slice(cursor, cursor + batchSize);
  await ctx.kv.put("kol_watchlist_cursor", String((cursor + batchSize) % Math.max(1, watchlist.length)));
  return rows;
}

async function writeSocialWireOutputs(ctx, result) {
  const now = Date.now();
  const posts = result.all_posts || [];

  if (posts.length) {
    await ctx.self.ts("agent", "posts").append(posts.slice(0, 20).map((post, idx) => ({
      date: now + idx,
      post_id: post.post_id,
      handle: post.handle,
      display_name: post.display_name,
      published_at: post.published_at,
      text: post.text,
      url: post.url,
      tickers_json: JSON.stringify(post.tickers || []),
      source_status: result.new_posts.some((p) => p.post_id === post.post_id) ? "new" : "already_pushed",
    })));
  }

  if (result.skipped) {
    await ctx.self.ts("notify", "message").append([{
      date: now,
      title: "Algostonk Bot",
      body: "<|SKIP_NOTIFICATION|>",
      meta_json: JSON.stringify({
        source: result.reason,
        post_count: posts.length,
      }),
    }]);
    return;
  }

  const summary = result.summary;
  await ctx.self.ts("agent", "tickers").append((summary.ticker_context || []).map((row, idx) => ({
    date: now + idx,
    ticker: row.ticker,
    channel: row.channel,
    reason_en: row.reason_en || "",
    reason_cn: row.reason_cn || "",
    reason_kr: row.reason_kr || "",
    source_handles_json: JSON.stringify(row.handles || row.source_handles || []),
    source_urls_json: JSON.stringify(row.source_urls || []),
    mention_score: Number(row.mention_score || 0),
    source_basis: row.source_basis || "recent_posts",
    snapshot_iso: row.snapshot_iso || "",
  })));

  await ctx.self.ts("chat", "messages").append([{
    date: now,
    channel: summary.channel || "market-wire",
    author_type: "agent",
    author_name: "Algostonk Bot",
    headline: summary.digest && summary.digest.en && summary.digest.en.headline || "",
    headline_i18n_json: JSON.stringify({
      en: summary.digest && summary.digest.en && summary.digest.en.headline || "",
      cn: summary.digest && summary.digest.cn && summary.digest.cn.headline || "",
      kr: summary.digest && summary.digest.kr && summary.digest.kr.headline || "",
    }),
    body: summary.digest && summary.digest.en && summary.digest.en.body || "",
    body_i18n_json: JSON.stringify({
      en: summary.digest && summary.digest.en && summary.digest.en.body || "",
      cn: summary.digest && summary.digest.cn && summary.digest.cn.body || "",
      kr: summary.digest && summary.digest.kr && summary.digest.kr.body || "",
    }),
    source_url: (summary.source_urls || [])[0] || "",
    source_handles_json: JSON.stringify(summary.source_handles || []),
    tickers_json: JSON.stringify(summary.tickers || []),
    meta_json: JSON.stringify({
      source: "social-wire",
      post_ids: summary.post_ids || [],
      source_urls: summary.source_urls || [],
      provenance: summary.provenance || {},
      generated_by: summary.generated_by,
    }),
  }]);
}

(async () => {
  await feed.run(async (ctx) => {
    const watchlist = await loadKolWatchlist(ctx);
    const batch = await nextKolBatch(ctx, watchlist);
    const wire = new SocialWire({
      adapters: [createArraysXByHandleAdapter({ fetchJson, loadSecret })],
      ask,
      kv: ctx.kv,
      logger: console,
      dedupKey: "pushed_post_ids_v1",
      allowed_channels: CHANNELS,
      default_channel: "market-wire",
      voice: voice(),
      route_ticker: chooseChannel,
      locales: ["en", "cn", "kr"],
      source: {
        playbook: "https://alva.ai/u/zet/playbooks/alva-kol-leaderboard",
      },
    });

    const subjects = batch.map((kol) => ({
      handle: kol.handle,
      display_name: kol.display_name,
      author_context: {
        best_rank: kol.best_rank,
        primary_board: kol.primary_board,
        metric_value: kol.metric_value,
        rank_tags: kol.rank_tags || [],
      },
      domain_context: {
        focus: kol.focus,
        asset_class: kol.asset_class,
        top_tickers: kol.top_tickers || [],
      },
    }));

    const result = await wire.run(subjects, {
      lookbackSeconds: 36 * 60 * 60,
      max_new_posts: 10,
      max_posts: 12,
    });

    await writeSocialWireOutputs(ctx, result);
  });
})();
