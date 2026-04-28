// Growth Inflection Screener v2 — template-compatible feed
// Emits three groups consumed by the new screener template:
//   screener/rankings — one record per (snapshot, ticker)  [flat row schema]
//   screener/summary  — one record per snapshot
//   screener/klines   — flat daily OHLCV bars for top-40
//
// Factors: Growth (40%) · Margin (40%) · Safety (20%)
//   growthScore  = normalize(rev_growth)
//   marginScore  = normalize(gm_delta_avg)   // avg gross-margin delta over last 4 quarters
//   safetyScore  = 0.5*norm(op_margin) + 0.5*norm(current_ratio)
//   composite    = 0.4*growth + 0.4*margin + 0.2*safety
//   score        = clamp(0,100, round(45 + 50 * (composite - min) / (max - min)))
//
// Universe: US mid caps via screener (MARKET_CAP $5B–$50B).
// Hard filter: rev_growth > 0, ≥4 gm quarters, gm acceleration in ≥2 of last 4.

const { Feed, feedPath, makeDoc, num, str } = require("@alva/feed");
const http = require("net/http");
const secret = require("secret-manager");
const envMod = require("env");

const ARRAYS_JWT = secret.loadPlaintext("ARRAYS_JWT");
const ARRAYS_BASE = "https://data-tools.prd.space.id";
const ARRAYS_HEADERS = { Authorization: "Bearer " + ARRAYS_JWT };

async function arraysGet(path, params) {
  const qs = Object.keys(params)
    .filter((k) => params[k] !== undefined && params[k] !== null && params[k] !== "")
    .map((k) => encodeURIComponent(k) + "=" + encodeURIComponent(params[k]))
    .join("&");
  const url = ARRAYS_BASE + path + (qs ? "?" + qs : "");
  const r = await http.fetch(url, { headers: ARRAYS_HEADERS });
  if (r.status < 200 || r.status >= 300) throw new Error("HTTP " + r.status + " " + path);
  return JSON.parse(await r.text());
}

const _args = envMod.args || {};
const _overrideNow = _args.now ? +_args.now : null;

const DAY = 86400000;

const feed = new Feed({ path: feedPath("inflection-screener-v2-feed") });

feed.def("screener", {
  rankings: makeDoc("Growth Inflection Rankings", "Ranked stocks by growth+margin+safety composite", [
    num("rank"), str("ticker"), str("name"), str("sector"), str("industry"),
    num("score"), str("band"),
    num("revGrowth"), num("gmDelta"), num("opMargin"), num("currentRatio"), num("marketCap"),
    num("growthScore"), num("marginScore"), num("safetyScore"),
    str("flagTier"), str("flagLabel"), str("flagsCsv"),
  ]),
  summary: makeDoc("Screener Summary", "Aggregate stats + thresholds", [
    num("totalScreened"), num("totalEligible"), num("totalPassed"),
    num("avgScore"), num("avgRevGrowth"), num("avgGmDelta"), num("avgOpMargin"), num("avgCurrentRatio"),
    str("topSector"), str("lastUpdated"),
    num("basketGmDeltaP75"), num("basketRevGrowthP25"),
    num("basketGmDeltaValidCount"), num("basketRevGrowthValidCount"),
  ]),
  klines: makeDoc("Daily OHLCV", "60-day daily candlestick bars for top-40 tickers", [
    str("ticker"), num("open"), num("high"), num("low"), num("close"), num("volume"),
  ]),
});

// Build symbol → sorted-values map from financial-metrics response.
// HTTP returns observed_at (snake_case); sort ascending so index -1 is latest.
function buildSeriesMap(data) {
  const m = {};
  for (const entry of (data || [])) {
    const t = entry.symbol;
    if (!t || !Array.isArray(entry.values)) continue;
    const sorted = entry.values
      .filter(v => v && v.value != null)
      .sort((a, b) => a.observed_at - b.observed_at);
    if (sorted.length) m[t] = sorted;
  }
  return m;
}

function clamp01(x) { return Math.max(0, Math.min(1, x)); }

