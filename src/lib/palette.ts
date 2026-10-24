/**
 * The Nala category inks. Five light faces, all carrying `--on-color`
 * (the page ink) for every mark on them. A face joins only if `--ink`
 * (#23211e) on it clears 4.5:1. Lowest here is violet at 6.99, so text
 * and icons are safe at any size.
 *
 * These are the one place a hex literal is legitimate: `Category.color`
 * is data, and data has to carry a real value. Everything that renders
 * reads it back through the `--c` custom property.
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
