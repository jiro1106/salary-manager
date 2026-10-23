import { peso } from "../lib/format";

interface SpendSummaryProps {
  spent: number;
  remaining: number;
  className?: string;
}

/** Spent against the payday, shown on both the Salary and Expenses tabs. */
export default function SpendSummary({ spent, remaining, className = "" }: SpendSummaryProps) {
  return (
    <div className={`grid grid-cols-2 gap-4 max-[450px]:gap-2 ${className}`}>
      <div>
        <p className="text-label uppercase tracking-caps text-ink-soft">Spent</p>
        <p className="mt-1 font-display text-amt font-extrabold text-spent">{peso(spent)}</p>
      </div>
      <div>
        <p className="text-label uppercase tracking-caps text-ink-soft">
          {remaining < 0 ? "Over budget" : "Available"}
        </p>
        <p className={`mt-1 font-display text-amt font-extrabold ${remaining < 0 ? "text-spent" : "text-lime-deep"}`}>
          {peso(Math.abs(remaining))}
        </p>
      </div>
    </div>
  );
}
