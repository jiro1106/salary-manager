# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install
npm run dev       # Vite dev server, usually http://localhost:5173
npm run build     # tsc (typecheck, noEmit) && vite build -> dist/
npm run preview   # serve the production build
npx tsc --noEmit  # typecheck alone; there is no separate script for it
```

There is no test runner, linter, or formatter configured. `tsc` is the only automated check, and it is strict (`strict`, `noUnusedLocals`, `noUnusedParameters`) — an unused import or parameter fails `npm run build`.

This directory is not a git repository.

## Architecture

Single-page React 18 + Vite + TypeScript app. No router, no state library, no backend — everything runs in the browser and persists to localStorage.

**All state lives in `src/App.tsx`.** `salary`, `categories`, `history`, and `view` are `useState` there; every component below is presentational and controlled. Mutations flow up as callbacks that take a `Partial<T>` patch (`onChange({ percent: 50 })`), and `App` applies the patch immutably. Follow that pattern rather than pushing state down.

**Two views, one state variable.** `view: "home" | "templates"` in `App` swaps between the main screen and `TemplateGallery`. Adding a screen means extending that union, not adding a router.

**Persistence** (`src/lib/storage.ts`, keys `salary-manager:config` and `salary-manager:history`) has two deliberately different write paths:

- Config (salary + categories) is written by a debounced effect (400ms). A `skipSave` ref suppresses the first run so the mount-time load doesn't immediately write defaults back over stored data. Any new persisted config field must go through this effect.
- History is written eagerly at the mutation site — `savePaycheck` / `deleteEntry` call both `setHistory` and `storage.set`, because the debounced effect only watches config. History is capped at 50 entries.

`storage` swallows all errors and returns `null`, so a corrupt or disabled localStorage silently falls back to defaults.

**Percentages are relative to different bases at each level.** `Category.percent` is a percentage of `salary`. `SubCategory.percent` is a percentage of _its parent category's_ peso amount, not of salary. `SubCategoryRow` also exposes a peso input for sub-items that back-computes the percent (`value / catAmount * 100`), disabled when the category amount is 0.

Totals are intentionally **not** clamped to 100 at either level. Over-allocation is a valid state that the UI reports: `PaydayHeader` shows an over-by banner under the amount, `CategoryCard` shows "over by ₱X" / "₱X left to assign" in its foot, and `CutDial` clamps its wedges at 100% so the ring stays closed while the centre shows the true total in clay. Don't "fix" this by capping input.

**Templates** (`src/lib/templates.ts`) are id-less category definitions. `instantiateTemplate()` stamps fresh `uid()`s onto the categories and subs; `defaultCategories()` is just `instantiateTemplate(TEMPLATES[0])`. Applying a template **replaces** the user's categories wholesale — there is no merge and no undo.

**Icons.** `Category.icon` is a string-literal union in `src/types.ts` mapped to lucide components by `ICONS` in `src/lib/icons.ts`, read through `iconOf()`. Adding an icon requires editing both, or the lookup silently falls back to `Wallet`. **A category wears exactly one mark**, and this is it: the same glyph identifies it on its `CategoryCard` head and in its `Legend` pip. Don't introduce a second mark (an initial, a number) for the same object.

**The Inversion Rule.** A mark tile is always the opposite of the ground it sits on, and its icon is always the opposite of the tile. On a category head (coloured ground) that means a white tile with the icon in `text-cat-edge`; in a legend row (white ground) it means a tile filled with the face and the icon in `text-on-color`. The two look opposite and are the same rule. Making them literally identical breaks in both directions, and for the same reason each time: a white icon straight on a sand head measures 2.0:1, and a white pip would stop being a fill, which is the only thing that keys it to its wedge in the dial. Metrics carry the family instead — matched radius, matched 2px stroke, and an icon at roughly half the tile (34/18 on the card, 28/14 in the legend).

## Styling conventions

> **`DESIGN.md` describes the superseded "stacked cardstock" direction** (oat tabletop, die-cut edges, Epilogue + Hanken, per-card corner silhouettes). It is historical reference only. This section is now normative for anything visual.

The current direction is **flat white**: a near-white page, true-white surfaces, one hairline, two radii, and no shadow on any container.

**Tokens are declared once, as CSS custom properties on `:root` in `src/index.css`.** Colours, radii, shadows, easing, durations, and the layout measures all live there. `tailwind.config.js` maps each one onto a utility name, so components style with `bg-card`, `text-ink-soft`, `rounded-slab`, `border-line`, `text-title`, `ease-paper` and never touch a raw value. **A hardcoded hex in a `style` prop is forbidden**, including one that happens to match a token.

**Ground and ink.** `--page` (`#fafaf9`) is the body; `--card` (`#ffffff`) is every surface laid on it. The page is deliberately *not* `#fff`: a full screen at maximum luminance haloes dark text and is tiring to read, so the page sits a step below white with a trace of warmth (neutralise it and it reads blue-grey) and the cards are true white on top. That one step of value is also what separates a card from the page now that nothing casts a shadow, backed by a 1px `--line`. `--sunk` is the recessed ground for number fields and the unassigned dial wedge.

