# Expense Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace payday snapshots with a locally persisted expense ledger, modal expense entry, remaining-salary summary, and expense history.

**Architecture:** Keep `App` as the single state owner and persist expenses through the existing debounced configuration write path. Put validation and salary calculations in one pure helper module, then keep the modal, payday summary, and history as controlled presentational components using the existing design tokens and dialog behavior.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS, localStorage, Vitest, Testing Library, jsdom

**Spec:** `docs/superpowers/specs/2026-09-30-expense-tracker-design.md`

## Global Constraints

- Do not add a backend, router, state library, or new production dependency.
- Preserve the existing salary split, category cards, cut dial, legend, template gallery, and over-allocation behavior.
- Use only existing CSS tokens and Tailwind mappings; no raw colors, new visual system, or container shadows.
- Keep every interactive target at least 44×44px and retain the existing blue focus treatment.
- Store `created_at` as an ISO string and display it with the `en-PH` locale.
- Keep salary remaining truthful when negative; never clamp it to zero.
- Leave the old `salary-manager:history` localStorage value untouched but stop reading and writing it.
- Use a native `select` for categories and no dependency for modal behavior.

## Review Focus

- A title containing only whitespace must stay in the modal and show a title error.
- Amounts that are empty, zero, negative, non-numeric, over nine integer digits, or over two decimal places must not create an expense.
- A category deleted or renamed after logging must not erase the category snapshot shown in history.
- Reloading immediately after adding or deleting an expense must preserve the latest list through the existing hide/pagehide flush path.
- Keyboard users must remain trapped inside the open modal, close it with Escape, and return focus to Add expense.

---

### Task 1: Expense domain and test harness

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `src/types.ts`
- Create: `src/lib/expenses.ts`
- Create: `src/lib/expenses.test.ts`

**Interfaces:**
- Produces: `Expense`, `ExpenseDraft`, and `ExpenseErrors` types.
- Produces: `makeExpense(draft: ExpenseDraft, categories: Category[], id: string, createdAt: string): { expense: Expense | null; errors: ExpenseErrors }`.
- Produces: `expenseSummary(salary: number, expenses: Expense[]): { spent: number; remaining: number }`.

- [ ] **Step 1: Add the smallest test harness**

Add Vitest, jsdom, and Testing Library as dev dependencies and add `"test": "vitest run"` to `package.json`.

- [ ] **Step 2: Write failing domain tests**

In `src/lib/expenses.test.ts`, cover:

```ts
it("creates an expense with an ISO timestamp and category-name snapshot")
it("rejects a blank title")
it.each(["", "0", "-1", "abc", "1000000000", "12.345"])("rejects invalid amount %s")
it("rejects a category that is not in the current category list")
it("reports spent and a negative remaining salary without clamping")
```

Assert exact field errors, exact `categoryName`, exact `created_at`, and `{ spent: 1600, remaining: -600 }` for a ₱1,000 salary with two ₱800 expenses.

- [ ] **Step 3: Run the tests and verify RED**

Run: `npm test -- src/lib/expenses.test.ts`

Expected: FAIL because `src/lib/expenses.ts` and its exports do not exist.

- [ ] **Step 4: Add the expense types and minimal pure helpers**

Add this persisted shape to `src/types.ts`:

```ts
export interface Expense {
  id: string;
  title: string;
  amount: number;
  categoryId: string;
  categoryName: string;
  created_at: string;
}
```

Add `expenses: Expense[]` to `Config`. Implement only the validation, category snapshot, and summary behavior required by the tests in `src/lib/expenses.ts`.

- [ ] **Step 5: Run the domain tests and verify GREEN**

Run: `npm test -- src/lib/expenses.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/types.ts src/lib/expenses.ts src/lib/expenses.test.ts
git commit -m "feat: add expense domain model"
```

### Task 2: Accessible themed expense modal

**Files:**
- Create: `src/components/ExpenseDialog.tsx`
- Create: `src/components/ExpenseDialog.test.tsx`

**Interfaces:**
- Consumes: `ExpenseDraft`, `ExpenseErrors`, and the existing `Category` type.
- Produces: `ExpenseDialog({ open, categories, onSubmit, onCancel })`, where `onSubmit(draft: ExpenseDraft): ExpenseErrors` returns an empty object on success or field errors that keep the dialog open.

