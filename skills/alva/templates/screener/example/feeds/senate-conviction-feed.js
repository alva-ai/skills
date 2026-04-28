// Senate Conviction Buys Screener v2 — template-compatible feed
// Remixed from @ivan/senate-screener-v2
// Emits three groups consumed by the screener template:
//   screener/rankings — one record per (snapshot, ticker)  [flat row schema]
//   screener/summary  — one record per snapshot
//   screener/klines   — flat daily OHLCV bars for top-40
//
// Factors: Breadth (40%) · Size (40%) · Freshness (20%)
//   breadthScore   = normalize(senatorCount)
//   sizeScore      = normalize(log10(totalValueUsd))
//   freshnessScore = normalize(-hoursSinceLast)   // sub-day resolution
//   composite      = 0.4*breadth + 0.4*size + 0.2*freshness
//   score          = clamp(0,100, round(45 + 50 * (composite - min) / (max - min)))
//
// Universe: stocks purchased by senators in last 90 days, ETFs excluded.
// Hard filter: ≥2 distinct senators AND total value ≥ $50K.

const { Feed, feedPath, makeDoc, num, str } = require("@alva/feed");
const http = require("net/http");
const secret = require("secret-manager");
const envMod = require("env");

const ARRAYS_JWT = secret.loadPlaintext("ARRAYS_JWT");
const ARRAYS_BASE = "https://data-tools.prd.space.id";
const ARRAYS_HEADERS = { Authorization: "Bearer " + ARRAYS_JWT };

function arraysGet(path, params) {
  const qs = Object.keys(params)
    .filter((k) => params[k] !== undefined && params[k] !== null && params[k] !== "")
    .map((k) => encodeURIComponent(k) + "=" + encodeURIComponent(params[k]))
    .join("&");
  const url = ARRAYS_BASE + path + (qs ? "?" + qs : "");
  const r = http.syncFetch(url, { headers: ARRAYS_HEADERS });
  if (!r.ok) throw new Error("HTTP " + r.status + " " + path);
  return JSON.parse(r.text());
}

const _args = envMod.args || {};
const _overrideNow = _args.now ? +_args.now : null;

const DAY = 86400000;
const HOUR = 3600000;
const LOOKBACK_DAYS = 90;

const ETF_BLACKLIST = new Set([
  "SPY","QQQ","IWM","DIA","VTI","VOO","VEA","VWO","VUG","VTV","VYM","VIG","VB","VO",
  "AGG","BND","TLT","IEF","SHY","LQD","HYG","JNK","TIP","MUB","MBB",
  "GLD","SLV","USO","UNG","DBC","DBA","GDX","GDXJ",
  "XLK","XLF","XLE","XLV","XLI","XLY","XLP","XLU","XLB","XLRE","XLC",
  "ARKK","ARKW","ARKG","ARKQ","ARKF","SOXX","SMH","KWEB","FXI",
  "EEM","EFA","ACWI","IEFA","IEMG","IXUS","SCHD","SCHF","SCHB","SCHX",
  "VGT","VHT","VFH","VDE","VIS","VCR","VDC","VPU","VOX","VAW","VNQ",
  "PFF","PGF","PFFA","TFLO","FLOT","BIL","SHV","JEPI","JEPQ","DIVO",
  "SPLG","SPDW","SPLV","SPHQ","SPMD","SPSM","RSP","MGK","MGC","MGV",
  "ITOT","IJH","IJR","IVV","IVW","IVE","IUSG","IUSV","IUSB","USIG",
  "USHY","SUB","SHM","TIPX","STIP","VTIP","SCHP","FTSL","BKLN","SRLN",
  "VXUS","VEU","VSS","BNDX","BWX","EMB","EBND","BSV","BIV","BLV",
  "QYLD","XYLD","RYLD","NUSI","DEFI","BITO","ETHE","GBTC","ETHX",
]);

