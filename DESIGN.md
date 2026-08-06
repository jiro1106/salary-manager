---
name: Nala
description: A salary manager you cut apart by hand, laid out on a tabletop.
colors:
  oat: "#E1D8C6"
  oat-deep: "#CFC4AE"
  card: "#FAF6EC"
  card-edge: "#E4DCCA"
  card-edge-deep: "#CFC5B0"
  ink: "#2A2622"
  ink-soft: "#736A5C"
  paper-white: "#FBF7EE"
  clay: "#BE6A52"
  clay-edge: "#96503C"
  teal: "#3F7A72"
  teal-edge: "#2E5B55"
  plum: "#7B5A80"
  plum-edge: "#5D4262"
  sand: "#D6A45C"
  sand-edge: "#AE8144"
typography:
  display:
    fontFamily: "Epilogue, sans-serif"
    fontSize: "clamp(1.875rem, 4.4vw, 2.5rem)"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.05em"
  headline:
    fontFamily: "Epilogue, sans-serif"
    fontSize: "2rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.04em"
  title:
    fontFamily: "Epilogue, sans-serif"
    fontSize: "1.1875rem"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.03em"
  amount:
    fontFamily: "Epilogue, sans-serif"
    fontSize: "1.4375rem"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.03em"
  body:
    fontFamily: "Hanken Grotesk, Epilogue, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  ui:
    fontFamily: "Hanken Grotesk, Epilogue, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "normal"
  meta:
    fontFamily: "Hanken Grotesk, Epilogue, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Hanken Grotesk, Epilogue, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.18em"
rounded:
  slab-a: "30px 10px 26px 12px"
  slab-b: "12px 28px 10px 26px"
  slab-c: "24px 24px 8px 26px"
  action: "24px 8px 22px 8px"
  action-alt: "8px 24px 8px 22px"
  chip: "18px 6px 18px 6px"
  glyph: "12px 4px 12px 4px"
  field: "11px 4px 11px 4px"
  tag: "9px 3px 9px 3px"
  pebble: "52% 48% 46% 54% / 48% 52% 48% 52%"
spacing:
  page-x: "24px"
  stack: "26px"
  gutter: "22px"
  split: "34px"
  card-x: "28px"
  card-y: "26px"
  head-x: "22px"
  head-y: "20px"
components:
  button-primary:
    backgroundColor: "{colors.clay}"
    textColor: "{colors.paper-white}"
    typography: "{typography.ui}"
    rounded: "{rounded.action}"
    padding: "15px 26px"
  button-primary-saved:
    backgroundColor: "{colors.teal}"
    textColor: "{colors.paper-white}"
    rounded: "{rounded.action}"
    padding: "15px 26px"
  button-alt:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    typography: "{typography.ui}"
    rounded: "{rounded.action-alt}"
    padding: "15px 26px"
  button-disabled:
    backgroundColor: "transparent"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.action}"
    padding: "11px 20px"
  card-slab:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.slab-a}"
    padding: "26px 28px"
  category-head:
    textColor: "{colors.paper-white}"
    typography: "{typography.title}"
    padding: "20px 22px 18px"
  category-foot:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink-soft}"
    typography: "{typography.meta}"
    padding: "13px 22px"
  field-number:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    typography: "{typography.ui}"
    rounded: "{rounded.field}"
    padding: "5px 13px"
  chip-template:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    typography: "{typography.meta}"
    rounded: "{rounded.chip}"
    padding: "9px 15px"
  tag-biggest:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper-white}"
    typography: "{typography.label}"
    rounded: "{rounded.tag}"
    padding: "3px 8px"
  banner-over:
    backgroundColor: "#BE6A521C"
    textColor: "{colors.clay-edge}"
    typography: "{typography.meta}"
    rounded: "{rounded.tag}"
    padding: "9px 14px"
  dialog:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.slab-c}"
    padding: "24px 26px"
    width: "min(100%, 380px)"
---

> **Superseded — historical reference only.**
>
> This document specifies the "stacked cardstock" direction: an oat tabletop, die-cut
> edge shadows, Epilogue + Hanken Grotesk, and a per-card corner silhouette. `src/` no
> longer implements any of it. The app is now **flat white** — a near-white page, true-
> white surfaces, one hairline, two radii (10px surfaces / 6px controls), Plus Jakarta
> Sans throughout, and no shadow on any container.
>
> The live system is the `:root` block of `src/index.css` and the "Styling conventions"
> section of `CLAUDE.md`. Read those, not this. What still holds here: the category ink
> hexes, the layout brief, the copy, and the component behaviour specs.


