const { Feed, feedPath, makeDoc, num, str } = require("@alva/feed");
const http = require("net/http");
const secret = require("secret-manager");

const ARRAYS_JWT = secret.loadPlaintext("ARRAYS_JWT");
const ARRAYS_BASE = "https://data-tools.prd.space.id";
const ARRAYS_HEADERS = { Authorization: "Bearer " + ARRAYS_JWT };

async function arraysGet(path, params) {
  const qs = Object.keys(params)
    .filter((k) => params[k] !== undefined && params[k] !== null)
    .map((k) => encodeURIComponent(k) + "=" + encodeURIComponent(params[k]))
    .join("&");
  const url = ARRAYS_BASE + path + (qs ? "?" + qs : "");
  const r = await http.fetch(url, { headers: ARRAYS_HEADERS });
  if (r.status < 200 || r.status >= 300) throw new Error("HTTP " + r.status + " " + path);
  return JSON.parse(await r.text());
}

// ─── AI Bottleneck — quant feed ───
//
// Single fixed thesis: AI buildout is constrained across three supply-side
// dimensions — Power, Compute, Deployment. The basket tracks names exposed
// to those three constraints. No stage migration, no discovery layer —
// this is a pure tracker.
//
// Frozen field names per thesis template v1.6.0:
//   id        Uppercase ticker (not ticker/symbol/code)
//   layer     Member grouping — here: "Power" | "Compute" | "Deployment"
//   sentiment Title Case (Bull/Bear/Neutral/Ambiguous) — used in narrative only
//   category  Frozen enum — used in narrative only

