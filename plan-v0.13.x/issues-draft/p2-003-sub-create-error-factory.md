# 🔧 P2-003: Create Error Factory Functions [serial]

> **Parent**: #696
> **Labels**: `phase-2`, `priority-high`, `serial`, `copilot-suitable`, `mcp-serena`
> **Milestone**: M3: Domain Layer
> **Estimate**: 2 hours
> **Depends On**: P2-002
> **Blocks**: P2-004

## Context

Creating `McpToolError` instances directly requires knowing the correct error code and message format. Factory functions provide a cleaner API and ensure consistent error creation.

## Task Description

Create `src/tools/shared/error-factory.ts` with factory functions:

```typescript
import { McpToolError } from './errors.js';
import { ErrorCode } from './error-codes.js';

export function validationError(
  message: string,
  context?: Record<string, unknown>
): McpToolError {
  return new McpToolError(ErrorCode.VALIDATION_FAILED, message, context);
}

export function missingRequiredError(
  fieldName: string,
  context?: Record<string, unknown>
): McpToolError {
  return new McpToolError(
    ErrorCode.MISSING_REQUIRED_FIELD,
    `Missing required field: ${fieldName}`,
    { fieldName, ...context }
  );
}

export function sessionNotFoundError(
  sessionId: string
): McpToolError {
  return new McpToolError(
    ErrorCode.SESSION_NOT_FOUND,
    `Session not found: ${sessionId}`,
    { sessionId }
  );
}

export function fileSystemError(
  operation: 'read' | 'write',
  path: string,
  cause?: Error
): McpToolError {
  const code = operation === 'read'
    ? ErrorCode.FILE_READ_ERROR
    : ErrorCode.FILE_WRITE_ERROR;
  return new McpToolError(code, `File ${operation} failed: ${path}`, { path }, cause);
}

export function schemaViolationError(
  zodError: unknown,
  context?: Record<string, unknown>
): McpToolError {
  return new McpToolError(
    ErrorCode.SCHEMA_VIOLATION,
    'Schema validation failed',
    { zodError, ...context }
  );
}

export function phaseTransitionError(
  currentPhase: string,
  targetPhase: string,
  reason: string
): McpToolError {
  return new McpToolError(
    ErrorCode.INVALID_PHASE_TRANSITION,
    `Cannot transition from ${currentPhase} to ${targetPhase}: ${reason}`,
    { currentPhase, targetPhase, reason }
  );
}
```

## Acceptance Criteria

- [ ] File created: `src/tools/shared/error-factory.ts`
- [ ] 6+ factory functions implemented
- [ ] Each factory includes appropriate context automatically
- [ ] Functions are well-typed with proper return types
- [ ] Exported from barrel file
- [ ] Unit tests for each factory function

## Files to Create

- `src/tools/shared/error-factory.ts`
- `tests/vitest/shared/error-factory.spec.ts`

## Files to Modify

- `src/tools/shared/index.ts` — add exports

## Verification

```bash
npm run build && npm run test:vitest -- error-factory
```

## References

- [SPEC-003: Error Handling Refactor](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-003-error-handling-refactor.md)
- [TASKS Phase 2](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/tasks/TASKS-phase-2-domain-extraction.md) P2-003
