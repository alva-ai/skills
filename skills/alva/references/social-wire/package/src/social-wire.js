"use strict";

const DEFAULT_RETENTION_MS = 14 * 24 * 60 * 60 * 1000;
const DEFAULT_MAX_DEDUP_IDS = 5000;
const DEFAULT_LOOKBACK_SECONDS = 36 * 60 * 60;

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asText(value) {
  return String(value == null ? "" : value).trim();
}

function unique(values) {
  const out = [];
  const seen = {};
  asArray(values).forEach((value) => {
    const key = asText(value);
    if (!key || seen[key]) return;
    seen[key] = true;
    out.push(key);
  });
  return out;
}

function normalizeTicker(value) {
  return asText(value)
    .replace(/^\$/, "")
    .toUpperCase()
    .replace(/[^A-Z0-9.\-]/g, "")
    .replace(/[.\-]+$/, "")
    .slice(0, 18);
}

function defaultTickerExtractor(text) {
  const matches = asText(text).match(/\$[A-Za-z][A-Za-z0-9.\-]{0,17}/g) || [];
  return unique(matches.map(normalizeTicker)).filter(Boolean).slice(0, 12);
}

function postIdentifier(rawPost, fallbackHandle) {
  const raw = rawPost || {};
  const id = asText(raw.platform_id || raw.tweet_id || raw.id_str || raw.post_id || raw.id);
  if (id && id !== "0") return id;
  const url = asText(raw.url);
  if (url) return url;
  return [
    asText(fallbackHandle),
    asText(raw.published_at || raw.created_at),
    asText(raw.full_text || raw.text).slice(0, 80),
  ].join(":");
}

function extractEntityTickers(rawPost) {
  const mentions = (rawPost && rawPost.entity_mentions) || {};
  return asArray(mentions.tickers).map((item) => {
    if (typeof item === "string") return item;
    return item && (item.symbol || item.ticker || item.name);
  });
}

function extractEntityTopics(rawPost) {
  const mentions = (rawPost && rawPost.entity_mentions) || {};
  return asArray(mentions.topics).map((item) => {
    if (typeof item === "string") return item;
    return item && (item.name || item.topic || item.label);
  });
}

function normalizePost(rawPost, source) {
  const raw = rawPost || {};
  const src = source || {};
  const handle = asText(raw.twitter_handle || raw.handle || src.handle).replace(/^@+/, "");
  const text = asText(raw.full_text || raw.text || raw.body);
  const tickers = unique(
    extractEntityTickers(raw)
      .concat(defaultTickerExtractor(text))
      .map(normalizeTicker)
      .filter(Boolean)
  );

  return {
    post_id: postIdentifier(raw, handle),
    platform: asText(src.platform || raw.platform || "x"),
    handle,
    display_name: asText(raw.display_name || raw.name || src.display_name),
    published_at: asText(raw.published_at || raw.created_at),
    fetched_at: asText(src.fetched_at || new Date().toISOString()),
    source_endpoint: asText(src.source_endpoint),
    source_query: src.source_query || {},
    source_as_of: asText(raw.source_as_of || src.source_as_of || src.fetched_at),
    text: text.slice(0, Number(src.max_text_chars || 800)),
    url: asText(raw.url || raw.permalink),
    like_count: Number(raw.like_count || raw.likes || 0),
    repost_count: Number(raw.retweet_count || raw.repost_count || raw.reposts || 0),
    reply_count: Number(raw.reply_count || raw.replies || 0),
    view_count: Number(raw.view_count || raw.views || 0),
    tickers: tickers.slice(0, Number(src.max_tickers || 12)),
    topics: unique(extractEntityTopics(raw).map(asText)).slice(0, 12),
    author_context: src.author_context || {},
    domain_context: src.domain_context || {},
    raw_ref: src.keep_raw ? raw : undefined,
  };
}

