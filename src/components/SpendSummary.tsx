import { peso } from "../lib/format";

interface SpendSummaryProps {
  salary: number;
  spent: number;
  remaining: number;
  /** A category's name when the figures cover only its share. */
  name?: string;
  className?: string;
}

/** Budget, spent, and what is left (or over) as three equal figures. */
export default function SpendSummary({ salary, spent, remaining, name, className = "" }: SpendSummaryProps) {
  const over = remaining < 0;
  return (
    <div className={`grid grid-cols-3 gap-4 max-[450px]:gap-2 ${className}`}>
      <div>
        <p className="text-label uppercase tracking-caps text-ink-soft">{name ?? "Salary"}</p>
        <p className="mt-1 font-display text-amt font-extrabold tabular-nums text-ink">{peso(salary)}</p>
      </div>
      <div>
        <p className="text-label uppercase tracking-caps text-ink-soft">Spent</p>
        <p className="mt-1 font-display text-amt font-extrabold tabular-nums text-spent">{peso(spent)}</p>
      </div>
      <div>
        <p className="text-label uppercase tracking-caps text-ink-soft">{over ? "Over budget" : "Available"}</p>
        <p className={`mt-1 font-display text-amt font-extrabold tabular-nums ${over ? "text-over" : "text-lime-deep"}`}>
          {peso(Math.abs(remaining))}
        </p>
      </div>
    </div>
  );
}
