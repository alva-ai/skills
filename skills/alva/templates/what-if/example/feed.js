// Copper/Gold ratio recession signal — feed v1.0.0
// Remixed from @sheer-alva/copper-gold-ratio-recession-signal
// Daily copper/gold ratio using CPER / GLD since CPER inception (2011-11-15)
// Identifies 1-year-low events, computes forward SPX returns

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

const COOLDOWN_DAYS = 90;

const feed = new Feed({ path: feedPath("copper-gold-recession-signal") });

feed.def("series", {
  daily: makeDoc(
    "Daily copper/gold ratio over full history",
    "One row per trading day with ratio value",
    [str("date_iso"), num("ratio"), num("cper_close"), num("gld_close"), num("spy_close")]
  ),
});

feed.def("events", {
  rows: makeDoc(
    "1-year-low ratio events with forward SPX returns",
    "One row per new 1-year-low event + forward returns",
    [str("event_date"), num("ratio_at_event"), num("prior_1y_low"), num("prior_1y_high"), num("fwd_1m_pct"), num("fwd_3m_pct"), num("fwd_6m_pct"), num("fwd_12m_pct"), str("era_label")]
  ),
});

feed.def("summary", {
  stats: makeDoc("Summary stats","",[
    num("n_events"), num("latest_ratio"), str("latest_ratio_date"),
    num("median_fwd_1m_pct"), num("median_fwd_3m_pct"), num("median_fwd_6m_pct"), num("median_fwd_12m_pct"),
    num("mean_fwd_3m_pct"), num("n_positive_fwd_3m"),
    num("spx_baseline_3m_pct"), num("spx_baseline_12m_pct")
  ]),
});

async function fetchDaily(symbol, startSec) {
  const endSec = Math.floor(Date.UTC(2027,5,1)/1000);
  const j = await arraysGet("/api/v1/stocks/kline", {
    symbol, start_time: startSec, end_time: endSec, interval: "1d", limit: 10000,
  });
  if (!j || !Array.isArray(j.data)) return [];
  const out = [];
  for (let i = j.data.length - 1; i >= 0; i--) {
    const b = j.data[i];
    out.push({ date: b.time_open * 1000, close: b.price_close });
  }
  return out;
}

function eraFor(isoDate) {
  const y = parseInt(isoDate.slice(0,4),10);
  if (y <= 2008) return "Pre-GFC / GFC era";
  if (y <= 2013) return "Post-GFC recovery";
  if (y <= 2019) return "2010s low-rate era";
  if (y <= 2021) return "COVID era";
  return "2022-present rate-hike cycle";
}