const BASKET = [
  // Power — what AI has to plug into
  { id:"GEV",  name:"GE Vernova",             layer:"Power",
    role:"Gas turbines and nuclear services — the single most cited supply constraint in hyperscaler power planning.",
    why:"Gas turbine backlog sold through 2028; nuclear-services optionality.",
    miss:"Market conflates turbines with nuclear — separately paced businesses.",
    breaks:"Two straight quarters without a new slot booking announcement." },
  { id:"CEG",  name:"Constellation Energy",   layer:"Power",
    role:"Nuclear fleet already monetized via hyperscaler PPAs — the template, not the experiment.",
    why:"Anchor deals with Microsoft/Meta; PPA floors compound with inflation.",
    miss:"PPA floor-price duration underpriced; contracts escalate.",
    breaks:"Nuclear restart timelines slip past 2028." },
  { id:"VST",  name:"Vistra",                 layer:"Power",
    role:"Gas peakers plus nuclear toehold — the boring truth that gas runs the 2 pm AI peak.",
    why:"Peaker spark spreads reflect the new load-curve shape, not mid-cycle.",
    miss:"Street still valuing peakers at mid-cycle spark spreads.",
    breaks:"Peaker spark spreads mean-revert inside 12 months." },
  { id:"ETN",  name:"Eaton",                  layer:"Power",
    role:"Electrical equipment sold to every data-center build — pricing power without volume stretch.",
    why:"Electrical backlog through 2027; switchgear niches the tightest piece.",
    miss:"Switchgear sub-segment tighter than consolidated mix implies.",
    breaks:"Credible competitor breaks the switchgear niche." },
  { id:"HUBB", name:"Hubbell",                layer:"Power",
    role:"Utility-grade T&D components — the dull cousin to Eaton with the same backlog.",
    why:"Distribution-transformer spend-per-mile still understated.",
    miss:"HVDC routing not quite as threatening to distribution as the bear case implies.",
    breaks:"HVDC architectures quietly skip distribution-level volume." },

  // Compute — what AI runs on
  { id:"NVDA", name:"NVIDIA",                 layer:"Compute",
    role:"The GPU itself — the binding constraint until a second supplier proves it can ship at scale.",
    why:"Blackwell + Rubin allocation remains oversubscribed through 2026.",
    miss:"Networking attach rate (NVLink/Mellanox) still under-modeled.",
    breaks:"AVGO or custom ASIC wins >30% of hyperscaler training share." },
  { id:"AVGO", name:"Broadcom",               layer:"Compute",
    role:"Custom ASICs for hyperscalers — the only credible price-discipline on NVIDIA.",
    why:"Google TPU + Meta/Microsoft custom silicon pipeline building.",
    miss:"Custom silicon revenue ramp not yet in consensus FY27 estimates.",
    breaks:"Hyperscalers slow custom-silicon adoption; NVDA re-wins share." },
  { id:"MU",   name:"Micron",                 layer:"Compute",
    role:"HBM — the memory that feeds the GPU. Pricing cycle now mostly a function of allocation, not commodity DRAM.",
    why:"HBM3E/4 allocation sold out; DRAM capacity discipline intact.",
    miss:"HBM mix contribution to gross margin still underestimated.",
    breaks:"Samsung qualifies HBM3E at a major hyperscaler; price discipline cracks." },
  { id:"TSM",  name:"Taiwan Semiconductor",   layer:"Compute",
    role:"Leading-edge fab capacity — the facility every compute customer competes for.",
    why:"3nm / 2nm capacity oversubscribed; CoWoS packaging the long-lead piece.",
    miss:"CoWoS capacity expansion is capex-gated, not demand-gated.",
    breaks:"Intel Foundry or Samsung closes the process gap meaningfully." },
  { id:"ASML", name:"ASML Holding",           layer:"Compute",
    role:"EUV + High-NA lithography — the fab's bottleneck. Monopoly on the physics.",
    why:"High-NA ramp still early; installed-base service revenue compounds.",
    miss:"Service and upgrades line becoming >40% of revenue; steady-state margin higher.",
    breaks:"A credible non-EUV path to sub-2nm emerges (Canon nano-imprint scales)." },

  // Deployment — what puts AI in the physical world
  { id:"PWR",  name:"Quanta Services",        layer:"Deployment",
    role:"Largest electrical EPC in North America — sells the scarcity of skilled crews itself.",
    why:"Backlog coverage extends; crew-hiring trails demand by ~18 months.",
    miss:"PWR is a labor aggregator, not a contractor — moat priced in crews.",
    breaks:"Two-year backlog coverage drops below 2× annual revenue." },
  { id:"FIX",  name:"Comfort Systems USA",    layer:"Deployment",
    role:"Mechanical contractor for data-center cooling and industrial HVAC — the story nobody priced three years ago.",
    why:"Data-center + industrial facility mix has structurally re-rated margin.",
    miss:"Gross margin step-up durable; Street still models blended 20%.",
    breaks:"Data-center starts slow for 2+ quarters or mix reverts." },
  { id:"STRL", name:"Sterling Infrastructure", layer:"Deployment",
    role:"E-infrastructure — the pad that the data-center is built on. Sells the site before the EPC arrives.",
    why:"E-infrastructure mix outgrowing headline revenue.",
    miss:"Segment-level margin not visible in consolidated reporting.",
    breaks:"Data-center site-start data rolls over." },
  { id:"EME",  name:"EMCOR Group",            layer:"Deployment",
    role:"Mechanical + electrical contractor with data-center exposure — the other FIX.",
    why:"Industrial mix + data-center work compounding.",
    miss:"Backlog quality (data-center vs generic commercial) not disclosed; probably better than average.",
    breaks:"Commercial real-estate weakness bleeds into the non-DC book." },
  { id:"EQIX", name:"Equinix",                layer:"Deployment",
    role:"Data-center REIT — when the bottleneck is binding, its pricing power IS the signal.",
    why:"Renewal spreads accelerating; new-build constrained by power + permits.",
    miss:"AI capex concentration at Equinix campuses under-modeled.",
    breaks:"Material slowdown in renewal spreads for two consecutive quarters." },
];

// Benchmarks
const BENCHMARKS = [
  { id:"PAVE", label:"PAVE · US Infrastructure" },
  { id:"SMH",  label:"SMH · Semiconductors" },
  { id:"SPY",  label:"SPY · S&P 500" },
];
const ALL = BASKET.map((b)=> b.id).concat(BENCHMARKS.map((b)=> b.id));

const LAYER_DEFS = {
  Power:      "What AI has to plug into — turbines, nuclear, grid, switchgear.",
  Compute:    "What AI runs on — GPUs, custom ASICs, HBM, fabs, lithography.",
  Deployment: "What puts AI in the physical world — EPC crews, site prep, data-center real estate."
};

// ─── Feed ───
const feed = new Feed({ path: feedPath("ai-bottleneck") });

