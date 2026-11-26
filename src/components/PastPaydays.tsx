import { useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Payday } from "../types";
import { peso } from "../lib/format";
import { expenseSummary } from "../lib/expenses";
import Button from "./Button";
import { ExpenseDays, groupByDay } from "./ExpenseHistory";
import Modal from "./Modal";
import SpendSummary from "./SpendSummary";

interface PastPaydaysProps {
  /** Newest first. */
  paydays: Payday[];
}

const range = new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", year: "numeric" });
/** "Nov 1, 2026 – Nov 15, 2026", or one date when the payday opened and closed the same day. */
export const paydayRange = (p: Payday) => {
  const [start, end] = [p.startedAt, p.endedAt].map((d) => range.format(new Date(d)));
  return start === end ? start : `${start} – ${end}`;
};

/** The two newest expenses, in the same day-grouped rows as Expense history. */
function Preview({ payday }: { payday: Payday }) {
  if (!payday.expenses.length) return <p className="py-2 text-meta text-ink-soft">No expenses.</p>;
  const newest = [...payday.expenses].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)).slice(0, 2);
  return <ExpenseDays days={groupByDay(newest)} categories={payday.categories} />;
}

export default function PastPaydays({ paydays }: PastPaydaysProps) {
  const [open, setOpen] = useState<Payday | null>(null);
  const titleId = useId();
  const modalTitleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  if (!paydays.length) return null;

  return (
    <section aria-labelledby={titleId} className="mt-split">
      <h2 id={titleId} className="text-title font-bold">
        Past paydays <span className="font-normal tabular-nums text-ink-soft">({paydays.length})</span>
      </h2>
      <ul className="mt-3 flex flex-col gap-2">
        {paydays.map((p) => {
          const { spent, remaining } = expenseSummary(p.salary, p.expenses);
          return (
            <li key={p.endedAt} className="rounded-slab border border-line">
              <details className="group">
                {/* Date and chevron on one line, figures under it at every
                    width, so a phone never wraps the chevron onto its own row. */}
                <summary className="grid cursor-pointer list-none grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-4 py-3 [&::-webkit-details-marker]:hidden">
                  <span className="text-body font-bold">{paydayRange(p)}</span>
                  <ChevronDown
                    size={18}
                    strokeWidth={2}
                    aria-hidden="true"
                    className="text-ink-soft transition-transform group-open:rotate-180"
                  />
                  <span className="col-span-2 flex flex-wrap gap-x-4 text-meta tabular-nums text-ink-soft">
                    <span>Salary {peso(p.salary)}</span>
                    <span className="text-spent">Spent {peso(spent)}</span>
                    <span className={remaining < 0 ? "text-over" : "text-lime-deep"}>
                      {remaining < 0 ? "Over budget" : "Available"} {peso(Math.abs(remaining))}
                    </span>
                  </span>
                </summary>
                <div className="border-t border-line px-4 py-3">
                  <Preview payday={p} />
                  <div className="mt-3 flex justify-end">
                    <Button variant="alt" small onClick={() => setOpen(p)}>
                      View all {p.expenses.length}
                    </Button>
                  </div>
                </div>
              </details>
            </li>
          );
        })}
      </ul>

      {open && (
        <Modal wide role="dialog" labelledBy={modalTitleId} initialFocus={closeRef} onClose={() => setOpen(null)}>
          <div className="flex items-start justify-between gap-4">
            <p id={modalTitleId} className="font-display text-title font-bold text-ink">
              {paydayRange(open)}
            </p>
            <Button ref={closeRef} variant="danger" small onClick={() => setOpen(null)} className="shrink-0">
              Close
            </Button>
          </div>
          <SpendSummary stacked className="mt-4" salary={open.salary} {...expenseSummary(open.salary, open.expenses)} />
          <ExpenseDays days={groupByDay(open.expenses)} categories={open.categories} />
        </Modal>
      )}
    </section>
  );
}