# Design System: Nala

## 1. Overview

**Creative North Star: "Stacked Cardstock"**

Every surface in Nala is a slab of coloured card lying on an oat tabletop under raking light from the upper left. Nothing floats, nothing hovers in abstract space: each element has a visible cut edge along its bottom, then a soft contact shadow where it meets the table. The interface is a thing you could have made with a scalpel and a glue stick, photographed from directly above.

This is a personal money tool, not corporate finance software. The brief was always "fun, intuitive, a site you visit for the UI experience", which is why the payday split is rendered as a paper circle cut into wedges and pulled apart rather than a charting-library donut, and why a cartoon cat sits on the edge of the main card. The playfulness lives in the material and the mascot, never in bounce easing, gradients, or novelty type. The numbers themselves are set dead straight in a tabular face, because they are the reason anyone opened the page.

It explicitly rejects the fintech default: no purple gradients, no glossy 3D SaaS blobs, no untextured stock photography, no rounded-everything friendliness, no icon-grid feature rows, no Inter-or-system-font-only typography, no evenly-distributed rainbow palettes. If a screen could be reskinned into any other budgeting app by swapping the logo, it has failed.

**Key Characteristics:**
- Hand-cut asymmetric corner radii; no two corners of a card match
- Three-layer depth: cut edge, second cut edge, contact shadow
- Oat ground with a fine grain overlay and a single raking light source
- Category colour at full strength, never as a wash
- One cartoon cat, used exactly once per screen
- Money always tabular, always in Epilogue

**The Single Source Rule.** Every colour, size, radius, and duration in this document is a CSS custom property declared once in `src/index.css` on `:root`. Components read `var(--clay)`. Hardcoded hex in a `style` prop is forbidden, including for values that happen to match. This replaces the previous convention, and `CLAUDE.md` must be updated to say so.

**The Overflow Is Valid Rule.** Totals are never clamped to 100 at either level. Over-allocating is a legitimate state a person can be in, and the interface reports it plainly instead of preventing it. Any input that caps, rounds, or silently corrects a percentage is a bug.

## 2. Colors

A tabletop palette: warm paper neutrals carrying three saturated category inks and one gold accent. Every colour ships as a pair, the face and its cut edge, because a slab of card is never one flat tone.

### Primary

- **Clay** (`#BE6A52`) with **Clay Edge** (`#96503C`): the committing action. Save this payday, delete confirmations, the "add an item" link, the warning state on an over-allocated category, and the cat's own fur. Clay is the only colour that appears on a button.

### Secondary

- **Teal** (`#3F7A72`) with **Teal Edge** (`#2E5B55`): the first category ink, the saved-successfully state, and every focus ring on the page.
- **Plum** (`#7B5A80`) with **Plum Edge** (`#5D4262`): the third category ink.
- **Sand** (`#D6A45C`) with **Sand Edge** (`#AE8144`): the payday amount's underline, marking the one field on the page that carries the number everything else derives from. Used almost nowhere else, deliberately.

### Neutral

- **Oat** (`#E1D8C6`) with **Oat Deep** (`#CFC4AE`): the tabletop. Set on `<body>`, never on a card. Oat Deep is the inset shadow inside pressed fields and the "unassigned" wedge of the dial.
- **Card** (`#FAF6EC`): every slab surface.
- **Card Edge** (`#E4DCCA`) and **Card Edge Deep** (`#CFC5B0`): the two cut layers under a slab. Always in that order, never one alone.
- **Ink** (`#2A2622`): all body and figure text on card. A warm near-black; pure `#000` is forbidden.
- **Ink Soft** (`#736A5C`): labels, meta text, secondary figures, resting icon colour.
- **Paper White** (`#FBF7EE`): text and icons that sit **on** a category colour. Never `#fff`.

### Named Rules

**The Pair Rule.** A colour is never used without its edge. If you place a clay surface, its bottom edge is clay-edge. Introducing a new category colour means introducing both values, roughly 18% darker at the same hue.

