import { useState } from "react";
import { ChevronDown, History, Trash2 } from "lucide-react";
import { HistoryEntry } from "../types";
import { pct, pesoRound } from "../lib/format";
import IconButton from "./IconButton";

interface HistoryPanelProps {
  history: HistoryEntry[];
  onDelete: (id: string) => void;
}

export default function HistoryPanel({ history, onDelete }: HistoryPanelProps) {
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
            history.map((h) => (
              <div
                key={h.id}
                className="flex items-center gap-4 py-3 [&+&]:border-t [&+&]:border-line"
              >
                {/* A floor rather than a fixed width: the column lines up
                    on 9ch, which every ordinary payday fits inside, and a
                    larger one pushes the date along rather than running
                    underneath it. */}
                <span className="min-w-[9ch] flex-none font-display text-body font-bold">
                  {pesoRound(h.salary)}
                </span>
                <span className="w-[14ch] flex-none text-meta text-ink-soft">
                  {new Date(h.date).toLocaleDateString("en-PH", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <span className="min-w-0 flex-1 truncate text-meta text-ink-soft max-[700px]:hidden">
                  {h.breakdown
                    .map((b) => `${b.name} ${pct(b.percent)}%`)
                    .join(" · ")}
                </span>
                <IconButton
                  label={`Delete the payday saved on ${new Date(h.date).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}`}
                  onClick={() => onDelete(h.id)}
                  danger
                  className="ml-auto"
                >
                  <Trash2 size={15} strokeWidth={1.7} aria-hidden="true" />
                </IconButton>
              </div>
            ))
          )}
        </div>
      )}
    </section>
  );
}
