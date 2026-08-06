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
 * A field sitting at 0 holds a placeholder, not a figure — a new category
 * starts there — so the first digit typed should *replace* that zero
 * rather than land beside it and read as 50 when 5 was meant. The caret
 * can be either side of the zero and a number input exposes no selection,
 * so both arrangements are stripped: "05" and "50" from a zero field are
 * each 5.
 *
 * This is not ambiguous with genuinely typing "50" from zero, because only
 * the keystroke *made on a zero* is rewritten: "5" arrives as 5, and the
 * "0" after it lands on a field holding 5, which is left alone. Decimals
 * survive for the same reason — "0." is still 0, and the following "5"
 * makes "0.5", which has no zero adjacent to a digit to strip.
 */
function parseTyped(typed: string, current: number): number {
  if (typed === "") return 0;
  if (current !== 0 || typed === "0") return Number(typed);
  return Number(typed.replace(/^0(?=\d)/, "").replace(/^(\d)0$/, "$1"));
}

/**
 * A recessed figure field. The visible chip keeps the tight metrics the
 * design calls for while the transparent label around it carries the
 * 44px target, and clicking anywhere in that label focuses the input.
 *
 * The unit sits inside the chip on purpose: on a category ground, a
 * loose "%" beside the field would be normal-weight text on clay at
 * 3.65:1, which fails. Inside, it sits on card.
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
  // A white chip on a category ink is already its own boundary; a grey
  // chip on a white card is not, so only that one is ringed.
  const ground = disabled
    ? "bg-sunk text-ink-soft cursor-not-allowed shadow-field"
    : tone === "card"
      ? "bg-card text-ink"
      : "bg-sunk text-ink shadow-field";

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
          type="number"
          step="any"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(parseTyped(e.target.value, value))}
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
