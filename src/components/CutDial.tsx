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
  /**
   * Drag a wedge's outer boundary to set that category's share. Omitted,
   * the dial is the readout it has always been.
   */
  onResize?: (id: string, percent: number) => void;
}

/**
 * Where the readout disc ends, as a fraction of the dial's radius. The
 * disc is `inset-[21%]` of a square, so it reaches 29% of the box width
 * against the ring's 50%. Anything nearer the middle than this is the
 * readout, not a wedge.
 */
const CENTRE = 0.58;

/**
 * Where a drag handle rides, as a fraction of the dial's radius: the
 * middle of the band between the readout disc (0.58) and the outer edge,
 * so the handle sits on the cut it moves rather than beside it.
 */
const RING_MID = 0.79;

/**
 * How far behind a wedge's own start the pointer may fall before the drag
 * is read as having wrapped past twelve o'clock rather than as an attempt
 * to shrink the wedge to nothing. Half the ring: anything nearer than 50%
 * behind the start is a shrink, anything further is a wrap.
 */
const WRAP_GUARD = 50;

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
 *
 * `immediate` is the drag. A tween is what makes a *typed* figure read as
 * the circle re-cutting itself, and it is exactly wrong under a finger:
 * the target moves every frame, so every frame would start a fresh 240ms
 * ease and the wedge would trail the pointer by a fixed lag that never
 * closes. Dragging is direct manipulation, so the cut goes where the
 * pointer is.
 */
