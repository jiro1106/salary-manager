import type { CSSProperties } from "react";
import { Crown } from "lucide-react";
import type { Category } from "../types";
import { pct, pesoRound } from "../lib/format";
import { iconOf } from "../lib/icons";

interface LegendProps {
  segments: Category[];
  salary: number;
  totalPercent: number;
  /** Shared with the dial: whichever category is under the pointer. */
  activeId: string | null;
  onHover: (id: string | null) => void;
}

export default function Legend({
  segments,
  salary,
  totalPercent,
  activeId,
  onHover,
}: LegendProps) {
  const max = segments.reduce((m, s) => Math.max(m, Number(s.percent) || 0), 0);
  // Only the first category to hit the maximum carries the tag.
  let tagged = false;

  const unassigned = Math.max(0, (salary * (100 - totalPercent)) / 100);

  return (
    <div className="min-w-0 max-[700px]:w-full">
      {segments.map((seg) => {
        const isBiggest = !tagged && max > 0 && Number(seg.percent) === max;
        if (isBiggest) tagged = true;
        const Mark = iconOf(seg.icon);

        const isActive = seg.id === activeId;

        return (
          // The row lights its own wedge on hover, and the wedge lights
          // the row back. It stays a plain row rather than a button: the
          // highlight latches onto nothing, so a control here would be one
          // that does nothing when pressed. Every figure the dial's
          // readout shows is printed here permanently anyway, which is
          // what keeps the pointer-only link from hiding anything.
          <div
            key={seg.id}
            onPointerEnter={() => onHover(seg.id)}
            onPointerLeave={() => onHover(null)}
            className={[
              // Below 700px the figures drop to a second line (see the
              // group further down), so the row has to be allowed to wrap.
              // The row gap is set apart from the column gap: 13px between
              // columns is a separator, 13px between the two lines of one
              // row would read as two rows.
              "flex items-center gap-x-[13px] gap-y-1 rounded-control py-[11px]",
              "max-[700px]:flex-wrap",
              // The tint needs room the column does not have, so the row
              // grows into the gutter on both sides and pads its content
              // back to where it was.
              "w-[calc(100%+1rem)] -mx-2 px-2",
              "transition-colors duration-fast ease-paper",
              "[&+&]:border-t [&+&]:border-line",
              isActive ? "bg-wash-ink" : "",
            ].join(" ")}
            style={{ "--c": seg.color } as CSSProperties}
          >
            {/* The same mark the category wears on its card, inverted: the
                card punches a white tile out of the coloured head, the
                legend fills the tile with the ink so the pip still keys to
                its wedge in the dial. Hidden from the reader either way —
                the name is the next node along. */}
            <span
              aria-hidden="true"
              className={[
                "relative grid h-[28px] w-[28px] flex-none place-items-center",
                "rounded-control bg-cat text-on-color",
              ].join(" ")}
            >
              <Mark size={14} strokeWidth={2} />
              {/* The biggest share is crowned on its pip rather than tagged
                  beside its name. A tag is an inline word, and its width came
                  out of the name column on one row only — so the one category
                  that most deserved reading was the one that truncated. On
                  the pip the mark costs the row nothing at any width, and it
                  sits on the object it qualifies: the wedge's key. Sand on
                  ink, not on white, which is the only ground it clears. */}
              {isBiggest && (
                <span className="absolute -right-[5px] -top-[5px] grid h-[15px] w-[15px] place-items-center rounded-full bg-ink">
                  <Crown size={9} strokeWidth={2.6} className="text-zest" />
                </span>
              )}
            </span>
            <span className="min-w-0 flex-1 truncate text-body font-bold">
              {seg.name}
            </span>
            {/* The pip is aria-hidden, so the crown says nothing on its own. */}
            {isBiggest && <span className="sr-only">Biggest</span>}

            {/* Below 700px four columns do not fit: a floor of 5ch plus one
                of 10ch plus the pip and the gaps left the name so little
                that every template name this app ships with truncated to
                two characters. So the percent, and only the percent, drops
                to a second line — it is what the row can spare, because it
                is a description of the category rather than the figure the
                reader came for.

                It goes under the *name*, left, at the pip's 28px plus the
                13px gap, which reads as a subtitle to the thing it
                describes. Two arrangements were tried and reverted: both
                figures wrapped together left the name a line of its own and
                the money a line of its own, which is two rows pretending to
                be one; both wrapped hard right left the percent floating in
                the middle of an otherwise empty line, keyed to nothing.

                The peso never leaves the first line, because it is the
                money column the "unassigned" figure in the foot lines up
                with, and a column that moves at a breakpoint is not one. */}
            {/* Floors, not fixed widths. These are the measures the two
                columns line up on, and every realistic figure sits inside
                them, so the common case is identical. But the app caps
                neither the payday nor a share, and a figure wider than a
                fixed box does not clip — right-aligned, the excess hangs
                off the *left*, straight across whatever is beside it. A
                floor keeps the column and lets the rare ₱1,000,000+ row
                push instead of overlap. */}
            <span
              className={[
                "min-w-[5ch] flex-none text-right text-meta text-ink-soft",
                "max-[700px]:order-last max-[700px]:w-full",
                "max-[700px]:pl-[41px] max-[700px]:text-left",
              ].join(" ")}
            >
              {pct(seg.percent)}%
            </span>
            <span className="min-w-[10ch] flex-none text-right font-display text-title font-bold">
              {pesoRound((salary * (Number(seg.percent) || 0)) / 100)}
            </span>
          </div>
        );
      })}

      <p className="mt-[13px] flex justify-between gap-3 border-t border-line pt-3 text-meta text-ink-soft">
        <span>
          {segments.length} categor{segments.length === 1 ? "y" : "ies"}
        </span>
        <span className="font-display font-bold text-ink">
          {pesoRound(unassigned)}{" "}
          <span className="font-normal text-ink-soft"> unassigned</span>
        </span>
      </p>
    </div>
  );
}
