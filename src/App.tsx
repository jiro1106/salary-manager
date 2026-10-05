import { useState, useEffect, useRef } from "react";
import { Undo2 } from "lucide-react";
import type { Category, Config, Expense, ExpenseDraft } from "./types";
import { uid } from "./lib/format";
import { storage } from "./lib/storage";
import { expenseSummary, makeExpense } from "./lib/expenses";
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
import ExpenseDialog from "./components/ExpenseDialog";
import ExpenseHistory from "./components/ExpenseHistory";

const CONFIG_KEY = "salary-manager:config";

type View = "home" | "templates";

export default function App() {
  const [view, setView] = useState<View>("home");
  const [salary, setSalary] = useState<number>(0);
  const [categories, setCategories] = useState<Category[]>(defaultCategories());
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [expenseUndo, setExpenseUndo] = useState<{ expense: Expense; index: number; next: Expense[] } | null>(null);
  // Flipped by the first write that comes back false. Every edit on this
  // page still applies to the screen when storage is blocked, so without
  // this the app looks saved and isn't — the reader finds out by closing
  // the tab. Latching rather than clearing: a browser that refused one
  // write is not a browser to reassure anyone about.
  const [storageBlocked, setStorageBlocked] = useState(false);
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
      setExpenses(cfg.expenses ?? []);
    }
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
      if (!storage.set<Config>(CONFIG_KEY, { salary, categories, expenses })) {
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
  }, [salary, categories, expenses]);

  const { spent, remaining } = expenseSummary(salary, expenses);

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

  const addExpense = (draft: ExpenseDraft) => {
    const { expense, errors } = makeExpense(draft, categories, crypto.randomUUID(), new Date().toISOString());
    if (expense) {
      setExpenses((current) => [...current, expense]);
      setExpenseUndo(null);
    }
    return errors;
  };

  const deleteExpense = (id: string) => {
    const index = expenses.findIndex((expense) => expense.id === id);
    if (index < 0) return;
    const next = expenses.filter((expense) => expense.id !== id);
    setExpenses(next);
    setExpenseUndo({ expense: expenses[index], index, next });
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
            This browser is blocking local storage, so your split and expenses
            are not being saved. They will be gone when you
            close the tab.
          </p>
        )}

        <PaydayHeader
          salary={salary}
          onSalaryChange={setSalary}
          totalPercent={totalPercent}
          spent={spent}
          remaining={remaining}
          onAddExpense={() => setExpenseDialogOpen(true)}
          categories={categories}
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

        <ExpenseHistory
          expenses={expenses}
          undoExpense={expenseUndo?.next === expenses ? expenseUndo.expense : null}
          onDelete={deleteExpense}
          onUndo={() => {
            if (!expenseUndo || expenseUndo.next !== expenses) return;
            const next = [...expenses];
            next.splice(expenseUndo.index, 0, expenseUndo.expense);
            setExpenses(next);
            setExpenseUndo(null);
          }}
        />
      </main>
      {expenseDialogOpen && (
        <ExpenseDialog
          categories={categories}
          onClose={() => setExpenseDialogOpen(false)}
          onSubmit={addExpense}
        />
      )}
    </div>
  );
}
