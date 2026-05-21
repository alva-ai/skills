// Build the v1 design-system.css bundle from .md sources + design-tokens.css.
// Run: pnpm build-design-system-css         (writes the file)
//      pnpm build-design-system-css --check (CI mode: diff against committed)
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REFERENCES = path.resolve(__dirname, '../references');
const OUT_PATH = path.join(REFERENCES, 'css/design-system.css');

export function extractCssBlocks(md: string): string[] {
  const out: string[] = [];
  const re = /```css\s*\n([\s\S]*?)```/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(md))) {
    out.push(m[1]!);
  }
  return out;
}

export interface BuildInputs {
  tokensCss: string;
  designMd: string;
  componentsMd: string;
  widgetsMd: string;
}

export function buildDesignSystemCss(inputs: BuildInputs): string {
  const sections: string[] = [];

  sections.push('/* ════ Tokens ════ */');
  sections.push(inputs.tokensCss.trim());

  sections.push('');
  sections.push('/* ════ Globals ════ */');
  for (const block of extractCssBlocks(inputs.designMd)) {
    sections.push(block.trim());
  }

  sections.push('');
  sections.push('/* ════ Components ════ */');
  for (const block of extractCssBlocks(inputs.componentsMd)) {
    sections.push(block.trim());
  }

  sections.push('');
  sections.push('/* ════ Widgets ════ */');
  for (const block of extractCssBlocks(inputs.widgetsMd)) {
    sections.push(block.trim());
  }

  return sections.join('\n\n') + '\n';
}

function readSources(): BuildInputs {
  return {
    tokensCss: fs.readFileSync(path.join(REFERENCES, 'design-tokens.css'), 'utf8'),
    designMd: fs.readFileSync(path.join(REFERENCES, 'design.md'), 'utf8'),
    componentsMd: fs.readFileSync(path.join(REFERENCES, 'design-components.md'), 'utf8'),
    widgetsMd: fs.readFileSync(path.join(REFERENCES, 'design-widgets.md'), 'utf8'),
  };
}

async function main() {
  const checkMode = process.argv.includes('--check');
  const css = buildDesignSystemCss(readSources());

  if (checkMode) {
    if (!fs.existsSync(OUT_PATH)) {
      console.error(`design-system.css drift: ${OUT_PATH} does not exist`);
      process.exit(1);
    }
    const existing = fs.readFileSync(OUT_PATH, 'utf8');
    if (existing !== css) {
      console.error(
        `design-system.css drift: file does not match build output. Run 'pnpm build-design-system-css' and commit the result.`
      );
      process.exit(1);
    }
    console.log('design-system.css: in sync');
    return;
  }

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, css, 'utf8');
  console.log(`design-system.css: wrote ${css.length} bytes`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  void main();
}
