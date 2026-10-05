import { describe, expect, it } from "vitest";
import type { Category, Expense } from "../types";
import { expenseSummary, makeExpense } from "./expenses";

const categories: Category[] = [
  {
    id: "food",
    name: "Food & groceries",
    icon: "ShoppingBag",
    color: "blue",
    percent: 20,
    subs: [],
  },
];
const draft = { title: "  Lunch  ", amount: "800", categoryId: "food" };
const createdAt = "2026-09-30T12:34:56.000Z";

describe("makeExpense", () => {
  it("creates an expense with an ISO timestamp and category-name snapshot", () => {
    expect(makeExpense(draft, categories, "expense-1", createdAt)).toEqual({
      expense: {
        id: "expense-1",
        title: "Lunch",
        amount: 800,
        categoryId: "food",
        categoryName: "Food & groceries",
        created_at: createdAt,
      },
      errors: {},
    });
  });

  it("rejects a blank title", () => {
    expect(makeExpense({ ...draft, title: "   " }, categories, "id", createdAt)).toEqual({
      expense: null,
      errors: { title: "Enter an expense title." },
    });
  });

  it.each(["", "0", "-1", "abc", "1000000000", "12.345"])(
    "rejects invalid amount %s",
    (amount) => {
      expect(makeExpense({ ...draft, amount }, categories, "id", createdAt)).toEqual({
        expense: null,
        errors: { amount: "Enter an amount up to 9 digits and 2 decimals." },
      });
    },
  );

  it("rejects a category that is not in the current category list", () => {
    expect(
      makeExpense({ ...draft, categoryId: "deleted" }, categories, "id", createdAt),
    ).toEqual({ expense: null, errors: { categoryId: "Choose a category." } });
  });
});

describe("expenseSummary", () => {
  it("reports spent and a negative remaining salary without clamping", () => {
    const expenses: Expense[] = [
      {
        id: "1",
        title: "Lunch",
        amount: 800,
        categoryId: "food",
        categoryName: "Food & groceries",
        created_at: createdAt,
      },
      {
        id: "2",
        title: "Dinner",
        amount: 800,
        categoryId: "food",
        categoryName: "Food & groceries",
        created_at: createdAt,
      },
    ];
    expect(expenseSummary(1000, expenses)).toEqual({ spent: 1600, remaining: -600 });
  });
});
