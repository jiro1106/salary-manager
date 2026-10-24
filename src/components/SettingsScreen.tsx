import { useState } from "react";
import { ArrowLeft, RotateCcw } from "lucide-react";
import Button from "./Button";
import ConfirmDialog from "./ConfirmDialog";
import Masthead from "./Masthead";
import { Theme, setTheme, storedTheme } from "../lib/theme";

const THEMES: { value: Theme; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

// One ladder, four steps: page title (sec 28) > group (title 19) >
// setting (ui 16) > its note (meta 13). The group heading has to out-rank
// the settings under it; tracked caps at 11px sat below them.
const GROUP = "pb-3 font-display text-title font-bold text-ink";
// No card: a setting is a row on the page, ruled off by hairlines, so a
// new one is one more row rather than one more box.
const ROW = "flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-line py-[18px]";
const NAME = "text-ui font-semibold text-ink";
const NOTE = "mt-1 max-w-prose text-meta text-ink-soft";

interface SettingsScreenProps {
  onBack: () => void;
  onReset: () => void;
}

export default function SettingsScreen({ onBack, onReset }: SettingsScreenProps) {
  const [confirming, setConfirming] = useState(false);
  const [theme, setThemeState] = useState<Theme>(storedTheme);

  return (
    <div className="mx-auto w-full max-w-content px-page-x pb-[90px]">
      <Masthead />

      {/* Same shape as the templates screen: the wordmark is the brand
          here and this screen names itself with its own h1. */}
      <main>
        <button
          type="button"
          onClick={onBack}
          className={[
            "mb-0.5 inline-flex min-h-hit items-center gap-2 rounded-control px-1 text-meta font-semibold",
            "text-ink-soft transition-colors duration-fast ease-paper hover:text-ink",
          ].join(" ")}
        >
          <ArrowLeft size={16} strokeWidth={2} aria-hidden="true" />
          Back
        </button>

        <h1 className="font-display text-sec font-extrabold">Settings</h1>

        <section aria-labelledby="settings-appearance" className="mt-split">
          <h2 id="settings-appearance" className={GROUP}>Appearance</h2>
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
        </section>

        <section aria-labelledby="settings-data" className="mt-12">
          <h2 id="settings-data" className={GROUP}>Data</h2>
          <div className={ROW}>
            <div className="min-w-0">
              <h3 className={NAME}>Reset all data</h3>
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
        </section>
      </main>

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
    </div>
  );
}
