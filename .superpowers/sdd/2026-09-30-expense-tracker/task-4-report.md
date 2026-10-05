# Task 4 report

- Replaced Save payday and payday history with expense creation, history, delete/undo, and Salary/Spent/Left totals. The remaining amount can be negative.
- Config now loads missing `expenses` as `[]` and persists expenses with salary and categories. Expense creation uses `makeExpense` and `crypto.randomUUID()`; totals use `expenseSummary`.
- Removed the old history panel, history types, and unused save/restore animations. Updated stale template confirmation and repository guidance.
- TDD: four App integration tests failed against the prior App for the missing expense flow and remaining payday UI, then passed after implementation. A fifth checks a negative Left balance.
- Verification: `npm test` passed (27 tests); `npm run build` passed; `git diff --check` passed. Vitest emitted existing Vite React plugin deprecation warnings.
