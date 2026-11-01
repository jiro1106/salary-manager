// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { Category } from "../types";
import CategoryCard from "./CategoryCard";

afterEach(cleanup);

const needs: Category = { id: "needs", name: "Needs", icon: "Wallet", color: "#ff8fa3", percent: 50 };

const renderCard = () => {
  const onChange = vi.fn();
  const onRemove = vi.fn();
  render(
    <CategoryCard category={needs} salary={1000} spent={0} onChange={onChange} onRemove={onRemove} />,
  );
  return { onChange, onRemove };
};

describe("CategoryCard menu", () => {
  it("renames through the edit dialog, trimming and refusing a blank name", () => {
    const { onChange } = renderCard();
    fireEvent.click(screen.getByRole("button", { name: "Options for Needs" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Edit" }));

    const dialog = screen.getByRole("dialog", { name: "Edit category" });
    const field = within(dialog).getByLabelText("Name");
    fireEvent.change(field, { target: { value: "   " } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Save changes" }));
    expect(onChange).not.toHaveBeenCalled();
    expect(within(dialog).getByText("Give the category a name.")).toBeTruthy();

    fireEvent.change(field, { target: { value: "  Bills " } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Save changes" }));
    expect(onChange).toHaveBeenCalledExactlyOnceWith({ name: "Bills" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("deletes only after confirming", () => {
    const { onRemove } = renderCard();
    fireEvent.click(screen.getByRole("button", { name: "Options for Needs" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    expect(screen.queryByRole("menu")).toBeNull();
    expect(onRemove).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Delete category" }));
    expect(onRemove).toHaveBeenCalledOnce();
  });
});

describe("CategoryCard money", () => {
  const renderWith = (spent: number) =>
    render(
      <CategoryCard category={needs} salary={500} spent={spent} onChange={() => {}} onRemove={() => {}} />,
    );

  it("labels what is left and puts spent against the budget", () => {
    renderWith(100);
    expect(screen.getByText("Left")).toBeTruthy();
    expect(screen.getByText("₱150.00")).toBeTruthy();
    expect(screen.getByText("₱100.00 spent")).toBeTruthy();
    const amount = screen.getByRole("textbox", { name: "Needs: amount of this payday" }) as HTMLInputElement;
    expect(amount.value).toBe("250");
  });

  it("converts a peso allotment to a percent of the salary", () => {
    const onChange = vi.fn();
    render(<CategoryCard category={needs} salary={1000} spent={0} onChange={onChange} onRemove={() => {}} />);
    fireEvent.change(screen.getByRole("textbox", { name: "Needs: amount of this payday" }), { target: { value: "333" } });
    expect(onChange).toHaveBeenLastCalledWith({ percent: 33.3 });
  });

  it("turns the peso field off without a salary", () => {
    render(<CategoryCard category={needs} salary={0} spent={0} onChange={() => {}} onRemove={() => {}} />);
    expect((screen.getByRole("textbox", { name: "Needs: amount, set a salary first" }) as HTMLInputElement).disabled).toBe(true);
  });

  it("says over budget with a positive overspend", () => {
    renderWith(400);
    expect(screen.getByText("Over budget")).toBeTruthy();
    expect(screen.getByText("₱150.00")).toBeTruthy();
    expect(screen.queryByText(/-/)).toBeNull();
  });

  it("says nothing spent before any expense", () => {
    renderWith(0);
    expect(screen.getByText("Nothing spent")).toBeTruthy();
  });
});
