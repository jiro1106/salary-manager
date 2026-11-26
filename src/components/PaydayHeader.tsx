import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { CalendarPlus, Check, Pencil, X } from "lucide-react";
import CutDial from "./CutDial";
import CategoryMark from "./CategoryMark";
import IconButton from "./IconButton";
import type { Category } from "../types";
import { pct, peso, share } from "../lib/format";
import { MAX_PESO_DIGITS, arrowStep, commaEdit, formatWithCommas } from "../lib/numberInput";

interface PaydayHeaderProps {
  salary: number;
  /** Called on Enter or the check button. Edits the current payday. */
  onSalarySave: (value: number) => void;
  /** Shown as a button under the field when set. */
  onStartNewPayday?: () => void;
  totalPercent: number;
  categories: Category[];
}

export default function PaydayHeader({
  salary,
  onSalarySave,
  onStartNewPayday,
  totalPercent,
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
  // Locked once saved. Nothing saved yet means there is nothing to lock.
  const [editing, setEditing] = useState(salary === 0);

  // A saved salary (load, confirm, reset) replaces the draft and locks.
  useEffect(() => {
    setRawValue(salary ? String(salary) : "");
    setEditing(salary === 0);
  }, [salary]);

  // Focus follows the pencil, not the first render.
  const focusOnEdit = useRef(false);
  useEffect(() => {
    if (editing && focusOnEdit.current) inputRef.current?.focus();
    focusOnEdit.current = false;
  }, [editing]);

  const save = () => {
    const value = rawValue === "" ? 0 : Number(rawValue);
    onSalarySave(value);
    setEditing(value === 0);
  };

  const cancel = () => {
    setRawValue(salary ? String(salary) : "");
    setEditing(salary === 0);
  };

  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { raw, caret } = commaEdit(e.target.value, e.target.selectionStart ?? e.target.value.length);
    setRawValue(raw);
    cursorRef.current = caret;
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
    if (e.key === "Enter") {
      e.preventDefault();
      save();
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      cancel();
      return;
    }
    const next = arrowStep(e, Number(rawValue), [100, 1000], MAX_PESO_DIGITS);
    if (next === null) return;
    e.preventDefault();

    setRawValue(next === 0 ? "" : String(next));
  };

  useLayoutEffect(() => {
    if (inputRef.current && cursorRef.current !== null) {
      inputRef.current.setSelectionRange(cursorRef.current, cursorRef.current);
      cursorRef.current = null;
    }
  });

  // The wedge under the pointer. A pointer position, not part of the split,
  // so it stays here and never reaches App or storage. A category deleted
  // out from under the pointer resolves to nothing.
  const [hovered, setHovered] = useState<string | null>(null);
  const activeId =
    hovered && categories.some((c) => c.id === hovered) ? hovered : null;

  const clearSalary = () => {
    setRawValue("");
    // Cleared to type, not cleared to look at.
    inputRef.current?.focus();
  };

  const displaySalary = formatWithCommas(rawValue);
  // Nothing entered yet, or entered as nothing. Either way the figure is a
  // prompt rather than a number, and it drops to soft ink to say so — the
  // ₱ with it, since a coloured peso sign in front of a grey zero reads as a
  // real amount that happens to be zero.
  const isBlank = rawValue === "" || Number(rawValue) === 0;

  // Largest first, so the list reads as a ranking. Bars are scaled to the
  // biggest share rather than to 100%, so small splits still get length.
  const ranked = [...categories].sort(
    (a, b) => (Number(b.percent) || 0) - (Number(a.percent) || 0),
  );
  const top = Math.max(...ranked.map((c) => Number(c.percent) || 0), 0);

  return (
    <>
    <section className="flex items-center justify-between gap-split narrow:flex-col narrow:items-stretch">
      <div className="min-w-0">
        {/* The new-payday action sits on the label row, not under the field,
            so it reads as acting on the whole payday rather than as the
            field's own submit. */}
        <div className="flex min-h-hit items-center justify-between gap-4">
          <p className="text-label uppercase tracking-caps text-ink-soft">
            Salary
          </p>
          {onStartNewPayday && !editing && (
            <button
              type="button"
              onClick={onStartNewPayday}
              className="-mr-2 inline-flex min-h-hit items-center gap-1.5 rounded-control px-2 text-meta font-bold text-ink-soft transition-colors hover:text-ink"
            >
              <CalendarPlus size={15} strokeWidth={2.2} aria-hidden="true" />
              Start new payday
            </button>
          )}
        </div>
        {/* The field is editable, so it reads as one: a recessed ground
            with real padding round the figure and a zest rule along the
            bottom. */}
        <span
          className={[
            // h-hit, not a padding pair: the input inside refuses
            // the inherited line-height, so padding could never make
            // this box a predictable height. items-center works because
            // the ₱ and the figure share size and leading.
            "mt-1 inline-flex h-hit max-w-full items-center rounded-slab bg-sunk",
            // zest's deep shade, not zest. The rule has to be seen on a
            // recessed grey, and the face itself measures 1.4:1 there —
            // the deep is the same ink one step down, at 4.5:1.
            "border-b-[3px] border-zest-deep px-4",
            "font-display text-hero font-extrabold",
            // Locked, the pencil carries its own focus ring.
            editing
              ? "focus-within:outline focus-within:outline-[3px] focus-within:outline-blue focus-within:outline-offset-[3px]"
              : "",
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
          {editing ? (
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
          ) : (
            <span className="w-[10ch] max-w-full truncate tabular-nums">{displaySalary || "0"}</span>
          )}
          {/* Only offered when there is something to clear, so the field
              doesn't carry a dead control on an empty amount. */}
          {editing && rawValue !== "" && (
            <IconButton
              label="Clear salary amount"
              onClick={clearSalary}
              className="ml-3 self-center"
            >
              <X size={16} strokeWidth={2.2} aria-hidden="true" />
            </IconButton>
          )}
          {editing ? (
            <IconButton label="Save salary" onClick={save} className="ml-1 self-center">
              <Check size={16} strokeWidth={2.2} aria-hidden="true" />
            </IconButton>
          ) : (
            <IconButton
              label="Edit salary"
              onClick={() => {
                focusOnEdit.current = true;
                setEditing(true);
              }}
              className="ml-3 self-center"
            >
              <Pencil size={16} strokeWidth={2.2} aria-hidden="true" />
            </IconButton>
          )}
        </span>

      </div>

      {/* No categories: the card collapses to the salary alone. */}
      {categories.length > 0 && (
        <div className="flex-none narrow:self-center">
          <CutDial
            segments={categories}
            totalPercent={totalPercent}
            salary={salary}
            activeId={activeId}
            onHover={setHovered}
          />
        </div>
      )}
    </section>

    {categories.length > 0 && (
      <ul aria-label="Salary by category" className="mt-stack border-t border-line pt-4">
        {ranked.map((c) => (
          <li
            key={c.id}
            className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 py-2"
            style={{ "--c": c.color } as React.CSSProperties}
          >
            <CategoryMark icon={c.icon} />
            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="truncate text-ui font-bold text-ink">{c.name}</span>
                <span className="flex-none text-meta text-ink-soft">{pct(c.percent)}%</span>
              </div>
              <div aria-hidden="true" className="mt-1 h-2 rounded-full bg-sunk">
                <div
                  className="h-full rounded-full bg-cat transition-[width] duration-mid ease-paper"
                  style={{ width: `${top ? ((Number(c.percent) || 0) / top) * 100 : 0}%` }}
                />
              </div>
            </div>
            <b className="font-display text-title font-bold text-ink tabular-nums">
              {peso(share(salary, c.percent))}
            </b>
          </li>
        ))}
        <li className="mt-2 flex items-baseline justify-end gap-3 border-t border-line pt-3">
          <span className="text-label font-bold uppercase tracking-caps text-ink-soft">Total salary</span>
          <b className="font-display text-title font-bold text-lime-deep tabular-nums">{peso(salary)}</b>
        </li>
      </ul>
    )}
    </>
  );
}