**The Clay Contrast Rule.** Paper White on Clay measures **3.65:1**. That passes for large text (the 19px/800 category name, the 23px/800 amount) and for icons under the 3:1 non-text rule, and **fails for anything else**. Teal measures 4.63:1 and Plum 5.40:1, both of which pass outright. Therefore: no normal-weight text below 18.66px may sit directly on a category colour. The percent sign that used to float beside the input moves *inside* the field chip, where it sits on card. Icons on a category head are full-opacity Paper White; the 80%-opacity version measures 2.9:1 and is prohibited.

**The Data Owns The Colour Rule.** Category colour comes from `Category.color` in the data, applied as `--c` and `--ce` custom properties on the card element. Components never hardcode teal, clay, or plum by name. The seed values in `src/lib/defaultCategories.ts` and `src/lib/templates.ts` must be replaced with this palette, or cards will render in the old scheme.

## 3. Typography

**Display Font:** Epilogue (500 / 700 / 800)
**Body Font:** Hanken Grotesk (400 / 500 / 700)

**Character:** Epilogue is tight, geometric, and slightly condensed at heavy weights, which lets a peso figure hold a card without shouting. Hanken Grotesk is humanist and quiet underneath it, doing the reading work. The pairing is deliberately unfashionable in fintech, where the reflex is a single geometric sans at three weights.

### Hierarchy

- **Display** (800, `clamp(1.875rem, 4.4vw, 2.5rem)`, 1.0, -0.05em): the payday amount, once per screen. It sits on a 3px Sand underline because it is an input.
- **Headline** (800, 2rem / 32px, 1.0, -0.04em): the total inside the dial. Also 1.8125rem / 29px for the templates page heading.
- **Title** (800, 1.1875rem / 19px, -0.03em): category card names, legend figures.
- **Amount** (800, 1.4375rem / 23px, -0.03em): the peso figure on a category card.
- **Body** (400, 1rem / 16px, 1.6): prose. Capped at 65ch; the only place it appears at length is the templates page introduction.
- **UI** (400, 0.9375rem / 15px): inputs, sub-item rows.
- **Meta** (400, 0.8125rem / 13px): card footers, dates, descriptions, the template chip.
- **Label** (400, 0.6875rem / 11px, 0.18em tracking, uppercase): eyebrows and micro-labels only.

### Named Rules

**The Peso Rule.** Hanken Grotesk has no `₱` glyph and renders it as a bare `P`. Every string containing a currency figure is set in Epilogue, and Epilogue is listed as the second family in the body stack so any stray peso sign falls back correctly. Never mix the two faces inside one sentence: an Epilogue figure inside a Hanken sentence opens visible gaps around it. Set the whole string in Epilogue and carry emphasis with weight.

**The Tabular Rule.** `font-variant-numeric: tabular-nums` is set globally on `<body>`. Money columns must line up down the page; proportional figures in a list of amounts are a defect.

**The Tracked Caps Rule.** Uppercase micro-labels always carry 0.18em tracking. When such a label is optically centred, it also carries `text-indent` of the same value, to cancel the trailing letter-space that would otherwise push it left.

## 4. Elevation

Nala does not use ambient shadow to suggest floating. It uses **stacked opaque edges** to suggest thickness, then one soft shadow for contact with the table. Read a slab bottom-to-top: 3px of first cut edge, 3px more of second cut edge, then a diffuse contact shadow. The light source is fixed at the upper left, so every edge falls straight down; no element casts sideways.

If it looks like a Material card, the shadow is too blurry and the edges are missing.

### Shadow Vocabulary

