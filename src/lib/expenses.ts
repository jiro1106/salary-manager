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
  const amountProblem = amountError(amount);
  if (amountProblem) errors.amount = amountProblem;
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

/** Why a typed amount can't be saved, or undefined when it can. Most specific problem first. */
export function amountError(amount: string): string | undefined {
  if (!amount) return "Enter an amount.";
  if (amount.startsWith("-")) return "Amount can't be negative. Enter 0.01 or more.";
  const [whole, decimals, extra] = amount.split(".");
  if (extra !== undefined || !/^\d*$/.test(whole) || !/^\d*$/.test(decimals ?? "") || !(whole || decimals)) {
    return "Enter a number, like 250 or 250.50.";
  }
  if (whole.replace(/^0+(?=\d)/, "").length > 9) return "Too large. Use up to 9 digits before the decimal point.";
  if ((decimals ?? "").length > 2) return "Use up to 2 decimal places.";
  if (Number(amount) <= 0) return "Enter an amount more than 0.";
  return undefined;
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
