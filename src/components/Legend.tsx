import type { CSSProperties } from "react";
import { Crown } from "lucide-react";
import type { Category } from "../types";
import { pct, pesoRound } from "../lib/format";
import { iconOf } from "../lib/icons";

interface LegendProps {
  segments: Category[];
  salary: number;
  totalPercent: number;
}

export default function Legend({
  segments,
  salary,
  totalPercent,
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

        return (
          <div
            key={seg.id}
            className="flex items-center gap-[13px] py-[11px] [&+&]:border-t [&+&]:border-line"
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
            <span className="ml-auto w-[5ch] flex-none text-right text-meta text-ink-soft">
              {pct(seg.percent)}%
            </span>
            <span className="w-[10ch] flex-none text-right font-display text-title font-bold">
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
