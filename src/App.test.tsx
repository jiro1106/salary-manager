// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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
    expect(screen.queryByRole("textbox", { name: "Take-home pay in pesos" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Edit salary" }));
    expect((screen.getByRole("textbox", { name: "Take-home pay in pesos" }) as HTMLInputElement).value).toBe("500");
  });

  it("shows the amount over budget when expenses exceed salary", async () => {
    localStorage.setItem("salary-manager:config", JSON.stringify({
      salary: 100, categories, expenses: [expense("over", "Groceries", 150.25, "2026-09-30T12:00:00Z")],
    }));
    render(<App />);
    openExpenses();
    await screen.findByText("Groceries");
    const over = screen.getByText("Over budget").nextElementSibling;
    expect(over?.textContent).toBe("₱50.25");
    expect(over?.className).toContain("text-over");
  });

  it("shows salary, cranberry spent, and green available", async () => {
    localStorage.setItem("salary-manager:config", JSON.stringify({
      salary: 500, categories, expenses: [expense("lunch", "Lunch", 200, "2026-09-30T12:00:00Z")],
    }));
    render(<App />);
    openExpenses();
    await screen.findByText("Lunch");
    expect(screen.getByText("Salary", { selector: "p" }).nextElementSibling?.textContent).toBe("₱500.00");
    const spent = screen.getByText("Spent").nextElementSibling;
    expect(spent?.textContent).toBe("₱200.00");
    expect(spent?.className).toContain("text-spent");
    const available = screen.getByText("Available").nextElementSibling;
    expect(available?.textContent).toBe("₱300.00");
    expect(available?.className).toContain("text-lime-deep");
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
    expect(screen.getByText("Available").nextElementSibling?.textContent).toBe("₱100.00");

    fireEvent.click(screen.getByRole("button", { name: /filter by category/i }));
    fireEvent.click(screen.getByRole("option", { name: "Travel" }));
    expect(screen.queryByText("Salary", { selector: "p" })).toBeNull();
    expect(screen.queryByText("Lunch")).toBeNull();
    expect(screen.getByText("Travel", { selector: "p" }).nextElementSibling?.textContent).toBe("₱500.00");
    expect(screen.getByText("Spent").nextElementSibling?.textContent).toBe("₱700.00");
    expect(screen.getByText("Over budget").nextElementSibling?.textContent).toBe("₱200.00");

    fireEvent.click(screen.getByRole("button", { name: /filter by category/i }));
    fireEvent.click(screen.getByRole("option", { name: "Food" }));
    expect(screen.getByText("Available").nextElementSibling?.textContent).toBe("₱300.00");
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

describe("salary edits and paydays", () => {
  const editSalary = (value: string) => {
    fireEvent.click(screen.getByRole("button", { name: "Edit salary" }));
    const input = screen.getByRole("textbox", { name: "Take-home pay in pesos" });
    fireEvent.change(input, { target: { value } });
    fireEvent.keyDown(input, { key: "Enter" });
  };
  const saved = () => JSON.parse(localStorage.getItem("salary-manager:config")!);

  it("saves a first salary without asking and locks it", async () => {
    render(<App />);
    const input = screen.getByRole("textbox", { name: "Take-home pay in pesos" });
    fireEvent.change(input, { target: { value: "2000" } });
    fireEvent.click(screen.getByRole("button", { name: "Save salary" }));
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(screen.getByRole("button", { name: "Edit salary" })).toBeTruthy();
    await waitFor(() => expect(saved().salary).toBe(2000));
    expect(saved().startedAt).toBeTruthy();
  });

  const withExpense = () => localStorage.setItem("salary-manager:config", JSON.stringify({
    salary: 1000, categories, expenses: [expense("a", "Lunch", 100, "2026-09-30T12:00:00Z")],
  }));

  it("starts a new payday and archives the expenses", async () => {
    withExpense();
    render(<App />);
    fireEvent.click(await screen.findByRole("button", { name: "Start new payday" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Salary" }), { target: { value: "2000" } });
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Start new payday" }));

    await waitFor(() => {
      expect(saved().salary).toBe(2000);
      expect(saved().expenses).toEqual([]);
      expect(saved().pastPaydays).toHaveLength(1);
    });
    const past = saved().pastPaydays[0];
    expect(past.salary).toBe(1000);
    expect(past.expenses.map((e: Expense) => e.id)).toEqual(["a"]);
    expect(past.startedAt).toBe("2026-09-30T12:00:00Z");
    expect(past.categories).toEqual(categories);
    // Nothing left to archive.
    expect(screen.queryByRole("button", { name: "Start new payday" })).toBeNull();

    openExpenses();
    expect(screen.getByRole("heading", { name: /Past paydays/ })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "View all 1" }));
    expect(screen.getByRole("dialog").textContent).toContain("Lunch");
  });

  it("edits this payday from the pencil and keeps the expenses", async () => {
    withExpense();
    render(<App />);
    await screen.findByRole("button", { name: "Start new payday" });
    editSalary("2000");
    expect(screen.queryByRole("alertdialog")).toBeNull();
    await waitFor(() => expect(saved().salary).toBe(2000));
    expect(saved().expenses).toHaveLength(1);
    expect(saved().pastPaydays).toEqual([]);
  });

  it("deletes a past payday after confirming", async () => {
    const past = { salary: 500, categories, expenses: [expense("old", "Rent", 300, "2026-09-01T12:00:00Z")], startedAt: "2026-09-01T12:00:00Z", endedAt: "2026-09-15T12:00:00Z" };
    localStorage.setItem("salary-manager:config", JSON.stringify({ salary: 1000, categories, expenses: [], pastPaydays: [past] }));
    render(<App />);
    openExpenses();
    const trash = await screen.findByRole("button", { name: /Delete payday/ });
    fireEvent.click(trash);
    // The click opens the confirm without expanding the row.
    expect((trash.closest("details") as HTMLDetailsElement).open).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(saved().pastPaydays).toEqual([]));
    expect(screen.queryByRole("heading", { name: /Past paydays/ })).toBeNull();
  });

  it("hides the new payday button without expenses", () => {
    localStorage.setItem("salary-manager:config", JSON.stringify({ salary: 1000, categories, expenses: [] }));
    render(<App />);
    expect(screen.queryByRole("button", { name: "Start new payday" })).toBeNull();
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
      expect(saved.pastPaydays).toEqual([]);
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
