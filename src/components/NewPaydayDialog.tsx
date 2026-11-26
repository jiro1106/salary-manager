import { useId, useLayoutEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { commaEdit, formatWithCommas } from "../lib/numberInput";
import Button from "./Button";
import Modal from "./Modal";

interface NewPaydayDialogProps {
  salary: number;
  onConfirm: (salary: number) => void;
  onCancel: () => void;
}

/** Asks for the new payday's salary, starting from the current one. The field matches the Salary tab's. */
export default function NewPaydayDialog({ salary, onConfirm, onCancel }: NewPaydayDialogProps) {
  const [raw, setRaw] = useState(salary ? String(salary) : "");
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const caretRef = useRef<number | null>(null);
  const titleId = useId();
  const descriptionId = useId();
  const fieldId = useId();
  const errorId = useId();

  useLayoutEffect(() => {
    if (inputRef.current && caretRef.current !== null) {
      inputRef.current.setSelectionRange(caretRef.current, caretRef.current);
      caretRef.current = null;
    }
  });

  // The field only accepts digits and one point, so the one way left to be
  // invalid is nothing, or nothing but zeros.
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = Number(raw);
    if (!value) return setError(true);
    onConfirm(value);
  };

  const blank = raw === "" || Number(raw) === 0;

  return (
    <Modal role="dialog" labelledBy={titleId} describedBy={descriptionId} initialFocus={inputRef} onClose={onCancel}>
      <h2 id={titleId} className="font-display text-title font-bold text-ink">Start new payday</h2>
      <p id={descriptionId} className="mt-2 text-meta text-ink-soft">Current expenses move to Past paydays.</p>
      <form className="mt-5" onSubmit={submit} noValidate>
        <label htmlFor={fieldId} className="text-label uppercase tracking-caps text-ink-soft">
          Salary
        </label>
        <span
          className={[
            "mt-1 flex h-hit w-full items-center rounded-slab bg-sunk border-b-[3px] border-zest-deep px-4",
            "font-display text-hero font-extrabold",
            "focus-within:outline focus-within:outline-[3px] focus-within:outline-blue focus-within:outline-offset-[3px]",
            blank ? "text-ink-faint" : "text-ink",
          ].join(" ")}
        >
          <span aria-hidden="true" className={`mr-[0.1em] ${blank ? "text-ink-faint" : "text-action-edge"}`}>₱</span>
          <input
            ref={inputRef}
            id={fieldId}
            type="text"
            inputMode="decimal"
            aria-invalid={error || undefined}
            aria-describedby={error ? errorId : undefined}
            value={formatWithCommas(raw)}
            placeholder="0"
            onChange={(e) => {
              const next = commaEdit(e.target.value, e.target.selectionStart ?? e.target.value.length);
              setRaw(next.raw);
              caretRef.current = next.caret;
              setError(false);
            }}
            className="min-w-0 flex-1 border-0 bg-transparent p-0 text-ellipsis outline-none focus:outline-none placeholder:text-ink-faint"
          />
        </span>
        {error && (
          <p id={errorId} className="mt-2 text-meta text-action-edge">
            Invalid amount. Enter more than ₱0.
          </p>
        )}
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button type="button" variant="alt" small onClick={onCancel}>Cancel</Button>
          <Button type="submit" small>Start new payday</Button>
        </div>
      </form>
    </Modal>
  );
}
