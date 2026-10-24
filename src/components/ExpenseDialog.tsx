import { useId, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import type { Category, Expense, ExpenseDraft, ExpenseErrors } from "../types";
import { amountError } from "../lib/expenses";
import Button from "./Button";
import Modal from "./Modal";

interface ExpenseDialogProps {
  categories: Category[];
  /** Opens the dialog on this expense to edit it, instead of a blank one. */
  expense?: Expense;
  onClose: () => void;
  onSubmit: (draft: ExpenseDraft) => ExpenseErrors;
}

const emptyDraft: ExpenseDraft = { title: "", amount: "", categoryId: "" };
const fieldClass = "mt-1 h-control w-full rounded-control bg-sunk px-3 text-ink shadow-field aria-[invalid=true]:shadow-field-error";
// Letters never reach the field; a leading minus does, so the reader is told why it is refused.
const amountChars = (raw: string) => raw.replace(/[^\d.-]/g, "").replace(/(?!^)-/g, "");

/** The id, invalid flag and error link a control needs to pair with its Field. */
const controlProps = (id: string, error?: string) => ({
  id: `${id}-field`,
  "aria-invalid": error ? true : undefined,
  "aria-describedby": error ? `${id}-error` : undefined,
});

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={`${id}-field`} className="text-meta font-bold text-ink">{label}</label>
      {children}
      {error && <p id={`${id}-error`} className="mt-1 text-meta text-action-edge">{error}</p>}
    </div>
  );
}

export default function ExpenseDialog({ categories, expense, onClose, onSubmit }: ExpenseDialogProps) {
  const [draft, setDraft] = useState<ExpenseDraft>(
    expense ? { title: expense.title, amount: String(expense.amount), categoryId: expense.categoryId } : emptyDraft,
  );
  const [errors, setErrors] = useState<ExpenseErrors>({});
  const titleRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const amountId = useId();
  const categoryId = useId();

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = onSubmit(draft);
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;
    onClose();
  };

  return (
    <Modal role="dialog" labelledBy={titleId} describedBy={descriptionId} initialFocus={titleRef} onClose={onClose}>
      <h2 id={titleId} className="font-display text-title font-bold text-ink">{expense ? "Edit expense" : "Add expense"}</h2>
      <p id={descriptionId} className="mt-2 text-meta text-ink-soft">Record spending against your salary.</p>
      <form className="mt-5 space-y-4" onSubmit={submit} noValidate>
        <Field id={titleId} label="Title" error={errors.title}>
          <input
            ref={titleRef}
            {...controlProps(titleId, errors.title)}
            type="text"
            value={draft.title}
            onChange={(event) => {
              setDraft({ ...draft, title: event.target.value });
              setErrors({ ...errors, title: undefined });
            }}
            className={fieldClass}
          />
        </Field>
        <Field id={amountId} label="Amount" error={errors.amount}>
          <input
            {...controlProps(amountId, errors.amount)}
            type="text"
            inputMode="decimal"
            value={draft.amount}
            onChange={(event) => {
              const amount = amountChars(event.target.value);
              setDraft({ ...draft, amount });
              setErrors({ ...errors, amount: amount ? amountError(amount) : undefined });
            }}
            className={fieldClass}
          />
        </Field>
        <Field id={categoryId} label="Category" error={errors.categoryId}>
          <div className="relative">
            <select
              {...controlProps(categoryId, errors.categoryId)}
              value={draft.categoryId}
              onChange={(event) => {
                setDraft({ ...draft, categoryId: event.target.value });
                setErrors({ ...errors, categoryId: undefined });
              }}
              className={`${fieldClass} appearance-none pr-10`}
            >
              <option value="">Choose a category</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
            <ChevronDown aria-hidden="true" size={18} strokeWidth={2} className="pointer-events-none absolute right-3 top-1/2 mt-0.5 -translate-y-1/2 text-ink-soft" />
          </div>
        </Field>
        <div className="flex flex-wrap justify-end gap-3 pt-2">
          <Button variant="alt" onClick={onClose}>Cancel</Button>
          <Button type="submit">{expense ? "Save changes" : "Save expense"}</Button>
        </div>
      </form>
    </Modal>
  );
}
