# 🔧 P2-002: Create McpToolError Class [serial]

> **Parent**: [002-parent-phase2-domain-extraction.md](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/issues-draft/002-parent-phase2-domain-extraction.md)
> **Labels**: `phase-2`, `priority-high`, `serial`, `copilot-suitable`, `mcp-serena`
> **Milestone**: M3: Domain Layer
> **Estimate**: 3 hours
> **Depends On**: P2-001
> **Blocks**: P2-003

## Context

Current error classes (`ValidationError`, `ConfigurationError`, `OperationError`) lack:
- Standardized error codes
- MCP-compatible response generation
- Retry logic hints
- Structured context capture

## Task Description

Update `src/tools/shared/errors.ts` with a new `McpToolError` class:

```typescript
import { ErrorCode, ERROR_MESSAGES, isRetryable } from './error-codes.js';

export interface McpToolErrorContext {
  [key: string]: unknown;
}

export class McpToolError extends Error {
  readonly code: ErrorCode;
  readonly context: McpToolErrorContext;
  readonly timestamp: Date;
  readonly cause?: Error;

  constructor(
    code: ErrorCode,
    message?: string,
    context?: McpToolErrorContext,
    cause?: Error
  ) {
    super(message ?? ERROR_MESSAGES[code]);
    this.name = 'McpToolError';
    this.code = code;
    this.context = context ?? {};
    this.timestamp = new Date();
    this.cause = cause;
  }

  isRetryable(): boolean {
    return isRetryable(this.code);
  }

  toResponse(): { isError: true; content: Array<{ type: 'text'; text: string }> } {
    return {
      isError: true,
      content: [{
        type: 'text',
        text: JSON.stringify({
          error: this.name,
          code: this.code,
          message: this.message,
          context: this.context,
          retryable: this.isRetryable(),
          timestamp: this.timestamp.toISOString(),
        }, null, 2),
      }],
    };
  }
}
```

## Acceptance Criteria

- [ ] `McpToolError` class with all specified fields
- [ ] `toResponse()` returns MCP-compatible format
- [ ] `isRetryable()` method based on error code category
- [ ] Backward compatible — existing error classes still work
- [ ] JSDoc documentation for public API
- [ ] Unit tests covering all methods

## Files to Modify

- `src/tools/shared/errors.ts`

## Files to Create

- `tests/vitest/shared/mcp-tool-error.spec.ts`

## Verification

```bash
npm run build && npm run test:vitest -- mcp-tool-error
```

## References

- [SPEC-003: Error Handling Refactor](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-003-error-handling-refactor.md)
- [TASKS Phase 2](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/tasks/TASKS-phase-2-domain-extraction.md) P2-002
