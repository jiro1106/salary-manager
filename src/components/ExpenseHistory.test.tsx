// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { Expense } from "../types";
import ExpenseHistory from "./ExpenseHistory";

afterEach(cleanup);

const earlier: Expense = {
  id: "earlier",
  title: "Train fare",
  amount: 45.5,
  categoryId: "travel",
  categoryName: "Commute (old name)",
  created_at: "2026-09-30T09:15:00",
};
const later: Expense = {
  id: "later",
  title: "Lunch",
  amount: 1250,
  categoryId: "food",
  categoryName: "Food & groceries",
  created_at: "2026-09-30T12:34:00",
};

describe("ExpenseHistory", () => {
  it("shows newest first with saved category names, amounts, and local date and time without reordering props", () => {
    const expenses = [earlier, later];
    render(<ExpenseHistory expenses={expenses} onDelete={() => {}} onUndo={() => {}} />);

    const rows = screen.getAllByRole("listitem");
    expect(rows).toHaveLength(2);
    expect(within(rows[0]).getByText("Lunch")).toBeTruthy();
    expect(within(rows[0]).getByText("Food & groceries")).toBeTruthy();
    expect(within(rows[0]).getByText("₱1,250.00")).toBeTruthy();
    expect(within(rows[0]).getByText(/Sep 30, 2026.*12:34 PM/)).toBeTruthy();
    expect(within(rows[1]).getByText("Train fare")).toBeTruthy();
    expect(within(rows[1]).getByText("Commute (old name)")).toBeTruthy();
    expect(within(rows[1]).getByText("₱45.50")).toBeTruthy();
    expect(expenses).toEqual([earlier, later]);
  });

  it("shows an empty state when there are no expenses", () => {
    render(<ExpenseHistory expenses={[]} onDelete={() => {}} onUndo={() => {}} />);
    expect(screen.getByText(/no expenses yet/i)).toBeTruthy();
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });

  it("deletes the selected expense from its accessible button", () => {
    const onDelete = vi.fn();
    render(<ExpenseHistory expenses={[earlier, later]} onDelete={onDelete} onUndo={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /delete lunch/i }));
    expect(onDelete).toHaveBeenCalledExactlyOnceWith("later");
  });

  it("offers undo for the supplied deleted expense", () => {
    const onUndo = vi.fn();
    render(<ExpenseHistory expenses={[]} undoExpense={later} onDelete={() => {}} onUndo={onUndo} />);
    expect(screen.getByRole("status").textContent).toContain("Lunch");
    fireEvent.click(screen.getByRole("button", { name: /undo/i }));
    expect(onUndo).toHaveBeenCalledOnce();
  });
});
