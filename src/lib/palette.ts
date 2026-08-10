/**
 * The Nala category inks. Five light faces, each shipping a deeper shade
 * of itself for the text and glyphs that have to sit on white.
 *
 * These faces are light, which inverts the rule the palette used to run
 * on. Every mark on a face is still `--on-color`, but `--on-color` is now
 * the ink rather than white: a face this bright cannot carry white text,
 * and patching only the brightest one is what the retired gold taught us
 * not to do. So the flip is applied to all five at once and the family
 * stays one component in five colours.
 *
 * A face joins on two terms, both measured, both in the artifact this
 * palette came from:
 *   - `--ink` (#23211e) on the face clears 4.5:1. Lowest here is violet
 *     at 6.99, so the category name, the amount and every icon are safe
 *     at any size, not just at large-text sizes.
 *   - the deep shade clears 4.5:1 on white. Lowest here is punch at 4.50,
 *     because the deep is what carries small text on a card and the pip
 *     glyph beside the dial.
 *
 * The deep is no longer "the face darkened exactly 22%". A light face
 * darkened 22% is still light, and would clear nothing. Each deep is the
 * face scaled down until it passes on white — between 55% and 69% of the
 * face, per ink — so the ratio is what is fixed now, not the multiplier.
 *
 * These are the one place a hex literal is legitimate: `Category.color`
 * is data, and data has to carry a real value. Everything that renders
 * reads it back through the `--c` / `--ce` custom properties.
 */
export const CATEGORY_COLORS = [
  "#FF8FA3", // punch
  "#FFD23F", // zest
  "#A5E34D", // lime
  "#5FD8D3", // aqua
  "#B79BFF", // violet
] as const;

export const PUNCH = CATEGORY_COLORS[0];
export const ZEST = CATEGORY_COLORS[1];
export const LIME = CATEGORY_COLORS[2];
export const AQUA = CATEGORY_COLORS[3];
export const VIOLET = CATEGORY_COLORS[4];

/**
 * Face -> deeper shade.
 *
 * The five live inks come first. Everything under them is retired, and
 * none of it is dead code: a config keeps whatever hex it was written
 * with until the reader applies a template, so someone who used the app
 * before a palette change still has the old faces in localStorage. Drop
 * an entry and that stale card falls through to the generic darkening,
 * which hands it a shade it cannot legibly set text in.
 */
const EDGES: Record<string, string> = {
  // live: the Highlighter five
  "#ff8fa3": "#ab606d",
  "#ffd23f": "#8c7323",
  "#a5e34d": "#5e812c",
  "#5fd8d3": "#387f7c",
  "#b79bff": "#7e6bb0",

  // retired: the dark four, and the gold that preceded them
  "#33566e": "#284356",
  "#bc5b5b": "#934747",
  "#7f9455": "#637342",
  "#b07f24": "#89631c",
  "#e0b14d": "#866a2e",
};

/**
 * The deeper shade for a category face. Palette inks get their exact
 * counterpart; anything else (a colour left over in localStorage from an
 * older scheme) is darkened by 18%, which was enough for the dark faces
 * that fallback was written for.
 */
export const edgeOf = (color: string): string => {
  const exact = EDGES[color.toLowerCase()];
  if (exact) return exact;

  const hex = color.replace("#", "");
  if (hex.length !== 6 || /[^0-9a-f]/i.test(hex)) return "#ab606d";

  const darker = [0, 2, 4]
    .map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * 0.82))
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("");
  return `#${darker}`;
};
