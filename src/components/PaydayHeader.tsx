import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import CutDial from "./CutDial";
import Legend from "./Legend";
import IconButton from "./IconButton";
import SpendSummary from "./SpendSummary";
import type { Category } from "../types";
import { MAX_PESO_DIGITS, arrowStep, sanitizeDecimal } from "../lib/numberInput";

interface PaydayHeaderProps {
  salary: number;
  onSalaryChange: (value: number) => void;
  totalPercent: number;
  spent: number;
  remaining: number;
  // Top-level categories, used to render the dial and legend below the
  // salary row.
  categories: Category[];
}

/** Adds thousands separators to the integer part only, leaves decimals untouched. */
function formatWithCommas(rawValue: string): string {
  if (rawValue === "") return "";
  const [intPart, decPart] = rawValue.split(".");
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decPart !== undefined ? `${formattedInt}.${decPart}` : formattedInt;
}

export default function PaydayHeader({
  salary,
  onSalaryChange,
  totalPercent,
  spent,
  remaining,
  categories,
}: PaydayHeaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cursorRef = useRef<number | null>(null);

  // Local raw string mirrors `salary` but preserves in-progress typing
  // (a trailing ".", trailing zeros like "120.50", etc.) that a plain
  // number can't represent.
  const [rawValue, setRawValue] = useState<string>(
    salary ? String(salary) : "",
  );

  // Keep local state in sync when a stored salary loads. Skip changes
  // originating from typing so in-progress decimals remain intact.
  useEffect(() => {
    const currentNumeric = rawValue === "" ? 0 : Number(rawValue);
    if (currentNumeric !== salary) {
      setRawValue(salary ? String(salary) : "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salary]);

  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const prevFormatted = input.value;
    const cursorPos = input.selectionStart ?? prevFormatted.length;

    // How many non-comma characters sit before the cursor, in the
    // string as the user just edited it.
    const nonCommaBeforeCursor = prevFormatted
      .slice(0, cursorPos)
      .replace(/,/g, "").length;

    const sanitized = sanitizeDecimal(prevFormatted, MAX_PESO_DIGITS, 2);
    setRawValue(sanitized);
    onSalaryChange(sanitized === "" ? 0 : Number(sanitized));

    const formatted = formatWithCommas(sanitized);

    // Re-map the cursor position into the newly formatted string,
    // skipping over commas.
    let newPos = formatted.length;
    if (nonCommaBeforeCursor === 0) {
      newPos = 0;
    } else {
      let count = 0;
      for (let i = 0; i < formatted.length; i++) {
        if (formatted[i] !== ",") count++;
        if (count === nonCommaBeforeCursor) {
          newPos = i + 1;
          break;
        }
      }
    }

    cursorRef.current = newPos;
  };

  /**
   * Arrow stepping, in the stride this field actually moves in. The share
   * chips step ±1 / ±10 because a percent is read in points; a payday is
   * not, and a take-home pay that nudges by one peso is a stepper nobody
   * would press twice. ±100 and ±1,000 are the units a person actually
   * revises a payday by.
   *
   * Different strides on the same gesture is the point rather than an
   * inconsistency: the two fields carry different units, and matching the
   * numbers would mean mismatching what the numbers mean.
   *
   * Goes through the same digit ceiling a keystroke does, so stepping
   * cannot reach a figure typing could not, and floors at zero. It leaves
   * `cursorRef` alone: this does not edit the string around a caret, so
   * the restore in the layout effect below has nothing to put back.
   */
  const handleSalaryKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const next = arrowStep(e, Number(rawValue), [100, 1000], MAX_PESO_DIGITS);
    if (next === null) return;
    e.preventDefault();

    setRawValue(next === 0 ? "" : String(next));
    onSalaryChange(next);
  };

  useLayoutEffect(() => {
    if (inputRef.current && cursorRef.current !== null) {
      inputRef.current.setSelectionRange(cursorRef.current, cursorRef.current);
      cursorRef.current = null;
    }
  });

  // Which category the dial and the legend are both pointing at. It lives
  // here because it is the one thing those two share and it is nobody
  // else's business: it is a pointer position, not part of the split, so
  // it never reaches App and never reaches storage. Nothing latches it —
  // the highlight is exactly as long as the pointer is on it.
  const [hovered, setHovered] = useState<string | null>(null);
  // A category deleted or replaced out from under the pointer resolves to
  // nothing, so no stale id can light a wedge.
  const activeId =
    hovered && categories.some((c) => c.id === hovered) ? hovered : null;

  const clearSalary = () => {
    setRawValue("");
    onSalaryChange(0);
    // Cleared to type, not cleared to look at.
    inputRef.current?.focus();
  };

  const displaySalary = formatWithCommas(rawValue);
  // Nothing entered yet, or entered as nothing. Either way the figure is a
  // prompt rather than a number, and it drops to soft ink to say so — the
  // ₱ with it, since a coloured peso sign in front of a grey zero reads as a
  // real amount that happens to be zero.
  const isBlank = rawValue === "" || Number(rawValue) === 0;

  return (
    <section className="relative rounded-slab border border-line bg-card px-deck-x py-stack">
      <div className="min-w-0">
        <p className="text-label uppercase tracking-caps text-ink-soft">
          Salary
        </p>
        {/* The field is editable, so it reads as one: a recessed ground
            with real padding round the figure and a zest rule along the
            bottom. */}
        <span
          className={[
            // h-control, not a padding pair: the input inside refuses
            // the inherited line-height, so padding could never make
            // this box a predictable height. items-center works because
            // the ₱ and the figure share size and leading.
            "mt-2 inline-flex h-control max-w-full items-center rounded-slab bg-sunk",
            // zest's deep shade, not zest. The rule has to be seen on a
            // recessed grey, and the face itself measures 1.4:1 there —
            // the deep is the same ink one step down, at 4.5:1.
            "border-b-[3px] border-zest-deep px-5",
            "font-display text-hero font-extrabold",
            "focus-within:outline focus-within:outline-[3px]",
            "focus-within:outline-blue focus-within:outline-offset-[3px]",
            isBlank ? "text-ink-faint" : "text-ink",
          ].join(" ")}
        >
          <span
            aria-hidden="true"
            className={[
              "mr-[0.1em]",
              isBlank ? "text-ink-faint" : "text-action-edge",
            ].join(" ")}
          >
            ₱
          </span>
          <input
            ref={inputRef}
            type="text"
            inputMode="decimal"
            aria-label="Take-home pay in pesos"
            value={displaySalary}
            onChange={handleSalaryChange}
            onKeyDown={handleSalaryKeyDown}
            placeholder="0"
            // Fixed at 10ch so the box does not resize on every keystroke.
            // 10ch holds "9,999,999" and its separators with a character
            // to spare, which is every salary this app is for.
            //
            // Nothing overflows, because the figure is inside an <input>:
            // it scrolls its own content while focused, so the caret is
            // always visible however long the entry runs. text-ellipsis
            // covers the other half — blurred, an over-long amount reads
            // "1,234,567…" rather than being cut mid-glyph. The leading
            // digits are the ones kept, so the magnitude survives the
            // truncation even when the centavos don't.
            className={[
              "w-[10ch] max-w-full border-0 bg-transparent p-0",
              "text-ellipsis",
              "outline-none focus:outline-none placeholder:text-ink-faint",
            ].join(" ")}
          />
          {/* Only offered when there is something to clear, so the field
              doesn't carry a dead control on an empty amount. */}
          {rawValue !== "" && (
            <IconButton
              label="Clear salary amount"
              onClick={clearSalary}
              className="ml-3 self-center"
            >
              <X size={18} strokeWidth={2.2} aria-hidden="true" />
            </IconButton>
          )}
        </span>
      </div>

      <SpendSummary
        spent={spent}
        remaining={remaining}
        className="mt-5 border-t border-line pt-4"
      />

      {/* No categories: the deck collapses to the amount row alone. */}
      {categories.length > 0 && (
        <>
          <hr className="my-6 h-px border-0 bg-line" />
          <div className="grid grid-cols-[var(--dial)_1fr] items-center gap-split narrow:grid-cols-1 narrow:justify-items-center narrow:gap-7">
            <CutDial
              segments={categories}
              totalPercent={totalPercent}
              salary={salary}
              activeId={activeId}
              onHover={setHovered}
            />
            <Legend
              segments={categories}
              salary={salary}
              totalPercent={totalPercent}
              activeId={activeId}
              onHover={setHovered}
            />
          </div>
        </>
      )}
    </section>
  );
}