function useEasedSlices(target: Slice[], immediate: boolean): Slice[] {
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

    if (!sameShape || reduceMotion || immediate) {
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
  onResize,
}: CutDialProps) {
  const isOver = totalPercent > 100;
  const boxRef = useRef<HTMLDivElement>(null);
  // The id of the category whose boundary is under the finger, and the
  // start angle that boundary is measured from. The start is taken off the
  // target slices rather than the eased ones, so a drag begun mid-tween
  // measures against where the wedge is going, not against the frame it
  // happened to start on.
  const [dragging, setDragging] = useState<string | null>(null);
  const dragFrom = useRef(0);

  const target = buildSlices(segments);
  const slices = useEasedSlices(target, dragging !== null);

  const figure = `${pct(totalPercent)}%`;
  // A runaway total (someone types 9999 into a share field) would otherwise
  // run straight off the disc, so the figure steps down instead of clipping.
  const figureSize = figure.length > 5 ? "text-title" : "text-total";

  const active = segments.find((s) => s.id === activeId) ?? null;
  const activeFigure = active
    ? pesoRound((salary * (Number(active.percent) || 0)) / 100)
    : "";

  /**
   * Pointer position as a share of the ring, 0 at twelve o'clock and
   * running clockwise, matching `from 0deg` on the gradients. Distance
   * from the centre is deliberately not consulted: a drag that strays
   * outside the ring or into the readout disc is still a drag, and the
   * angle is the only part of it that means anything.
   */
  const percentAt = (
    e: { clientX: number; clientY: number },
    box: DOMRect,
  ): number => {
    const radius = box.width / 2;
    const dx = e.clientX - box.left - radius;
    const dy = e.clientY - box.top - radius;
    return (((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360) / 3.6;
  };

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
    const reach =
      Math.hypot(
        e.clientX - box.left - radius,
        e.clientY - box.top - radius,
      ) / radius;
    if (reach > 1 || reach < CENTRE) return null;

    const at = percentAt(e, box);
    const hit = slices.find((s) => at >= s.from && at < s.to);
    return hit && hit.key !== "unassigned" ? hit.key : null;
  };

  /**
   * A wedge's share, from where its outer boundary was dropped. `from` is
   * fixed for the length of the drag — every category before this one is
   * untouched — so the whole gesture is one subtraction.
   *
   * Clamped into the ring at both ends. Zero is the floor for the same
   * reason it is everywhere else on this page; 100 - from is the ceiling
   * because the ring holds exactly one payday and a wedge cannot be given
   * more of it than is left. That ceiling is **not** the over-allocation
   * clamp this app refuses: the share fields stay unclamped and the total
   * still runs past 100 and is still reported. It is only that a circle
   * cannot draw 130% of itself, so the gesture that draws stops at the
   * edge while the gesture that types does not.
   */
  const spanTo = (at: number, from: number): number => {
    let span = at - from;
    // The pointer has crossed twelve, wrapping the angle back to nearly
    // zero. Without this a wedge dragged the long way round collapses
    // instead of filling; with it, only the last WRAP_GUARD behind the
    // start still reads as a shrink to nothing.
    if (span < -WRAP_GUARD) span += 100;
    return Math.max(0, Math.min(100 - from, Math.round(span)));
  };

  const startDrag = (e: React.PointerEvent<HTMLButtonElement>, id: string) => {
    if (!onResize) return;
    // The handle keeps the pointer for the whole gesture, so a finger that
    // runs off the dial (or off the page) still steers the wedge it grabbed.
    e.currentTarget.setPointerCapture(e.pointerId);
    dragFrom.current = target.find((s) => s.key === id)?.from ?? 0;
    setDragging(id);
    onHover(id);
  };

  const onDrag = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragging || !onResize) return;
    const box = boxRef.current?.getBoundingClientRect();
    if (!box) return;
    onResize(dragging, spanTo(percentAt(e, box), dragFrom.current));
  };

  const endDrag = () => setDragging(null);

  /**
   * The grips to draw. One per drawn wedge, plus the wedge being dragged
   * if the drag has just taken it to nothing — a zero-width wedge has no
   * slice, so its grip would unmount mid-gesture, and unmounting the
   * element that holds the pointer capture ends the drag at exactly the
   * moment the reader is most likely to want to pull the wedge back out.
   * The stand-in sits on the wedge's own start, which is where a wedge of
   * no width begins and ends.
   */
  const grips = slices.filter((s) => s.key !== "unassigned");
  if (dragging !== null && !grips.some((g) => g.key === dragging)) {
    grips.push({
      key: dragging,
      from: dragFrom.current,
      to: dragFrom.current,
      color: "transparent",
    });
  }

  /**
   * The same edit from the keyboard, in the same strides a share chip
   * takes: 1 a press, 10 with Shift. Both axes are live because a wedge
   * has no axis — the boundary travels round a circle, so up and right
   * both mean "more" and the reader should not have to work out which one
   * this control decided on.
   */
  const onHandleKey = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    id: string,
    from: number,
    current: number,
  ) => {
    if (!onResize) return;
    const dir =
      e.key === "ArrowUp" || e.key === "ArrowRight"
        ? 1
        : e.key === "ArrowDown" || e.key === "ArrowLeft"
          ? -1
          : 0;
    if (dir === 0) return;
    e.preventDefault();
    const stepped = Math.round(current) + dir * (e.shiftKey ? 10 : 1);
    onResize(id, Math.max(0, Math.min(100 - from, stepped)));
  };

  return (
    <div
      ref={boxRef}
      className="relative aspect-square w-dial max-[700px]:w-[min(100%,190px)]"
      // An image when it only reports and a group when it can be edited:
      // role="img" makes everything inside it presentational, which would
      // hide the handles from the reader who most needs to find them.
      role={onResize ? "group" : "img"}
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
      //
      // All four stand down mid-drag. The handle holds the pointer, but
      // these still see the bubbled moves, and a drag that swings across
      // a neighbour would otherwise hand the readout to the wedge the
      // pointer is passing over rather than the one it is moving.
      onPointerDown={(e) => {
        if (dragging) return;
        onHover(wedgeAt(e, e.currentTarget.getBoundingClientRect()));
      }}
      onPointerMove={(e) => {
        if (dragging) return;
        onHover(wedgeAt(e, e.currentTarget.getBoundingClientRect()));
      }}
      onPointerLeave={() => {
        if (dragging) return;
        onHover(null);
      }}
      onPointerCancel={() => {
        if (dragging) return;
        onHover(null);
      }}
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

      {/* One grip per wedge, sitting on its outer cut — the boundary it
          moves, not a knob parked beside it. Positioned off the *eased*
          angle so a grip rides its own wedge through a tween instead of
          waiting at the destination.

          Only drawn wedges get one, which has two consequences worth
          knowing. A category at 0% has no wedge and so no grip: it would
          land exactly on its neighbour's and neither could be picked up,
          and a share is started by typing rather than by finding a
          zero-width target. And once the split runs past 100 the wedges
          past the edge are not drawn either, so what stays draggable is
          what is still on the ring — which is also what you would drag to
          bring the total back down. */}
      {onResize &&
        grips.map((s) => {
          const seg = segments.find((x) => x.id === s.key);
          if (!seg) return null;

          const theta = (s.to * 3.6 * Math.PI) / 180;
          const from = target.find((t) => t.key === s.key)?.from ?? 0;

          return (
            <button
              key={`grip-${s.key}`}
              type="button"
              // A real slider, not a mouse-only affordance: it carries the
              // value it sets, and the arrow keys below set it. The share
              // chip on the card edits the same figure, but a control that
              // can only be dragged is not one every reader has.
              role="slider"
              aria-label={`${seg.name}: share of this payday`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(Number(seg.percent) || 0)}
              aria-valuetext={`${pct(seg.percent)}%`}
              onPointerDown={(e) => startDrag(e, s.key)}
              onPointerMove={onDrag}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              onKeyDown={(e) => onHandleKey(e, s.key, from, seg.percent)}
              onFocus={() => onHover(s.key)}
              onBlur={() => onHover(null)}
              className={[
                // Above both the wedges and the readout disc, though it
                // never reaches the disc: RING_MID puts it in the band.
                "absolute z-[3] grid h-6 w-6 place-items-center rounded-full",
                "-translate-x-1/2 -translate-y-1/2",
                // Without this the browser claims the gesture for a page
                // scroll the moment a finger moves vertically, which on a
                // dial is most of the useful travel.
                "touch-none cursor-grab active:cursor-grabbing",
              ].join(" ")}
              // Genuinely dynamic: the grip's position is the wedge's own
              // eased angle, in the same trigonometry the gradients run on.
              style={{
                left: `${50 + 50 * RING_MID * Math.sin(theta)}%`,
                top: `${50 - 50 * RING_MID * Math.cos(theta)}%`,
              }}
            >
              {/* The visible grip is smaller than the target around it,
                  the same trade every other control here makes. It is a
                  white chip wearing the field ring, because it is a
                  control on a coloured ground and that is what those look
                  like on this page. */}
              <span
                aria-hidden="true"
                className="h-[14px] w-[14px] rounded-full bg-card shadow-field"
              />
            </button>
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
                  isOver ? "text-action-edge" : "text-ink",
                ].join(" ")}
              >
                {figure}
              </b>
              {isOver ? (
                <small className="mt-1 whitespace-nowrap text-label tracking-normal text-action-edge">
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
