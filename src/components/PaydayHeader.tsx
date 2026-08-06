import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Check, History, X } from "lucide-react";
import CutDial from "./CutDial";
import Legend from "./Legend";
import Button from "./Button";
import IconButton from "./IconButton";
import { pct, pesoRound } from "../lib/format";
import type { Category } from "../types";

// A radial spread of small dots in the four category inks, popping out
// from the Save button on a successful save. Fixed, not randomized, so
// the burst is the same shape every time rather than jittering on re-render.
const BURST_DOTS: { dx: number; dy: number; color: string; delay: number }[] = [
  { dx: -28, dy: -14, color: "bg-clay", delay: 0 },
  { dx: -10, dy: -32, color: "bg-slate", delay: 30 },
  { dx: 14, dy: -30, color: "bg-moss", delay: 10 },
  { dx: 30, dy: -10, color: "bg-sand", delay: 45 },
  { dx: 26, dy: 16, color: "bg-clay", delay: 15 },
  { dx: 6, dy: 30, color: "bg-slate", delay: 40 },
  { dx: -18, dy: 26, color: "bg-moss", delay: 5 },
  { dx: -32, dy: 4, color: "bg-sand", delay: 25 },
];

interface PaydayHeaderProps {
  salary: number;
  onSalaryChange: (value: number) => void;
  totalPercent: number;
  onSave: () => void;
  savedFlash: boolean;
  // Top-level categories, used to render the dial and legend below the
  // salary row. Optional so the header still works before this is wired
  // up everywhere.
  categories?: Category[];
}

/**
 * Strips input down to a valid "raw" numeric string:
 * digits only, at most one decimal point, at most 2 decimal digits.
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
  let intPart = intRaw.replace(/^0+(?=\d)/, "");
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
  onSave,
  savedFlash,
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

  // Keep local state in sync if `salary` changes from outside this
  // component (e.g. loading a saved payday from history). Skip if the
  // change originated from our own typing (values already match).
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
  // ₱ with it, since a clay peso sign in front of a grey zero reads as a
  // real amount that happens to be zero.
  const isBlank = rawValue === "" || Number(rawValue) === 0;
  const isOver = totalPercent > 100;
  const overAmount = (salary * (totalPercent - 100)) / 100;

  // Fires the dot burst the instant savedFlash flips on, not on every
  // render while it's held true.
  const [burst, setBurst] = useState<number | null>(null);
  const prevSavedFlash = useRef(savedFlash);
  useEffect(() => {
    const justSaved = savedFlash && !prevSavedFlash.current;
    prevSavedFlash.current = savedFlash;
    if (!justSaved) return;
    const id = Date.now();
    setBurst(id);
    const t = setTimeout(() => setBurst(null), 700);
    return () => clearTimeout(t);
  }, [savedFlash]);

  return (
    <section className="relative rounded-slab border border-line bg-card px-deck-x py-[26px]">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="min-w-0">
          <p className="text-label uppercase tracking-caps text-ink-soft">
            Payday amount
          </p>
          {/* The field is editable, so it reads as one: a recessed ground
              with real padding round the figure, and the sand rule along
              the bottom carrying the accent the underline used to. */}
          <span
            className={[
              // h-control, not a padding pair: the input inside refuses
              // the inherited line-height, so padding could never make
              // this box a predictable height. items-center now, because
              // the ₱ and the figure carry the same size and leading and
              // so centre to the same place their baselines did.
              "mt-2 inline-flex h-control max-w-full items-center rounded-slab bg-sunk",
              "border-b-[3px] border-sand px-5",
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
                isBlank ? "text-ink-faint" : "text-clay-edge",
              ].join(" ")}
            >
              ₱
            </span>
            <input
              ref={inputRef}
              type="text"
              inputMode="decimal"
              aria-label="Payday amount in pesos"
              value={displaySalary}
              onChange={handleSalaryChange}
              placeholder="0"
              className={[
                "min-w-[4ch] max-w-full border-0 bg-transparent p-0",
                "outline-none focus:outline-none placeholder:text-ink-faint",
              ].join(" ")}
              style={{ width: `${Math.max(displaySalary.length, 4)}ch` }}
            />
            {/* Only offered when there is something to clear, so the field
                doesn't carry a dead control on an empty amount. */}
            {rawValue !== "" && (
              <IconButton
                label="Clear payday amount"
                onClick={clearSalary}
                className="ml-3 self-center"
              >
                <X size={18} strokeWidth={2.2} aria-hidden="true" />
              </IconButton>
            )}
          </span>

        </div>

        {/*
          No pull. Both faces are h-control, so items-end lands their tops
          and their bottoms together and the two read as one pair. The 4px
          clay edge below the button is depth, not misalignment: it is the
          underside of the only raised object on the page. Pulling the
          button up to tuck that edge in would buy a shared bottom line at
          the price of a 4px step across the tops, which is the worse of
          the two mismatches because the faces are the same size.
        */}
        <span className="relative inline-flex max-[700px]:w-full">
          <Button
            variant={savedFlash ? "saved" : "primary"}
            onClick={onSave}
            className="max-[700px]:w-full"
          >
            {savedFlash ? (
              <Check size={17} aria-hidden="true" strokeWidth={2.4} />
            ) : (
              // The same mark the history disclosure carries, so the two
              // read as one destination. It is now the only thing naming
              // that destination — the label names the object instead —
              // which is why it stays and why it stays this mark.
              <History size={17} aria-hidden="true" strokeWidth={2.2} />
            )}
            {savedFlash ? "Saved" : "Save payday"}
          </Button>
          {burst !== null && (
            <span
              key={burst}
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
            >
              {BURST_DOTS.map((d, i) => (
                <i
                  key={i}
                  className={[
                    "absolute left-1/2 top-1/2 h-[7px] w-[7px] rounded-full",
                    "animate-[nala-burst_620ms_var(--ease)_forwards]",
                    d.color,
                  ].join(" ")}
                  style={
                    {
                      "--dx": `${d.dx}px`,
                      "--dy": `${d.dy}px`,
                      animationDelay: `${d.delay}ms`,
                    } as CSSProperties
                  }
                />
              ))}
            </span>
          )}
        </span>
      </div>

      {/*
        The live region is always in the DOM, empty when the split fits,
        because a status region has to be registered before content lands
        in it or the first message goes unread — mounting the banner and
        its role together announces nothing. Empty it draws no box, and
        the banner's own top margin collapses through it, so the spacing
        is what it was.

        The banner names the consequence once, in pesos, instead of saying
        the same number twice. It sits under the whole row rather than
        inside the amount column, for two reasons: it warns about what the
        Save button is about to write, not just about the figure, and left
        inside that column it became the column's bottom edge, so
        items-end would hang the button off a banner that is only
        sometimes there.
      */}
      <div role="status">
        {isOver && (
          <p className="mt-3.5 max-w-prose rounded-control bg-clay-tint px-3.5 py-[9px] font-display text-meta font-semibold text-clay-edge">
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
