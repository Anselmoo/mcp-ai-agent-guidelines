# ADR-004: Error Code Enum Pattern

## Status

**Proposed** — January 2026

## Context

The MCP AI Agent Guidelines currently handles errors with scattered try/catch blocks and if/else chains:

```typescript
// Current: Scattered error handling
try {
  const result = await someOperation();
  if (!result) {
    throw new Error('Operation failed');
  }
  if (result.status === 'invalid') {
    throw new Error('Invalid result');
  }
  // More conditions...
} catch (error) {
  if (error instanceof ValidationError) {
    return { error: 'Validation failed' };
  } else if (error instanceof NetworkError) {
    return { error: 'Network issue' };
  } else {
    return { error: 'Unknown error' };
  }
}
```

### Problems

| Issue                  | Impact                                    |
| ---------------------- | ----------------------------------------- |
| Scattered try/catch    | Hard to test, inconsistent handling       |
| String error messages  | Not type-safe, hard to match              |
| Multiple error paths   | High cyclomatic complexity                |
| Inconsistent responses | Different tools format errors differently |
| Coverage hell          | Many branches to cover in tests           |

### Research: aashari/boilerplate-mcp-server Pattern

The boilerplate MCP server uses an ErrorCode enum pattern:

```typescript
// Centralized error codes
enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  OPERATION_FAILED = 'OPERATION_FAILED',
  // ...
}

// Single error handler
function handleToolError(error: unknown): MCPError {
  const errorType = detectErrorType(error);
  return formatErrorResponse(errorType);
}
```

## Decision

We will adopt the **Error Code Enum Pattern** with centralized error handling:

### Error Code Enum

```typescript
// src/shared/error-codes.ts
export enum ErrorCode {
  // Validation Errors (1xxx)
  VALIDATION_ERROR = 1000,
  INVALID_INPUT = 1001,
  MISSING_REQUIRED = 1002,
  INVALID_FORMAT = 1003,
  SCHEMA_VIOLATION = 1004,

  // Domain Errors (2xxx)
  PROMPT_BUILD_FAILED = 2000,
  ANALYSIS_FAILED = 2001,
  DESIGN_SESSION_ERROR = 2002,
  STRATEGY_EXECUTION_FAILED = 2003,

  // Session Errors (3xxx)
  SESSION_NOT_FOUND = 3000,
  SESSION_EXPIRED = 3001,
  SESSION_INVALID_STATE = 3002,

  // External Errors (4xxx)
  FILE_SYSTEM_ERROR = 4000,
  NETWORK_ERROR = 4001,
  EXTERNAL_SERVICE_ERROR = 4002,

  // Configuration Errors (5xxx)
  CONFIG_ERROR = 5000,
  MISSING_CONFIG = 5001,
  INVALID_CONFIG = 5002,

  // Internal Errors (9xxx)
  INTERNAL_ERROR = 9000,
  NOT_IMPLEMENTED = 9001,
  UNEXPECTED_ERROR = 9999,
}
```

### Typed Error Class

```typescript
// src/shared/errors.ts
export class McpToolError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly context?: Record<string, unknown>,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'McpToolError';
  }

  toResponse(): ErrorResponse {
    return {
      error: {
        code: this.code,
        message: this.message,
        context: this.context,
      }
    };
  }
}
```

### Error Factory Functions

```typescript
// src/shared/error-factory.ts
export function validationError(
  message: string,
  context?: Record<string, unknown>
): McpToolError {
  return new McpToolError(ErrorCode.VALIDATION_ERROR, message, context);
}

export function sessionNotFoundError(sessionId: string): McpToolError {
  return new McpToolError(
    ErrorCode.SESSION_NOT_FOUND,
    `Session not found: ${sessionId}`,
    { sessionId }
  );
}

export function fileSystemError(
  path: string,
  operation: string,
  cause?: Error
): McpToolError {
  return new McpToolError(
    ErrorCode.FILE_SYSTEM_ERROR,
    `File system error during ${operation}: ${path}`,
    { path, operation },
    cause
  );
}
```

### Centralized Error Handler

