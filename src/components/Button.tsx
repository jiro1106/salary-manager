import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "saved" | "alt";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  /** In-card actions, 13px on tighter padding. */
  small?: boolean;
  /** The template you are already on: ringed, inert, and says so. */
  inert?: boolean;
  children: ReactNode;
}

// The one place elevation survives: a solid, unblurred edge under the
// button, which grows on hover and disappears as the button travels down
// onto it when pressed. Colour never animates; position does.
const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-clay text-on-color shadow-action hover:shadow-action-lift active:shadow-action-press",
  saved:
    "bg-blue text-on-color shadow-action-blue hover:shadow-action-blue-lift active:shadow-action-blue-press",
  alt: "bg-card text-ink shadow-alt hover:shadow-alt-lift active:shadow-alt-press",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", small = false, inert = false, className = "", children, onClick, ...rest },
  ref,
) {
  const shape = inert
    ? "bg-transparent text-ink-soft shadow-inert cursor-default"
    : `${VARIANTS[variant]} hover:-translate-y-0.5 active:translate-y-1`;

  return (
    <button
      ref={ref}
      type="button"
      aria-disabled={inert || undefined}
      onClick={inert ? undefined : onClick}
      {...rest}
      className={[
        "inline-flex items-center justify-center gap-[9px] rounded-control",
        "font-display font-extrabold leading-none",
        "transition-[transform,box-shadow] duration-fast ease-paper",
        // Full size has one consumer, the Save button, where it sits
        // opposite the payday field. At px-7 the two came out the same
        // width and the action out-weighed the figure it acts on, so the
        // padding came in. The height is h-control rather than a py pair
        // because the field it has to match cannot be sized by padding at
        // all; see --control-h. Don't put py-* back alongside it.
        small ? "px-5 py-3 text-meta" : "h-control px-6 text-ui",
        shape,
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
});

export default Button;
