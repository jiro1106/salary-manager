import { TriangleAlert } from "lucide-react";
import { peso } from "../lib/format";

interface SpendSummaryProps {
  salary: number;
  spent: number;
  remaining: number;
  /** A category's name when the figures cover only its share. */
  name?: string;
  className?: string;
}

/**
 * Which budget, what is left or over in it, then a pill with the working.
 * The pill is the diagnosis: neutral while there is money left, solid red
 * with a warning once spending passes the budget.
 */
export default function SpendSummary({ salary, spent, remaining, name, className = "" }: SpendSummaryProps) {
  const over = remaining < 0;
  return (
    <div className={className}>
      <p className="text-label font-bold uppercase tracking-caps text-ink-soft">{name ?? "Salary"}</p>
      <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2 text-ink">
        <span className="font-display text-sec font-extrabold tabular-nums">{peso(Math.abs(remaining))}</span>
        <span className="text-body font-bold">{over ? "over budget" : "left"}</span>
      </p>
      {/* Solid --spent under white text is the loss toast's pair, 6.26:1. */}
      <p
        className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-meta ${
          over ? "bg-spent text-on-action" : "bg-sunk-deep text-ink"
        }`}
      >
        {over && <TriangleAlert size={14} strokeWidth={2.2} aria-hidden="true" />}
        <span>
          Spent <b className="font-bold tabular-nums">{peso(spent)}</b> of{" "}
          <b className="font-bold tabular-nums">{peso(salary)}</b>
        </span>
      </p>
    </div>
  );
}
