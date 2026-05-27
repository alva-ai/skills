// Build the v1 design-system.css bundle from .md sources + design-tokens.css.
// Run from tools/alva-design-system/:
//      pnpm build-design-system-css         (writes the file)
//      pnpm build-design-system-css --check (CI mode: diff against committed)
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import * as csstree from "css-tree";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REFERENCES = path.resolve(__dirname, "../../skills/alva/references");
const OUT_PATH = path.join(REFERENCES, "css/design-system.css");

export function extractCssBlocks(md: string): string[] {
  const out: string[] = [];
  const re = /```css\s*\n([\s\S]*?)```/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(md))) {
    out.push(m[1]!);
  }
  return out;
}

/**
 * Find CSS property declarations sitting OUTSIDE any selector block.
 * Returns one entry per orphan, with the property name and 1-based line.
 *
 * Catches the case where a doc author writes a ```css block as a
 * documentation snippet (just declarations) instead of a complete CSS rule.
 * Such blocks would produce dead-code declarations in the built bundle
 * (browsers silently drop top-level declarations).
 */
export function findOrphanDeclarations(
  css: string,
): { line: number; property: string }[] {
  const orphans: { line: number; property: string }[] = [];
  let ast: csstree.CssNode;
  try {
    ast = csstree.parse(css, { positions: true });
  } catch {
    return orphans; // parse error — let downstream handle
  }
  if (ast.type !== "StyleSheet") return orphans;

  // css-tree is "be liberal in what you accept": it never produces a
  // top-level Declaration node. Bare declarations end up as:
  //  (a) a top-level Raw node when there is no following selector, OR
  //  (b) the prelude of a Rule, with prelude.type === 'Raw' (the bare
  //      declarations get folded into the selector position).
  // We probe both cases by pattern-matching `property: value;` inside
  // Raw text. Vendor prefixes (-webkit-…) and CSS custom properties
  // (--foo) both start with one or two dashes.
  const DECL_RE = /(-{0,2}[a-zA-Z][\w-]*)\s*:\s*[^;{}]+;/g;

  const probeRaw = (rawText: string, baseLine: number): void => {
    let m: RegExpExecArray | null;
    while ((m = DECL_RE.exec(rawText))) {
      const before = rawText.slice(0, m.index);
      const lineOffset = before.split("\n").length - 1;
      orphans.push({ property: m[1]!, line: baseLine + lineOffset });
    }
    DECL_RE.lastIndex = 0;
  };

  ast.children.forEach((node) => {
    const startLine = node.loc?.start.line ?? 0;
    if (node.type === "Raw") {
      probeRaw(node.value, startLine);
    } else if (node.type === "Rule" && node.prelude.type === "Raw") {
      probeRaw(node.prelude.value, node.prelude.loc?.start.line ?? startLine);
    }
  });
  return orphans;
}

export interface BuildInputs {
  tokensCss: string;
  designMd: string;
  componentsMd: string;
  widgetsMd: string;
}

export interface CssBlockError {
  source: string; // e.g. "design.md block #2"
  property: string;
  line: number; // line within the block
}

/**
 * Validate every ```css block across the .md sources. Returns a list of
 * orphan declarations (declarations that appear at top level, not nested
 * in any selector). An empty list means every block is structurally valid.
 *
 * Builders should fail loudly when this returns anything.
 */
export function validateInputs(inputs: BuildInputs): CssBlockError[] {
  const errors: CssBlockError[] = [];
  const docs = [
    { name: "design.md", md: inputs.designMd },
    { name: "design-components.md", md: inputs.componentsMd },
    { name: "design-widgets.md", md: inputs.widgetsMd },
  ];
  for (const doc of docs) {
    const blocks = extractCssBlocks(doc.md);
    blocks.forEach((block, idx) => {
      for (const o of findOrphanDeclarations(block)) {
        errors.push({
          source: doc.name + " ```css block #" + String(idx + 1),
          property: o.property,
          line: o.line,
        });
      }
    });
  }
  return errors;
}

export function buildDesignSystemCss(inputs: BuildInputs): string {
  const sections: string[] = [];

  sections.push("/* ════ Tokens ════ */");
  sections.push(inputs.tokensCss.trim());

  sections.push("");
  sections.push("/* ════ Globals ════ */");
  for (const block of extractCssBlocks(inputs.designMd)) {
    sections.push(block.trim());
  }

  sections.push("");
  sections.push("/* ════ Components ════ */");
  for (const block of extractCssBlocks(inputs.componentsMd)) {
    sections.push(block.trim());
  }

  sections.push("");
  sections.push("/* ════ Widgets ════ */");
  for (const block of extractCssBlocks(inputs.widgetsMd)) {
    sections.push(block.trim());
  }

  return sections.join("\n\n") + "\n";
}

function readSources(): BuildInputs {
  return {
    tokensCss: fs.readFileSync(
      path.join(REFERENCES, "design-tokens.css"),
      "utf8",
    ),
    designMd: fs.readFileSync(path.join(REFERENCES, "design.md"), "utf8"),
    componentsMd: fs.readFileSync(
      path.join(REFERENCES, "design-components.md"),
      "utf8",
    ),
    widgetsMd: fs.readFileSync(
      path.join(REFERENCES, "design-widgets.md"),
      "utf8",
    ),
  };
}

async function main() {
  const checkMode = process.argv.includes("--check");
  const inputs = readSources();

  // Validate ```css blocks before building. Catches "documentation snippet"
  // blocks that contain bare property declarations without a selector —
  // browsers silently drop those, so a passing build with orphans is a
  // false negative.
  const inputErrors = validateInputs(inputs);
  if (inputErrors.length > 0) {
    console.error(
      `design-system.css build aborted: ${inputErrors.length} orphan declaration(s) in .md \`\`\`css blocks:`,
    );
    for (const e of inputErrors) {
      console.error(
        `  ${e.source} (L${e.line}): '${e.property}' is not inside any selector`,
      );
    }
    console.error(
      `Wrap each property declaration inside a selector block (e.g. \`body { ... }\`), or remove the block.`,
    );
    process.exit(1);
  }

  const css = buildDesignSystemCss(inputs);

  if (checkMode) {
    if (!fs.existsSync(OUT_PATH)) {
      console.error(`design-system.css drift: ${OUT_PATH} does not exist`);
      process.exit(1);
    }
    const existing = fs.readFileSync(OUT_PATH, "utf8");
    if (existing !== css) {
      console.error(
        `design-system.css drift: file does not match build output. Run 'pnpm build-design-system-css' and commit the result.`,
      );
      process.exit(1);
    }
    console.log("design-system.css: in sync");
    return;
  }

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, css, "utf8");
  console.log(`design-system.css: wrote ${css.length} bytes`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  void main();
}