```typescript
// src/shared/error-handler.ts
export function handleToolError(error: unknown): ErrorResponse {
  // Already typed error
  if (error instanceof McpToolError) {
    return error.toResponse();
  }

  // Zod validation error
  if (error instanceof z.ZodError) {
    return new McpToolError(
      ErrorCode.SCHEMA_VIOLATION,
      'Schema validation failed',
      { issues: error.issues }
    ).toResponse();
  }

  // Standard Error
  if (error instanceof Error) {
    return new McpToolError(
      ErrorCode.UNEXPECTED_ERROR,
      error.message,
      { stack: error.stack }
    ).toResponse();
  }

  // Unknown error type
  return new McpToolError(
    ErrorCode.UNEXPECTED_ERROR,
    'An unexpected error occurred',
    { raw: String(error) }
  ).toResponse();
}
```

### Error Code to HTTP Status Mapping

```typescript
// For REST API contexts (future)
export function errorCodeToHttpStatus(code: ErrorCode): number {
  if (code >= 1000 && code < 2000) return 400; // Validation → Bad Request
  if (code >= 2000 && code < 3000) return 422; // Domain → Unprocessable
  if (code >= 3000 && code < 4000) return 404; // Session → Not Found
  if (code >= 4000 && code < 5000) return 502; // External → Bad Gateway
  if (code >= 5000 && code < 6000) return 500; // Config → Server Error
  return 500; // Internal → Server Error
}
```

### Usage in Tools

```typescript
// BEFORE: Scattered handling
export async function buildPrompt(input: Input): Promise<Result> {
  try {
    if (!input.context) {
      throw new Error('Context is required');
    }
    const result = await processInput(input);
    if (!result.success) {
      throw new Error('Processing failed');
    }
    return result;
  } catch (error) {
    if (error instanceof ValidationError) {
      return { error: 'Validation failed' };
    }
    throw error;
  }
}

// AFTER: Clean with error codes
import { validationError, handleToolError } from '../shared/errors.js';

export async function buildPrompt(input: Input): Promise<Result> {
  try {
    if (!input.context) {
      throw validationError('Context is required', { field: 'context' });
    }

    const result = await processInput(input);
    if (!result.success) {
      throw new McpToolError(
        ErrorCode.PROMPT_BUILD_FAILED,
        'Failed to build prompt',
        { input }
      );
    }

    return result;
  } catch (error) {
    return handleToolError(error);
  }
}
```

## Consequences

### Positive

1. **Type Safety**: ErrorCode enum is type-checked
2. **Consistency**: All errors formatted the same way
3. **Testability**: Single error handler easy to test
4. **Discoverability**: ErrorCode enum documents all possible errors
5. **Logging**: Error codes enable better log analysis
6. **Reduced Complexity**: Less if/else branching

### Negative

1. **Migration Effort**: Need to convert existing error handling
2. **Learning Curve**: Team needs to learn error code conventions
3. **Overhead**: Factory functions add small overhead

### Neutral

1. **Documentation**: ErrorCode enum is self-documenting
2. **Debugging**: Error codes may need message lookup initially

## Implementation Notes

### Migration Strategy

1. **Phase 1**: Add ErrorCode enum and McpToolError class
2. **Phase 2**: Add handleToolError function
3. **Phase 3**: Migrate tools one at a time (Strangler Fig)
4. **Phase 4**: Remove old error handling code

### Testing Pattern

```typescript
describe('handleToolError', () => {
  it('should handle McpToolError', () => {
    const error = validationError('Test error', { field: 'test' });
    const response = handleToolError(error);

    expect(response.error.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(response.error.message).toBe('Test error');
    expect(response.error.context?.field).toBe('test');
  });

  it('should handle ZodError', () => {
    const schema = z.object({ name: z.string() });
    const result = schema.safeParse({ name: 123 });

    if (!result.success) {
      const response = handleToolError(result.error);
      expect(response.error.code).toBe(ErrorCode.SCHEMA_VIOLATION);
    }
  });

  it('should handle unknown errors', () => {
    const response = handleToolError('string error');
    expect(response.error.code).toBe(ErrorCode.UNEXPECTED_ERROR);
  });
});
```

### Directory Structure

```
src/shared/
├── errors.ts              # McpToolError class
├── error-codes.ts         # ErrorCode enum
├── error-factory.ts       # Factory functions
├── error-handler.ts       # handleToolError
└── index.ts               # Barrel export
```

## Related ADRs

- ADR-003: Strangler Fig Migration (how we migrate error handling)

## References

- [aashari/boilerplate-mcp-server](https://github.com/aashari/boilerplate-mcp-server) — Error handling pattern
- [MCP Error Handling](https://spec.modelcontextprotocol.io/specification/basic/errors/)

---

*ADR-004 Created: January 2026*
*Status: Proposed*
*Specification: SPEC-003-error-handling-refactor.md*
