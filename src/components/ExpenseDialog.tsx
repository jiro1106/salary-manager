import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import type { Category, ExpenseDraft, ExpenseErrors } from "../types";
import { amountError } from "../lib/expenses";
import Button from "./Button";

interface ExpenseDialogProps {
  categories: Category[];
  onClose: () => void;
  onSubmit: (draft: ExpenseDraft) => ExpenseErrors;
}

const emptyDraft: ExpenseDraft = { title: "", amount: "", categoryId: "" };
const fieldClass = "mt-1 h-control w-full rounded-control bg-sunk px-3 text-ink shadow-field aria-[invalid=true]:shadow-field-error";
// Letters never reach the field; a leading minus does, so the reader is told why it is refused.
const amountChars = (raw: string) => raw.replace(/[^\d.-]/g, "").replace(/(?!^)-/g, "");

export default function ExpenseDialog({ categories, onClose, onSubmit }: ExpenseDialogProps) {
  const [draft, setDraft] = useState<ExpenseDraft>(emptyDraft);
  const [errors, setErrors] = useState<ExpenseErrors>({});
  const panelRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const amountId = useId();
  const categoryId = useId();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    titleRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
        'input:not(:disabled), select:not(:disabled), button:not(:disabled)',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      opener?.focus();
    };
  }, []);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = onSubmit(draft);
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;
    setDraft(emptyDraft);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim px-page-x py-4" onClick={onClose}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onClick={(event) => event.stopPropagation()}
        className="max-h-[calc(100dvh-2rem)] w-full max-w-dialog overflow-y-auto rounded-slab border border-line bg-card px-[26px] py-6"
      >
        <h2 id={titleId} className="font-display text-title font-bold text-ink">Add expense</h2>
        <p id={descriptionId} className="mt-2 text-meta text-ink-soft">Record spending against your salary.</p>
        <form className="mt-5 space-y-4" onSubmit={submit} noValidate>
          <div>
            <label htmlFor={`${titleId}-field`} className="text-meta font-bold text-ink">Title</label>
            <input
              ref={titleRef}
              id={`${titleId}-field`}
              type="text"
              value={draft.title}
              onChange={(event) => {
                setDraft({ ...draft, title: event.target.value });
                setErrors({ ...errors, title: undefined });
              }}
              aria-invalid={errors.title ? true : undefined}
              aria-describedby={errors.title ? `${titleId}-error` : undefined}
              className={fieldClass}
            />
            {errors.title && <p id={`${titleId}-error`} className="mt-1 text-meta text-action-edge">{errors.title}</p>}
          </div>
          <div>
            <label htmlFor={`${amountId}-field`} className="text-meta font-bold text-ink">Amount</label>
            <input
              id={`${amountId}-field`}
              type="text"
              inputMode="decimal"
              value={draft.amount}
              onChange={(event) => {
                const amount = amountChars(event.target.value);
                setDraft({ ...draft, amount });
                setErrors({ ...errors, amount: amount ? amountError(amount) : undefined });
              }}
              aria-invalid={errors.amount ? true : undefined}
              aria-describedby={errors.amount ? `${amountId}-error` : undefined}
              className={fieldClass}
            />
            {errors.amount && <p id={`${amountId}-error`} className="mt-1 text-meta text-action-edge">{errors.amount}</p>}
          </div>
          <div>
            <label htmlFor={`${categoryId}-field`} className="text-meta font-bold text-ink">Category</label>
            <div className="relative">
              <select
                id={`${categoryId}-field`}
                value={draft.categoryId}
                onChange={(event) => {
                  setDraft({ ...draft, categoryId: event.target.value });
                  setErrors({ ...errors, categoryId: undefined });
                }}
                aria-invalid={errors.categoryId ? true : undefined}
                aria-describedby={errors.categoryId ? `${categoryId}-error` : undefined}
                className={`${fieldClass} appearance-none pr-10`}
              >
                <option value="">Choose a category</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
              <ChevronDown aria-hidden="true" size={18} strokeWidth={2} className="pointer-events-none absolute right-3 top-1/2 mt-0.5 -translate-y-1/2 text-ink-soft" />
            </div>
            {errors.categoryId && <p id={`${categoryId}-error`} className="mt-1 text-meta text-action-edge">{errors.categoryId}</p>}
          </div>
          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <Button variant="alt" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save expense</Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
