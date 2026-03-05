# Task Completion Checklist

When finishing any code task, run these steps in order:

## 1. Quality gate (fast — always run)
```bash
npm run quality   # type-check + biome lint/format check
```
Fix any errors before proceeding.

## 2. Auto-fix style issues (if needed)
```bash
npm run check:fix
```

## 3. Run relevant tests
```bash
npm run test:vitest   # Fast — run this at minimum
# OR for full confidence:
npm run test:all      # Slower — build + all test suites
```

## 4. Pre-commit hook (auto-runs on `git commit`)
- Biome format/lint check
- Gitleaks secret scan
- TypeScript type check
- Quick Vitest bail-on-first-failure

## 5. Pre-push hook (auto-runs on `git push`)
```bash
npx lefthook run pre-push   # npm run quality + npm run test:all
```

## Notes
- `dist/` must exist for tests that import from `../../dist/...` — run `npm run build` first
- If committing while a known test is failing (e.g. pre-existing security test): use `git commit --no-verify` and document why
- After adding/modifying tools: update barrel `index.ts`, register in `src/index.ts`, add tests
- After changing tool outputs: regenerate demos with `node demos/demo-tools.js`
