import type { ReactNode } from "react";

interface IconButtonProps {
  label: string;
  onClick: () => void;
  /** Sitting on card, or on a category's own colour. */
  tone?: "card" | "colour";
  /** Destructive controls warm to clay instead of ink. */
  danger?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * An icon-only control that is genuinely 44x44. The box is the target;
 * the negative margin pulls the surrounding layout back to the spacing
 * the icon alone would have taken, so the card stays tight while the
 * hit area stays honest.
 */
export default function IconButton({
  label,
  onClick,
  tone = "card",
  danger = false,
  className = "",
  children,
}: IconButtonProps) {
  // Full-opacity white on colour: 80% white measures 2.9:1 and fails the
  // non-text contrast rule.
  const colours =
    tone === "colour"
      ? "text-on-color hover:bg-wash-color"
      : `text-ink-soft hover:bg-wash-ink ${danger ? "hover:text-clay-edge" : "hover:text-ink"}`;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={[
        "inline-grid place-items-center min-w-hit min-h-hit -m-2.5 shrink-0",
        "rounded-control transition-colors duration-fast ease-paper",
        colours,
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}
