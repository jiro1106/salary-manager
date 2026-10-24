export const uid = (): string => Math.random().toString(36).slice(2, 10);

/** Full precision for category cards, expenses, and balance totals. */
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

/** `percent` of `amount`; a blank or non-numeric percent counts as 0. */
export const share = (amount: number, percent: number): number =>
  (amount * (Number(percent) || 0)) / 100;

/** "1 item", "3 items"; pass `many` for irregular plurals. */
export const plural = (n: number, one: string, many = `${one}s`): string =>
  `${n} ${n === 1 ? one : many}`;

/** At most one decimal, and never a trailing "20.0". */
export const pct = (n: number): string =>
  String(Math.round((Number(n) || 0) * 10) / 10);
