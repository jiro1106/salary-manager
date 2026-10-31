import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import IconButton from "./IconButton";

interface CategoryMenuProps {
  /** The category's name, for "Edit Needs" / "Delete Needs" labels. */
  name: string;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * The category head's one control: a ⋯ that opens Edit and Delete, so the
 * head carries a single mark on colour instead of two. Keyboard follows
 * the ARIA menu pattern: focus lands on the first item, arrows move,
 * Escape returns to the button.
 */
export default function CategoryMenu({ name, onEdit, onDelete }: CategoryMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (!open) return;
    itemRefs.current[0]?.focus();
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  // Focus goes back to ⋯ before the action runs, so a dialog it opens
  // returns focus there when it closes.
  const choose = (action: () => void) => {
    setOpen(false);
    triggerRef.current?.focus();
    action();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const items = itemRefs.current.filter(Boolean) as HTMLButtonElement[];
    const at = items.indexOf(document.activeElement as HTMLButtonElement);
    const moves: Record<string, number> = {
      ArrowDown: (at + 1) % items.length,
      ArrowUp: (at - 1 + items.length) % items.length,
      Home: 0,
      End: items.length - 1,
    };
    if (event.key in moves) {
      event.preventDefault();
      items[moves[event.key]].focus();
    } else if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    } else if (event.key === "Tab") {
      setOpen(false);
    }
  };

  const item = "flex w-full items-center gap-2 rounded-control px-2 py-1.5 text-left text-meta font-semibold hover:bg-wash-ink focus-visible:bg-wash-ink focus-visible:outline-none";

  return (
    <div ref={rootRef} className="relative">
      <IconButton
        ref={triggerRef}
        label={`Options for ${name}`}
        onClick={() => setOpen((o) => !o)}
        tone="colour"
        expanded={open}
      >
        <MoreHorizontal size={18} strokeWidth={2} aria-hidden="true" />
      </IconButton>

      {open && (
        <div
          role="menu"
          aria-label={`Options for ${name}`}
          onKeyDown={onKeyDown}
          className={[
            "absolute right-0 top-full z-20 mt-2 w-40",
            "rounded-slab border border-line bg-card p-1.5",
            "animate-[nala-reveal_200ms_var(--ease)_both]",
          ].join(" ")}
        >
          <button
            ref={(el) => (itemRefs.current[0] = el)}
            type="button"
            role="menuitem"
            onClick={() => choose(onEdit)}
            className={`${item} text-ink`}
          >
            <Pencil size={14} strokeWidth={1.8} aria-hidden="true" />
            Edit
          </button>
          <button
            ref={(el) => (itemRefs.current[1] = el)}
            type="button"
            role="menuitem"
            onClick={() => choose(onDelete)}
            className={`${item} text-spent`}
          >
            <Trash2 size={14} strokeWidth={1.8} aria-hidden="true" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
