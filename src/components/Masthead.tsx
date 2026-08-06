import { ChevronRight, LayoutTemplate } from "lucide-react";
import logo from "../assets/logo.png";

interface MastheadProps {
  /**
   * On the home screen the mark rests on the deck's top edge; on the
   * templates screen she stands on the tabletop. This is the vertical half
   * only — it changes what happens *under* the masthead, never where the
   * masthead itself lands. The horizontal inset is unconditional, because
   * the brand has one position and it does not follow the page.
   */
  sits?: boolean;
  /**
   * Whether the wordmark is this screen's title. On the home screen it is
   * — there is no other heading, and without this the page offered a
   * screen reader nothing to navigate by. The templates screen names
   * itself ("Start from a known split"), so there the wordmark is the
   * brand rather than the title and stays a plain span.
   *
   * Kept separate from `sits` on purpose: that one is a layout offset and
   * this one is document structure, and the day they stop agreeing the
   * heading must not follow the overlap.
   */
  titles?: boolean;
  /** The split you are working from, and the way to change it. */
  template?: { name: string; split: string };
  onOpenGallery?: () => void;
}

export default function Masthead({
  sits = false,
  titles = false,
  template,
  onOpenGallery,
}: MastheadProps) {
  // Preflight strips a heading's size, weight and margin, so this is the
  // same box either way — the tag carries structure, the classes carry
  // the look.
  const Wordmark = titles ? "h1" : "span";

  return (
    <header
      className={[
        "flex flex-wrap items-end gap-0 pt-stack",
        // The inset is left-only and it is on every screen. The mark takes
        // the deck's column so her drawing starts on the same vertical as
        // "Payday amount" below her; the -21px cancels 22px of transparent
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
        "pl-deck-x max-[700px]:pl-0",
        // Standing on the tabletop, the mark still carries ~15px of its
        // own transparent margin under the basket, so a full stack of
        // padding under the box measures more like 41px on screen and
        // strands the masthead from the page it heads.
        sits ? "pb-0 max-[700px]:pb-[22px]" : "pb-1.5",
      ].join(" ")}
    >
      {/*
        The mark and the wordmark are one object, so they move as one.
        The 46px lift is measured off the bottom of the mark's box and is
        the same on every screen; only the group travels, dropping 28px on
        the home screen so the basket overlaps the deck below it. Putting
        that offset on the two children separately is what used to let the
        wordmark fall 46px whenever the overlap was off.
      */}
      <div
        className={[
          "flex items-end",
          sits ? "-mb-[28px] max-[700px]:mb-0" : "",
        ].join(" ")}
      >
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
            "max-[700px]:ml-0 max-[700px]:w-full",
            sits ? "mb-[18px] max-[700px]:mb-0" : "",
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
