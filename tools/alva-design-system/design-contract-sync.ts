// tools/alva-design-system/design-contract-sync.ts
// Verifies that design-contract.yaml agrees with the design system docs
// (design-components.md + design-widgets.md).
// Run: `pnpm design-contract-sync` from tools/alva-design-system/.
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "node:child_process";
import YAML from "yaml";
import * as csstree from "css-tree";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REFERENCES = path.resolve(__dirname, "../../skills/alva/references");
const CONTRACT_PATH = path.join(REFERENCES, "design-contract.yaml");
const DOC_PATHS = [
  path.join(REFERENCES, "design-components.md"),
  path.join(REFERENCES, "design-widgets.md"),
];

interface Comp {
  root: string;
  variants?: string[];
  sizes?: string[];
  states?: string[];
  children?: string[];
  bindings?: { selector: string; "require-class": string }[];
}

interface RawContract {
  components: Record<string, Comp>;
  global?: {
    typography?: {
      "font-family-root-must-include"?: string;
    };
  };
}

function readContract(): RawContract {
  return YAML.parse(fs.readFileSync(CONTRACT_PATH, "utf8")) as RawContract;
}

/**
 * Pull H2 section headings + CSS class names appearing in fenced css blocks
 * across every doc.
 */
function readDocs(): { sections: string[]; classes: Set<string> } {
  const sections: string[] = [];
  const classes = new Set<string>();

  for (const p of DOC_PATHS) {
    const md = fs.readFileSync(p, "utf8");

    const sectionRegex = /^## (.+)$/gm;
    let m: RegExpExecArray | null;
    while ((m = sectionRegex.exec(md))) {
      sections.push(m[1]!.trim());
    }

    const cssBlocks = md.match(/```css[\s\S]*?```/g) ?? [];
    for (const block of cssBlocks) {
      // Match `.classname` followed by anything that legitimately terminates an
      // identifier in a CSS selector: whitespace, `{`, `,`, `:`, `.` (chained),
      // `>` `+` `~` (combinators), `[` (attribute), or end of input.
      for (const c of block.matchAll(
        /\.([a-z][a-z0-9_-]+)(?=[\s\{,:.>+~\[]|$)/g,
      )) {
        classes.add(c[1]!);
      }
    }
  }

  return { sections, classes };
}

/** Normalize "Chart Card" or "chart-card" → "chartcard" for fuzzy matching. */
function norm(s: string): string {
  return s.toLowerCase().replace(/[-_\s]+/g, "");
}

function check(): string[] {
  const errors: string[] = [];
  const contract = readContract();
  const { sections, classes } = readDocs();

  const normalizedSections = sections.map(norm);

  for (const [name, comp] of Object.entries(contract.components)) {
    const declared = [
      comp.root,
      ...(comp.variants ?? []),
      ...(comp.sizes ?? []),
      ...(comp.states ?? []),
      ...(comp.children ?? []),
      ...(comp.bindings ?? []).map((b) => b["require-class"]),
    ];

    // 1) Every declared class must appear somewhere in the docs' CSS blocks.
    const missingClasses = declared.filter((cls) => !classes.has(cls));
    for (const cls of missingClasses) {
      errors.push(
        `Contract component '${name}' declares class '.${cls}' but it does not appear in any CSS block of the design docs`,
      );
    }

    // 2) Section-name sanity check — fuzzy match the component name against an
    //    H2 heading. If it doesn't match any heading we still accept the
    //    component as long as every declared class is documented (the check
    //    above). This keeps the check helpful for the common case while
    //    tolerating Shared-Styles-style heterogeneous helpers (widget-card,
    //    alva-watermark, divider, grid, …) and embedded examples (yt-modal,
    //    legend) that live under sections with unrelated names.
    const nName = norm(name);
    const sectionHit = normalizedSections.some(
      (s) => s.includes(nName) || nName.includes(s),
    );
    if (!sectionHit && missingClasses.length === 0) {
      // Soft pass — no error. (We trust the class-level check.)
    } else if (!sectionHit) {
      // Hard miss: name doesn't match any heading AND classes are also missing.
      // Class errors above already cover this; no need to double-report.
    }
  }
  return errors;
}

const ROOT_SELECTOR_RE = /^(body|html|:root|html\s*,\s*body|body\s*,\s*html)$/i;

/**
 * Walk the bundle and look for a body/html/:root ruleset whose font-family
 * declaration mentions the required family. The linter's `font-family-root`
 * rule auto-passes when a playbook <link>s the canonical bundle URL on the
 * assumption that the bundle delivers what the contract promises — this
 * check enforces that assumption at bundle build time.
 */
export function bundleDeliversRootFontFamily(
  bundle: string,
  required: string,
): boolean {
  let ast: csstree.CssNode;
  try {
    ast = csstree.parse(bundle);
  } catch {
    return false;
  }
  if (ast.type !== "StyleSheet") return false;

  let found = false;
  csstree.walk(ast, {
    visit: "Rule",
    enter(node) {
      if (found) return;
      if (node.type !== "Rule") return;
      const sel = csstree.generate(node.prelude).trim();
      if (!ROOT_SELECTOR_RE.test(sel)) return;
      csstree.walk(node.block, {
        visit: "Declaration",
        enter(d) {
          if (found) return;
          if (d.type !== "Declaration") return;
          if (d.property !== "font-family") return;
          const val = csstree.generate(d.value).toLowerCase();
          if (val.includes(required.toLowerCase())) found = true;
        },
      });
    },
  });
  return found;
}

function checkBundlePromises(): string[] {
  const errors: string[] = [];
  const contract = readContract();
  const required =
    contract.global?.typography?.["font-family-root-must-include"];
  if (!required) return errors;

  const bundlePath = path.join(REFERENCES, "css/design-system.css");
  if (!fs.existsSync(bundlePath)) return errors; // freshness check handles missing bundle
  const bundle = fs.readFileSync(bundlePath, "utf8");
  if (!bundleDeliversRootFontFamily(bundle, required)) {
    errors.push(
      `bundle promise broken: contract requires '${required}' as root font-family ` +
        `(font-family-root-must-include), but design-system.css has no body/html/:root rule ` +
        `that includes it. The linter auto-passes the font-family-root rule when a playbook ` +
        `<link>s the canonical bundle URL — that auto-pass is a lie until the bundle carries ` +
        `the rule. Add a 'body { font-family: "${required}", ... }' block to design.md.`,
    );
  }
  return errors;
}

function main(): void {
  const errors = check();
  errors.push(...checkBundlePromises());

  // CSS freshness check — re-run the design-system.css build and compare
  const cssCheck = spawnSync("tsx", ["build-design-system-css.ts", "--check"], {
    cwd: __dirname,
    stdio: "pipe",
    encoding: "utf8",
  });
  if (cssCheck.status !== 0) {
    errors.push(
      `design-system.css drift: ${(cssCheck.stderr || "").trim() || "build --check failed"}`,
    );
  }

  if (errors.length === 0) {
    console.log(
      "design-contract.yaml ⇄ design docs: in sync\ndesign-system.css: in sync",
    );
    process.exit(0);
  } else {
    console.error("design-contract.yaml ⇄ design docs DRIFT:");
    for (const e of errors) console.error("  - " + e);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