function defaultPostScore(post, options) {
  const opts = options || {};
  const rank = Number((post.author_context && post.author_context.best_rank) || 0);
  const rankBoost = rank ? Math.max(0, Number(opts.rank_ceiling || 80) - rank) : 0;
  const engagement = Math.log10(
    1 +
    Number(post.like_count || 0) +
    Number(post.repost_count || 0) * 2 +
    Number(post.reply_count || 0) +
    Number(post.view_count || 0) / 1000
  );
  const tickerBoost = asArray(post.tickers).length ? Number(opts.ticker_boost || 8) : 0;
  const topicBoost = asArray(post.topics).length ? Number(opts.topic_boost || 1) : 0;
  return rankBoost + engagement + tickerBoost + topicBoost;
}

function parseJsonLoose(text) {
  const raw = asText(text);
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
  return {};
}

function truncate(text, limit) {
  const value = asText(text).replace(/\s+/g, " ");
  const max = Number(limit || 240);
  if (value.length <= max) return value;
  return value.slice(0, Math.max(1, max - 1)).replace(/\s+\S*$/, "").trim() + "...";
}

function firstSourceUrls(posts, limit) {
  return unique(asArray(posts).map((post) => post.url).filter(Boolean)).slice(0, limit || 8);
}

function collectTickers(posts, limit) {
  const values = [];
  asArray(posts).forEach((post) => {
    asArray(post.tickers).forEach((ticker) => values.push(ticker));
  });
  return unique(values.map(normalizeTicker).filter(Boolean)).slice(0, limit || 8);
}

function fallbackSummary(evidence, options) {
  const posts = asArray(evidence.posts);
  const lead = posts[0] || {};
  const handle = lead.handle ? "@" + lead.handle : "source";
  const tickers = collectTickers(posts, 4);
  const headline = tickers.length
    ? tickers.slice(0, 2).join(" / ") + " is moving through social sources"
    : handle + " has a fresh social post";
  return {
    channel: (options && options.default_channel) || "",
    digest: {
      en: {
        headline: truncate(headline, 80),
        body: truncate(lead.text || "Fresh social evidence is available.", 300),
      },
    },
    credibility: {},
    source_handles: unique(posts.map((post) => post.handle).filter(Boolean)).slice(0, 8),
    source_urls: firstSourceUrls(posts, 8),
    post_ids: unique(posts.map((post) => post.post_id)).slice(0, 12),
    tickers,
    ticker_context: buildTickerContext(posts, options),
    generated_by: "fallback",
  };
}

function buildTickerContext(posts, options) {
  const opts = options || {};
  const index = {};
  asArray(posts).forEach((post) => {
    asArray(post.tickers).forEach((rawTicker) => {
      const ticker = normalizeTicker(rawTicker);
      if (!ticker) return;
      if (!index[ticker]) {
        index[ticker] = {
          ticker,
          score: 0,
          handles: [],
          source_urls: [],
          posts: [],
          latest_ts: 0,
        };
      }
      const row = index[ticker];
      row.score += defaultPostScore(post, opts.scoring);
      if (post.handle && row.handles.indexOf(post.handle) < 0) row.handles.push(post.handle);
      if (post.url && row.source_urls.indexOf(post.url) < 0) row.source_urls.push(post.url);
      row.posts.push(post);
      const ts = Date.parse(post.published_at || 0) || 0;
      if (ts > row.latest_ts) row.latest_ts = ts;
    });
  });

  return Object.keys(index)
    .map((ticker) => {
      const row = index[ticker];
      const lead = row.posts[0] || {};
      return {
        ticker,
        channel: opts.route_ticker ? opts.route_ticker(ticker, row) : opts.default_channel || "",
        reason_en: truncate(
          opts.describe_ticker ? opts.describe_ticker(ticker, row) : ticker + " appears in @" + (row.handles[0] || "source") + "'s recent post.",
          160
        ),
        source_handles: row.handles.slice(0, 5),
        source_urls: row.source_urls.slice(0, 4),
        mention_score: Math.round(row.score),
        source_basis: "recent_posts",
        snapshot_iso: lead.fetched_at || "",
      };
    })
    .sort((a, b) => b.mention_score - a.mention_score)
    .slice(0, Number(opts.max_ticker_context || 8));
}

