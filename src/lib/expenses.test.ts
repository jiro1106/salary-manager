import { describe, expect, it } from "vitest";
import type { Category, Expense } from "../types";
import { expenseSummary, makeExpense, spentByCategory } from "./expenses";

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

  it.each([
    ["", "Enter an amount."],
    ["0", "Enter an amount more than 0."],
    ["-1", "Amount can't be negative. Enter 0.01 or more."],
    ["abc", "Enter a number, like 250 or 250.50."],
    ["1.2.3", "Enter a number, like 250 or 250.50."],
    [".", "Enter a number, like 250 or 250.50."],
    ["1000000000", "Too large. Use up to 9 digits before the decimal point."],
    ["12.345", "Use up to 2 decimal places."],
  ])("rejects invalid amount %s", (amount, message) => {
    expect(makeExpense({ ...draft, amount }, categories, "id", createdAt)).toEqual({
      expense: null,
      errors: { amount: message },
    });
  });

  it.each(["999999999.99", "0.5", ".5", "007"])("accepts amount %s", (amount) => {
    expect(makeExpense({ ...draft, amount }, categories, "id", createdAt).errors).toEqual({});
  });

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

describe("spentByCategory", () => {
  it("sums each category without float dust", () => {
    const e = (id: string, amount: number, categoryId: string): Expense => ({
      id, title: id, amount, categoryId, categoryName: categoryId, created_at: createdAt,
    });
    expect(spentByCategory([e("1", 0.1, "food"), e("2", 0.2, "food"), e("3", 5, "rent")])).toEqual({
      food: 0.3,
      rent: 5,
    });
  });
});
