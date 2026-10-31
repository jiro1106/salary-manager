import { useId, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import type { Category, Expense } from "../types";
import { peso } from "../lib/format";
import CategoryFilter from "./CategoryFilter";
import CategoryMark from "./CategoryMark";
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
  const [filter, setFilter] = useState<string | null>(null);
  const titleId = useId();
  // A filter on a category that has since been deleted falls back to all.
  const filterCategory = categories.find((c) => c.id === filter);
  const newestFirst = expenses
    .filter((e) => !filterCategory || e.categoryId === filterCategory.id)
    .sort(
    (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at),
  );

  return (
    <section aria-labelledby={titleId} className="mt-split">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h2 id={titleId} className="text-title font-bold">
          Expense history
        </h2>
        <span
          aria-label={`${newestFirst.length} shown`}
          className="rounded-full bg-sunk px-2.5 text-meta font-semibold text-ink-soft"
        >
          {newestFirst.length}
        </span>
        {categories.length > 0 && (
          <div className="ml-auto">
            <CategoryFilter
              categories={categories}
              value={filterCategory?.id ?? null}
              onChange={setFilter}
            />
          </div>
        )}
      </div>

      <div className="mt-3 border-t border-line">
        {newestFirst.length === 0 ? (
          <p className="py-3 text-meta text-ink-soft">
            {filterCategory && expenses.length > 0
              ? `No expenses in ${filterCategory.name} yet.`
              : "No expenses yet. Add one to see it here."}
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

              return (
                <li
                  key={expense.id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-line py-3"
                >
                  {/* The category's own mark, the same tile as its Legend pip.
                      A deleted category leaves an empty sunk tile: the name
                      beside it is stored on the expense, the look is not. */}
                  <CategoryMark icon={category?.icon} color={category?.color} />
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
                        label={`Edit ${expense.title}, ${peso(expense.amount)}`}
                        onClick={() => onEdit(expense)}
                      >
                        <Pencil size={15} strokeWidth={1.7} aria-hidden="true" />
                      </IconButton>
                      <IconButton
                        label={`Delete ${expense.title}, ${peso(expense.amount)}`}
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
