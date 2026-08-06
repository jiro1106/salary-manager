import { ChevronRight, LayoutTemplate } from "lucide-react";
import logo from "../assets/logo.png";

interface MastheadProps {
  /**
   * On the home screen the mark rests on the deck's top edge; on the
   * templates screen she stands on the tabletop.
   */
  sits?: boolean;
  /** The split you are working from, and the way to change it. */
  template?: { name: string; split: string };
  onOpenGallery?: () => void;
}

export default function Masthead({
  sits = false,
  template,
  onOpenGallery,
}: MastheadProps) {
  return (
    <header
      className={[
        "flex flex-wrap items-end gap-0 pt-stack",
        sits ? "pb-0 max-[700px]:pb-[22px]" : "pb-stack",
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
          <span className="block font-display text-wordmark font-extrabold">
            Nala
          </span>
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