function buildEvidencePack(posts, options) {
  const opts = options || {};
  const selected = asArray(posts).slice(0, Number(opts.max_posts || 12));
  return {
    source: opts.source || {},
    allowed_channels: opts.allowed_channels || [],
    default_channel: opts.default_channel || "",
    posts: selected.map((post) => ({
      post_id: post.post_id,
      platform: post.platform,
      handle: post.handle,
      display_name: post.display_name,
      published_at: post.published_at,
      fetched_at: post.fetched_at,
      source_endpoint: post.source_endpoint,
      source_query: post.source_query,
      source_as_of: post.source_as_of,
      text: post.text,
      url: post.url,
      tickers: post.tickers,
      topics: post.topics,
      engagement: {
        likes: post.like_count,
        reposts: post.repost_count,
        replies: post.reply_count,
        views: post.view_count,
      },
      author_context: post.author_context,
      domain_context: post.domain_context,
    })),
    ticker_context: buildTickerContext(selected, opts),
    previous_summaries: asArray(opts.previous_summaries).slice(-Number(opts.max_previous || 6)),
  };
}

function buildPrompt(evidence, options) {
  const opts = options || {};
  const locales = opts.locales || ["en"];
  const digestShape = locales.reduce((acc, locale) => {
    acc[locale] = { headline: "short", body: "1-3 sentences" };
    return acc;
  }, {});
  return [
    opts.voice || "You are a concise social evidence analyst.",
    "Use only INPUT. Do not add unsupported facts, prices, dates, or recommendations.",
    "Every claim must be traceable to source_urls. Prefer original post URLs.",
    "Return JSON only with this shape:",
    JSON.stringify({
      channel: "one allowed channel",
      digest: digestShape,
      credibility: {},
      source_handles: ["handle"],
      source_urls: ["https://x.com/..."],
      post_ids: ["post id"],
      tickers: ["TICKER"],
      ticker_context: [{
        ticker: "TICKER",
        channel: "one allowed channel",
        reason_en: "why this ticker appears",
        handles: ["handle"],
      }],
    }),
    "INPUT:",
    JSON.stringify(evidence),
  ].join("\n");
}

function normalizeSummary(parsed, evidence, options) {
  const opts = options || {};
  const fallback = fallbackSummary(evidence, opts);
  const posts = asArray(evidence.posts);
  const postIds = unique(asArray(parsed.post_ids).concat(fallback.post_ids)).slice(0, 12);
  const urls = unique(asArray(parsed.source_urls).concat(fallback.source_urls)).slice(0, 8);
  const handles = unique(asArray(parsed.source_handles).concat(fallback.source_handles)).map((h) => asText(h).replace(/^@+/, "")).slice(0, 8);
  const tickers = unique(asArray(parsed.tickers).concat(fallback.tickers).map(normalizeTicker).filter(Boolean)).slice(0, 8);
  const allowed = opts.allowed_channels || [];
  const channel = allowed.indexOf(parsed.channel) >= 0 ? parsed.channel : fallback.channel;

  return {
    channel,
    digest: parsed.digest || fallback.digest,
    credibility: parsed.credibility || fallback.credibility,
    source_handles: handles,
    source_urls: urls,
    post_ids: postIds,
    tickers,
    ticker_context: asArray(parsed.ticker_context).length ? parsed.ticker_context : fallback.ticker_context,
    generated_by: parsed.generated_by || "llm",
    provenance: {
      post_count: posts.length,
      source_endpoints: unique(posts.map((post) => post.source_endpoint).filter(Boolean)),
      fetched_at_min: posts.map((post) => post.fetched_at).filter(Boolean).sort()[0] || "",
      fetched_at_max: posts.map((post) => post.fetched_at).filter(Boolean).sort().slice(-1)[0] || "",
    },
  };
}

