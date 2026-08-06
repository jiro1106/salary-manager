import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { Category } from "../types";
import { pct } from "../lib/format";

interface CutDialProps {
  segments: Category[];
  totalPercent: number;
}

interface Slice {
  key: string;
  from: number;
  to: number;
  color: string;
}

/**
 * The cumulative from/to breakpoints for each wedge, in percent (0-100),
 * plus the unassigned remainder. This is the "target" shape; the wedges
 * animate toward it in `useEasedSlices` rather than snapping straight to it.
 */
function buildSlices(segments: Category[]): Slice[] {
  const slices: Slice[] = [];
  let cursor = 0;

  for (const seg of segments) {
    if (cursor >= 100) break; // over-allocated: the ring stays closed
    const end = Math.min(cursor + (Number(seg.percent) || 0), 100);
    if (end > cursor) slices.push({ key: seg.id, from: cursor, to: end, color: seg.color });
    cursor = end;
  }

  if (cursor < 100) {
    slices.push({ key: "unassigned", from: cursor, to: 100, color: "var(--sunk-deep)" });
  }

  return slices;
}

function sliceStyle(slice: Slice): CSSProperties {
  const startDeg = slice.from * 3.6;
  const sweepDeg = slice.to * 3.6 - startDeg;
  return {
    background: `conic-gradient(from ${startDeg}deg, ${slice.color} 0 ${sweepDeg}deg, transparent ${sweepDeg}deg)`,
  };
}

function depKey(slices: Slice[]): string {
  return slices.map((s) => `${s.key}:${s.from.toFixed(2)}:${s.to.toFixed(2)}:${s.color}`).join("|");
}

// Close approximation of --ease (cubic-bezier(.22,1,.36,1)) for a JS tween.
function easeOutQuint(t: number): number {
  return 1 - Math.pow(1 - t, 5);
}

const TWEEN_MS = 240;

/**
 * Eases the wedge breakpoints toward `target` instead of snapping, so a
 * percent edit anywhere on the page reads as the cut circle re-cutting
 * itself rather than a chart redrawing. Wedges are matched by key; if the
 * set of keys changes (a category added or removed) there's no sensible
 * prior position to ease from, so that update snaps.
 */
function useEasedSlices(target: Slice[]): Slice[] {
  const [rendered, setRendered] = useState<Slice[]>(target);
  const fromRef = useRef<Slice[]>(target);
  const rafRef = useRef<number>();
  const key = depKey(target);

  useEffect(() => {
    const from = fromRef.current;
    const byKeyFrom = new Map(from.map((s) => [s.key, s]));
    const sameShape =
      target.length === from.length && target.every((s) => byKeyFrom.has(s.key));

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!sameShape || reduceMotion) {
      fromRef.current = target;
      setRendered(target);
      return;
    }

    const start = performance.now();

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / TWEEN_MS);
      const eased = easeOutQuint(t);
      setRendered(
        target.map((s) => {
          const prev = byKeyFrom.get(s.key)!;
          return {
            ...s,
            from: prev.from + (s.from - prev.from) * eased,
            to: prev.to + (s.to - prev.to) * eased,
          };
        }),
      );
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        fromRef.current = target;
      }
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return rendered;
}

export default function CutDial({ segments, totalPercent }: CutDialProps) {
  const isOver = totalPercent > 100;
  const slices = useEasedSlices(buildSlices(segments));

  const figure = `${pct(totalPercent)}%`;
  // A runaway total (someone types 9999 into a share field) would otherwise
  // run straight off the disc, so the figure steps down instead of clipping.
  const figureSize = figure.length > 5 ? "text-title" : "text-total";

  return (
    <div
      className="relative aspect-square w-dial max-[700px]:w-[min(100%,190px)]"
      role="img"
      aria-label={
        isOver
          ? `${pct(totalPercent)}% assigned, over by ${pct(totalPercent - 100)}%`
          : `${pct(totalPercent)}% of this payday assigned`
      }
    >
      {slices.map((s) => (
        <i
          key={s.key}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-full"
          style={sliceStyle(s)}
        />
      ))}

      {/* The total sits on a smaller disc laid over the middle, not a hole.
          The disc is sized off the figure rather than the other way round:
          --dial is a fixed px measure but the figure is in rem, so a reader
          running a larger root font grows the text inside a disc that does
          not grow with it. 21% leaves the widest figure the size guard
          allows room to sit inside the white rather than on the cut. */}
      <span className="absolute inset-[21%] grid place-content-center rounded-full bg-card px-1 text-center">
        <b
          className={[
            "font-display font-extrabold leading-none",
            figureSize,
            isOver ? "text-clay-edge" : "text-ink",
          ].join(" ")}
        >
          {figure}
        </b>
        {isOver ? (
          <small className="mt-1 whitespace-nowrap text-label tracking-normal text-clay-edge">
            over by {pct(totalPercent - 100)}%
          </small>
        ) : (
          <small className="mt-1 whitespace-nowrap text-label uppercase tracking-caps-tight text-ink-soft">
            assigned
          </small>
        )}
      </span>
    </div>
  );
}
