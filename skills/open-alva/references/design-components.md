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

### Size Specification

Sizes are controlled via container modifier classes and apply to all text elements within the container.

| Element                  | Large (default) | Medium `.markdown-container--m` | Small `.markdown-container--s` |
| ------------------------ | --------------- | ------------------------------- | ------------------------------ |
| H1                       | 20px / 30px     | 18px / 28px                     | 14px / 22px                    |
| H2                       | 20px / 30px     | 16px / 26px                     | 12px / 20px                    |
| H3                       | 18px / 28px     | 14px / 22px                     | 12px / 20px                    |
| H4 – H6                  | 16px / 26px     | 14px / 22px                     | 12px / 20px                    |
| Paragraph                | 16px / 26px     | 14px / 22px                     | 12px / 20px                    |
| Ordered / Unordered List | 16px / 26px     | 14px / 22px                     | 12px / 20px                    |
| Inline Code              | 12px / 20px     | 12px / 20px                     | 10px / 16px                    |
| Table Cell               | 14px / 22px     | 12px / 20px                     | 12px / 20px                    |
| Table Padding            | 12px            | 8px                             | 8px                            |
| Table Cell Min Height    | 180px           | 176px                           | 176px                          |
| H1 padding-top           | 8px             | 2px                             | 2px                            |
| H2 padding-top           | 8px             | 2px                             | 0                              |
| H3 padding-top           | 4px             | 0                               | 0                              |
| Container Gap            | 16px            | 8px                             | 4px                            |
| List Gap                 | 8px             | 4px                             | 4px                            |
| Code Padding             | 2px 8px         | 8px                             | 2px 6px                        |

```css
/* ── Medium ── */
.markdown-container--m .markdown-h1 {
  font-size: 18px;
  line-height: 28px;
  letter-spacing: 0.18px;
  padding-top: 2px;
}

.markdown-container--m .markdown-h2 {
  font-size: 16px;
  line-height: 26px;
  letter-spacing: 0.16px;
  padding-top: 2px;
}

.markdown-container--m .markdown-h3 {
  font-size: 14px;
  line-height: 22px;
  letter-spacing: 0.14px;
  padding-top: 0;
}

.markdown-container--m .markdown-h4,
.markdown-container--m .markdown-h5,
.markdown-container--m .markdown-h6 {
  font-size: 14px;
  line-height: 22px;
  letter-spacing: 0.14px;
}

.markdown-container--m .markdown-paragraph,
.markdown-container--m .markdown-list-number,
.markdown-container--m .markdown-unordered-list-item {
  font-size: 14px;
  line-height: 22px;
  letter-spacing: 0.14px;
}
.markdown-container--m .markdown-bullet {
  height: 22px;
}

.markdown-container--m .markdown-th,
.markdown-container--m .markdown-td {
  font-size: 12px;
  line-height: 20px;
  letter-spacing: 0.12px;
  padding: 8px;
  min-height: 176px;
}

.markdown-container--m .markdown-ordered-list,
.markdown-container--m .markdown-unordered-list {
  gap: 4px;
}

.markdown-container--m .markdown-code-block {
  padding: 8px;
}
.markdown-container--m {
  gap: 8px;
}

/* ── Small ── */
.markdown-container--s .markdown-h1 {
  font-size: 14px;
  line-height: 22px;
  letter-spacing: 0.14px;
  padding-top: 2px;
}

.markdown-container--s .markdown-h2 {
  font-size: 12px;
  line-height: 20px;
  letter-spacing: 0.12px;
  padding-top: 0;
}

.markdown-container--s .markdown-h3 {
  font-size: 12px;
  line-height: 20px;
  letter-spacing: 0.12px;
  padding-top: 0;
}

.markdown-container--s .markdown-h4,
.markdown-container--s .markdown-h5,
.markdown-container--s .markdown-h6 {
  font-size: 12px;
  line-height: 20px;
  letter-spacing: 0.12px;
}

.markdown-container--s .markdown-paragraph,
.markdown-container--s .markdown-list-number,
.markdown-container--s .markdown-unordered-list-item {
  font-size: 12px;
  line-height: 20px;
  letter-spacing: 0.12px;
}
.markdown-container--s .markdown-bullet {
  height: 20px;
}

.markdown-container--s .markdown-code-content {
  font-size: 10px;
  line-height: 16px;
}

.markdown-container--s .markdown-code-block {
  padding: 2px 6px;
}

.markdown-container--s .markdown-th,
.markdown-container--s .markdown-td {
  font-size: 12px;
  line-height: 20px;
  letter-spacing: 0.12px;
  padding: 8px;
  min-height: 176px;
}

.markdown-container--s .markdown-ordered-list,
.markdown-container--s .markdown-unordered-list {
  gap: 4px;
}
.markdown-container--s {
  gap: 4px;
}
```

