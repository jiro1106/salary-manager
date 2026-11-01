// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { Category, Expense } from "../types";
import { peso } from "../lib/format";
import ExpenseHistory from "./ExpenseHistory";

afterEach(cleanup);

const earlier: Expense = {
  id: "earlier",
  title: "Train fare",
  amount: 45.5,
  categoryId: "travel",
  categoryName: "Commute (old name)",
  created_at: "2026-09-30T09:15:00.000Z",
};
const later: Expense = {
  id: "later",
  title: "Lunch",
  amount: 1250,
  categoryId: "food",
  categoryName: "Food & groceries",
  created_at: "2026-09-30T12:34:00.000Z",
};

describe("ExpenseHistory", () => {
  it("shows newest first with saved category names, amounts, and local date and time without reordering props", () => {
    const expenses = [earlier, later];
    render(<ExpenseHistory filter={null} onEdit={() => {}} categories={[]} expenses={expenses} onDelete={() => {}} />);

    const rows = screen.getAllByRole("listitem");
    expect(rows).toHaveLength(2);
    expect(within(rows[0]).getByText("Lunch")).toBeTruthy();
    expect(within(rows[0]).getByText("Food & groceries")).toBeTruthy();
    expect(within(rows[0]).getByText("₱1,250.00")).toBeTruthy();
    expect(within(rows[0]).getByText(/^\d{1,2}:\d{2}\s?[AP]M$/i)).toBeTruthy();
    expect(within(rows[1]).getByText("Train fare")).toBeTruthy();
    expect(within(rows[1]).getByText("Commute (old name)")).toBeTruthy();
    expect(within(rows[1]).getByText("₱45.50")).toBeTruthy();
    expect(expenses).toEqual([earlier, later]);
  });

  it("shows an empty state when there are no expenses", () => {
    render(<ExpenseHistory filter={null} onEdit={() => {}} categories={[]} expenses={[]} onDelete={() => {}} />);
    expect(screen.getByText(/no expenses yet/i)).toBeTruthy();
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });

  it("asks before deleting, and deletes only on confirm", () => {
    const onDelete = vi.fn();
    render(<ExpenseHistory filter={null} onEdit={() => {}} categories={[]} expenses={[earlier, later]} onDelete={onDelete} />);

    fireEvent.click(screen.getByRole("button", { name: /options for lunch/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    expect(screen.getByRole("alertdialog", { name: 'Delete "Lunch"?' })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(onDelete).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /options for lunch/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    fireEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Delete" }));
    expect(onDelete).toHaveBeenCalledExactlyOnceWith("later");
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("groups by day, newest day first, headed by weekday then date", () => {
    const older = { ...earlier, created_at: new Date(2026, 9, 24, 15, 5).toISOString() };
    const newer = { ...later, created_at: new Date(2026, 9, 26, 9, 0).toISOString() };
    render(<ExpenseHistory filter={null} onEdit={() => {}} categories={[]} expenses={[older, newer]} onDelete={() => {}} />);

    const heads = screen.getAllByRole("heading", { level: 3 });
    expect(heads.map((h) => h.textContent)).toEqual(["Monday", "Saturday"]);
    expect(heads[0].nextElementSibling?.textContent).toBe("Oct 26, 2026");
    expect(heads[1].nextElementSibling?.textContent).toBe("Oct 24, 2026");
    const dayTotals = screen.getAllByText("Day total").map((s) => s.parentElement?.textContent);
    expect(dayTotals).toEqual([`Day total ${peso(newer.amount)}`, `Day total ${peso(older.amount)}`]);
  });

  it("shows 5 days at first and 5 more per load more", () => {
    const expenses = Array.from({ length: 12 }, (_, i) => ({
      ...earlier,
      id: `day${i}`,
      created_at: new Date(2026, 9, 1 + i, 12).toISOString(),
    }));
    render(<ExpenseHistory filter={null} onEdit={() => {}} categories={[]} expenses={expenses} onDelete={() => {}} />);

    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(5);
    fireEvent.click(screen.getByRole("button", { name: "Load more" }));
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(10);
    fireEvent.click(screen.getByRole("button", { name: "Load more" }));
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(12);
    expect(screen.queryByRole("button", { name: "Load more" })).toBeNull();
  });

  it("distinguishes delete buttons for expenses with the same title", () => {
    const sameTitle = {
      ...earlier,
      title: "Lunch",
      amount: 45.5,
    };
    render(<ExpenseHistory filter={null} onEdit={() => {}} categories={[]} expenses={[sameTitle, later]} onDelete={() => {}} />);

    const rows = screen.getAllByRole("listitem");
    const labels = rows.map((row) => within(row).getByRole("button", { name: /options for lunch/i }).getAttribute("aria-label"));
    expect(labels[0]).toContain("₱1,250.00");
    expect(labels[1]).toContain("₱45.50");
    expect(labels[0]).not.toBe(labels[1]);
  });

  it("marks each row with its category's tile, and an empty one once the category is gone", () => {
    const food: Category = { id: "food", name: "Food", icon: "ShoppingBag", color: "#ffd23f", percent: 50 };
    const { container } = render(
      <ExpenseHistory filter={null} onEdit={() => {}} categories={[food]} expenses={[earlier, later]} onDelete={() => {}} />,
    );
    const tiles = container.querySelectorAll("li > span[aria-hidden]");
    expect((tiles[0] as HTMLElement).style.getPropertyValue("--c")).toBe("#ffd23f");
    expect(tiles[0].querySelector("svg")).toBeTruthy();
    expect(tiles[1].className).toContain("bg-sunk");
    expect(tiles[1].querySelector("svg")).toBeNull();
  });

  it("shows only the filtered category's expenses", () => {
    const travel: Category = { id: "travel", name: "Travel", icon: "Wallet", color: "#a5e34d", percent: 50 };
    render(<ExpenseHistory filter="travel" onEdit={() => {}} categories={[travel]} expenses={[earlier, later]} onDelete={() => {}} />);

    const rows = screen.getAllByRole("listitem");
    expect(rows).toHaveLength(1);
    expect(within(rows[0]).getByText("Train fare")).toBeTruthy();
  });
});
