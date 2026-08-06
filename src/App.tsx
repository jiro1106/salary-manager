import { useState, useEffect, useRef } from "react";
import { Category, Config, HistoryEntry } from "./types";
import { uid } from "./lib/format";
import { storage } from "./lib/storage";
import { CATEGORY_COLORS, defaultCategories } from "./lib/defaultCategories";
import {
  Template,
  instantiateTemplate,
  matchTemplate,
  splitOf,
} from "./lib/templates";
import Masthead from "./components/Masthead";
import PaydayHeader from "./components/PaydayHeader";
import TemplateGallery from "./components/TemplateGallery";
import CategoryList from "./components/CategoryList";
import HistoryPanel from "./components/HistoryPanel";

const CONFIG_KEY = "salary-manager:config";
const HISTORY_KEY = "salary-manager:history";

type View = "home" | "templates";

export default function App() {
  const [view, setView] = useState<View>("home");
  const [salary, setSalary] = useState<number>(30000);
  const [categories, setCategories] = useState<Category[]>(defaultCategories());
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [savedFlash, setSavedFlash] = useState(false);
  const skipSave = useRef(true);

  useEffect(() => {
    const cfg = storage.get<Config>(CONFIG_KEY);
    if (cfg) {
      if (cfg.salary != null) setSalary(cfg.salary);
      if (cfg.categories) setCategories(cfg.categories);
    }
    const hist = storage.get<HistoryEntry[]>(HISTORY_KEY);
    if (hist) setHistory(hist);
    setTimeout(() => {
      skipSave.current = false;
    }, 0);
  }, []);

  useEffect(() => {
    // The guard sits inside save() rather than at the top of the effect: an
    // early return here would skip the listener registration entirely on the
    // mount pass, so nothing would be attached until the first edit.
    const save = () => {
      if (skipSave.current) return;
      storage.set<Config>(CONFIG_KEY, { salary, categories });
    };
    const t = setTimeout(save, 400);
    // Close the 400ms window: an edit made just before the tab is hidden or
    // closed has to land. visibilitychange is the signal that fires reliably
    // on iOS Safari and on a tab switch; pagehide covers unload and bfcache,
    // including reload. They overlap, which is harmless — save() is idempotent.
    const flush = () => {
      clearTimeout(t);
      save();
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", flush);
    return () => {
      clearTimeout(t);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", flush);
    };
  }, [salary, categories]);

  const totalPercent = categories.reduce(
    (s, c) => s + Number(c.percent || 0),
    0,
  );

  // Derived rather than stored, so the masthead chip and the gallery's
  // "already your split" state stay honest the moment a figure changes.
  const currentTemplate = matchTemplate(categories);

  const updateCategory = (id: string, patch: Partial<Category>) =>
    setCategories((cs) =>
      cs.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    );

  const removeCategory = (id: string) =>
    setCategories((cs) => cs.filter((c) => c.id !== id));

  const addCategory = () => {
    const color = CATEGORY_COLORS[categories.length % CATEGORY_COLORS.length];
    setCategories((cs) => [
      ...cs,
      {
        id: uid(),
        name: "New category",
        icon: "Wallet",
        color,
        percent: 0,
        subs: [],
      },
    ]);
  };

  const applyTemplate = (template: Template) => {
    setCategories(instantiateTemplate(template));
    setView("home");
  };

  const savePaycheck = () => {
    const entry: HistoryEntry = {
      id: uid(),
      date: new Date().toISOString(),
      salary,
      breakdown: categories.map((c) => ({
        name: c.name,
        percent: c.percent,
        amount: (salary * c.percent) / 100,
      })),
    };
    const next = [entry, ...history].slice(0, 50);
    setHistory(next);
    storage.set<HistoryEntry[]>(HISTORY_KEY, next);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1600);
  };

  const deleteEntry = (id: string) => {
    const next = history.filter((h) => h.id !== id);
    setHistory(next);
    storage.set<HistoryEntry[]>(HISTORY_KEY, next);
  };

  if (view === "templates") {
    return (
      <TemplateGallery
        onSelect={applyTemplate}
        onBack={() => setView("home")}
        currentTemplateId={currentTemplate?.id ?? null}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-content px-page-x pb-[90px]">
      <Masthead
        sits
        titles
        template={{
          // Nothing allocated yet reads as an invitation, not as a split
          // called "Custom" with no figures behind it.
          name:
            currentTemplate?.name ??
            (categories.length > 0 ? "Custom" : "Choose a template"),
          split: splitOf(categories),
        }}
        onOpenGallery={() => setView("templates")}
      />

      {/* The masthead is the banner and stays outside this; everything
          below it is the one task the screen exists for. A plain block
          wrapper, so the deck still rises into the mark's overlap exactly
          as it did. */}
      <main>
        <PaydayHeader
          salary={salary}
          onSalaryChange={setSalary}
          totalPercent={totalPercent}
          onSave={savePaycheck}
          savedFlash={savedFlash}
          categories={categories}
        />

        <CategoryList
          categories={categories}
          salary={salary}
          onChangeCategory={updateCategory}
          onRemoveCategory={removeCategory}
          onAddCategory={addCategory}
        />

        <HistoryPanel history={history} onDelete={deleteEntry} />
      </main>
    </div>
  );
}
