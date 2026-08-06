import { useState } from "react";
import type { CSSProperties } from "react";
import { ArrowLeft } from "lucide-react";
import { iconOf } from "../lib/icons";
import { TEMPLATES, Template } from "../lib/templates";
import Button from "./Button";
import ConfirmDialog from "./ConfirmDialog";
import Masthead from "./Masthead";

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
    <div className="mx-auto w-full max-w-content px-page-x pb-[90px]">
      <Masthead />

      {/* The wordmark above is the brand here, not the title — this screen
          names itself below, so it keeps the h1 and the mark stays a span. */}
      <main>
        <button
          type="button"
          onClick={onBack}
          className={[
            // The 44px target already leaves ~13px under the label, so the
            // margin only has to top that up. The return and the title it
            // returns from are one group, not two bands.
            "mb-0.5 inline-flex min-h-hit items-center gap-2 rounded-control px-1 text-meta font-semibold",
            "text-ink-soft transition-colors duration-fast ease-paper hover:text-ink",
          ].join(" ")}
        >
          <ArrowLeft size={16} strokeWidth={2} aria-hidden="true" />
          Back to your split
        </button>

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
            Picking one replaces all your categories and their items. Your saved
            paydays are not affected, and you can always edit the figures
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
                  "transition-[transform,border-color] duration-[180ms] ease-paper",
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
                  {t.categories.map((c) => {
                    const Mark = iconOf(c.icon);

                    return (
                      <li
                        key={c.name}
                        className="flex items-center gap-2.5 py-[5px] text-meta"
                        style={{ "--c": c.color } as CSSProperties}
                      >
                        <span
                          aria-hidden="true"
                          className={[
                            "grid h-[22px] w-[22px] flex-none place-items-center",
                            "rounded-control bg-cat text-on-color",
                          ].join(" ")}
                        >
                          <Mark size={12} strokeWidth={2.1} />
                        </span>
                        <span className="min-w-0 truncate">{c.name}</span>
                        <span className="ml-auto flex-none font-bold">
                          {c.percent}%
                        </span>
                      </li>
                    );
                  })}
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
      </main>

      <ConfirmDialog
        open={pending !== null}
        title={pending ? `Replace your split with "${pending.name}"?` : ""}
        description="Your current categories and all their items are replaced. Your payday amount and saved paydays stay as they are."
        confirmLabel="Replace my split"
        onConfirm={() => {
          if (pending) onSelect(pending);
          setPending(null);
        }}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}
