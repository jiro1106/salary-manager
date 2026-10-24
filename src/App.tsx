import { useState, useEffect, useRef } from "react";
import { CircleCheck, Plus, Trash2, Undo2 } from "lucide-react";
import type { Category, Config, Expense, ExpenseDraft } from "./types";
import { pct, peso, pesoRound, uid } from "./lib/format";
import { storage } from "./lib/storage";
import { expenseSummary, makeExpense, spentByCategory } from "./lib/expenses";
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
import SpendSummary from "./components/SpendSummary";
import ViewTabs, { Tab, panelId, tabId } from "./components/ViewTabs";

const CONFIG_KEY = "salary-manager:config";

type View = Tab | "templates";

export default function App() {
  const [view, setView] = useState<View>("salary");
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
  // A short confirmation after each act, so the reader knows it landed.
  // `id` changes on every notice so a repeat of the same text restarts
  // the timer and the entrance instead of silently extending the old one.
  // `loss` marks an act that threw something away (red); everything else
  // added or restored something (green).
  const [toast, setToast] = useState<{ id: number; text: string; loss: boolean } | null>(null);
  const notify = (text: string, loss = false) => setToast({ id: Date.now(), text, loss });

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    const cfg = storage.get<Config>(CONFIG_KEY);
    if (cfg) {
      if (cfg.salary != null) setSalary(cfg.salary);
      if (cfg.categories) setCategories(cfg.categories);
      setExpenses(cfg.expenses ?? []);
    }
    // Opens on the daily job once there is a payday to spend against, and
    // on the salary until then. Derived from the data rather than stored,
    // so there is no second thing to save or to fail saving.
    if (cfg?.salary) setView("expenses");
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
  const overAmount = (salary * (totalPercent - 100)) / 100;

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
    notify(label, true);
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
    notify("Category added");
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
    setView("split");
  };

  const addExpense = (draft: ExpenseDraft) => {
    const { expense, errors } = makeExpense(draft, categories, crypto.randomUUID(), new Date().toISOString());
    if (expense) {
      setExpenses((current) => [...current, expense]);
      setExpenseUndo(null);
      notify(`Added "${expense.title}"`);
    }
    return errors;
  };

  const deleteExpense = (id: string) => {
    const index = expenses.findIndex((expense) => expense.id === id);
    if (index < 0) return;
    const next = expenses.filter((expense) => expense.id !== id);
    setExpenses(next);
    setExpenseUndo({ expense: expenses[index], index, next });
    notify(`Deleted "${expenses[index].title}"`, true);
  };

  // Always mounted, empty between notices: a live region has to be
  // registered before content lands in it or the first message goes unread.
  const toastRegion = (
    <div
      role="status"
      className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-page-x"
    >
      {toast && (
        <p
          key={toast.id}
          className={`flex items-center gap-2 rounded-control px-4 py-3 text-meta font-semibold text-on-action animate-[nala-reveal_200ms_var(--ease)_both] ${toast.loss ? "bg-spent" : "bg-lime-deep"}`}
        >
          {toast.loss ? (
            <Trash2 size={16} strokeWidth={2.2} aria-hidden="true" />
          ) : (
            <CircleCheck size={16} strokeWidth={2.2} aria-hidden="true" />
          )}
          {toast.text}
        </p>
      )}
    </div>
  );

  if (view === "templates") {
    return (
      <>
      <TemplateGallery
        onSelect={applyTemplate}
        onBack={() => setView("split")}
        currentTemplateId={currentTemplate?.id ?? null}
      />
      {toastRegion}
      </>
    );
  }

  return (
    <div className="mx-auto w-full max-w-content px-page-x pb-[90px]">
      {/* The wordmark stands on the tabletop rather than resting on a
          deck: the tab bar is what sits under her now, and it is too
          shallow to take the 28px overlap. The template chip is only on
          the Split tab, because it is the split it names. */}
      <Masthead
        titles
        template={
          view === "split"
            ? {
                // Nothing allocated yet reads as an invitation, not as a
                // split called "Custom" with no figures behind it.
                name:
                  currentTemplate?.name ??
                  (categories.length > 0 ? "Custom" : "Choose a template"),
                split: splitOf(categories),
              }
            : undefined
        }
        onOpenGallery={() => setView("templates")}
      />

      <ViewTabs active={view} onChange={setView} />

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

        {/* The Salary tab edits this figure; every other tab still names
            it, so what the split and the expenses are measured against is
            never out of sight. */}
        {view !== "salary" && (
          <p className="mt-stack flex items-baseline justify-between gap-3 rounded-slab border border-line bg-card px-deck-x py-3.5">
            <span className="text-label uppercase tracking-caps text-ink-soft">Salary</span>
            <span className="font-display text-title font-extrabold text-ink">{peso(salary)}</span>
          </p>
        )}

        {/* One panel, relabelled per tab: only the selected tab's content
            is ever mounted, so there is never a hidden panel to point at. */}
        <div role="tabpanel" id={panelId(view)} aria-labelledby={tabId(view)}>
          {view === "salary" && (
            <div className="mt-stack">
              <PaydayHeader
                salary={salary}
                onSalaryChange={setSalary}
                totalPercent={totalPercent}
                spent={spent}
                remaining={remaining}
                categories={categories}
              />
            </div>
          )}

          {view === "split" && (
            <>
              {/* Always mounted while this tab is, empty when the split fits:
                  a live region has to be registered before content lands in
                  it or the first message goes unread. The banner names the
                  allocation consequence once, in pesos. */}
              <div role="status">
                {totalPercent > 100 && (
                  <p className="mt-stack max-w-prose rounded-control bg-action-tint px-3.5 py-[9px] font-display text-meta font-semibold text-action-edge">
                    Over by {pct(totalPercent - 100)}% ·{" "}
                    <b className="font-bold">{pesoRound(overAmount)}</b> more
                    than this payday
                  </p>
                )}
              </div>

              {/* Mounted empty, like the over-allocation banner above it and for
                  the same reason: a live region has to be registered before
                  anything lands in it or the first message goes unread. Empty it
                  draws no box and takes no margin.

                  It sits above the cards because that is where the loss is
                  visible — a deleted card leaves a gap in the grid below.
                  Switching tabs does not expire it either, since it expires on
                  identity and a tab switch builds no new array. Nothing
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
                        notify("Split restored");
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
                spent={spentByCategory(expenses)}
                onChangeCategory={updateCategory}
                onRemoveCategory={removeCategory}
                onRemoveSub={removeSub}
                onAddCategory={addCategory}
              />
            </>
          )}

          {view === "expenses" && (
            <>
              <section className="mt-stack flex flex-wrap items-end justify-between gap-6 rounded-slab border border-line bg-card px-deck-x py-[26px]">
                <SpendSummary spent={spent} remaining={remaining} className="min-w-0 flex-1" />
                <div className="inline-flex flex-col items-start gap-2 max-[700px]:w-full">
                  <Button
                    onClick={() => setExpenseDialogOpen(true)}
                    inert={categories.length === 0}
                    disabled={categories.length === 0}
                    aria-describedby={categories.length === 0 ? "add-expense-help" : undefined}
                    className="max-[700px]:w-full"
                  >
                    <Plus size={17} aria-hidden="true" strokeWidth={2.2} />
                    Add expense
                  </Button>
                  {categories.length === 0 && (
                    <p id="add-expense-help" className="text-meta text-ink-soft">
                      Add a category before recording expenses.
                    </p>
                  )}
                </div>
              </section>

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
                  notify(`Restored "${expenseUndo.expense.title}"`);
                }}
              />
            </>
          )}
        </div>
      </main>
      {expenseDialogOpen && (
        <ExpenseDialog
          categories={categories}
          onClose={() => setExpenseDialogOpen(false)}
          onSubmit={addExpense}
        />
      )}
      {toastRegion}
    </div>
  );
}
