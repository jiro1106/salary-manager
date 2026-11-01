import { useState } from "react";
import type { CSSProperties } from "react";
import { Plus, ChevronDown } from "lucide-react";
import { Category, SubCategory } from "../types";
import { peso, plural, share, uid } from "../lib/format";
import { iconOf } from "../lib/icons";
import SubCategoryRow from "./SubCategoryRow";
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
  onRemoveSub: (subId: string) => void;
}

export default function CategoryCard({
  category: cat,
  salary,
  spent,
  onChange,
  onRemove,
  onRemoveSub,
}: CategoryCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const Icon = iconOf(cat.icon);
  const catAmount = share(salary, cat.percent);

  const subTotal = cat.subs.reduce((s, x) => s + Number(x.percent || 0), 0);
  const subPesoTotal = share(catAmount, subTotal);
  const remaining = catAmount - subPesoTotal;
  // Judged against a tolerance rather than exactly. A sub-item percent
  // that was back-computed from a peso amount carries float dust: three
  // items splitting a category evenly are 33.33333333333333 each and sum
  // to 99.99999999999999, which `=== 100` reads as under-assigned and
  // prints as "₱0.00 left to assign" on a category that is plainly full.
  // The same dust the other way prints "over by ₱0.00". A thousandth of a
  // percent is far finer than any figure on this card is read to, so it
  // is the honest place to call the split even. Percent stays the model —
  // this is not a peso comparison, so a category with no amount yet still
  // reports its items as unassigned rather than as all assigned.
  const EVEN = 1e-3;
  const hasSubs = cat.subs.length > 0;
  const isOver = hasSubs && subTotal - 100 > EVEN;
  const isExact = hasSubs && Math.abs(subTotal - 100) <= EVEN;

  const updateSub = (subId: string, patch: Partial<SubCategory>) =>
    onChange({
      subs: cat.subs.map((s) => (s.id === subId ? { ...s, ...patch } : s)),
    });

  const addSub = () =>
    onChange({
      subs: [...cat.subs, { id: uid(), name: "New item", percent: 0 }],
    });

  const confirmDelete = () => {
    setConfirmOpen(false);
    onRemove();
  };

  const itemCount = plural(cat.subs.length, "item");

  // What is left after expenses; the share's own amount stays the base
  // for the items below, so a sub-item percent keeps meaning the same
  // thing as money is spent.
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
      {/* The category's own ink, filling the head of the card. It carries
          its own top radius rather than being clipped by the card, because
          overflow-hidden would cut the focus ring off the full-width
          disclosure below it. */}
      <div className="rounded-t-slab bg-cat px-card-x pb-[18px] pt-5 text-on-color">
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

      {/* The disclosure at the card floor carries the assignment state. */}
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        aria-expanded={isOpen}
        className={[
          "flex w-full items-center gap-3 px-card-x py-[13px]",
          "text-left font-display text-meta transition-colors duration-fast ease-paper",
          isOver ? "text-action-edge" : "text-ink-soft hover:text-ink",
        ].join(" ")}
      >
        <span>
          {itemCount}
          {hasSubs &&
            (isExact ? (
              <> · all assigned</>
            ) : isOver ? (
              <>
                {" "}
                · over by{" "}
                <b className="font-bold">{peso(subPesoTotal - catAmount)}</b>
              </>
            ) : (
              <>
                {" "}
                · <b className="font-bold text-ink">{peso(remaining)}</b> left to
                assign
              </>
            ))}
        </span>
        <ChevronDown
          size={16}
          strokeWidth={2}
          aria-hidden="true"
          className={[
            "ml-auto shrink-0 transition-transform duration-mid ease-paper",
            isOpen ? "rotate-180" : "",
          ].join(" ")}
        />
      </button>

      {isOpen && (
        <div className="animate-[nala-reveal_200ms_var(--ease)_both] border-t border-line px-card-x pb-5 pt-2">
          {cat.subs.map((sub) => (
            <SubCategoryRow
              key={sub.id}
              sub={sub}
              catAmount={catAmount}
              onChange={(patch) => updateSub(sub.id, patch)}
              onRemove={() => onRemoveSub(sub.id)}
            />
          ))}
          <button
            type="button"
            onClick={addSub}
            className={[
              "mt-[13px] inline-flex min-h-hit -mb-2.5 items-center gap-1.5 rounded-control",
              "font-display text-meta font-extrabold text-action-edge",
              "hover:underline hover:underline-offset-[3px]",
            ].join(" ")}
          >
            <Plus size={15} strokeWidth={2.4} aria-hidden="true" />
            Add an item
          </button>
        </div>
      )}

      {editOpen && (
        <CategoryDialog
          name={cat.name}
          onClose={() => setEditOpen(false)}
          onSave={(name) => onChange({ name })}
        />
      )}

      <ConfirmDialog
        open={confirmOpen}
        title={
          cat.subs.length > 0
            ? `Delete "${cat.name}" and its ${itemCount}?`
            : `Delete "${cat.name}"?`
        }
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