class SocialWire {
  constructor(options) {
    const opts = options || {};
    this.adapters = asArray(opts.adapters);
    this.ask = opts.ask;
    this.kv = opts.kv;
    this.logger = opts.logger || console;
    this.now = opts.now || (() => Date.now());
    this.postScore = opts.postScore || defaultPostScore;
    this.dedupKey = opts.dedupKey || "social_wire_pushed_ids_v1";
    this.retentionMs = Number(opts.retentionMs || DEFAULT_RETENTION_MS);
    this.maxDedupIds = Number(opts.maxDedupIds || DEFAULT_MAX_DEDUP_IDS);
    this.lookbackSeconds = Number(opts.lookbackSeconds || DEFAULT_LOOKBACK_SECONDS);
    this.options = opts;
  }

  async loadPosts(subjects, runOptions) {
    const opts = Object.assign({}, this.options, runOptions || {});
    const fetchedAt = new Date(this.now()).toISOString();
    const all = [];
    for (const adapter of this.adapters) {
      const rows = await adapter.fetch(subjects, Object.assign({}, opts, { fetched_at: fetchedAt }));
      asArray(rows).forEach((row) => all.push(row));
    }
    return all
      .map((row) => normalizePost(row.raw || row, row.source || row._source || { fetched_at: fetchedAt }))
      .filter((post) => post.post_id && post.text)
      .sort((a, b) => {
        const scoreDiff = this.postScore(b, opts.scoring) - this.postScore(a, opts.scoring);
        if (scoreDiff) return scoreDiff;
        return (Date.parse(b.published_at || 0) || 0) - (Date.parse(a.published_at || 0) || 0);
      });
  }

  async loadDedupMap(now) {
    if (!this.kv || !this.kv.load) return {};
    const cutoff = now - this.retentionMs;
    const raw = await this.kv.load(this.dedupKey);
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

  async saveDedupMap(map) {
    if (!this.kv || !this.kv.put) return;
    const entries = Object.entries(map || {})
      .filter(([id]) => asText(id))
      .sort((a, b) => Number(b[1] || 0) - Number(a[1] || 0))
      .slice(0, this.maxDedupIds);
    const compact = {};
    entries.forEach(([id, ts]) => {
      compact[id] = Number(ts || this.now());
    });
    await this.kv.put(this.dedupKey, JSON.stringify(compact));
  }

  async run(subjects, runOptions) {
    const opts = Object.assign({}, this.options, runOptions || {});
    const now = this.now();
    const posts = await this.loadPosts(subjects, opts);
    const pushed = await this.loadDedupMap(now);
    const newPosts = posts
      .filter((post) => !pushed[post.post_id])
      .slice(0, Number(opts.max_new_posts || 10));

    const evidence = buildEvidencePack(newPosts, opts);
    if (!newPosts.length) {
      await this.saveDedupMap(pushed);
      return {
        skipped: true,
        reason: "no_unpushed_posts",
        all_posts: posts,
        new_posts: [],
        evidence,
        summary: null,
      };
    }

    let summary;
    if (this.ask) {
      try {
        const prompt = opts.buildPrompt ? opts.buildPrompt(evidence, opts) : buildPrompt(evidence, opts);
        const result = await this.ask(prompt);
        const parsed = parseJsonLoose(result && (result.text || result.content || result));
        summary = normalizeSummary(parsed, evidence, opts);
      } catch (err) {
        if (this.logger && this.logger.log) {
          this.logger.log("social-wire ask failed, using fallback: " + (err && err.message ? err.message : err));
        }
        summary = fallbackSummary(evidence, opts);
      }
    } else {
      summary = fallbackSummary(evidence, opts);
    }

    asArray(summary.post_ids).forEach((id) => {
      if (id) pushed[id] = now;
    });
    await this.saveDedupMap(pushed);

    return {
      skipped: false,
      reason: "",
      all_posts: posts,
      new_posts: newPosts,
      evidence,
      summary,
    };
  }
}

module.exports = {
  SocialWire,
  buildEvidencePack,
  buildPrompt,
  buildTickerContext,
  defaultPostScore,
  defaultTickerExtractor,
  fallbackSummary,
  normalizePost,
  normalizeSummary,
  normalizeTicker,
  unique,
};
