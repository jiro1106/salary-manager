/**
 * The Nala category inks. Every face ships with a darker shade of
 * itself, because a face at full strength is a fill and nothing else:
 * brick on white measures 3.6:1, so anything set as text or as a small
 * icon has to drop to the darker shade to clear 4.5:1.
 *
 * These are the one place a hex literal is legitimate: `Category.color`
 * is data, and data has to carry a real value. Everything that renders
 * reads it back through the `--c` / `--ce` custom properties.
 */
export const CATEGORY_COLORS = [
  "#33566E", // slate
  "#BC5B5B", // brick
  "#7F9455", // moss
  "#E0B14D", // gold
] as const;

export const SLATE = CATEGORY_COLORS[0];
export const BRICK = CATEGORY_COLORS[1];
export const MOSS = CATEGORY_COLORS[2];
export const GOLD = CATEGORY_COLORS[3];

/**
 * Face -> darker shade, for the four inks the palette actually ships.
 * Each is its face darkened 22%, except gold, which is light enough that
 * 22% still misses 4.5:1 and has to go to 40%.
 */
const EDGES: Record<string, string> = {
  "#33566e": "#284356",
  "#bc5b5b": "#934747",
  "#7f9455": "#637342",
  "#e0b14d": "#866A2E",
};

/**
 * The darker shade for a category face. Palette inks get their exact
 * counterpart; anything else (a colour left over in localStorage from
 * an older scheme) is darkened by roughly the same 18% the pairs use, so
 * a stale card still gets a legible shade rather than none.
 */
export const edgeOf = (color: string): string => {
  const exact = EDGES[color.toLowerCase()];
  if (exact) return exact;

  const hex = color.replace("#", "");
  if (hex.length !== 6 || /[^0-9a-f]/i.test(hex)) return "#934747";

  const darker = [0, 2, 4]
    .map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * 0.82))
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("");
  return `#${darker}`;
};
