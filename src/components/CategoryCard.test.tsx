// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { Category } from "../types";
import CategoryCard from "./CategoryCard";

afterEach(cleanup);

const needs: Category = { id: "needs", name: "Needs", icon: "Wallet", color: "#ff8fa3", percent: 50, subs: [] };

const renderCard = () => {
  const onChange = vi.fn();
  const onRemove = vi.fn();
  render(
    <CategoryCard category={needs} salary={1000} spent={0} onChange={onChange} onRemove={onRemove} onRemoveSub={() => {}} />,
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
