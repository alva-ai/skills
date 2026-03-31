# Base Component Templates

## Table of Contents

- [Dropdown](#dropdown)
- [Markdown](#markdown)
- [Button](#button)
- [Tag](#tag)
- [Switch](#switch)
- [Modal](#modal)
- [Select](#select)
- [Tab](#tab)
- [Tooltip](#tooltip)

---

## Dropdown

### Specification

- Selected state: text color **unchanged**.

### CSS

```css
.dropdown {
  background-color: var(--b0-container);
  display: flex;
  flex-direction: column;
  padding: 8px 0;
  position: relative;
  border-radius: 6px;
  width: 100%;
  box-shadow: var(--shadow-s);
}

.dropdown-border {
  position: absolute;
  border: 0.5px solid var(--line-l2);
  border-radius: var(--radius-ct-m);
  inset: 0;
  pointer-events: none;
}

.list-item {
  position: relative;
  width: 100%;
  cursor: pointer;
  transition: background-color 0.12s ease;
}

.list-item:hover,
.list-item.selected {
  background-color: var(--b-r03);
}

.list-item-inner {
  display: flex;
  align-items: center;
  padding: 7px 16px;
  gap: 8px;
}

.list-item-text {
  flex: 1 0 0;
  font-family:
    "Delight",
    -apple-system,
    BlinkMacSystemFont,
    sans-serif;
  font-style: normal;
  font-size: 14px;
  line-height: 22px;
  color: var(--text-n9);
  letter-spacing: 0.14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.list-item-check {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  display: none;
}

.list-item.selected .list-item-check {
  display: block;
}

.list-item-check::after {
  content: "";
  display: block;
  width: 16px;
  height: 16px;
  background-color: var(--main-m1);
  -webkit-mask: url("https://alva-ai-static.b-cdn.net/icons/check-l1.svg")
    center / contain no-repeat;
  mask: url("https://alva-ai-static.b-cdn.net/icons/check-l1.svg") center /
    contain no-repeat;
}
```

### HTML Structure

```html
<div class="dropdown">
  <div class="dropdown-border"></div>

  <div class="list-item" data-value="item-1">
    <div class="list-item-inner">
      <span class="list-item-text">Item - Normal</span>
      <span class="list-item-check"></span>
    </div>
  </div>

  <div class="list-item selected" data-value="item-2">
    <div class="list-item-inner">
      <span class="list-item-text">Item - Selected</span>
      <span class="list-item-check"></span>
    </div>
  </div>
</div>
```

### JS Interaction

```js
document.querySelectorAll(".list-item").forEach((item) => {
  item.addEventListener("click", () => {
    item
      .closest(".dropdown")
      .querySelectorAll(".list-item")
      .forEach((i) => i.classList.remove("selected"));
    item.classList.add("selected");
  });
});
```

## Markdown

> For font specification, see
> [design-system.md - Typography & Font](./design-system.md#typography--font).
> Headings and body text use Delight with `-apple-system`, `BlinkMacSystemFont`,
> `sans-serif` fallbacks; code uses JetBrains Mono.

Uses
[markdown-it](https://cdn.jsdelivr.net/npm/markdown-it/dist/markdown-it.min.js)
for automatic rendering. Write raw markdown inside
`<script type="text/markdown">`, the init script parses it into standard HTML
tags, and scoped CSS maps them to the Alva design spec.

### Usage

```html
<!-- 1. Container with optional size modifier -->
<div class="markdown-container">
  <script type="text/markdown">
    # Heading 1

    Paragraph with `inline code`.

    - Bullet item
    - Another item

    1. Ordered item
    2. Another item

    | Col A | Col B |
    | ----- | ----- |
    | Cell  | Cell  |
  </script>
</div>

<!-- Size modifiers: markdown-container--m (Medium), markdown-container--s (Small) -->
```

### Required JS (add once at page bottom)

```html
<script src="https://cdn.jsdelivr.net/npm/markdown-it/dist/markdown-it.min.js"></script>
<script>
  const md = window.markdownit();
  const defaultRender =
    md.renderer.rules.link_open ||
    function (tokens, idx, options, env, self) {
      return self.renderToken(tokens, idx, options);
    };
  md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
    tokens[idx].attrSet("target", "_blank");
    tokens[idx].attrSet("rel", "noopener noreferrer");
    return defaultRender(tokens, idx, options, env, self);
  };
  document.querySelectorAll('script[type="text/markdown"]').forEach((el) => {
    const container = el.parentElement;
    el.remove();
    container.insertAdjacentHTML("beforeend", md.render(el.textContent));
  });
</script>
```

### CSS

```css
/* ── Container ── */
.markdown-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.markdown-container * {
  box-sizing: border-box;
}

/* ── Headings ── */
.markdown-container h1,
.markdown-container h2,
.markdown-container h3,
.markdown-container h4,
.markdown-container h5,
.markdown-container h6 {
  font-family:
    "Delight",
    -apple-system,
    BlinkMacSystemFont,
    sans-serif;
  font-weight: 500;
  font-style: normal;
  color: var(--text-n9);
  margin: 0;
  width: 100%;
}
.markdown-container h1,
.markdown-container h2 {
  font-size: 20px;
  line-height: 30px;
  letter-spacing: 0.2px;
  padding-top: 8px;
}
.markdown-container h3 {
  font-size: 18px;
  line-height: 28px;
  letter-spacing: 0.18px;
  padding-top: 4px;
}
.markdown-container h4,
.markdown-container h5,
.markdown-container h6 {
  font-size: 16px;
  line-height: 26px;
  letter-spacing: 0.16px;
}

/* ── Paragraph ── */
.markdown-container p {
  font-family:
    "Delight",
    -apple-system,
    BlinkMacSystemFont,
    sans-serif;
  font-size: 16px;
  line-height: 26px;
  letter-spacing: 0.16px;
  color: var(--text-n9);
  margin: 0;
  white-space: pre-wrap;
}

/* ── Lists ── */
.markdown-container ul,
.markdown-container ol {
  display: flex;
  flex-direction: column;
  gap: 8px;
  list-style: none;
  margin: 0;
  padding: 0;
}
.markdown-container li {
  font-family:
    "Delight",
    -apple-system,
    BlinkMacSystemFont,
    sans-serif;
  font-size: 16px;
  line-height: 26px;
  letter-spacing: 0.16px;
  color: var(--text-n9);
  position: relative;
  padding-left: 24px;
}
.markdown-container ul > li::before {
  content: "";
  position: absolute;
  left: 9.5px;
  top: 10.5px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--text-n9);
}
.markdown-container ol {
  counter-reset: md-ol;
}
.markdown-container ol > li {
  counter-increment: md-ol;
}
.markdown-container ol > li::before {
  content: counter(md-ol) ".";
  position: absolute;
  left: 0;
  top: 0;
  width: 24px;
  text-align: center;
  font-size: 16px;
  line-height: 26px;
  color: var(--text-n9);
}

/* ── Code ── */
.markdown-container code,
.markdown-container pre {
  background: var(--b-r02);
  border-radius: 2px;
  font-family: "JetBrains Mono", monospace;
  color: var(--text-n7);
}
.markdown-container code {
  display: inline-block;
  vertical-align: middle;
  box-shadow: inset 0 0 0 1px var(--line-l07);
  font-size: 12px;
  line-height: 20px;
  letter-spacing: 0.12px;
  padding: 2px 8px;
  margin: 0 4px;
}
.markdown-container pre {
  border: 1px solid var(--line-l07);
  font-size: 14px;
  line-height: 22px;
  letter-spacing: 0.14px;
  padding: 12px 16px;
  margin: 0;
  overflow-x: auto;
}
.markdown-container pre code {
  display: inline;
  vertical-align: baseline;
  font-size: inherit;
  line-height: inherit;
  letter-spacing: inherit;
  box-shadow: none;
  padding: 0;
  margin: 0;
  background: none;
}

/* ── Divider ── */
.markdown-container hr {
  height: 1px;
  background: var(--line-l07);
  border: none;
  margin: 4px 0;
}

/* ── Table ── follows Table Card rules (design-widgets.md) */
.markdown-container table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 16px 0;
  margin: 0 -16px;
}
.markdown-container th,
.markdown-container td {
  padding: 12px 0;
  border-bottom: 1px solid var(--line-l07);
  font-family:
    "Delight",
    -apple-system,
    BlinkMacSystemFont,
    sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 22px;
  letter-spacing: 0.14px;
  color: var(--text-n9);
  text-align: left;
  max-height: 180px;
}
.markdown-container th {
  color: var(--text-n7);
  padding-top: 0;
  padding-bottom: 12px;
}
.markdown-container tr:last-child td {
  border-bottom: none;
}
.markdown-container td code {
  margin: 0;
}

/* ── Link ── */
.markdown-container a {
  color: var(--text-n7);
  text-decoration-line: underline;
  text-decoration-style: dotted;
  text-decoration-color: var(--text-n5);
  text-decoration-thickness: 8%;
  text-underline-offset: 30%;
  text-decoration-skip-ink: none;
  transition: color 0.15s ease;
}
.markdown-container a:hover {
  color: var(--main-m1);
  text-decoration-color: var(--main-m1);
}
.markdown-container a::after {
  content: "";
  width: 16px;
  height: 16px;
  background: currentColor;
  mask: url("https://alva-ai-static.b-cdn.net/icons/go-l.svg") center / contain
    no-repeat;
  display: inline-block;
  vertical-align: middle;
  margin-left: 4px;
  flex-shrink: 0;
}

/* ── Medium ── */
.markdown-container--m {
  gap: 8px;
}
.markdown-container--m h1 {
  font-size: 18px;
  line-height: 28px;
  letter-spacing: 0.18px;
  padding-top: 2px;
}
.markdown-container--m h2 {
  font-size: 16px;
  line-height: 26px;
  letter-spacing: 0.16px;
  padding-top: 2px;
}
.markdown-container--m h3 {
  font-size: 14px;
  line-height: 22px;
  letter-spacing: 0.14px;
  padding-top: 0;
}
.markdown-container--m h4,
.markdown-container--m h5,
.markdown-container--m h6 {
  font-size: 14px;
  line-height: 22px;
  letter-spacing: 0.14px;
}
.markdown-container--m p,
.markdown-container--m li {
  font-size: 14px;
  line-height: 22px;
  letter-spacing: 0.14px;
}
.markdown-container--m li {
  padding-left: 20px;
}
.markdown-container--m ul > li::before {
  left: 7.5px;
  top: 8.5px;
}
.markdown-container--m ol > li::before {
  font-size: 14px;
  line-height: 22px;
  width: 20px;
}
.markdown-container--m ul,
.markdown-container--m ol {
  gap: 4px;
}
.markdown-container--m th,
.markdown-container--m td {
  font-size: 14px;
  line-height: 22px;
  letter-spacing: 0.14px;
  padding: 10px 8px;
  min-height: 176px;
}
.markdown-container--m code {
  padding: 1px 8px;
}
.markdown-container--m pre {
  font-size: 12px;
  line-height: 20px;
  letter-spacing: 0.12px;
}
.markdown-container--m a::after {
  width: 14px;
  height: 14px;
}

/* ── Small ── */
.markdown-container--s {
  gap: 4px;
}
.markdown-container--s h1 {
  font-size: 14px;
  line-height: 22px;
  letter-spacing: 0.14px;
  padding-top: 2px;
}
.markdown-container--s h2 {
  font-size: 12px;
  line-height: 20px;
  letter-spacing: 0.12px;
  padding-top: 0;
}
.markdown-container--s h3 {
  font-size: 12px;
  line-height: 20px;
  letter-spacing: 0.12px;
  padding-top: 0;
}
.markdown-container--s h4,
.markdown-container--s h5,
.markdown-container--s h6 {
  font-size: 12px;
  line-height: 20px;
  letter-spacing: 0.12px;
}
.markdown-container--s p,
.markdown-container--s li {
  font-size: 12px;
  line-height: 20px;
  letter-spacing: 0.12px;
}
.markdown-container--s a::after {
  width: 12px;
  height: 12px;
}
.markdown-container--s li {
  padding-left: 20px;
}
.markdown-container--s ul > li::before {
  left: 7.5px;
  top: 7.5px;
}
.markdown-container--s ol > li::before {
  font-size: 12px;
  line-height: 20px;
  width: 20px;
}
.markdown-container--s ul,
.markdown-container--s ol {
  gap: 4px;
}
.markdown-container--s code {
  font-size: 10px;
  line-height: 16px;
  padding: 2px 6px;
}
.markdown-container--s pre {
  font-size: 10px;
  line-height: 16px;
  padding: 8px 12px;
}
.markdown-container--s th,
.markdown-container--s td {
  font-size: 12px;
  line-height: 20px;
  letter-spacing: 0.12px;
  padding: 8px;
  min-height: 176px;
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .markdown-container {
    max-width: 100%;
    padding: 0 16px;
  }
  .markdown-container table {
    overflow-x: scroll;
  }
}
```

## Button

### 1. Overview

The button component system contains **2 types** x **4 sizes** x **4 states** =
32 combinations

- **Primary Button**: for primary actions (submit, confirm, save)
- **Secondary Button**: for secondary actions (cancel, back, view)

---

### 2. HTML Class Name Convention

#### Basic Structure

```html
<button class="btn [type] [size] [state]">Button Text</button>
```

#### Class Name Combination Table

| Combination      | Class Name        | Example                            |
| ---------------- | ----------------- | ---------------------------------- |
| Base Class       | `btn`             | Required                           |
| Primary Button   | `btn-primary`     | `btn btn-primary btn-large`        |
| Secondary Button | `btn-secondary`   | `btn btn-secondary btn-medium`     |
| Large Size       | `btn-large`       | 48px height                        |
| Medium Size      | `btn-medium`      | 40px height                        |
| Small Size       | `btn-small`       | 32px height                        |
| Extra Small Size | `btn-extra-small` | 28px height                        |
| Disabled State   | `btn-disabled`    | Must also add `disabled` attribute |
| Loading State    | `btn-loading`     | Shows spinning animation           |

---

### 3. Complete CSS Code

```css
/* Base Button Styles */
.btn {
  border: none;
  outline: none;
  background: none;
  margin: 0;
  cursor: pointer;
  user-select: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family:
    "Delight",
    -apple-system,
    BlinkMacSystemFont,
    sans-serif;
  font-weight: 500;
  font-style: normal;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  transition: all 0.2s ease-in-out;
  position: relative;
}

/* Primary Button */
.btn-primary {
  background-color: var(--main-m1);
  color: var(--b-common-white);
}

.btn-primary:hover:not(.btn-disabled) {
  background-image: linear-gradient(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.1));
}

.btn-primary:active:not(.btn-disabled) {
  background-image: linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2));
}

.btn-primary.btn-disabled {
  background-color: var(--b0-container);
  color: var(--text-n2);
  cursor: not-allowed;
  border: 0.5px solid var(--line-l3);
}

/* Secondary Button */
.btn-secondary {
  background-color: transparent;
  color: var(--text-n9);
  border: 0.5px solid var(--line-l3);
}

.btn-secondary:hover:not(.btn-disabled) {
  border-color: var(--text-n9);
}

.btn-secondary:active:not(.btn-disabled) {
  border-color: var(--line-l3);
  background-color: var(--b-r02);
}

.btn-secondary.btn-disabled {
  color: var(--text-n2);
  border-color: var(--line-l3);
  cursor: not-allowed;
}

/* Size - Large */
.btn-large {
  height: 48px;
  padding: 11px 20px;
  gap: 8px;
  border-radius: var(--radius-ct-m); /* 6px */
  font-size: 16px;
  line-height: 26px;
  letter-spacing: 0.16px;
}

/* Size - Medium */
.btn-medium {
  height: 40px;
  padding: 9px 20px;
  gap: 8px;
  border-radius: var(--radius-ct-m); /* 6px */
  font-size: 14px;
  line-height: 22px;
  letter-spacing: 0.14px;
}

/* Size - Small */
.btn-small {
  height: 32px;
  padding: 6px 16px;
  gap: 6px;
  border-radius: var(--radius-ct-s); /* 4px */
  font-size: 12px;
  line-height: 20px;
  letter-spacing: 0.12px;
}

/* Size - Extra Small */
.btn-extra-small {
  height: 28px;
  padding: 4px 12px;
  gap: 4px;
  border-radius: var(--radius-ct-s); /* 4px */
  font-size: 12px;
  line-height: 20px;
  letter-spacing: 0.12px;
}

/* Disabled State */
.btn-disabled {
  cursor: not-allowed;
  pointer-events: none;
}

/* Loading State */
.btn-loading {
  position: relative;
  color: transparent;
  pointer-events: none;
}

.btn-loading::after {
  content: "";
  position: absolute;
  width: 14px;
  height: 14px;
  top: 50%;
  left: 50%;
  margin-left: -7px;
  margin-top: -7px;
  border: 1px solid var(--b-common-white);
  border-radius: 50%;
  border-top-color: transparent;
  animation: btn-spin 0.6s linear infinite;
}

.btn-secondary.btn-loading::after {
  border-color: var(--text-n9);
  border-top-color: transparent;
}

@keyframes btn-spin {
  to {
    transform: rotate(360deg);
  }
}

/* Focus State */
.btn:focus-visible {
  outline: 2px solid var(--main-m1);
  outline-offset: 2px;
}
```

---

## Tag

### 1. Overview

Tags are compact labels used to display status, category, or classification.
They come in **3 sizes** and **2 style modes**. Colors are not predefined — the
agent picks the appropriate `--main-mX` color token based on semantic context
(m1 Theme, m2 Link, m3 Bullish, m4 Bearish, m5 Alert, m6 Emphasize). Every
`--main-mX` has a matching `--main-mX-10` (10 % opacity) variant for the tinted
style.

### 2. CSS

```css
/* Base (default size = Small) */
.tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family:
    "Delight",
    -apple-system,
    BlinkMacSystemFont,
    sans-serif;
  font-weight: 400;
  white-space: nowrap;
  border-radius: var(--radius-ct-s);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  height: 22px;
  padding: 1px 6px;
  font-size: 12px;
  line-height: 20px;
  letter-spacing: 0.12px;
  /* Default color (no semantic meaning) */
  background-color: var(--b-r05);
  color: var(--text-n9);
}

/* Size — Medium */
.tag-md {
  height: 26px;
  padding: 2px 8px;
  font-size: 14px;
  line-height: 22px;
  letter-spacing: 0.14px;
}

/* Size — Extra Small */
.tag-xs {
  height: 18px;
  padding: 1px 6px;
  font-size: 10px;
  line-height: 16px;
  letter-spacing: 0.1px;
  border-radius: var(--radius-ct-xs);
}

/*
 * Style — Tinted
 * Light transparent background + colored text.
 *   background-color: var(--main-mX-10);
 *   color: var(--main-mX);
 *
 * Style — Solid
 * Full-color background + white text.
 *   background-color: var(--main-mX);
 *   color: var(--b-common-white);
 */
```

### 3. HTML

```html
<!-- Tinted — agent chooses color by meaning -->
<span class="tag" style="background:var(--main-m3-10);color:var(--main-m3)"
  >BULLISH</span
>
<span class="tag" style="background:var(--main-m4-10);color:var(--main-m4)"
  >BEARISH</span
>
<span class="tag" style="background:var(--main-m5-10);color:var(--main-m5)"
  >MODERATE</span
>
<span class="tag">Label</span>

<!-- Solid -->
<span class="tag" style="background:var(--main-m3);color:var(--b-common-white)"
  >LONG</span
>
<span class="tag" style="background:var(--main-m4);color:var(--b-common-white)"
  >SHORT</span
>

<!-- Sizes -->
<span
  class="tag tag-md"
  style="background:var(--main-m3-10);color:var(--main-m3)"
  >BULLISH</span
>
<span
  class="tag tag-xs"
  style="background:var(--main-m4-10);color:var(--main-m4)"
  >BEARISH</span
>
```

---

## Switch

Sliding toggle for boolean state (on/off). **3 sizes** × **4 states** = 12
combinations. Ratio rule: thumb diameter = track height × 2/3, thumb spacing =
track height × 1/6.

### CSS

```css
.switch {
  position: relative;
  display: inline-block;
  cursor: pointer;
  overflow: hidden;
  flex-shrink: 0;
  transition: background-color 0.2s ease;
}

/* Track — Off */
.switch {
  background-color: var(--b-r1);
}

/* Track — On */
.switch.on {
  background-color: var(--main-m1);
}

/* Thumb */
.switch-thumb {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: var(--b-common-white);
  border-radius: 50%;
  transition: left 0.2s ease;
}

/* Disabled */
.switch.disabled {
  cursor: not-allowed;
  pointer-events: none;
}
.switch.disabled:not(.on) {
  opacity: 0.4;
}
.switch.disabled.on {
  opacity: 0.3;
}

/* Size — Medium (default) */
.switch {
  width: 32px;
  height: 16px;
  border-radius: 1000px;
}
.switch .switch-thumb {
  width: 10.67px;
  height: 10.67px;
  left: 2.67px;
}
.switch.on .switch-thumb {
  left: calc(100% - 10.67px - 2.67px);
}

/* Size — Small */
.switch-sm {
  width: 24px;
  height: 12px;
  border-radius: 100px;
}
.switch-sm .switch-thumb {
  width: 8px;
  height: 8px;
  left: 2px;
}
.switch-sm.on .switch-thumb {
  left: calc(100% - 8px - 2px);
}

/* Size — Large */
.switch-lg {
  width: 40px;
  height: 20px;
  border-radius: 166.67px;
}
.switch-lg .switch-thumb {
  width: 13.33px;
  height: 13.33px;
  left: 3.33px;
}
.switch-lg.on .switch-thumb {
  left: calc(100% - 13.33px - 3.33px);
}
```

### HTML

```html
<!-- Medium (default), off -->
<div class="switch" role="switch" aria-checked="false">
  <div class="switch-thumb"></div>
</div>

<!-- Medium, on -->
<div class="switch on" role="switch" aria-checked="true">
  <div class="switch-thumb"></div>
</div>

<!-- Small, disabled -->
<div
  class="switch switch-sm disabled"
  role="switch"
  aria-checked="false"
  aria-disabled="true"
>
  <div class="switch-thumb"></div>
</div>
```

### JS Interaction

```js
document.querySelectorAll(".switch:not(.disabled)").forEach(function (sw) {
  sw.addEventListener("click", function () {
    var isOn = sw.classList.toggle("on");
    sw.setAttribute("aria-checked", isOn);
  });
});
```

---

## Modal

### Structure

```
Modal                        ← Overlay
 └─ Action Sheet             ← Content panel
     ├─ Modal Title          ← Title + close button
     └─ Placeholder          ← Content slot area
```

### Overlay

| Property   | Value                                       |
| ---------- | ------------------------------------------- |
| Background | `var(--main-m7)`                            |
| Padding X  | `16px`                                      |
| Padding Y  | `48px`                                      |
| Layout     | `flex` / `column` / `center` / `center`     |
| Sizing     | `100%` width & height (full-screen overlay) |

### Action Sheet (Content Panel)

| Property      | Value                              |
| ------------- | ---------------------------------- |
| Background    | `var(--b0-container)`              |
| Max Width     | `960px`                            |
| Width         | `100%` (constrained by max-width)  |
| Flex          | `1 0 0` (fills available height)   |
| Border Radius | `8px`                              |
| Border        | `0.5px solid var(--line-l2)`       |
| Padding       | `28px` (all sides)                 |
| Gap           | `16px` (between title and content) |

### Modal Title

| Property       | Value                                   |
| -------------- | --------------------------------------- |
| Layout         | `flex` / `row` / `space-between`        |
| Gap            | `12px` (between title and close button) |
| Font Family    | `Delight`                               |
| Font Weight    | `500`                                   |
| Font Size      | `18px`                                  |
| Line Height    | `28px`                                  |
| Letter Spacing | `0.18px`                                |
| Text Color     | `var(--text-n9)`                        |

### Close Icon

**CSS**

```css
.modal-close {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  cursor: pointer;
  background-color: var(--text-n9);
  -webkit-mask: url("https://alva-ai-static.b-cdn.net/icons/close-l1.svg")
    center / contain no-repeat;
  mask: url("https://alva-ai-static.b-cdn.net/icons/close-l1.svg") center /
    contain no-repeat;
  transition: opacity 0.15s ease;
}

.modal-close:hover {
  opacity: 0.6;
}
```

**HTML**

```html
<div class="modal-close"></div>
```

### Placeholder (Content Slot)

| Property | Value                           |
| -------- | ------------------------------- |
| Flex     | `1 0 0` (fills remaining space) |
| Width    | `100%`                          |

> Placeholder is a reserved area; replace with actual business content (forms,
> lists, confirmation messages, etc.) when used.

### Interaction

- Clicking the overlay can close the modal (configurable)
- Clicking the close icon (x) in the top-right corner closes the modal
- When the modal is open, background content is not scrollable
- When modal content exceeds available height, the content area scrolls
  internally
- Responsive: `16px` safe margin horizontally, `48px` safe margin vertically

### Responsive

| Screen   | Panel Width           | Behavior                                              |
| -------- | --------------------- | ----------------------------------------------------- |
| >= 992px | max `960px`, centered | Horizontally centered, equal whitespace on both sides |
| < 992px  | `100% - 32px`         | Adaptive width, `16px` margin on left and right       |

## Select

Clicking the Select container triggers the associated [Dropdown](#dropdown).
Dropdown width defaults to the same width as the Select. Dropdown list item text
size follows the Select size. Clicking again or clicking outside closes the
Dropdown. Arrow icon always points down and does not rotate.

### CSS

```css
.select {
  display: flex;
  align-items: center;
  background-color: var(--b0-container);
  cursor: pointer;
  position: relative;
  font-family:
    "Delight",
    -apple-system,
    BlinkMacSystemFont,
    sans-serif;
  font-weight: 400;
  transition: border-color 0.12s ease;
}

.select-border {
  position: absolute;
  inset: 0;
  border: 0.5px solid var(--line-l3);
  border-radius: inherit;
  pointer-events: none;
  transition: border-color 0.12s ease;
}

.select:hover .select-border {
  border-color: var(--text-n9);
}

.select-text {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--text-n3);
}

/* Filled state — has a selected value */
.select.filled .select-text {
  color: var(--text-n9);
}

.select:hover .select-text {
  color: var(--text-n9);
}

.select.filled .select-icon {
  opacity: 0.2;
}

/* Size — Large */
.select-lg {
  height: 48px;
  padding: 11px 16px;
  gap: 8px;
  border-radius: 6px;
  font-size: 16px;
  line-height: 26px;
  letter-spacing: 0.16px;
}

/* Size — Medium (default) */
.select {
  height: 40px;
  padding: 8px 12px;
  gap: 8px;
  border-radius: 4px;
  font-size: 14px;
  line-height: 22px;
  letter-spacing: 0.14px;
}

/* Size — Small */
.select-sm {
  height: 28px;
  padding: 4px 8px;
  gap: 4px;
  border-radius: 4px;
  font-size: 12px;
  line-height: 20px;
  letter-spacing: 0.12px;
}
.select-sm .select-text {
  width: 70px;
  flex: none;
}

/* Arrow Icon */
.select-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.22;
  transition: opacity 0.12s ease;
}

.select:hover .select-icon,
.select.open .select-icon {
  opacity: 1;
}

.select-icon img {
  display: block;
  width: 100%;
  height: 100%;
}
```

### HTML Template

```html
<!-- Medium Select (default, placeholder state) -->
<div class="select" data-select="demo">
  <div class="select-border"></div>
  <span class="select-text">Select option</span>
  <div class="select-icon" style="width:14px;height:14px;">
    <img
      src="https://alva-ai-static.b-cdn.net/icons/arrow-down-f2.svg"
      alt=""
    />
  </div>
</div>

<!-- Medium Select (filled state) -->
<div class="select filled" data-select="demo">
  <div class="select-border"></div>
  <span class="select-text">Selected Value</span>
  <div class="select-icon" style="width:14px;height:14px;">
    <img
      src="https://alva-ai-static.b-cdn.net/icons/arrow-down-f2.svg"
      alt=""
    />
  </div>
</div>

<!-- Associated Dropdown (hidden by default, shown on click) -->
<div class="dropdown" style="display:none;" data-dropdown="demo">
  <div class="dropdown-border"></div>
  <div class="list-item" data-value="opt1">
    <div class="list-item-inner">
      <span class="list-item-text">Option 1</span>
      <span class="list-item-check"></span>
    </div>
  </div>
  <div class="list-item" data-value="opt2">
    <div class="list-item-inner">
      <span class="list-item-text">Option 2</span>
      <span class="list-item-check"></span>
    </div>
  </div>
</div>
```

### JS Interaction

```js
// Select + Dropdown toggle
document.querySelectorAll("[data-select]").forEach(function (sel) {
  var name = sel.dataset.select;
  var dd = document.querySelector('[data-dropdown="' + name + '"]');
  if (!dd) return;

  sel.addEventListener("click", function (e) {
    e.stopPropagation();
    var isOpen = dd.style.display !== "none";
    dd.style.display = isOpen ? "none" : "";
    sel.classList.toggle("open", !isOpen);
  });

  dd.querySelectorAll(".list-item").forEach(function (item) {
    item.addEventListener("click", function () {
      dd.querySelectorAll(".list-item").forEach(function (i) {
        i.classList.remove("selected");
      });
      item.classList.add("selected");
      var text = item.querySelector(".list-item-text").textContent;
      sel.querySelector(".select-text").textContent = text;
      sel.classList.add("filled");
      dd.style.display = "none";
      sel.classList.remove("open");
    });
  });
});

// Close on outside click
document.addEventListener("click", function () {
  document.querySelectorAll("[data-dropdown]").forEach(function (dd) {
    dd.style.display = "none";
  });
  document.querySelectorAll("[data-select]").forEach(function (sel) {
    sel.classList.remove("open");
  });
});
```

---

## Tab

2 styles (Pill, Underline) × 2 sizes (M, S) = 4 variants.

- **Pill**: rounded rectangles, background changes on select.
- **Underline**: no background, selected item has a 2px bottom indicator line.

### Underline + Container Border Alignment

When an Underline Tab is placed inside a container with a bottom border (e.g.
`1px solid var(--line-l07)`), the active indicator and the container border
should sit on the **same line**. Apply `margin-bottom: -1px` to `.tab-item` so
the 2px indicator overlaps the 1px border, and inactive tabs show the container
border through their transparent border.

### CSS

```css
/* Shared */
.tab {
  display: flex;
  align-items: center;
}
.tab-item {
  font-family:
    "Delight",
    -apple-system,
    BlinkMacSystemFont,
    sans-serif;
  cursor: pointer;
  transition: all 0.15s ease;
}
/* Prevent width jump when font-weight changes */
.tab-item::after {
  content: attr(data-text);
  font-weight: 500;
  visibility: hidden;
  height: 0;
  display: block;
  overflow: hidden;
}

/* Pill */
.tab-pill {
  gap: 12px;
}
.tab-pill .tab-item {
  padding: 6px 16px;
  border-radius: 4px;
  font-size: 14px;
  line-height: 22px;
  letter-spacing: 0.14px;
  background: var(--b-r03);
  color: var(--text-n7);
}
.tab-pill .tab-item.active {
  background: rgba(73, 163, 166, 0.2);
  color: var(--text-n9);
  font-weight: 500;
}

/* Pill — Size S */
.tab-pill.tab-s {
  gap: 8px;
}
.tab-pill.tab-s .tab-item {
  padding: 4px 8px;
  font-size: 12px;
  line-height: 20px;
  letter-spacing: 0.12px;
}

/* Underline */
.tab-underline {
  gap: 16px;
}
.tab-underline .tab-item {
  padding-bottom: var(--spacing-xxs);
  font-size: 14px;
  line-height: 22px;
  letter-spacing: 0.14px;
  color: var(--text-n7);
  border-bottom: 2px solid transparent;
}
.tab-underline .tab-item.active {
  color: var(--text-n9);
  font-weight: 500;
  border-bottom-color: var(--main-m1);
}

/* Underline — Size S */
.tab-underline.tab-s {
  gap: 12px;
}
.tab-underline.tab-s .tab-item {
  font-size: 12px;
  line-height: 20px;
  letter-spacing: 0.12px;
}
```

### HTML

```html
<!-- Pill M -->
<div class="tab tab-pill" data-tab-group="demo">
  <div class="tab-item active" data-tab="tab1" data-text="Tab 1">Tab 1</div>
  <div class="tab-item" data-tab="tab2" data-text="Tab 2">Tab 2</div>
  <div class="tab-item" data-tab="tab3" data-text="Tab 3">Tab 3</div>
</div>

<!-- Tab panels — data-tab-panel value must match data-tab on the trigger -->
<div data-tab-panel="tab1" data-tab-group="demo">Panel 1</div>
<div data-tab-panel="tab2" data-tab-group="demo" style="display:none;">
  Panel 2
</div>
<div data-tab-panel="tab3" data-tab-group="demo" style="display:none;">
  Panel 3
</div>
```

### JS Interaction

```js
// Tab switching — handles active state, panel visibility, and ECharts resize.
// Include once per page. Works for all .tab groups via data-tab-group.
document.querySelectorAll(".tab").forEach(function (tab) {
  tab.addEventListener("click", function (e) {
    var item = e.target.closest(".tab-item");
    if (!item || item.classList.contains("active")) return;

    var group = tab.dataset.tabGroup;

    // Update active tab
    tab.querySelectorAll(".tab-item").forEach(function (i) {
      i.classList.remove("active");
    });
    item.classList.add("active");

    // Switch panels
    var panels = group
      ? document.querySelectorAll(
          '[data-tab-panel][data-tab-group="' + group + '"]',
        )
      : [];
    panels.forEach(function (p) {
      p.style.display = p.dataset.tabPanel === item.dataset.tab ? "" : "none";
    });

    // Resize ECharts instances inside the newly visible panel
    // (hidden containers report 0×0, so charts need a resize after show)
    var active = group
      ? document.querySelector(
          '[data-tab-panel="' +
            item.dataset.tab +
            '"][data-tab-group="' +
            group +
            '"]',
        )
      : null;
    if (active) {
      active.querySelectorAll("[_echarts_instance_]").forEach(function (el) {
        var inst = echarts.getInstanceByDom(el);
        if (inst) inst.resize();
      });
      active.querySelectorAll(".table-card").forEach(function (el) {
        if (typeof initTableAlignment === "function") initTableAlignment(el);
      });
    }
  });
});
```

---

## Tooltip

2 variants: **Simple** (text only) and **Rich** (title + description).

### CSS

```css
.tooltip {
  background-color: var(--b0-container);
  position: absolute;
  border-radius: var(--radius-ct-m);
  box-shadow: var(--shadow-s);
  padding: var(--spacing-m);
  width: fit-content;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xxxs);
}

.tooltip-border {
  position: absolute;
  border: 0.5px solid var(--line-l2);
  border-radius: var(--radius-ct-m);
  inset: 0;
  pointer-events: none;
}

/* Simple — text only */
.tooltip-text {
  font-family:
    "Delight",
    -apple-system,
    BlinkMacSystemFont,
    sans-serif;
  font-size: 14px;
  line-height: 22px;
  letter-spacing: 0.14px;
  color: var(--text-n9);
  font-weight: 400;
}

/* Rich — title */
.tooltip-title {
  font-family:
    "Delight",
    -apple-system,
    BlinkMacSystemFont,
    sans-serif;
  font-size: 16px;
  line-height: 26px;
  letter-spacing: 0.16px;
  color: var(--text-n9);
  font-weight: 500;
}

/* Rich — description reuses .tooltip-text */
```

### HTML

```html
<!-- Simple Tooltip -->
<div class="tooltip">
  <div class="tooltip-border"></div>
  <div class="tooltip-text">Tooltip description text</div>
</div>

<!-- Rich Tooltip -->
<div class="tooltip">
  <div class="tooltip-border"></div>
  <div class="tooltip-title">Title</div>
  <div class="tooltip-text">Tooltip description text</div>
</div>
```
