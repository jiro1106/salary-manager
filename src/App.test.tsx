// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import App from "./App";
import type { Category, Expense } from "./types";

const categories: Category[] = [
  { id: "food", name: "Food", icon: "ShoppingBag", color: "#e6e6e6", percent: 100 },
];
const expense = (id: string, title: string, amount: number, created_at: string): Expense => ({
  id, title, amount, categoryId: "food", categoryName: "Food", created_at,
});

beforeEach(() => {
  const values = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
  });
  vi.stubGlobal("matchMedia", () => ({ matches: true, addListener() {}, removeListener() {} }));
  vi.stubGlobal("crypto", { randomUUID: () => "new-expense" });
});
/** The app opens on Salary, so expense tests switch over first. */
const openExpenses = () => {
  fireEvent.click(screen.getByRole("tab", { name: "Expenses" }));
  expect(screen.getByRole("tab", { name: "Expenses", selected: true })).toBeTruthy();
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("expense tracking in App", () => {
  it("adds an expense and updates the history and salary summary", async () => {
    localStorage.setItem("salary-manager:config", JSON.stringify({ salary: 1000, categories, expenses: [] }));
    render(<App />);
    openExpenses();
    fireEvent.click(screen.getByRole("button", { name: "Add expense" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Title" }), { target: { value: "Lunch" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Amount" }), { target: { value: "250.50" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Category" }), { target: { value: "food" } });
    fireEvent.click(screen.getByRole("button", { name: "Save expense" }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByText("Lunch")).toBeTruthy();
    // Row, day total, payday summary.
    expect(screen.getAllByText("₱250.50")).toHaveLength(3);
    // The payday summary at the top. The history footer only shows under a category filter.
    expect(screen.getAllByText("₱749.50")).toHaveLength(1);
    await waitFor(() => expect(JSON.parse(localStorage.getItem("salary-manager:config")!).expenses).toEqual([
      expect.objectContaining({ id: "new-expense", title: "Lunch", amount: 250.5, categoryId: "food", categoryName: "Food" }),
    ]));
  });

  it("deletes one expense after confirming", async () => {
    const expenses = [
      expense("a", "Breakfast", 100, "2026-09-30T09:00:00Z"),
      expense("b", "Lunch", 200, "2026-09-30T12:00:00Z"),
      expense("c", "Dinner", 300, "2026-09-30T18:00:00Z"),
    ];
    localStorage.setItem("salary-manager:config", JSON.stringify({ salary: 1000, categories, expenses }));
    render(<App />);
    openExpenses();
    await screen.findByText("Lunch");

    fireEvent.click(screen.getByRole("button", { name: /options for lunch/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(screen.queryByText("Lunch")).toBeNull();
    expect(screen.queryByRole("button", { name: "Undo" })).toBeNull();
    await waitFor(() => expect(JSON.parse(localStorage.getItem("salary-manager:config")!).expenses).toEqual([expenses[0], expenses[2]]));
  });

  it("edits an expense in place from its edit button", async () => {
    const expenses = [
      expense("a", "Breakfast", 100, "2026-09-30T09:00:00Z"),
      expense("b", "Lunch", 200, "2026-09-30T12:00:00Z"),
    ];
    localStorage.setItem("salary-manager:config", JSON.stringify({ salary: 1000, categories, expenses }));
    render(<App />);
    openExpenses();
    await screen.findByText("Lunch");

    fireEvent.click(screen.getByRole("button", { name: /options for lunch/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Edit" }));
    screen.getByRole("dialog", { name: "Edit expense" });
    expect((screen.getByRole("textbox", { name: "Amount" }) as HTMLInputElement).value).toBe("200");
    fireEvent.change(screen.getByRole("textbox", { name: "Title" }), { target: { value: "Late lunch" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Amount" }), { target: { value: "250" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByText("Late lunch")).toBeTruthy();
    await waitFor(() => expect(JSON.parse(localStorage.getItem("salary-manager:config")!).expenses).toEqual([
      expenses[0],
      { ...expenses[1], title: "Late lunch", amount: 250 },
    ]));
  });

  it("loads an old config without expenses as an empty history", async () => {
    localStorage.setItem("salary-manager:config", JSON.stringify({ salary: 500, categories }));
    render(<App />);
    openExpenses();
    expect(await screen.findByText(/no expenses yet/i)).toBeTruthy();
    expect(screen.getByText("₱0.00")).toBeTruthy();
    fireEvent.click(screen.getByRole("tab", { name: "Salary" }));
    expect((screen.getByRole("textbox", { name: "Take-home pay in pesos" }) as HTMLInputElement).value).toBe("500");
  });

  it("shows the amount over budget when expenses exceed salary", async () => {
    localStorage.setItem("salary-manager:config", JSON.stringify({
      salary: 100, categories, expenses: [expense("over", "Groceries", 150.25, "2026-09-30T12:00:00Z")],
    }));
    render(<App />);
    openExpenses();
    await screen.findByText("Groceries");
    expect(screen.getAllByText("over budget")).toHaveLength(1);
    for (const node of screen.getAllByText("₱50.25")) expect(node.parentElement?.nextElementSibling?.className).toContain("bg-spent");
  });

  it("leads with what is left, then spent of salary in a neutral pill", async () => {
    localStorage.setItem("salary-manager:config", JSON.stringify({
      salary: 500, categories, expenses: [expense("lunch", "Lunch", 200, "2026-09-30T12:00:00Z")],
    }));
    render(<App />);
    openExpenses();
    await screen.findByText("Lunch");
    const available = screen.getByText("Salary", { selector: "p" }).nextElementSibling;
    expect(available?.nextElementSibling?.textContent).toBe("Spent ₱200.00 of ₱500.00");
    expect(available?.textContent).toBe("₱300.00left");
    expect(available?.nextElementSibling?.className).toContain("bg-sunk-deep");
  });

  it("explains why adding an expense is unavailable without categories", async () => {
    localStorage.setItem("salary-manager:config", JSON.stringify({ salary: 1000, categories: [], expenses: [] }));
    render(<App />);
    openExpenses();
    const add = screen.getByRole("button", { name: "Add expense" }) as HTMLButtonElement;
    expect(add.disabled).toBe(true);
    const explanation = screen.getByText(/add a category before recording expenses/i);
    expect(add.getAttribute("aria-describedby")).toBe(explanation.id);
    fireEvent.click(add);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("does not offer payday saving or payday history", () => {
    render(<App />);
    expect(screen.queryByRole("button", { name: /save payday/i })).toBeNull();
    expect(screen.queryByText(/payday history/i)).toBeNull();
  });

  it("swaps the top summary to the filtered category's own share", async () => {
    const split: Category[] = [
      { id: "food", name: "Food", icon: "ShoppingBag", color: "#e6e6e6", percent: 50 },
      { id: "travel", name: "Travel", icon: "Wallet", color: "#a5e34d", percent: 50 },
    ];
    localStorage.setItem("salary-manager:config", JSON.stringify({
      salary: 1000, categories: split,
      expenses: [expense("lunch", "Lunch", 200, "2026-09-30T12:00:00Z"), { ...expense("bus", "Bus", 700, "2026-09-30T13:00:00Z"), categoryId: "travel" }],
    }));
    Element.prototype.scrollIntoView = vi.fn(); // jsdom has no layout
    render(<App />);
    openExpenses();
    await screen.findByText("Lunch");
    expect(screen.getByText("Salary", { selector: "p" }).nextElementSibling?.textContent).toBe("₱100.00left");

    fireEvent.click(screen.getByRole("button", { name: /filter by category/i }));
    fireEvent.click(screen.getByRole("option", { name: "Travel" }));
    expect(screen.queryByText("Salary", { selector: "p" })).toBeNull();
    expect(screen.queryByText("Lunch")).toBeNull();
    const over = screen.getByText("Travel", { selector: "p" }).nextElementSibling;
    expect(over?.textContent).toBe("₱200.00over budget");
    expect(over?.nextElementSibling?.className).toContain("bg-spent");
    expect(over?.nextElementSibling?.textContent).toBe("Spent ₱700.00 of ₱500.00");

    fireEvent.click(screen.getByRole("button", { name: /filter by category/i }));
    fireEvent.click(screen.getByRole("option", { name: "Food" }));
    expect(screen.getByText("Food", { selector: "p" }).nextElementSibling?.textContent).toBe("₱300.00left");
  });
});

describe("tabs", () => {
  it("opens on Salary with nothing saved and shows one job at a time", () => {
    render(<App />);
    expect(screen.getByRole("tab", { name: "Salary", selected: true })).toBeTruthy();
    expect(screen.getByRole("textbox", { name: "Take-home pay in pesos" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Add expense" })).toBeNull();
    expect(screen.queryByRole("button", { name: /add category/i })).toBeNull();
  });

  it("opens on Salary even with a saved salary", () => {
    localStorage.setItem("salary-manager:config", JSON.stringify({ salary: 1000, categories, expenses: [] }));
    render(<App />);
    expect(screen.getByRole("tab", { name: "Salary", selected: true })).toBeTruthy();
  });

  it("moves between tabs with the arrow keys, wrapping at the ends", () => {
    render(<App />);
    const salary = screen.getByRole("tab", { name: "Salary" });
    fireEvent.keyDown(salary, { key: "ArrowRight" });
    expect(screen.getByRole("tab", { name: "Split", selected: true })).toBeTruthy();
    expect(screen.getByRole("tabpanel").getAttribute("aria-labelledby")).toBe("tab-split");
    fireEvent.keyDown(screen.getByRole("tab", { name: "Split" }), { key: "End" });
    expect(screen.getByRole("tab", { name: "Expenses", selected: true })).toBeTruthy();
    fireEvent.keyDown(screen.getByRole("tab", { name: "Expenses" }), { key: "ArrowRight" });
    expect(screen.getByRole("tab", { name: "Salary", selected: true })).toBeTruthy();
  });

  it("keeps the expense filter across a tab switch", async () => {
    localStorage.setItem("salary-manager:config", JSON.stringify({ salary: 1000, categories, expenses: [] }));
    Element.prototype.scrollIntoView = vi.fn(); // jsdom has no layout
    render(<App />);
    openExpenses();
    fireEvent.click(screen.getByRole("button", { name: /filter by category/i }));
    fireEvent.click(screen.getByRole("option", { name: "Food" }));
    fireEvent.click(screen.getByRole("tab", { name: "Salary" }));
    fireEvent.click(screen.getByRole("tab", { name: "Expenses" }));
    expect(screen.getByRole("button", { name: /filter by category/i }).textContent).toContain("Food");
  });

  it("reports over-allocation on the Split tab", async () => {
    localStorage.setItem("salary-manager:config", JSON.stringify({
      salary: 1000, categories: [{ ...categories[0], percent: 120 }], expenses: [],
    }));
    render(<App />);
    openExpenses();
    expect(screen.queryByText(/over by 20%/i)).toBeNull();
    fireEvent.click(screen.getByRole("tab", { name: "Split" }));
    expect(screen.getByText(/over by 20%/i)).toBeTruthy();
  });

  it("confirms an added expense in a toast", async () => {
    localStorage.setItem("salary-manager:config", JSON.stringify({ salary: 1000, categories, expenses: [] }));
    render(<App />);
    openExpenses();
    fireEvent.click(screen.getByRole("button", { name: "Add expense" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Title" }), { target: { value: "Lunch" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Amount" }), { target: { value: "250" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Category" }), { target: { value: "food" } });
    fireEvent.click(screen.getByRole("button", { name: "Save expense" }));

    expect(screen.getByText('Added "Lunch"')).toBeTruthy();
  });
});

describe("settings", () => {
  it("resets salary, categories and expenses after confirming", async () => {
    localStorage.setItem("salary-manager:config", JSON.stringify({
      salary: 1000, categories, expenses: [expense("a", "Lunch", 100, "2026-09-30T12:00:00Z")],
    }));
    render(<App />);
    openExpenses();
    await screen.findByText("Lunch");

    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    fireEvent.click(screen.getByRole("button", { name: "Reset everything" }));

    expect(screen.getByRole("tab", { name: "Salary", selected: true })).toBeTruthy();
    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem("salary-manager:config")!);
      expect(saved.salary).toBe(0);
      expect(saved.expenses).toEqual([]);
      expect(saved.categories.map((c: Category) => c.name)).not.toContain("Food");
    });
  });

  it("switches to dark and remembers the choice", async () => {
    render(<App />);
    fireEvent.click(await screen.findByRole("button", { name: "Settings" }));
    fireEvent.click(screen.getByRole("radio", { name: "Dark" }));
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(localStorage.getItem("salary-manager:theme")).toBe("dark");
  });
});
