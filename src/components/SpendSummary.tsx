import { peso } from "../lib/format";

interface SpendSummaryProps {
  salary: number;
  spent: number;
  remaining: number;
  /** A category's name when the figures cover only its share. */
  name?: string;
  className?: string;
  /** One figure per row at every width, for narrow containers like a dialog. */
  stacked?: boolean;
}

/** Budget, spent, and what is left (or over) as three equal figures. */
export default function SpendSummary({ salary, spent, remaining, name, className = "", stacked = false }: SpendSummaryProps) {
  const over = remaining < 0;
  // Stacked uses the phone layout everywhere; otherwise it only kicks in under 450px.
  // Stacked: a two-column table, labels then figures right beside them, so a
  // wide dialog doesn't push them to opposite edges.
  const grid = stacked
    ? "w-max grid-cols-[max-content_max-content] items-center gap-x-10 gap-y-2"
    : "grid-cols-3 gap-4 max-[450px]:grid-cols-1 max-[450px]:gap-2";
  const cell = stacked ? "contents" : "max-[450px]:flex max-[450px]:items-center max-[450px]:justify-between";
  const figure = stacked ? "mt-0 text-right" : "mt-1 max-[450px]:mt-0";
  return (
    <div className={`grid ${grid} ${className}`}>
      <div className={cell}>
        <p className="text-label uppercase tracking-caps text-ink-soft">{name ?? "Salary"}</p>
        <p className={`${figure} font-display text-amt font-extrabold tabular-nums text-ink`}>{peso(salary)}</p>
      </div>
      <div className={cell}>
        <p className="text-label uppercase tracking-caps text-ink-soft">Spent</p>
        <p className={`${figure} font-display text-amt font-extrabold tabular-nums text-spent`}>{peso(spent)}</p>
      </div>
      <div className={cell}>
        <p className="text-label uppercase tracking-caps text-ink-soft">{over ? "Over budget" : "Available"}</p>
        <p className={`${figure} font-display text-amt font-extrabold tabular-nums ${over ? "text-over" : "text-lime-deep"}`}>
          {peso(Math.abs(remaining))}
        </p>
      </div>
    </div>
  );
}
