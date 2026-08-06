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
          "min-w-0 flex-1 border-0 outline-none rounded-control",
          // A field, drawn the way every other field on the page is: white
          // ground, the same inset grey boundary, the control radius. This
          // replaced an underline — with a box around it the rule was a
          // second mark saying the same thing, and on a category head it
          // was the only mark, which made the one place a name is editable
          // on colour look unlike every field beside it.
          "bg-card text-ink shadow-field",
          // Padding cancelled by an equal negative margin, so the padded
          // box grows *outward* from where the text already sat. The
          // glyphs do not move when the button becomes the field — only
          // the boundary appears around them. Both grounds have the room:
          // the category head clears the icon tile's 11px gap, and a sub
          // row sits inside the card's 22px.
          "px-2 py-1 -mx-2 -my-1",
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
