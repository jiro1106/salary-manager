import { useId, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import type { Category, Expense } from "../types";
import { peso } from "../lib/format";
import { expenseSummary } from "../lib/expenses";
import Button from "./Button";
import CategoryFilter from "./CategoryFilter";
import CategoryMark from "./CategoryMark";
import CategoryMenu from "./CategoryMenu";
import ConfirmDialog from "./ConfirmDialog";
import IconButton from "./IconButton";

interface ExpenseHistoryProps {
  expenses: Expense[];
  categories: Category[];
  filter: string | null;
  onFilterChange: (id: string | null) => void;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

/** Days of history rendered at first, and added per "Load more". */
const DAYS_PER_PAGE = 5;

export default function ExpenseHistory({
  expenses,
  categories,
  filter,
  onFilterChange,
  onEdit,
  onDelete,
}: ExpenseHistoryProps) {
  const [confirming, setConfirming] = useState<Expense | null>(null);
  const [dayLimit, setDayLimit] = useState(DAYS_PER_PAGE);
  const titleId = useId();
  // A filter on a category that has since been deleted falls back to all.
  const filterCategory = categories.find((c) => c.id === filter);
  const newestFirst = expenses
    .filter((e) => !filterCategory || e.categoryId === filterCategory.id)
    .sort(
    (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at),
  );

  // One group per local day, newest day first, since the list is already sorted.
  const days: { day: Date; items: Expense[] }[] = [];
  for (const expense of newestFirst) {
    const day = new Date(expense.created_at);
    const last = days[days.length - 1];
    if (last && last.day.toDateString() === day.toDateString()) last.items.push(expense);
    else days.push({ day, items: [expense] });
  }

  // Holds the width of a row's ⋯ button, so day totals
  // line up under the row amounts.
  const menuSpacer = (
    <div aria-hidden="true" className="invisible">
      <IconButton label="" onClick={() => {}}>
        <MoreHorizontal size={18} strokeWidth={2} />
      </IconButton>
    </div>
  );

  return (
    <section aria-labelledby={titleId} className="mt-split">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
        <h2 id={titleId} className="text-title font-bold">
          Expense history
        </h2>
        <span className="text-meta text-ink-soft">
          {newestFirst.length} {newestFirst.length === 1 ? "expense" : "expenses"}
        </span>
        {categories.length > 0 && (
          <div className="ml-auto">
            <CategoryFilter categories={categories} value={filterCategory?.id ?? null} onChange={onFilterChange} />
          </div>
        )}
      </div>
      <div className="mt-1">
        {newestFirst.length === 0 ? (
          <p className="py-3 text-meta text-ink-soft">
            {filterCategory && expenses.length > 0
              ? `No expenses in ${filterCategory.name} yet.`
              : "No expenses yet. Add one to see it here."}
          </p>
        ) : (
          days.slice(0, dayLimit).map(({ day, items }) => (
            <div key={day.toDateString()} className="pt-10 first:pt-4">
              <div className="border-b border-line pb-2">
                <h3 className="text-body font-bold">
                  {day.toLocaleDateString("en-PH", { weekday: "long" })}
                </h3>
                <p className="text-meta text-ink-soft">
                  {day.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
              <ul className="mt-3 flex flex-col gap-2">
                {items.map((expense) => {
                  const when = new Date(expense.created_at).toLocaleTimeString("en-PH", {
                    hour: "numeric",
                    minute: "2-digit",
                  });
                  const category = categories.find((c) => c.id === expense.categoryId);

                  return (
                    <li
                      key={expense.id}
                      className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-slab bg-card px-4 py-3"
                    >
                      {/* The category's own mark, the same tile as on its card.
                          A deleted category leaves an empty sunk tile: the name
                          beside it is stored on the expense, the look is not. */}
                      <CategoryMark icon={category?.icon} color={category?.color} />
                      <div className="min-w-[12ch] flex-[1_1_12rem]">
                        <p className="break-words text-body font-bold">{expense.title}</p>
                        <div className="flex flex-wrap gap-x-3 text-meta text-ink-soft">
                          <span className="min-w-0 [overflow-wrap:anywhere]">
                            {expense.categoryName}
                          </span>
                          <span aria-hidden="true" className="text-ink-faint">|</span>
                          <time dateTime={expense.created_at}>{when}</time>
                        </div>
                      </div>
                      <div className="ml-auto flex items-center gap-5">
                        <span className="font-display text-body font-bold">
                          {peso(expense.amount)}
                        </span>
                        <CategoryMenu
                          tone="card"
                          name={`${expense.title}, ${peso(expense.amount)}`}
                          onEdit={() => onEdit(expense)}
                          onDelete={() => setConfirming(expense)}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-3 flex items-center justify-end gap-5 border-t border-line pt-3 pr-4">
                <span className="font-display text-body font-bold text-spent">
                  <span className="sr-only">Day total </span>{peso(expenseSummary(0, items).spent)}
                </span>
                {menuSpacer}
              </div>
            </div>
          ))
        )}
        {days.length > dayLimit && (
          <div className="mt-4 flex justify-center">
            <Button variant="alt" small onClick={() => setDayLimit((n) => n + DAYS_PER_PAGE)}>
              Load more
            </Button>
          </div>
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
