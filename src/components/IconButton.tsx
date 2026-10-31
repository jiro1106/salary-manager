import { forwardRef } from "react";
import type { ReactNode } from "react";

interface IconButtonProps {
  label: string;
  onClick: () => void;
  /** Sitting on card, or on a category's own colour. */
  tone?: "card" | "colour";
  /** Destructive controls sit in the loss red, so a delete reads as one before it is pointed at. */
  danger?: boolean;
  className?: string;
  /** Set when the button opens a menu: whether that menu is open. */
  expanded?: boolean;
  children: ReactNode;
}

/**
 * An icon-only control that is genuinely 44x44. The box is the target;
 * the negative margin pulls the surrounding layout back to the spacing
 * the icon alone would have taken, so the card stays tight while the
 * hit area stays honest.
 *
 * The target is invisible, and it has to stay that way: a wash painted
 * across the full 44px runs under whatever sits beside it — the pull-back
 * is 10px against a 9px gap, so the box literally starts a pixel inside
 * the neighbouring field — and the control reads as a slab hitting the
 * chip rather than a mark being pointed at. The visible tile is 30px,
 * centred in the target, and the focus ring is drawn on it too so the
 * ring and the wash agree on where the control is.
 */
const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, onClick, tone = "card", danger = false, className = "", expanded, children },
  ref,
) {
  // Full-opacity ink on colour: 80% measures 2.9:1 and fails the non-text
  // contrast rule.
  const ink =
    tone === "colour"
      ? "text-on-color"
      : danger
        ? "text-spent"
        : "text-ink-soft hover:text-ink";

  const wash =
    tone === "colour"
      ? "group-hover/icon:bg-wash-color"
      : "group-hover/icon:bg-wash-ink";

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-haspopup={expanded === undefined ? undefined : "menu"}
      aria-expanded={expanded}
      title={label}
      className={[
        "group/icon inline-grid place-items-center min-w-hit min-h-hit -m-2.5",
        "shrink-0 rounded-control transition-colors duration-fast ease-paper",
        // the ring moves to the tile below, so it traces what is lit
        "focus-visible:outline-none",
        ink,
        className,
      ].join(" ")}
    >
      <span
        className={[
          "grid h-[30px] w-[30px] place-items-center rounded-control",
          "transition-colors duration-fast ease-paper",
          wash,
          "group-focus-visible/icon:outline group-focus-visible/icon:outline-[3px]",
          "group-focus-visible/icon:outline-blue group-focus-visible/icon:outline-offset-[3px]",
        ].join(" ")}
      >
        {children}
      </span>
    </button>
  );
});

export default IconButton;
