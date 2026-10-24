import { ChevronRight, LayoutTemplate, Settings } from "lucide-react";
import IconButton from "./IconButton";
import logo from "../assets/logo.png";

interface MastheadProps {
  /**
   * Whether the wordmark is this screen's title. On the home screen it is
   * — there is no other heading, and without this the page offered a
   * screen reader nothing to navigate by. The templates screen names
   * itself ("Start from a known split"), so there the wordmark is the
   * brand rather than the title and stays a plain span.
   */
  titles?: boolean;
  /** The split you are working from, and the way to change it. */
  template?: { name: string; split: string };
  onOpenGallery?: () => void;
  /** Home tabs only; the settings and templates screens have a back link. */
  onOpenSettings?: () => void;
}

export default function Masthead({
  titles = false,
  template,
  onOpenGallery,
  onOpenSettings,
}: MastheadProps) {
  // Preflight strips a heading's size, weight and margin, so this is the
  // same box either way — the tag carries structure, the classes carry
  // the look.
  const Wordmark = titles ? "h1" : "span";

  return (
    <header
      className={[
        "relative flex flex-wrap items-end gap-0 pt-stack",
        // The inset is left-only and it is on every screen. The mark takes
        // the deck's column so her drawing starts on the same vertical as
        // "Take-home pay" below her; the -21px cancels 22px of transparent
        // PNG margin and leaves her a hair inside the cap of the P, which
        // is what a soft round silhouette wants against a straight stem.
        // It is unconditional because the brand does not move between
        // screens — the templates screen has no card under her, but she
        // still has to land in the same place she does at home. The chip
        // does not follow her in: it is a page control rather than a line
        // of the deck's content, so it runs out to the container edge and
        // stops flush with the card's own right edge below it.
        //
        // Below 700px the pad drops on both screens together, for the same
        // reason it always did at home — the chip is full-width there and a
        // left-only pad would hang it off centre — and dropping it on one
        // screen only would put the mark back to moving.
        "pl-deck-x narrow:pl-0 pb-1.5",
      ].join(" ")}
    >
      {/* The mark and the wordmark are one object, so they move as one.
          The 46px lift is measured off the bottom of the mark's box. */}
      <div className="flex items-end">
        {/*
          Nala is the mark and the character at once, and appears exactly
          once per screen. The PNG carries 20% transparent on each side and
          14% under the basket, so the box is sized off the drawing and the
          padding is pulled back out with negative margins.
        */}
        <span
          className={[
            "group/mark relative z-[3] block h-[110px] w-[110px] flex-none",
            "-ml-[21px] -mr-[6px]",
          ].join(" ")}
        >
          <img
            src={logo}
            alt="Nala"
            // contain, never cover: a circular crop cuts her ears and the
            // basket off. The artwork brings its own outline and shading,
            // which is all the depth anything on this page gets.
            className={[
              "block h-full w-full object-contain origin-[50%_88%]",
              "transition-transform duration-slow ease-paper",
              "group-hover/mark:-rotate-[4deg]",
            ].join(" ")}
          />
        </span>

        <span className="mb-[46px]">
          <Wordmark className="block font-display text-wordmark font-extrabold">
            Nala
          </Wordmark>
          <span className="mt-0.5 block text-label uppercase tracking-caps text-ink-soft">
            Salary manager
          </span>
        </span>
      </div>

      {/* Pinned to the top corner rather than placed in the row, so the
          template chip keeps its own place at the row's end below it. */}
      {onOpenSettings && (
        <IconButton
          label="Settings"
          onClick={onOpenSettings}
          className="absolute right-2.5 top-[calc(var(--stack)+10px)]"
        >
          <Settings size={18} strokeWidth={2} aria-hidden="true" />
        </IconButton>
      )}

      {template && onOpenGallery && (
        <button
          type="button"
          onClick={onOpenGallery}
          aria-label={
            template.split
              ? `Change template. Currently ${template.name}, ${template.split}`
              : "Choose a template"
          }
          className={[
            "group/chip ml-auto inline-flex items-center gap-[9px] px-4 py-2.5",
            "rounded-control border border-line bg-card text-ink hover:border-line-strong",
            "font-display text-meta font-extrabold tracking-[-0.01em]",
            "transition-colors duration-fast ease-paper",
            "narrow:ml-0 narrow:w-full",
          ].join(" ")}
        >
          <LayoutTemplate
            size={15}
            strokeWidth={1.9}
            aria-hidden="true"
            className="shrink-0 text-ink-soft"
          />
          {template.name}
          {/* with nothing allocated there is no split to name, and a
              dangling separator would be all that showed */}
          {template.split && (
            <span className="font-semibold text-ink-soft">
              · {template.split}
            </span>
          )}
          <ChevronRight
            size={16}
            strokeWidth={2}
            aria-hidden="true"
            className="ml-auto shrink-0 text-ink-soft transition-transform duration-fast ease-paper group-hover/chip:translate-x-[3px]"
          />
        </button>
      )}
    </header>
  );
}
