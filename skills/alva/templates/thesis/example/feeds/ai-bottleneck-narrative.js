const { Feed, feedPath, makeDoc, num, str, obj, arr } = require("@alva/feed");
const adk = require("@alva/adk");
const alfs = require("alfs");
const env = require("env");

// ─── AI Bottleneck — ADK narrative feed ───
//
// Pure tracker. No stage migration, no discovery. Daily job is to answer the
// template's four mandatory questions:
//   1. What happened since the last snapshot?
//   2. How did it affect basket alpha and names?
//   3. Does it reinforce or weaken the structural thesis?
//   4. What's the next catalyst to watch?
//
// Every number cited must be traceable to the input snapshot (grounding).
// If grounding fails, we write a deterministic fallback one-liner and flag
// source="fallback". Push only fires when there's real signal.

const feed = new Feed({ path: feedPath("ai-bottleneck-narrative") });

// Frozen schema per template v1.6.0.
feed.def("narrative", {
  records: makeDoc("Daily Narrative Record", "One TLDR + deltas + catalysts + risks per day", [
    num("generatedAt"),              // epoch ms
    str("recordDate"),               // "YYYY-MM-DD"
    str("thesis"),                   // markdown TLDR body, 3-5 sentences active / 1-2 quiet
    str("pushLine"),                 // plain-text headline, ≤160 chars
    str("source"),                   // "adk" | "fallback"
    str("deltasJson"),               // JSON array of Delta objects
    str("catalystsJson"),            // JSON array of Catalyst objects
    str("risksJson"),                // JSON array of Risk objects
  ]),
});

feed.def("signal", {
  targets: makeDoc("Hero Push", "Daily hero digest for playbook followers", [
    obj("instruction", [
      str("type"),
      arr("weights", [ str("symbol"), num("weight") ]),
    ]),
    obj("meta", [
      str("reason"),
    ]),
  ]),
});

async function readFeed(feedName, group, series, count) {
  const path = `/alva/home/${env.username}/feeds/${feedName}/v1/data/${group}/${series}/@last/${count||1}`;
  try {
    const txt = await alfs.readFile(path);
    if (!txt) return null;
    return JSON.parse(String(txt));
  } catch (e) { return null; }
}

function safeParse(s){ try { return JSON.parse(s); } catch (e) { return null; } }
function parseJson(s){
  if (!s) return null;
  const cleaned = s.replace(/^```(?:json)?/, "").replace(/```$/, "").trim();
  try { return JSON.parse(cleaned); } catch (e) {
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (m) { try { return JSON.parse(m[0]); } catch (e2) { return null; } }
    return null;
  }
}

// Grounding: extract every number-like token from the output and verify it
// appears somewhere in the input snapshot (as a similar rounded value). If
// ANY number fails to ground, we fall back.
function extractNumbers(text){
  if (!text) return [];
  // Match numbers with optional sign, decimals, percent, "pp", "bp"
  const re = /-?\d+(?:\.\d+)?(?:%|\s*(?:pp|bps?))?/g;
  const out = [];
  let m = re.exec(text);
  while (m !== null) {
    const raw = m[0].trim();
    const num = Number.parseFloat(raw);
    if (!Number.isNaN(num)) out.push({ raw: raw, value: num });
    m = re.exec(text);
  }
  return out;
}
function isGrounded(number, haystack){
  // A number is grounded if a value within 0.2 (for small) or 0.5% (for larger)
  // tolerance appears in the input snapshot.
  const hay = extractNumbers(haystack).map((x)=> x.value);
  for (let i=0;i<hay.length;i++){
    const diff = Math.abs(number - hay[i]);
    const tol = Math.max(0.2, Math.abs(hay[i]) * 0.005);
    if (diff <= tol) return true;
  }
  return false;
}