- [ ] **Step 1: Write failing modal behavior tests**

Cover:

```ts
it("renders title, amount, and current-category fields over a modal scrim")
it("submits the three entered values")
it("keeps invalid input open and associates returned errors with fields")
it("closes on Escape and returns focus to the opener")
it("cycles Tab focus within the dialog")
```

Use real DOM events; mock only `onSubmit` and `onCancel` callbacks.

- [ ] **Step 2: Run the modal tests and verify RED**

Run: `npm test -- src/components/ExpenseDialog.test.tsx`

Expected: FAIL because `ExpenseDialog` does not exist.

- [ ] **Step 3: Implement the controlled modal**

Use `createPortal`, the existing `bg-scrim`, `rounded-slab`, `border-line`, `Button`, and focus-ring utilities. Add labelled text inputs for title and amount, a native category `select`, inline field errors, first-field focus, focus trapping, Escape/scrim cancellation, form reset after a successful submit, and focus return on cleanup. Use `role="dialog"`, not `alertdialog`, because logging an expense is not destructive.

- [ ] **Step 4: Run the modal tests and verify GREEN**

Run: `npm test -- src/components/ExpenseDialog.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/ExpenseDialog.tsx src/components/ExpenseDialog.test.tsx
git commit -m "feat: add expense entry dialog"
```

### Task 3: Build expense history

**Files:**
- Create: `src/components/ExpenseHistory.tsx`
- Create: `src/components/ExpenseHistory.test.tsx`

**Interfaces:**
- Consumes: `expenses: Expense[]`, `undoExpense: Expense | null`, `onDelete(id: string): void`, and `onUndo(): void`.
- Produces: newest-first expense rows showing title, category snapshot, exact amount, localized date/time, delete control, empty state, and one-step undo status.

- [ ] **Step 1: Write failing history tests**

Cover:

```ts
it("shows newest expenses first with title, category, amount, and date")
it("renders the expense empty state")
it("deletes an expense from its accessible icon action")
it("offers and invokes one-step undo")
it("keeps the stored category snapshot when current categories change")
```

- [ ] **Step 2: Run the history tests and verify RED**

Run: `npm test -- src/components/ExpenseHistory.test.tsx`

Expected: FAIL because `ExpenseHistory` does not exist.

- [ ] **Step 3: Implement the history section**

Reuse `IconButton`, `Button`, `peso()`, existing border/radius tokens, and the disclosure animation only if the list remains collapsible. Use a two-line responsive row on narrow screens; do not hide the category or timestamp. Omit tab navigation because only expense history remains.

- [ ] **Step 4: Run the history tests and verify GREEN**

Run: `npm test -- src/components/ExpenseHistory.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/ExpenseHistory.tsx src/components/ExpenseHistory.test.tsx
git commit -m "feat: add expense history"
```

