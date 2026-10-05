# Task 1 report

- Implementation commit: `96e3101` (`feat: add expense domain model`).
- Files: `package.json`, `package-lock.json`, `src/types.ts`, `src/lib/expenses.ts`, `src/lib/expenses.test.ts`.
- TDD: the new test file failed because `./expenses` was absent, then passed after implementation.
- Verification: `npm test` passed (10 tests); `npm run build` passed; `git diff --check` passed.
- Compatibility: `Config.expenses` is optional so the current app and older stored configs remain valid until integration.
- Caveat: Vitest 4 runs with its bundled Vite 8 and emits React plugin deprecation warnings; tests and the Vite 5 production build both pass.