// ─── Post-processing: match related news/social to catalysts and risks ───
// Per template: "Post-processing populates as [{type, title, url, snippet}]."
// Catalysts match by ticker overlap (via ids) + keyword similarity on title.
// Risks match by keyword similarity on description.
function normalizeText(t){
  if (!t) return "";
  return String(t).toLowerCase().replace(/[^a-z0-9\s$]/g, " ").replace(/\s+/g, " ").trim();
}
function tokens(t){
  const n = normalizeText(t);
  if (!n) return [];
  const toks = n.split(" ").filter((w)=> w.length > 3);
  const set = {};
  for (let i=0;i<toks.length;i++) set[toks[i]] = true;
  return Object.keys(set);
}
function tokenOverlap(a, b){
  if (!a.length || !b.length) return 0;
  const setA = {}; for (let i=0;i<a.length;i++) setA[a[i]] = true;
  let inter = 0;
  for (let i=0;i<b.length;i++) if (setA[b[i]]) inter++;
  return inter / Math.min(a.length, b.length);  // overlap coefficient — finds short queries in long news
}
function matchRelatedNews(target, ids, allItems, cap){
  const maxItems = (cap == null || cap === 0) ? 5 : cap;
  const targetTokens = tokens(target);
  const candidates = [];
  for (let i=0;i<allItems.length;i++){
    const it = allItems[i];
    const itemIds = (it.ids || "").split(",").filter(Boolean);
    let tickerHit = 0;
    if (ids?.length && itemIds.length){
      for (let j=0;j<ids.length;j++) if (itemIds.indexOf(ids[j]) >= 0) { tickerHit = 1; break; }
    }
    const itemText = `${it.title || it.content || ""} ${it.snippet || ""}`;
    const kwOverlap = tokenOverlap(targetTokens, tokens(itemText));
    const score = tickerHit * 0.5 + kwOverlap * 0.5;
    if (score > 0.15) candidates.push({ score: score, item: it });
  }
  candidates.sort((a,b)=> b.score - a.score);
  return candidates.slice(0, maxItems).map((c)=> ({
      type: c.item.content ? "social" : "news",
      title: c.item.title || (c.item.author_handle ? `@${c.item.author_handle}` : "") || "",
      url: c.item.url || "",
      snippet: (c.item.snippet || c.item.content || "").slice(0, 180),
    }));
}

// ─── Enum validation (safety net) ───
const DELTA_CATEGORIES = { "Valuation":1,"Catalyst":1,"Risk":1,"Macro":1,"News":1,"Positioning":1,"Flows":1 };
const RISK_CATEGORIES = { "Policy":1,"Regulatory":1,"Tech substitution":1,"Cyclical":1,"Execution":1,"Valuation":1,"Narrative":1,"Geopolitical":1 };
const DIVERGENCE_TYPES = { "Fundamental":1,"Narrative":1,"Valuation":1,"Flows":1 };
const SENTIMENTS_3 = { "Bull":1,"Bear":1,"Neutral":1 };
const SENTIMENTS_4 = { "Bull":1,"Bear":1,"Neutral":1,"Ambiguous":1 };
const CATALYST_STATUSES = { "Upcoming":1,"Delivered":1,"Missed":1 };
const PRIORITIES = { "High":1,"Medium":1,"Low":1 };
const PILLARS = { "Power":1,"Compute":1,"Deployment":1 };
function clampEnum(val, enumMap, fallback){
  return (val && enumMap[val]) ? val : fallback;
}