**Two radii, and only two.** `--r` (10px) is every surface — `rounded-slab` on cards, panels, dialogs, tiles. `--r-sm` (6px) is every control — `rounded-control` on buttons, chips, fields, tags, pips, icon targets. There is no third value and nothing gets a per-component radius. Circles use `rounded-full`, which is a shape, not a corner.

**No container carries a shadow.** Surfaces are told apart by fill and a hairline. The single exception is `Button`, which keeps a solid, unblurred edge under it (`--sh-action` and friends: `0 4px 0 <darker>`) so it still reads as pressable. The three states are tuned so the *bottom of the edge never moves*: rest `0 4px`, hover `-translate-y-0.5` + `0 6px`, press `translate-y-1` + `0 0`. Change one and change all three.

Inline `style` is correct in exactly four places, all of them genuinely dynamic:

- `--c` / `--ce` on a category card, set from `Category.color` via `edgeOf()`; `bg-cat` / `text-cat-edge` read them back. A legend row and a gallery breakdown row set `--c` only.
- `CutDial`'s per-wedge `conic-gradient`, computed from the data and eased frame-by-frame by `useEasedSlices` rather than snapped straight to the target.
- The payday input's `width`, which tracks the length of what is typed.
- The save-flourish dots in `PaydayHeader`: `--dx` / `--dy` (read by the `nala-burst` keyframe in `index.css`) and `animationDelay`, one fixed radial spread, not randomized per render.

**The palette is four inks — clay `#bc5b5b`, slate `#33566e`, moss `#7f9455`, sand `#e0b14d` — and they are declared twice**, once as data in `CATEGORY_COLORS` (`src/lib/palette.ts`, stamped onto categories) and once as chrome tokens on `:root` (`src/index.css`, for everything that has to sit next to a category). The two lists must stay identical; changing one alone is drift. Each face ships an edge that is the face darkened 22%, except sand, which is light enough that 22% still misses 4.5:1 on white and goes to 40%.

`--blue` (`#2563eb`, edge `#1d4db7`) is deliberately **not** in that set. It is the focus ring and the saved state, and it is kept off the palette so a ring can never be drawn on a ground of its own colour. It is brighter and far more saturated than `--slate`, which is what keeps it legible as a ring on a slate category head despite the shared hue family.

`CATEGORY_COLORS` is what `App.addCategory` cycles through (re-exported from `defaultCategories.ts`) and `edgeOf()` returns a face's darker shade. **A category face is a fill and nothing else** — clay on white measures 3.6:1, so anything set as text or as a small icon uses `text-clay-edge` / `text-cat-edge`, never the face. `Category.color` in `templates.ts` is the one place a hex literal belongs, because it is data.

Sand is the exception worth knowing: at 2.0:1 against `--on-color` it does not carry white text, so a sand category head — and a sand legend pip, whose icon is also white — is the weakest thing on the page. A per-face ink was built for this (`onColorOf()`, ink on the light faces and white on the dark ones) and then removed: two of the four pips came out near-black, which read as a different component rather than the same one in another colour. Every mark on a face is now `--on-color`, and the sand icon is faint by choice. If that stops being acceptable, the fix is a per-face ink again, or a darker sand — but it is one decision for all four faces, not a patch on one.

**Plus Jakarta Sans**, loaded in `index.html` as a variable face (200–800), sets everything. It is the whole type system — there is no second family, and adding one is a change to this section, not a component decision. `font-display` survives as a marker on money and display figures but resolves to the same family — display is carried by weight (`font-extrabold`, which is 800, the top of the range) and size.

**Any replacement face must actually contain `₱` (U+20B1)**, because `peso()` output is on almost every screen and a fallback face for one glyph is exactly what this section exists to prevent. Google Fonts' `unicode-range` cannot be trusted for this: it advertises `U+20AD-20C0` on the `latin-ext` subset of nearly every family, and Figtree, Outfit, Poppins, DM Sans, Urbanist and Rubik all declare that range and ship no peso glyph in it — the browser silently falls back and the `₱` renders in a different face. Check the glyph table, not the CSS:

