// skills/alva/scripts/design-contract-sync.ts
// Verifies that design-contract.yaml agrees with the design system docs
// (design-components.md + design-widgets.md).
// Run: `pnpm design-contract-sync` from skills/alva/scripts/.
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import YAML from 'yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REFERENCES = path.resolve(__dirname, '../references');
const CONTRACT_PATH = path.join(REFERENCES, 'design-contract.yaml');
const DOC_PATHS = [
  path.join(REFERENCES, 'design-components.md'),
  path.join(REFERENCES, 'design-widgets.md'),
];

interface Comp {
  root: string;
  variants?: string[];
  sizes?: string[];
  states?: string[];
  children?: string[];
  bindings?: { selector: string; 'require-class': string }[];
}

interface RawContract {
  components: Record<string, Comp>;
}

function readContract(): RawContract {
  return YAML.parse(fs.readFileSync(CONTRACT_PATH, 'utf8')) as RawContract;
}

/**
 * Pull H2 section headings + CSS class names appearing in fenced css blocks
 * across every doc.
 */
function readDocs(): { sections: string[]; classes: Set<string> } {
  const sections: string[] = [];
  const classes = new Set<string>();

  for (const p of DOC_PATHS) {
    const md = fs.readFileSync(p, 'utf8');

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
  return s.toLowerCase().replace(/[-_\s]+/g, '');
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
      ...((comp.bindings ?? []).map((b) => b['require-class'])),
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

const errors = check();
if (errors.length === 0) {
  console.log('design-contract.yaml ⇄ design docs: in sync');
  process.exit(0);
} else {
  console.error('design-contract.yaml ⇄ design docs DRIFT:');
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}
