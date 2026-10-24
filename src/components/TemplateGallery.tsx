import { useState } from "react";
import type { CSSProperties } from "react";
import { TEMPLATES, Template } from "../lib/templates";
import Button from "./Button";
import CategoryMark from "./CategoryMark";
import ConfirmDialog from "./ConfirmDialog";
import SubScreen from "./SubScreen";

interface TemplateGalleryProps {
  onSelect: (template: Template) => void;
  onBack: () => void;
  /** The split already in use, so its card can say so. */
  currentTemplateId: string | null;
}

export default function TemplateGallery({
  onSelect,
  onBack,
  currentTemplateId,
}: TemplateGalleryProps) {
  const [pending, setPending] = useState<Template | null>(null);

  return (
    <SubScreen backLabel="Back to your split" onBack={onBack}>
      {/* The one real section break on the screen, so it holds the widest
          gap here: everything above it is the page header, tight enough to
          read as one block, and below it the cards start.

          Centred, against the left-aligned habit of the rest of the app,
          because this screen is a chooser: a symmetric grid of cards under
          a symmetric header. The measure still caps the prose at 52ch, so
          centring moves the block rather than stretching the lines. */}
      <div className="mx-auto mb-[34px] max-w-measure text-center">
        {/* Centred tracked caps need the trailing letter-space cancelled,
            or the word sits half a space left of true centre. */}
        <p className="indent-caps text-label uppercase tracking-caps text-ink-soft">
          Templates
        </p>
        <h1 className="mt-1.5 font-display text-sec font-extrabold">
          Start from a known split
        </h1>
        {/* "Replaces" on purpose: the card's button says "Replace my
            split" and the dialog says the categories "are replaced", so
            the screen names the consequence with one verb throughout. */}
        <p className="mt-2.5 text-meta text-ink-soft">
          Picking one replaces all your categories and their items. Your salary
          and expenses are not affected, and you can always edit the figures
          afterwards.
        </p>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(268px,1fr))] items-stretch gap-gutter">
        {TEMPLATES.map((t) => {
          const isCurrent = t.id === currentTemplateId;

          return (
            <article
              key={t.id}
              className={[
                "flex flex-col rounded-slab border bg-card p-6",
                "transition-[transform,border-color] duration-mid ease-paper",
                // The split you are on is ringed rather than raised;
                // outline draws outside the box, so nothing shifts.
                isCurrent
                  ? "border-blue outline outline-2 -outline-offset-2 outline-blue"
                  : "border-line hover:-translate-y-[2px] hover:border-line-strong",
              ].join(" ")}
            >
              {/* the split itself, at a glance, in the inks it will use */}
              <span
                aria-hidden="true"
                className="flex h-10 overflow-hidden rounded-control"
              >
                {t.categories.map((c) => (
                  <i
                    key={c.name}
                    style={
                      { "--c": c.color, flexGrow: c.percent } as CSSProperties
                    }
                    className="basis-0 bg-cat"
                  />
                ))}
              </span>

              <h2 className="mt-[18px] font-display text-title font-bold">
                {t.name}
              </h2>
              <p className="mt-1.5 text-meta text-ink-soft">{t.description}</p>

              {/* What the bar is actually made of. This replaced a bare
                  "50 / 30 / 20", which named a shape without naming a
                  single category — and, being inside an aria-hidden bar,
                  was the only place the split existed as text. */}
              <ul className="mb-5 mt-4 border-t border-line-soft pt-3.5">
                {t.categories.map((c) => (
                  <li key={c.name} className="flex items-center gap-2.5 py-[5px] text-meta">
                    <CategoryMark icon={c.icon} color={c.color} small />
                    <span className="min-w-0 truncate">{c.name}</span>
                    <span className="ml-auto flex-none font-bold">
                      {c.percent}%
                    </span>
                  </li>
                ))}
              </ul>

              {/* auto pushes the action to the card floor, so every card
                  in a row lines its button up however long the copy runs */}
              {isCurrent ? (
                <Button small inert className="mt-auto self-start">
                  Already your split
                </Button>
              ) : (
                <Button
                  small
                  onClick={() => setPending(t)}
                  className="mt-auto self-start"
                >
                  Replace my split
                </Button>
              )}
            </article>
          );
        })}
      </div>

      <ConfirmDialog
        open={pending !== null}
        title={pending ? `Replace your split with "${pending.name}"?` : ""}
        description="Your current categories and all their items are replaced. Your salary and expenses stay as they are."
        confirmLabel="Replace my split"
        onConfirm={() => {
          if (pending) onSelect(pending);
          setPending(null);
        }}
        onCancel={() => setPending(null)}
      />
    </SubScreen>
  );
}
