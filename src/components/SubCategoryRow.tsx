import { Trash2 } from "lucide-react";
import { SubCategory } from "../types";
import EditableName from "./EditableName";
import IconButton from "./IconButton";
import NumberField from "./NumberField";

/**
 * The width the name holds out for before the figures give up and take
 * their own line: 15 characters, which clears the names the templates
 * ship ("Miscellaneous", "Transportation" abbreviated by the reader, not
 * by us). A 2-up category grid hands a card about 286px of usable width
 * at the narrow end, and the figures need ~180px of it, so a single-line
 * row can only ever offer a name about 11 characters. Above roughly a
 * 380px card everything still fits on one line and this never fires.
 */
const NAME_FLOOR = "min-w-[15ch]";

interface SubCategoryRowProps {
  sub: SubCategory;
  catAmount: number;
  onChange: (patch: Partial<SubCategory>) => void;
  /**
   * Deletes the item outright, with no dialog in front of it. There was
   * one, and it went when the undo bar arrived: a modal is a demand to be
   * certain in advance, and it was standing in front of the cheapest,
   * most-repeated act on the page — one line, deleted, offered back. What
   * still keeps its dialog is deleting a whole category, which takes every
   * item under it along.
   */
  onRemove: () => void;
}

export default function SubCategoryRow({
  sub,
  catAmount,
  onChange,
  onRemove,
}: SubCategoryRowProps) {
  const pesoValue = (catAmount * Number(sub.percent || 0)) / 100;
  // Nothing to divide up yet, so the peso field has no base to work from.
  const pesoDisabled = catAmount <= 0;

  const handlePesoChange = (value: number) => {
    if (catAmount <= 0) return;
    onChange({ percent: (value / catAmount) * 100 });
  };

  return (
    <div className="flex flex-wrap items-center gap-x-[9px] gap-y-2 py-2 [&+&]:border-t [&+&]:border-line-soft">
      {/* The two fields and the delete travel as one block, so a card too
          narrow to hold the row drops all three under the name rather than
          shaving the name down to "Miscellan...". NAME_FLOOR is what the
          name refuses to go below; it is the whole trigger for the wrap. */}
      <div className={`flex flex-1 items-center ${NAME_FLOOR}`}>
        <EditableName
          value={sub.name}
          onChange={(name) => onChange({ name })}
          label={`Rename ${sub.name}`}
          className="text-ui"
        />
      </div>

      {/* No ml-auto: on one line the name's flex-1 already pushes this to
          the right edge, so the only thing ml-auto would do is hard-right
          the wrapped line, where there is nothing on the left to balance
          it and the block reads as jammed into the corner. Left-aligned
          under the name it still forms a column down the card, because
          every row wraps at the same width and the chips are fixed. */}
      <div className="flex items-center gap-[9px]">
        <NumberField
          value={sub.percent}
          onChange={(percent) => onChange({ percent })}
          label={`${sub.name}: share of this category`}
          unit="%"
          tone="sunk"
          width="w-[3ch]"
        />
        <NumberField
          value={Math.round(pesoValue)}
          onChange={handlePesoChange}
          label={`${sub.name}: amount in pesos`}
          unit="₱"
          tone="sunk"
          width="w-[6ch]"
          disabled={pesoDisabled}
        />
        <IconButton label={`Delete ${sub.name}`} onClick={onRemove} danger>
          <Trash2 size={15} strokeWidth={1.7} aria-hidden="true" />
        </IconButton>
      </div>
    </div>
  );
}
