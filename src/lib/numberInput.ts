/**
 * Nine digits before the point — ₱999,999,999.99, three orders of
 * magnitude past any take-home pay this app is for.
 *
 * The ceiling is about arithmetic before it is about layout. Every figure
 * on the page is derived from the salary by `salary * percent / 100`, and
 * a JS number holds integers exactly only up to 2^53. Nine digits leaves
 * the largest product seven orders of magnitude inside the safe range, so
 * every peso on screen is exact. At ten digits the derived amounts also
 * outgrow their cards.
 */
export const MAX_PESO_DIGITS = 9;

/**
 * Digits and at most one decimal point, with no leading zeros on the
 * integer part — so "05" is 5, not fifty — and a bare "." read as "0.".
 * A keystroke past either cap is refused the same way a typed letter is.
 * Dead zeros are stripped before the integer cap, so a pasted "0001234"
 * spends its budget on digits that count.
 */
export function sanitizeDecimal(
  input: string,
  maxIntDigits: number,
  maxDecimals = Infinity,
): string {
  const [intRaw, ...rest] = input.replace(/[^0-9.]/g, "").split(".");
  const intPart = intRaw.replace(/^0+(?=\d)/, "").slice(0, maxIntDigits);
  if (rest.length === 0) return intPart;
  return `${intPart || "0"}.${rest.join("").slice(0, maxDecimals)}`;
}

/**
 * The value an ArrowUp / ArrowDown press steps to, or null for any other
 * key. Shift takes the coarse stride. Floored at zero, capped at the same
 * digit ceiling typing has, and rounded to 2dp so a step off a
 * back-computed figure (33.33333333333333 + 1) lands on a figure.
 */
export function arrowStep(
  e: { key: string; shiftKey: boolean },
  base: number,
  [fine, coarse]: [number, number],
  maxIntDigits: number,
): number | null {
  if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return null;
  const delta = (e.key === "ArrowUp" ? 1 : -1) * (e.shiftKey ? coarse : fine);
  const from = Number.isFinite(base) ? base : 0;
  return Math.min(10 ** maxIntDigits - 1, Math.max(0, Math.round((from + delta) * 100) / 100));
}
