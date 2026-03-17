
# Alva Design System

This file is the global entry point for Alva design rules. It summarizes the
rules that apply everywhere and points to the more detailed widget, component,
and trading-strategy specs when you need them.

## Design Tokens

Full token definitions (colors, spacing, radius, theme) are in
[design-tokens.css](./design-tokens.css). Read it when you need
exact values. Below is a quick reference for the most common categories:

| Category | Tokens | Notes |
|---|---|---|
| Brand | `--main-m1` ~ `--main-m7` | m3=Bullish, m4=Bearish |
| Chart colors | `--chart-{color}-main/1/2` | Grey only when ≥ 3 series |
| Text | `--text-n9/n7/n5/n3/n2` | n9=primary, n7=secondary, n5=supporting |
| Background | `--b0-page`, `--grey-g01`~`g1`, `--b-r02`~`r1` | g01 for dashboard cards |
| Line | `--line-l05/l07/l12/l2/l3` | l07=default |
| Shadow | `--shadow-xs/s/l` | Floating surfaces only |
| Spacing | `--spacing-xxxs`(2) ~ `--spacing-xxxxxxl`(56) | Common: xs=8, m=16, xl=24 |
| Radius | `--radius-ct-xs`(2) ~ `--radius-ct-l`(8) | xs=Tag, s=Card, l=Page |

## Typography & Font

### General Rules

1. **The default font for Alva must be Delight**;
2. Backup fonts: `-apple-system`, `BlinkMacSystemFont`, `sans-serif`;

### Font Weight

The font weight for Alva is limited to Regular (400) and Medium (500), and the
use of Semibold (600) or Bold (700) is prohibited.

| Font Size  | Font Weight                 | Font File Path                                                                                                                                                       |
| ---------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| < 24px     | Regular(400) or Medium(500) | [Delight-Regular.ttf](https://alva-ai-static.b-cdn.net/fonts/Delight-Regular.ttf) or [Delight-Medium.ttf](https://alva-ai-static.b-cdn.net/fonts/Delight-Medium.ttf) |
| **≥ 24px** | **Regular(400) only**       | [Delight-Regular.ttf](https://alva-ai-static.b-cdn.net/fonts/Delight-Regular.ttf)                                                                                    |

### Anti-aliasing Standards

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

## Background

**The page background color must use `--b0-page`**

## Playbook Container

```css
/* Hide all persistent scrollbars globally */
* {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
*::-webkit-scrollbar {
  display: none;
}

.playbook-container {
  width: 100%;
  max-width: 2048px;
  margin: 0 auto;
  padding: var(--spacing-l) var(--spacing-xxl) var(--spacing-xxl);
}

@media (max-width: 768px) {
  .playbook-container {
    padding: var(--spacing-m);
  }
}
```

## Usage — Read only what you need

1. **Generating a widget or chart** → read
   [design-widgets.md](./design-widgets.md)
2. **Using a component** (Button, Tag, Dropdown, Tab, etc.) → read
   [design-components.md](./design-components.md)
3. **Building a Trading Strategy Playbook** → read
   [design-playbook-trading-strategy.md](./design-playbook-trading-strategy.md).
   This spec defines the complete page structure, tab layout, module order,
   component usage, and data schema. Do not deviate from it or invent
   alternative layouts.
4. **Only need global rules** → stay in this file. Open
   [design-tokens.css](./design-tokens.css) only when you need exact token
   values.
