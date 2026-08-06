import { Plus } from "lucide-react";
import { Category } from "../types";
import CategoryCard from "./CategoryCard";

interface CategoryListProps {
  categories: Category[];
  salary: number;
  onChangeCategory: (id: string, patch: Partial<Category>) => void;
  onRemoveCategory: (id: string) => void;
  onAddCategory: () => void;
}

/** A card that isn't there yet: no fill, just the outline. */
function AddCategoryTile({
  onClick,
  full,
}: {
  onClick: () => void;
  full?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "grid min-h-[172px] place-content-center justify-items-center gap-1.5 self-stretch p-[34px]",
        "rounded-slab border-2 border-dashed border-line-strong bg-transparent text-ink-soft",
        "font-display text-body font-extrabold",
        "transition-[transform,border-color,color] duration-[180ms] ease-paper",
        "hover:-translate-y-[3px] hover:border-clay hover:text-clay-edge",
        full ? "col-span-full" : "",
      ].join(" ")}
    >
      <Plus size={28} strokeWidth={2.2} aria-hidden="true" />
      {full ? "Add your first category" : "Add category"}
    </button>
  );
}

export default function CategoryList({
  categories,
  salary,
  onChangeCategory,
  onRemoveCategory,
  onAddCategory,
}: CategoryListProps) {
  return (
    <div className="mt-stack grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] items-start gap-gutter">
      {categories.length === 0 ? (
        // Nothing to split yet: one full-width invitation rather than a
        // bare dashed tile stranded in a column.
        <AddCategoryTile onClick={onAddCategory} full />
      ) : (
        <>
          {categories.map((cat) => (
            <CategoryCard
              key={cat.id}
              category={cat}
              salary={salary}
              onChange={(patch) => onChangeCategory(cat.id, patch)}
              onRemove={() => onRemoveCategory(cat.id)}
            />
          ))}
          <AddCategoryTile onClick={onAddCategory} />
        </>
      )}
    </div>
  );
}
