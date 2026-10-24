import { useId, useRef } from "react";
import Button from "./Button";
import Modal from "./Modal";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** The confirm erases data rather than replacing it. */
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Reserved for acts that take more than the reader is looking at, or
 * that nothing restores: deleting a category (it takes every item under
 * it), deleting an expense, and resetting all data. It is not a
 * substitute for inline design anywhere else.
 */
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descId = useId();

  if (!open) return null;

  return (
    // Pointed at the real nodes rather than an aria-label carrying a copy
    // of the title. Every one of these dialogs guards something that
    // cannot be undone, and the consequence lives in the description —
    // with a label alone that line is never read out.
    <Modal
      role="alertdialog"
      labelledBy={titleId}
      describedBy={description ? descId : undefined}
      initialFocus={cancelRef}
      onClose={onCancel}
    >
      <p id={titleId} className="font-display text-title font-bold text-ink">
        {title}
      </p>
      {description && (
        <p id={descId} className="mt-2 text-meta text-ink-soft">
          {description}
        </p>
      )}
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <Button ref={cancelRef} variant="alt" small onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button variant={danger ? "danger" : "primary"} small onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