(async () => {
  await feed.run(async (ctx) => {
    const CPER_START = Math.floor(Date.UTC(2011,10,15)/1000);
    const [cperBars, gldBars, spyBars] = await Promise.all([
      fetchDaily("CPER", CPER_START),
      fetchDaily("GLD", CPER_START),
      fetchDaily("SPY", CPER_START),
    ]);

    console.log("CPER bars:", cperBars.length, "GLD bars:", gldBars.length, "SPY bars:", spyBars.length);
    if (!cperBars.length || !gldBars.length || !spyBars.length) {
      console.log("ERROR: missing bars"); return;
    }

    function toMap(bars) {
      const m = new Map();
      for (const b of bars) m.set(new Date(b.date).toISOString().slice(0,10), b.close);
      return m;
    }
    const cperMap = toMap(cperBars);
    const gldMap = toMap(gldBars);
    const spyMap = toMap(spyBars);

    const dates = [...new Set([...cperMap.keys()].filter(d => gldMap.has(d) && spyMap.has(d)))].sort();
    console.log("aligned days:", dates.length, "first:", dates[0], "last:", dates[dates.length-1]);

    const series = [];
    for (const d of dates) {
      const cper = cperMap.get(d);
      const gld = gldMap.get(d);
      const spy = spyMap.get(d);
      const ratio = cper / gld;
      series.push({date_iso: d, ratio, cper, gld, spy});
    }

    const events = [];
    let lastIdx = -COOLDOWN_DAYS - 1;
    for (let i=252; i<series.length; i++) {
      let min = Infinity, max = -Infinity;
      for (let j=i-252; j<i; j++) {
        if (series[j].ratio < min) min = series[j].ratio;
        if (series[j].ratio > max) max = series[j].ratio;
      }
      if (series[i].ratio < min && (i - lastIdx) >= COOLDOWN_DAYS) {
        events.push({idx: i, ratio: series[i].ratio, prior_1y_low: min, prior_1y_high: max, date: series[i].date_iso});
        lastIdx = i;
      }
    }
    console.log("1yr-low events:", events.length);

    const runTs = Date.now();
    let seq = 0;

    const serRows = [];
    for (let i=0; i<series.length; i+=5) {
      const s = series[i];
      serRows.push({
        date: runTs+seq++,
        date_iso: s.date_iso,
        ratio: +s.ratio.toFixed(6),
        cper_close: +s.cper.toFixed(4),
        gld_close: +s.gld.toFixed(4),
        spy_close: +s.spy.toFixed(4),
      });
    }
    if (serRows.length) await ctx.self.ts("series","daily").append(serRows);
    console.log("series rows written:", serRows.length);

    const evRows = [];
    for (const ev of events) {
      const i = ev.idx;
      const base = series[i].spy;
      const horizonDays = {fwd_1m: 21, fwd_3m: 63, fwd_6m: 126, fwd_12m: 252};
      const rowFwd = {};
      for (const [k, d] of Object.entries(horizonDays)) {
        const j = i + d;
        if (j < series.length) rowFwd[k + "_pct"] = +((series[j].spy/base - 1)*100).toFixed(4);
        else rowFwd[k + "_pct"] = null;
      }
      evRows.push({
        date: runTs+seq++,
        event_date: ev.date,
        ratio_at_event: +ev.ratio.toFixed(6),
        prior_1y_low: +ev.prior_1y_low.toFixed(6),
        prior_1y_high: +ev.prior_1y_high.toFixed(6),
        ...rowFwd,
        era_label: eraFor(ev.date),
      });
    }
    if (evRows.length) await ctx.self.ts("events","rows").append(evRows);

    const baseline3m = [], baseline12m = [];
    for (let i=0; i<series.length-252; i+=21) {
      const b = series[i].spy;
      baseline3m.push((series[i+63].spy/b - 1)*100);
      baseline12m.push((series[i+252].spy/b - 1)*100);
    }
    const mean = a=>a.length?a.reduce((s,v)=>s+v,0)/a.length:null;
    const median = a=>{if(!a.length)return null;const s=[...a].sort((x,y)=>x-y);return s.length%2?s[(s.length-1)/2]:(s[s.length/2-1]+s[s.length/2])/2;};

    const fwd3 = evRows.map(r=>r.fwd_3m_pct).filter(v=>v!=null);
    const fwd1 = evRows.map(r=>r.fwd_1m_pct).filter(v=>v!=null);
    const fwd6 = evRows.map(r=>r.fwd_6m_pct).filter(v=>v!=null);
    const fwd12 = evRows.map(r=>r.fwd_12m_pct).filter(v=>v!=null);

    const stats = {
      date: runTs+seq++,
      n_events: events.length,
      latest_ratio: +series[series.length-1].ratio.toFixed(6),
      latest_ratio_date: series[series.length-1].date_iso,
      median_fwd_1m_pct: fwd1.length? +median(fwd1).toFixed(4) : null,
      median_fwd_3m_pct: fwd3.length? +median(fwd3).toFixed(4) : null,
      median_fwd_6m_pct: fwd6.length? +median(fwd6).toFixed(4) : null,
      median_fwd_12m_pct: fwd12.length? +median(fwd12).toFixed(4) : null,
      mean_fwd_3m_pct: fwd3.length? +mean(fwd3).toFixed(4) : null,
      n_positive_fwd_3m: fwd3.filter(v=>v>0).length,
      spx_baseline_3m_pct: baseline3m.length? +median(baseline3m).toFixed(4) : null,
      spx_baseline_12m_pct: baseline12m.length? +median(baseline12m).toFixed(4) : null,
    };
    console.log("summary:", JSON.stringify(stats));
    await ctx.self.ts("summary","stats").append([stats]);
  });
})();
