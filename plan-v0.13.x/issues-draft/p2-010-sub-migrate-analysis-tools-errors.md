# 🔧 P2-010: Migrate Analysis Tools to New Errors [parallel]

> **Parent**: [002-parent-phase2-domain-extraction.md](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/issues-draft/002-parent-phase2-domain-extraction.md)
> **Labels**: `phase-2`, `priority-medium`, `parallel`, `copilot-suitable`, `mcp-serena`
> **Milestone**: M3: Domain Layer
> **Estimate**: 4 hours
> **Depends On**: P2-004
> **Blocks**: P2-013

## Context

All analysis tools need to be migrated to the new error handling pattern for consistency.

## Task Description

Update all analysis tools to use `handleToolError()`:

**Tools to migrate:**
1. `clean-code-scorer.ts`
2. `code-hygiene-analyzer.ts`
3. `dependency-auditor.ts`
4. `iterative-coverage-enhancer.ts`
5. `semantic-code-analyzer.ts`
6. `strategy-frameworks-builder.ts`
7. `gap-frameworks-analyzers.ts`
8. `guidelines-validator.ts`
9. `sprint-timeline-calculator.ts`
10. `model-compatibility-checker.ts`

**Pattern to apply:**
```typescript
import { handleToolError } from '../shared/error-handler.js';
import { validationError, fileSystemError } from '../shared/error-factory.js';

export async function analysisTool(params: Params) {
  try {
    // ... analysis logic
    return result;
  } catch (error) {
    return handleToolError(error);
  }
}
```

## Acceptance Criteria

- [ ] All 10 analysis tools use `handleToolError()`
- [ ] Appropriate error factories used (e.g., `fileSystemError` for file operations)
- [ ] All existing tests pass

## Files to Modify

- `src/tools/analysis/clean-code-scorer.ts`
- `src/tools/analysis/code-hygiene-analyzer.ts`
- `src/tools/analysis/dependency-auditor.ts`
- `src/tools/analysis/iterative-coverage-enhancer.ts`
- `src/tools/semantic-code-analyzer.ts`
- `src/tools/analysis/strategy-frameworks-builder.ts`
- `src/tools/analysis/gap-frameworks-analyzers.ts`
- `src/tools/analysis/guidelines-validator.ts`
- `src/tools/analysis/sprint-timeline-calculator.ts`
- `src/tools/analysis/model-compatibility-checker.ts`

## Verification

```bash
npm run build && npm run test:vitest -- analysis
```

## References

- [SPEC-003: Error Handling Refactor](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-003-error-handling-refactor.md)
- [TASKS Phase 2](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/tasks/TASKS-phase-2-domain-extraction.md) P2-010
