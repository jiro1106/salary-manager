---
target: PaydayHeader mobile view
total_score: 30
p0_count: 0
p1_count: 2
timestamp: 2026-08-10T12-47-26Z
slug: src-components-paydayheader-tsx
---
# Critique: src/components/PaydayHeader.tsx (mobile, 390px)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 4 | Dial + "100% ASSIGNED" + "₱0 unassigned" + Saved flash. Solid. |
| 2 | Match System / Real World | 4 | "Take-home pay", "Save payday", peso figures. n/a |
| 3 | User Control and Freedom | 3 | Template apply replaces the split with no undo. History caps at 50 silently. |
| 4 | Consistency and Standards | 2 | Clay-red primary button carries the destructive convention. Crown pill had no label. |
| 5 | Error Prevention | 4 | Over-allocation reported, not clamped. Digit ceiling. Confirm dialogs on irreversible actions. |
| 6 | Recognition Rather Than Recall | 2 | Bare crown chip unrecoverable on mobile. Dial wedges unlabeled and hover-only. |
| 7 | Flexibility and Efficiency | 3 | No keyboard path, no quick presets outside templates. |
| 8 | Aesthetic and Minimalist Design | 3 | The same three numbers stated four ways: wedge, percent, peso, footer. |
| 9 | Error Recovery | 2 | Confirm-only. No undo anywhere. |
| 10 | Help and Documentation | 3 | None on home. The templates screen carries the teaching. |
| **Total** | | **30/40** | Good, not yet excellent |

## Anti-Patterns Verdict

**Not AI slop.** Clean against every shared ban: no gradient text, no side-stripe borders, no glassmorphism, no identical card grid, no modal-first thinking. The palette is four committed earth inks, not an even rainbow. Product-register test (would a Linear/Stripe-fluent user trust it) passes.

One near-miss: donut plus big centered percent sits one step from the hero-metric template. It earns the pass because the ring is real data with a keyed legend, not decoration.

**Deterministic scan**: `npx impeccable detect --json src/components` returned `[]`. Zero findings across all 14 components. No false positives to flag.

## Overall Impression

The visual system is disciplined past what most product UI attempts: flat white, one hairline, two radii, no container shadow, four named inks. It holds together. The failures are all at the mobile width, where fixed-width row furniture outruns the card and where pointer-only affordances go dead.

## What's Working

- **Flat white with one hairline and two radii.** Card and page separated by one step of value plus 1px, zero elevation. Rare discipline.
- **Over-allocation as a valid reported state.** Reporting rather than clamping is correct and uncommon in budget tools.
- **Tabular figures right-aligned on min-width floors.** The peso column reads as a column, and a rare seven-figure row pushes instead of clipping.

## Priority Issues

- **[P1] The biggest category is the one row that cannot show its name.** "Ne…" truncated while "Wants" and "Savings" rendered in full. Cause: the crown tag existed on that row only, so only that row lost roughly 35px of name column. The row that matters most read worst. **Fix**: move the crown onto the legend pip as a corner badge. Costs the row nothing at any width. **Suggested command**: /impeccable layout
- **[P1] The crown chip carried no meaning on mobile.** Gold crown on ink with no word: the reader saw one dark chip and could not recover why. The previous narrow-screen fix traded overflow for opacity. Same fix resolves both. **Suggested command**: /impeccable clarify
- **[P2] Clay-red full-width Save button reads as destructive.** At 390px it is a large red bar directly under the amount. Red-primary is a genuine convention conflict. DESIGN.md commits clay as the action ink deliberately, so this is a choice to confirm rather than a defect. Confirmed as intended by the author. **Suggested command**: /impeccable colorize
- **[P2] Dial highlight was hover-only, dead on touch.** `wedgeAt()` ran on pointermove; a finger produces no move before it lands, so the dial's only interactive affordance was invisible on the majority device. **Fix**: bind pointerdown and pointercancel alongside pointermove. **Suggested command**: /impeccable adapt
- **[P3] "100% ASSIGNED" and "₱0 unassigned" restate the same fact 500px apart.** Different units, so defensible, but the footer line earns less than its space when the split is exactly 100. **Suggested command**: /impeccable distill

## Persona Red Flags

**Jordan (First-Timer, mobile)**: opens the app to a dark chip with a crown beside a truncated word. No tooltip on touch. Taps the dial, nothing happens, concludes the dial is a picture.

**Alex (Power User, weekly return)**: wants to type a payday and save in two actions, and gets it. But there is no keyboard commit on the amount field, no undo after replacing a split, and history caps at 50 with no warning at the boundary.

## Minor Observations

- The sand underline under the amount field reads slightly like a warning state; it is meant as "this is the source number".
- The deck card alone fills a 390px viewport. PRODUCT.md's "whole feature set visible at once, no scroll" holds on desktop only.
- `--r: 12px` / `--r-sm: 8px` in `src/index.css`, but CLAUDE.md documents 10px / 6px. Docs have drifted from the tokens.

## Questions to Consider

- What if the crown were on the pip instead of beside the name? One mark, zero width cost, works at every size.
- Does the dial need to be 190px on a phone when the legend already prints every figure it encodes?
