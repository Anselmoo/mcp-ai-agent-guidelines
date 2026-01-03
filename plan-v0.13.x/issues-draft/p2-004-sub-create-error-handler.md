# 🔧 P2-004: Create Central Error Handler [serial]

> **Parent**: #696
> **Labels**: `phase-2`, `priority-high`, `serial`, `copilot-suitable`, `mcp-serena`
> **Milestone**: M3: Domain Layer
> **Estimate**: 3 hours
> **Depends On**: P2-003
> **Blocks**: P2-008, P2-009, P2-010

## Context

Each tool currently has its own try/catch with inconsistent error formatting. A central error handler enables:
- Consistent MCP response format
- Automatic ZodError conversion
- Pattern matching for common errors
- Single point for error logging/metrics

## Task Description

Create `src/tools/shared/error-handler.ts`:

```typescript
import { McpToolError } from './errors.js';
import { schemaViolationError, validationError } from './error-factory.js';
import { ErrorCode } from './error-codes.js';
import { ZodError } from 'zod';

export interface McpResponse {
  isError?: boolean;
  content: Array<{ type: 'text'; text: string }>;
}

export function handleToolError(error: unknown): McpResponse {
  // Already an McpToolError - use directly
  if (error instanceof McpToolError) {
    return error.toResponse();
  }

  // ZodError - convert to schema violation
  if (error instanceof ZodError) {
    return schemaViolationError(error.errors).toResponse();
  }

  // Standard Error - detect type from message patterns
  if (error instanceof Error) {
    const mcpError = detectErrorType(error);
    return mcpError.toResponse();
  }

  // Unknown error type
  return new McpToolError(
    ErrorCode.INTERNAL_ERROR,
    'An unexpected error occurred',
    { originalError: String(error) }
  ).toResponse();
}

function detectErrorType(error: Error): McpToolError {
  const message = error.message.toLowerCase();

  if (message.includes('required') || message.includes('missing')) {
    return new McpToolError(ErrorCode.MISSING_REQUIRED_FIELD, error.message);
  }
  if (message.includes('invalid') || message.includes('validation')) {
    return new McpToolError(ErrorCode.VALIDATION_FAILED, error.message);
  }
  if (message.includes('session') && message.includes('not found')) {
    return new McpToolError(ErrorCode.SESSION_NOT_FOUND, error.message);
  }
  if (message.includes('enoent') || message.includes('file not found')) {
    return new McpToolError(ErrorCode.FILE_NOT_FOUND, error.message);
  }

  return new McpToolError(ErrorCode.INTERNAL_ERROR, error.message, {}, error);
}
```

## Acceptance Criteria

- [ ] File created: `src/tools/shared/error-handler.ts`
- [ ] `handleToolError()` handles McpToolError, ZodError, Error, unknown
- [ ] Pattern matching detects common error types
- [ ] Consistent MCP response format returned
- [ ] Unit tests for all error paths

## Files to Create

- `src/tools/shared/error-handler.ts`
- `tests/vitest/shared/error-handler.spec.ts`

## Files to Modify

- `src/tools/shared/index.ts` — add exports

## Verification

```bash
npm run build && npm run test:vitest -- error-handler
```

## References

- [SPEC-003: Error Handling Refactor](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-003-error-handling-refactor.md)
- [TASKS Phase 2](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/tasks/TASKS-phase-2-domain-extraction.md) P2-004
