/**
 * A pocket calculator's state, keyed like the iOS one. `expr` is what the
 * top line shows, built only by `press`, so the parser below never sees a
 * malformed sum. A "−" at the start or straight after an operator is a
 * number's sign (from ±), anywhere else it is subtraction. `done` is set
 * by "=": the next digit starts a new sum, the next operator carries the
 * result on. `repeat` is the last operator and number "=" used, so "="
 * again applies it to the result: 2+3 = 5, = 8, = 11.
 */
export interface CalcState {
  expr: string;
  done: boolean;
  repeat?: string;
}

export type CalcKey =
  | "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"
  | "." | "+" | "−" | "×" | "÷" | "=" | "C" | "±" | "%" | "⌫";

export const EMPTY: CalcState = { expr: "", done: false };

const OPS = "+−×÷";
const isOp = (c: string | undefined) => c !== undefined && OPS.includes(c);
// ponytail: results past 15 digits are refused, not shown in exponent form
const LIMIT = 1e15;
const MAX_DIGITS = 15;

/**
 * The value of `expr`, with × and ÷ before + and −, so 2+3×4 is 14. A
 * trailing operator or point is ignored, which is what lets the result
 * line keep showing a value while the next number is still being typed.
 * Null when there is nothing to work out; Infinity or NaN after ÷ 0.
 */
export function evaluate(expr: string): number | null {
  const tokens = expr.replace(/[+−×÷]+$/, "").match(/\d+\.?\d*|\.\d+|[+−×÷]/g);
  if (!tokens) return null;
  let i = 0;
  const num = () => {
    let sign = 1;
    while (tokens[i] === "−") (sign = -sign), i++;
    return sign * Number(tokens[i++]);
  };

  let total = 0;
  let term = num();
  while (i < tokens.length) {
    const op = tokens[i++];
    const n = num();
    if (op === "×") term *= n;
    else if (op === "÷") term /= n;
    else {
      total += term;
      term = op === "+" ? n : -n;
    }
  }
  // 0.1 + 0.2 is 0.30000000000000004 in floats; twelve significant
  // digits is past anything a peso sum needs and drops the noise.
  return Number((total + term).toPrecision(12));
}

/** Whether a value can be shown and carried on. */
export const usable = (n: number | null): n is number =>
  n !== null && Number.isFinite(n) && Math.abs(n) < LIMIT;

/** Grouped for reading: 1,234.5. */
export const show = (n: number): string =>
  n.toLocaleString("en-PH", { maximumFractionDigits: 10 }).replace("-", "−");

/** Back into `expr` form: no grouping, no exponent, a sign as "−". */
const plain = (n: number) =>
  n.toLocaleString("en-US", { useGrouping: false, maximumFractionDigits: 10 }).replace("-", "−");

/**
 * Where the number being typed starts, and where its sign starts if it
 * has one. "5×−3" is 3 at 3 with its sign at 2; "5−3" has no sign.
 */
function lastNumber(expr: string) {
  let start = expr.length;
  while (start > 0 && !isOp(expr[start - 1])) start--;
  const signed = start > 0 && expr[start - 1] === "−" && (start === 1 || isOp(expr[start - 2]));
  return { start, signStart: signed ? start - 1 : start };
}

/** What "=" works out: the sum, or the result with the last step again. */
export const sumFor = ({ expr, done, repeat }: CalcState) => (done && repeat ? expr + repeat : expr);

export function press(state: CalcState, key: CalcKey): CalcState {
  const { expr, done } = state;
  if (key === "C") return EMPTY;
  if (key === "⌫") return done ? EMPTY : { expr: expr.slice(0, -1), done: false };

  if (key === "=") {
    const sum = sumFor(state);
    const value = evaluate(sum);
    if (!usable(value)) return state;
    const { start, signStart } = lastNumber(sum);
    const repeat = done ? state.repeat : signStart > 0 && start < sum.length ? sum.slice(signStart - 1) : undefined;
    return { expr: plain(value), done: true, repeat };
  }

  if (isOp(key)) {
    // With nothing typed yet the sum starts from 0, as on iOS.
    const body = expr.replace(/[+−×÷]+$/, "");
    return { expr: (body || "0") + key, done: false };
  }

  const { start, signStart } = lastNumber(expr);
  const typing = expr.slice(start);

  // ± and % act on the number on screen, including a result after "=".
  if (key === "±") {
    const flipped = signStart < start ? expr.slice(0, signStart) + typing : expr.slice(0, start) + "−" + typing;
    return { ...state, expr: flipped };
  }

  if (key === "%") {
    if (!typing) return state;
    // After + or −, a percent is of what came before: 200 + 10% is 220.
    const op = expr[signStart - 1];
    const before = op === "+" || op === "−" ? evaluate(expr.slice(0, signStart - 1)) : null;
    const value = (Number(typing) / 100) * (before ?? 1);
    return { ...state, expr: expr.slice(0, start) + plain(Number(value.toPrecision(12))) };
  }

  // A digit or point after "=" starts a new sum.
  if (done) return press(EMPTY, key);

  if (key === ".") {
    if (typing.includes(".")) return { expr, done: false };
    return { expr: expr + (typing === "" ? "0." : "."), done: false };
  }

  if (typing.replace(".", "").length >= MAX_DIGITS) return { expr, done: false };
  // No leading zeros: 0 then 5 is 5, not 05.
  if (typing === "0") return { expr: expr.slice(0, -1) + key, done: false };
  return { expr: expr + key, done: false };
}
