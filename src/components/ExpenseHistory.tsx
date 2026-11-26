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

/** One group per local day, newest day first. */
export function groupByDay(expenses: Expense[]): { day: Date; items: Expense[] }[] {
  const sorted = [...expenses].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  const days: { day: Date; items: Expense[] }[] = [];
  for (const expense of sorted) {
    const day = new Date(expense.created_at);
    const last = days[days.length - 1];
    if (last && last.day.toDateString() === day.toDateString()) last.items.push(expense);
    else days.push({ day, items: [expense] });
  }
  return days;
}

interface ExpenseDaysProps {
  days: { day: Date; items: Expense[] }[];
  categories: Category[];
  /** Leave both out for a read-only list: no ⋯ menu on the rows. */
  onEdit?: (expense: Expense) => void;
  onDelete?: (expense: Expense) => void;
}

/** Expenses grouped under their day, with a day total. Shared by the live history and past paydays. */
export function ExpenseDays({ days, categories, onEdit, onDelete }: ExpenseDaysProps) {
  const editable = Boolean(onEdit && onDelete);
  // Holds the width of a row's ⋯ button, so day totals
  // line up under the row amounts.
  const menuSpacer = editable && (
    <div aria-hidden="true" className="invisible">
      <IconButton label="" onClick={() => {}}>
        <MoreHorizontal size={18} strokeWidth={2} />
      </IconButton>
    </div>
  );

  return (
    <>
      {days.map(({ day, items }) => (
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
                  className="flex items-center gap-4 rounded-slab bg-card px-4 py-3 max-[450px]:gap-3"
                >
                  {/* The category's own mark, the same tile as on its card.
                      A deleted category leaves an empty sunk tile: the name
                      beside it is stored on the expense, the look is not. */}
                  <CategoryMark icon={category?.icon} color={category?.color} />
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-body font-bold">{expense.title}</p>
                    <div className="flex flex-wrap gap-x-3 text-meta text-ink-soft">
                      <span className="min-w-0 [overflow-wrap:anywhere]">
                        {expense.categoryName}
                      </span>
                      <span aria-hidden="true" className="text-ink-faint">|</span>
                      <time dateTime={expense.created_at}>{when}</time>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-5 max-[450px]:gap-2">
                    <span className="min-w-[10ch] text-left font-display text-body font-bold tabular-nums">
                      {peso(expense.amount)}
                    </span>
                    {editable && (
                      <CategoryMenu
                        tone="card"
                        name={`${expense.title}, ${peso(expense.amount)}`}
                        onEdit={() => onEdit!(expense)}
                        onDelete={() => onDelete!(expense)}
                      />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="mt-3 flex items-center justify-end gap-5 border-t border-line pt-3 pr-4 max-[450px]:gap-2">
            <span className="min-w-[10ch] text-left font-display text-body font-bold tabular-nums text-spent">
              <span className="sr-only">Day total </span>{peso(expenseSummary(0, items).spent)}
            </span>
            {menuSpacer}
          </div>
        </div>
      ))}
    </>
  );
}

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
  const filtered = expenses.filter((e) => !filterCategory || e.categoryId === filterCategory.id);
  const days = groupByDay(filtered);

  return (
    <section aria-labelledby={titleId} className="mt-split">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
        <h2 id={titleId} className="text-title font-bold">
          Expense history <span className="font-normal tabular-nums text-ink-soft">({filtered.length})</span>
        </h2>
        {categories.length > 0 && (
          <div className="ml-auto">
            <CategoryFilter categories={categories} value={filterCategory?.id ?? null} onChange={onFilterChange} />
          </div>
        )}
      </div>
      <div className="mt-1">
        {filtered.length === 0 ? (
          <p className="py-3 text-meta text-ink-soft">
            {filterCategory && expenses.length > 0
              ? `No expenses in ${filterCategory.name} yet.`
              : "No expenses yet. Add one to see it here."}
          </p>
        ) : (
          <ExpenseDays
            days={days.slice(0, dayLimit)}
            categories={categories}
            onEdit={onEdit}
            onDelete={setConfirming}
          />
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
