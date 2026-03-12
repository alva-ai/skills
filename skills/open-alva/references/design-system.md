
# Alva Design System

## Design Tokens

### Color Tokens

```css
@layer tokens.static {
  :root {
    /* ── Common ── */
    --b-common-white: #ffffff;
    --b-common-black: #000000;

    /* ── Semantic Brand ── */
    --main-m1: #49a3a6; /* Alva Theme */
    --main-m1-10: #49a3a6; /* Alva Theme with transparency */
    --main-m2: #2196f3; /* Link */
    --main-m2-10: rgba(33, 150, 243, 0.1); /* Link with transparency */
    --main-m3: #2a9b7d; /* Bullish */
    --main-m3-10: rgba(42, 155, 125, 0.1); /* Bullish with transparency */
    --main-m4: #e05357; /* Bearish */
    --main-m4-10: rgba(224, 83, 87, 0.1); /* Bearish with transparency */
    --main-m5: #e6a91a; /* Alert */
    --main-m5-10: rgba(230, 169, 26, 0.1); /* Alert with transparency */
    --main-m6: #ff9800; /* Emphasize */
    --main-m6-10: rgba(255, 152, 0, 0.1); /* Emphasize with transparency */
    --main-m7: rgba(0, 0, 0, 0.6); /* Modal Mask */

    /* ── Chart ── */
    --chart-orange1-main: #ff9800;
    --chart-orange1-1: #ffbb1c;
    --chart-orange1-2: #f8cb86;
    --chart-green1-main: #40a544;
    --chart-green1-1: #007949;
    --chart-green1-2: #78c26d;
    --chart-green2-main: #8fc13a;
    --chart-green2-1: #5b8513;
    --chart-green2-2: #c0d40f;
    --chart-cyan1-1: #117a7d;
    --chart-cyan1-2: #77c9c2;
    --chart-cyan2-main: #7cafad;
    --chart-cyan2-1: #4c807e;
    --chart-cyan2-2: #a5c7c6;
    --chart-blue1-main: #3d8bd1;
    --chart-blue1-1: #005daf;
    --chart-blue1-2: #88b7e0;
    --chart-blue2-main: #0d7498;
    --chart-blue2-1: #54a5c2;
    --chart-blue2-2: #91d1db;
    --chart-purple1-main: #5f75c9;
    --chart-purple1-1: #3a52be;
    --chart-purple1-2: #9ab1d7;
    --chart-purple2-main: #7474d8;
    --chart-purple2-1: #4646ae;
    --chart-purple2-2: #afbbf7;
    --chart-violet1-main: #a878dc;
    --chart-violet1-1: #7f4eb4;
    --chart-violet1-2: #d4b2e1;
    --chart-pink1-main: #dc7aa5;
    --chart-pink1-1: #ba5883;
    --chart-pink1-2: #ecb0ca;
    --chart-red1-main: #c76466;
    --chart-red1-1: #a94749;
    --chart-red1-2: #f2a0a1;
    --chart-grey-main: #838383; /* ⚠ Only When chart has ≥ 3 series */
    --chart-grey-1: #555555; /* ⚠ Only When chart has ≥ 3 series */
    --chart-grey-2: #b7b7b7; /* ⚠ Only When chart has ≥ 3 series */

    /* ── Spacing ── */
    --spacing-xxxs: 2px;
    --spacing-xxs: 4px;
    --spacing-xs: 8px;
    --spacing-s: 12px;
    --spacing-m: 16px;
    --spacing-l: 20px;
    --spacing-xl: 24px;
    --spacing-xxl: 28px;
    --spacing-xxxl: 32px;
    --spacing-xxxxl: 40px;
    --spacing-xxxxxl: 48px;
    --spacing-xxxxxxl: 56px;

    /* ── Radius ── */
    --radius-ct-xs: 2px; /* Tag */
    --radius-ct-s: 4px; /* Small Card */
    --radius-ct-m: 6px; /* Medium Card */
    --radius-ct-l: 8px; /* Large Card/Page */
  }
}

@layer tokens.theme {
  /* Light Mode (default) */
  [data-theme="light"],
  :root {
    /* Text */
    --text-n9: rgba(0, 0, 0, 0.9); /* Primary */
    --text-n7: rgba(0, 0, 0, 0.7); /* Secondary */
    --text-n5: rgba(0, 0, 0, 0.5); /* Supporting Text */
    --text-n3: rgba(0, 0, 0, 0.3); /* Hint */
    --text-n2: rgba(0, 0, 0, 0.2); /* Disabled */

    /* Background */
    --b0-page: #ffffff;
    --b0-container: #ffffff;
    --b0-sidebar: #2a2a38;
    --b0-sidebar-select: rgba(255, 255, 255, 0.03);
    --grey-g01: #fafafa; /* Dashboard Card */
    --grey-g02: #f5f5f5;
    --grey-g03: #f0f0f0;
    --grey-g05: #eaeaea;
    --grey-g1: #dedede;
    --b-r02: rgba(0, 0, 0, 0.02); /* Content Block */
    --b-r03: rgba(0, 0, 0, 0.03); /* Darker Block */
    --b-r05: rgba(0, 0, 0, 0.05);
    --b-r07: rgba(0, 0, 0, 0.07);
    --b-r1: rgba(0, 0, 0, 0.1);

    /* Line & Border */
    --line-l07: rgba(0, 0, 0, 0.07); /* Default */
    --line-l05: rgba(0, 0, 0, 0.05); /* Weaker */
    --line-l12: rgba(0, 0, 0, 0.12); /* Card Border */
    --line-l2: rgba(0, 0, 0, 0.2); /* Popup/Dropdown Border */
    --line-l3: rgba(0, 0, 0, 0.3); /* Button/Input/Select Border */

    /* Shadow */
    --shadow-xs: 0 4px 15px 0 rgba(0, 0, 0, 0.05);
    --shadow-s: 0 6px 20px 0 rgba(0, 0, 0, 0.04);
    --shadow-l: 0 10px 20px 0 rgba(0, 0, 0, 0.08);
  }

  /* Dark Mode */
  [data-theme="dark"] {
    /* Text */
    --text-n9: rgba(255, 255, 255, 0.9);
    --text-n7: rgba(255, 255, 255, 0.7);
    --text-n5: rgba(255, 255, 255, 0.5);
    --text-n3: rgba(255, 255, 255, 0.3);
    --text-n2: rgba(255, 255, 255, 0.2);

    /* Background */
    --b0-page: #15161a;
    --b0-container: #15161a;
    --b0-sidebar: #1d1e24;
    --b0-sidebar-select: rgba(255, 255, 255, 0.03);
    --grey-g01: #1a1b1f;
    --grey-g02: #1c1d21;
    --grey-g03: #212225;
    --grey-g05: #25262a;
    --grey-g1: #2c2d31;
    --b-r02: rgba(255, 255, 255, 0.02);
    --b-r03: rgba(255, 255, 255, 0.03);
    --b-r05: rgba(255, 255, 255, 0.05);
    --b-r07: rgba(255, 255, 255, 0.07);
    --b-r1: rgba(255, 255, 255, 0.1);

    /* Line & Border */
    --line-l07: rgba(255, 255, 255, 0.08);
    --line-l05: rgba(255, 255, 255, 0.05);
    --line-l12: rgba(255, 255, 255, 0.1);
    --line-l2: rgba(255, 255, 255, 0.15);
    --line-l3: rgba(255, 255, 255, 0.25);

    /* Shadow */
    --shadow-xs: 0 4px 15px 0 rgba(0, 0, 0, 0.25);
    --shadow-s: 0 6px 20px 0 rgba(0, 0, 0, 0.24);
    --shadow-l: 0 10px 20px 0 rgba(0, 0, 0, 0.2);
  }
}
```