### Task 4: Integrate expense tracking and remove payday history

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/PaydayHeader.tsx`
- Modify: `src/types.ts`
- Modify: `CLAUDE.md`
- Delete: `src/components/HistoryPanel.tsx`
- Create: `src/App.test.tsx`
- Create: `src/components/PaydayHeader.test.tsx`

**Interfaces:**
- Consumes: `makeExpense`, `expenseSummary`, `ExpenseDialog`, and `ExpenseHistory`.
- Produces: revised `PaydayHeader` props `totalExpenses: number`, `salaryRemaining: number`, `canAddExpense: boolean`, and `onAddExpense(): void`.
- Removes: `inputRef`, `restoreTick`, `onSave`, `savedFlash`, save-burst state, Save Payday copy, and payday-history types/components.
- Produces: one working flow from Add expense through persistence, summary update, history, delete, and undo.

- [ ] **Step 1: Write failing header tests**

In `src/components/PaydayHeader.test.tsx`, cover:

```ts
it("shows Add expense, spent, and salary left")
it("calls onAddExpense from the primary action")
it("disables Add expense and explains why when there are no categories")
it("styles a negative remaining amount as a warning without changing its value")
```

- [ ] **Step 2: Run the header tests and verify RED**

Run: `npm test -- src/components/PaydayHeader.test.tsx`

Expected: FAIL because the current header still exposes Save Payday and has no expense summary.

- [ ] **Step 3: Revise the payday header**

Delete the save-success dot burst, related imports/effects/state, history-restore props, and Save Payday props. Move the input ref inside the component for its existing clear-and-refocus behavior. Put Add expense in the same primary-action position. Add compact Spent and Left figures next to or directly below the salary field without moving the dial, legend, or over-allocation warning. Use `peso()` for exact centavo figures and `text-action-edge` only when `salaryRemaining < 0`.

- [ ] **Step 4: Run the header tests and verify GREEN**

Run: `npm test -- src/components/PaydayHeader.test.tsx`

Expected: PASS.

- [ ] **Step 5: Write failing application integration tests**

Cover:

```ts
it("loads an older config without expenses as an empty expense list")
it("adds a valid expense and updates spent, left, and history")
it("persists expenses in salary-manager:config")
it("deletes and restores the same expense at its original position")
it("does not read or write salary-manager:history")
```

Use fake timers only for the existing 400ms config-save delay; assert against real localStorage values.

- [ ] **Step 6: Run the integration tests and verify RED**

Run: `npm test -- src/App.test.tsx`

Expected: FAIL because `App` has no expense state and still owns payday history.

- [ ] **Step 7: Replace payday-history state with expense state**

In `App.tsx`:

- load `cfg.expenses ?? []`;
- include `expenses` in the config-save effect and dependency list;
- delete `HISTORY_KEY`, `history`, `savedFlash`, `restoreTick`, `paydayRef`, `savePaycheck`, `deleteEntry`, and history restore behavior;
- track dialog open state and the most recently deleted `{ expense, index }` for one-step undo;
- create expenses through `makeExpense(..., uid(), new Date().toISOString())`;
- clear the undo offer after a successful add or a later delete;
- derive summary values through `expenseSummary`;
- wire `ExpenseDialog`, revised `PaydayHeader`, and `ExpenseHistory`.
- delete `HistoryEntry`, `HistoryBreakdownItem`, and `src/components/HistoryPanel.tsx`.

- [ ] **Step 8: Update repository guidance**

Remove obsolete Save Payday/payday-history documentation from `CLAUDE.md` and document the `Expense` snapshot, `created_at`, config persistence, remaining-salary calculation, modal behavior, and one-step expense undo.

- [ ] **Step 9: Run integration and full tests**

Run: `npm test -- src/App.test.tsx`

Expected: PASS.

Run: `npm test`

Expected: all tests PASS with zero warnings or unhandled errors.

- [ ] **Step 10: Commit**

```bash
git add src/App.tsx src/App.test.tsx src/components/PaydayHeader.tsx src/components/PaydayHeader.test.tsx src/components/HistoryPanel.tsx src/types.ts CLAUDE.md
git commit -m "feat: integrate expense tracking"
```

### Task 5: Build and browser verification

**Files:**
- Modify only files implicated by verification failures.

**Interfaces:**
- Consumes: the complete expense-tracker flow from Tasks 1–4.
- Produces: verified desktop/mobile behavior with no mechanical design-system violations.

- [ ] **Step 1: Run static and production checks**

Run: `npm test`

Expected: all tests PASS.

Run: `npm run build`

Expected: TypeScript and Vite finish with exit code 0.

- [ ] **Step 2: Run the app and verify the complete desktop flow**

Run: `npm run dev -- --host 127.0.0.1`

Verify at desktop width: themed centered modal and scrim, focus trap/return, validation, category options, creation timestamp, Spent/Left update, negative remaining state, persistence after reload, history ordering, delete, and undo.

- [ ] **Step 3: Verify the complete mobile flow**

At a narrow mobile viewport, verify the modal fits and scrolls internally, form controls remain usable, Add expense remains visible, and history wraps without hiding category or timestamp.

- [ ] **Step 4: Run the Impeccable detector once**

Run:

```bash
node /Users/jirolayug/.agents/skills/impeccable/scripts/detect.mjs --json src/App.tsx src/components/ExpenseDialog.tsx src/components/PaydayHeader.tsx src/components/ExpenseHistory.tsx
```

Expected: no unresolved design-system violations.

- [ ] **Step 5: Re-run affected checks after any verification fix**

Run `npm test` and `npm run build` again after the final fix. Perform at most one final desktop/mobile confirmation pass.

- [ ] **Step 6: Commit verification fixes, if any**

```bash
git add <only-files-changed-by-verification>
git commit -m "fix: polish expense tracking flow"
```
