# ADR-0001: Move Model Type Generation to Build-Time Only

## Status
Accepted

## Context

The type generation system introduced in #403 generates TypeScript types, enums, and constants from `models.yaml`. However, the generated files in `src/tools/config/generated/` are currently tracked in version control, creating several architectural problems:

### Problems with Current Approach

1. **Dual Maintenance Burden**: Developers must maintain both the source (`models.yaml`) and the generated artifacts (`src/tools/config/generated/*.ts`), violating the "single source of truth" principle.

2. **Merge Conflicts**: When multiple branches modify `models.yaml`, the generated files create merge conflicts that must be manually resolved.

3. **Manual Regeneration Required**: Developers must remember to run `npm run generate:models` after modifying `models.yaml` and commit the changes, adding friction to the development workflow.

4. **Circular Dependency**: The current generator implementation has a circular dependency:
   - Generator script imports from `dist/tools/config/model-loader.js`
   - But `dist/` is created by TypeScript compilation
   - TypeScript compilation requires generated files to exist in `src/`
   - This forces generated files to be committed to make first build work

5. **CI Failures**: The lefthook validation check causes CI failures when developers forget to regenerate files, requiring manual intervention.

### Current Workflow
```
models.yaml → (manual) npm run generate:models → generated/*.ts → git commit
```

### Industry Patterns

Standard practice across the industry is to **generate** from source and **ignore** artifacts:

- **Protocol Buffers**: `.proto` files committed, generated code ignored
- **GraphQL Codegen**: Schema committed, generated types ignored
- **OpenAPI Generator**: Spec committed, client code ignored
- **TypeORM/Prisma**: Schema committed, migrations/types ignored
- **node_modules**: `package.json` committed, dependencies ignored

Our current approach of committing generated files goes against this established pattern.

## Decision

**Adopt build-time only generation**: Generate TypeScript types at build time and exclude them from version control.

### Implementation

1. **Break Circular Dependency**: Update `scripts/generate-model-types.ts` to read `models.yaml` directly using `js-yaml`, removing the dependency on `dist/tools/config/model-loader.js`.

2. **Update .gitignore**: Add generated files to `.gitignore`:
   ```gitignore
   # Generated model types - regenerated at build time
   src/tools/config/generated/*.ts
   src/tools/config/generated/README.md
   !src/tools/config/generated/.gitkeep
   ```

3. **Simplify Build Scripts**: Remove conditional generation logic in `package.json`:
   - Change `generate:models:internal` to always run
   - Remove `validate:models` script (no longer needed)
   - Update `dev` script to generate types before watch mode

4. **Update Git Hooks**: Remove `validate-generated-types` hook from `lefthook.yml` since generated files are no longer tracked.

5. **Git Cleanup**: Remove generated files from git tracking with `git rm`.

### New Workflow
```
models.yaml → (automatic) npm run build → generated/*.ts (gitignored)
```

## Consequences

### Positive Consequences

✅ **Single Source of Truth**: `models.yaml` is the only source that needs maintenance

✅ **No Merge Conflicts**: Generated files are not tracked, eliminating conflicts

✅ **Automatic Regeneration**: Build process handles regeneration transparently

✅ **Clean Git History**: No noise from auto-generated file changes

✅ **CI Reliability**: No validation failures from out-of-sync generated files

✅ **Follows Best Practices**: Aligns with industry-standard patterns for generated code

✅ **Simpler Developer Experience**: No manual regeneration step to remember

### Negative Consequences

⚠️ **Build Required**: Developers must run `npm run build` after:
- Fresh clone
- Pulling changes to `models.yaml`
- This is standard practice (like `npm install` after `package.json` changes)

⚠️ **IDE Warnings**: Before first build, TypeScript imports of generated types will show errors
- Solution: Document "run `npm run build` first" in README
- This is temporary and only affects initial setup

⚠️ **Dev Script Change**: The `dev` watch mode must generate types before starting
- Solution: Update script to `npm run generate:models:internal && tsc --watch`

## Alternatives Considered

### Alternative 1: Keep Generated Files with Auto-Regeneration
**Description**: Keep committing generated files but add pre-commit hook to auto-regenerate and stage them.

**Pros:**
- Generated files visible in code review
- No build required before development
- TypeScript intellisense works immediately

**Cons:**
- Still maintains dual sources of truth
- Still creates merge conflicts
- Pre-commit hooks that modify files are fragile
- Adds complexity to git workflow (interactive staging, partial commits)
- Doesn't solve the fundamental architectural problem

**Reason for Rejection**: This approach automates a workaround instead of fixing the root cause. It maintains all the architectural problems while adding hook complexity.

### Alternative 2: Runtime Generation
**Description**: Generate types at runtime by reading YAML dynamically.

**Pros:**
- No build step needed
- Always in sync

**Cons:**
- Loses TypeScript type safety
- Runtime performance overhead
- No IDE intellisense support
- Defeats the purpose of the type system

**Reason for Rejection**: Eliminates the primary benefit of type generation (compile-time type safety).

## Related Decisions

- **Issue #401**: Parent issue for dynamic AI model configuration
- **Issue #403**: Original type generation implementation (now refined by this ADR)
- **Issue #404**: Dynamic examples (depends on this architecture)
- **Issue #405**: CI pipeline (simplified by this decision)

## Implementation Notes

### Generator Script Changes

**Before** (circular dependency):
```typescript
const modelLoaderPath = join(__dirname, "..", "dist", "tools", "config", "model-loader.js");
const { loadModelsFromYaml } = await import(modelLoaderPath);
```

**After** (direct YAML reading):
```typescript
import yaml from 'js-yaml';
import { readFileSync } from 'fs';
const yamlPath = join(__dirname, "..", "src", "tools", "config", "models.yaml");
const config = yaml.load(readFileSync(yamlPath, 'utf8')) as ModelsConfig;
```

### Build Flow

1. `npm run generate:models:internal` → reads YAML, writes to `src/tools/config/generated/`
2. `tsc` → compiles everything including generated files
3. `npm run copy-yaml` → copies YAML to `dist/`

### Files Affected

- `scripts/generate-model-types.ts` - Remove dist/ dependency
- `.gitignore` - Add generated files
- `package.json` - Simplify scripts
- `lefthook.yml` - Remove validation hook
- `src/tools/config/generated/*.ts` - Remove from git tracking

## Validation

To verify this decision is working correctly:

1. **Clean build test**:
   ```bash
   rm -rf dist/ src/tools/config/generated/*.ts
   npm run build
   # Should succeed without errors
   ```

2. **Type safety test**:
   ```bash
   npm run type-check
   # Should succeed after build
   ```

3. **CI test**: CI should build successfully from clean checkout

## Documentation Updates

- **README.md**: Add note about running `npm run build` after cloning
- **CONTRIBUTING.md**: Document the build-time generation workflow
- **generated/README.md**: Update to reflect that files are not committed

## Date
2025-12-11

## Authors
@architecture-advisor (GitHub Copilot Agent)

## References
- [MADR Format](https://adr.github.io/madr/)
- [Issue #405](https://github.com/Anselmoo/mcp-ai-agent-guidelines/issues/405) - Architecture concerns
- [Protocol Buffers Best Practices](https://protobuf.dev/)
- [GraphQL Code Generator](https://the-guild.dev/graphql/codegen)
