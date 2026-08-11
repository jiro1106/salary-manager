import { useState, useEffect, useRef } from "react";
import { Undo2 } from "lucide-react";
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
import Button from "./components/Button";
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
  const [salary, setSalary] = useState<number>(0);
  const [categories, setCategories] = useState<Category[]>(defaultCategories());
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [savedFlash, setSavedFlash] = useState(false);
  // Flipped by the first write that comes back false. Every edit on this
  // page still applies to the screen when storage is blocked, so without
  // this the app looks saved and isn't — the reader finds out by closing
  // the tab. Latching rather than clearing: a browser that refused one
  // write is not a browser to reassure anyone about.
  const [storageBlocked, setStorageBlocked] = useState(false);
  // The payday field, held here because two screens' worth of page separate
  // it from the history panel that sends the reader back to it.
  const paydayRef = useRef<HTMLInputElement>(null);
  // Bumped on every restore, including one that restores the figure already
  // in the field. It is a count of clicks rather than a flag, because the
  // flash has to replay on the second click as much as the first and a
  // boolean would already be true.
  const [restoreTick, setRestoreTick] = useState(0);
  // The last destructive edit to the split, and what it produced. Deleting
  // a category, deleting one of its items and applying a template are the
  // three acts here that throw work away, and until now the only thing
  // standing in front of any of them was a dialog — which asks the reader
  // to be certain in advance instead of letting them find out.
  //
  // `next` is kept so the offer can expire on its own: it is the exact
  // array the act produced, and the bar shows only while `categories` is
  // still that array. Any later edit builds a new one and the offer is
  // gone, which is the honest expiry — undoing after an edit would restore
  // a split from before that edit and quietly destroy it, so the undo
  // would be the second destructive act rather than the cure for the first.
  const [undo, setUndo] = useState<{
    prev: Category[];
    next: Category[];
    label: string;
  } | null>(null);
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
      if (!storage.set<Config>(CONFIG_KEY, { salary, categories })) {
        setStorageBlocked(true);
      }
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

  // Every act that throws part of the split away goes through here, so
  // there is one place that knows how to put it back.
  const replaceCategories = (next: Category[], label: string) => {
    setCategories(next);
    setUndo({ prev: categories, next, label });
  };

  const removeCategory = (id: string) => {
    const gone = categories.find((c) => c.id === id);
    replaceCategories(
      categories.filter((c) => c.id !== id),
      `Deleted "${gone?.name ?? "category"}"`,
    );
  };

  // Lives here rather than inside the card for the same reason every other
  // mutation does: it produces a whole new categories array, and only this
  // level can hand that array to the undo latch.
  const removeSub = (catId: string, subId: string) => {
    const gone = categories
      .find((c) => c.id === catId)
      ?.subs.find((s) => s.id === subId);
    replaceCategories(
      categories.map((c) =>
        c.id === catId
          ? { ...c, subs: c.subs.filter((s) => s.id !== subId) }
          : c,
      ),
      `Deleted "${gone?.name ?? "item"}"`,
    );
  };

  const addCategory = () => {
    // The next ink in the palette's own order that is not already on
    // screen, so a fresh card never arrives wearing a colour the reader
    // is already looking at. Keyed on what is in use rather than on
    // `categories.length`, which was the same thing right up until
    // something was deleted: drop the middle card of three and the length
    // falls back to 2, and the next add hands out the ink the third card
    // is still wearing. Falls through to the length rotation once all five
    // are taken, where a repeat is unavoidable and the order is the point.
    const used = new Set(categories.map((c) => c.color));
    const color =
      CATEGORY_COLORS.find((c) => !used.has(c)) ??
      CATEGORY_COLORS[categories.length % CATEGORY_COLORS.length];
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

  // The most destructive act in the app: it replaces the split wholesale,
  // and it is the only one that never asked first. It still doesn't — the
  // gallery is a room you walk into on purpose — but the split you had is
  // now one press away on the other side.
  const applyTemplate = (template: Template) => {
    replaceCategories(
      instantiateTemplate(template),
      `Replaced your split with ${template.name}`,
    );
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
    if (!storage.set<HistoryEntry[]>(HISTORY_KEY, next)) {
      setStorageBlocked(true);
    }
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1600);
  };

  const deleteEntry = (id: string) => {
    const next = history.filter((h) => h.id !== id);
    setHistory(next);
    if (!storage.set<HistoryEntry[]>(HISTORY_KEY, next)) {
      setStorageBlocked(true);
    }
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
        {/* The one thing on this page that is genuinely broken rather than
            merely over-allocated, so it takes `alert` and sits above the
            deck instead of inside it: it is not about this payday, it is
            about every payday. It names what stopped working and what that
            costs, and offers no dismissal — there is nothing the reader can
            do here, and a warning about silent data loss that can be
            silenced is the same bug again. */}
        {storageBlocked && (
          <p
            role="alert"
            className="mt-3 rounded-slab border border-line bg-action-tint px-4 py-3 text-meta font-semibold text-action-edge"
          >
            This browser is blocking local storage, so your split and your
            payday history are not being saved. They will be gone when you
            close the tab.
          </p>
        )}

        <PaydayHeader
          salary={salary}
          onSalaryChange={setSalary}
          inputRef={paydayRef}
          restoreTick={restoreTick}
          totalPercent={totalPercent}
          onSave={savePaycheck}
          savedFlash={savedFlash}
          categories={categories}
          onResizeCategory={(id, percent) => updateCategory(id, { percent })}
        />

        {/* Mounted empty, like the over-allocation banner above it and for
            the same reason: a live region has to be registered before
            anything lands in it or the first message goes unread. Empty it
            draws no box and takes no margin, so the deck and the cards sit
            exactly where they did.

            It sits between the deck and the cards because that is where
            the loss is visible — a deleted card left a gap in the grid
            below, and a replaced split redrew the dial above. Nothing
            times it out: an offer that expires while the reader is still
            working out what happened is not an offer. */}
        <div role="status">
          {undo !== null && undo.next === categories && (
            <div className="mt-stack flex flex-wrap items-center justify-between gap-3 rounded-slab border border-line bg-card px-[22px] py-3.5">
              <p className="font-display text-meta font-semibold text-ink-soft">
                {undo.label}
              </p>
              <Button
                small
                variant="alt"
                onClick={() => {
                  setCategories(undo.prev);
                  setUndo(null);
                }}
              >
                <Undo2 size={15} strokeWidth={2.2} aria-hidden="true" />
                Undo
              </Button>
            </div>
          )}
        </div>

        <CategoryList
          categories={categories}
          salary={salary}
          onChangeCategory={updateCategory}
          onRemoveCategory={removeCategory}
          onRemoveSub={removeSub}
          onAddCategory={addCategory}
        />

        {/* Restores the payday figure and nothing else. The split is not
            restored on purpose: a saved entry carries the categories as
            they were *named and weighted then*, and putting those back
            would silently replace whatever the reader has since built —
            the one destructive act in this app that would happen without a
            dialog. The amount is the part that is safe to hand back, and
            it is the part worth re-entering.

            The focus call is not a nicety, it is the feedback. This panel
            sits at the foot of the page and the field it writes to is at
            the head of it, so a bare setSalary changed a number the reader
            could not see. Worse, the row they are most likely to click is
            the newest one, whose amount is usually the amount already in
            the field — React bails on the identical value and the row
            reads as a dead control. Focusing scrolls the field into view
            and paints the ring either way, so the click always lands
            visibly, whether or not the figure moved. */}
        <HistoryPanel
          history={history}
          onDelete={deleteEntry}
          onRestore={(value) => {
            setSalary(value);
            setRestoreTick((n) => n + 1);

            const field = paydayRef.current;
            if (!field) return;
            // preventScroll and then scroll on purpose. focus() on its own
            // snaps the page to the field in one frame, which is the jump
            // this replaces — the two steps are one gesture split so the
            // travel can be eased.
            field.focus({ preventScroll: true });
            field.scrollIntoView({
              // The global reduced-motion block in index.css kills CSS
              // transitions and animations, and this is neither: an
              // explicit behavior:"smooth" is honoured by the browser
              // whatever the preference says, so it is asked here directly.
              // Same check CutDial makes before tweening its wedges.
              behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
                .matches
                ? "auto"
                : "smooth",
              block: "center",
            });
          }}
        />
      </main>
    </div>
  );
}