const feed = new Feed({ path: feedPath("senate-conviction-feed") });

feed.def("screener", {
  rankings: makeDoc("Senate Conviction Rankings", "Ranked stocks by senate breadth+size+freshness composite", [
    num("rank"), str("ticker"), str("name"), str("sector"), str("industry"),
    num("score"), str("band"),
    num("senatorCount"), num("totalValueUsd"), num("hoursSinceLast"),
    num("partyCount"), num("chamberCount"), num("tradeCount"), num("marketCap"),
    str("topSenator"), str("topParty"),
    num("breadthScore"), num("sizeScore"), num("freshnessScore"),
    str("flagTier"), str("flagLabel"), str("flagsCsv"),
  ]),
  summary: makeDoc("Screener Summary", "Aggregate stats + thresholds", [
    num("totalScreened"), num("totalEligible"), num("totalPassed"),
    num("avgScore"), num("totalSenators"), num("totalTrades"),
    str("topSenator"), str("topParty"), str("lastUpdated"),
    num("basketSenatorCountP75"), num("basketValueP75"), num("basketValidCount"),
  ]),
  klines: makeDoc("Daily OHLCV", "60-day daily candlestick bars for top-40 tickers", [
    str("ticker"), num("open"), num("high"), num("low"), num("close"), num("volume"),
  ]),
});

function clamp01(x) { return Math.max(0, Math.min(1, x)); }

function parseAmount(s) {
  if (s == null) return 0;
  if (typeof s === "number") return s;
  const str = String(s);
  const m = str.match(/\$([\d,]+)\s*-\s*\$([\d,]+)/);
  if (m) return (parseFloat(m[1].replace(/,/g, "")) + parseFloat(m[2].replace(/,/g, ""))) / 2;
  const m2 = str.match(/\$([\d,]+)/);
  if (m2) return parseFloat(m2[1].replace(/,/g, ""));
  const n = parseFloat(str);
  return isFinite(n) ? n : 0;
}

function parseDateMs(s) {
  if (!s) return 0;
  const t = Date.parse(s);
  return isFinite(t) ? t : 0;
}

function inferChamber(memberType) {
  const m = (memberType || "").toLowerCase();
  if (m === "house") return "House";
  return "Senate";
}

