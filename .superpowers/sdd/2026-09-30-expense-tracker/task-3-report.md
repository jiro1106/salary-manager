# Task 3 report

- Added `ExpenseHistory`, a themed section that renders saved expense titles, category-name snapshots, full peso amounts, local date and time, accessible delete controls, an empty state, and a single undo offer.
- The component sorts a copy of the input by `created_at`, newest first; it does not mutate the prop array.
- TDD: all four component tests failed against an empty component, then passed after implementation. They cover ordering and rendered values, the empty state, delete ID, and undo callback.
- Verification: `npm test` passed (14 tests); `npm run build` passed; `git diff --check` passed. Vitest emitted existing Vite/React plugin deprecation warnings.
- Scope: only the new component, its test, and this report changed. No dependencies or app integration were added.
