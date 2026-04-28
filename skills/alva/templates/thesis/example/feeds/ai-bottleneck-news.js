const { Feed, feedPath, makeDoc, num, str } = require("@alva/feed");
const { searchGrokX } = require("@arrays/data/search/search-grok-x:v1.0.0");
const { searchBrave } = require("@arrays/data/search/search-brave:v1.0.0");
const adk = require("@alva/adk");

// ─── AI Bottleneck — news + social feed ───
//
// Every query targets AI-buildout supply behavior across three dimensions:
//   Power: turbine backlogs, PPAs, grid capacity, nuclear permits
//   Compute: GPU allocation, HBM supply, fab capacity, CoWoS packaging
//   Deployment: EPC crews, data center permits, skilled trades, site starts

const NEWS_QUERIES = [
  // Power
  { q:'GE Vernova gas turbine backlog 2028 order slot',            ids:["GEV"] },
  { q:'Constellation Energy nuclear PPA hyperscaler Meta Crane',   ids:["CEG"] },
  { q:'Vistra ERCOT peaker capacity auction spark spread',         ids:["VST"] },
  { q:'Eaton switchgear backlog lead time data center',            ids:["ETN","HUBB"] },
  { q:'Hubbell distribution transformer backlog utility',          ids:["HUBB"] },
  { q:'AI data center power capacity bottleneck grid',             ids:["ETN","CEG","VST","GEV","HUBB"] },

  // Compute
  { q:'NVIDIA Blackwell Rubin allocation backlog shipments',       ids:["NVDA"] },
  { q:'Broadcom custom ASIC hyperscaler Google TPU Meta',          ids:["AVGO"] },
  { q:'Micron HBM3E HBM4 allocation pricing DRAM',                 ids:["MU"] },
  { q:'TSMC 3nm 2nm capacity CoWoS packaging backlog',             ids:["TSM"] },
  { q:'ASML EUV High-NA lithography shipments backlog',            ids:["ASML"] },
  { q:'AI compute bottleneck GPU HBM fab capacity constrained',    ids:["NVDA","AVGO","MU","TSM","ASML"] },

  // Deployment
  { q:'Quanta Services electrical EPC backlog skilled crews',      ids:["PWR"] },
  { q:'Comfort Systems data center HVAC mechanical contractor',    ids:["FIX"] },
  { q:'Sterling Infrastructure e-infrastructure data center pad',  ids:["STRL"] },
  { q:'EMCOR Group mechanical electrical contractor data center',  ids:["EME"] },
  { q:'Equinix data center renewal spreads pricing hyperscaler',   ids:["EQIX"] },
  { q:'data center permitting construction skilled trades shortage',ids:["PWR","FIX","STRL","EME","EQIX"] },

  // Cross-theme
  { q:'AI infrastructure capex supply chain bottleneck 2026',      ids:["GEV","NVDA","PWR","EQIX"] },
  { q:'FERC Order 2023 grid queue reform interconnection',         ids:["PWR","ETN"] },
];

function todayIso(offsetDays) {
  const d = new Date(Date.now() - (offsetDays||0)*86400*1000);
  return d.toISOString().slice(0,10);
}

// Sentiment keyword bag — specific to AI-bottleneck framing.
// Bull = supply is tighter / slower (bullish for the thesis).
// Bear = supply is loosening / delivering (thesis weakening).
function sentimentGuess(text) {
  if (!text) return "Neutral";
  const t = text.toLowerCase();
  const bull = [
    "lead time","backlog","sold out","booked","shortage","tight","tightening",
    "constrained","allocation","oversubscribed","waitlist","extending","extends",
    "delayed","slip","pushed out","behind schedule",
    "ppa signed","signed ppa","anchor deal","long-term contract",
    "capex restraint","measured","disciplined","pricing power",
  ];
  const bear = [
    "capacity add","new plant","expansion announced","greenfield",
    "ramp","approved","fast-tracked","expedited","overbuilding",
    "softer","weaker","inventory build","destock","price cut","guidance cut",
    "second source","substitution","credible alternative",
  ];
  let bc = 0;
  let brc = 0;
  for (let i=0;i<bull.length;i++) if (t.indexOf(bull[i]) >= 0) bc++;
  for (let i=0;i<bear.length;i++) if (t.indexOf(bear[i]) >= 0) brc++;
  if (bc > brc) return "Bull";
  if (brc > bc) return "Bear";
  return "Neutral";
}