feed.def("basket", {
  tickers: makeDoc("Basket Tickers", "Latest per-member snapshot. id = uppercase ticker; layer = Power|Compute|Deployment.", [
    str("id"), str("name"), str("layer"), str("role"),
    num("mcap"), num("pe"), num("pe_pct"), num("rev_yoy"),
    num("price"), num("ret_1d"), num("ret_7d"), num("ret_1m"), num("ret_3m"), num("ret_ytd"), num("ret_1y"),
    num("alpha_pave"), num("alpha_smh"), num("alpha_spy"), str("val_tag"),
    str("why"), str("miss"), str("breaks"),
    str("prices_json"),
  ]),
  equity: makeDoc("Basket Equity Curve", "Daily equal-weight cumulative index (base 100 since Jan 1)", [
    num("basket"), num("pave"), num("smh"), num("spy"),
  ]),
  horizons: makeDoc("Horizon Returns", "Basket vs benchmarks by window", [
    str("window"), num("basket"), num("pave"), num("smh"), num("spy"),
    num("alpha_pave"), num("alpha_smh"), num("alpha_spy"),
  ]),
  layer_perf: makeDoc("Layer Performance", "Equal-weight window return by layer", [
    str("layer"), str("tagline"),
    num("avg_3m"), num("avg_ytd"), num("count"),
  ]),
  summary: makeDoc("Basket Summary", "Aggregate metrics", [
    num("basket_ytd"), num("basket_3m"), num("basket_1m"),
    num("pave_ytd"), num("smh_ytd"), num("spy_ytd"),
    num("alpha_pave_ytd"), num("alpha_smh_ytd"), num("alpha_spy_ytd"),
    num("breadth_up_ytd"), num("total_members"),
  ]),
  attribution: makeDoc("Benchmark Attribution", "Regression stats of basket daily return on benchmark daily return", [
    str("benchmark"),
    num("alpha"),          // annualized %
    num("beta"),
    num("r2"),
    num("corr"),
    num("n"),              // sample size (days)
  ]),
  change_log: makeDoc("Basket Change Log", "Composition changes over time", [
    str("action"),         // "initial" | "added" | "removed" | "relayered"
    str("id"),
    str("from_layer"),
    str("to_layer"),
    str("reason"),
  ]),
});

// ─── Helpers ───
function r1(v){ return Math.round(v*10)/10; }
function r0(v){ return Math.round(v); }

async function loadDaily(ticker, startSec, endSec) {
  try {
    const j = await arraysGet("/api/v1/stocks/kline", {
      symbol: ticker, start_time: startSec, end_time: endSec, interval: "1d", limit: 10000,
    });
    if (!j || !Array.isArray(j.data)) return [];
    // HTTP returns newest-first; reverse to oldest-first
    const out = [];
    for (let i = j.data.length - 1; i >= 0; i--) {
      const b = j.data[i];
      out.push({
        date: b.time_open * 1000,
        endTime: b.time_close * 1000,
        open: b.price_open,
        high: b.price_high,
        low: b.price_low,
        close: b.price_close,
        volume: b.volume_traded,
      });
    }
    return out;
  } catch (e) { console.log(`OHLCV err ${ticker}: ${e.message}`); return []; }
}

async function metricSeries(path, params) {
  try {
    const j = await arraysGet(path, params);
    if (!j || !Array.isArray(j.data) || !j.data.length) return [];
    return j.data[0].values || [];
  } catch (e) { console.log(`metric err ${path}: ${e.message}`); return []; }
}

async function latestMarketMetric(symbol, indicator, startMs, endMs) {
  const vals = await metricSeries("/api/v1/stocks/market-metrics", {
    symbol, indicator, interval: "1d",
    start_time: Math.floor(startMs / 1000), end_time: Math.floor(endMs / 1000),
  });
  if (!vals.length) return null;
  return vals[vals.length - 1].value;
}

async function latestFinancialMetric(symbol, metric, startMs, endMs) {
  const vals = await metricSeries("/api/v1/stocks/financial-metrics", {
    symbol, metric,
    start_time: Math.floor(startMs / 1000), end_time: Math.floor(endMs / 1000),
  });
  if (!vals.length) return null;
  return vals[vals.length - 1].value;
}

