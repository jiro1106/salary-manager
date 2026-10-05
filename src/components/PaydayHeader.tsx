import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import CutDial from "./CutDial";
import Legend from "./Legend";
import Button from "./Button";
import IconButton from "./IconButton";
import { pct, peso, pesoRound } from "../lib/format";
import type { Category } from "../types";

interface PaydayHeaderProps {
  salary: number;
  onSalaryChange: (value: number) => void;
  totalPercent: number;
  spent: number;
  remaining: number;
  onAddExpense: () => void;
  // Top-level categories, used to render the dial and legend below the
  // salary row. Optional so the header still works before this is wired
  // up everywhere.
  categories?: Category[];
}

/**
 * Nine digits before the point — ₱999,999,999.99, three orders of
 * magnitude past any take-home pay this app is for.
 *
 * The ceiling is about arithmetic before it is about layout. Every figure
 * on the page is derived from this one by `salary * percent / 100`, and a
 * JS number holds integers exactly only up to 2^53 (₱9,007,199,254,740,991).
 * Type past that and the split figures stop being merely wide and start
 * being wrong — the category amounts drift, and they drift silently. Nine
 * digits leaves the largest product (100% of the cap) seven orders of
 * magnitude inside the safe range, so every peso on screen is exact.
 *
 * Layout is the second reason and the visible one: at ten digits the
 * derived amounts outgrow their cards and run past the edge.
 */
const MAX_INT_DIGITS = 9;

/**
 * Strips input down to a valid "raw" numeric string:
 * digits only, at most one decimal point, at most 2 decimal digits,
 * at most MAX_INT_DIGITS digits before the point.
 * Leading zeros in the integer part are stripped (except "0" itself).
 */
function sanitizeRaw(input: string): string {
  let value = input.replace(/[^0-9.]/g, "");

  // keep only the first decimal point
  const firstDot = value.indexOf(".");
  if (firstDot !== -1) {
    value =
      value.slice(0, firstDot + 1) +
      value.slice(firstDot + 1).replace(/\./g, "");
  }

  const [intRaw, decRaw] = value.split(".");
  // Strip the dead zeros first, then take the cap off what's left, so a
  // pasted "0001234" spends its budget on digits that count. A keystroke
  // past the cap is simply not accepted — the same silent refusal a typed
  // letter already gets here, which is what a maxlength does elsewhere.
  let intPart = intRaw.replace(/^0+(?=\d)/, "").slice(0, MAX_INT_DIGITS);
  const decPart = decRaw !== undefined ? decRaw.slice(0, 2) : undefined;

  if (intPart === "") {
    intPart = value.includes(".") ? "0" : "";
  }

  return decPart !== undefined ? `${intPart}.${decPart}` : intPart;
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
  onAddExpense,
  categories = [],
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

    const sanitized = sanitizeRaw(prevFormatted);
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
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    e.preventDefault();

    const delta = (e.key === "ArrowUp" ? 1 : -1) * (e.shiftKey ? 1000 : 100);
    const base = rawValue === "" ? 0 : Number(rawValue);
    const ceiling = 10 ** MAX_INT_DIGITS - 1;
    const next = Math.min(
      ceiling,
      Math.max(0, Math.round(((Number.isFinite(base) ? base : 0) + delta) * 100) / 100),
    );

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
  const isOver = totalPercent > 100;
  const overAmount = (salary * (totalPercent - 100)) / 100;

  return (
    <section className="relative rounded-slab border border-line bg-card px-deck-x py-[26px]">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="min-w-0">
          <p className="text-label uppercase tracking-caps text-ink-soft">
            Salary
          </p>
          {/* The field is editable, so it reads as one: a recessed ground
              with real padding round the figure, and the zest rule along
              the bottom carrying the accent the underline used to. */}
          <span
            className={[
              // h-control, not a padding pair: the input inside refuses
              // the inherited line-height, so padding could never make
              // this box a predictable height. items-center now, because
              // the ₱ and the figure carry the same size and leading and
              // so centre to the same place their baselines did.
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
              // Fixed at 10ch, and no inline width: the box does not track
              // what is typed. A width that grew with the figure moved the
              // action beside it on every keystroke and, past seven
              // figures, wrapped it onto its own line. 10ch holds
              // "9,999,999" and its separators with a character to spare,
              // which is every salary this app is for.
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

        {/*
          The action and salary field share h-control, so they align when
          this row has room and wrap cleanly on smaller screens.
        */}
        <div className="inline-flex flex-col items-start gap-2 max-[700px]:w-full">
          <Button
            onClick={onAddExpense}
            inert={categories.length === 0}
            disabled={categories.length === 0}
            aria-describedby={categories.length === 0 ? "add-expense-help" : undefined}
            className="max-[700px]:w-full"
          >
            <Plus size={17} aria-hidden="true" strokeWidth={2.2} />
            Add expense
          </Button>
          {categories.length === 0 && (
            <p id="add-expense-help" className="text-meta text-ink-soft">
              Add a category before recording expenses.
            </p>
          )}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-4 max-[450px]:gap-2">
        <div>
          <p className="text-label uppercase tracking-caps text-ink-soft">Spent</p>
          <p className="mt-1 font-display text-amt font-extrabold text-spent">{peso(spent)}</p>
        </div>
        <div>
          <p className="text-label uppercase tracking-caps text-ink-soft">
            {remaining < 0 ? "Over budget" : "Available"}
          </p>
          <p className={`mt-1 font-display text-amt font-extrabold ${remaining < 0 ? "text-spent" : "text-lime-deep"}`}>
            {peso(Math.abs(remaining))}
          </p>
        </div>
      </div>

      {/*
        The live region is always in the DOM, empty when the split fits,
        because a status region has to be registered before content lands
        in it or the first message goes unread — mounting the banner and
        its role together announces nothing. Empty it draws no box, and
        the banner's own top margin collapses through it, so the spacing
        is what it was.

        The banner names the allocation consequence once, in pesos.
      */}
      <div role="status">
        {isOver && (
          <p className="mt-3.5 max-w-prose rounded-control bg-action-tint px-3.5 py-[9px] font-display text-meta font-semibold text-action-edge">
            Over by {pct(totalPercent - 100)}% ·{" "}
            <b className="font-bold">{pesoRound(overAmount)}</b> more than this
            payday
          </p>
        )}
      </div>

      {/* No categories: the deck collapses to the amount row alone. */}
      {categories.length > 0 && (
        <>
          <hr className="my-6 h-px border-0 bg-line" />
          <div className="grid grid-cols-[var(--dial)_1fr] items-center gap-split max-[700px]:grid-cols-1 max-[700px]:justify-items-center max-[700px]:gap-7">
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
