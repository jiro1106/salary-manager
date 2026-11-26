import { useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ChevronDown, Trash2 } from "lucide-react";
import type { Payday } from "../types";
import { peso } from "../lib/format";
import { expenseSummary } from "../lib/expenses";
import Button from "./Button";
import ConfirmDialog from "./ConfirmDialog";
import IconButton from "./IconButton";
import { ExpenseDays, groupByDay } from "./ExpenseHistory";
import Modal from "./Modal";
import SpendSummary from "./SpendSummary";

interface PastPaydaysProps {
  /** Newest first. */
  paydays: Payday[];
  onDelete: (payday: Payday) => void;
}

const range = new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", year: "numeric" });
/** "Nov 1, 2026 – Nov 15, 2026", or one date when the payday opened and closed the same day. */
export const paydayRange = (p: Payday) => {
  const [start, end] = [p.startedAt, p.endedAt].map((d) => range.format(new Date(d)));
  return start === end ? start : `${start} – ${end}`;
};

/** The two newest expenses, in the same day-grouped rows as Expense history. */
function Preview({ payday, action }: { payday: Payday; action: ReactNode }) {
  if (!payday.expenses.length) return <p className="py-2 text-meta text-ink-soft">No expenses.</p>;
  const newest = [...payday.expenses].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)).slice(0, 2);
  return <ExpenseDays days={groupByDay(newest)} categories={payday.categories} totalAction={action} />;
}

export default function PastPaydays({ paydays, onDelete }: PastPaydaysProps) {
  const [open, setOpen] = useState<Payday | null>(null);
  const [deleting, setDeleting] = useState<Payday | null>(null);
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
                {/* Date over figures on the left; trash and chevron centred
                    on the right. */}
                <summary className="flex cursor-pointer list-none items-center gap-2 py-3 pl-4 pr-3 [&::-webkit-details-marker]:hidden">
                  <span className="min-w-0 flex-1">
                    <span className="block text-body font-bold">{paydayRange(p)}</span>
                    {/* Labels all soft and regular; only the figures carry weight and colour. */}
                    <span className="mt-1 flex flex-wrap gap-x-5 text-meta tabular-nums text-ink-soft">
                      <span>Salary <b className="font-bold text-ink">{peso(p.salary)}</b></span>
                      <span>Spent <b className="font-bold text-spent">{peso(spent)}</b></span>
                      <span>
                        {remaining < 0 ? "Over budget" : "Available"}{" "}
                        <b className={`font-bold ${remaining < 0 ? "text-over" : "text-lime-deep"}`}>{peso(Math.abs(remaining))}</b>
                      </span>
                    </span>
                  </span>
                  <IconButton
                    label={`Delete payday ${paydayRange(p)}`}
                    danger
                    onClick={(e) => {
                      // Inside <summary>: don't also toggle the row open.
                      e.preventDefault();
                      setDeleting(p);
                    }}
                  >
                    <Trash2 size={16} strokeWidth={2} aria-hidden="true" />
                  </IconButton>
                  <ChevronDown
                    size={18}
                    strokeWidth={2}
                    aria-hidden="true"
                    className="shrink-0 text-ink-soft transition-transform group-open:rotate-180"
                  />
                </summary>
                <div className="border-t border-line px-4 py-3">
                  <Preview
                    payday={p}
                    action={
                      <Button variant="alt" small onClick={() => setOpen(p)}>
                        View all {p.expenses.length}
                      </Button>
                    }
                  />
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
          <SpendSummary stacked className="mt-8" salary={open.salary} {...expenseSummary(open.salary, open.expenses)} />
          <ExpenseDays days={groupByDay(open.expenses)} categories={open.categories} />
        </Modal>
      )}
      <ConfirmDialog
        open={deleting !== null}
        title="Delete this payday?"
        description={deleting ? `${paydayRange(deleting)} and its expenses are erased. This cannot be undone.` : undefined}
        danger
        onConfirm={() => {
          if (deleting) onDelete(deleting);
          setDeleting(null);
        }}
        onCancel={() => setDeleting(null)}
      />
    </section>
  );
}