(async () => {
  await feed.run(async (ctx)=> {
    const now = Date.now();
    const today = new Date(); today.setUTCHours(0,0,0,0);
    const todayMs = today.getTime();
    const recordDate = new Date(todayMs).toISOString().slice(0,10);

    // ─── Pull context ───
    const summary = await readFeed("ai-bottleneck","basket","summary",1);
    const horizons = await readFeed("ai-bottleneck","basket","horizons",6);
    const layerPerf = await readFeed("ai-bottleneck","basket","layer_perf",3);
    const members = await readFeed("ai-bottleneck","basket","tickers",20);
    const attribution = await readFeed("ai-bottleneck","basket","attribution",3);
    let news = await readFeed("ai-bottleneck-news","items","news",80);
    let social = await readFeed("ai-bottleneck-news","items","social",40);

    function rankBySentiment(arr){
      if (!arr) return arr;
      return arr.slice().sort((a,b)=> {
        const rank = (s)=> s==='Bull' ? 0 : s==='Bear' ? 1 : 2;
        return rank(a.sentiment||'Neutral') - rank(b.sentiment||'Neutral');
      });
    }
    news = rankBySentiment(news);
    social = rankBySentiment(social);

    const priorList = await readFeed("ai-bottleneck-narrative","narrative","records",1);
    const prior = (priorList?.length) ? priorList[0] : null;

    function compactMembers(arr){
      if (!arr) return [];
      return arr.map((m)=> ({
        id: m.id, name: m.name, layer: m.layer,
        pe: m.pe, pe_pct: m.pe_pct, rev_yoy: m.rev_yoy, mcap: m.mcap,
        ret_1d: m.ret_1d, ret_1m: m.ret_1m, ret_3m: m.ret_3m, ret_ytd: m.ret_ytd, ret_1y: m.ret_1y,
        alpha_pave: m.alpha_pave, alpha_smh: m.alpha_smh, alpha_spy: m.alpha_spy, val_tag: m.val_tag,
      }));
    }
    function compactNews(arr, cap){
      if (!arr) return [];
      return arr.slice(0, cap||40).map((n)=> ({ title: n.title, snippet: (n.snippet||"").slice(0,200), ids: n.ids, sentiment: n.sentiment, source: n.source }));
    }
    function compactSocial(arr, cap){
      if (!arr) return [];
      return arr.slice(0, cap||15).map((s)=> ({ author: s.author_handle, verified: s.verified, content: (s.content||"").slice(0,220), engagement: s.engagement, sentiment: s.sentiment, ids: s.ids }));
    }

    const context = {
      basket_summary: summary?.[0] ? summary[0] : {},
      horizons: horizons || [],
      layer_perf: layerPerf || [],
      members: compactMembers(members),
      attribution: attribution || [],
      news_sample: compactNews(news, 40),
      social_sample: compactSocial(social, 15),
      prior_narrative: prior ? {
        thesis: prior.thesis, pushLine: prior.pushLine,
        deltas: safeParse(prior.deltasJson),
        catalysts: safeParse(prior.catalystsJson),
        risks: safeParse(prior.risksJson),
      } : null,
      today: recordDate,
    };

    const contextJson = JSON.stringify(context);

    const systemPrompt = [
      "You are the narrative writer for a thematic playbook called 'AI Bottleneck'.",
      "",
      "FIXED THESIS (never re-derive it, never question it, your job is to track it): AI buildout is constrained across three supply-side dimensions — Power (turbines, nuclear, grid, switchgear), Compute (GPUs, custom ASICs, HBM, leading-edge fab, EUV lithography), and Deployment (EPC crews, mechanical/electrical contractors, data-center real estate). The basket holds 15 names across those three layers. You do NOT discover new themes; you track whether THIS one is getting tighter, looser, or holding.",
      "",
      "VOICE. Dry. Specific. Analyst-meets-war-correspondent. Never generic bullishness. One clean line of humor if it sharpens the point, otherwise quiet. Banned: 'well-positioned', 'tailwinds', 'unlocking value', 'positioned to benefit', emoji, exclamation marks.",
      "",
      "YOUR DAILY JOB — answer four questions in the TLDR (thesis), in order:",
      "  1. What HAPPENED since the last snapshot? (specific names, specific moves, specific news items)",
      "  2. How did it affect basket alpha and individual names?",
      "  3. Does it REINFORCE or WEAKEN the structural thesis that power/compute/deployment are constrained?",
      "  4. What's the NEXT catalyst to watch?",
      "",
      "GROUNDING — EVERY number you write must come from the provided context. If you cannot cite a number from the snapshot, do NOT invent one. Prefer words over fabricated numbers.",
      "",
      "OUTPUT — Return ONLY valid JSON matching this schema. No prose outside JSON, no markdown fences.",
      "{",
      '  "thesis": "TLDR body, 3-5 sentences active days, 1-2 quiet days. Answers the four questions in order. Markdown OK for emphasis but keep it tight.",',
      '  "pushLine": "Plain-text headline, ≤160 chars, the single most important thing today. This is what goes in the push notification verbatim.",',
      '  "deltas": [',
      '    { "sentiment": "Bull|Bear|Neutral",',
      '      "category": "Valuation|Catalyst|Risk|Macro|News|Positioning|Flows",',
      '      "label": "one-line change",',
      '      "body": "1-2 sentences grounded in the provided context",',
      '      "pillar": "Power|Compute|Deployment" }',
      '  ],',
      '  "catalysts": [',
      '    { "date": "YYYY-MM-DD or 2026 Q3 or TBD",',
      '      "status": "Upcoming|Delivered|Missed",',
      '      "sentiment": "Bull|Bear|Ambiguous",',
      '      "title": "short event title",',
      '      "notes": "2-3 sentences on what it means for the bottleneck thesis",',
      '      "ids": ["GEV","PWR"],',
      '      "pillar": "Power|Compute|Deployment" }',
      '  ],',
      '  "risks": [',
      '    { "category": "Policy|Regulatory|Tech substitution|Cyclical|Execution|Valuation|Narrative|Geopolitical",',
      '      "description": "narrative description",',
      '      "divergenceType": "Fundamental|Narrative|Valuation|Flows",',
      '      "exitTrigger": "concrete threshold that would materialize the risk",',
      '      "ifTriggered": "planned response",',
      '      "priority": "High|Medium|Low",',
      '      "pillar": "Power|Compute|Deployment",',
      '      "thesisClaim": "≤20 words quoting the specific pillar commitment this risk diverges from, e.g. \'Power capacity will remain supply-constrained through 2028\'" }',
      '  ]',
      "}",
      "",
      "This is a MULTI-PILLAR thesis (Power + Compute + Deployment). EVERY risk must have pillar + thesisClaim assigned — the risk tab is organized by which pillar it threatens. A risk that threatens the overall thesis rather than a specific pillar still needs to pick the closest pillar (usually the one whose claim the risk most directly attacks).",
      "",
      "Rules:",
      "- 0-5 deltas. Empty array OK on quiet days (front-end will hide the section).",
      "- 3-6 ongoing + recently delivered/missed catalysts.",
      "- 4-7 risks sorted by priority (High first).",
      "- Only use ids from the provided members list. Do not invent tickers.",
      "- Only cite numbers that appear in the provided context.",
      "- If the day has NO real movement, write a short 1-2 sentence thesis and empty/small arrays. Do not force signal.",
      "",
      "CATALYST CARRY-FORWARD:",
      "- prior_narrative.catalysts may have Upcoming events from previous days. For each:",
      "  * If today's news_sample shows it occurred → status = Delivered, date = actual.",
      "  * If the date has passed without corroborating news → status = Missed.",
      "  * Otherwise keep as Upcoming with stable title/ids.",
      "- Delivered / Missed events stay visible for ~14 days.",
    ].join("\n");

    const userPrompt = `Today's context (quant + news + social + prior narrative):\n\n\`\`\`json\n${contextJson}\n\`\`\`\n\nWrite today's narrative record. Return JSON only.`;

    const result = await adk.agent({
      system: systemPrompt,
      prompt: userPrompt,
      tools: [],
      maxTurns: 1,
    });

    const parsed = parseJson(result.content);
    let source = "adk";
    let thesis = "";
    let pushLine = "";
    let deltas = [];
    let catalysts = [];
    let risks = [];

    if (!parsed) {
      log(`ADK returned non-JSON. Raw: ${(result.content || "").slice(0, 400)}`);
      source = "fallback";
    } else {
      thesis = parsed.thesis || "";
      pushLine = (parsed.pushLine || "").slice(0, 240);
      deltas = Array.isArray(parsed.deltas) ? parsed.deltas : [];
      catalysts = Array.isArray(parsed.catalysts) ? parsed.catalysts : [];
      risks = Array.isArray(parsed.risks) ? parsed.risks : [];

      // ─── Enum validation (safety net — clamp any free-text labels to template enums) ───
      deltas = deltas.map((d)=> Object.assign({}, d, {
          sentiment: clampEnum(d.sentiment, SENTIMENTS_3, "Neutral"),
          category: clampEnum(d.category, DELTA_CATEGORIES, "News"),
          pillar: d.pillar ? clampEnum(d.pillar, PILLARS, null) : null,
        }));
      catalysts = catalysts.map((c)=> Object.assign({}, c, {
          status: clampEnum(c.status, CATALYST_STATUSES, "Upcoming"),
          sentiment: clampEnum(c.sentiment, SENTIMENTS_4, "Ambiguous"),
          pillar: c.pillar ? clampEnum(c.pillar, PILLARS, null) : null,
          ids: Array.isArray(c.ids) ? c.ids : [],
        }));
      risks = risks.map((r)=> Object.assign({}, r, {
          category: clampEnum(r.category, RISK_CATEGORIES, "Execution"),
          divergenceType: clampEnum(r.divergenceType, DIVERGENCE_TYPES, "Fundamental"),
          priority: clampEnum(r.priority, PRIORITIES, "Medium"),
          pillar: r.pillar ? clampEnum(r.pillar, PILLARS, null) : null,
        }));

      // Grounding check: every number in thesis + pushLine must exist in context.
      const combined = `${thesis} ${pushLine}`;
      const nums = extractNumbers(combined);
      let grounded = true;
      for (let i=0;i<nums.length;i++){
        if (!isGrounded(nums[i].value, contextJson)) {
          log(`Grounding fail: ${nums[i].raw} not found in snapshot`);
          grounded = false;
          break;
        }
      }
      if (!grounded) source = "fallback";

      // ─── Post-processing: match relatedNews to catalysts and risks ───
      // Template: "Post-processing populates as [{type, title, url, snippet}]"
      // Always attach as an array (empty OK) — UI expects the field.
      const allItems = (news || []).concat(social || []);
      catalysts = catalysts.map((c)=> {
        let matched = [];
        if (allItems.length){
          const target = `${c.title || ""} ${c.notes || ""}`;
          matched = matchRelatedNews(target, c.ids || [], allItems, 5);
        }
        c.relatedNews = matched;
        return c;
      });
      risks = risks.map((r)=> {
        let matched = [];
        if (allItems.length){
          const target = `${r.description || ""} ${r.exitTrigger || ""}`;
          matched = matchRelatedNews(target, [], allItems, 5);
        }
        r.relatedNews = matched;
        return r;
      });
    }

    // Deterministic fallback one-liner if grounding fails.
    if (source === "fallback") {
      const s = (summary?.[0]) ? summary[0] : {};
      const fbPush = `Basket ${s.basket_ytd >= 0 ? "+" : ""}${(s.basket_ytd || 0).toFixed(1)}% YTD vs PAVE ${s.pave_ytd >= 0 ? "+" : ""}${(s.pave_ytd || 0).toFixed(1)}% · alpha ${s.alpha_pave_ytd >= 0 ? "+" : ""}${(s.alpha_pave_ytd || 0).toFixed(1)} pp. Narrative refresh pending.`;
      pushLine = fbPush.slice(0, 240);
      thesis = `Narrative generation did not produce a grounded record today. Quant tabs remain live. ${fbPush}`;
      deltas = []; catalysts = []; risks = [];
    }

    await ctx.self.ts("narrative","records").append([{
      date: todayMs,
      generatedAt: now,
      recordDate: recordDate,
      thesis: thesis,
      pushLine: pushLine,
      source: source,
      deltasJson: JSON.stringify(deltas).slice(0, 10000),
      catalystsJson: JSON.stringify(catalysts).slice(0, 14000),
      risksJson: JSON.stringify(risks).slice(0, 12000),
    }]);

    // ─── Push signal — fire on scalar diffs per template v1.6.0 ───
    //   first record                                   → always send
    //   deltas.length > 0                              → send
    //   any catalyst status flipped vs prior           → send
    //   risks.length changed vs prior                  → send
    //   High-priority risk count changed vs prior      → send
    //   fallback source + no signals                   → skip push (avoid noise)
    //   fallback source + signals                      → send deterministic substitute
    const priorCatalysts = prior ? (safeParse(prior.catalystsJson) || []) : [];
    const priorRisks = prior ? (safeParse(prior.risksJson) || []) : [];
    function catalystSig(arr){ return (arr||[]).map((c)=> `${c.title||''}|${c.status||''}`).sort().join('##'); }
    function highCount(arr){ return (arr||[]).filter((r)=> r.priority === 'High').length; }
    // Per template v1.6.2: push fires on strict INCREASE of risks.length or
    // High-priority count. Decreases do not trigger a push (the thesis
    // improving shouldn't spam followers).
    const catalystFlipped = prior && catalystSig(catalysts) !== catalystSig(priorCatalysts);
    const riskCountChanged = prior && risks.length > priorRisks.length;
    const highChanged = prior && highCount(risks) > highCount(priorRisks);

    let shouldPush = false;
    let pushReason = "";
    if (!prior) { shouldPush = true; pushReason = "first_record"; }
    else if (deltas && deltas.length > 0) { shouldPush = true; pushReason = "deltas"; }
    else if (catalystFlipped) { shouldPush = true; pushReason = "catalyst_flip"; }
    else if (riskCountChanged) { shouldPush = true; pushReason = "risk_count_change"; }
    else if (highChanged) { shouldPush = true; pushReason = "high_risk_change"; }
    if (source === "fallback" && !(deltas?.length) && !catalystFlipped && !riskCountChanged && !highChanged) {
      shouldPush = false;
    }

    if (shouldPush) {
      const dateLabel = recordDate.slice(5).replace("-","/");
      const title = `The Next AI Bottleneck · ${dateLabel}`;
      let pushText;
      if (source === "fallback" || !pushLine) {
        // Deterministic substitute when grounding failed but signals exist.
        const sParts = [];
        if (catalystFlipped) sParts.push("catalyst status flip");
        if (riskCountChanged) sParts.push(`risk count changed (${priorRisks.length}→${risks.length})`);
        if (highChanged) sParts.push(`High-priority risks ${highCount(priorRisks)}→${highCount(risks)}`);
        if (deltas?.length) sParts.push(`${deltas.length} new deltas`);
        pushText = `${title}\n\n${sParts.length ? sParts.join(" · ") : "Narrative refresh pending"}`;
      } else {
        pushText = `${title}\n\n${pushLine}`;
        if (deltas.length) {
          const d0 = deltas[0];
          pushText += `\n\n→ ${d0.label || ""}${d0.body ? ` — ${d0.body}` : ""}`;
        }
      }
      if (pushText.length > 490) pushText = `${pushText.slice(0, 487)}…`;

      await ctx.self.ts("signal","targets").append([{
        date: now,
        instruction: { type: "allocate", weights: [] },
        meta: { reason: pushText },
      }]);
      log(`Push fired (${pushReason}): ${pushText.length} chars`);
    } else {
      log("Push suppressed (no signal, fallback + quiet day).");
    }

    log(`ai-bottleneck narrative: source=${source}, ${deltas.length} deltas, ${catalysts.length} catalysts, ${risks.length} risks.`);
  });
})();
