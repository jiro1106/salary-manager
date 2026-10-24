// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import type { Category, ExpenseDraft, ExpenseErrors } from "../types";
import ExpenseDialog from "./ExpenseDialog";

const categories: Category[] = [
  { id: "food", name: "Food", icon: "ShoppingBag", color: "blue", percent: 50, subs: [] },
  { id: "rent", name: "Rent", icon: "Wallet", color: "lime", percent: 50, subs: [] },
];

afterEach(cleanup);

function Harness({ onSubmit = () => ({}) }: { onSubmit?: (draft: ExpenseDraft) => ExpenseErrors }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Open expense</button>
      {open && (
        <ExpenseDialog
          categories={categories}
          onClose={() => setOpen(false)}
          onSubmit={onSubmit}
        />
      )}
    </>
  );
}

function openDialog() {
  const trigger = screen.getByRole("button", { name: "Open expense" });
  trigger.focus();
  fireEvent.click(trigger);
  return trigger;
}

describe("ExpenseDialog", () => {
  it("shows current category options and focuses the title", () => {
    render(<Harness />);
    openDialog();

    const dialog = screen.getByRole("dialog", { name: "Add expense" });
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    const description = screen.getByText("Record spending against your salary.");
    expect(dialog.getAttribute("aria-describedby")).toBe(description.id);
    expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "Title" }));
    expect(Array.from((screen.getByRole("combobox", { name: "Category" }) as HTMLSelectElement).options).map((option) => [option.value, option.textContent])).toEqual([
      ["", "Choose a category"],
      ["food", "Food"],
      ["rent", "Rent"],
    ]);
  });

  it("keeps returned field errors visible and associated with inputs", () => {
    render(<Harness onSubmit={() => ({ title: "Enter a title.", amount: "Enter an amount.", categoryId: "Choose a category." })} />);
    openDialog();
    fireEvent.click(screen.getByRole("button", { name: "Save expense" }));

    expect(screen.getByRole("dialog", { name: "Add expense" })).toBeTruthy();
    for (const [name, message] of [["Title", "Enter a title."], ["Amount", "Enter an amount."], ["Category", "Choose a category."]]) {
      const field = screen.getByRole(name === "Category" ? "combobox" : "textbox", { name });
      const error = screen.getByText(message);
      expect(field.getAttribute("aria-invalid")).toBe("true");
      expect(field.getAttribute("aria-describedby")).toBe(error.id);
    }
  });

  it("submits entered values, resets, closes, and restores trigger focus", () => {
    const onSubmit = vi.fn(() => ({}));
    render(<Harness onSubmit={onSubmit} />);
    const trigger = openDialog();
    fireEvent.change(screen.getByRole("textbox", { name: "Title" }), { target: { value: "Lunch" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Amount" }), { target: { value: "250.50" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Category" }), { target: { value: "food" } });
    fireEvent.click(screen.getByRole("button", { name: "Save expense" }));

    expect(onSubmit).toHaveBeenCalledWith({ title: "Lunch", amount: "250.50", categoryId: "food" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(trigger);
    fireEvent.click(trigger);
    expect((screen.getByRole("textbox", { name: "Title" }) as HTMLInputElement).value).toBe("");
    expect((screen.getByRole("textbox", { name: "Amount" }) as HTMLInputElement).value).toBe("");
    expect((screen.getByRole("combobox", { name: "Category" }) as HTMLSelectElement).value).toBe("");
  });

  it("drops letters from the amount and explains a bad figure while typing", () => {
    render(<Harness />);
    openDialog();
    const amount = screen.getByRole("textbox", { name: "Amount" }) as HTMLInputElement;

    fireEvent.change(amount, { target: { value: "sadd" } });
    expect(amount.value).toBe("");
    expect(amount.getAttribute("aria-invalid")).toBeNull();

    fireEvent.change(amount, { target: { value: "₱1,2a50" } });
    expect(amount.value).toBe("1250");

    fireEvent.change(amount, { target: { value: "-5" } });
    expect(screen.getByText("Amount can't be negative. Enter 0.01 or more.")).toBeTruthy();
    expect(amount.getAttribute("aria-invalid")).toBe("true");

    fireEvent.change(amount, { target: { value: "1234567890" } });
    expect(screen.getByText("Too large. Use up to 9 digits before the decimal point.")).toBeTruthy();

    fireEvent.change(amount, { target: { value: "250" } });
    expect(amount.getAttribute("aria-invalid")).toBeNull();
  });

  it("closes on Escape and restores focus", () => {
    render(<Harness />);
    const trigger = openDialog();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("closes from the scrim and Cancel button", () => {
    render(<Harness />);
    const trigger = openDialog();
    fireEvent.click(screen.getByRole("dialog").parentElement!);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(trigger);
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("wraps Tab focus at both ends", () => {
    render(<Harness />);
    openDialog();
    const title = screen.getByRole("textbox", { name: "Title" });
    const save = screen.getByRole("button", { name: "Save expense" });
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(save);
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(title);
  });
});
