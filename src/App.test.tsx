// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import App from "./App";
import type { Category, Expense } from "./types";

const categories: Category[] = [
  { id: "food", name: "Food", icon: "ShoppingBag", color: "#e6e6e6", percent: 100, subs: [] },
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
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("expense tracking in App", () => {
  it("adds an expense and updates the history and salary summary", async () => {
    localStorage.setItem("salary-manager:config", JSON.stringify({ salary: 1000, categories, expenses: [] }));
    render(<App />);

    await screen.findByRole("tab", { name: "Expenses", selected: true });
    fireEvent.click(screen.getByRole("button", { name: "Add expense" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Title" }), { target: { value: "Lunch" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Amount" }), { target: { value: "250.50" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Category" }), { target: { value: "food" } });
    fireEvent.click(screen.getByRole("button", { name: "Save expense" }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByText("Lunch")).toBeTruthy();
    expect(screen.getAllByText("₱250.50")).toHaveLength(2);
    expect(screen.getByText("₱749.50")).toBeTruthy();
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
    await screen.findByText("Lunch");

    fireEvent.click(screen.getByRole("button", { name: /delete lunch/i }));
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
    await screen.findByText("Lunch");

    fireEvent.click(screen.getByRole("button", { name: /edit lunch/i }));
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
    await screen.findByText("Groceries");
    expect(screen.getByText("Over budget")).toBeTruthy();
    expect(screen.getByText("₱50.25").className).toContain("text-spent");
  });

  it("uses cranberry spent and green available amounts", async () => {
    localStorage.setItem("salary-manager:config", JSON.stringify({
      salary: 500, categories, expenses: [expense("lunch", "Lunch", 200, "2026-09-30T12:00:00Z")],
    }));
    render(<App />);
    await screen.findByText("Lunch");
    const spent = screen.getByText("Spent").parentElement?.lastElementChild;
    const available = screen.getByText("Available").parentElement?.lastElementChild;
    expect(spent?.textContent).toBe("₱200.00");
    expect(spent?.className).toContain("text-spent");
    expect(available?.textContent).toBe("₱300.00");
    expect(available?.className).toContain("text-lime-deep");
  });

  it("explains why adding an expense is unavailable without categories", async () => {
    localStorage.setItem("salary-manager:config", JSON.stringify({ salary: 1000, categories: [], expenses: [] }));
    render(<App />);
    await screen.findByRole("tab", { name: "Expenses", selected: true });
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
});

describe("tabs", () => {
  it("opens on Salary with nothing saved and shows one job at a time", () => {
    render(<App />);
    expect(screen.getByRole("tab", { name: "Salary", selected: true })).toBeTruthy();
    expect(screen.getByRole("textbox", { name: "Take-home pay in pesos" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Add expense" })).toBeNull();
    expect(screen.queryByRole("button", { name: /add category/i })).toBeNull();
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

  it("reports over-allocation on the Split tab", async () => {
    localStorage.setItem("salary-manager:config", JSON.stringify({
      salary: 1000, categories: [{ ...categories[0], percent: 120 }], expenses: [],
    }));
    render(<App />);
    await screen.findByRole("tab", { name: "Expenses", selected: true });
    expect(screen.queryByText(/over by 20%/i)).toBeNull();
    fireEvent.click(screen.getByRole("tab", { name: "Split" }));
    expect(screen.getByText(/over by 20%/i)).toBeTruthy();
  });

  it("confirms an added expense in a toast", async () => {
    localStorage.setItem("salary-manager:config", JSON.stringify({ salary: 1000, categories, expenses: [] }));
    render(<App />);

    await screen.findByRole("tab", { name: "Expenses", selected: true });
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