- **Slab** (`0 3px 0 var(--card-edge), 0 6px 0 var(--card-edge-deep), 0 9px 12px rgba(42,38,34,.2)`): every card, panel, and dialog.
- **Action** (`0 3px 0 var(--clay-edge), 0 6px 9px rgba(42,38,34,.22)`): buttons. The alt variant swaps in `card-edge-deep`.
- **Action, lifted** (`0 3px 0 var(--clay-edge), 0 10px 14px rgba(42,38,34,.24)` with `translateY(-2px)`): hover. The card leaves the table; the cut edge does not change.
- **Action, pressed** (`0 0 0 var(--clay-edge), 0 3px 6px rgba(42,38,34,.2)` with `translateY(3px)`): active. The edge collapses to zero, so the slab reads as pushed flat against the table.
- **Small chip** (`0 3px 0 <edge colour>`): icon chips, legend pips, glyph tiles. One edge layer only.
- **Cut wedge** (`drop-shadow(0 3px 0 var(--e)) drop-shadow(0 8px 10px rgba(42,38,34,.24))`): dial segments. `drop-shadow` follows the alpha of the shape, so the straight cuts get thickness too, which `box-shadow` cannot do.
- **Inset fold** (`inset 0 -4px 0 var(--ce)`): the bottom of a category head, where the coloured sheet folds over the card beneath.
- **Pressed field** (`inset 0 2px 0 var(--oat-deep)` on oat, `inset 0 0 0 2px var(--card-edge-deep)` on card): inputs read as recessed, the inverse of a slab.

### Named Rules

**The Down-Only Rule.** Edges and shadows offset on Y only. A horizontal offset breaks the single overhead light and instantly reads as generic CSS.

**The Two-Edge Rule.** Large surfaces get two cut layers, small ones get a single 3px edge. A 34px icon chip with a triple stack looks like a mistake; a full card with a single edge looks thin.

## 5. Components

Layout frame: content is capped at **800px** with 24px side padding. Blocks stack at 26px. The category grid is `repeat(auto-fit, minmax(300px, 1fr))` at a 22px gutter, which yields two columns at full width and one below roughly 700px. The body carries a fine grain overlay (SVG `feTurbulence`, 0.4 opacity, multiply blend) and a raking-light radial gradient from 22% -10%; both are `position: fixed` and non-interactive.

### Buttons

- **Shape:** hand-cut asymmetry (`24px 8px 22px 8px`); the alt variant mirrors it (`8px 24px 8px 22px`) so a pair of buttons never reads as a matched set.
- **Primary:** Clay ground, Paper White label, Epilogue 700 at 15px, 15px/26px padding, Action shadow. There is one primary action per screen.
- **Alt:** Card ground, Ink label, same metrics, `card-edge-deep` cut edge.
- **Small:** 11px/20px padding at 13px, for in-card actions.
- **Hover / Active:** Action-lifted and Action-pressed from Elevation, 160ms on the project easing. Never animate colour on a button; animate its position off the table.
- **Disabled:** transparent ground, Ink Soft label, `inset 0 0 0 2px var(--card-edge-deep)`, no transform. Used for the template you are already on.
- **Saved state:** on a successful save the primary button holds Teal with a check icon and the word `Saved` for **1600ms**, then returns. The label change is the confirmation; there is no toast.

### Cards / Containers

- **Corner Style:** three variants, `slab-a` / `slab-b` / `slab-c`, assigned by list index (`["a","b","c"][i % 3]`) so a grid of cards never repeats a silhouette.
- **Background:** Card. **Shadow:** Slab. **Border:** none, ever; the cut edge is the border.
- **Padding:** 26px vertical, 28px horizontal on full cards.

**The No-Border Rule.** Cards have no `border`. Depth comes from the edge stack. A 1px outline around a slab flattens it back into a web component.

### Category Card

The signature component, and the only place a full-strength colour surface appears.

- **Head:** a sheet of the category's own colour (`--c`) filling the top of the card, 20px/22px padding, with `inset 0 -4px 0 var(--ce)` as the fold along its bottom. Top corners inherit the card's radius variant; the block below is Card, so no bottom corners are needed. Contents are Paper White at full opacity.
- **Glyph tile:** 34px, Card ground, `glyph` radius, `0 3px 0 rgba(42,38,34,.22)`, icon in `--ce`. It reads as punched out of the coloured sheet.
- **Icons:** `lucide-react`, one per member of the `Category.icon` union: `PiggyBank`, `Wallet`, `ShoppingBag`, `GraduationCap`, `Landmark`, `CreditCard`, `TrendingUp`. All seven need a designed entry, or unmapped categories silently fall back to `Wallet`.
- **Figure row:** the percent field, then the peso amount pushed right in Epilogue 800 at 23px, Paper White. The `%` sits **inside** the field chip, not loose beside it (see The Clay Contrast Rule).
- **Foot:** a full-width disclosure button on Card, 13px/22px, Meta type set entirely in Epilogue, `border-top: 2px solid rgba(42,38,34,.09)`, chevron pushed right and rotated 180° when open. It carries the assignment state: `4 items · all assigned`, `3 items · ₱900.00 left to assign`, or, in Clay, `2 items · over by ₱600.00`.
- **Body:** sub-item rows behind the disclosure, then `Add an item` in Clay.
- **Prohibited:** the coloured triangle "tent" behind the card top. It was removed from the design; the tinted-wash head (`${color}14`) it accompanied is also gone.