(async () => {
  await feed.run(async (ctx) => {
    const now = _overrideNow || Date.now();
    const nowSec = Math.floor(now / 1000);
    const twoYrAgoSec = Math.floor((now - 730 * DAY) / 1000);
    const crWindowSec = Math.floor((now - 120 * DAY) / 1000);
    if (_overrideNow) console.log("BACKFILL mode: now=" + new Date(now).toISOString());

    // ── Universe: US mid-caps ($5B - $50B) ──
    const mcRes = await arraysGet("/api/v1/stocks/screener/financial-metrics", {
      snapshot: nowSec,
      metric_type: "MARKET_CAP",
      order_by: "DESC",
    });
    const universeSize = (mcRes.data || []).length;
    const universe = {};
    for (const d of (mcRes.data || [])) {
      const mc = +d.value;
      if (mc >= 5e9 && mc <= 50e9) universe[d.symbol] = { ticker: d.symbol, marketCap: mc };
    }
    const midCapSize = Object.keys(universe).length;
    console.log("screened=" + universeSize + " mid_cap=" + midCapSize);
    if (midCapSize === 0) { console.log("empty universe — abort"); return; }

    // ── Fetch fundamentals in parallel (2yr window, all tickers) ──
    const [gmRes, omRes, rvRes, crRes] = await Promise.all([
      arraysGet("/api/v1/stocks/financial-metrics", { metric: "GROSS_MARGIN_MRQ", start_time: twoYrAgoSec, end_time: nowSec }),
      arraysGet("/api/v1/stocks/financial-metrics", { metric: "OPERATING_MARGIN_MRQ", start_time: twoYrAgoSec, end_time: nowSec }),
      arraysGet("/api/v1/stocks/financial-metrics", { metric: "REVENUE_GROWTH_YOY_QUARTERLY", start_time: twoYrAgoSec, end_time: nowSec }),
      arraysGet("/api/v1/stocks/financial-metrics", { metric: "CURRENT_RATIO_MRQ", start_time: crWindowSec, end_time: nowSec }),
    ]);
    const gmMap = buildSeriesMap(gmRes.data);
    const omMap = buildSeriesMap(omRes.data);
    const rvMap = buildSeriesMap(rvRes.data);
    const crMap = buildSeriesMap(crRes.data);
    console.log("gm=" + Object.keys(gmMap).length + " om=" + Object.keys(omMap).length + " rv=" + Object.keys(rvMap).length + " cr=" + Object.keys(crMap).length);

    // ── Compute factors per ticker ──
    for (const t of Object.keys(universe)) {
      const u = universe[t];
      const gm = gmMap[t];
      if (!gm || gm.length < 4) { u._drop = "insufficient_gm"; continue; }
      const deltas = [];
      for (let i = 1; i < gm.length; i++) deltas.push(gm[i].value - gm[i - 1].value);
      const tail = deltas.slice(-4);
      const accelCount = tail.filter(d => d >= 0).length;
      if (accelCount < 2) { u._drop = "no_margin_accel"; continue; }
      u.gmDelta = tail.reduce((s, v) => s + v, 0) / tail.length;

      const rv = rvMap[t];
      const latestRv = rv && rv.length ? rv[rv.length - 1].value : null;
      const prevRv = rv && rv.length >= 2 ? rv[rv.length - 2].value : null;
      if (latestRv == null || latestRv <= 0) { u._drop = "no_rev_growth"; continue; }
      u.revGrowth = latestRv;
      u.revPrev = prevRv;

      const om = omMap[t];
      if (!om || !om.length) { u._drop = "no_op_margin"; continue; }
      u.opMargin = om[om.length - 1].value;

      const cr = crMap[t];
      if (!cr || !cr.length) { u._drop = "no_current_ratio"; continue; }
      u.currentRatio = cr[cr.length - 1].value;
    }

    const eligible = Object.values(universe).filter(u => !u._drop);
    console.log("eligible after hard filter=" + eligible.length);
    if (eligible.length < 5) { console.log("Warning: <5 eligible — abort"); return; }

    // ── Min-max normalize each factor ──
    const growthVals = eligible.map(s => s.revGrowth);
    const marginVals = eligible.map(s => s.gmDelta);
    const omVals = eligible.map(s => s.opMargin);
    const crVals = eligible.map(s => s.currentRatio);

    const gMin = Math.min(...growthVals), gMax = Math.max(...growthVals);
    const mMin = Math.min(...marginVals), mMax = Math.max(...marginVals);
    const oMin = Math.min(...omVals), oMax = Math.max(...omVals);
    const cMin = Math.min(...crVals), cMax = Math.max(...crVals);

    function nrm(v, lo, hi) {
      if (hi === lo) return 0.5;
      return clamp01((v - lo) / (hi - lo));
    }

    for (const s of eligible) {
      s.growthNorm = nrm(s.revGrowth, gMin, gMax);
      s.marginNorm = nrm(s.gmDelta, mMin, mMax);
      const omNorm = nrm(s.opMargin, oMin, oMax);
      const crNorm = nrm(s.currentRatio, cMin, cMax);
      s.safetyNorm = 0.5 * omNorm + 0.5 * crNorm;
      s.composite = 0.4 * s.growthNorm + 0.4 * s.marginNorm + 0.2 * s.safetyNorm;
    }

    const compMin = Math.min(...eligible.map(s => s.composite));
    const compMax = Math.max(...eligible.map(s => s.composite));
    for (const s of eligible) {
      const t = (compMax === compMin) ? 1 : (s.composite - compMin) / (compMax - compMin);
      s.score = Math.max(0, Math.min(100, Math.round(45 + 50 * t)));
      s.growthScoreDisp = Math.round(100 * s.growthNorm);
      s.marginScoreDisp = Math.round(100 * s.marginNorm);
      s.safetyScoreDisp = Math.round(100 * s.safetyNorm);
      s.band = s.score >= 80 ? "elite" : s.score >= 70 ? "strong" : s.score >= 60 ? "average" : "weak";
    }

    eligible.sort((a, b) => b.score - a.score);
    const top = eligible.slice(0, 40);

    // ── Enrich with company names in parallel ──
    await Promise.all(top.map(async (s) => {
      try {
        const d = await arraysGet("/api/v1/stocks/company/detail", { symbol: s.ticker });
        const c = d.data && d.data.length ? d.data[0] : null;
        if (c) {
          s.name = c.name || s.ticker;
          s.sector = c.sector || "Unknown";
          s.industry = c.industry || "Unknown";
        } else { s.name = s.ticker; s.sector = "Unknown"; s.industry = "Unknown"; }
      } catch (e) { s.name = s.ticker; s.sector = "Unknown"; s.industry = "Unknown"; }
    }));

    // ── Basket percentiles for soft flags ──
    const gmDeltasSorted = top.map(s => s.gmDelta).sort((a, b) => a - b);
    const revGrowthsSorted = top.map(s => s.revGrowth).sort((a, b) => a - b);
    const basketGmDeltaP75 = gmDeltasSorted.length ? gmDeltasSorted[Math.floor(0.75 * (gmDeltasSorted.length - 1))] : 0;
    const basketRevGrowthP25 = revGrowthsSorted.length ? revGrowthsSorted[Math.floor(0.25 * (revGrowthsSorted.length - 1))] : 0;

    function computeFlags(s) {
      const flags = [];
      if (s.currentRatio < 1.0) flags.push({ label: "Low Liquidity", tier: "hard" });
      if (s.opMargin < 0) flags.push({ label: "Unprofitable", tier: "soft" });
      if (s.revPrev != null && s.revGrowth < s.revPrev) flags.push({ label: "Decelerating", tier: "soft" });
      if (gmDeltasSorted.length >= 20 && s.gmDelta >= basketGmDeltaP75) flags.push({ label: "Margin Leader", tier: "soft" });
      if (revGrowthsSorted.length >= 20 && s.revGrowth < basketRevGrowthP25) flags.push({ label: "Growth Below Avg", tier: "soft" });
      const hard = flags.find(f => f.tier === "hard");
      const soft = flags.find(f => f.tier === "soft");
      let flagTier = "clean", flagLabel = "—";
      if (hard) { flagTier = "hard"; flagLabel = hard.label; }
      else if (soft) { flagTier = "soft"; flagLabel = soft.label; }
      return { flagTier, flagLabel, flagsCsv: flags.map(f => f.label).join(",") };
    }

    const r2 = (v) => v != null ? Math.round(v * 100) / 100 : 0;
    const pct = (v) => v != null ? Math.round(v * 10000) / 100 : 0;

    const rankings = top.map((s, i) => {
      const fl = computeFlags(s);
      return {
        date: now, rank: i + 1, ticker: s.ticker, name: s.name || s.ticker,
        sector: s.sector || "Unknown", industry: s.industry || "Unknown",
        score: s.score, band: s.band,
        revGrowth: pct(s.revGrowth),
        gmDelta: pct(s.gmDelta),
        opMargin: pct(s.opMargin),
        currentRatio: r2(s.currentRatio),
        marketCap: Math.round(s.marketCap || 0),
        growthScore: s.growthScoreDisp,
        marginScore: s.marginScoreDisp,
        safetyScore: s.safetyScoreDisp,
        flagTier: fl.flagTier,
        flagLabel: fl.flagLabel,
        flagsCsv: fl.flagsCsv,
      };
    });
    await ctx.self.ts("screener", "rankings").append(rankings);

    const avg = (arr, fn) => arr.length ? arr.reduce((a, x) => a + fn(x), 0) / arr.length : 0;
    const sectorCounts = {};
    for (const s of top) sectorCounts[s.sector] = (sectorCounts[s.sector] || 0) + 1;
    const topSector = Object.entries(sectorCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

    await ctx.self.ts("screener", "summary").append([{
      date: now,
      totalScreened: universeSize,
      totalEligible: eligible.length,
      totalPassed: top.length,
      avgScore: r2(avg(top, s => s.score)),
      avgRevGrowth: pct(avg(top, s => s.revGrowth)),
      avgGmDelta: pct(avg(top, s => s.gmDelta)),
      avgOpMargin: pct(avg(top, s => s.opMargin)),
      avgCurrentRatio: r2(avg(top, s => s.currentRatio)),
      topSector, lastUpdated: new Date(now).toISOString(),
      basketGmDeltaP75: pct(basketGmDeltaP75),
      basketRevGrowthP25: pct(basketRevGrowthP25),
      basketGmDeltaValidCount: gmDeltasSorted.length,
      basketRevGrowthValidCount: revGrowthsSorted.length,
    }]);

    if (_overrideNow) {
      console.log("BACKFILL mode: skipping K-line fetch");
    } else {
      const klStateRaw = await ctx.kv.load("klState");
      const klState = klStateRaw ? JSON.parse(klStateRaw) : {};
      const sixtyDaysAgoSec = Math.floor((now - 60 * DAY) / 1000);
      const firstRun = top.some(s => !klState[s.ticker]) && Object.keys(klState).length === 0;

      // ── Fetch all klines in parallel ──
      const klResults = await Promise.all(top.map(async (s) => {
        const isNew = !klState[s.ticker];
        const wmSec = isNew && firstRun ? sixtyDaysAgoSec
          : isNew ? nowSec - 86400
          : klState[s.ticker];
        const startSec = wmSec + 1;
        if (startSec >= nowSec) return { ticker: s.ticker, wmSec, bars: [] };
        try {
          const kr = await arraysGet("/api/v1/stocks/kline", {
            symbol: s.ticker, start_time: startSec, end_time: nowSec, interval: "1d", limit: 10000,
          });
          // stocks/kline returns newest-first; reverse to oldest-first
          const bars = (kr.data || []).slice().reverse().filter(b => b.time_open > wmSec);
          return { ticker: s.ticker, wmSec, bars, ok: true };
        } catch (e) {
          return { ticker: s.ticker, wmSec, bars: [], err: true };
        }
      }));

      const klineRecords = [];
      const newKlState = {};
      let klSuccess = 0, klFail = 0;
      for (const res of klResults) {
        if (res.err) { newKlState[res.ticker] = res.wmSec; klFail++; continue; }
        if (!res.bars.length) { newKlState[res.ticker] = res.wmSec; continue; }
        let maxSec = res.wmSec;
        for (const b of res.bars) {
          klineRecords.push({
            date: b.time_open * 1000, ticker: res.ticker,
            open: b.price_open, high: b.price_high, low: b.price_low,
            close: b.price_close, volume: b.volume_traded,
          });
          if (b.time_open > maxSec) maxSec = b.time_open;
        }
        newKlState[res.ticker] = maxSec;
        klSuccess++;
      }

      if (klineRecords.length > 0) await ctx.self.ts("screener", "klines").append(klineRecords);
      await ctx.kv.put("klState", JSON.stringify(newKlState));
      console.log("K-line bars appended: " + klineRecords.length + " (ok=" + klSuccess + " fail=" + klFail + ")");
    }

    console.log("Done! Top 5: " + top.slice(0, 5).map(s => s.ticker + "=" + s.score).join(", "));
  });
})();
