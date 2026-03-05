# Code Style & Conventions

## TypeScript
- **Strict mode** + `isolatedModules: true` — no `any`, explicit types required
- **ESM imports**: all relative imports must end with `.js` (e.g. `import { x } from './foo.js'`)
- **No `console.log`** — use `shared/logger.ts` for all logging
- **Errors**: use `McpToolError` + `ErrorCode` enum from `src/domain/errors.ts` (preferred) or legacy `ValidationError`/`ConfigurationError` from `src/tools/shared/errors.ts`

## Formatting (Biome)
- **Indentation**: tabs
- **Quotes**: double quotes in JS/TS
- Biome recommended rules enabled

## File Organization
- **Barrel exports**: every module directory has `index.ts` re-exporting its public API
- **Mirror structure**: test files at `tests/vitest/<same path as src>/<file>.spec.ts`
- **Domain layer** (`src/domain/`): pure functions only, no framework deps, 100% coverage target
- **Tool layer** (`src/tools/`): thin handlers — validate input (Zod) → call domain → format output

## Naming
- Files: `kebab-case.ts`
- Classes: `PascalCase`
- Functions/variables: `camelCase`
- Zod schemas: `<Name>Schema` (e.g. `MyFeatureInputSchema`)
- Types: `type <Name>Input = z.infer<typeof <Name>Schema>`

## Singletons
- `constraintManager` (design/constraint-manager.ts) — reuse, never recreate
- `crossSessionConsistencyEnforcer` — reuse, never recreate

## Testing
- Use `vi.spyOn()` over mocks where possible
- No snapshots — use explicit assertions
- `beforeEach(() => vi.clearAllMocks())`
- Domain functions: 100% coverage; Tool handlers: 90% coverage
