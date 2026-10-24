import { useState } from "react";
import { RotateCcw } from "lucide-react";
import Button from "./Button";
import ConfirmDialog from "./ConfirmDialog";
import SubScreen from "./SubScreen";
import { Theme, setTheme, storedTheme } from "../lib/theme";

const THEMES: { value: Theme; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

// No groups and no cards while there are only two: each setting is a row
// on the page, split from the next by a hairline. Group them under
// headings again once there are enough to need it.
const ROW = "flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-5";
const NAME = "text-ui font-medium text-ink";
const NOTE = "mt-1 max-w-prose text-meta text-ink-soft";

interface SettingsScreenProps {
  onBack: () => void;
  onReset: () => void;
}

export default function SettingsScreen({ onBack, onReset }: SettingsScreenProps) {
  const [confirming, setConfirming] = useState(false);
  const [theme, setThemeState] = useState<Theme>(storedTheme);

  return (
    <SubScreen backLabel="Back" onBack={onBack}>
      <h1 className="font-display text-sec font-extrabold">Settings</h1>

      <div className="mt-4 divide-y divide-line">
        {/* Native radios, so arrow keys and the group's name come free;
            the input is visually hidden and the label is the chip. */}
        <fieldset className={ROW}>
          <legend className="sr-only">Theme</legend>
          <div className="min-w-0">
            <p aria-hidden="true" className={NAME}>Theme</p>
            <p className={NOTE}>
              System follows your device. Category colours stay the same in both.
            </p>
          </div>
          <div className="inline-flex gap-1 rounded-control bg-sunk p-1">
            {THEMES.map((t) => (
              <label
                key={t.value}
                className={[
                  "cursor-pointer rounded-control px-3.5 py-2 text-meta font-semibold",
                  "transition-colors duration-fast ease-paper",
                  "has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-[3px] has-[:focus-visible]:outline-blue",
                  theme === t.value ? "bg-card text-ink shadow-field" : "text-ink-soft hover:text-ink",
                ].join(" ")}
              >
                <input
                  type="radio"
                  name="theme"
                  value={t.value}
                  checked={theme === t.value}
                  onChange={() => {
                    setThemeState(t.value);
                    setTheme(t.value);
                  }}
                  className="sr-only"
                />
                {t.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className={ROW}>
          <div className="min-w-0">
            <h2 className={NAME}>Reset all data</h2>
            <p className={NOTE}>
              Clears your salary, every category and every expense, and starts
              over from the default split.
            </p>
          </div>
          <Button small variant="danger" onClick={() => setConfirming(true)}>
            <RotateCcw size={15} strokeWidth={2.2} aria-hidden="true" />
            Reset
          </Button>
        </div>
      </div>

      {/* The one act in the app with no undo behind it, so it keeps the
          dialog: there is nothing left for an undo bar to restore from. */}
      <ConfirmDialog
        open={confirming}
        title="Reset all data?"
        description="Your salary, categories and expenses are erased. This cannot be undone."
        confirmLabel="Reset everything"
        danger
        onConfirm={() => {
          setConfirming(false);
          onReset();
        }}
        onCancel={() => setConfirming(false)}
      />
    </SubScreen>
  );
}
