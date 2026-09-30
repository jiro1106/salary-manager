# Expense Tracker Design

## Goal

Turn Nala from a salary splitter with low-value payday snapshots into a focused salary budget tracker. A user enters a take-home salary, logs expenses against their own categories, and can immediately see how much salary remains and when each expense was recorded.

## Scope

- Remove the Save Payday action, its success animation, payday-history state, storage, restore behavior, and history UI.
- Add one primary **Add expense** action in the payday card where Save Payday currently sits.
- Open expense entry in a centered modal over a dimmed scrim.
- Collect an expense title, positive peso amount, and one category selected from the user's current categories.
- Stamp each saved expense with `created_at` at submission time.
- Show salary, total expenses, and salary remaining without changing the existing percentage allocation model.
- Replace the bottom payday-history disclosure with expense history.
- Persist expenses locally alongside salary and categories.

Editing expenses, filtering history, recurring expenses, multiple payday periods, exports, analytics, and cloud synchronization are intentionally out of scope.

## Data Model and Calculations

Add an `Expense` type:

```ts
interface Expense {
  id: string;
  title: string;
  amount: number;
  categoryId: string;
  categoryName: string;
  created_at: string;
}
```

`categoryName` is stored as a snapshot so old history stays understandable after a category is renamed or deleted. `categoryId` still links an expense to a current category when one exists. Existing installs load with an empty expense list.

Derived values are never separately stored:

- `totalExpenses = sum(expense.amount)`
- `salaryRemaining = salary - totalExpenses`

Salary remaining may be negative. The interface reports that state plainly rather than clamping it to zero.

## State and Persistence

`App` continues to own all application state. Add `expenses` beside `salary`, `categories`, and the existing view state. Include expenses in `Config` and in the existing debounced/flush-on-hide configuration persistence path; no new storage service or dependency is needed.

Remove the `salary-manager:history` read/write path and the `HistoryEntry` types. Existing payday-history data may remain unused in local storage; no destructive migration is needed.

Adding and deleting expenses update `expenses` immutably. Storage failures continue to use the existing latched warning.

## Expense Modal

The Add expense button opens a portal-mounted modal centered in the viewport with the existing `--scrim` dimming the rest of the page. The modal uses the live flat-white design system: white card, hairline border, 12px surface radius, 8px controls, Plus Jakarta Sans, action-colored submit button, and existing focus color.

Fields:

1. **Expense title** — required text, trimmed before save.
2. **Expense amount** — required positive peso amount, using the same nine-integer-digit and two-decimal currency ceiling as salary input.
3. **Category** — required native `select` populated from the user's current categories.

The first field receives focus on open. Focus is trapped in the modal, Escape and the Cancel button close it, clicking the scrim closes it, and focus returns to the Add expense button. Submitting a valid expense adds it to history, closes the modal, and resets the fields. Invalid or missing values remain in the modal with an inline message associated to the relevant field.

When there are no categories, Add expense is disabled and nearby copy explains that a category must be created first.

## Payday Summary

Keep the salary input, allocation warning, cut dial, legend, and category cards unchanged. Replace the current Save Payday control with Add expense.

Add a compact summary near the salary row:

- **Spent** — total logged expenses.
- **Left** — salary remaining.

The remaining figure uses normal ink while non-negative and the existing action-edge warning color when negative. Money remains tabular and uses existing peso formatting.

## Expense History

The bottom section becomes **Expense history (N)**. Since payday history is removed, a tab bar would contain only one destination and is omitted until a second history type exists.

Expenses appear newest first. Each row shows:

- title;
- category snapshot;
- formatted amount;
- localized `created_at` date and time;
- an accessible delete icon.

The empty state says that logged expenses will appear there. Deletion is immediate and uses the existing one-step undo pattern rather than a confirmation dialog, preventing accidental loss without adding modal friction to a frequent action.

On narrow screens, the row wraps into two readable lines rather than hiding the category or timestamp.

## Accessibility and Responsive Behavior

- All interactive targets remain at least 44×44px.
- Every field has a visible label and inline validation is programmatically associated.
- The modal uses `role="dialog"`, `aria-modal="true"`, labelled title/description, focus trapping, Escape handling, and focus return.
- The dimmed page is not keyboard-accessible while the modal is open.
- Existing reduced-motion behavior remains intact.
- The modal fits within the viewport and its contents scroll internally on short screens.

## Verification

- Unit-level checks cover expense validation, total-expense calculation, negative remaining salary, and category-name snapshots.
- TypeScript and the production Vite build must pass.
- Browser verification covers desktop and mobile modal layout, keyboard focus, valid/invalid submission, persistence after reload, expense deletion/undo, empty categories, and negative remaining salary.
- Run the Impeccable detector once against changed UI files after implementation.
