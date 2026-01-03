# 🔧 P2-009: Migrate Prompt Tools to New Errors [parallel]

> **Parent**: #696
> **Labels**: `phase-2`, `priority-medium`, `parallel`, `copilot-suitable`, `mcp-serena`
> **Milestone**: M3: Domain Layer
> **Estimate**: 4 hours
> **Depends On**: P2-004
> **Blocks**: P2-013

## Context

All prompt builder tools need to be migrated to the new error handling pattern for consistency.

## Task Description

Update all prompt tools to use `handleToolError()`:

**Tools to migrate:**
1. `hierarchical-prompt-builder.ts`
2. `code-analysis-prompt-builder.ts`
3. `architecture-design-prompt-builder.ts`
4. `debugging-assistant-prompt-builder.ts`
5. `documentation-generator-prompt-builder.ts`
6. `security-hardening-prompt-builder.ts`
7. `domain-neutral-prompt-builder.ts`
8. `spark-prompt-builder.ts`
9. `prompt-chaining-builder.ts`
10. `prompt-flow-builder.ts`
11. `prompting-hierarchy-evaluator.ts`
12. `hierarchy-level-selector.ts`

**Pattern to apply:**
```typescript
import { handleToolError } from '../shared/error-handler.js';
import { validationError, missingRequiredError } from '../shared/error-factory.js';

export async function promptTool(params: Params) {
  try {
    // Validate required fields
    if (!params.goal) {
      throw missingRequiredError('goal');
    }

    // ... logic
    return result;
  } catch (error) {
    return handleToolError(error);
  }
}
```

## Acceptance Criteria

- [ ] All 12 prompt tools use `handleToolError()`
- [ ] No raw try/catch with string messages
- [ ] Factory functions used for common errors
- [ ] All existing tests pass

## Files to Modify

- `src/tools/prompt/hierarchical-prompt-builder.ts`
- `src/tools/prompt/code-analysis-prompt-builder.ts`
- `src/tools/prompt/architecture-design-prompt-builder.ts`
- `src/tools/prompt/debugging-assistant-prompt-builder.ts`
- `src/tools/prompt/documentation-generator-prompt-builder.ts`
- `src/tools/prompt/security-hardening-prompt-builder.ts`
- `src/tools/prompt/domain-neutral-prompt-builder.ts`
- `src/tools/prompt/spark-prompt-builder.ts`
- `src/tools/prompt/prompt-chaining-builder.ts`
- `src/tools/prompt/prompt-flow-builder.ts`
- `src/tools/prompt/prompting-hierarchy-evaluator.ts`
- `src/tools/prompt/hierarchy-level-selector.ts`

## Verification

```bash
npm run build && npm run test:vitest -- prompt
```

## References

- [SPEC-003: Error Handling Refactor](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-003-error-handling-refactor.md)
- [TASKS Phase 2](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/tasks/TASKS-phase-2-domain-extraction.md) P2-009
