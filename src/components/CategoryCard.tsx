import { useState } from "react";
import type { CSSProperties } from "react";
import { Category } from "../types";
import { peso, share } from "../lib/format";
import { iconOf } from "../lib/icons";
import CategoryDialog from "./CategoryDialog";
import CategoryMenu from "./CategoryMenu";
import ConfirmDialog from "./ConfirmDialog";
import NumberField from "./NumberField";

interface CategoryCardProps {
  category: Category;
  salary: number;
  spent: number;
  onChange: (patch: Partial<Category>) => void;
  onRemove: () => void;
}

export default function CategoryCard({
  category: cat,
  salary,
  spent,
  onChange,
  onRemove,
}: CategoryCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const Icon = iconOf(cat.icon);
  const catAmount = share(salary, cat.percent);

  const confirmDelete = () => {
    setConfirmOpen(false);
    onRemove();
  };

  // What is left of this category's budget after its expenses.
  const left = catAmount - spent;
  const isOverspent = left < 0;
  // Under budget the bar is the budget and ink fills what is spent. Over
  // it, the bar is everything spent: ink up to the budget, red past it, so
  // ₱500 of ₱100 reads as four times over and not just "full".
  const inkShare = isOverspent ? catAmount / spent : catAmount > 0 ? spent / catAmount : 0;

  return (
    <article
      className={[
        "relative rounded-slab border border-line bg-card",
        "transition-[transform,border-color] duration-mid ease-paper",
        "hover:-translate-y-[2px] hover:border-line-strong",
        // An open menu has to paint over the cards after this one.
        "has-[[aria-haspopup=menu][aria-expanded=true]]:z-10",
      ].join(" ")}
      // The data owns the colour; components never name an ink.
      style={{ "--c": cat.color } as CSSProperties}
    >
      {/* The category's own ink, filling the card. It carries its own
          radius rather than being clipped by the card, because
          overflow-hidden would cut the focus ring off the menu button. */}
      <div className="rounded-slab bg-cat px-card-x pb-[18px] pt-5 text-on-color">
        <div className="flex items-center gap-[11px]">
          <span
            aria-hidden="true"
            className="grid h-[34px] w-[34px] flex-none place-items-center rounded-control bg-white/25"
          >
            <Icon size={18} strokeWidth={2} className="text-on-color" />
          </span>
          {/* The category name is this card's heading, so the grid gives
              a screen reader a real outline (the wordmark is the h1).
              Preflight strips the heading's own styles, so it adds
              structure only. */}
          <h2 className="min-w-0 flex-1 truncate font-display text-title font-bold">
            {cat.name}
          </h2>
          <CategoryMenu
            name={cat.name}
            onEdit={() => setEditOpen(true)}
            onDelete={() => setConfirmOpen(true)}
          />
        </div>

        {/* One labelled figure, then the meter, then the two inputs to it.
            Over budget is said in words with the overspend as a positive
            amount; a minus sign in the same ink as a healthy balance was
            the only signal before. */}
        {/* Status in green or red on a chip of its own: either ink set
            straight on a face fails (red on the pink face is 2.9:1, green
            on lime 2.9:1). White on the fill clears 4.5:1 for both. */}
        <p
          className={[
            "mt-4 inline-block rounded-full px-2.5 py-0.5 text-label font-bold uppercase tracking-caps text-on-action",
            isOverspent ? "bg-spent" : "bg-lime-deep",
          ].join(" ")}
        >
          {isOverspent ? "Over budget" : "Left"}
        </p>
        <p className="mt-1.5 font-display text-amt font-extrabold">{peso(Math.abs(left))}</p>
        {/* Ink on the same frost as the percent chip: the one fill that
            reads on every face. The overspend is red on that frost, 4.41:1
            on the worst face. */}
        <div aria-hidden="true" className="relative mt-3 h-3 overflow-hidden rounded-full bg-white/55">
          {isOverspent && (
            <div
              className="absolute inset-0 origin-right bg-spent transition-transform duration-mid ease-paper"
              style={{ transform: `scaleX(${1 - inkShare})` }}
            />
          )}
          <div
            className="absolute inset-0 origin-left bg-on-color transition-transform duration-mid ease-paper"
            style={{ transform: `scaleX(${inkShare})` }}
          />
        </div>
        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-3 font-display text-meta">
          <span>{spent > 0 ? `${peso(spent)} spent` : "Nothing spent"}</span>
          <span className="flex items-center gap-2">
            of {peso(catAmount)}
            <NumberField
              value={cat.percent}
              onChange={(percent) => onChange({ percent })}
              label={`${cat.name}: share of this payday`}
              unit="%"
              tone="colour"
              width="w-[3ch]"
            />
          </span>
        </div>
      </div>

      {editOpen && (
        <CategoryDialog
          name={cat.name}
          onClose={() => setEditOpen(false)}
          onSave={(name) => onChange({ name })}
        />
      )}

      <ConfirmDialog
        open={confirmOpen}
        title={`Delete "${cat.name}"?`}
        // The dialog survives undo because the two answer different
        // questions: it names what is about to go (a card, and everything
        // filed under it), and the undo bar catches the reader who said
        // yes to that and meant no.
        description={`Its ${Math.round(Number(cat.percent) || 0)}% goes back to unassigned. You can undo this straight after.`}
        confirmLabel="Delete category"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </article>
  );
}
