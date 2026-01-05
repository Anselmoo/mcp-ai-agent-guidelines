# 🔧 P2-008: Migrate Design-Assistant to New Errors [serial]

> **Parent**: #696
> **Labels**: `phase-2`, `priority-high`, `serial`, `copilot-suitable`, `mcp-serena`
> **Milestone**: M3: Domain Layer
> **Estimate**: 6 hours
> **Depends On**: P2-004
> **Blocks**: P2-013

## Context

The design-assistant has complex error handling across multiple services. This migration will serve as the template for other tool migrations.

## Task Description

Update design-assistant to use the new error handling pattern:

**Before:**
```typescript
try {
  // ... operation
} catch (error) {
  if (error instanceof ValidationError) {
    return { isError: true, content: [{ type: 'text', text: error.message }] };
  }
  throw error;
}
```

**After:**
```typescript
import { handleToolError } from '../shared/error-handler.js';
import { sessionNotFoundError, phaseTransitionError } from '../shared/error-factory.js';

export async function designAssistant(params: DesignAssistantRequest) {
  try {
    const session = getSession(params.sessionId);
    if (!session) {
      throw sessionNotFoundError(params.sessionId);
    }

    if (!canTransition(session.phase, params.targetPhase)) {
      throw phaseTransitionError(session.phase, params.targetPhase, 'Invalid transition');
    }

    // ... rest of logic
  } catch (error) {
    return handleToolError(error);
  }
}
```

## Acceptance Criteria

- [ ] All error paths use `ErrorCode` via factory functions
- [ ] Single catch block with `handleToolError()`
- [ ] Services updated: session-management, phase-management, artifact-generation
- [ ] Existing tests pass
- [ ] New error path tests added (at least 5)

## Files to Modify

- `src/tools/design/design-assistant.ts`
- `src/tools/design/services/session-management-service.ts`
- `src/tools/design/services/phase-management-service.ts`
- `src/tools/design/services/artifact-generation-service.ts`
- `src/tools/design/services/consistency-service.ts`

## Verification

```bash
npm run build && npm run test:vitest -- design-assistant
```

## References

- [SPEC-003: Error Handling Refactor](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-003-error-handling-refactor.md)
- [TASKS Phase 2](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/tasks/TASKS-phase-2-domain-extraction.md) P2-008
