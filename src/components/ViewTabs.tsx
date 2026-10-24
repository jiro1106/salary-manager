import { useRef } from "react";

export type Tab = "salary" | "split" | "expenses";

const TABS: { id: Tab; label: string }[] = [
  { id: "salary", label: "Salary" },
  { id: "split", label: "Split" },
  { id: "expenses", label: "Expenses" },
];

export const tabId = (tab: Tab) => `tab-${tab}`;
export const panelId = (tab: Tab) => `panel-${tab}`;

interface ViewTabsProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

/**
 * The three jobs the home screen does, one at a time. They run on
 * different clocks — the salary once a payday, the split rarely, expenses
 * daily — and sharing one scroll put the daily one at the very bottom.
 *
 * WAI-ARIA tabs with automatic activation: arrows, Home and End move and
 * select together, and only the selected tab sits in the Tab order.
 */
export default function ViewTabs({ active, onChange }: ViewTabsProps) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    const last = TABS.length - 1;
    const next =
      e.key === "ArrowRight" ? (index === last ? 0 : index + 1)
      : e.key === "ArrowLeft" ? (index === 0 ? last : index - 1)
      : e.key === "Home" ? 0
      : e.key === "End" ? last
      : null;
    if (next === null) return;
    e.preventDefault();
    onChange(TABS[next].id);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label="Sections"
      className="mt-stack flex border-b border-line"
    >
      {TABS.map((tab, i) => {
        const selected = tab.id === active;
        return (
          <button
            key={tab.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={tabId(tab.id)}
            aria-selected={selected}
            aria-controls={selected ? panelId(tab.id) : undefined}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={[
              "-mb-px min-h-hit flex-1 border-b-[3px] font-display text-ui",
              // The zest-deep rule is the salary field's accent, reused so
              // the selected state is a shape at 4.5:1 and not a tint alone.
              selected
                ? "border-zest-deep font-bold text-ink"
                : "border-transparent font-semibold text-ink-soft",
            ].join(" ")}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