async function loadPeSeries(sym, startMs, endMs) {
  const vals = await metricSeries("/api/v1/stocks/market-metrics", {
    symbol: sym, indicator: "PE_RATIO", interval: "1d",
    start_time: Math.floor(startMs / 1000), end_time: Math.floor(endMs / 1000),
  });
  const out = [];
  for (let i = 0; i < vals.length; i++) {
    const v = vals[i].value;
    if (v != null && v > 0 && v < 500) out.push(v);
  }
  return out;
}

function percentileRank(series, cur) {
  if (!series || !series.length || cur == null || cur <= 0) return null;
  let below = 0;
  for (let i=0;i<series.length;i++) if (series[i] <= cur) below++;
  return Math.round((below / series.length) * 100);
}
function closeAtOrBefore(bars, targetMs) {
  let last = null;
  for (let i=0;i<bars.length;i++){
    if (bars[i].date <= targetMs) last = bars[i]; else break;
  }
  return last ? last.close : null;
}
function pct(fromV, toV) {
  if (!fromV || !toV) return null;
  return (toV/fromV - 1) * 100;
}
function classifyValByPct(pePct) {
  if (pePct == null) return "Fair";
  if (pePct <= 30) return "Cheap";
  if (pePct >= 70) return "Rich";
  return "Fair";
}

