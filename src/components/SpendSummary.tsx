import { peso } from "../lib/format";

interface SpendSummaryProps {
  salary: number;
  spent: number;
  remaining: number;
  className?: string;
}

/**
 * One answer, then its working: what is available (or over) leads at full
 * size, and spent against the salary follows as a quiet line, so the tab
 * keeps the salary in view without three figures competing.
 */
export default function SpendSummary({ salary, spent, remaining, className = "" }: SpendSummaryProps) {
  const over = remaining < 0;
  return (
    <div className={className}>
      <p className="text-label uppercase tracking-caps text-ink-soft">
        {over ? "Over budget" : "Available"}
      </p>
      <p className={`mt-1 font-display text-amt font-extrabold ${over ? "text-spent" : "text-lime-deep"}`}>
        {peso(Math.abs(remaining))}
      </p>
      <p className="mt-1 text-meta text-ink-soft">
        <span className="font-display font-bold text-ink">{peso(spent)}</span> spent of{" "}
        <span className="font-display font-bold text-ink">{peso(salary)}</span>
      </p>
    </div>
  );
}
