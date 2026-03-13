# Base Component Templates

## Table of Contents

- [Dropdown](#dropdown)
- [Markdown](#markdown)
- [Button](#button)
- [Switch](#switch)
- [Tab](#tab)
- [Tag](#tag)
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
  font-family: "Delight", "Helvetica Neue", Arial, sans-serif;
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

> For font specification, see [design-system.md - Typography & Font](./design-system.md#typography--font). Headings and body text use Delight; code uses JetBrains Mono.

Uses [markdown-it](https://cdn.jsdelivr.net/npm/markdown-it/dist/markdown-it.min.js) for automatic rendering. Write raw markdown inside `<script type="text/markdown">`, the init script parses it into standard HTML tags, and scoped CSS maps them to the Alva design spec.

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
| --- | --- |
| Cell | Cell |
  </script>
</div>

<!-- Size modifiers: markdown-container--m (Medium), markdown-container--s (Small) -->
```

### Required JS (add once at page bottom)

```html
<script src="https://cdn.jsdelivr.net/npm/markdown-it/dist/markdown-it.min.js"></script>
<script>
  const md = window.markdownit();
  document.querySelectorAll('script[type="text/markdown"]').forEach(el => {
    const container = el.parentElement;
    el.remove();
    container.insertAdjacentHTML('beforeend', md.render(el.textContent));
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
.markdown-container * { box-sizing: border-box; }

/* ── Headings ── */
.markdown-container h1,
.markdown-container h2,
.markdown-container h3,
.markdown-container h4,
.markdown-container h5,
.markdown-container h6 {
  font-family: "Delight", "Helvetica Neue", Arial, sans-serif;
  font-weight: 500;
  font-style: normal;
  color: var(--text-n9);
  margin: 0;
  width: 100%;
}
.markdown-container h1,
.markdown-container h2 { font-size: 20px; line-height: 30px; letter-spacing: 0.2px; padding-top: 8px; }
.markdown-container h3 { font-size: 18px; line-height: 28px; letter-spacing: 0.18px; padding-top: 4px; }
.markdown-container h4,
.markdown-container h5,
.markdown-container h6 { font-size: 16px; line-height: 26px; letter-spacing: 0.16px; }

/* ── Paragraph ── */
.markdown-container p {
  font-family: "Delight", "Helvetica Neue", Arial, sans-serif;
  font-size: 16px; line-height: 26px; letter-spacing: 0.16px;
  color: var(--text-n9); margin: 0; white-space: pre-wrap;
}

/* ── Lists ── */
.markdown-container ul,
.markdown-container ol {
  display: flex; flex-direction: column; gap: 8px;
  list-style: none; margin: 0; padding: 0;
}
.markdown-container li {
  font-family: "Delight", "Helvetica Neue", Arial, sans-serif;
  font-size: 16px; line-height: 26px; letter-spacing: 0.16px;
  color: var(--text-n9);
  position: relative; padding-left: 24px;
}
.markdown-container ul > li::before {
  content: "";
  width: 5px; height: 5px; border-radius: 50%;
  background: var(--text-n9);
  position: absolute; left: 0; top: 10.5px;
}
.markdown-container ol { counter-reset: md-ol; }
.markdown-container ol > li { counter-increment: md-ol; }
.markdown-container ol > li::before {
  content: counter(md-ol) ".";
  position: absolute; left: 0; top: 0;
  width: 24px; text-align: center;
  font-size: 16px; line-height: 26px; color: var(--text-n9);
}

/* ── Code ── */
.markdown-container code,
.markdown-container pre {
  background: var(--b-r02); border: 1px solid var(--line-l07);
  border-radius: 2px; font-family: "JetBrains Mono", monospace; color: var(--text-n7);
}
.markdown-container code {
  display: inline-block; vertical-align: middle; font-size: 12px; line-height: 20px; letter-spacing: 0.12px; padding: 2px 8px; margin: 0 4px;
}
.markdown-container pre {
  font-size: 14px; line-height: 22px; letter-spacing: 0.14px;
  padding: 12px 16px; margin: 0; overflow-x: auto;
}
.markdown-container pre code { font-size: inherit; line-height: inherit; letter-spacing: inherit; border: none; padding: 0; background: none; }

/* ── Divider ── */
.markdown-container hr {
  height: 1px; background: var(--line-l07);
  border: none; margin: 4px 0;
}

/* ── Table ── */
.markdown-container table { width: 100%; border-collapse: collapse; }
.markdown-container th,
.markdown-container td {
  padding: 12px; min-height: 180px;
  border-bottom: 1px solid rgba(0,0,0,0.07);
  font-family: "Delight", "Helvetica Neue", Arial, sans-serif;
  font-size: 14px; line-height: 22px; letter-spacing: 0.14px;
  color: var(--text-n9); text-align: left;
}
.markdown-container th { font-weight: 500; padding-top: 0; }
.markdown-container th:first-child,
.markdown-container td:first-child { padding-left: 0; }
.markdown-container th:last-child,
.markdown-container td:last-child { padding-right: 0; }
.markdown-container td code { margin: 0; }

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
.markdown-container a:hover { color: var(--main-m1); text-decoration-color: var(--main-m1); }
.markdown-container a::after {
  content: "";
  width: 16px; height: 16px;
  background: currentColor;
  mask: url("https://alva-ai-static.b-cdn.net/icons/go-l.svg") center / contain no-repeat;
  display: inline-block;
  vertical-align: middle;
  margin-left: 4px;
  flex-shrink: 0;
}

/* ── Medium ── */
.markdown-container--m { gap: 8px; }
.markdown-container--m h1 { font-size: 18px; line-height: 28px; letter-spacing: 0.18px; padding-top: 2px; }
.markdown-container--m h2 { font-size: 16px; line-height: 26px; letter-spacing: 0.16px; padding-top: 2px; }
.markdown-container--m h3 { font-size: 14px; line-height: 22px; letter-spacing: 0.14px; padding-top: 0; }
.markdown-container--m h4,
.markdown-container--m h5,
.markdown-container--m h6 { font-size: 14px; line-height: 22px; letter-spacing: 0.14px; }
.markdown-container--m p,
.markdown-container--m li { font-size: 14px; line-height: 22px; letter-spacing: 0.14px; }
.markdown-container--m ul > li::before { top: 8.5px; }
.markdown-container--m ol > li::before { font-size: 14px; line-height: 22px; }
.markdown-container--m ul,
.markdown-container--m ol { gap: 4px; }
.markdown-container--m th,
.markdown-container--m td { font-size: 12px; line-height: 20px; letter-spacing: 0.12px; padding: 8px; min-height: 176px; }
.markdown-container--m code { padding: 1px 8px; }
.markdown-container--m pre { font-size: 12px; line-height: 20px; letter-spacing: 0.12px; }
.markdown-container--m a::after { width: 14px; height: 14px; }

/* ── Small ── */
.markdown-container--s { gap: 4px; }
.markdown-container--s h1 { font-size: 14px; line-height: 22px; letter-spacing: 0.14px; padding-top: 2px; }
.markdown-container--s h2 { font-size: 12px; line-height: 20px; letter-spacing: 0.12px; padding-top: 0; }
.markdown-container--s h3 { font-size: 12px; line-height: 20px; letter-spacing: 0.12px; padding-top: 0; }
.markdown-container--s h4,
.markdown-container--s h5,
.markdown-container--s h6 { font-size: 12px; line-height: 20px; letter-spacing: 0.12px; }
.markdown-container--s p,
.markdown-container--s li { font-size: 12px; line-height: 20px; letter-spacing: 0.12px; }
.markdown-container--s a::after { width: 12px; height: 12px; }
.markdown-container--s ul > li::before { top: 7.5px; }
.markdown-container--s ol > li::before { font-size: 12px; line-height: 20px; }
.markdown-container--s ul,
.markdown-container--s ol { gap: 4px; }
.markdown-container--s code { font-size: 10px; line-height: 16px; padding: 2px 6px; }
.markdown-container--s pre { font-size: 10px; line-height: 16px; padding: 8px 12px; }
.markdown-container--s th,
.markdown-container--s td { font-size: 12px; line-height: 20px; letter-spacing: 0.12px; padding: 8px; min-height: 176px; }

/* ── Responsive ── */
@media (max-width: 768px) {
  .markdown-container { max-width: 100%; padding: 0 16px; }
  .markdown-container table { overflow-x: scroll; }
}
```

## Button

### 1. Overview

The button component system contains **2 types** x **4 sizes** x **4 states** = 32 combinations

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
  font-family: "Delight", "Helvetica Neue", Arial, sans-serif;
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
  color: white;
}

.btn-primary:hover:not(.btn-disabled) {
  background-image: linear-gradient(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.1));
}

.btn-primary:active:not(.btn-disabled) {
  background-image: linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2));
}

.btn-primary.btn-disabled {
  background-color: white;
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
  border: 1px solid white;
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
  outline: 2px solid #49a3a6;
  outline-offset: 2px;
}
```

---

## Switch

### 1. Overview

Switch is a sliding toggle component used to represent boolean state (on/off). The system contains **3 sizes** x **4 states** = 12 combinations

---

### 2. Props

| Prop       | Type                         | Default | Description           |
| ---------- | ---------------------------- | ------- | --------------------- |
| `size`     | `'sm'` \| `'md'` \| `'lg'`   | `'md'`  | Switch size           |
| `checked`  | `boolean`                    | `false` | Whether on            |
| `disabled` | `boolean`                    | `false` | Whether disabled      |
| `onChange` | `(checked: boolean) => void` | —       | State toggle callback |

---

### 3. Color Token

#### Colors

| Token       | Value            | Description                |
| ----------- | ---------------- | -------------------------- |
| `track-off` | `var(--b-r1)`    | Off state track background |
| `track-on`  | `var(--main-m1)` | On state track background  |
| `thumb`     | `#FFFFFF`        | Thumb color (fixed)        |

#### Sizes

| Size | Track (W x H) | Thumb Diameter | Thumb Spacing | Track Border Radius |
| ---- | ------------- | -------------- | ------------- | ------------------- |
| `sm` | 24 x 12 px    | 8 px           | 2 px          | 100 px              |
| `md` | 32 x 16 px    | 10.67 px       | 2.67 px       | 1000 px             |
| `lg` | 40 x 20 px    | 13.33 px       | 3.33 px       | 166.67 px           |

---

> **Ratio rule**: Thumb diameter = Track height x 2/3, Thumb spacing = Track height x 1/6.

#### States and Opacity

| State          | Track Color | Thumb Position | opacity |
| -------------- | ----------- | -------------- | ------- |
| Off + Default  | `track-off` | Left           | `1`     |
| Off + Disabled | `track-off` | Left           | `0.4`   |
| On + Default   | `track-on`  | Right          | `1`     |
| On + Disabled  | `track-on`  | Right          | `0.3`   |

### 4. Structure

```text
[Track]                  — Track container, overflow: hidden, pill-shaped border radius
  └─ [Thumb]             — Thumb, absolutely positioned, vertically centered (top:50% + translateY(-50%))
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

| Property       | Value                                                 |
| -------------- | ----------------------------------------------------- |
| Icon Name      | `close-l1`                                            |
| Container Size | `18 x 18px`                                           |
| Icon URL       | `https://alva-ai-static.b-cdn.net/icons/close-l1.svg` |
| Fill Color     | `var(--text-n9)`                                      |

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

> Placeholder is a reserved area; replace with actual business content (forms, lists, confirmation messages, etc.) when used.

### Interaction

- Clicking the overlay can close the modal (configurable)
- Clicking the close icon (x) in the top-right corner closes the modal
- When the modal is open, background content is not scrollable
- When modal content exceeds available height, the content area scrolls internally
- Responsive: `16px` safe margin horizontally, `48px` safe margin vertically

### Responsive

| Screen   | Panel Width           | Behavior                                              |
| -------- | --------------------- | ----------------------------------------------------- |
| >= 992px | max `960px`, centered | Horizontally centered, equal whitespace on both sides |
| < 992px  | `100% - 32px`         | Adaptive width, `16px` margin on left and right       |

## Select

### Basic Information

| Property         | Value                               |
| ---------------- | ----------------------------------- |
| Background Color | `#var(--b0-container)`              |
| Font             | `Delight`                           |
| Font Weight      | `400`                               |
| Border Style     | `0.5px solid`                       |
| Icon viewBox     | `0 0 20 20`                         |
| Text Overflow    | `text-ellipsis + whitespace-nowrap` |

### Arrow Icon

**CSS**

```css
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

**HTML**

```html
<!-- Large / Medium: 14x14 -->
<div class="select-icon" style="width:14px;height:14px;">
  <img src="https://alva-ai-static.b-cdn.net/icons/arrow-down-f2.svg" alt="" />
</div>

<!-- Small: 12x12 -->
<div class="select-icon" style="width:12px;height:12px;">
  <img src="https://alva-ai-static.b-cdn.net/icons/arrow-down-f2.svg" alt="" />
</div>
```

### Size Variants

| Property       | Large                | Medium               | Small                |
| -------------- | -------------------- | -------------------- | -------------------- |
| Height         | `48px`               | `40px`               | `28px`               |
| Padding        | `16px / 11px`        | `12px / 8px`         | `8px / 4px`          |
| Border Radius  | `6px`                | `4px`                | `4px`                |
| Font Size      | `16px`               | `14px`               | `12px`               |
| Line Height    | `26px`               | `22px`               | `20px`               |
| Letter Spacing | `0.16px`             | `0.14px`             | `0.12px`             |
| Gap            | `8px`                | `8px`                | `4px`                |
| Icon Size      | `14px`               | `14px`               | `12px`               |
| Text Width     | `flex: 1 (adaptive)` | `flex: 1 (adaptive)` | `flex: 1 (adaptive)` |

---

### Click Behavior

Clicking the Select container triggers the associated **Dropdown Menu** (see [Dropdown Menu](#dropdown-menu)).

- Dropdown width defaults to the same width as the Select container
- Dropdown list item text size follows the Select size (see table below)
- Clicking again or clicking outside the area closes the Dropdown
- Arrow icon always points down and does not rotate with toggle state

---

### Interaction States

Each size includes 3 states.

#### Default

- Border color: `var(--line-l3)`
- Text color: `var(--text-n3)`
- Arrow color: `var(--text-n2)`

#### Hover

- Border color: `var(--text-n9)`
- Text color: `var(--text-n9)`
- Arrow color: `var(--text-n9)`

#### Filled

- Border color: `var(--line-l3)`
- Text color: `var(--text-n9)`
- Icon opacity: `0.2`

---

### Layout Structure

```
Select Container (flex, items-center)
├── Border Overlay (absolute inset-0, pointer-events-none)
├── Text Label (flex: 1, ellipsis overflow)
└── Icon Wrapper (shrink-0, flex, items-center, justify-center)
    └── Arrow Down SVG
```

- Container uses `flex + items-center` for horizontal layout
- Border is implemented via an `absolute inset-0` overlay with `pointer-events-none`
- Text area uses `flex: 1` for adaptive width (except Small size, which is fixed at 70px)
- Icon area uses `shrink-0` to prevent being compressed

---

### Dropdown List Item Text Specification

The font size, line height, and letter spacing of Dropdown list items match the triggering Select size.

| Property       | Large    | Medium   | Small    |
| -------------- | -------- | -------- | -------- |
| Font Size      | `16px`   | `14px`   | `12px`   |
| Line Height    | `26px`   | `22px`   | `20px`   |
| Letter Spacing | `0.16px` | `0.14px` | `0.12px` |

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
  font-family: "Delight", sans-serif;
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
  padding-bottom: 6px;
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
<div class="tab tab-pill">
  <div class="tab-item active" data-text="Tab 1">Tab 1</div>
  <div class="tab-item" data-text="Tab 2">Tab 2</div>
  <div class="tab-item" data-text="Tab 3">Tab 3</div>
</div>

<!-- Underline S -->
<div class="tab tab-underline tab-s">
  <div class="tab-item active" data-text="Tab 1">Tab 1</div>
  <div class="tab-item" data-text="Tab 2">Tab 2</div>
</div>
```

## Input

TBD

## Tag

TBD

## Tooltip

TBD
