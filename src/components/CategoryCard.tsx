import { useState } from "react";
import type { CSSProperties } from "react";
import { Plus, Trash2, ChevronDown } from "lucide-react";
import { Category, SubCategory } from "../types";
import { peso, uid } from "../lib/format";
import { iconOf } from "../lib/icons";
import { edgeOf } from "../lib/palette";
import SubCategoryRow from "./SubCategoryRow";
import ConfirmDialog from "./ConfirmDialog";
import EditableName from "./EditableName";
import IconButton from "./IconButton";
import NumberField from "./NumberField";

interface CategoryCardProps {
  category: Category;
  salary: number;
  onChange: (patch: Partial<Category>) => void;
  onRemove: () => void;
}

export default function CategoryCard({
  category: cat,
  salary,
  onChange,
  onRemove,
}: CategoryCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const Icon = iconOf(cat.icon);
  const catAmount = (salary * Number(cat.percent || 0)) / 100;

  const subTotal = cat.subs.reduce((s, x) => s + Number(x.percent || 0), 0);
  const subPesoTotal = (catAmount * subTotal) / 100;
  const remaining = catAmount - subPesoTotal;
  const isOver = cat.subs.length > 0 && subTotal > 100;

  const updateSub = (subId: string, patch: Partial<SubCategory>) =>
    onChange({
      subs: cat.subs.map((s) => (s.id === subId ? { ...s, ...patch } : s)),
    });

  const removeSub = (subId: string) =>
    onChange({ subs: cat.subs.filter((s) => s.id !== subId) });

  const addSub = () =>
    onChange({
      subs: [...cat.subs, { id: uid(), name: "New item", percent: 0 }],
    });

  const confirmDelete = () => {
    setConfirmOpen(false);
    onRemove();
  };

  const itemCount = `${cat.subs.length} item${cat.subs.length !== 1 ? "s" : ""}`;

  return (
    <article
      className={[
        "relative rounded-slab border border-line bg-card",
        "transition-[transform,border-color] duration-[180ms] ease-paper",
        "hover:-translate-y-[2px] hover:border-line-strong",
      ].join(" ")}
      // The data owns the colour; components never name an ink.
      style={{ "--c": cat.color, "--ce": edgeOf(cat.color) } as CSSProperties}
    >
      {/* The category's own ink, filling the head of the card. It carries
          its own top radius rather than being clipped by the card, because
          overflow-hidden would cut the focus ring off the full-width
          disclosure below it. */}
      <div className="rounded-t-slab bg-cat px-[22px] pb-[18px] pt-5 text-on-color">
        <div className="flex items-center gap-[11px]">
          <span
            aria-hidden="true"
            className="grid h-[34px] w-[34px] flex-none place-items-center rounded-control bg-card"
          >
            <Icon size={18} strokeWidth={2} className="text-cat-edge" />
          </span>
          <EditableName
            value={cat.name}
            onChange={(name) => onChange({ name })}
            label={`Rename ${cat.name}`}
            tone="colour"
            className="font-display text-title font-extrabold"
          />
          <IconButton
            label={`Delete ${cat.name}`}
            onClick={() => setConfirmOpen(true)}
            tone="colour"
          >
            <Trash2 size={16} strokeWidth={1.7} aria-hidden="true" />
          </IconButton>
        </div>

        <div className="mt-4 flex items-center gap-[9px]">
          <NumberField
            value={cat.percent}
            onChange={(percent) => onChange({ percent })}
            label={`${cat.name}: share of this payday`}
            unit="%"
            tone="card"
            width="w-[3ch]"
          />
          <span className="ml-auto font-display text-amt font-extrabold text-on-color">
            {peso(catAmount)}
          </span>
        </div>
      </div>

      {/* The disclosure at the card floor carries the assignment state. */}
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        aria-expanded={isOpen}
        className={[
          "flex w-full items-center gap-3 px-[22px] py-[13px]",
          "text-left font-display text-meta transition-colors duration-fast ease-paper",
          isOver ? "text-clay-edge" : "text-ink-soft hover:text-ink",
        ].join(" ")}
      >
        <span>
          {itemCount}
          {cat.subs.length > 0 &&
            (subTotal === 100 ? (
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
        <div className="animate-[nala-reveal_200ms_var(--ease)_both] border-t border-line px-[22px] pb-5 pt-2">
          {cat.subs.map((sub) => (
            <SubCategoryRow
              key={sub.id}
              sub={sub}
              catAmount={catAmount}
              onChange={(patch) => updateSub(sub.id, patch)}
              onRemove={() => removeSub(sub.id)}
            />
          ))}
          <button
            type="button"
            onClick={addSub}
            className={[
              "mt-[13px] inline-flex min-h-hit -mb-2.5 items-center gap-1.5 rounded-control",
              "font-display text-meta font-extrabold text-clay-edge",
              "hover:underline hover:underline-offset-[3px]",
            ].join(" ")}
          >
            <Plus size={15} strokeWidth={2.4} aria-hidden="true" />
            Add an item
          </button>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title={
          cat.subs.length > 0
            ? `Delete "${cat.name}" and its ${cat.subs.length} item${cat.subs.length !== 1 ? "s" : ""}?`
            : `Delete "${cat.name}"?`
        }
        description={`Its ${Math.round(Number(cat.percent) || 0)}% goes back to unassigned. This cannot be undone.`}
        confirmLabel="Delete category"
        onConfirm={confirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </article>
  );
}
