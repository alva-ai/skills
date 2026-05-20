// skills/alva/scripts/design-contract-sync.ts
// Verifies that design-contract.yaml and design-components.md agree.
// Run: `pnpm design-contract-sync` from skills/alva/scripts/.
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import YAML from 'yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REFERENCES = path.resolve(__dirname, '../references');
const CONTRACT_PATH = path.join(REFERENCES, 'design-contract.yaml');
const COMPONENTS_PATH = path.join(REFERENCES, 'design-components.md');

interface Comp {
  root: string;
  variants?: string[];
  sizes?: string[];
  states?: string[];
  children?: string[];
}

interface RawContract {
  components: Record<string, Comp>;
}

function readContract(): RawContract {
  return YAML.parse(fs.readFileSync(CONTRACT_PATH, 'utf8')) as RawContract;
}

/** Pull H2 component sections + CSS classes appearing in fenced css blocks */
function readComponentsDoc(): { sections: string[]; classes: Set<string> } {
  const md = fs.readFileSync(COMPONENTS_PATH, 'utf8');
  const sections: string[] = [];
  const classes = new Set<string>();

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
    for (const c of block.matchAll(/\.([a-z][a-z0-9_-]+)(?=[\s\{,:.>+~\[]|$)/g)) {
      classes.add(c[1]!);
    }
  }

  return { sections, classes };
}

function check(): string[] {
  const errors: string[] = [];
  const contract = readContract();
  const { sections, classes } = readComponentsDoc();

  const sectionLower = new Set(sections.map((s) => s.toLowerCase()));

  for (const [name, comp] of Object.entries(contract.components)) {
    if (![...sectionLower].some((s) => s.includes(name))) {
      errors.push(
        `Contract has component '${name}' but no matching ## section found in design-components.md`,
      );
    }
    const declared = [
      comp.root,
      ...(comp.variants ?? []),
      ...(comp.sizes ?? []),
      ...(comp.states ?? []),
      ...(comp.children ?? []),
    ];
    for (const cls of declared) {
      if (!classes.has(cls)) {
        errors.push(
          `Contract component '${name}' declares class '.${cls}' but it does not appear in any CSS block of design-components.md`,
        );
      }
    }
  }
  return errors;
}

const errors = check();
if (errors.length === 0) {
  console.log('design-contract.yaml ⇄ design-components.md: in sync');
  process.exit(0);
} else {
  console.error('design-contract.yaml ⇄ design-components.md DRIFT:');
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}
