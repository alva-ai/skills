#!/usr/bin/env node

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const EVAL_DIR = resolve(SCRIPT_DIR, "..");
const DEFAULT_RESULTS_DIR = resolve(EVAL_DIR, "results");

function parseArgs(argv) {
  const opts = {
    resultsDir: DEFAULT_RESULTS_DIR,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--results-dir") {
      opts.resultsDir = resolve(argv[++i]);
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return opts;
}

function printHelp() {
  console.log(`Usage: node render-dashboard.mjs [options]

Builds a self-contained local HTML dashboard from the latest Skillhub baseline
run artifacts.

Options:
  --results-dir <path>   Directory containing run-summary.json and scorecards.json.
  -h, --help             Show this help.
`);
}

function loadJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function round(value) {
  return Number(value.toFixed(2));
}

function summarize(summary, scorecards) {
  const totals = scorecards.reduce(
    (acc, card) => {
      acc.total += card.score.total;
      acc.shared += card.score.shared;
      acc.specific += card.score.case_specific;
      acc.cost += card.agent_run.total_cost_usd || 0;
      acc.durationMs += card.agent_run.duration_ms || 0;
      acc.commands += card.agent_run.bash_commands.length;
      return acc;
    },
    { total: 0, shared: 0, specific: 0, cost: 0, durationMs: 0, commands: 0 },
  );
  const possible = {
    total: scorecards.length * 100,
    shared: scorecards.length * 70,
    specific: scorecards.length * 30,
  };
  const rubricCounts = countRubricStatuses(scorecards);
  return {
    run_id: summary.run_id,
    generated_at: summary.generated_at,
    profile: summary.profile,
    mode: summary.mode,
    caveat: summary.caveat,
    cases_total: scorecards.length,
    scores: summary.scores,
    agent_runs: summary.agent_runs,
    possible,
    awarded: {
      total: round(totals.total),
      shared: round(totals.shared),
      specific: round(totals.specific),
    },
    lost: {
      total: round(possible.total - totals.total),
      shared: round(possible.shared - totals.shared),
      specific: round(possible.specific - totals.specific),
    },
    cost_usd: round(totals.cost),
    duration_minutes: round(totals.durationMs / 60000),
    command_count: totals.commands,
    rubric_status_counts: rubricCounts,
  };
}

function countRubricStatuses(scorecards) {
  const counts = {
    all: { full: 0, partial: 0, zero: 0 },
    shared: { full: 0, partial: 0, zero: 0 },
    case_specific: { full: 0, partial: 0, zero: 0 },
  };
  for (const card of scorecards) {
    for (const item of card.shared_rubric) {
      counts.shared[item.status] += 1;
      counts.all[item.status] += 1;
    }
    for (const item of card.case_specific_rubric) {
      counts.case_specific[item.status] += 1;
      counts.all[item.status] += 1;
    }
  }
  return counts;
}

function failedItems(items) {
  return items
    .filter((item) => item.points_awarded < item.points_possible)
    .map((item) => ({
      id: item.id,
      tags: item.tags,
      status: item.status,
      possible: item.points_possible,
      awarded: item.points_awarded,
      lost: round(item.points_possible - item.points_awarded),
      failed_checks: item.failed_checks,
      passed_checks: item.passed_checks,
    }));
}

function buildCaseData(scorecards) {
  return scorecards.map((card) => {
    const sharedFailed = failedItems(card.shared_rubric);
    const specificFailed = failedItems(card.case_specific_rubric);
    return {
      case_id: card.case_id,
      skill_id: card.skill_id,
      disabled: card.disabled,
      execution_mode: card.execution_mode,
      score: card.score,
      lost: {
        total: round(100 - card.score.total),
        shared: round(70 - card.score.shared),
        specific: round(30 - card.score.case_specific),
      },
      failed_counts: {
        shared: sharedFailed.length,
        specific: specificFailed.length,
      },
      agent_run: {
        status: card.agent_run.status,
        timed_out: card.agent_run.timed_out,
        reused_raw: card.agent_run.reused_raw,
        duration_ms: card.agent_run.duration_ms,
        total_cost_usd: round(card.agent_run.total_cost_usd || 0),
        command_count: card.agent_run.bash_commands.length,
      },
      shared_failed: sharedFailed,
      specific_failed: specificFailed,
    };
  });
}

function aggregateFailures(cases) {
  const aggregate = new Map();
  for (const testCase of cases) {
    for (const area of ["shared_failed", "specific_failed"]) {
      for (const item of testCase[area]) {
        const key = item.id;
        const entry = aggregate.get(key) || {
          id: key,
          area: area === "shared_failed" ? "shared" : "case-specific",
          count: 0,
          lost: 0,
          cases: [],
          failed_checks: item.failed_checks,
        };
        entry.count += 1;
        entry.lost = round(entry.lost + item.lost);
        entry.cases.push(testCase.skill_id);
        aggregate.set(key, entry);
      }
    }
  }
  return [...aggregate.values()].sort((a, b) => b.lost - a.lost);
}

function escapeJsonForScript(value) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

function renderHtml(data) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Skillhub Baseline Scoring Dashboard</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f7f8f3;
        --surface: #ffffff;
        --surface-2: #eef4f1;
        --ink: #1f2a2e;
        --muted: #617079;
        --line: #d6ddd8;
        --teal: #13746c;
        --blue: #2f5f9f;
        --amber: #b7791f;
        --red: #ba3f34;
        --green: #2f7d51;
        --shadow: 0 1px 2px rgb(22 34 38 / 10%);
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        background: var(--bg);
        color: var(--ink);
        font:
          14px/1.45 Inter,
          ui-sans-serif,
          system-ui,
          -apple-system,
          BlinkMacSystemFont,
          "Segoe UI",
          sans-serif;
      }

      a {
        color: var(--blue);
        text-decoration: none;
      }

      a:hover {
        text-decoration: underline;
      }

      .page {
        width: min(1440px, calc(100vw - 32px));
        margin: 0 auto;
        padding: 28px 0 48px;
      }

      header {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 24px;
        align-items: end;
        padding: 0 0 18px;
        border-bottom: 1px solid var(--line);
      }

      h1 {
        margin: 0;
        font-size: 28px;
        line-height: 1.12;
        font-weight: 760;
        letter-spacing: 0;
      }

      .subtitle {
        margin: 8px 0 0;
        max-width: 860px;
        color: var(--muted);
        font-size: 14px;
      }

      .links {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        justify-content: flex-end;
      }

      .link-button,
      button {
        min-height: 34px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--surface);
        color: var(--ink);
        padding: 7px 11px;
        font: inherit;
        box-shadow: var(--shadow);
        cursor: pointer;
      }

      .link-button {
        display: inline-flex;
        align-items: center;
      }

      button[aria-pressed="true"] {
        border-color: var(--teal);
        background: #e5f2ef;
        color: #0d5852;
      }

      .band {
        margin-top: 18px;
        padding: 16px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--surface-2);
      }

      .band strong {
        color: #123c3a;
      }

      .metrics {
        display: grid;
        grid-template-columns: repeat(6, minmax(150px, 1fr));
        gap: 12px;
        margin-top: 18px;
      }

      .metric {
        min-height: 102px;
        padding: 14px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--surface);
        box-shadow: var(--shadow);
      }

      .metric .label {
        color: var(--muted);
        font-size: 12px;
        text-transform: uppercase;
      }

      .metric .value {
        margin-top: 8px;
        font-size: 25px;
        line-height: 1;
        font-weight: 780;
      }

      .metric .note {
        margin-top: 8px;
        color: var(--muted);
        font-size: 12px;
      }

      .grid {
        display: grid;
        grid-template-columns: minmax(340px, 0.95fr) minmax(520px, 1.55fr);
        gap: 16px;
        margin-top: 18px;
      }

      section {
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--surface);
        box-shadow: var(--shadow);
      }

      .section-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 14px 16px;
        border-bottom: 1px solid var(--line);
      }

      h2 {
        margin: 0;
        font-size: 16px;
        letter-spacing: 0;
      }

      .section-body {
        padding: 16px;
      }

      .loss-row {
        margin-bottom: 14px;
      }

      .loss-top {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        color: var(--muted);
        font-size: 12px;
      }

      .bar {
        position: relative;
        height: 10px;
        margin-top: 6px;
        overflow: hidden;
        border-radius: 999px;
        background: #e8ece7;
      }

      .bar > span {
        display: block;
        height: 100%;
        border-radius: inherit;
      }

      .bar .shared {
        background: var(--amber);
      }

      .bar .specific {
        background: var(--red);
      }

      .bar .score {
        background: var(--teal);
      }

      .bar .full {
        background: var(--green);
      }

      .bar .partial {
        background: var(--amber);
      }

      .bar .zero {
        background: var(--red);
      }

      .stack {
        display: flex;
      }

      .stack span {
        border-radius: 0;
      }

      .stack span:first-child {
        border-top-left-radius: 999px;
        border-bottom-left-radius: 999px;
      }

      .stack span:last-child {
        border-top-right-radius: 999px;
        border-bottom-right-radius: 999px;
      }

      .controls {
        display: grid;
        grid-template-columns: minmax(220px, 1fr) auto;
        gap: 12px;
        margin-bottom: 14px;
      }

      input[type="search"] {
        width: 100%;
        min-height: 36px;
        border: 1px solid var(--line);
        border-radius: 8px;
        padding: 8px 10px;
        background: var(--surface);
        color: var(--ink);
        font: inherit;
      }

      .filters {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        justify-content: flex-end;
      }

      table {
        width: 100%;
        border-collapse: collapse;
      }

      th,
      td {
        padding: 10px 8px;
        border-bottom: 1px solid var(--line);
        text-align: left;
        vertical-align: top;
      }

      th {
        color: var(--muted);
        font-size: 12px;
        font-weight: 650;
        text-transform: uppercase;
      }

      td.num,
      th.num {
        text-align: right;
      }

      tbody tr:hover {
        background: #f7faf8;
      }

      .skill {
        font-weight: 700;
      }

      .case-id {
        margin-top: 3px;
        color: var(--muted);
        font-size: 12px;
      }

      .pill {
        display: inline-flex;
        align-items: center;
        min-height: 22px;
        padding: 2px 7px;
        border-radius: 999px;
        border: 1px solid var(--line);
        color: var(--muted);
        background: #fafbf8;
        font-size: 12px;
      }

      .pill.red {
        border-color: #e5b5b0;
        color: #8f2e27;
        background: #fff1ef;
      }

      .pill.amber {
        border-color: #e9c98f;
        color: #84530d;
        background: #fff8e8;
      }

      details {
        max-width: 620px;
      }

      summary {
        cursor: pointer;
        color: var(--blue);
      }

      .failure {
        margin-top: 10px;
        padding: 10px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: #fbfcf9;
      }

      .failure-title {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        font-weight: 700;
      }

      .failure ul {
        margin: 8px 0 0 18px;
        padding: 0;
      }

      .failure li {
        margin: 4px 0;
      }

      .empty {
        color: var(--muted);
      }

      @media (max-width: 1100px) {
        .metrics {
          grid-template-columns: repeat(3, minmax(150px, 1fr));
        }

        .grid {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 760px) {
        .page {
          width: min(100vw - 18px, 720px);
          padding-top: 18px;
        }

        header,
        .controls {
          grid-template-columns: 1fr;
        }

        .links,
        .filters {
          justify-content: flex-start;
        }

        .metrics {
          grid-template-columns: 1fr 1fr;
        }

        table,
        thead,
        tbody,
        tr,
        th,
        td {
          display: block;
        }

        thead {
          display: none;
        }

        tr {
          padding: 12px 0;
          border-bottom: 1px solid var(--line);
        }

        td {
          border: 0;
          padding: 5px 8px;
        }

        td.num {
          text-align: left;
        }
      }
    </style>
  </head>
  <body>
    <div class="page">
      <header>
        <div>
          <h1>Skillhub Baseline Scoring Dashboard</h1>
          <p class="subtitle" id="subtitle"></p>
        </div>
        <nav class="links" aria-label="Local artifacts">
          <a class="link-button" href="./report.md">Run report</a>
          <a class="link-button" href="./scoring-issue-report.md">Scoring issue report</a>
          <a class="link-button" href="./scorecards.json">Scorecards JSON</a>
        </nav>
      </header>

      <div class="band">
        <strong>Interpretation:</strong>
        <span id="interpretation"></span>
      </div>

      <div class="metrics" id="metrics"></div>

      <div class="grid">
        <section>
          <div class="section-head">
            <h2>Where Points Were Lost</h2>
            <span class="pill" id="loss-total"></span>
          </div>
          <div class="section-body" id="loss-breakdown"></div>
        </section>

        <section>
          <div class="section-head">
            <h2>Rubric Status Mix</h2>
            <span class="pill" id="status-total"></span>
          </div>
          <div class="section-body" id="status-breakdown"></div>
        </section>
      </div>

      <section style="margin-top: 18px">
        <div class="section-head">
          <h2>Case Deductions</h2>
          <span class="pill" id="case-count"></span>
        </div>
        <div class="section-body">
          <div class="controls">
            <input id="search" type="search" placeholder="Search skill, case, or failed check" />
            <div class="filters" id="filters">
              <button type="button" data-filter="all" aria-pressed="true">All</button>
              <button type="button" data-filter="shared">Shared loss</button>
              <button type="button" data-filter="specific">Case-specific loss</button>
              <button type="button" data-filter="lowest">Lowest scores</button>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Skill</th>
                <th class="num">Score</th>
                <th class="num">Shared lost</th>
                <th class="num">Specific lost</th>
                <th>Deductions</th>
              </tr>
            </thead>
            <tbody id="case-table"></tbody>
          </table>
        </div>
      </section>

      <section style="margin-top: 18px">
        <div class="section-head">
          <h2>Top Deduction Criteria</h2>
          <span class="pill">aggregated</span>
        </div>
        <div class="section-body" id="top-criteria"></div>
      </section>
    </div>

    <script id="dashboard-data" type="application/json">${escapeJsonForScript(
      data,
    )}</script>
    <script>
      const data = JSON.parse(
        document.getElementById("dashboard-data").textContent,
      );
      const state = { filter: "all", query: "" };

      function fmt(value) {
        return Number(value).toLocaleString(undefined, {
          maximumFractionDigits: 2,
        });
      }

      function pct(value, total) {
        if (!total) return 0;
        return Math.max(0, Math.min(100, (value / total) * 100));
      }

      function textMatch(testCase, query) {
        if (!query) return true;
        const blob = [
          testCase.case_id,
          testCase.skill_id,
          ...testCase.shared_failed.map((item) => item.id),
          ...testCase.specific_failed.map((item) => item.id),
          ...testCase.shared_failed.flatMap((item) => item.failed_checks),
          ...testCase.specific_failed.flatMap((item) => item.failed_checks),
        ]
          .join(" ")
          .toLowerCase();
        return blob.includes(query.toLowerCase());
      }

      function filterCase(testCase) {
        if (!textMatch(testCase, state.query)) return false;
        if (state.filter === "shared") return testCase.lost.shared > 0;
        if (state.filter === "specific") return testCase.lost.specific > 0;
        if (state.filter === "lowest") return testCase.score.total <= 70;
        return true;
      }

      function renderMetrics() {
        const summary = data.summary;
        const metrics = [
          ["Average score", fmt(summary.scores.average) + "/100", "Range " + fmt(summary.scores.min) + ".." + fmt(summary.scores.max)],
          ["Total lost", fmt(summary.lost.total), fmt(summary.awarded.total) + " awarded of " + fmt(summary.possible.total)],
          ["Shared lost", fmt(summary.lost.shared), fmt(summary.awarded.shared) + " awarded of " + fmt(summary.possible.shared)],
          ["Specific lost", fmt(summary.lost.specific), fmt(summary.awarded.specific) + " awarded of " + fmt(summary.possible.specific)],
          ["Agent runs", summary.cases_total + "/17", "Status 0, timeouts " + summary.agent_runs.timed_out],
          ["Run cost", "$" + fmt(summary.cost_usd), fmt(summary.duration_minutes) + " agent minutes"],
        ];
        document.getElementById("metrics").innerHTML = metrics
          .map(
            ([label, value, note]) => '<div class="metric"><div class="label">' +
              label +
              '</div><div class="value">' +
              value +
              '</div><div class="note">' +
              note +
              "</div></div>",
          )
          .join("");
      }

      function renderBreakdowns() {
        const summary = data.summary;
        document.getElementById("loss-total").textContent =
          fmt(summary.lost.total) + " lost";
        const lossRows = [
          ["Shared rubric", summary.lost.shared, summary.possible.shared, "shared"],
          ["Case-specific rubric", summary.lost.specific, summary.possible.specific, "specific"],
        ];
        document.getElementById("loss-breakdown").innerHTML = lossRows
          .map(
            ([label, lost, possible, className]) =>
              '<div class="loss-row"><div class="loss-top"><span>' +
              label +
              '</span><span>' +
              fmt(lost) +
              " lost of " +
              fmt(possible) +
              '</span></div><div class="bar"><span class="' +
              className +
              '" style="width:' +
              pct(lost, possible) +
              '%"></span></div></div>',
          )
          .join("");

        const counts = summary.rubric_status_counts.all;
        const total = counts.full + counts.partial + counts.zero;
        document.getElementById("status-total").textContent = total + " criteria";
        document.getElementById("status-breakdown").innerHTML =
          '<div class="loss-row"><div class="loss-top"><span>All criteria</span><span>full=' +
          counts.full +
          ", partial=" +
          counts.partial +
          ", zero=" +
          counts.zero +
          '</span></div><div class="bar stack"><span class="full" style="width:' +
          pct(counts.full, total) +
          '%"></span><span class="partial" style="width:' +
          pct(counts.partial, total) +
          '%"></span><span class="zero" style="width:' +
          pct(counts.zero, total) +
          '%"></span></div></div>';
      }

      function renderFailureGroup(title, items) {
        if (!items.length) return '<div class="empty">' + title + ": none</div>";
        return (
          '<div class="failure"><div class="failure-title"><span>' +
          title +
          '</span><span>' +
          fmt(items.reduce((total, item) => total + item.lost, 0)) +
          " lost</span></div>" +
          items
            .map(
              (item) =>
                '<div class="failure"><div class="failure-title"><span>' +
                item.id +
                '</span><span>' +
                fmt(item.lost) +
                " lost</span></div><ul>" +
                item.failed_checks.map((check) => "<li>" + check + "</li>").join("") +
                "</ul></div>",
            )
            .join("") +
          "</div>"
        );
      }

      function renderCases() {
        const rows = data.cases.filter(filterCase);
        document.getElementById("case-count").textContent =
          rows.length + " of " + data.cases.length + " shown";
        document.getElementById("case-table").innerHTML = rows
          .map((testCase) => {
            const badge = testCase.disabled
              ? '<span class="pill amber">disabled</span>'
              : '<span class="pill">enabled</span>';
            const scoreBar =
              '<div class="bar"><span class="score" style="width:' +
              testCase.score.total +
              '%"></span></div>';
            return (
              '<tr><td><div class="skill">' +
              testCase.skill_id +
              " " +
              badge +
              '</div><div class="case-id">' +
              testCase.case_id +
              '</div></td><td class="num">' +
              fmt(testCase.score.total) +
              scoreBar +
              '</td><td class="num">' +
              fmt(testCase.lost.shared) +
              '</td><td class="num">' +
              fmt(testCase.lost.specific) +
              '</td><td><details><summary>' +
              (testCase.failed_counts.shared + testCase.failed_counts.specific) +
              " failed criteria</summary>" +
              renderFailureGroup("Shared", testCase.shared_failed) +
              renderFailureGroup("Case-specific", testCase.specific_failed) +
              "</details></td></tr>"
            );
          })
          .join("");
      }

      function renderTopCriteria() {
        document.getElementById("top-criteria").innerHTML = data.top_criteria
          .slice(0, 18)
          .map(
            (item) =>
              '<div class="failure"><div class="failure-title"><span>' +
              item.id +
              ' <span class="pill">' +
              item.area +
              '</span></span><span>' +
              fmt(item.lost) +
              ' lost</span></div><div class="case-id">' +
              item.count +
              " case(s): " +
              item.cases.join(", ") +
              "</div><ul>" +
              item.failed_checks.map((check) => "<li>" + check + "</li>").join("") +
              "</ul></div>",
          )
          .join("");
      }

      function bindControls() {
        document.getElementById("search").addEventListener("input", (event) => {
          state.query = event.target.value;
          renderCases();
        });
        for (const button of document.querySelectorAll("[data-filter]")) {
          button.addEventListener("click", () => {
            state.filter = button.dataset.filter;
            for (const other of document.querySelectorAll("[data-filter]")) {
              other.setAttribute("aria-pressed", String(other === button));
            }
            renderCases();
          });
        }
      }

      document.getElementById("subtitle").textContent =
        data.summary.run_id +
        " | " +
        data.summary.profile +
        " | " +
        data.summary.mode +
        " | generated " +
        data.summary.generated_at;
      document.getElementById("interpretation").textContent =
        "This is an evidence-slice execution score for the Alva skill plus each blueprint. It is not a standalone blueprint-quality benchmark or proof of full playbook production success.";
      renderMetrics();
      renderBreakdowns();
      renderCases();
      renderTopCriteria();
      bindControls();
    </script>
  </body>
</html>
`;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const summary = loadJson(resolve(opts.resultsDir, "run-summary.json"));
  const scorecards = loadJson(resolve(opts.resultsDir, "scorecards.json"));
  const cases = buildCaseData(scorecards);
  const data = {
    summary: summarize(summary, scorecards),
    cases,
    top_criteria: aggregateFailures(cases),
  };
  mkdirSync(opts.resultsDir, { recursive: true });
  writeFileSync(resolve(opts.resultsDir, "dashboard.html"), renderHtml(data));
  console.log(`Wrote ${resolve(opts.resultsDir, "dashboard.html")}`);
}

main();
