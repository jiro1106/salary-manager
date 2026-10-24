import { useState } from "react";
import type { CSSProperties } from "react";
import { Pencil, Trash2 } from "lucide-react";
import type { Category, Expense } from "../types";
import { peso } from "../lib/format";
import { iconOf } from "../lib/icons";
import ConfirmDialog from "./ConfirmDialog";
import IconButton from "./IconButton";

interface ExpenseHistoryProps {
  expenses: Expense[];
  categories: Category[];
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

export default function ExpenseHistory({
  expenses,
  categories,
  onEdit,
  onDelete,
}: ExpenseHistoryProps) {
  const [confirming, setConfirming] = useState<Expense | null>(null);
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
              const category = categories.find((c) => c.id === expense.categoryId);
              const Mark = category && iconOf(category.icon);

              return (
                <li
                  key={expense.id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2 [&+&]:border-t [&+&]:border-line"
                >
                  {/* The category's own mark, the same tile as its Legend pip.
                      A deleted category leaves an empty sunk tile: the name
                      beside it is stored on the expense, the look is not. */}
                  <span
                    aria-hidden="true"
                    className={`grid h-[28px] w-[28px] flex-none place-items-center rounded-control ${Mark ? "bg-cat text-on-color" : "bg-sunk"}`}
                    style={category ? ({ "--c": category.color } as CSSProperties) : undefined}
                  >
                    {Mark && <Mark size={14} strokeWidth={2} />}
                  </span>
                  <div className="min-w-[12ch] flex-[1_1_12rem]">
                    <p className="break-words text-body font-bold">{expense.title}</p>
                    <div className="flex flex-wrap gap-x-3 text-meta text-ink-soft">
                      <span className="min-w-0 [overflow-wrap:anywhere]">
                        {expense.categoryName}
                      </span>
                      <time dateTime={expense.created_at}>{when}</time>
                    </div>
                  </div>
                  <div className="ml-auto flex items-center gap-5">
                    <span className="font-display text-body font-bold">
                      {peso(expense.amount)}
                    </span>
                    <div className="flex items-center gap-3">
                      <IconButton
                        label={`Edit ${expense.title}, ${peso(expense.amount)}, ${when}, record ${expense.id}`}
                        onClick={() => onEdit(expense)}
                      >
                        <Pencil size={15} strokeWidth={1.7} aria-hidden="true" />
                      </IconButton>
                      <IconButton
                        label={`Delete ${expense.title}, ${peso(expense.amount)}, ${when}, record ${expense.id}`}
                        onClick={() => setConfirming(expense)}
                        danger
                      >
                        <Trash2 size={15} strokeWidth={1.7} aria-hidden="true" />
                      </IconButton>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={confirming !== null}
        title={`Delete "${confirming?.title}"?`}
        description={confirming ? `${peso(confirming.amount)} goes back to your available balance. This cannot be undone.` : undefined}
        danger
        onConfirm={() => {
          if (confirming) onDelete(confirming.id);
          setConfirming(null);
        }}
        onCancel={() => setConfirming(null)}
      />
    </section>
  );
}