function domainOf(url) {
  if (!url) return "";
  const m = url.match(/^https?:\/\/([^\/]+)/i);
  if (!m) return "";
  return m[1].replace(/^www\./, "");
}

// Title-similarity dedup
function normalizeTitle(t) {
  if (!t) return "";
  return String(t).toLowerCase().replace(/[\u2019\u2018'`]/g, "").replace(/[^a-z0-9\s$]/g, " ").replace(/\s+/g, " ").trim();
}
function titleTokens(t) {
  const norm = normalizeTitle(t);
  if (!norm) return [];
  const toks = norm.split(" ").filter((w)=> w.length > 2);
  const set = {};
  for (let i=0;i<toks.length;i++) set[toks[i]] = true;
  return Object.keys(set);
}
function jaccard(a, b) {
  if (!a.length || !b.length) return 0;
  const setA = {}; for (let i=0;i<a.length;i++) setA[a[i]] = true;
  let inter = 0;
  for (let i=0;i<b.length;i++) if (setA[b[i]]) inter++;
  const union = a.length + b.length - inter;
  return union > 0 ? inter / union : 0;
}
function dedupeByTitleSimilarity(items, threshold) {
  const minSim = (threshold == null || threshold === 0) ? 0.7 : threshold;
  const kept = [];
  const tokenSets = [];
  for (let i=0;i<items.length;i++){
    const t = titleTokens(items[i].title);
    if (!t.length) { kept.push(items[i]); tokenSets.push(t); continue; }
    let dup = false;
    for (let j=0;j<tokenSets.length;j++){
      if (!tokenSets[j].length) continue;
      if (jaccard(t, tokenSets[j]) >= minSim) { dup = true; break; }
    }
    if (!dup){ kept.push(items[i]); tokenSets.push(t); }
  }
  return kept;
}

const feed = new Feed({ path: feedPath("ai-bottleneck-news") });

feed.def("items", {
  news: makeDoc("News Items", "Basket-tagged news, 72h window", [
    str("title"), str("snippet"), str("url"), str("source"),
    str("ids"), num("engagement"), str("sentiment"), str("thumbnail"),
  ]),
  social: makeDoc("Social Items", "X/Twitter posts tagged to basket", [
    str("content"), str("url"), str("author_name"), str("author_handle"),
    num("followers"), num("verified"), str("ids"),
    num("engagement"), str("sentiment"),
    num("likes"), num("retweets"), num("replies"),
  ]),
});

feed.def("meta", {
  counts: makeDoc("Feed Counts", "Counts for filter chips", [
    num("total"), num("news"), num("social"),
  ]),
  summary: makeDoc("Topic Summary", "Grok topic summary", [
    str("summary"),
  ]),
});

const TAG_MAP = {
  "ge vernova":"GEV","vernova":"GEV","gev":"GEV","gas turbine":"GEV",
  "constellation":"CEG","ceg":"CEG",
  "vistra":"VST","vst":"VST","ercot":"VST",
  "eaton":"ETN","etn":"ETN","switchgear":"ETN",
  "hubbell":"HUBB","hubb":"HUBB",
  "nvidia":"NVDA","nvda":"NVDA","blackwell":"NVDA","rubin":"NVDA",
  "broadcom":"AVGO","avgo":"AVGO","tpu":"AVGO",
  "micron":"MU","hbm":"MU",
  "tsmc":"TSM","tsm":"TSM","taiwan semi":"TSM","cowos":"TSM",
  "asml":"ASML","euv":"ASML","high-na":"ASML",
  "quanta":"PWR","pwr":"PWR",
  "comfort systems":"FIX","fix":"FIX",
  "sterling":"STRL","strl":"STRL",
  "emcor":"EME","eme":"EME",
  "equinix":"EQIX","eqix":"EQIX",
};

(async () => {
  await feed.run(async (ctx)=> {
    const now = Date.now();
    const today = new Date(); today.setUTCHours(0,0,0,0);
    const todayMs = today.getTime();

    const from = todayIso(3);
    let newsRecords = [];
    const seenNewsUrls = {};
    let socialRecords = [];
    const seenSocialIds = {};
    const summaries = [];

    // News via Brave
    for (let i=0;i<NEWS_QUERIES.length;i++){
      const q = NEWS_QUERIES[i];
      try {
        const r = searchBrave({ query: q.q, freshness: "pw", count: 10 });
        if (r.success && r.response) {
          const items = (r.response.news_results?.length) ? r.response.news_results : (r.response.data || []);
          for (let j=0;j<items.length;j++){
            const it = items[j];
            if (!it.url || seenNewsUrls[it.url]) continue;
            seenNewsUrls[it.url] = true;
            const desc = (it.description || "").replace(/<[^>]+>/g, "");
            newsRecords.push({
              date: it.date || now,
              title: (it.title || "").slice(0, 240),
              snippet: desc.slice(0, 400),
              url: it.url,
              source: domainOf(it.url) || "web",
              ids: q.ids.join(","),
              engagement: 0,
              sentiment: sentimentGuess(`${it.title||""} ${desc}`),
              thumbnail: "",
            });
          }
        }
      } catch (e) { log(`News err ${q.q}: ${e.message}`); }
    }

    // Social via GrokX
    const combinedSocialQuery = "AI bottleneck: $NVDA Blackwell allocation, $AVGO custom ASIC, $MU HBM, $TSM CoWoS, $ASML EUV, $GEV turbine backlog, $CEG nuclear PPA, $VST ERCOT, $ETN switchgear, $PWR EPC crews, $FIX data center HVAC, $EQIX renewal spreads — supply constraint power compute deployment";
    try {
      const r = searchGrokX({ query: combinedSocialQuery, from_date: from, max_search_results: 25 });
      if (r.success && r.response) {
        if (r.response.summary) summaries.push({ query: combinedSocialQuery, summary: r.response.summary });
        const tweets = r.response.data || r.response.tweets || [];
        for (let j=0;j<tweets.length;j++){
          const tw = tweets[j];
          const id = tw.id || tw.url;
          if (!id || seenSocialIds[id]) continue;
          seenSocialIds[id] = true;
          const likes = tw.like_count||0;
          const rts = tw.retweet_count||0;
          const reps = tw.reply_count||0;
          const eng = likes + rts + reps;
          if (eng === 0 && !tw.author_verified) continue;
          const lowerC = (tw.content || "").toLowerCase();
          const hits = [];
          for (const key in TAG_MAP){ if (lowerC.indexOf(key) >= 0 && hits.indexOf(TAG_MAP[key]) < 0) hits.push(TAG_MAP[key]); }
          socialRecords.push({
            date: tw.created_at || tw.date || now,
            content: (tw.content || "").slice(0, 600),
            url: tw.url || "",
            author_name: tw.author_name || "",
            author_handle: tw.author_username || "",
            followers: tw.author_followers_count || 0,
            verified: tw.author_verified ? 1 : 0,
            ids: hits.length ? hits.join(",") : "",
            engagement: eng,
            sentiment: sentimentGuess(tw.content),
            likes: likes, retweets: rts, replies: reps,
          });
        }
      }
    } catch (e) { log(`Social err: ${e.message}`); }

    newsRecords.sort((a,b)=> b.date - a.date);
    socialRecords.sort((a,b)=> b.engagement - a.engagement);

    const preDedupN = newsRecords.length;
    newsRecords = dedupeByTitleSimilarity(newsRecords, 0.7);
    log(`Title-similarity dedup: ${preDedupN} -> ${newsRecords.length}`);

    newsRecords = newsRecords.slice(0, 80);
    socialRecords = socialRecords.slice(0, 40);

    // LLM sentiment pass — AI bottleneck lens
    try {
      const items = [];
      for (let i=0;i<newsRecords.length;i++) items.push({ kind:"news", id:i, text: `${newsRecords[i].title||""} — ${(newsRecords[i].snippet||"").slice(0,180)}` });
      for (let j=0;j<socialRecords.length;j++) items.push({ kind:"social", id:j, text: (socialRecords[j].content||"").slice(0,220) });

      if (items.length) {
        const sysPrompt = [
          "You tag items for an AI-buildout bottleneck tracker. Thesis: AI deployment is constrained across three supply-side dimensions — Power (turbines, nuclear, grid, switchgear), Compute (GPUs, HBM, fab capacity, EUV), and Deployment (EPC crews, data-center real estate, permits).",
          "",
          "For each item return one label (Title Case):",
          "  Bull = supply is getting tighter or slower: backlogs extending, lead times lengthening, allocation tightening, PPAs signed, skilled-trades scarcity, fab capacity oversubscribed, data-center renewal spreads widening.",
          "  Bear = supply is loosening or delivering: capacity adds, second sources, substitution, permits fast-tracked, CoWoS capacity expanding faster than expected, hyperscaler capex pause.",
          "  Neutral = general commentary, macro, demand-side news without supply-behavior signal.",
          "",
          "Default to Neutral when uncertain. A demand-growth headline is Neutral, not Bull. We trade supply behavior only.",
          "",
          "Return ONLY a JSON array of {\"i\":<index>,\"s\":\"Bull|Bear|Neutral\"}. No prose.",
        ].join("\n");
        const userPrompt = `Items (index → text):\n${items.map((it,idx)=> `${idx}. ${it.text}`).join("\n")}`;

        const res = await adk.agent({ system: sysPrompt, prompt: userPrompt, tools: [], maxTurns: 1 });
        const raw = (res?.content) ? res.content.replace(/^```(?:json)?/,"").replace(/```$/,"").trim() : "";
        const m = raw.match(/\[[\s\S]*\]/);
        if (m) {
          let labels;
          try { labels = JSON.parse(m[0]); } catch(e) { labels = null; }
          if (Array.isArray(labels)) {
            for (const l of labels) {
              const idx = l && typeof l.i === "number" ? l.i : -1;
              const s = l && typeof l.s === "string" ? l.s : "";
              if (idx < 0 || idx >= items.length) continue;
              if (s !== "Bull" && s !== "Bear" && s !== "Neutral") continue;
              const item = items[idx];
              if (item.kind === "news") newsRecords[item.id].sentiment = s;
              else socialRecords[item.id].sentiment = s;
            }
            log(`LLM sentiment: re-scored ${labels.length} of ${items.length} items`);
          }
        }
      }
    } catch (e) { log(`LLM sentiment pass failed: ${e.message}`); }

    if (newsRecords.length) await ctx.self.ts("items","news").append(newsRecords);
    if (socialRecords.length) await ctx.self.ts("items","social").append(socialRecords);

    await ctx.self.ts("meta","counts").append([{
      date: todayMs,
      total: newsRecords.length + socialRecords.length,
      news: newsRecords.length,
      social: socialRecords.length,
    }]);

    if (summaries.length) {
      const combined = summaries.slice(0, 6).map((s)=> `• ${s.summary}`).join("\n").slice(0, 4000);
      await ctx.self.ts("meta","summary").append([{ date: todayMs, summary: combined }]);
    }

    log(`ai-bottleneck news: ${newsRecords.length} news, ${socialRecords.length} social.`);
  });
})();
