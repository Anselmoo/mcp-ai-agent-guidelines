# Suggested Commands

## Build
```bash
npm run build          # Full build: generate models + tsc + copy YAML
npm run dev            # Watch mode (tsc --watch)
npm run type-check     # Type check only (no emit)
```

## Test
```bash
npm run test:vitest              # Primary Vitest suite (fast)
npm run test:coverage:vitest     # Vitest with coverage report
npm run test:all                 # Full suite: build + unit + integration + demo + mcp
npm run test:unit                # Legacy unit tests
npm run test:integration         # Integration tests (test-server.js)
npm run test:demo                # Demo regression tests
```

## Quality (run before committing)
```bash
npm run quality          # type-check + biome check (fast gate)
npm run check            # Biome lint + format check
npm run check:fix        # Auto-fix biome issues
npm run lint:fix         # Auto-fix lint only
npx lefthook run pre-commit   # Full pre-commit gate
npx lefthook run pre-push     # Full pre-push gate (includes tests)
```

## Security
```bash
npm run audit             # npm audit --audit-level=moderate
npm run audit:production  # npm audit --omit=dev --audit-level=moderate
npm run audit:fix         # npm audit fix
```

## Misc
```bash
npm run export:descriptions    # Export tool descriptions to CSV
npm run audit:schemas          # Audit Zod schema .describe() coverage
node demos/demo-tools.js       # Regenerate demo outputs
```

## Darwin (macOS) notes
- Use `sed -i ''` (not `sed -i`) for in-place edits
- `grep` may need `-E` for extended regex instead of `-P`
