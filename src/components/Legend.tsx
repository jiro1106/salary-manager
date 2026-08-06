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
              "flex items-center gap-[13px] rounded-control py-[11px]",
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
                "grid h-[28px] w-[28px] flex-none place-items-center",
                "rounded-control bg-cat text-on-color",
              ].join(" ")}
            >
              <Mark size={14} strokeWidth={2} />
            </span>
            <span className="min-w-0 truncate text-body font-bold">
              {seg.name}
            </span>
            {isBiggest && (
              <span className="flex-none inline-flex items-center gap-1 rounded-control bg-ink px-2 py-[3px] text-label font-bold uppercase tracking-tag text-on-color">
                {/* the one gold thing on the page; sand on ink, not on white,
                    which is the only ground it clears */}
                <Crown
                  size={11}
                  strokeWidth={2.4}
                  aria-hidden="true"
                  className="text-sand"
                />
                Biggest
              </span>
            )}
            {/* Floors, not fixed widths. These are the measures the two
                columns line up on, and every realistic figure sits inside
                them, so the common case is identical. But the app caps
                neither the payday nor a share, and a figure wider than a
                fixed box does not clip — right-aligned, the excess hangs
                off the *left*, straight across the name beside it. A floor
                keeps the column and lets the rare ₱1,000,000+ row push
                instead of overlap; the right edges stay aligned either
                way, because the block is what ml-auto pushes. */}
            <span className="ml-auto min-w-[5ch] flex-none text-right text-meta text-ink-soft">
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
          <span className="font-normal text-ink-soft">unassigned</span>
        </span>
      </p>
    </div>
  );
}
