import { describe, it, expect } from "vitest";
import {
  extractCssBlocks,
  buildDesignSystemCss,
  findOrphanDeclarations,
  validateInputs,
} from "./build-design-system-css.js";

describe("extractCssBlocks", () => {
  it("extracts all ```css fenced blocks in document order", () => {
    const md = `
# Title
Some prose.
\`\`\`css
.btn { color: red; }
\`\`\`
More prose.
\`\`\`css
.tag { color: blue; }
\`\`\`
`;
    const blocks = extractCssBlocks(md);
    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toContain(".btn { color: red; }");
    expect(blocks[1]).toContain(".tag { color: blue; }");
  });

  it("returns [] when no css blocks present", () => {
    expect(extractCssBlocks("# Title\nProse only.")).toEqual([]);
  });

  it("ignores non-css code blocks (js, html, etc.)", () => {
    const md = `
\`\`\`js
const x = 1;
\`\`\`
\`\`\`css
.btn {}
\`\`\`
\`\`\`html
<div></div>
\`\`\`
`;
    expect(extractCssBlocks(md)).toHaveLength(1);
  });
});

describe("buildDesignSystemCss", () => {
  it("concatenates sources in order: tokens, globals, components, widgets", () => {
    const out = buildDesignSystemCss({
      tokensCss: ":root { --x: 1; }",
      designMd: "# design\n```css\nbody { font-family: Delight; }\n```",
      componentsMd: "## Button\n```css\n.btn { padding: 8px; }\n```",
      widgetsMd:
        "## Chart Card\n```css\n.chart-container { height: 100%; }\n```",
    });
    const tokensIdx = out.indexOf("--x: 1");
    const globalIdx = out.indexOf("font-family: Delight");
    const componentIdx = out.indexOf(".btn { padding: 8px");
    const widgetIdx = out.indexOf(".chart-container");
    expect(tokensIdx).toBeGreaterThanOrEqual(0);
    expect(globalIdx).toBeGreaterThan(tokensIdx);
    expect(componentIdx).toBeGreaterThan(globalIdx);
    expect(widgetIdx).toBeGreaterThan(componentIdx);
  });

  it("emits section-header comments", () => {
    const out = buildDesignSystemCss({
      tokensCss: ":root {}",
      designMd: "",
      componentsMd: "",
      widgetsMd: "",
    });
    expect(out).toMatch(/\/\* ════ Tokens ════ \*\//);
    expect(out).toMatch(/\/\* ════ Globals ════ \*\//);
    expect(out).toMatch(/\/\* ════ Components ════ \*\//);
    expect(out).toMatch(/\/\* ════ Widgets ════ \*\//);
  });

  it("is deterministic for same inputs", () => {
    const inputs = {
      tokensCss: ":root { --x: 1; }",
      designMd: "```css\nbody{}\n```",
      componentsMd: "```css\n.btn{}\n```",
      widgetsMd: "```css\n.chart-container{}\n```",
    };
    expect(buildDesignSystemCss(inputs)).toEqual(buildDesignSystemCss(inputs));
  });
});

describe("findOrphanDeclarations", () => {
  it("returns [] for valid CSS (all declarations nested in selectors)", () => {
    expect(
      findOrphanDeclarations(".btn { padding: 8px; color: red; }"),
    ).toEqual([]);
  });

  it("detects bare declarations at top level", () => {
    const orphans = findOrphanDeclarations(
      "-webkit-font-smoothing: antialiased;\n-moz-osx-font-smoothing: grayscale;",
    );
    expect(orphans).toHaveLength(2);
    expect(orphans[0]!.property).toBe("-webkit-font-smoothing");
    expect(orphans[1]!.property).toBe("-moz-osx-font-smoothing");
  });

  it("mixed: one orphan, one nested", () => {
    const orphans = findOrphanDeclarations("color: red;\nbody { padding: 0; }");
    expect(orphans).toHaveLength(1);
    expect(orphans[0]!.property).toBe("color");
  });

  it("records 1-based line numbers", () => {
    const orphans = findOrphanDeclarations("\n\ncolor: red;");
    expect(orphans[0]!.line).toBe(3);
  });
});

describe("validateInputs", () => {
  it("returns [] when every block is valid", () => {
    const errs = validateInputs({
      tokensCss: ":root { --x: 1; }",
      designMd: "```css\nbody { font-family: Delight; }\n```",
      componentsMd: "```css\n.btn { padding: 8px; }\n```",
      widgetsMd: "```css\n.chart-container { height: 100%; }\n```",
    });
    expect(errs).toEqual([]);
  });

  it("flags the original anti-aliasing bug: bare declarations in design.md", () => {
    const errs = validateInputs({
      tokensCss: ":root {}",
      designMd:
        "```css\n-webkit-font-smoothing: antialiased;\n-moz-osx-font-smoothing: grayscale;\ntext-rendering: optimizeLegibility;\n```",
      componentsMd: "",
      widgetsMd: "",
    });
    expect(errs).toHaveLength(3);
    expect(errs[0]!.source).toContain("design.md");
    expect(errs[0]!.property).toBe("-webkit-font-smoothing");
  });

  it("attributes errors to the right source file + block index", () => {
    const errs = validateInputs({
      tokensCss: "",
      designMd: "```css\nbody { padding: 0; }\n```\n```css\norphan: 1px;\n```",
      componentsMd: "",
      widgetsMd: "",
    });
    expect(errs).toHaveLength(1);
    expect(errs[0]!.source).toContain("design.md");
    expect(errs[0]!.source).toContain("#2");
  });
});
