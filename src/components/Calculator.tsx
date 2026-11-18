import { useEffect, useId, useRef, useState } from "react";
import { X } from "lucide-react";
import Button from "./Button";
import IconButton from "./IconButton";
import Modal from "./Modal";
import { EMPTY, evaluate, press, show, sumFor, usable } from "../lib/calculator";
import type { CalcKey } from "../lib/calculator";

// The iOS order, so the keys are where the hand expects them.
const KEYS: CalcKey[] = ["C", "±", "%", "÷", "7", "8", "9", "×", "4", "5", "6", "−", "1", "2", "3", "+", "0", ".", "="];
const LABEL: Partial<Record<CalcKey, string>> = { C: "AC", "±": "+/−" };
const SPOKEN: Partial<Record<CalcKey, string>> = { C: "All clear", "±": "Change sign", "%": "Percent" };

/** Physical keys, read only while focus is inside the calculator. */
const FROM_KEYBOARD: Record<string, CalcKey> = {
  "*": "×", x: "×", "/": "÷", "-": "−", "+": "+", ".": ".", ",": ".", "%": "%",
  "=": "=", Enter: "=", Backspace: "⌫", Delete: "C", c: "C", C: "C",
  ...Object.fromEntries([..."0123456789"].map((d) => [d, d])),
};

// The same query the `narrow:` variant compiles to, inverted.
const WIDE = "(min-width: 700px)";
// A mouse or trackpad, which is what tells a desktop from a tablet.
const MOUSE = "(hover: hover) and (pointer: fine)";

function useMedia(media: string) {
  const [matches, setMatches] = useState(() => matchMedia(media).matches);
  useEffect(() => {
    const query = matchMedia(media);
    const onChange = () => setMatches(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [media]);
  return matches;
}

/**
 * A pocket calculator for sums that are not expenses. Nothing it works
 * out is saved anywhere, and closing it clears it.
 *
 * On a phone it is a dialog like Add expense. From 700px up it floats on
 * the right and is not modal, so the page stays readable and clickable
 * while you work a figure out; from 1480px it clears the 800px column
 * altogether. With a mouse it can be dragged anywhere by its header.
 */
export default function Calculator({ onClose }: { onClose: () => void }) {
  const wide = useMedia(WIDE);
  const draggable = useMedia(MOUSE) && wide;
  const titleId = useId();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  // Null until the first drag; until then the classes place the panel.
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  // ponytail: clamped only while dragging; a window shrunk afterwards can
  // leave the panel partly off screen until it is dragged again.
  const startDrag = (e: React.PointerEvent) => {
    const panel = panelRef.current;
    if (!draggable || !panel || e.button !== 0 || (e.target as HTMLElement).closest("button")) return;
    e.preventDefault(); // no text selection while dragging
    const rect = panel.getBoundingClientRect();
    const dx = e.clientX - rect.left;
    const dy = e.clientY - rect.top;
    const move = (ev: PointerEvent) =>
      setPos({
        x: Math.min(Math.max(0, ev.clientX - dx), window.innerWidth - rect.width),
        y: Math.min(Math.max(0, ev.clientY - dy), window.innerHeight - rect.height),
      });
    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
  };
  const [state, setState] = useState(EMPTY);
  // The sum "=" just worked out, kept so the top line can still show it.
  const [worked, setWorked] = useState("");
  // Why "=" refused to work the sum out, shown until the next key.
  const [error, setError] = useState("");

  const tap = (key: CalcKey) => {
    const next = press(state, key);
    const sum = sumFor(state);
    if (key === "=" && next.done) setWorked(sum);
    const value = key === "=" ? evaluate(sum) : null;
    setError(value === null || usable(value) ? "" : Number.isFinite(value) ? "Too big" : "Can't divide by 0");
    setState(next);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && wide) {
      e.preventDefault();
      onClose();
      return;
    }
    const key = FROM_KEYBOARD[e.key];
    if (!key || e.metaKey || e.ctrlKey || e.altKey) return;
    // Enter would otherwise also click whichever key has focus.
    e.preventDefault();
    tap(key);
  };

  // Modal handles focus on a phone; the floating panel does the same here.
  useEffect(() => {
    if (!wide) return;
    const opener = document.activeElement as HTMLElement | null;
    titleRef.current?.focus();
    return () => opener?.focus?.();
  }, [wide]);

  // The answer shows only after "="; until then the big line is the sum being typed.
  const result = error || (state.done ? show(evaluate(state.expr) ?? 0) : state.expr || "0");

  const body = (
    <div onKeyDown={onKeyDown}>
      <div
        onPointerDown={startDrag}
        className={[
          "flex items-center justify-between",
          draggable ? "cursor-grab select-none active:cursor-grabbing" : "",
        ].join(" ")}
      >
        <h2 id={titleId} ref={titleRef} tabIndex={-1} className="font-display text-title font-bold text-ink outline-none">
          Calculator
        </h2>
        <IconButton label="Close calculator" onClick={onClose}>
          <X size={18} strokeWidth={2} aria-hidden="true" />
        </IconButton>
      </div>

      <div className="mt-4 rounded-control bg-sunk px-4 py-3 text-right">
        <p className="min-h-[1.5em] break-all text-meta font-semibold text-ink-soft">
          {state.done ? worked : error ? state.expr : ""}
        </p>
        <output aria-live="polite" className="block break-all font-display text-sec font-extrabold text-ink">
          {result}
        </output>
      </div>

      {/* Three tiers as on iOS: operators in the action fill, the
          function row on a recessed grey, digits on card. */}
      <div className="mt-5 grid grid-cols-4 gap-2.5">
        {KEYS.map((key) => {
          const operator = "+−×÷=".includes(key);
          const fn = key === "C" || key === "±" || key === "%";
          return (
            <Button
              key={key}
              variant={operator ? "primary" : "alt"}
              aria-label={SPOKEN[key]}
              onClick={() => tap(key)}
              className={[
                // `!` because this overrides Button's fixed height.
                "w-full !h-auto px-0",
                // The 0 spans two columns, its digit over the first one,
                // and takes its height from the square keys.
                key === "0" ? "col-span-2 !justify-start !pl-[calc(25%-0.4em)]" : "aspect-square",
                operator ? "text-amt" : fn ? "!bg-sunk-deep text-ui" : "text-title",
              ].join(" ")}
            >
              {LABEL[key] ?? key}
            </Button>
          );
        })}
      </div>
    </div>
  );

  if (!wide) {
    return (
      <Modal role="dialog" labelledBy={titleId} initialFocus={titleRef} onClose={onClose}>
        {body}
      </Modal>
    );
  }

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-labelledby={titleId}
      style={pos ? { left: pos.x, top: pos.y, right: "auto" } : undefined}
      className={[
        "fixed z-40 w-[300px] rounded-slab border border-line bg-card px-6 py-5",
        "right-4 top-[calc(var(--stack)+10px)]",
        // Past 1480px there is room beside the 800px column: 400 + 24 + 300 + 16.
        "min-[1480px]:right-auto min-[1480px]:left-[calc(50%+var(--content)/2+24px)]",
      ].join(" ")}
    >
      {body}
    </div>
  );
}
