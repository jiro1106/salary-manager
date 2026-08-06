# CutDial: connected wedges

## Problem

`CutDial` (`src/components/CutDial.tsx`) currently renders each category's wedge
pulled 4px outward along its own bisector (`PULL`), with a 3° angular gap
carved from each wedge's edges (`GAP_DEG`). This "cut apart" look is being
replaced with a normal connected ring: wedges flush against each other,
no gaps, no radial offset.

## Approach

- Remove the `PULL` constant and its `transform: translate(...)` in
  `sliceStyle`.
- Remove `GAP_DEG` and the half-gap inset math in `sliceStyle`; each wedge's
  `conic-gradient` runs the full `rawStart`→`rawEnd` sweep.
- Boundary style: hard edge — colors sit flush with no separator line.
- Everything else is unchanged: the white centre disc (`inset-[23%]`) still
  makes this a donut rather than a filled pie, and `useEasedSlices` still
  eases wedge breakpoints on percent changes.

## Out of scope

- No change to the centre figure, aria-label, or the easing/animation logic.
- No change to how slices are built (`buildSlices`) or ordered.