### Inputs / Fields

- **Number field:** Card ground, `field` radius, `inset 0 0 0 2px var(--card-edge-deep)`, Ink text, 5px/13px. On an oat ground the inset becomes `inset 0 2px 0 var(--oat-deep)`.
- **Payday amount:** unstyled text input on the card, Display type, sitting on a 3px Sand bottom border. It keeps a local raw string so in-progress input like `120.` survives, formats with thousands separators, and restores the caret after reformatting. This is delicate; verify caret behaviour when typing and deleting mid-string.
- **Sub-item row:** name, percent field, **and a peso field** that back-computes the percent from the amount. The peso field is **disabled when the category amount is 0**: Oat ground, Ink Soft text, no inset, `cursor: not-allowed`.
- **Focus:** `outline: 3px solid var(--teal); outline-offset: 3px` on every interactive element. Teal is chosen because it clears both Card and all three category grounds.
- **Editing names:** names read as static text with a small pencil affordance and become a field on click, committing on blur or `Enter`. This applies at **both** levels; a sub-item name that is a permanently open input makes the card read as a form at rest.

**The 44px Rule.** Every interactive target is at least 44×44, including icon-only pencils and trash buttons. Achieve it with `min-width` / `min-height` and optical centring, then pull the visual spacing back with negative margins. A 16px icon with 5px of padding is a 26px target and fails.

### The Cut Dial (signature)

A paper circle cut into wedges and pulled apart, one wedge per category.

- Each wedge is a full-size absolutely-positioned layer carrying a `conic-gradient` that is opaque across its own arc and transparent elsewhere, with the Cut Wedge drop-shadow so the straight cuts gain thickness.
- **Every wedge travels exactly 6px along its own bisector.** For a wedge spanning `start` to `end` degrees clockwise from twelve, the bisector is `θ = (start + end) / 2` and the offset is `translate(6px·sin θ, -6px·cos θ)`. Equal distance is what keeps the cuts even; unequal pulls read as a broken circle rather than a cut one.
- **Under-allocated:** a final wedge in Oat Deep fills the remainder. The centre shows the true total.
- **Over-allocated:** wedges clamp at 100% so the ring stays closed, the centre figure switches to Clay, and the label under it reads `over by N%`.
- **Centre:** a smaller disc laid over the middle, not a hole. Card ground, `pebble` radius (an irregular blob, not a circle), Slab-style shadow. It holds the total in Headline type over an 11px tracked `assigned`.
- The dial column is 190px against the legend; below 700px it centres above the legend at the same size.

### Legend

One row per category: a 26px pip in the category colour with its edge shadow, the name in Body 700, an optional `BIGGEST` tag, then percent and peso amount right-aligned in fixed columns. Rows are separated by `2px solid rgba(42,38,34,.1)`. A footer line carries `N categories` and the unassigned figure.

### Chips and Tags

- **Template chip:** the current template and its split, riding at the right of the masthead as a small slab with `chip` radius and a single `card-edge-deep` edge. It is the link into the gallery; label and destination are one object. Hover lifts 2px and nudges the chevron 3px right.
- **Biggest tag:** Ink ground, Paper White, Label type, `tag` radius. Marks the largest category in the legend.
- **Over-allocation banner:** Clay text on a `#BE6A521C` tint, `tag` radius, sitting under the payday amount when the total exceeds 100. Copy names the consequence once: `Over by 8% · ₱2,400 more than this payday`. Never `102% allocated — over by 2%`, which says the same number twice and uses an em dash.

### Dialog

Used for three irreversible actions: deleting a category, deleting a sub-item, and replacing the whole split from a template. A dialog is correct here precisely because the action cannot be undone; it is not a substitute for inline design elsewhere.

