import { describe, it, expect } from 'vitest';
import { extractCssBlocks, buildDesignSystemCss } from './build-design-system-css.js';

describe('extractCssBlocks', () => {
  it('extracts all ```css fenced blocks in document order', () => {
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
    expect(blocks[0]).toContain('.btn { color: red; }');
    expect(blocks[1]).toContain('.tag { color: blue; }');
  });

  it('returns [] when no css blocks present', () => {
    expect(extractCssBlocks('# Title\nProse only.')).toEqual([]);
  });

  it('ignores non-css code blocks (js, html, etc.)', () => {
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

describe('buildDesignSystemCss', () => {
  it('concatenates sources in order: tokens, globals, components, widgets', () => {
    const out = buildDesignSystemCss({
      tokensCss: ':root { --x: 1; }',
      designMd: '# design\n```css\nbody { font-family: Delight; }\n```',
      componentsMd: '## Button\n```css\n.btn { padding: 8px; }\n```',
      widgetsMd: '## Chart Card\n```css\n.chart-container { height: 100%; }\n```',
    });
    const tokensIdx = out.indexOf('--x: 1');
    const globalIdx = out.indexOf('font-family: Delight');
    const componentIdx = out.indexOf('.btn { padding: 8px');
    const widgetIdx = out.indexOf('.chart-container');
    expect(tokensIdx).toBeGreaterThanOrEqual(0);
    expect(globalIdx).toBeGreaterThan(tokensIdx);
    expect(componentIdx).toBeGreaterThan(globalIdx);
    expect(widgetIdx).toBeGreaterThan(componentIdx);
  });

  it('emits section-header comments', () => {
    const out = buildDesignSystemCss({
      tokensCss: ':root {}',
      designMd: '',
      componentsMd: '',
      widgetsMd: '',
    });
    expect(out).toMatch(/\/\* ════ Tokens ════ \*\//);
    expect(out).toMatch(/\/\* ════ Globals ════ \*\//);
    expect(out).toMatch(/\/\* ════ Components ════ \*\//);
    expect(out).toMatch(/\/\* ════ Widgets ════ \*\//);
  });

  it('is deterministic for same inputs', () => {
    const inputs = {
      tokensCss: ':root { --x: 1; }',
      designMd: '```css\nbody{}\n```',
      componentsMd: '```css\n.btn{}\n```',
      widgetsMd: '```css\n.chart-container{}\n```',
    };
    expect(buildDesignSystemCss(inputs)).toEqual(buildDesignSystemCss(inputs));
  });
});
