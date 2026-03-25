# Design System — Personal Finance & Budget App

This document is the **single source of truth for all UI/UX decisions**.
It is written for **Claude Code** and must be followed exactly when implementing the frontend.

All mockups live in `mockups/` (HTML files, open in browser). When in doubt, consult them.

---

## Table of Contents

1. [Design Principles](#1-design-principles)
2. [Design Tokens](#2-design-tokens)
3. [Typography](#3-typography)
4. [App Shell & Navigation](#4-app-shell--navigation)
5. [Component Specs](#5-component-specs)
6. [Screen Specifications](#6-screen-specifications)
7. [Interaction Patterns](#7-interaction-patterns)
8. [Data & Number Formatting](#8-data--number-formatting)
9. [Mobile Design](#9-mobile-design)
10. [Role-Based UX](#10-role-based-ux)
11. [Accessibility](#11-accessibility)
12. [What to Avoid](#12-what-to-avoid)

---

## 1. Design Principles

This is a **private personal tool**, not a SaaS product.

**Core priorities (in order):**
1. Speed of transaction entry — add a transaction in under 5 seconds
2. Clarity of financial state — "What's left?" must be instantly visible
3. Consistency — same patterns everywhere, no surprises
4. Mobile-first input — the FAB and bottom sheet are first-class features

**Mental model the UI must enforce:**
- "This month" is always the active context
- "My money right now" — the remaining balance is the hero number
- "What's left" — always visible, never hidden

**Style direction:** Modern & bold fintech. Big numbers, high contrast, strong accent colors. Think Revolut / Linear — not a generic dashboard.

---

## 2. Design Tokens

### 2.1 Color Palette

Implement as CSS custom properties on `:root` (dark) and `[data-theme="light"]`.

#### Dark theme (default)

```css
:root {
  --bg:             #0d0f18;   /* page background */
  --surface:        #13161f;   /* cards, sidebar, topbar */
  --surface-raised: #1a1d2e;   /* elevated surface (hover bg, input bg, category headers) */
  --surface-hover:  #1e2236;   /* row hover background */
  --border:         #252a3d;   /* primary border */
  --border-sub:     #1c1f30;   /* subtle row dividers */
}
```

#### Light theme

```css
[data-theme="light"] {
  --bg:             #f4f5f9;
  --surface:        #ffffff;
  --surface-raised: #f0f1f7;
  --surface-hover:  #eceef6;
  --border:         #e2e5ef;
  --border-sub:     #eceef6;
}
```

#### Semantic colors (same in both themes unless noted)

```css
/* Accent — primary interactive color */
--accent:       #4263eb;
--accent-soft:  #6485f5;          /* hover, labels, links */
--accent-bg:    rgba(66,99,235,.12);  /* tinted background */

/* Text */
--text:    #e8eaf6;   /* primary — headings, values */
--text-2:  #9399b5;   /* secondary — labels, sub-text */
--text-3:  #5d6384;   /* muted — placeholders, hints */

/* Light theme text overrides */
/* --text:   #1a1d2e; --text-2: #525878; --text-3: #9399b5; */

/* Semantic: income / positive */
--green:     #51cf66;
--green-dim: #2f9e44;   /* progress bars, borders */
--green-bg:  rgba(81,207,102,.11);

/* Semantic: expense / negative / error */
--red:     #ff6b6b;
--red-dim: #e03131;
--red-bg:  rgba(255,107,107,.11);

/* Semantic: warning / override */
--amber:    #fcc419;
--amber-bg: rgba(252,196,25,.10);

/* Semantic: pre-registered / upcoming */
--violet:    #cc5de8;
--violet-bg: rgba(204,93,232,.10);

/* Category color: Fasta kostnader bars */
--teal:    #20c997;
--teal-bg: rgba(32,201,151,.10);
```

### 2.2 Border Radius

```css
--r-sm:  6px;    /* buttons, inputs, small chips */
--r-md:  10px;   /* stat cards, category blocks */
--r-lg:  14px;   /* page cards, table wrappers */
--r-xl:  18px;   /* income cards, large surfaces */
--r-2xl: 22px;   /* login card, bottom sheets */
--r-pill: 100px; /* pills, chips, badges */
```

### 2.3 Shadows

```css
/* Login card */
box-shadow: 0 24px 64px rgba(0,0,0,.4), 0 0 0 1px rgba(255,255,255,.03);

/* FAB button */
box-shadow: 0 4px 16px rgba(66,99,235,.4);

/* Submit button hover */
box-shadow: 0 6px 24px rgba(66,99,235,.55);

/* Phone frame (mockup only) */
box-shadow: 0 20px 60px rgba(0,0,0,.35);
```

### 2.4 Category Chart Colors

Each budget category has a fixed color for the spending bar chart:

| Category | Color token |
|---|---|
| Lån | `--accent` (`#4263eb`) |
| Fasta kostnader | `--teal` (`#20c997`) |
| Prenumerationer | `--violet` (`#cc5de8`) |
| Övrigt & Buffert | `--amber` (`#fcc419`) |

---

## 3. Typography

### Font stack

```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
```

### Scale

| Role | Size | Weight | Tracking | Color |
|---|---|---|---|---|
| Hero number (remaining) | `42px` | `900` | `-1.5px` | `--accent-soft` |
| Hero number (large card) | `32px` | `900` | `-1.2px` | semantic |
| Page title | `22px` | `800` | `-0.6px` | `--text` |
| Card value (stat) | `19–20px` | `900` | `-0.6px` | semantic |
| Section heading | `14px` | `700` | `-0.2px` | `--text` |
| Body / row name | `13px` | `500–600` | `0` | `--text` |
| Row amount | `13–14px` | `700–800` | `-0.3px` | semantic |
| Meta / label | `12px` | `600` | `0` | `--text-2` |
| Uppercase label | `10px` | `700` | `+0.6–0.8px` | `--text-3` |
| Micro / hint | `9–10px` | `600–700` | `+0.3px` | `--text-3` |

### Rules

- All monetary values use `font-variant-numeric: tabular-nums` — no exceptions.
- Uppercase labels use `text-transform: uppercase` + `letter-spacing: 0.6–0.8px`.
- Page titles and hero numbers use negative letter-spacing for a tight, premium feel.
- Never use font sizes below 9px.

---

## 4. App Shell & Navigation

### 4.1 Layout

```
┌──────┬────────────────────────────────────────────┐
│      │  Topbar (54px)                             │
│ Side │────────────────────────────────────────────│
│ bar  │                                            │
│(56px)│  Page content (flex, scrollable)           │
│      │                                            │
└──────┴────────────────────────────────────────────┘
```

- **Sidebar width:** `56px` — fixed, never expands
- **Topbar height:** `54px` — fixed, no scroll
- **Page content:** `flex-direction: column`, `overflow-y: auto`, `padding: 24px 28px 48px`

### 4.2 Sidebar

The sidebar is **icon-only** (collapsed). No labels are shown — only tooltips on hover.

```
Structure:
  - Logo mark (34×34px, --accent bg, "J" text, --r-sm)
  - Nav group (flex, gap 2px, flex: 1)
  - Bottom: Settings icon + User avatar
```

**Nav button spec:**

| Property | Value |
|---|---|
| Size | `38×38px` |
| Border radius | `--r-sm` |
| Default color | `--text-3` |
| Hover | `background: --surface-raised` + `color: --text-2` |
| Active color | `--accent-soft` |
| Active background | `--accent-bg` |
| Active left indicator | `3px × 18px` bar, `--accent` color, `border-radius: 0 3px 3px 0`, `position: absolute; left: -9px` |

**Tooltip spec:**
- `position: absolute; left: calc(100% + 12px)`
- `background: --surface-raised`, `border: 1px solid --border`
- `font-size: 11px; font-weight: 600`
- `opacity: 0` → `1` on hover
- `z-index: 100`

**Nav items (in order):**

| Icon | Label | Route |
|---|---|---|
| Home/grid | Dashboard | `/` |
| Monitor | Master Budget | `/budget/master` |
| Calendar | Monthly Budgets | `/budget/monthly` |
| Clipboard | Transactions | `/budget/monthly/:id/transactions` |
| Clock | Pre-registered | `/budget/pre-registered` |
| Tag | Tags | `/budget/tags` |

Bottom: Settings (cog icon) + User avatar (30px circle, gradient `--accent` → `#7048e8`, initials).

### 4.3 Topbar

**Left side:**
- **Dashboard page:** Personalised greeting — `"Good morning/afternoon/evening, [name] · [Full date]"`
  - Greeting changes based on time of day
  - Date format: `"Wednesday, 25 March 2026"`
- **All other pages:** Breadcrumb — `"Finance › Monthly Budgets › March 2026"`
  - Breadcrumb segments are clickable (color `--text-3`, hover `--text-2`)
  - Current page is `font-weight: 600; color: --text`
  - Separator: `›` at `opacity: 0.4`

**Right side (action buttons):**
- Export `.xlsx` — ghost button with download icon
- Primary action (e.g. "Add Transaction", "Add Category") — primary button

**Status pills** appear inline in the topbar breadcrumb or page header:

| Pill | Background | Color | Usage |
|---|---|---|---|
| `● Open` | `--green-bg` | `--green` | Open monthly budget |
| `● Closed` | `--surface-raised` | `--text-3` | Closed monthly budget |
| `Template` | `--accent-bg` | `--accent-soft` | Master budget indicator |
| `📸 Snapshot` | `--violet-bg` | `--violet` | Monthly budget snapshot indicator |

Pill spec: `padding: 4px 10px; border-radius: --r-pill; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px`

---

## 5. Component Specs

### 5.1 Buttons

```
Primary:   bg --accent, color white, hover bg --accent-soft
           box-shadow: 0 4px 16px rgba(66,99,235,.4)
           hover: translateY(-1px) + stronger shadow

Ghost:     bg transparent, border 1px --border, color --text-2
           hover: bg --surface-raised, color --text, border-color --text-3

Danger:    bg --red-bg, color --red, border 1px rgba(255,107,107,.25)
           hover: bg rgba(255,107,107,.2)
```

**Sizes:**

| Name | Padding | Font size |
|---|---|---|
| Default | `7px 14px` | `13px` |
| `sm` | `5px 11px` | `12px` |
| `xs` | `4px 9px` | `11px` |

All buttons: `border-radius: --r-sm; font-weight: 600; font-family: inherit; display: inline-flex; align-items: center; gap: 6px`

**Icon button** (row actions):
- Size: `26–30px` square, `--r-sm`
- Default: `color: --text-3`; hover: `bg --surface-raised, color --text-2`
- Danger variant hover: `bg --red-bg, color --red`
- Confirm variant hover: `bg --green-bg, color --green`

### 5.2 Form Inputs

```
height:     44px
background: --surface-raised
border:     1.5px solid --border
radius:     --r-md
color:      --text
font-size:  14px
padding:    0 12px 0 38px  (when icon present, else 0 12px)
```

**States:**

| State | Border | Shadow |
|---|---|---|
| Default | `--border` | none |
| Focus | `--accent` (`--border-focus`) | `0 0 0 3px rgba(66,99,235,.15)` |
| Has value | `--border` (unchanged) | none |
| Error | `--red` | `0 0 0 3px rgba(255,107,107,.15)` |

**Field layout:** Label (`12px, 700 weight, color --text-2`) always above the input with `margin-bottom: 6px`.

**Inline edit inputs** (used inside table rows):

```
height:     auto (padding: 5px 8px)
background: --surface-raised
border:     1.5px solid --accent
radius:     --r-sm
font-size:  13px; font-weight: 600
text-align: right (for amount fields)
outline:    none
```

Always show a hint below: `"↵ save · Esc cancel"` — `font-size: 9–10px; color: --accent-soft; opacity: .7`

### 5.3 Cards (Stat Cards)

Used in the summary strips on Dashboard and Monthly Budget.

```
background:    --surface
border:        1px solid --border
border-radius: --r-lg  (page context) or --r-xl (income card)
padding:       14px 16px  (standard) or 18px 22px (income card)
```

Label row: `10px, 700, uppercase, tracking 0.7px, color --text-3`
Value row: `19–20px, 900, tracking -0.6px, tabular-nums`
Sub row: `11px, color --text-3`

**Progress bar inside stat card:**
```
margin-top:    8–10px
height:        4–5px
background:    --border (track)
border-radius: 2–3px
overflow:      hidden
```
Fill colors: `--green-dim` (good), `--red-dim` (spent/over), `--amber` (warning), `--accent` (progress).

**Accent line variant** (hero card — Remaining):
```
border-top: 3px solid --accent
position: absolute; top: 0; left: 0; right: 0
border-radius: 0 0 3px 3px
```

### 5.4 Category Blocks (Master Budget / Monthly Budget)

A category block wraps one budget category and all its items.

```
background:    --surface
border:        1px solid --border
border-radius: --r-lg
overflow:      hidden
```

**Category header row:**
```
height:     42px
padding:    0 16px 0 12px
background: --surface-raised
gap:        8px
grid:       drag-handle | chevron | name | count badge | spacer | total | actions
```

- Drag handle: `color: --text-3; opacity: .35; cursor: grab`
- Chevron: `11×11px SVG; color: --text-3; transition: transform .15s` (rotates 90° when open)
- Category name: `13px, 700, color --text`
- Count badge: `10px, 700, bg --border, color --text-3, padding 1px 6px, border-radius 100px`
- Total: `13px, 700, color --text-2, text-align right, min-width 88px, tabular-nums`
- Actions (edit/delete): `opacity: 0; transition: opacity .15s` → `opacity: 1` on row hover

**Item rows:**
```
grid:   16px | 1fr | auto | 88px | 68px
        (drag | name | [spacer] | amount | actions)
height: 42–50px
border-bottom: 1px solid --border-sub
```

- Name: `13px, 500`
- Amount: `13px, 700, text-align right, tabular-nums`
- Actions: `opacity: 0` → reveal on hover

**Add-item row (bottom of each category):**
```
padding:    9px 16px 9px 38px
color:      --text-3
font-size:  12px; font-weight: 600
cursor:     pointer
border-top: 1px solid --border-sub
```
Hover: `color --accent-soft; background --accent-bg`

### 5.5 Transaction Table

**Column order (desktop):**

| # | Column | Width | Alignment |
|---|---|---|---|
| 1 | Row index | `56px` | left |
| 2 | Date (date + day of week) | `110px` | left |
| 3 | Description + category chip + tags | `1fr` | left |
| 4 | Type badge | `100px` | left |
| 5 | Amount | `90px` | right |
| 6 | Running balance | `90px` | right |
| 7 | Receipt indicator | `80px` | right |
| 8 | Row actions | `60px` | right |

**Row height:** `56px` (comfortable density)

**Income rows:** `border-left: 3px solid --green-dim` — visually distinct from expenses.

**Type badges:**
```
padding:       3px 8px
border-radius: 100px
font-size:     10px; font-weight: 700; text-transform: uppercase; letter-spacing: .3px
dot:           5×5px circle, same color as text
```
- Income: `bg --green-bg; color --green`
- Expense: `bg --red-bg; color --red`

**Row actions** (hidden until hover):
- View receipt icon (only if attachment exists)
- Edit icon
- Delete icon (danger hover)

**Table header:**
```
height:    38px
font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .6px; color: --text-3
```
Headers are clickable for sorting. Active sort column uses `color: --accent-soft`.

**Table footer** (below rows):
```
background:  --surface-raised
border-top:  1px solid --border
height:      46px
```
Shows: row count, total amount for filtered view, current running balance.

### 5.6 Filter Bar (Transaction Log)

Always visible above the transaction table. Never hidden behind a toggle.

```
display:     flex
align-items: center
gap:         8px
flex-wrap:   wrap
```

**Filter chips:**
```
padding:       6px 12px
border-radius: --r-sm
border:        1px solid --border
background:    --surface
font-size:     12px; font-weight: 600; color: --text-2
```
Active state: `border-color --accent; color --accent-soft; background --accent-bg`
Hover: same as active

**Active filters indicator:**
```
background: --amber-bg
border:     1px solid rgba(252,196,25,.25)
color:      --amber
font-size:  11px; font-weight: 700
padding:    5px 10px
border-radius: --r-sm
```
Shows when any filter is active (e.g. `"⚙ 2 filters"`).

**Search input:** inline, `width: 160px`, search icon on left, integrated with the filter bar.

### 5.7 Monthly Budget Table

**Column order:**

| # | Column | Width | Alignment |
|---|---|---|---|
| 1 | Drag handle | `18px` | left |
| 2 | Category / Item name | `1fr` | left |
| 3 | Budgeted amount | `120px` | right |
| 4 | Actual spent | `120px` | right |
| 5 | Variance | `120px` | right |
| 6 | Usage bar | `90px` | left |
| 7 | Row actions | `64px` | right |

**Override badge** (shown on items with overridden amounts):
```
background:    --amber-bg
border:        1px solid rgba(252,196,25,.25)
color:         --amber
font-size:     9px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px
padding:       1px 5px
border-radius: 4px
```

Overridden item also shows: original value in `--text-3` color with `text-decoration: line-through`

**Variance colors:**
- Over budget: `color: --red`
- Under budget (surplus): `color: --green`
- Exactly on budget: `color: --text-3; content: "—"`

**Usage bar (per item):**
```
height:        5px
background:    --border (track)
border-radius: 3px
```
Fill: `--green-dim` (normal), `--red-dim` (over 100%). Show `"⚠"` label when over budget.

**Actual spent cell:**
- Shows amount + `"X transactions ↗"` link in `--accent-soft` that navigates to filtered transaction view.
- When 0 transactions: `"— kr"` in `--text-3`

### 5.8 Tabs (Monthly Budget screen)

```
border-bottom: 1px solid --border
padding: 0 2px
```

**Tab item:**
```
padding:      10px 16px
font-size:    13px; font-weight: 600
color:        --text-3 (default)
border-bottom: 2px solid transparent (default)
margin-bottom: -1px
```
Active: `color: --accent-soft; border-bottom-color: --accent`
Hover: `color: --text-2`

**Count badges on tabs:**
- Default: `bg --accent-bg; color --accent-soft`
- Alert (pre-registered pending): `bg --red-bg; color --red`
- `font-size: 10px; font-weight: 700; padding: 1px 5px; border-radius: 100px`

### 5.9 Pre-registered Entry Rows

```
padding:       11–12px 20px
border-bottom: 1px solid --border-sub
display:       flex; align-items: center; gap: 12–14px
```

**Month dot** (left side):
```
width:  36px; height: 36px
border-radius: --r-md
display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1px
```
- Month abbrev: `8px, 700, uppercase, tracking 0.5px`
- Day number: `15px, 900, tracking -0.4px`
- Color per timing:
  - This month: `--violet-bg` bg + `--violet` text
  - Next month: `--accent-bg` bg + `--accent-soft` text
  - Income: `--green-bg` bg + `--green` text
  - Later months: `--amber-bg` bg + `--amber` text

Timing label: `font-size: 10px; color: --text-3` ("in 18 days", "in ~5 weeks", "this month")

### 5.10 Category Spending Bar Chart

Used on the Dashboard. Horizontal dual-layer bars — no external chart library required.

```
Each bar row:
  - Label row: category name + color dot (8×8px, r-2px) on left; actual amount + budgeted on right
  - Double bar: position relative, height 8px, bg --border (track)
    - Budget layer: position absolute, height 100%, opacity .25, same category color
    - Actual layer: position absolute, height 100%, same category color, on top
```

Over-budget indicator: inline `⚠ over` badge (`bg --red-bg; color --red; font-size 10px; font-weight 700`) next to category name.

Chart legend (bottom): "Actual spent" (full opacity swatch) + "Budgeted" (25% opacity swatch) + total summary text.

### 5.11 Spending Ring (Dashboard)

SVG donut chart showing percentage of variable room spent this month.

```
Size:         140×140px
Ring radius:  56
Ring stroke:  12px
Track color:  --border
Fill color:   --accent (percentage spent)
```

Center label: `28px, 900, color --text` (percentage) + `10px, 700, uppercase, --text-3` ("spent")

Below ring: 2×2 grid of stat mini-cards (`background: --surface-raised; border-radius: --r-md; padding: 10px 12px`).

---

## 6. Screen Specifications

### 6.1 Login Screen

**Layout:** Full-screen 3-column grid. No sidebar. No topbar.

```
grid-template-columns: 1fr 480px 1fr
align-items: center
```

**Background:**
- Dot grid: `radial-gradient(circle, --border 1px, transparent 1px)` at `28px × 28px`, `opacity: 0.4`
- Three ambient glow orbs (radial gradients, `filter: blur(80px)`, `pointer-events: none`):
  - Orb 1: `480×480px; rgba(66,99,235,.18); top-left`
  - Orb 2: `400×400px; rgba(112,72,232,.12); bottom-right`
  - Orb 3: `300×300px; rgba(81,207,102,.07); center-right`

**Left panel** (preview cards, `opacity: .65`, hover `opacity: 1`):
- "Remaining this month" mini stat card with progress bar
- Recent transactions mini list (3 rows)

**Center — login card** (`border-radius: --r-2xl`):
- Brand mark: `52px × 52px; border-radius: 14px; bg --accent; box-shadow: 0 8px 32px rgba(66,99,235,.35)`
- App name: `18px, 800, tracking -0.5px`
- App subtitle: `12px, color --text-3`
- Form: email field + password field (with show/hide toggle) + Forgot password link
- Submit button: full width, `height: 46px`, primary style + glow shadow, arrow icon
- "Private application · Access by invitation only" badge below card:
  - Green `8×8px` animated dot + text label
  - `bg --surface-raised; border: 1px solid --border; border-radius: 100px; padding: 5px 12px`

**Right panel** (feature highlights, 5 items with colored icon squares).

**Three states to implement:**

| State | Trigger | Changes |
|---|---|---|
| Default | Page load | Normal form, pre-filled email if remembered |
| Loading | Submit click | Spinner replaces arrow, button `opacity: .75`, fields `readonly`, text "Signing in…" |
| Error | Failed auth | Red error banner above fields (`bg --red-bg; border rgba(255,107,107,.25)`), red field borders + inline error message under password, "Try again" CTA |

**No registration link.** This is a private app. Users are created by Admin only.

### 6.2 Dashboard

Default landing page after login.

**Page header:** Month navigator (`← March 2026 →`) + Open status pill.

**Hero stat strip** (`grid-template-columns: 1fr 1fr 1fr 1fr 1fr; gap: 14px`):
- **Remaining** (spans 2 columns): `--accent` top accent line, hero value `42px 900 --accent-soft`, progress bar, "X% of variable room left" sub, `▲ On track` / `▼ Over` badge
- **Net income:** `26px` value, green
- **Spent:** `26px` value, red, mini progress bar + "X% · N transactions"
- **Fixed budget costs:** `26px` value, amber, mini progress bar + override badge if any

**Main content** (`grid-template-columns: 1fr 340px; gap: 20px`):

Left column:
1. Category spending bar chart card (title + "View full budget →" link)
2. Recent transactions card (last 5 rows + "View all N →" footer link)

Right column:
1. Monthly progress ring card (SVG donut + 2×2 stat grid)
2. Pre-registered upcoming card (next 4 entries with month dots + "View all →" footer)

### 6.3 Master Budget

**Page header:**
- Title: "Master Budget" (`22px, 800`)
- Subtitle: `"Recurring template · Changes only affect new monthly budgets"` (`12px, --text-3`)
- Topbar: `Template` pill + Export button + `Add Category` primary button

**Income card** (full width, `--r-xl`):
- Left: green icon box + "Monthly net income" label + `45 000 kr` value (`28px, 900, --green`)
- Right: Fixed costs stat + Variable room stat + "Edit income" ghost button
- Dividers between stats: `1px × 32px --border`

**Categories section:**
- Section label: `"Budget categories · N categories · N items"` (`10px, uppercase`)
- One `cat-block` per category (see §5.4)
- Drag-to-reorder is supported (drag handles on both categories and items)

**Inline editing state** (triggered by clicking edit icon on a row):
- Name field replaces name cell, amount field replaces amount cell
- Both use inline edit input style (blue border, surface-raised bg)
- Hint text: `"↵ save · Esc cancel"` between the two fields
- Green checkmark button + red X button in actions column
- Row background: `rgba(66,99,235,.05)`

**Summary bar** (below all categories):
- "Total monthly fixed costs" label + `"− 19 643 kr / month"` value in `--red`

### 6.4 Monthly Budget Detail

**Page header:** Month navigator + `Open/Closed` pill + `📸 Snapshot` pill.

**Topbar actions:** Export `.xlsx` + `Close Month` (danger button) + `Add Transaction` (primary).

**Tab bar** (3 tabs): Budget (active by default) | Transactions (count badge) | Pre-registered (count badge, red if pending).

**Summary strip** (5 stat cards): Net Income | Budgeted Costs | Variable Room | Spent | Remaining. Each with a progress bar and contextual sub-label.

**Budget table** (see §5.7):
- Organized by category rows (collapsible, `--surface-raised` bg) + item rows below
- Shows: Budgeted | Actual Spent | Variance | Usage bar
- Override items show amber badge + strikethrough of master value
- Over-budget items: red actual amount + red full progress bar + `"115% ⚠"` label

**Pre-registered section** (at bottom of Budget tab):
- Lists entries for this month only
- Imported entries: ✅ icon (`--green-bg`), "✓ Imported" status in green
- Pending entries: 🕐 icon (`--violet-bg`), "Pending" status in violet

**Grand total footer bar:** Total budgeted | Total actual | Total variance | Remaining (variable room).

**Closed state:**
- All edit icons hidden
- Override affordances hidden
- `Closed` pill in topbar
- "Reopen Month" button for Admin only
- Table is visually identical but read-only

### 6.5 Transaction Log

**Page header:** Month navigator + Open/Closed pill.

**Topbar actions:** Export `.xlsx` + Overview link + `Add Transaction` primary.

**Summary strip** (4 cards): Net Income + Variable Room | Total Spent | Remaining | Fixed Budget.

**Filter bar** (always visible, see §5.6).

**Transaction table** (see §5.5), sorted descending by date.

**Empty state** (no transactions yet):
```
Centered in table area:
- Icon: clipboard/receipt SVG (48px, --text-3)
- Title: "No transactions yet" (16px, 700)
- Subtitle: "Add your first transaction to start tracking" (13px, --text-3)
- CTA: "Add Transaction" primary button
```

---

## 7. Interaction Patterns

### 7.1 Month Navigation

A `← [Month Year] →` control appears on every financial screen.

- Left arrow: previous month
- Right arrow: next month (disabled if no future budget exists)
- Clicking the month label: opens a month picker (future enhancement, not v1)
- Month label: `22px, 800, tracking -0.6px`
- Arrow buttons: `32×32px; --r-sm; border 1px --border; bg --surface`

### 7.2 Inline Editing (Master Budget items)

Trigger: clicking the edit (pencil) icon on a row.

1. Name cell → `<input class="inp">` with current value
2. Amount cell → `<input class="inp-amt">` with current value
3. Hint text appears: `"↵ save · Esc cancel"`
4. Row background → `rgba(66,99,235,.05)`
5. Actions column → green ✓ + red ✕ buttons

**Save:** Enter key or ✓ button → optimistic update, row returns to normal.
**Cancel:** Escape key or ✕ button → discard, row returns to original values.

### 7.3 Override Amount (Monthly Budget items)

**Desktop:** Clicking edit icon on a budget item opens inline edit of the `budgeted_amount` cell only (same pattern as §7.2 but single field). After saving:
- Amber `Override` badge appears next to item name
- Overridden value shown in `--amber` color
- Original master value shown with `text-decoration: line-through` in `--text-3`
- A "Reset to master" icon button appears on hover

**Mobile:** Opens a bottom sheet with:
- Item name + category
- Large centered amount input (`font-size: 22px, 900, color --amber`)
- 3-stat context row: Master default (strikethrough) | Difference (amber) | Actual spent
- Amber warning note: `"⚠ This override only affects [Month]. The master budget stays at [original]kr."`
- Primary CTA: "Save Override"
- Secondary CTA: `"Reset to master (X kr)"` (ghost style)

### 7.4 Quick-Add Transaction (FAB)

On mobile, the FAB (center of bottom tab bar) opens a bottom sheet.

**Bottom sheet spec:**
```
background:    --surface
border-radius: --r-xl --r-xl 0 0
border-top:    1px solid --border
```

Sheet handle: `32×4px; background: --border; border-radius: 2px; margin: 12px auto`

**Form contents (in order):**
1. Sheet title: `"Add Transaction"` (`15px, 800`)
2. Type toggle: Expense | Income — `bg --surface-raised; border-radius --r-md; padding 3px`
   - Active expense: `bg --red-bg; color --red`
   - Active income: `bg --green-bg; color --green`
   - Inactive: `color --text-3`
3. Amount: Large centered input (`40px, 900`) + "SEK" label below
4. Category: dropdown field (required)
5. Description: text field (optional)
6. Tags: multi-select with inline creation (optional)
7. CTA: "Save Transaction" — full width, `--r-md`, `14px, height 46px+`

**Goal:** Transaction added in < 5 seconds. Amount + category are the only required fields.

### 7.5 Edit Transaction (Mobile)

Tap any transaction row → bottom sheet opens with pre-filled fields.

Same layout as Quick-Add but with existing values populated. Additional fields:
- Date picker (shows current date by default)
- Receipt: shows existing attachment with delete option, or upload affordance

### 7.6 Row Hover Actions (Desktop)

Row actions are hidden (`opacity: 0`) and revealed on `hover` (`opacity: 1`, `transition: opacity .12s`).

Pattern applies to: transaction rows, budget item rows, category header rows, pre-registered rows.

Action order (right-aligned): View/Preview → Edit → Delete.

Delete button uses `danger` variant (red on hover). Never show a confirmation modal for soft deletes — only for destructive permanent actions.

### 7.7 Category Collapse/Expand

Category headers in both Master Budget and Monthly Budget are collapsible.

- Chevron: rotates `0° → 90°` when open (`transition: transform .15s`)
- Items below animate in/out
- Default state: all categories expanded
- State is not persisted (resets on page reload in v1)

---

## 8. Data & Number Formatting

### Currency

- Currency: **SEK**
- Format: `45 000 kr` — space-separated thousands, `kr` suffix with space
- Never use comma as thousands separator
- Always use `font-variant-numeric: tabular-nums`

### Income vs Expense display

| Context | Income | Expense |
|---|---|---|
| Amount in table | `+ 45 000 kr` green | `− 450 kr` red |
| Stat card (total spent) | — | `− 3 471 kr` red |
| Variance (under budget) | `+ 228 kr` green | — |
| Variance (over budget) | — | `− 349 kr` red |
| Running balance | neutral (`--text-2`) | neutral (`--text-2`) |

Use `−` (Unicode minus, U+2212) not `-` (hyphen) for negative values.

### Running balance

- Always shown in `--text-2` (neutral) — it is informational, not a warning
- Exception: If remaining drops below a threshold (configurable), use `--amber`
- Format: `"bal: 41 529"` (compact, no `kr` suffix) in transaction list sub-text
- Format: `"41 529 kr"` (full) in the Balance column of the desktop table

### Dates

- Full format (column header): `"25 Mar"` + `"Wednesday"` (two lines)
- Compact format (mobile sub-text): `"25 Mar"`
- Month labels: `"March 2026"` (no abbreviation in navigation)
- Pre-registered timing: `"in 18 days"`, `"in ~5 weeks"`, `"this month"`

### Percentages

- Displayed as: `"86%"` — no decimal places
- Over 100%: `"115% ⚠"` — amber/red color + warning symbol
- Progress bars show percentage visually; text label shown below or beside

---

## 9. Mobile Design

### 9.1 Bottom Tab Bar

Present on all authenticated screens on mobile. The sidebar is **not shown on mobile**.

```
5 tabs + center FAB:
  [Home] [Budget] [FAB] [Log] [Profile]
```

Tab spec:
```
height:       approx 58px (including bottom safe area)
background:   --surface
border-top:   1px solid --border
```

Each tab: `flex-direction: column; align-items: center; gap: 2px`
- Icon: `20×20px SVG; stroke --text-3 (default) / --accent-soft (active)`
- Label: `9px; font-weight: 600; color --text-3 (default) / --accent-soft (active)`

### 9.2 FAB

```
width:        50px; height: 50px
border-radius: 50%
background:   --accent
box-shadow:   0 4px 16px rgba(66,99,235,.5)
icon:         22×22px plus SVG, white stroke
```

Always centered in the tab bar. Tapping opens the Quick-Add Transaction bottom sheet.

### 9.3 Mobile Page Header

```
padding: 14px 16px 12px
background: --surface
border-bottom: 1px solid --border
```

Contains:
- Month navigator (smaller: `17px, 800`) + status pill
- Summary stats (2×2 grid or horizontal row of mini stat chips)

### 9.4 Summary Stats (Mobile)

`display: grid; grid-template-columns: 1fr 1fr; gap: 8px`

Each stat card: `background: --surface-raised; border-radius: --r-md; padding: 10px 12px`

- Label: `9px, uppercase, tracking 0.5px, --text-3`
- Value: `16px, 900, tabular-nums, letter-spacing -0.5px`

### 9.5 Transaction List (Mobile)

Each row:
```
display: flex; align-items: center; padding: 10–12px 16px; gap: 10–12px
border-bottom: 1px solid --border-sub
```

- Icon box: `34–38px, --r-md, colored bg (--red-bg / --green-bg), emoji`
- Name: `13px, 600`
- Sub-text: `10–11px, --text-3` — date · category · receipt emoji if applicable
- Amount: `13–14px, 800, tabular-nums` — right-aligned, colored
- Running balance: `10–11px, --text-3` — right-aligned, below amount

No action buttons visible in the list. Tap row → Edit bottom sheet.

### 9.6 Budget List (Mobile)

Category rows with expand/collapse.

- Category header: `background: --surface-raised`
- Item rows: `padding-left: 28px` (indented)
- Override indicator: small amber `↑` badge inline with item name
- Over-budget items: red amount + red `⚠` suffix

### 9.7 Mobile Filter Chips

Horizontal scrollable row of chips above the transaction list:
- `display: flex; overflow-x: auto; gap: 6px; padding: 10px 16px`
- No scrollbar visible (`::-webkit-scrollbar { display: none }`)
- Chip spec same as desktop filter chips but `border-radius: 100px`

### 9.8 Bottom Sheet Behaviour

- Slides up from bottom
- Dimmed overlay behind (`rgba(0,0,0,.5)`)
- Dismiss by: swipe down or tap outside
- Handle: `32×4px` bar at top
- Max height: `90vh` with internal scroll if content overflows
- `border-radius: --r-xl --r-xl 0 0` — top corners only
- `border-top: 1px solid --border`

---

## 10. Role-Based UX

### Admin (full access)

- All CRUD actions visible
- Edit/delete icons shown on hover
- "Close Month" button visible
- "Add Transaction" / "Add Category" CTAs visible
- Can override budget line items

### Viewer (read-only)

- **Hide** all action buttons — do not disable them, hide them completely
- No edit icons on rows
- No "Add" buttons anywhere
- No FAB on mobile (or FAB opens read-only summary instead)
- "Export .xlsx" button remains visible (Viewer can export)
- All data is visible — only mutations are hidden

**Implementation rule:** Check role once at the layout level and conditionally render action affordances. Do not use CSS `pointer-events: none` or `opacity: .5` — simply do not render the elements.

---

## 11. Accessibility

- Minimum contrast ratio: **4.5:1** for body text, **3:1** for large text and UI components
- All interactive elements have `:focus-visible` outlines: `0 0 0 3px rgba(66,99,235,.4)`
- Icons that convey meaning must have `aria-label` or adjacent text
- Color is never the sole indicator of state — always pair with text or icon
- Touch targets on mobile: minimum `44×44px`
- Keyboard navigation: Tab through form fields and row actions, Enter to activate, Escape to cancel inline edits
- Amount inputs: `inputmode="decimal"` on mobile to show numeric keyboard
- The type toggle (Income/Expense) must be keyboard-accessible and use `role="radiogroup"`

---

## 12. What to Avoid

| ❌ Don't | ✅ Do instead |
|---|---|
| Generic SaaS dashboard with lots of panels | Focused financial view with clear hierarchy |
| Deep navigation trees (3+ levels) | Flat: sidebar nav → page → in-page tabs |
| Disabled buttons for Viewer role | Hide the button entirely |
| Commas as thousands separator (`1,250`) | Space separator (`1 250`) |
| Hyphen for negative (`-450`) | Unicode minus (`−450`) |
| Confirmation modals for every delete | Immediate delete with undo toast (future) |
| External chart libraries for simple bars | CSS-only or SVG for bar/donut charts |
| Overriding master budget without visual indication | Always show amber Override badge |
| Hiding the running balance | Always visible — it's the core mental model |
| Complex filter UI hidden behind a button | Always-visible filter bar |
| Collapsing the sidebar on desktop | Sidebar is always 56px wide, never collapses |
| Showing registration or sign-up UI | This is a private app — no public access |
| `pointer-events: none` for role restrictions | Conditionally render, don't style-disable |

---

## Appendix: Mockup Files

All screens are mocked up as standalone HTML files. Open in browser to inspect.

| File | Screen | Key interactions shown |
|---|---|---|
| `mockups/login.html` | Login | 3 states: default, loading, error |
| `mockups/dashboard.html` | Dashboard/Overview | Hero stats, category bars, ring chart, pre-registered |
| `mockups/master-budget.html` | Master Budget editor | Inline editing, drag handles, add-item row |
| `mockups/monthly-budget.html` | Monthly Budget detail | Override badge, over-budget state, pre-registered section |
| `mockups/transaction-log.html` | Transaction Log | Filter bar, receipt indicator, tags, hover actions |

Open `mockups/*.html` in a browser and use the **☀ / 🌙 Toggle theme** button to see both dark (default) and light mode.
