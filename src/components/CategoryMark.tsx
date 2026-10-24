import type { CSSProperties, ReactNode } from "react";
import type { Category } from "../types";
import { iconOf } from "../lib/icons";

interface CategoryMarkProps {
  /** Omitted for a deleted category: an empty sunk tile. */
  icon?: Category["icon"];
  /** Sets `--c` on the tile; leave out when an ancestor already does. */
  color?: string;
  /** 22px for the template list, 28px everywhere else. */
  small?: boolean;
  /** Badges pinned to the tile, like the legend's crown. */
  children?: ReactNode;
}

/** A category's icon on a tile of its own ink. Decorative: the name always sits beside it. */
export default function CategoryMark({ icon, color, small = false, children }: CategoryMarkProps) {
  const Icon = icon && iconOf(icon);

  return (
    <span
      aria-hidden="true"
      className={[
        "relative grid flex-none place-items-center rounded-control",
        small ? "h-[22px] w-[22px]" : "h-[28px] w-[28px]",
        Icon ? "bg-cat text-on-color" : "bg-sunk",
      ].join(" ")}
      style={color ? ({ "--c": color } as CSSProperties) : undefined}
    >
      {Icon && <Icon size={small ? 12 : 14} strokeWidth={2} />}
      {children}
    </span>
  );
}
