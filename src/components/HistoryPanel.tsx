import { useState } from "react";
import { ChevronDown, History, Trash2 } from "lucide-react";
import { HistoryEntry } from "../types";
import { pct, pesoRound } from "../lib/format";
import IconButton from "./IconButton";

interface HistoryPanelProps {
  history: HistoryEntry[];
  onDelete: (id: string) => void;
  /** Puts a past payday's amount back in the field. Amount only. */
  onRestore: (salary: number) => void;
}

/** The largest share in a saved entry, which is all a phone has room for. */
function topShare(entry: HistoryEntry) {
  return entry.breakdown.reduce<HistoryEntry["breakdown"][number] | null>(
    (best, b) => (best === null || b.percent > best.percent ? b : best),
    null,
  );
}

export default function HistoryPanel({
  history,
  onDelete,
  onRestore,
}: HistoryPanelProps) {
  const [showHistory, setShowHistory] = useState(false);

  return (
    <section className="mt-split">
      <button
        type="button"
        onClick={() => setShowHistory((s) => !s)}
        aria-expanded={showHistory}
        className={[
          "inline-flex min-h-hit items-center gap-2.5 rounded-control px-1 text-meta",
          "text-ink-soft transition-colors duration-fast ease-paper hover:text-ink",
        ].join(" ")}
      >
        <History size={16} strokeWidth={1.7} aria-hidden="true" />
        Payday history ({history.length})
        <ChevronDown
          size={16}
          strokeWidth={2}
          aria-hidden="true"
          className={[
            "transition-transform duration-mid ease-paper",
            showHistory ? "rotate-180" : "",
          ].join(" ")}
        />
      </button>

      {showHistory && (
        <div className="animate-[nala-reveal_200ms_var(--ease)_both] mt-3 rounded-slab border border-line bg-card px-[26px] py-1.5">
          {history.length === 0 ? (
            <p className="py-3 text-meta text-ink-soft">
              No paydays saved yet. Hit Save payday and this is where it lands.
            </p>
          ) : (
            history.map((h) => {
              const when = new Date(h.date).toLocaleDateString("en-PH", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });
              const top = topShare(h);

              return (
                // py-0.5 rather than py-3: the row's height now comes from
                // the 44px target inside it, and the two arrive at the same
                // 48px the padding pair used to.
                <div
                  key={h.id}
                  className="flex items-center gap-4 py-0.5 [&+&]:border-t [&+&]:border-line"
                >
                  {/* The row is the way back to a past amount. Only the
                      figure and its date are the control — the delete keeps
                      its own target beside it, because a button inside a
                      button is not a thing. */}
                  <button
                    type="button"
                    onClick={() => onRestore(h.salary)}
                    aria-label={`Use ${pesoRound(h.salary)} from ${when} as this payday's amount`}
                    className={[
                      "group/row flex min-h-hit min-w-0 flex-1 items-center gap-4",
                      "rounded-control text-left",
                    ].join(" ")}
                  >
                    {/* A floor rather than a fixed width: the column lines
                        up on 9ch, which every ordinary payday fits inside,
                        and a larger one pushes the date along rather than
                        running underneath it. */}
                    <span
                      className={[
                        "min-w-[9ch] flex-none font-display text-body font-bold",
                        "transition-colors duration-fast ease-paper",
                        "group-hover/row:text-action-edge",
                      ].join(" ")}
                    >
                      {pesoRound(h.salary)}
                    </span>
                    <span className="w-[14ch] flex-none text-meta text-ink-soft">
                      {when}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-meta text-ink-soft max-[700px]:hidden">
                      {h.breakdown
                        .map((b) => `${b.name} ${pct(b.percent)}%`)
                        .join(" · ")}
                    </span>
                    {/* A phone has room for one share, not the run of them.
                        It used to have room for none — the full string was
                        simply hidden below 700px, which left a history row
                        showing a figure and a date and nothing about how it
                        was split. The largest share is the one worth the
                        space. */}
                    {top && (
                      <span className="hidden min-w-0 flex-1 truncate text-meta text-ink-soft max-[700px]:block">
                        {top.name} {pct(top.percent)}%
                      </span>
                    )}
                  </button>
                  <IconButton
                    label={`Delete the payday saved on ${when}`}
                    onClick={() => onDelete(h.id)}
                    danger
                  >
                    <Trash2 size={15} strokeWidth={1.7} aria-hidden="true" />
                  </IconButton>
                </div>
              );
            })
          )}
        </div>
      )}
    </section>
  );
}
