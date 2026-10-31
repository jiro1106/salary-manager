import { useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import Button from "./Button";
import { Field, fieldClass } from "./ExpenseDialog";
import Modal from "./Modal";

interface CategoryDialogProps {
  name: string;
  onClose: () => void;
  onSave: (name: string) => void;
}

/** Renames a category. Opened from the card's ⋯ menu. */
export default function CategoryDialog({ name, onClose, onSave }: CategoryDialogProps) {
  const [draft, setDraft] = useState(name);
  const [error, setError] = useState<string>();
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const nameId = useId();

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) {
      setError("Give the category a name.");
      return;
    }
    onSave(trimmed);
    onClose();
  };

  return (
    <Modal role="dialog" labelledBy={titleId} initialFocus={inputRef} onClose={onClose}>
      <h2 id={titleId} className="font-display text-title font-bold text-ink">Edit category</h2>
      <form className="mt-4 grid gap-4" onSubmit={submit} noValidate>
        <Field id={nameId} label="Name" error={error}>
          <input
            ref={inputRef}
            id={`${nameId}-field`}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${nameId}-error` : undefined}
            className={fieldClass}
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              setError(undefined);
            }}
            onFocus={(event) => event.currentTarget.select()}
          />
        </Field>
        <div className="flex flex-wrap justify-end gap-3 pt-2">
          <Button variant="alt" small onClick={onClose}>Cancel</Button>
          <Button type="submit" small>Save changes</Button>
        </div>
      </form>
    </Modal>
  );
}