// ─── Main ───
(async () => {
  await feed.run(async (ctx)=> {
    const now = Date.now();
    const nowSec = Math.floor(now/1000);
    const today = new Date(); today.setUTCHours(0,0,0,0);
    const todayMs = today.getTime();

    const lookbackDays = 400;
    const startSec = nowSec - lookbackDays * 86400;
    const jan1Ms = Date.UTC(2026, 0, 1);

    // ─── Fetch all OHLCV in parallel ───
    const barsArr = await Promise.all(ALL.map(t => loadDaily(t, startSec, nowSec)));
    const bars = {};
    for (let i = 0; i < ALL.length; i++) bars[ALL[i]] = barsArr[i];

    // ─── Fundamentals + P/E percentile in parallel ───
    const m30ms = now - 30*86400*1000;
    const m400ms = now - 400*86400*1000;
    const fiveYrMs = now - 5 * 365 * 86400 * 1000;

    const fundamentals = await Promise.all(BASKET.map(async (b) => {
      const [mcapV, peV, revYoyV, peHist] = await Promise.all([
        latestMarketMetric(b.id, "MARKET_CAP", m30ms, now),
        latestMarketMetric(b.id, "PE_RATIO", m30ms, now),
        latestFinancialMetric(b.id, "REVENUE_GROWTH_YOY_TTM", m400ms, now),
        loadPeSeries(b.id, fiveYrMs, now),
      ]);
      return { id: b.id, mcap: mcapV, pe: peV, revYoy: revYoyV, pePct: percentileRank(peHist, peV) };
    }));
    const mcap = {}, pe = {}, pePct = {}, revYoy = {};
    for (const f of fundamentals) {
      mcap[f.id] = f.mcap; pe[f.id] = f.pe; pePct[f.id] = f.pePct; revYoy[f.id] = f.revYoy;
    }

    // ─── Per-member returns by horizon ───
    const horizonDays = { "1d":1, "7d":7, "1m":30, "3m":90, "1y":365 };
    const retBy = {};
    for (let i=0;i<ALL.length;i++){
      const sym = ALL[i];
      const b = bars[sym];
      if (!b || b.length<2) { retBy[sym] = {}; continue; }
      const cur = b[b.length-1].close;
      const row = {};
      for (const w in horizonDays){
        const target = now - horizonDays[w]*86400*1000;
        const prev = closeAtOrBefore(b, target);
        row[w] = pct(prev, cur);
      }
      let ytdBase = null;
      for (let k=0;k<b.length;k++){ if (b[k].date >= jan1Ms) { ytdBase = b[k].close; break; } }
      row.ytd = pct(ytdBase, cur);
      retBy[sym] = row;
    }

    // ─── Member records ───
    const memberRecords = [];
    for (let i=0;i<BASKET.length;i++){
      const b = BASKET[i];
      const curClose = (bars[b.id] && bars[b.id].length) ? bars[b.id][bars[b.id].length-1].close : null;
      const r = retBy[b.id] || {};
      const ytd = r.ytd;
      const alphaPave = (ytd != null && retBy.PAVE && retBy.PAVE.ytd != null) ? ytd - retBy.PAVE.ytd : null;
      const alphaSmh  = (ytd != null && retBy.SMH  && retBy.SMH.ytd  != null) ? ytd - retBy.SMH.ytd  : null;
      const alphaSpy  = (ytd != null && retBy.SPY  && retBy.SPY.ytd  != null) ? ytd - retBy.SPY.ytd  : null;

      const bb = bars[b.id] || [];
      const last180 = bb.slice(Math.max(0, bb.length - 180));
      const pricesEncoded = JSON.stringify(last180.map((bar)=> [bar.date, +bar.close.toFixed(2)]));

      memberRecords.push({
        date: todayMs,
        id: b.id, name: b.name, layer: b.layer, role: b.role,
        mcap: mcap[b.id] != null ? r0(mcap[b.id]/1e9) : 0,
        pe: pe[b.id] != null ? r1(pe[b.id]) : 0,
        pe_pct: pePct[b.id] != null ? pePct[b.id] : -1,
        rev_yoy: revYoy[b.id] != null ? r1(revYoy[b.id]) : 0,
        price: curClose != null ? r1(curClose) : 0,
        ret_1d: r["1d"] != null ? r1(r["1d"]) : 0,
        ret_7d: r["7d"] != null ? r1(r["7d"]) : 0,
        ret_1m: r["1m"] != null ? r1(r["1m"]) : 0,
        ret_3m: r["3m"] != null ? r1(r["3m"]) : 0,
        ret_ytd: ytd != null ? r1(ytd) : 0,
        ret_1y: r["1y"] != null ? r1(r["1y"]) : 0,
        alpha_pave: alphaPave != null ? r1(alphaPave) : 0,
        alpha_smh:  alphaSmh  != null ? r1(alphaSmh)  : 0,
        alpha_spy:  alphaSpy  != null ? r1(alphaSpy)  : 0,
        val_tag: classifyValByPct(pePct[b.id]),
        why: b.why, miss: b.miss, breaks: b.breaks,
        prices_json: pricesEncoded,
      });
    }
    await ctx.self.ts("basket","tickers").append(memberRecords);

    // ─── Equity curve (equal-weight) ───
    const paveBars = bars.PAVE;
    const smhBars = bars.SMH;
    const spyBars = bars.SPY;
    const dayMap = {};
    if (paveBars?.length) {
      for (let k=0;k<paveBars.length;k++){
        if (paveBars[k].date < jan1Ms) continue;
        dayMap[paveBars[k].date] = { pave:paveBars[k].close, smh:null, spy:null };
      }
    }
    if (smhBars) for (let k=0;k<smhBars.length;k++){ if (dayMap[smhBars[k].date]) dayMap[smhBars[k].date].smh = smhBars[k].close; }
    if (spyBars) for (let k=0;k<spyBars.length;k++){ if (dayMap[spyBars[k].date]) dayMap[spyBars[k].date].spy = spyBars[k].close; }

    const baseByT = {};
    for (let i=0;i<BASKET.length;i++){
      const bb = bars[BASKET[i].id];
      if (!bb) continue;
      for (let k=0;k<bb.length;k++){ if (bb[k].date >= jan1Ms) { baseByT[BASKET[i].id] = bb[k].close; break; } }
    }
    const days = Object.keys(dayMap).map(Number).sort((a,b)=> a-b);
    let basePave=null, baseSmh=null, baseSpy=null;
    const equityRecords = [];
    for (let d=0; d<days.length; d++){
      const dm = days[d];
      const rec = dayMap[dm];
      let sumRet = 0, covered = 0;
      for (let i=0;i<BASKET.length;i++){
        const t = BASKET[i].id;
        const bb2 = bars[t];
        if (!bb2 || !baseByT[t]) continue;
        const closeAt = closeAtOrBefore(bb2, dm);
        if (!closeAt) continue;
        sumRet += ((closeAt / baseByT[t]) - 1) * 100;
        covered++;
      }
      if (!covered) continue;
      if (basePave == null && rec.pave) basePave = rec.pave;
      if (baseSmh  == null && rec.smh)  baseSmh  = rec.smh;
      if (baseSpy  == null && rec.spy)  baseSpy  = rec.spy;
      equityRecords.push({
        date: dm,
        basket: r1(100 + sumRet/covered),
        pave: (basePave && rec.pave) ? r1(rec.pave/basePave*100) : 0,
        smh:  (baseSmh  && rec.smh)  ? r1(rec.smh/baseSmh*100)   : 0,
        spy:  (baseSpy  && rec.spy)  ? r1(rec.spy/baseSpy*100)   : 0,
      });
    }
    if (equityRecords.length) await ctx.self.ts("basket","equity").append(equityRecords);

    // ─── Horizon returns ───
    const winKeys = ["1d","7d","1m","3m","ytd","1y"];
    const horizonRecs = [];
    for (let w=0;w<winKeys.length;w++){
      const key = winKeys[w];
      let s = 0, n = 0;
      for (let i=0;i<BASKET.length;i++){
        const v = retBy[BASKET[i].id]?.[key];
        if (v != null) { s += v; n++; }
      }
      const basketV = n ? s/n : null;
      const paveV = retBy.PAVE?.[key];
      const smhV  = retBy.SMH?.[key];
      const spyV  = retBy.SPY?.[key];
      horizonRecs.push({
        date: todayMs, window: key,
        basket: basketV != null ? r1(basketV) : 0,
        pave: paveV != null ? r1(paveV) : 0,
        smh:  smhV  != null ? r1(smhV)  : 0,
        spy:  spyV  != null ? r1(spyV)  : 0,
        alpha_pave: (basketV != null && paveV != null) ? r1(basketV - paveV) : 0,
        alpha_smh:  (basketV != null && smhV  != null) ? r1(basketV - smhV)  : 0,
        alpha_spy:  (basketV != null && spyV  != null) ? r1(basketV - spyV)  : 0,
      });
    }
    await ctx.self.ts("basket","horizons").append(horizonRecs);

    // ─── Layer performance ───
    const layerKeys = ["Power","Compute","Deployment"];
    const layerRecs = [];
    for (let k=0;k<layerKeys.length;k++){
      const L = layerKeys[k];
      const members = BASKET.filter((b)=> b.layer === L);
      const r3m = [], rYtd = [];
      for (let m=0;m<members.length;m++){
        const rr = retBy[members[m].id] || {};
        if (rr["3m"] != null) r3m.push(rr["3m"]);
        if (rr.ytd != null) rYtd.push(rr.ytd);
      }
      const avg3m = r3m.length ? r3m.reduce((a,b)=> a+b,0)/r3m.length : 0;
      const avgYtd = rYtd.length ? rYtd.reduce((a,b)=> a+b,0)/rYtd.length : 0;
      layerRecs.push({
        date: todayMs, layer: L, tagline: LAYER_DEFS[L],
        avg_3m: r1(avg3m), avg_ytd: r1(avgYtd), count: members.length,
      });
    }
    await ctx.self.ts("basket","layer_perf").append(layerRecs);

    // ─── Summary ───
    function avg(arr){ if (!arr.length) return 0; return arr.reduce((a,b)=> a+b,0)/arr.length; }
    const baskYtd = avg(BASKET.map((b)=> retBy[b.id]?.ytd).filter((v)=> v!=null));
    const bask3m  = avg(BASKET.map((b)=> retBy[b.id]?.["3m"]).filter((v)=> v!=null));
    const bask1m  = avg(BASKET.map((b)=> retBy[b.id]?.["1m"]).filter((v)=> v!=null));
    const paveYtd = retBy.PAVE?.ytd || 0;
    const smhYtd  = retBy.SMH?.ytd || 0;
    const spyYtd  = retBy.SPY?.ytd || 0;
    const breadth = BASKET.filter((b)=> { const v = retBy[b.id]?.ytd; return v != null && v > 0; }).length;
    await ctx.self.ts("basket","summary").append([{
      date: todayMs,
      basket_ytd: r1(baskYtd), basket_3m: r1(bask3m), basket_1m: r1(bask1m),
      pave_ytd: r1(paveYtd), smh_ytd: r1(smhYtd), spy_ytd: r1(spyYtd),
      alpha_pave_ytd: r1(baskYtd - paveYtd),
      alpha_smh_ytd:  r1(baskYtd - smhYtd),
      alpha_spy_ytd:  r1(baskYtd - spyYtd),
      breadth_up_ytd: breadth, total_members: BASKET.length,
    }]);

    // ─── Benchmark attribution ───
    function dailyRets(field){
      const out = [];
      for (let i=1;i<equityRecords.length;i++){
        const prev = equityRecords[i-1][field];
        const cur = equityRecords[i][field];
        if (prev && cur && prev > 0 && cur > 0) out.push(cur/prev - 1);
      }
      return out;
    }
    function attribution(bench){
      let b = dailyRets('basket');
      let m = dailyRets(bench);
      const n = Math.min(b.length, m.length);
      if (n < 20) return null;
      b = b.slice(-n); m = m.slice(-n);
      let mb = 0, mm = 0;
      for (let i=0;i<n;i++){ mb += b[i]; mm += m[i]; }
      mb /= n; mm /= n;
      let covBM = 0, varM = 0, varB = 0;
      for (let i=0;i<n;i++){
        covBM += (b[i]-mb)*(m[i]-mm);
        varM  += (m[i]-mm)*(m[i]-mm);
        varB  += (b[i]-mb)*(b[i]-mb);
      }
      covBM /= n; varM /= n; varB /= n;
      const beta = varM > 0 ? covBM / varM : 0;
      const corr = (varM > 0 && varB > 0) ? covBM / Math.sqrt(varM * varB) : 0;
      const r2 = corr * corr;
      const alphaAnnual = (mb - beta * mm) * 252 * 100;
      return { beta, corr, r2, alpha: alphaAnnual, n };
    }
    const attrRecs = [];
    for (const bench of ["pave","smh","spy"]){
      const a = attribution(bench);
      if (a) attrRecs.push({
        date: todayMs, benchmark: bench.toUpperCase(),
        alpha: r1(a.alpha), beta: +a.beta.toFixed(2),
        r2: +a.r2.toFixed(3), corr: +a.corr.toFixed(3), n: a.n,
      });
    }
    if (attrRecs.length) await ctx.self.ts("basket","attribution").append(attrRecs);

    // ─── Basket change log (kv-diff) ───
    function basketSig(arr){ return arr.map((b)=> `${b.id}:${b.layer}`).sort().join(','); }
    const curSig = basketSig(BASKET);
    const prevSig = await ctx.kv.load("basket_sig");
    const changeRecs = [];
    if (!prevSig){
      for (let i=0;i<BASKET.length;i++){
        changeRecs.push({
          date: todayMs, action:"initial", id:BASKET[i].id,
          from_layer:"", to_layer:BASKET[i].layer,
          reason:"Initial basket — AI Bottleneck v1.0.",
        });
      }
    } else if (prevSig !== curSig){
      const prevMap = {}, curMap = {};
      for (const s of prevSig.split(',')) { const p = s.split(':'); prevMap[p[0]] = p[1]; }
      for (const s of curSig.split(','))  { const p = s.split(':'); curMap[p[0]]  = p[1]; }
      for (const t in curMap){
        if (!prevMap[t]) changeRecs.push({ date:todayMs, action:"added", id:t, from_layer:"", to_layer:curMap[t], reason:"Added." });
        else if (prevMap[t] !== curMap[t]) changeRecs.push({ date:todayMs, action:"relayered", id:t, from_layer:prevMap[t], to_layer:curMap[t], reason:"Layer reclassified." });
      }
      for (const t in prevMap){
        if (!curMap[t]) changeRecs.push({ date:todayMs, action:"removed", id:t, from_layer:prevMap[t], to_layer:"", reason:"Removed." });
      }
    }
    if (changeRecs.length){
      await ctx.self.ts("basket","change_log").append(changeRecs);
      await ctx.kv.put("basket_sig", curSig);
    } else if (!prevSig){
      await ctx.kv.put("basket_sig", curSig);
    }

    console.log(`ai-bottleneck quant: ${memberRecords.length} members, ${equityRecords.length} equity days, ${horizonRecs.length} horizons, ${attrRecs.length} attributions, ${changeRecs.length} changelog.`);
  });
})();