- A slab (`slab-c` radius, 24px/26px padding, max 380px) lifted on a `rgba(42,38,34,.45)` scrim.
- Title in Title type, consequence in Meta, then `Cancel` (alt button) and the destructive action (primary, Clay) right-aligned.
- Focus moves to **Cancel** on open, is trapped inside the dialog, `Esc` cancels, and returns to the trigger on close.
- Copy names what is lost: `Delete "Wants" and its 3 items?`, `Replace your split with "Student"?`.

### Empty States

- **No categories:** the dial and legend do not render, so the deck collapses to the amount row alone. The category grid shows a single full-width invitation ending in the same `Add category` action rather than a bare dashed tile.
- **No history:** inside the open disclosure, `No paydays saved yet.` in Meta on Ink Soft. No illustration.
- **No sub-items:** the card foot reads `0 items` and the opened body offers only `Add an item`.
- **Add category tile:** a dashed 3px `rgba(42,38,34,.2)` outline at `slab-a` radius, stretched to the row height. It is a card not yet cut, so it has no fill and no shadow. Hover lifts it 3px and turns the outline and label Clay.

### Masthead

The logo (`src/assets/logo.png`, a cartoon cat in a clay basket) is the brand mark **and** the character; exactly one instance per screen. On the home screen it sits on the deck card's top edge: the header aligns to `flex-end`, drops its bottom padding, and the mark is pulled down 28px so the basket floor lands about 12px inside the card.

The PNG carries its own transparent margin (20% each side, 12.8% top, 14.2% bottom), so the box is sized off the drawing and the padding is cancelled with negative margins. Use `object-fit: contain`. **`object-fit: cover` with a circular crop cuts the ears and the basket off** and is prohibited. The artwork brings its own outline and shading, so it gets a soft contact shadow only, never the die-cut hard edge used on paper elements. Hover rotates it 4° from an origin near her feet. Below 700px the overlap disengages and she stands clear of the card.

### Motion

All transitions run 160–260ms on `cubic-bezier(.22, 1, .36, 1)`. Buttons move on the Y axis, chevrons rotate, the cat rotates, disclosures expand. Nothing bounces, nothing scales, nothing animates a layout property. `prefers-reduced-motion: reduce` disables every transition and animation globally.

## 6. Do's and Don'ts

### Do:

- **Do** declare every token once as a CSS custom property on `:root` in `src/index.css` and read it with `var()`. The Single Source Rule.
- **Do** pair every colour with its edge, and offset edges on Y only.
- **Do** set any string containing `₱` in Epilogue, and set the whole string, not just the figure.
- **Do** let totals exceed 100% and report it. Over-allocation is a valid state at both the payday and the category level.
- **Do** pull every dial wedge exactly 6px along its own bisector, using the formula in Components.
- **Do** give every interactive target at least 44×44, and every one of them a visible Teal focus ring.
- **Do** put the `%` sign inside the field chip when the field sits on a category colour.
- **Do** assign card corner variants by list index so silhouettes never repeat in a row.
- **Do** use all seven `lucide-react` icons named in the `Category.icon` union.
- **Do** name consequences in copy: `Replace my split`, not `Use this template`.

### Don't:

- **Don't** hardcode a hex in a `style` prop, even one that matches a token. This was the old convention and it is now the drift.
- **Don't** put `#000` or `#fff` anywhere. Ink and Paper White exist for this.
- **Don't** put normal-weight text under 18.66px on Clay, or use 80%-opacity white icons on any category colour. The Clay Contrast Rule.
- **Don't** put a `border` on a card, or a horizontal offset on any shadow.
- **Don't** restore the coloured triangle above a category card, or the `${color}14` tinted-wash head. Both were removed on purpose.
- **Don't** crop the logo to a circle with `object-fit: cover`, and don't render it twice on one screen.
- **Don't** use an em dash anywhere in the interface, including in the over-allocation string.
- **Don't** reach for purple gradients, glossy 3D blobs, untextured stock photography, rounded-everything friendliness, icon-grid feature rows, Inter or system-font-only typography, or evenly-distributed rainbow palettes. These were rejected by name at the outset.
- **Don't** add bounce or elastic easing, or animate a layout property.
- **Don't** reach for a modal for anything except the three irreversible actions listed in Components.
