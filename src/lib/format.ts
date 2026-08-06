export const uid = (): string => Math.random().toString(36).slice(2, 10);

/** Full precision: the figure on a category card, a saved payday. */
export const peso = (n: number): string =>
  "₱" +
  (Math.round(n * 100) / 100).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/**
 * Whole pesos, for figures read at a glance rather than reconciled:
 * the legend column, the over-allocation banner, a history row.
 */
export const pesoRound = (n: number): string =>
  "₱" + Math.round(n).toLocaleString("en-PH");

/** At most one decimal, and never a trailing "20.0". */
export const pct = (n: number): string =>
  String(Math.round((Number(n) || 0) * 10) / 10);
