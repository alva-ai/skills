// SPY 50-day reclaim what-if feed v1.0.0
// Writes runtime data for an Alva what-if playbook.

const { Feed, feedPath, makeDoc, num, str } = require("@alva/feed");
const http = require("net/http");
const secret = require("secret-manager");

const ARRAYS_JWT = secret.loadPlaintext("ARRAYS_JWT");
const ARRAYS_BASE = "https://data-tools.prd.space.id";
const ARRAYS_HEADERS = { Authorization: "Bearer " + ARRAYS_JWT };

const FEED_NAME = "spy-50day-reclaim-what-if";
const SYMBOL = "SPY";
const START_SEC = Math.floor(Date.UTC(1993, 0, 29) / 1000);
const END_SEC = Math.floor(Date.UTC(2027, 0, 1) / 1000);
const COOLDOWN_DAYS = 21;
const BELOW_50D_DAYS = 5;
const HORIZONS = [
  { key: "fwd_week_pct", label: "A week later", days: 5 },
  { key: "fwd_month_pct", label: "A month later", days: 21 },
  { key: "fwd_three_months_pct", label: "Three months later", days: 63 },
  { key: "fwd_six_months_pct", label: "Six months later", days: 126 },
  { key: "fwd_year_pct", label: "A year later", days: 252 },
];
const DISPLAYED_HORIZON_LABELS = new Set(["A week later", "A month later", "Three months later", "A year later"]);

async function arraysGet(path, params) {
  const qs = Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== null)
    .map((key) => encodeURIComponent(key) + "=" + encodeURIComponent(params[key]))
    .join("&");
  const url = ARRAYS_BASE + path + (qs ? "?" + qs : "");
  const response = await http.fetch(url, { headers: ARRAYS_HEADERS });
  if (response.status < 200 || response.status >= 300) {
    throw new Error("HTTP " + response.status + " " + path);
  }
  return JSON.parse(await response.text());
}

