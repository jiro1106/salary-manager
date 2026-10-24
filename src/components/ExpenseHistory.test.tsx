// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { Category, Expense } from "../types";
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
    render(<ExpenseHistory categories={[]} expenses={expenses} onDelete={() => {}} />);

    const rows = screen.getAllByRole("listitem");
    expect(rows).toHaveLength(2);
    expect(within(rows[0]).getByText("Lunch")).toBeTruthy();
    expect(within(rows[0]).getByText("Food & groceries")).toBeTruthy();
    expect(within(rows[0]).getByText("₱1,250.00")).toBeTruthy();
    expect(within(rows[0]).getByText(/2026.*\d{1,2}:\d{2}/)).toBeTruthy();
    expect(within(rows[1]).getByText("Train fare")).toBeTruthy();
    expect(within(rows[1]).getByText("Commute (old name)")).toBeTruthy();
    expect(within(rows[1]).getByText("₱45.50")).toBeTruthy();
    expect(expenses).toEqual([earlier, later]);
  });

  it("shows an empty state when there are no expenses", () => {
    render(<ExpenseHistory categories={[]} expenses={[]} onDelete={() => {}} />);
    expect(screen.getByText(/no expenses yet/i)).toBeTruthy();
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });

  it("asks before deleting, and deletes only on confirm", () => {
    const onDelete = vi.fn();
    render(<ExpenseHistory categories={[]} expenses={[earlier, later]} onDelete={onDelete} />);

    fireEvent.click(screen.getByRole("button", { name: /delete lunch/i }));
    expect(screen.getByRole("alertdialog", { name: 'Delete "Lunch"?' })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(onDelete).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /delete lunch/i }));
    fireEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Delete" }));
    expect(onDelete).toHaveBeenCalledExactlyOnceWith("later");
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("distinguishes delete buttons for expenses with the same title", () => {
    const sameTitle = {
      ...earlier,
      title: "Lunch",
      amount: 45.5,
    };
    render(<ExpenseHistory categories={[]} expenses={[sameTitle, later]} onDelete={() => {}} />);

    const rows = screen.getAllByRole("listitem");
    const labels = rows.map((row) => within(row).getByRole("button", { name: /delete lunch/i }).getAttribute("aria-label"));
    expect(labels[0]).toContain("₱1,250.00");
    expect(labels[1]).toContain("₱45.50");
    expect(labels[0]).toContain(rows[0].querySelector("time")?.textContent);
    expect(labels[1]).toContain(rows[1].querySelector("time")?.textContent);
    expect(labels[0]).not.toBe(labels[1]);
  });

  it("keeps delete labels unique for otherwise identical expenses in one minute", () => {
    const sameMinute = { ...later, id: "same-minute", created_at: "2026-09-30T12:34:30.000Z" };
    const sameTimestamp = { ...later, id: "same-timestamp" };
    render(
      <ExpenseHistory
        categories={[]}
        expenses={[later, sameMinute, sameTimestamp]}
        onDelete={() => {}}
       
      />,
    );

    const labels = screen.getAllByRole("button", { name: /delete lunch/i }).map((button) => button.getAttribute("aria-label"));
    expect(new Set(labels).size).toBe(3);
    expect(labels.some((label) => label?.includes("later"))).toBe(true);
    expect(labels.some((label) => label?.includes("same-minute"))).toBe(true);
    expect(labels.some((label) => label?.includes("same-timestamp"))).toBe(true);
  });

  it("marks each row with its category's tile, and an empty one once the category is gone", () => {
    const food: Category = { id: "food", name: "Food", icon: "ShoppingBag", color: "#ffd23f", percent: 50, subs: [] };
    const { container } = render(
      <ExpenseHistory categories={[food]} expenses={[earlier, later]} onDelete={() => {}} />,
    );
    const tiles = container.querySelectorAll("li > span[aria-hidden]");
    expect((tiles[0] as HTMLElement).style.getPropertyValue("--c")).toBe("#ffd23f");
    expect(tiles[0].querySelector("svg")).toBeTruthy();
    expect(tiles[1].className).toContain("bg-sunk");
    expect(tiles[1].querySelector("svg")).toBeNull();
  });
});