(async () => {
  await feed.run(async (ctx) => {
    const now = _overrideNow || Date.now();
    const lookbackStart = now - LOOKBACK_DAYS * DAY;
    if (_overrideNow) console.log("BACKFILL mode: now=" + new Date(now).toISOString());

    let trades = [];
    try {
      const j = arraysGet("/api/v1/stocks/congress/recent-trades", {
        start_time: Math.floor(lookbackStart / 1000),
        end_time: Math.floor(now / 1000),
        time_type: "TRANSACTION_DATE",
        tag: "all",
        limit: 1000,
      });
      if (j && Array.isArray(j.data)) trades = j.data;
    } catch (e) {
      console.log("congress/recent-trades error: " + (e && e.message ? e.message : e));
    }
    console.log("trades_raw=" + trades.length);
    if (!trades.length) { console.log("No trades — abort"); return; }

    const byT = {};
    let totalTrades = 0;
    const senatorSet = new Set();
    for (const tr of trades) {
      const tx = (tr.transaction_type || "").toLowerCase();
      // HTTP returns either "Buy" or "Purchase" for buys; exclude any "Sale" variants.
      if (tx.includes("sale") || tx.includes("sell")) continue;
      if (!(tx.includes("purchase") || tx.includes("buy"))) continue;
      const ticker = (tr.symbol || "").trim().toUpperCase();
      if (!ticker || ticker.includes("_") || /^(N\/A|--)$/.test(ticker)) continue;
      if (ticker.length > 6) continue;
      if (ticker.length === 5 && ticker.endsWith("X")) continue;
      if (ETF_BLACKLIST.has(ticker)) continue;
      const desc = (tr.notes || tr.issuer || "").toLowerCase();
      if (desc.includes("etf") || desc.includes("mutual fund") || desc.includes("index fund")
          || desc.includes("treasury") || desc.includes("municipal bond") || desc.includes("bond fund")
          || (desc.includes("fund") && !desc.includes("funding"))) continue;

      const senator = (tr.name || "").trim() || "Unknown";
      // HTTP /congress/recent-trades does not expose party. Defaults to "U".
      const party = "U";
      const chamber = inferChamber(tr.member_type);
      const value = parseAmount(tr.amounts);
      const txDateMs = parseDateMs(tr.transaction_date);
      const obsMs = (+tr.observed_at || 0) * 1000;  // HTTP returns seconds
      const refMs = txDateMs || obsMs;
      if (!refMs) continue;

      let agg = byT[ticker];
      if (!agg) {
        agg = byT[ticker] = {
          ticker,
          senators: new Map(), parties: new Set(), chambers: new Set(),
          totalValue: 0, tradeCount: 0, mostRecentMs: 0,
        };
      }
      const prev = agg.senators.get(senator) || { value: 0, party, count: 0 };
      prev.value += value;
      prev.count += 1;
      agg.senators.set(senator, prev);
      if (party !== "U") agg.parties.add(party);
      agg.chambers.add(chamber);
      agg.totalValue += value;
      agg.tradeCount += 1;
      if (refMs > agg.mostRecentMs) agg.mostRecentMs = refMs;
      totalTrades += 1;
      senatorSet.add(senator);
    }

    const universeKeys = Object.keys(byT);
    console.log("universe=" + universeKeys.length + " purchases=" + totalTrades);
    if (universeKeys.length === 0) { console.log("No purchases — abort"); return; }

    const eligible = [];
    for (const k of universeKeys) {
      const a = byT[k];
      const senatorCount = a.senators.size;
      if (senatorCount < 2) continue;
      if (a.totalValue < 50000) continue;
      a.senatorCount = senatorCount;
      a.partyCount = a.parties.size;
      a.chamberCount = a.chambers.size;
      a.hoursSinceLast = (now - a.mostRecentMs) / HOUR;
      let topSenator = "—", topParty = "U", topVal = -1;
      for (const [name, info] of a.senators.entries()) {
        if (info.value > topVal) { topVal = info.value; topSenator = name; topParty = info.party; }
      }
      a.topSenator = topSenator;
      a.topParty = topParty;
      eligible.push(a);
    }
    console.log("eligible=" + eligible.length);
    if (eligible.length < 5) { console.log("Warning: <5 eligible — abort"); return; }

    const breadthVals = eligible.map(s => s.senatorCount);
    const sizeVals = eligible.map(s => Math.log10(Math.max(1, s.totalValue)));
    const freshVals = eligible.map(s => -s.hoursSinceLast);

    const bMin = Math.min(...breadthVals), bMax = Math.max(...breadthVals);
    const zMin = Math.min(...sizeVals), zMax = Math.max(...sizeVals);
    const fMin = Math.min(...freshVals), fMax = Math.max(...freshVals);

    function nrm(v, lo, hi) {
      if (hi === lo) return 0.5;
      return clamp01((v - lo) / (hi - lo));
    }

    for (const s of eligible) {
      s.breadthNorm = nrm(s.senatorCount, bMin, bMax);
      s.sizeNorm = nrm(Math.log10(Math.max(1, s.totalValue)), zMin, zMax);
      s.freshNorm = nrm(-s.hoursSinceLast, fMin, fMax);
      s.composite = 0.4 * s.breadthNorm + 0.4 * s.sizeNorm + 0.2 * s.freshNorm;
    }

    const compMin = Math.min(...eligible.map(s => s.composite));
    const compMax = Math.max(...eligible.map(s => s.composite));
    for (const s of eligible) {
      const t = (compMax === compMin) ? 1 : (s.composite - compMin) / (compMax - compMin);
      s.score = Math.max(0, Math.min(100, Math.round(45 + 50 * t)));
      s.breadthScoreDisp = Math.round(100 * s.breadthNorm);
      s.sizeScoreDisp = Math.round(100 * s.sizeNorm);
      s.freshnessScoreDisp = Math.round(100 * s.freshNorm);
      s.band = s.score >= 80 ? "elite" : s.score >= 70 ? "strong" : s.score >= 60 ? "average" : "weak";
    }

    eligible.sort((a, b) => b.score - a.score);
    const top = eligible.slice(0, 40);

    for (const s of top) {
      try {
        const d = arraysGet("/api/v1/stocks/company/detail", { symbol: s.ticker });
        const c = d && Array.isArray(d.data) && d.data.length ? d.data[0] : null;
        if (c) {
          s.name = c.name || s.ticker;
          s.sector = c.sector || "Unknown";
          s.industry = c.industry || "Unknown";
          s.marketCap = +c.market_cap || 0;
        } else {
          s.name = s.ticker; s.sector = "Unknown"; s.industry = "Unknown"; s.marketCap = 0;
        }
      } catch (e) {
        s.name = s.ticker; s.sector = "Unknown"; s.industry = "Unknown"; s.marketCap = 0;
      }
    }

    const senatorCountsSorted = top.map(s => s.senatorCount).sort((a, b) => a - b);
    const valuesSorted = top.map(s => s.totalValue).sort((a, b) => a - b);
    const basketSenatorCountP75 = senatorCountsSorted.length
      ? senatorCountsSorted[Math.floor(0.75 * (senatorCountsSorted.length - 1))] : 0;
    const basketValueP75 = valuesSorted.length
      ? valuesSorted[Math.floor(0.75 * (valuesSorted.length - 1))] : 0;

    function computeFlags(s) {
      const flags = [];
      if (s.tradeCount < 2) flags.push({ label: "Single Trade", tier: "hard" });
      if (s.hoursSinceLast > 30 * 24) flags.push({ label: "Stale Cluster", tier: "soft" });
      if (s.partyCount < 2) flags.push({ label: "Single Party", tier: "soft" });
      if (senatorCountsSorted.length >= 20 && s.senatorCount >= basketSenatorCountP75)
        flags.push({ label: "Broad Cluster", tier: "soft" });
      if (valuesSorted.length >= 20 && s.totalValue >= basketValueP75)
        flags.push({ label: "Heavy Volume", tier: "soft" });
      const hard = flags.find(f => f.tier === "hard");
      const soft = flags.find(f => f.tier === "soft");
      let flagTier = "clean", flagLabel = "—";
      if (hard) { flagTier = "hard"; flagLabel = hard.label; }
      else if (soft) { flagTier = "soft"; flagLabel = soft.label; }
      return { flagTier, flagLabel, flagsCsv: flags.map(f => f.label).join(",") };
    }

    const r2 = (v) => v != null ? Math.round(v * 100) / 100 : 0;

    const rankings = top.map((s, i) => {
      const fl = computeFlags(s);
      return {
        date: now, rank: i + 1, ticker: s.ticker, name: s.name || s.ticker,
        sector: s.sector || "Unknown", industry: s.industry || "Unknown",
        score: s.score, band: s.band,
        senatorCount: s.senatorCount,
        totalValueUsd: Math.round(s.totalValue),
        hoursSinceLast: r2(s.hoursSinceLast),
        partyCount: s.partyCount,
        chamberCount: s.chamberCount,
        tradeCount: s.tradeCount,
        marketCap: Math.round(s.marketCap || 0),
        topSenator: s.topSenator || "—",
        topParty: s.topParty || "U",
        breadthScore: s.breadthScoreDisp,
        sizeScore: s.sizeScoreDisp,
        freshnessScore: s.freshnessScoreDisp,
        flagTier: fl.flagTier,
        flagLabel: fl.flagLabel,
        flagsCsv: fl.flagsCsv,
      };
    });
    await ctx.self.ts("screener", "rankings").append(rankings);

    const avgScore = top.length ? top.reduce((a, x) => a + x.score, 0) / top.length : 0;
    const topSenatorMap = {};
    for (const s of top) {
      for (const [name, info] of s.senators.entries()) {
        const cur = topSenatorMap[name] || { value: 0, party: info.party };
        cur.value += info.value;
        topSenatorMap[name] = cur;
      }
    }
    let basketTopSenator = "—", basketTopParty = "U", best = -1;
    for (const [name, info] of Object.entries(topSenatorMap)) {
      if (info.value > best) { best = info.value; basketTopSenator = name; basketTopParty = info.party; }
    }

    await ctx.self.ts("screener", "summary").append([{
      date: now,
      totalScreened: universeKeys.length,
      totalEligible: eligible.length,
      totalPassed: top.length,
      avgScore: r2(avgScore),
      totalSenators: senatorSet.size,
      totalTrades: totalTrades,
      topSenator: basketTopSenator,
      topParty: basketTopParty,
      lastUpdated: new Date(now).toISOString(),
      basketSenatorCountP75: basketSenatorCountP75,
      basketValueP75: Math.round(basketValueP75),
      basketValidCount: top.length,
    }]);

    if (_overrideNow) {
      console.log("BACKFILL mode: skipping K-line fetch");
    } else {
      const klStateRaw = await ctx.kv.load("klState");
      const klState = klStateRaw ? JSON.parse(klStateRaw) : {};
      const sixtyDaysAgoSec = Math.floor((now - 60 * DAY) / 1000);
      const nowSec = Math.floor(now / 1000);

      const klineRecords = [];
      const newKlState = {};
      let klSuccess = 0, klFail = 0;
      const newTickers = top.filter(s => !klState[s.ticker]).map(s => s.ticker);
      const firstRun = newTickers.length > 0 && Object.keys(klState).length === 0;

      for (const s of top) {
        const isNew = !klState[s.ticker];
        let wmSec;
        if (isNew && firstRun) wmSec = sixtyDaysAgoSec;
        else if (isNew) wmSec = nowSec - 86400;
        else wmSec = klState[s.ticker];
        const startSec = wmSec + 1;
        if (startSec >= nowSec) { newKlState[s.ticker] = wmSec; continue; }
        try {
          const kr = arraysGet("/api/v1/stocks/kline", {
            symbol: s.ticker, start_time: startSec, end_time: nowSec, interval: "1d", limit: 10000,
          });
          if (kr && Array.isArray(kr.data) && kr.data.length > 0) {
            // HTTP returns newest-first; reverse to oldest-first.
            const bars = kr.data.slice().reverse();
            let maxSec = wmSec;
            for (const b of bars) {
              const barSec = b.time_open;
              if (barSec > wmSec) {
                klineRecords.push({
                  date: barSec * 1000, ticker: s.ticker,
                  open: b.price_open, high: b.price_high, low: b.price_low,
                  close: b.price_close, volume: b.volume_traded,
                });
                if (barSec > maxSec) maxSec = barSec;
              }
            }
            newKlState[s.ticker] = maxSec;
            klSuccess++;
          } else {
            newKlState[s.ticker] = wmSec;
          }
        } catch (e) {
          newKlState[s.ticker] = wmSec;
          klFail++;
        }
      }
      if (klineRecords.length > 0) await ctx.self.ts("screener", "klines").append(klineRecords);
      await ctx.kv.put("klState", JSON.stringify(newKlState));
      console.log("K-line bars appended: " + klineRecords.length + " (ok=" + klSuccess + " fail=" + klFail + ")");
    }

    console.log("Done! Top 5: " + top.slice(0, 5).map(s => s.ticker + "=" + s.score).join(", "));
  });
})();
