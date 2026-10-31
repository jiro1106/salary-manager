import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Check, ChevronDown } from "lucide-react";
import type { Category } from "../types";
import CategoryMark from "./CategoryMark";

interface CategoryFilterProps {
  categories: Category[];
  /** null shows every category. */
  value: string | null;
  onChange: (id: string | null) => void;
}

/**
 * A listbox in the page's own chrome instead of a native <select>, whose
 * open menu is drawn by the OS and ignores every token. Keyboard follows
 * the ARIA listbox pattern: arrows move, Enter or Space picks, Escape and
 * Tab close.
 */
export default function CategoryFilter({ categories, value, onChange }: CategoryFilterProps) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  // Index 0 is "All categories"; the rest follow the user's own order.
  const options = [null, ...categories];
  const selectedIndex = Math.max(0, options.findIndex((c) => (c?.id ?? null) === value));
  const selected = options[selectedIndex];

  useEffect(() => {
    if (!open) return;
    listRef.current?.focus();
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  useEffect(() => {
    if (open) document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [open, active, listId]);

  const show = () => {
    setActive(selectedIndex);
    setOpen(true);
  };

  const pick = (index: number) => {
    onChange(options[index]?.id ?? null);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const onTriggerKey = (event: KeyboardEvent) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      show();
    }
  };

  const onListKey = (event: KeyboardEvent) => {
    const last = options.length - 1;
    const moves: Record<string, number> = {
      ArrowDown: Math.min(active + 1, last),
      ArrowUp: Math.max(active - 1, 0),
      Home: 0,
      End: last,
    };
    if (event.key in moves) {
      event.preventDefault();
      setActive(moves[event.key]);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      pick(active);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    } else if (event.key === "Tab") {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={`Filter by category: ${selected?.name ?? "All categories"}`}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={onTriggerKey}
        className={[
          "flex max-w-[16rem] items-center gap-2 rounded-control bg-card py-1.5 pl-1.5 pr-2.5",
          "text-meta font-semibold shadow-inert transition-colors duration-fast ease-paper",
          open ? "text-ink" : "text-ink-soft hover:text-ink",
        ].join(" ")}
      >
        {selected ? (
          <CategoryMark small icon={selected.icon} color={selected.color} />
        ) : (
          <span aria-hidden="true" className="h-[22px] w-[22px] flex-none rounded-control bg-sunk" />
        )}
        <span className="truncate">{selected?.name ?? "All categories"}</span>
        <ChevronDown
          aria-hidden="true"
          size={14}
          strokeWidth={2}
          className={`flex-none transition-transform duration-fast ease-paper ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          tabIndex={-1}
          aria-label="Category"
          aria-activedescendant={`${listId}-${active}`}
          onKeyDown={onListKey}
          className={[
            "absolute right-0 top-full z-20 mt-2 max-h-72 w-52 overflow-y-auto",
            "rounded-slab border border-line bg-card p-1.5",
            "animate-[nala-reveal_200ms_var(--ease)_both] focus-visible:outline-none",
          ].join(" ")}
        >
          {options.map((option, index) => {
            const isSelected = index === selectedIndex;
            return (
              <li
                key={option?.id ?? "all"}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={isSelected}
                onPointerMove={() => setActive(index)}
                onClick={() => pick(index)}
                className={[
                  "flex cursor-pointer items-center gap-2 rounded-control px-2 py-1.5 text-meta",
                  index === active ? "bg-wash-ink" : "",
                  isSelected ? "font-bold text-ink" : "text-ink-soft",
                ].join(" ")}
              >
                {option ? (
                  <CategoryMark small icon={option.icon} color={option.color} />
                ) : (
                  <span aria-hidden="true" className="h-[22px] w-[22px] flex-none rounded-control bg-sunk" />
                )}
                <span className="min-w-0 flex-1 truncate">{option?.name ?? "All categories"}</span>
                {isSelected && <Check aria-hidden="true" size={14} strokeWidth={2.2} className="flex-none" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