## General Design Guideline

### Playbook Container

Playbook container uses `100%` width to fill the viewport, with
`max-width: 2048px` and centered horizontally. Padding: `28px` (Web) / `16px`
(Mweb).

```css
.playbook-container {
  width: 100%;
  max-width: 2048px;
  margin: 0 auto;
  padding: var(--spacing-xxl);
}

@media (max-width: 768px) {
  .playbook-container {
    padding: var(--spacing-m);
  }
}
```

### Background

**The page background color must use '--b0-page'**

### Typography & Font

#### General Rules

1. **The default font for Alva must be Delight**;
2. Backup fonts: -apple-system, BlinkMacSystemFont, sans-serif;

#### Font Weight

The font weight for Alva is limited to Regular (400) and Medium (500), and the
use of Semibold (600) or Bold (700) is prohibited.

| Font Size  | Font Weight                 | Font File Path                                                                                                                                                       |
| ---------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| < 24px     | Regular(400) or Medium(500) | [Delight-Regular.ttf](https://alva-ai-static.b-cdn.net/fonts/Delight-Regular.ttf) or [Delight-Medium.ttf](https://alva-ai-static.b-cdn.net/fonts/Delight-Medium.ttf) |
| **≥ 24px** | **Regular(400) only**       | [Delight-Regular.ttf](https://alva-ai-static.b-cdn.net/fonts/Delight-Regular.ttf)                                                                                    |

#### Anti-aliasing Standards

Text anti-aliasing is enabled by default. The following declarations must be
included when generating or modifying styles:

```css
/* Text anti-aliasing: global or text containers requiring sharp rendering */
-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;
text-rendering: optimizeLegibility;
```

- If the project already has a global reset or typography base class, ensure the
  above properties are included; no need to redeclare them within components.

## Usage

1. **Design Page/Dashboard/Playbook/Module** → Follow
   [Design Tokens](#design-tokens)
2. **Generate Widgets & Charts** → Refer to this document +
   [design-widgets.md](./design-widgets.md)
3. **Use Components** → Refer to this document +
   [design-components.md](./design-components.md)
4. **Generate Trading Strategy Playbook** → **Must strictly follow**
   [design-playbook-trading-strategy.md](./design-playbook-trading-strategy.md).
   This spec defines the complete page structure, tab layout, module order,
   component usage, and data schema. Do not deviate from it or invent
   alternative layouts.
