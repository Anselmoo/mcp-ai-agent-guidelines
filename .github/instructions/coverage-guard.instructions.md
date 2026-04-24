---
description: "Use when adding new TypeScript source files, implementing new features, refactoring modules, or writing tests. Enforces that new code never lowers the project coverage rate — every new source file must ship with tests."
applyTo: "src/**/*.ts"
---
# Coverage Guard: New TypeScript Must Not Lower Coverage

This project enforces coverage thresholds via Vitest (v8 provider). **Any new `.ts` file you add to `src/` that is not excluded must be accompanied by tests so the overall coverage does not regress.**

## Thresholds (from `vitest.config.ts`)

| Metric     | Minimum |
|------------|---------|
| Statements | 90 %    |
| Lines      | 90 %    |
| Functions  | 90 %    |
| Branches   | 85 %    |

## Rules

1. **New source file → new test file.** Every file added under `src/` (except `src/generated/**`, `src/tests/**`, `src/toon-demo.ts`) must have a corresponding test under `src/tests/` that exercises its public API.
2. **Mirror the source tree.** Place test files at `src/tests/<subpath>/<module>.test.ts` to mirror `src/<subpath>/<module>.ts`.
3. **Verify locally before committing.** Run `npm run test:coverage` and confirm the summary still meets all four thresholds. A red threshold line is a hard blocker.
4. **No untested exports.** Every exported function, class, and constant must appear in at least one `it()`/`test()` block. Stubs and `vi.fn()` mocks count only toward the caller's coverage, not the callee's.
5. **Branches need cases.** For every `if`/`switch`/ternary in new code, write at least one test for the truthy path and one for the falsy path.
6. **Do not widen the coverage exclusion list.** Adding a new glob to `vitest.config.ts → coverage.exclude` to hide a file from reporting is not an acceptable workaround.

## Workflow

```
1. Write (or modify) src/<path>/<module>.ts
2. Create src/tests/<path>/<module>.test.ts
3. npm run test:coverage
4. Confirm thresholds pass — fix gaps before opening a PR
```

## Quick check (coverage summary)

```sh
# Show per-file coverage for the file you just added
npx vitest run --coverage --reporter=text 2>&1 | grep "<module>"
```

## Anti-patterns

- Adding a new utility module with zero tests "to keep the PR small"
- Relying on integration tests in another file to cover a new module
- Deleting tests to make a failing threshold pass
- Using `/* c8 ignore next */` to skip coverage on non-trivial logic