function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values) {
  if (!values.length) return null;
  const sorted = values.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function pct(value) {
  return value == null ? null : +(value * 100).toFixed(4);
}

function round(value, digits) {
  if (value == null || !Number.isFinite(value)) return null;
  const p = Math.pow(10, digits);
  return Math.round(value * p) / p;
}

function toIsoDay(bar) {
  if (bar.time_period_start) return bar.time_period_start.slice(0, 10);
  return new Date(bar.time_open * 1000).toISOString().slice(0, 10);
}

const feed = new Feed({ path: feedPath(FEED_NAME) });

feed.def("series", {
  daily: makeDoc("SPY daily line", "Daily close, 200-day line, and signal markers", [
    str("date_iso"),
    num("close"),
    num("ma200"),
    num("is_signal"),
  ]),
});

feed.def("events", {
  rows: makeDoc("50-day reclaim setup rows", "One row per de-duplicated setup with forward returns", [
    str("event_date"),
    str("entry_date"),
    num("close_at_event"),
    num("above_200d_pct"),
    num("fwd_week_pct"),
    num("fwd_month_pct"),
    num("fwd_three_months_pct"),
    num("fwd_six_months_pct"),
    num("fwd_year_pct"),
  ]),
});

feed.def("horizons", {
  rows: makeDoc("Forward horizon stats", "Median, mean, positive count, and typical-day comparison by horizon", [
    str("label"),
    num("days"),
    num("event_median_pct"),
    num("event_mean_pct"),
    num("positive_count"),
    num("event_count"),
    num("typical_day_median_pct"),
    num("edge_pct"),
    num("low_pct"),
    num("high_pct"),
  ]),
});

feed.def("summary", {
  stats: makeDoc("Playbook summary", "Headline values consumed by the verdict card", [
    num("n_events"),
    num("start_year"),
    str("best_label"),
    num("best_median_pct"),
    num("best_typical_day_pct"),
    num("best_edge_pct"),
    num("best_positive_rate_pct"),
    num("worst_year_later_pct"),
    str("latest_signal_date"),
  ]),
});

(async () => {
  await feed.run(async (ctx) => {
    let raw;
    try {
      raw = await arraysGet("/api/v1/stocks/kline", {
        symbol: SYMBOL,
        start_time: START_SEC,
        end_time: END_SEC,
        interval: "1d",
        limit: 10000,
      });
    } catch (error) {
      throw error;
    }

    if (!raw || !Array.isArray(raw.data) || raw.data.length < 300) {
      throw new Error("Not enough SPY daily bars");
    }

    let rows = raw.data
      .map((bar) => ({
        date: toIsoDay(bar),
        close: Number(bar.price_close),
      }))
      .filter((row) => row.date && Number.isFinite(row.close))
      .sort((a, b) => a.date.localeCompare(b.date));

    let continuousStart = 0;
    for (let i = 1; i < rows.length; i++) {
      const gapDays = (Date.parse(rows[i].date + "T00:00:00Z") - Date.parse(rows[i - 1].date + "T00:00:00Z")) / 86400000;
      if (gapDays > 10) continuousStart = i;
    }
    if (continuousStart > 0) rows = rows.slice(continuousStart);

    for (let i = 49; i < rows.length; i++) {
      rows[i].ma50 = mean(rows.slice(i - 49, i + 1).map((row) => row.close));
    }
    for (let i = 199; i < rows.length; i++) {
      rows[i].ma200 = mean(rows.slice(i - 199, i + 1).map((row) => row.close));
    }

    const maxHorizon = Math.max.apply(null, HORIZONS.map((horizon) => horizon.days));
    const events = [];
    let lastSignalIndex = -Infinity;

    for (let i = 203; i < rows.length - maxHorizon - 1; i++) {
      let wasBelow50 = true;
      for (let j = 1; j <= BELOW_50D_DAYS; j++) {
        wasBelow50 = wasBelow50 && rows[i - j].ma50 && rows[i - j].close < rows[i - j].ma50;
      }
      const reclaim50 = rows[i].ma50 && rows[i].close > rows[i].ma50 && rows[i - 1].close <= rows[i - 1].ma50;
      const aboveLine = rows[i].ma200 && rows[i].close > rows[i].ma200;
      const separated = i - lastSignalIndex >= COOLDOWN_DAYS;

      if (wasBelow50 && reclaim50 && aboveLine && separated) {
        const entryIndex = i + 1;
        const event = {
          signalIndex: i,
          entryIndex,
          event_date: rows[i].date,
          entry_date: rows[entryIndex].date,
          close_at_event: round(rows[i].close, 4),
          above_200d_pct: pct(rows[i].close / rows[i].ma200 - 1),
        };
        HORIZONS.forEach((horizon) => {
          event[horizon.key] = pct(rows[entryIndex + horizon.days].close / rows[entryIndex].close - 1);
        });
        events.push(event);
        lastSignalIndex = i;
      }
    }

    const horizonRows = HORIZONS.map((horizon) => {
      const eventValues = events.map((event) => event[horizon.key]).filter((value) => value != null);
      const typicalValues = [];
      for (let i = 199; i < rows.length - horizon.days; i++) {
        typicalValues.push(pct(rows[i + horizon.days].close / rows[i].close - 1));
      }
      const med = median(eventValues);
      const typicalMed = median(typicalValues);
      return {
        label: horizon.label,
        days: horizon.days,
        event_median_pct: round(med, 4),
        event_mean_pct: round(mean(eventValues), 4),
        positive_count: eventValues.filter((value) => value > 0).length,
        event_count: eventValues.length,
        typical_day_median_pct: round(typicalMed, 4),
        edge_pct: round(med - typicalMed, 4),
        low_pct: round(Math.min.apply(null, eventValues), 4),
        high_pct: round(Math.max.apply(null, eventValues), 4),
      };
    });

    const best = horizonRows
      .filter((row) => DISPLAYED_HORIZON_LABELS.has(row.label))
      .sort((a, b) => b.edge_pct - a.edge_pct)[0] || horizonRows[0];
    const yearEvents = events.map((event) => event.fwd_year_pct).filter((value) => value != null);
    const runTs = Date.now();
    let seq = 0;

    const signalDates = new Set(events.map((event) => event.event_date));
    const seriesRows = [];
    for (let i = 199; i < rows.length; i++) {
      seriesRows.push({
        date: runTs + seq++,
        date_iso: rows[i].date,
        close: round(rows[i].close, 4),
        ma200: round(rows[i].ma200, 4),
        is_signal: signalDates.has(rows[i].date) ? 1 : 0,
      });
    }

    const eventRows = events.map((event) => ({
      date: runTs + seq++,
      event_date: event.event_date,
      entry_date: event.entry_date,
      close_at_event: event.close_at_event,
      above_200d_pct: event.above_200d_pct,
      fwd_week_pct: event.fwd_week_pct,
      fwd_month_pct: event.fwd_month_pct,
      fwd_three_months_pct: event.fwd_three_months_pct,
      fwd_six_months_pct: event.fwd_six_months_pct,
      fwd_year_pct: event.fwd_year_pct,
    }));

    const horizonOut = horizonRows.map((row) => ({ date: runTs + seq++, ...row }));
    const summary = {
      date: runTs + seq++,
      n_events: events.length,
      start_year: Number(rows[0].date.slice(0, 4)),
      best_label: best.label,
      best_median_pct: best.event_median_pct,
      best_typical_day_pct: best.typical_day_median_pct,
      best_edge_pct: best.edge_pct,
      best_positive_rate_pct: round((best.positive_count / best.event_count) * 100, 2),
      worst_year_later_pct: round(Math.min.apply(null, yearEvents), 4),
      latest_signal_date: events.length ? events[events.length - 1].event_date : "",
    };

    await ctx.self.ts("series", "daily").append(seriesRows);
    await ctx.self.ts("events", "rows").append(eventRows);
    await ctx.self.ts("horizons", "rows").append(horizonOut);
    await ctx.self.ts("summary", "stats").append([summary]);

    console.log("SPY bars:", rows.length, "signals:", events.length, "best:", best.label, best.edge_pct);
  });
})();