```css
/* ============================================
   1. Heading Styles (H1-H6)
   ============================================ */

.markdown-h1 {
  font-family: "Delight";
  font-weight: 500;
  font-size: 20px;
  line-height: 30px;
  letter-spacing: 0.2px;
  color: var(--text-n9);
  font-style: normal;
  padding-top: 12px;
  margin: 0;
  width: 100%;
  display: flex;
  align-items: center;
}

.markdown-h2 {
  font-family: "Delight";
  font-weight: 500;
  font-size: 20px;
  line-height: 30px;
  letter-spacing: 0.2px;
  color: var(--text-n9);
  font-style: normal;
  padding-top: 12px;
  margin: 0;
  width: 100%;
  display: flex;
  align-items: center;
}

.markdown-h3 {
  font-family: "Delight";
  font-weight: 500;
  font-size: 18px;
  line-height: 28px;
  letter-spacing: 0.18px;
  color: var(--text-n9);
  font-style: normal;
  padding-top: 4px;
  margin: 0;
  width: 100%;
  display: flex;
  align-items: center;
}

.markdown-h4 {
  font-family: "Delight";
  font-weight: 500;
  font-size: 16px;
  line-height: 26px;
  letter-spacing: 0.16px;
  color: var(--text-n9);
  font-style: normal;
  margin: 0;
  width: 100%;
  display: flex;
  align-items: center;
}

.markdown-h5 {
  font-family: "Delight";
  font-weight: 500;
  font-size: 16px;
  line-height: 26px;
  letter-spacing: 0.16px;
  color: var(--text-n9);
  font-style: normal;
  margin: 0;
  width: 100%;
  display: flex;
  align-items: center;
}

.markdown-h6 {
  font-family: "Delight";
  font-weight: 500;
  font-size: 16px;
  line-height: 26px;
  letter-spacing: 0.16px;
  color: var(--text-n9);
  font-style: normal;
  margin: 0;
  width: 100%;
  display: flex;
  align-items: center;
}

/* ============================================
   2. Paragraph Styles
   ============================================ */

.markdown-paragraph {
  font-size: 16px;
  line-height: 26px;
  letter-spacing: 0.16px;
  color: var(--text-n9);
  font-style: normal;
  white-space: pre-wrap;
  width: 100%;
  display: flex;
  flex-direction: column;
}

/* ============================================
   3. List Styles
   ============================================ */

/* Ordered List */
.markdown-ordered-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  list-style: none;
  margin: 0;
  padding: 0;
  width: 100%;
}

.markdown-ordered-list-item {
  display: flex;
  align-items: flex-start;
  width: 100%;
}

.markdown-list-number {
  font-size: 16px;
  line-height: 26px;
  letter-spacing: 0.16px;
  color: var(--text-n9);
  min-width: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* Unordered List */
.markdown-unordered-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  list-style: none;
  margin: 0;
  padding: 0;
  width: 100%;
}

.markdown-unordered-list-item {
  display: flex;
  align-items: flex-start;
  width: 100%;
}

.markdown-bullet {
  width: 24px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
}

.markdown-bullet::before {
  content: "";
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background-color: var(--text-n9);
}

/* ============================================
   4. Code Block Styles
   ============================================ */

.markdown-code-block {
  background-color: var(--b-r02);
  border: 1px solid var(--line-l07);
  border-radius: 2px;
  padding: 2px 8px;
  display: inline-flex;
  align-items: center;
}

.markdown-code-content {
  font-family: "JetBrains Mono", monospace;
  font-size: 12px;
  font-weight: normal;
  line-height: 20px;
  letter-spacing: 0.12px;
  color: var(--text-n7);
}

/* ============================================
   5. Table Styles
   ============================================ */

.markdown-table {
  width: 100%;
  border-collapse: collapse;
}

.markdown-th,
.markdown-td {
  padding: 12px;
  min-height: 180px;
  border-bottom: 1px solid var(--line-l07);
  font-family: "Delight";
  font-size: 14px;
  line-height: 22px;
  letter-spacing: 0.14px;
  color: var(--text-n9);
  text-align: left;
}

.markdown-th {
  font-weight: 500;
  padding-top: 0;
}

/* ============================================
   6. Container Styles
   ============================================ */

.markdown-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px; /* Large default */
}

/* ============================================
   6. Common Styles
   ============================================ */

.markdown-container * {
  box-sizing: border-box;
}

.markdown-divider * {
  height: 1px;
  background: var(--line-l07);
}

/* Responsive Design */
@media (max-width: 768px) {
  .markdown-container {
    max-width: 100%;
    padding: 0 16px;
  }

  .markdown-table {
    overflow-x: scroll;
  }
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
