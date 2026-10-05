import { Trash2 } from "lucide-react";
import type { Expense } from "../types";
import { peso } from "../lib/format";
import IconButton from "./IconButton";

interface ExpenseHistoryProps {
  expenses: Expense[];
  undoExpense?: Expense | null;
  onDelete: (id: string) => void;
  onUndo: () => void;
}

export default function ExpenseHistory({
  expenses,
  undoExpense,
  onDelete,
  onUndo,
}: ExpenseHistoryProps) {
  const newestFirst = [...expenses].sort(
    (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at),
  );

  return (
    <section aria-labelledby="expense-history-title" className="mt-split">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 id="expense-history-title" className="text-title font-bold">
          Expense history
        </h2>
        <span className="text-meta text-ink-soft">
          {expenses.length} {expenses.length === 1 ? "expense" : "expenses"}
        </span>
      </div>

      <div role="status">
        {undoExpense && (
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-control border border-line bg-action-tint px-4 py-2 text-meta">
            <span className="min-w-0 flex-1">Deleted “{undoExpense.title}”.</span>
            <button
              type="button"
              onClick={onUndo}
              className="min-h-hit rounded-control px-2 font-bold text-action-edge hover:underline"
            >
              Undo
            </button>
          </div>
        )}
      </div>

      <div className="mt-3 rounded-slab border border-line bg-card px-[26px] py-1.5 max-[700px]:px-4">
        {newestFirst.length === 0 ? (
          <p className="py-3 text-meta text-ink-soft">
            No expenses yet. Add one to see it here.
          </p>
        ) : (
          <ul>
            {newestFirst.map((expense) => {
              const when = new Date(expense.created_at).toLocaleString("en-PH", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
              });

              return (
                <li
                  key={expense.id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2 [&+&]:border-t [&+&]:border-line"
                >
                  <div className="min-w-[12ch] flex-[1_1_12rem]">
                    <p className="break-words text-body font-bold">{expense.title}</p>
                    <div className="flex flex-wrap gap-x-3 text-meta text-ink-soft">
                      <span className="min-w-0 [overflow-wrap:anywhere]">
                        {expense.categoryName}
                      </span>
                      <time dateTime={expense.created_at}>{when}</time>
                    </div>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <span className="font-display text-body font-bold">
                      {peso(expense.amount)}
                    </span>
                    <IconButton
                      label={`Delete ${expense.title}, ${peso(expense.amount)}, ${when}, record ${expense.id}`}
                      onClick={() => onDelete(expense.id)}
                      danger
                    >
                      <Trash2 size={15} strokeWidth={1.7} aria-hidden="true" />
                    </IconButton>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
