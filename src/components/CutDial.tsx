import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { Category } from "../types";
import { pct, pesoRound } from "../lib/format";

interface CutDialProps {
  segments: Category[];
  totalPercent: number;
  /** The readout in the centre names a category and its share in pesos. */
  salary: number;
  /** Hovered on the ring or in the legend. Owned by the deck above. */
  activeId: string | null;
  onHover: (id: string | null) => void;
}

/**
 * Where the readout disc ends, as a fraction of the dial's radius. The
 * disc is `inset-[21%]` of a square, so it reaches 29% of the box width
 * against the ring's 50%. Anything nearer the middle than this is the
 * readout, not a wedge.
 */
const CENTRE = 0.58;

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

export default function CutDial({
  segments,
  totalPercent,
  salary,
  activeId,
  onHover,
}: CutDialProps) {
  const isOver = totalPercent > 100;
  const slices = useEasedSlices(buildSlices(segments));

  const figure = `${pct(totalPercent)}%`;
  // A runaway total (someone types 9999 into a share field) would otherwise
  // run straight off the disc, so the figure steps down instead of clipping.
  const figureSize = figure.length > 5 ? "text-title" : "text-total";

  const active = segments.find((s) => s.id === activeId) ?? null;
  const activeFigure = active
    ? pesoRound((salary * (Number(active.percent) || 0)) / 100)
    : "";

  /**
   * Which wedge the pointer is over, from its angle and distance rather
   * than from the DOM: every wedge is a full-size layer whose gradient is
   * opaque only across its own arc, so their boxes all sit on top of each
   * other and a hit test on the element would always return the last one.
   * Measured off what is drawn (the eased slices), so a wedge mid-tween
   * answers where it looks, not where it is heading.
   */
  const wedgeAt = (e: { clientX: number; clientY: number }, box: DOMRect) => {
    const radius = box.width / 2;
    const dx = e.clientX - box.left - radius;
    const dy = e.clientY - box.top - radius;
    const reach = Math.hypot(dx, dy) / radius;
    if (reach > 1 || reach < CENTRE) return null;

    // Clockwise from twelve, matching `from 0deg` on the gradients.
    const at = (((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360) / 3.6;
    const hit = slices.find((s) => at >= s.from && at < s.to);
    return hit && hit.key !== "unassigned" ? hit.key : null;
  };

  return (
    <div
      className="relative aspect-square w-dial max-[700px]:w-[min(100%,190px)]"
      role="img"
      aria-label={
        isOver
          ? `${pct(totalPercent)}% assigned, over by ${pct(totalPercent - 100)}%`
          : `${pct(totalPercent)}% of this payday assigned`
      }
      // A finger produces no pointermove before it lands, so touch needs
      // pointerdown or the dial is inert on the device most readers open
      // this on. Nothing latches either way: the wedge is lit while the
      // finger is on it and dark when it lifts, which is the same rule the
      // pointer already follows. Cancel clears it because a drag that
      // turns into a page scroll takes the pointer without a leave.
      onPointerDown={(e) =>
        onHover(wedgeAt(e, e.currentTarget.getBoundingClientRect()))
      }
      onPointerMove={(e) =>
        onHover(wedgeAt(e, e.currentTarget.getBoundingClientRect()))
      }
      onPointerLeave={() => onHover(null)}
      onPointerCancel={() => onHover(null)}
    >
      {slices.map((s) => {
        const isActive = s.key === activeId;

        return (
          <i
            key={s.key}
            aria-hidden="true"
            className={[
              "pointer-events-none absolute inset-0 rounded-full",
              "transition-[transform,opacity] duration-fast ease-paper",
              // Grown from the centre, so the wedge reaches further out
              // while every sweep keeps its exact angles and the ring
              // stays one closed circle. z-index only so it clears its
              // neighbours; the readout disc sits above both.
              isActive ? "z-[1] scale-[1.07]" : "",
              // The rest step back rather than go pale: at 70% the inks
              // still read as themselves, so the ring is one circle with
              // a wedge brought forward, not a chart greying itself out.
              // Includes the unassigned remainder, which is a wedge too.
              activeId !== null && !isActive ? "opacity-70" : "",
            ].join(" ")}
            style={sliceStyle(s)}
          />
        );
      })}

      {/* The total sits on a smaller disc laid over the middle, not a hole.
          The disc is sized off the figure rather than the other way round:
          --dial is a fixed px measure but the figure is in rem, so a reader
          running a larger root font grows the text inside a disc that does
          not grow with it. 21% leaves the widest figure the size guard
          allows room to sit inside the white rather than on the cut. */}
      <span
        className={[
          "absolute inset-[21%] z-[2] flex flex-col items-center justify-center",
          "rounded-full bg-card px-2 text-center",
        ].join(" ")}
      >
        {/* Keyed so each swap plays the reveal rather than the figures
            changing under the reader. The disc holds one thing at a time:
            the whole payday, or the one category being pointed at. */}
        <span
          key={active ? active.id : "total"}
          className="flex max-w-full flex-col items-center animate-[nala-reveal_200ms_var(--ease)_both]"
        >
          {active ? (
            <>
              <span className="max-w-full truncate text-label uppercase tracking-caps-tight text-ink-soft">
                {active.name}
              </span>
              <b
                className={[
                  "mt-1 font-display font-extrabold leading-none text-ink",
                  activeFigure.length > 9 ? "text-ui" : "text-total",
                ].join(" ")}
              >
                {activeFigure}
              </b>
              <small className="mt-1 whitespace-nowrap text-label tracking-normal text-ink-soft">
                {pct(active.percent)}% of payday
              </small>
            </>
          ) : (
            <>
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
            </>
          )}
        </span>
      </span>
    </div>
  );
}
