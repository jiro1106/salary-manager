import type { Category, Expense, ExpenseDraft, ExpenseErrors } from "../types";

export function makeExpense(
  draft: ExpenseDraft,
  categories: Category[],
  id: string,
  createdAt: string,
): { expense: Expense | null; errors: ExpenseErrors } {
  const title = draft.title.trim();
  const amount = draft.amount.trim();
  const category = categories.find((item) => item.id === draft.categoryId);
  const errors: ExpenseErrors = {};

  if (!title) errors.title = "Enter an expense title.";
  if (!/^(?:0|[1-9]\d{0,8})(?:\.\d{1,2})?$/.test(amount) || Number(amount) <= 0) {
    errors.amount = "Enter an amount up to 9 digits and 2 decimals.";
  }
  if (!category) errors.categoryId = "Choose a category.";

  if (Object.keys(errors).length || !category) return { expense: null, errors };

  return {
    expense: {
      id,
      title,
      amount: Number(amount),
      categoryId: category.id,
      categoryName: category.name,
      created_at: createdAt,
    },
    errors,
  };
}

export function expenseSummary(salary: number, expenses: Expense[]) {
  const spentCents = expenses.reduce((sum, expense) => sum + Math.round(expense.amount * 100), 0);
  return { spent: spentCents / 100, remaining: (Math.round(salary * 100) - spentCents) / 100 };
}

/** Spent per category id, summed in cents like `expenseSummary`. */
export function spentByCategory(expenses: Expense[]): Record<string, number> {
  const cents: Record<string, number> = {};
  for (const e of expenses) cents[e.categoryId] = (cents[e.categoryId] ?? 0) + Math.round(e.amount * 100);
  return Object.fromEntries(Object.entries(cents).map(([id, c]) => [id, c / 100]));
}
