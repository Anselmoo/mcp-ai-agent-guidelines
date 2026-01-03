# 🔧 P2-013: Remove Legacy Error Classes [serial]

> **Parent**: [002-parent-phase2-domain-extraction.md](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/issues-draft/002-parent-phase2-domain-extraction.md)
> **Labels**: `phase-2`, `priority-low`, `serial`, `copilot-suitable`, `mcp-serena`
> **Milestone**: M3: Domain Layer
> **Estimate**: 2 hours
> **Depends On**: P2-008, P2-009, P2-010

## Context

Once all tools are migrated to the new error handling system, the legacy error classes (`ValidationError`, `ConfigurationError`, `OperationError`) can be removed.

## Task Description

Remove old error classes after migration is complete:

**Steps:**
1. Search codebase for imports of old error classes
2. Verify no tools use them directly
3. Remove classes from `src/tools/shared/errors.ts`
4. Update barrel exports
5. Ensure clean compilation

**Before:**
```typescript
// src/tools/shared/errors.ts
export class ValidationError extends Error { ... }
export class ConfigurationError extends Error { ... }
export class OperationError extends Error { ... }
export class McpToolError extends Error { ... }
```

**After:**
```typescript
// src/tools/shared/errors.ts
export class McpToolError extends Error { ... }
// Legacy classes removed
```

## Acceptance Criteria

- [ ] No tools import `ValidationError`, `ConfigurationError`, `OperationError`
- [ ] Classes removed from `errors.ts`
- [ ] Clean compilation (`npm run build`)
- [ ] All tests pass
- [ ] Documentation updated if needed

## Files to Modify

- `src/tools/shared/errors.ts`

## Verification

```bash
# Check no imports remain
grep -r "ValidationError\|ConfigurationError\|OperationError" src/tools --include="*.ts" | grep -v "errors.ts"

npm run build && npm run test:all
```

## References

- [SPEC-003: Error Handling Refactor](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-003-error-handling-refactor.md)
- [TASKS Phase 2](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/tasks/TASKS-phase-2-domain-extraction.md) P2-013
