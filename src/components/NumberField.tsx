import { useRef, useState } from "react";

interface NumberFieldProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  /** Rides inside the chip, never loose beside it. */
  unit: "%" | "₱";
  /** Card grounds sit on a category head; sunk grounds sit on card. */
  tone?: "card" | "sunk";
  width?: string;
  disabled?: boolean;
}

/**
 * How many digits a field takes before the point, by what it measures.
 *
 * This is **not** the 100 clamp, which stays off: four categories at 90%
 * each is still expressible, still 360%, and still reported as over. It
 * is a ceiling on the figure itself, and a share three orders of
 * magnitude past whole is not an over-allocation anybody meant. Left
 * open, a chip of 9s multiplies the payday into an amount that outgrows
 * every card on the page and, past 2^53, is silently inexact besides.
 *
 * The peso cap matches the payday field's, since a sub-item's peso
 * amount is bounded by the same salary.
 */
const MAX_INT_DIGITS: Record<NumberFieldProps["unit"], number> = {
  "%": 3,
  "₱": 9,
};

/**
 * Digits, at most one decimal point, and no leading zeros on the integer
 * part — so "05" typed into a fresh category is 5, not fifty. The integer
 * part is capped per unit; a keystroke past the cap is refused the same
 * way a typed letter is.
 *
 * Decimals are deliberately not capped here. `display()` rounds what it
 * prints, and the stored value has to keep every digit of a percent
 * back-computed from a peso amount for the round-trip to land.
 */
function sanitize(input: string, maxIntDigits: number): string {
  const cleaned = input.replace(/[^0-9.]/g, "");
  const dot = cleaned.indexOf(".");
  const oneDot =
    dot === -1
      ? cleaned
      : cleaned.slice(0, dot + 1) + cleaned.slice(dot + 1).replace(/\./g, "");
  // A zero in front of a digit is dead weight; a zero in front of a point
  // is the whole number ("0.5" keeps its zero).
  const [intRaw, ...decRest] = oneDot.split(".");
  const intPart = intRaw.replace(/^0+(?=\d)/, "").slice(0, maxIntDigits);
  // decRest is empty or a single element — the dots were collapsed above.
  // An empty one is a trailing point mid-typing ("5."), which is kept.
  return decRest.length > 0 ? `${intPart}.${decRest[0]}` : intPart;
}

/**
 * What the chip shows when nobody is typing into it. `value` is a number,
 * and a number that came out of arithmetic rather than off the keypad
 * carries every digit of it: a sub-item's percent back-computed from a
 * peso amount (₱5,000 of a ₱15,000 category) is 33.33333333333333, and
 * String() would print the whole thing inside a 3ch chip. Two decimals is
 * finer than any figure on this page is read to, and a whole number still
 * prints whole, so the typed case is untouched.
 */
function display(value: number): string {
  if (!Number.isFinite(value)) return "0";
  return String(Math.round(value * 100) / 100);
}

/**
 * A recessed figure field. The visible chip keeps the tight metrics the
 * design calls for while the transparent label around it carries the
 * 44px target, and clicking anywhere in that label focuses the input.
 *
 * The unit sits inside the chip on purpose: on a category ground, a
 * loose "%" beside the field would be normal-weight text on clay at
 * 3.65:1, which fails. Inside, it sits on card.
 *
 * The input is `text` rather than `number`, and it holds its own draft
 * string while focused, for one reason: React compares a *number* input's
 * DOM string to the incoming value **loosely**, so `"05" != 5` is false
 * and it declines to rewrite the field. The value would be right and the
 * zero would stay on screen — the digits kept piling up as "050". Strict
 * string comparison on a text input writes every time. `inputMode` keeps
 * the numeric keypad, and the spinners were already suppressed as noise.
 */
export default function NumberField({
  value,
  onChange,
  label,
  unit,
  tone = "card",
  width = "w-[3ch]",
  disabled = false,
}: NumberFieldProps) {
  // In-progress typing that no number can hold: "", "5.", "0.". Dropped on
  // blur so the field falls back to the canonical figure.
  const [draft, setDraft] = useState<string | null>(null);
  const selectedOnFocus = useRef(false);
  const text = draft ?? display(value);

  // A zero is a placeholder, not a figure, so focusing a field that holds
  // one takes the whole thing — the first digit typed replaces it instead
  // of landing on whichever side of it the caret happened to fall.
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (value !== 0) return;
    e.currentTarget.select();
    selectedOnFocus.current = true;
  };

  // The mouseup that ends the click would otherwise collapse that
  // selection back to a caret.
  const handleMouseUp = (e: React.MouseEvent<HTMLInputElement>) => {
    if (!selectedOnFocus.current) return;
    e.preventDefault();
    selectedOnFocus.current = false;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = sanitize(e.target.value, MAX_INT_DIGITS[unit]);
    setDraft(next);
    const parsed = Number(next);
    onChange(next === "" || Number.isNaN(parsed) ? 0 : parsed);
  };

  const handleBlur = () => {
    setDraft(null);
    selectedOnFocus.current = false;
  };

  // Ground is fill and ink only — the boundary is unconditional and lives
  // on the chip below, so every field on the page is drawn the same way.
  // The white chip on a category ink is its own boundary already and does
  // not strictly need the ring; it carries it so a field looks like a
  // field wherever it lands, which matters more than the one saved line.
  const ground = disabled
    ? "bg-sunk text-ink-soft cursor-not-allowed"
    : tone === "card"
      ? "bg-card text-ink"
      : "bg-sunk text-ink";

  // Roomier than the chip strictly needs to be: a figure you are meant to
  // click into and retype wants air around it, and the chip is the only
  // thing on the row that says "this is editable".
  const metrics =
    tone === "card" ? "px-4 py-2.5 text-ui" : "px-3.5 py-2 text-meta";

  // The label carries the honest 44px target and the chip sits inside it,
  // so the pull-back is whatever the padded chip leaves over.
  const pullback = tone === "card" ? "-my-0.5" : "-my-1";

  return (
    <label
      className={[
        "group inline-flex items-center shrink-0 min-h-hit",
        pullback,
        disabled ? "cursor-not-allowed" : "cursor-text",
      ].join(" ")}
    >
      <span className="sr-only">{label}</span>
      <span
        className={[
          "inline-flex items-baseline gap-[3px] font-bold rounded-control",
          // The grey boundary every field on this page wears. Inset, so it
          // costs the box no width and the chip metrics are untouched.
          "shadow-field",
          "group-focus-within:outline group-focus-within:outline-[3px]",
          "group-focus-within:outline-blue group-focus-within:outline-offset-[3px]",
          ground,
          metrics,
        ].join(" ")}
      >
        {unit === "₱" && (
          <span aria-hidden="true" className="text-ink-soft">
            ₱
          </span>
        )}
        <input
          type="text"
          inputMode="decimal"
          value={text}
          disabled={disabled}
          onChange={handleChange}
          onFocus={handleFocus}
          onMouseUp={handleMouseUp}
          onBlur={handleBlur}
          className={[
            // Preflight already hands inputs the surrounding font and colour.
            "bg-transparent border-0 p-0 text-right",
            "outline-none focus:outline-none disabled:cursor-not-allowed",
            width,
          ].join(" ")}
        />
        {unit === "%" && (
          <span aria-hidden="true" className="text-ink-soft">
            %
          </span>
        )}
      </span>
    </label>
  );
}
