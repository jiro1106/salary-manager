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

    await waitFor(() => expect((screen.getByRole("textbox", { name: "Take-home pay in pesos" }) as HTMLInputElement).value).toBe("1,000"));
    expect(screen.getByRole("button", { name: "Clear salary amount" })).toBeTruthy();
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

  it("deletes one expense and undo restores its original stored position", async () => {
    const expenses = [
      expense("a", "Breakfast", 100, "2026-09-30T09:00:00Z"),
      expense("b", "Lunch", 200, "2026-09-30T12:00:00Z"),
      expense("c", "Dinner", 300, "2026-09-30T18:00:00Z"),
    ];
    localStorage.setItem("salary-manager:config", JSON.stringify({ salary: 1000, categories, expenses }));
    render(<App />);
    await screen.findByText("Lunch");

    fireEvent.click(screen.getByRole("button", { name: /delete lunch/i }));
    expect(screen.queryByText("Lunch")).toBeNull();
    expect(screen.getByText("₱400.00")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(screen.getByText("Lunch")).toBeTruthy();
    expect(screen.getByText("₱400.00")).toBeTruthy();
    await waitFor(() => expect(JSON.parse(localStorage.getItem("salary-manager:config")!).expenses).toEqual(expenses));
  });

  it("loads an old config without expenses as an empty history", async () => {
    localStorage.setItem("salary-manager:config", JSON.stringify({ salary: 500, categories }));
    render(<App />);
    await waitFor(() => expect((screen.getByRole("textbox", { name: "Take-home pay in pesos" }) as HTMLInputElement).value).toBe("500"));
    expect(screen.getByText(/no expenses yet/i)).toBeTruthy();
    expect(screen.getByText("₱0.00")).toBeTruthy();
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
    await waitFor(() => expect((screen.getByRole("textbox", { name: "Take-home pay in pesos" }) as HTMLInputElement).value).toBe("1,000"));
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
