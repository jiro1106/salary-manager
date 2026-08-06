import { useRef, useState } from "react";
import { Pencil } from "lucide-react";

interface EditableNameProps {
  value: string;
  onChange: (value: string) => void;
  /** Named for the screen reader: "Rename Needs". */
  label: string;
  /** Type and colour for the name itself, editing or not. */
  className?: string;
  /** On a category ground the pencil is white, not ink. */
  tone?: "card" | "colour";
}

/**
 * A name that reads as text and becomes a field on click, committing on
 * blur or Enter and reverting on Escape. Used at both levels: a
 * sub-item name left as a permanently open input makes the whole card
 * read as a form at rest.
 */
export default function EditableName({
  value,
  onChange,
  label,
  className = "",
  tone = "card",
}: EditableNameProps) {
  const [editing, setEditing] = useState(false);
  // What to put back if the edit is abandoned.
  const snapshot = useRef(value);

  if (editing) {
    return (
      <input
        autoFocus
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={(e) => e.currentTarget.select()}
        onBlur={() => setEditing(false)}
        onKeyDown={(e) => {
          if (e.key === "Enter") setEditing(false);
          if (e.key === "Escape") {
            onChange(snapshot.current);
            setEditing(false);
          }
        }}
        className={[
          "min-w-0 flex-1 bg-transparent border-0 p-0 outline-none",
          "underline decoration-2 underline-offset-4 decoration-current",
          className,
        ].join(" ")}
      />
    );
  }

  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => {
        snapshot.current = value;
        setEditing(true);
      }}
      className={[
        "group flex min-w-0 flex-1 items-center gap-2 text-left min-h-hit -my-2.5",
        className,
      ].join(" ")}
    >
      <span className="truncate">{value}</span>
      <Pencil
        size={13}
        aria-hidden="true"
        strokeWidth={1.8}
        className={[
          "shrink-0 transition-colors duration-fast ease-paper",
          // Never faded: a dimmed icon on a category ground measures
          // 2.9:1, and a dimmed one on card is no better. The affordance
          // is the pencil itself, at full strength.
          tone === "colour"
            ? "text-on-color"
            : "text-ink-soft group-hover:text-ink",
        ].join(" ")}
      />
    </button>
  );
}