```bash
# every subset url, since the glyph can live in any of them
python3 -m pip install fonttools brotli
curl -s -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120" \
  "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@200..800" \
  | grep -o "https://fonts.gstatic.com[^)]*\.woff2" | while read u; do
    curl -s -o /tmp/f.woff2 "$u"
    python3 -c "from fontTools.ttLib import TTFont; print(0x20B1 in TTFont('/tmp/f.woff2').getBestCmap())"
  done
```

Verified to carry it: Plus Jakarta Sans, Nunito (the previous face), Quicksand, Lexend, Mulish, Work Sans.

There is no `SharedStyles.tsx` and no app-wide utility-class file. App-wide CSS — the global focus ring, tabular numerals, the reduced-motion reset — lives in the `@layer base` block of `src/index.css`.

Shared visual primitives live in `src/components/`: `Button` (primary / saved / alt / inert), `IconButton` (a real 44×44 target pulled back with negative margins), `NumberField` (padded chip with its unit **inside**, on `card` or `sunk` grounds), and `EditableName` (click-to-edit, used at both the category and sub-item level).

Currency is formatted by `peso()` (two decimals) and `pesoRound()` (whole pesos, for figures read at a glance) in `src/lib/format.ts`, with `pct()` for percentages. Use them rather than inlining `toLocaleString`.

## Gotchas

- `PaydayHeader` implements its own thousands-separator formatting with manual cursor restoration (`sanitizeRaw` → `formatWithCommas` → `useLayoutEffect` + `setSelectionRange`). It keeps a local raw string because in-progress input like `"120."` or `"120.50"` can't round-trip through a `number`. Editing this is easy to break — verify caret behavior when typing and deleting mid-string.
- **Which template you are on is derived, never stored.** `matchTemplate(categories)` in `templates.ts` compares names and percentages against `TEMPLATES`; it returns `null` the moment a figure is edited, and the masthead chip falls back to "Custom" with the live split from `splitOf()`. Don't add a `templateId` to `Config` to "fix" this — the derivation is what keeps the chip honest. `Template` carries no `split` string either, for the same reason: it duplicated the percentages next to them and would have gone stale the first time one was edited. Everything that shows a split derives it.
- The dial wedges carry **no** label. Marking them was tried and reverted: at 190px the letters crowded the ring, and anything keyed on the name has to be threaded through `depKey` or the tween holds a stale value, since that effect is otherwise keyed on geometry alone. Identity on the dial is colour, and the `Legend` pip beside it is the key.
- `CutDial` wedges are connected — each one's `conic-gradient` runs exactly from the previous wedge's end angle to its own, no radial offset and no angular gap. Don't reintroduce a per-wedge pull or inset; the ring reading as one continuous circle depends on the sweeps tiling exactly.
- In `Masthead`, the mark and the wordmark are wrapped in one group, and **only the group carries the `sits` offset**. The wordmark's `mb-[46px]` lift is constant on every screen. Splitting that offset across the two children (the mark at `-mb-[28px]`, the wordmark at `mb-[18px]`) is what used to drop the wordmark 46px on the templates screen and below 700px, because `items-end` then had nothing holding the two together.
- A `SubCategoryRow` is a **wrapping** flex row, not a fixed one. The percent field, the peso field and the delete are grouped in one block so they wrap together; the name holds a `min-w-[15ch]` floor (`NAME_FLOOR`) that is what pushes them onto a second line. Below roughly a 380px card a single line can only offer the name about 11 characters, which truncates every template name it ships with. Don't "simplify" the group back into flat siblings — they would wrap one at a time and strand the delete under the figures. The group carries **no** `ml-auto`: on one line the name's `flex-1` already pushes it right, so `ml-auto` would only hard-right the wrapped line, where an empty left half makes the block read as jammed into the corner. Left-aligned under the name it still forms a column, because every row wraps at the same width.
- `CategoryCard` gives its coloured head its own `rounded-t-slab` rather than clipping it with `overflow-hidden` on the card. The card holds a full-width disclosure button, and `overflow-hidden` would cut off its focus ring (the global ring uses `outline-offset: 3px`, drawn outside the box).
- `edgeOf()` returns exact spec shades for the four palette inks and falls back to darkening by 18% for anything else, which is what keeps categories still carrying pre-refactor colours in localStorage legible as text. This matters more than it looks: a saved config keeps whatever hex it was written with, so anyone who used the app before a palette change still has the old inks on screen until they apply a template.
- `uid()` is `Math.random().toString(36)` — fine for local list keys, not a real unique id.
