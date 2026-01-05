# SPEC-003: Error Handling Refactor

> Technical specification for implementing centralized ErrorCode enum pattern

## 📋 Document Metadata

| Field         | Value                                         |
| ------------- | --------------------------------------------- |
| Specification | SPEC-003                                      |
| Title         | Error Handling Refactor                       |
| Status        | Draft                                         |
| Created       | January 2026                                  |
| Related ADR   | [ADR-004](../adrs/ADR-004-error-code-enum.md) |
| Phase         | Phase 2 (Cross-cutting)                       |

---

## 1. Executive Summary

This specification defines the implementation of a centralized `ErrorCode` enum pattern to replace scattered if/else error handling chains. This improves testability, reduces cyclomatic complexity, and provides consistent error responses across all 30+ MCP tools.

## 2. Problem Statement

### 2.1 Current State

```typescript
// CURRENT: Scattered error handling
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

### 2.2 Problems

| Issue                  | Impact                                    |
| ---------------------- | ----------------------------------------- |
| Scattered try/catch    | Hard to test, inconsistent handling       |
| String error messages  | Not type-safe, hard to match              |
| Multiple error paths   | High cyclomatic complexity                |
| Inconsistent responses | Different tools format errors differently |
| Coverage hell          | Many branches to cover in tests           |

---

## 3. Goals & Non-Goals

### 3.1 Goals

1. **Single ErrorCode enum** — All error types in one place
2. **Centralized handler** — One `handleToolError()` function
3. **Type-safe errors** — `McpToolError` class with code, message, context
4. **Factory functions** — `validationError()`, `notFoundError()`, etc.
5. **Improved coverage** — Each error code testable independently

### 3.2 Non-Goals

- Changing error response format (backward compatible)
- Adding error recovery logic (out of scope)
- Implementing retry mechanisms (separate concern)

---

## 4. Technical Specification

### 4.1 ErrorCode Enum

```typescript
// src/tools/shared/error-codes.ts

/**
 * Centralized error codes for all MCP tools
 *
 * Numbering Convention:
 * - 1xxx: Validation Errors
 * - 2xxx: Domain Errors
 * - 3xxx: Session Errors
 * - 4xxx: External Errors
 * - 5xxx: Configuration Errors
 * - 9xxx: Internal Errors
 */
export enum ErrorCode {
  // Validation Errors (1xxx)
  VALIDATION_ERROR = 1000,
  INVALID_INPUT = 1001,
  MISSING_REQUIRED = 1002,
  INVALID_FORMAT = 1003,
  SCHEMA_VIOLATION = 1004,
  CONSTRAINT_VIOLATION = 1005,

  // Domain Errors (2xxx)
  PROMPT_BUILD_FAILED = 2000,
  ANALYSIS_FAILED = 2001,
  DESIGN_SESSION_ERROR = 2002,
  STRATEGY_EXECUTION_FAILED = 2003,
  COVERAGE_THRESHOLD_NOT_MET = 2004,
  ARTIFACT_GENERATION_FAILED = 2005,

  // Session Errors (3xxx)
  SESSION_NOT_FOUND = 3000,
  SESSION_EXPIRED = 3001,
  SESSION_INVALID_STATE = 3002,
  SESSION_ALREADY_EXISTS = 3003,
  PHASE_TRANSITION_INVALID = 3004,

  // External Errors (4xxx)
  FILE_SYSTEM_ERROR = 4000,
  NETWORK_ERROR = 4001,
  EXTERNAL_SERVICE_ERROR = 4002,
  TIMEOUT_ERROR = 4003,
  RATE_LIMIT_ERROR = 4004,

  // Configuration Errors (5xxx)
  CONFIG_ERROR = 5000,
  MISSING_CONFIG = 5001,
  INVALID_CONFIG = 5002,
  CONSTRAINT_LOAD_ERROR = 5003,

  // Internal Errors (9xxx)
  INTERNAL_ERROR = 9000,
  NOT_IMPLEMENTED = 9001,
  ASSERTION_FAILED = 9002,
  UNEXPECTED_ERROR = 9999,
}

/**
 * Human-readable error messages by code
 */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.VALIDATION_ERROR]: 'Input validation failed',
  [ErrorCode.INVALID_INPUT]: 'Invalid input provided',
  [ErrorCode.MISSING_REQUIRED]: 'Required field is missing',
  [ErrorCode.INVALID_FORMAT]: 'Input format is invalid',
  [ErrorCode.SCHEMA_VIOLATION]: 'Input does not match expected schema',
  [ErrorCode.CONSTRAINT_VIOLATION]: 'Constraint violation detected',

  [ErrorCode.PROMPT_BUILD_FAILED]: 'Failed to build prompt',
  [ErrorCode.ANALYSIS_FAILED]: 'Analysis operation failed',
  [ErrorCode.DESIGN_SESSION_ERROR]: 'Design session error',
  [ErrorCode.STRATEGY_EXECUTION_FAILED]: 'Strategy execution failed',
  [ErrorCode.COVERAGE_THRESHOLD_NOT_MET]: 'Coverage threshold not met',
  [ErrorCode.ARTIFACT_GENERATION_FAILED]: 'Artifact generation failed',

  [ErrorCode.SESSION_NOT_FOUND]: 'Session not found',
  [ErrorCode.SESSION_EXPIRED]: 'Session has expired',
  [ErrorCode.SESSION_INVALID_STATE]: 'Session is in invalid state',
  [ErrorCode.SESSION_ALREADY_EXISTS]: 'Session already exists',
  [ErrorCode.PHASE_TRANSITION_INVALID]: 'Invalid phase transition',

  [ErrorCode.FILE_SYSTEM_ERROR]: 'File system operation failed',
  [ErrorCode.NETWORK_ERROR]: 'Network operation failed',
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 'External service error',
  [ErrorCode.TIMEOUT_ERROR]: 'Operation timed out',
  [ErrorCode.RATE_LIMIT_ERROR]: 'Rate limit exceeded',

  [ErrorCode.CONFIG_ERROR]: 'Configuration error',
  [ErrorCode.MISSING_CONFIG]: 'Required configuration is missing',
  [ErrorCode.INVALID_CONFIG]: 'Configuration is invalid',
  [ErrorCode.CONSTRAINT_LOAD_ERROR]: 'Failed to load constraints',

  [ErrorCode.INTERNAL_ERROR]: 'Internal server error',
  [ErrorCode.NOT_IMPLEMENTED]: 'Feature not implemented',
  [ErrorCode.ASSERTION_FAILED]: 'Assertion failed',
  [ErrorCode.UNEXPECTED_ERROR]: 'An unexpected error occurred',
};
```

### 4.2 McpToolError Class

```typescript
// src/tools/shared/errors.ts

import { ErrorCode, ERROR_MESSAGES } from './error-codes.js';

/**
 * Typed error class for all MCP tool errors
 */
export class McpToolError extends Error {
  public readonly code: ErrorCode;
  public readonly context?: Record<string, unknown>;
  public readonly cause?: Error;
  public readonly timestamp: Date;

  constructor(
    code: ErrorCode,
    message?: string,
    context?: Record<string, unknown>,
    cause?: Error
  ) {
    super(message || ERROR_MESSAGES[code]);
    this.name = 'McpToolError';
    this.code = code;
    this.context = context;
    this.cause = cause;
    this.timestamp = new Date();

    // Maintain proper stack trace in V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, McpToolError);
    }
  }

  /**
   * Convert to MCP-compatible error response
   */
  toResponse(): McpErrorResponse {
    return {
      isError: true,
      content: [{
        type: 'text',
        text: JSON.stringify({
          code: this.code,
          message: this.message,
          context: this.context,
          timestamp: this.timestamp.toISOString(),
        }, null, 2),
      }],
    };
  }

  /**
   * Check if error is retryable
   */
  isRetryable(): boolean {
    return [
      ErrorCode.NETWORK_ERROR,
      ErrorCode.TIMEOUT_ERROR,
      ErrorCode.RATE_LIMIT_ERROR,
      ErrorCode.EXTERNAL_SERVICE_ERROR,
    ].includes(this.code);
  }
}

export interface McpErrorResponse {
  isError: true;
  content: Array<{ type: 'text'; text: string }>;
}
```

### 4.3 Error Factory Functions

```typescript
// src/tools/shared/error-factory.ts

import { ErrorCode } from './error-codes.js';
import { McpToolError } from './errors.js';

/**
 * Create validation error
 */
export function validationError(
  message: string,
  context?: Record<string, unknown>
): McpToolError {
  return new McpToolError(ErrorCode.VALIDATION_ERROR, message, context);
}

/**
 * Create missing required field error
 */
export function missingRequiredError(
  fieldName: string
): McpToolError {
  return new McpToolError(
    ErrorCode.MISSING_REQUIRED,
    `Required field '${fieldName}' is missing`,
    { field: fieldName }
  );
}

/**
 * Create session not found error
 */
export function sessionNotFoundError(
  sessionId: string
): McpToolError {
  return new McpToolError(
    ErrorCode.SESSION_NOT_FOUND,
    `Session not found: ${sessionId}`,
    { sessionId }
  );
}

/**
 * Create file system error
 */
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

/**
 * Create schema violation error from Zod
 */
export function schemaViolationError(
  zodError: z.ZodError
): McpToolError {
  return new McpToolError(
    ErrorCode.SCHEMA_VIOLATION,
    'Schema validation failed',
    {
      issues: zodError.issues.map(i => ({
        path: i.path.join('.'),
        message: i.message,
      }))
    }
  );
}

/**
 * Create phase transition error
 */
export function phaseTransitionError(
  fromPhase: string,
  toPhase: string,
  reason: string
): McpToolError {
  return new McpToolError(
    ErrorCode.PHASE_TRANSITION_INVALID,
    `Cannot transition from '${fromPhase}' to '${toPhase}': ${reason}`,
    { fromPhase, toPhase, reason }
  );
}
```

### 4.4 Centralized Error Handler

```typescript
// src/tools/shared/error-handler.ts

import { z } from 'zod';
import { ErrorCode } from './error-codes.js';
import { McpToolError, McpErrorResponse } from './errors.js';
import { schemaViolationError } from './error-factory.js';

/**
 * Error detection patterns
 */
const ERROR_PATTERNS: Array<{
  pattern: RegExp;
  code: ErrorCode;
}> = [
  { pattern: /network|fetch failed|ECONNREFUSED/i, code: ErrorCode.NETWORK_ERROR },
  { pattern: /timeout|ETIMEDOUT/i, code: ErrorCode.TIMEOUT_ERROR },
  { pattern: /rate limit|429/i, code: ErrorCode.RATE_LIMIT_ERROR },
  { pattern: /not found|ENOENT/i, code: ErrorCode.FILE_SYSTEM_ERROR },
  { pattern: /permission denied|EACCES/i, code: ErrorCode.FILE_SYSTEM_ERROR },
];

/**
 * Detect error type from error message
 */
function detectErrorType(error: Error): ErrorCode {
  const message = error.message.toLowerCase();

  for (const { pattern, code } of ERROR_PATTERNS) {
    if (pattern.test(message)) {
      return code;
    }
  }

  return ErrorCode.UNEXPECTED_ERROR;
}

/**
 * Central error handler for all MCP tools
 *
 * @param error - Any error thrown by tool
 * @param toolName - Name of the tool for context
 * @returns MCP-compatible error response
 */
export function handleToolError(
  error: unknown,
  toolName: string
): McpErrorResponse {
  // Already typed error
  if (error instanceof McpToolError) {
    return error.toResponse();
  }

  // Zod validation error
  if (error instanceof z.ZodError) {
    return schemaViolationError(error).toResponse();
  }

  // Standard Error - detect type
  if (error instanceof Error) {
    const code = detectErrorType(error);
    return new McpToolError(
      code,
      error.message,
      {
        toolName,
        stack: error.stack,
        originalError: error.name,
      }
    ).toResponse();
  }

  // Unknown error type
  return new McpToolError(
    ErrorCode.UNEXPECTED_ERROR,
    'An unexpected error occurred',
    {
      toolName,
      raw: String(error),
    }
  ).toResponse();
}
```

### 4.5 Tool Integration Pattern

```typescript
// Example: Updated tool with new error handling

import { handleToolError } from '../shared/error-handler.js';
import { validationError, sessionNotFoundError } from '../shared/error-factory.js';

export async function handleDesignAssistant(
  args: DesignAssistantInput
): Promise<McpResponse> {
  try {
    // Validate input
    if (!args.sessionId && args.action !== 'start-session') {
      throw sessionNotFoundError('undefined');
    }

    // Execute domain logic
    const result = await executeDesignAction(args);

    return {
      content: [{ type: 'text', text: JSON.stringify(result) }],
    };

  } catch (error) {
    return handleToolError(error, 'design-assistant');
  }
}
```

---

## 5. Migration Strategy

### 5.1 Phase 1: Create Infrastructure (Week 5)

1. Create `src/tools/shared/error-codes.ts`
2. Update `src/tools/shared/errors.ts` with `McpToolError`
3. Create `src/tools/shared/error-factory.ts`
4. Create `src/tools/shared/error-handler.ts`

### 5.2 Phase 2: Migrate High-Impact Tools (Week 6)

Priority order by usage frequency:
1. `design-assistant` — Most complex, highest value
2. `hierarchical-prompt-builder` — Most used prompt tool
3. `clean-code-scorer` — Most used analysis tool

### 5.3 Phase 3: Migrate Remaining Tools (Week 7)

- All prompt builders
- All analysis tools
- All strategy tools

### 5.4 Phase 4: Remove Legacy Error Handling (Week 8)

- Remove old `ValidationError`, `ConfigurationError`, etc.
- Update all imports
- Verify no legacy error patterns remain

---

## 6. Testing Strategy

### 6.1 Error Code Unit Tests

```typescript
// tests/vitest/shared/error-codes.spec.ts
describe('ErrorCode', () => {
  it('all codes have messages', () => {
    for (const code of Object.values(ErrorCode)) {
      if (typeof code === 'number') {
        expect(ERROR_MESSAGES[code]).toBeDefined();
      }
    }
  });

  it('codes follow numbering convention', () => {
    expect(ErrorCode.VALIDATION_ERROR).toBe(1000);
    expect(ErrorCode.PROMPT_BUILD_FAILED).toBe(2000);
    expect(ErrorCode.SESSION_NOT_FOUND).toBe(3000);
    expect(ErrorCode.FILE_SYSTEM_ERROR).toBe(4000);
    expect(ErrorCode.CONFIG_ERROR).toBe(5000);
    expect(ErrorCode.INTERNAL_ERROR).toBe(9000);
  });
});
```

### 6.2 Error Handler Tests

```typescript
// tests/vitest/shared/error-handler.spec.ts
describe('handleToolError', () => {
  it('handles McpToolError directly', () => {
    const error = new McpToolError(ErrorCode.VALIDATION_ERROR, 'Test');
    const response = handleToolError(error, 'test-tool');

    expect(response.isError).toBe(true);
    expect(JSON.parse(response.content[0].text).code).toBe(ErrorCode.VALIDATION_ERROR);
  });

  it('handles ZodError', () => {
    const schema = z.object({ name: z.string() });
    try {
      schema.parse({});
    } catch (error) {
      const response = handleToolError(error, 'test-tool');
      expect(JSON.parse(response.content[0].text).code).toBe(ErrorCode.SCHEMA_VIOLATION);
    }
  });

  it('detects network errors', () => {
    const error = new Error('fetch failed: ECONNREFUSED');
    const response = handleToolError(error, 'test-tool');

    expect(JSON.parse(response.content[0].text).code).toBe(ErrorCode.NETWORK_ERROR);
  });
});
```

### 6.3 Factory Function Tests

```typescript
// tests/vitest/shared/error-factory.spec.ts
describe('Error Factory Functions', () => {
  it('creates validation error', () => {
    const error = validationError('Invalid input', { field: 'name' });

    expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(error.message).toBe('Invalid input');
    expect(error.context?.field).toBe('name');
  });

  it('creates session not found error', () => {
    const error = sessionNotFoundError('sess-123');

    expect(error.code).toBe(ErrorCode.SESSION_NOT_FOUND);
    expect(error.context?.sessionId).toBe('sess-123');
  });
});
```

---

## 7. Success Criteria

| Criterion            | Target | Measurement                       |
| -------------------- | ------ | --------------------------------- |
| Single error handler | 100%   | All tools use `handleToolError()` |
| Error code coverage  | 100%   | All codes have tests              |
| Branch reduction     | -50%   | Fewer error handling branches     |
| Consistent responses | 100%   | All errors follow same format     |
| Type safety          | 100%   | No `any` in error handling        |

---

## 8. References

- [ADR-004: Error Code Enum Pattern](../adrs/ADR-004-error-code-enum.md)
- [Memory: v013_architecture_analysis](serena://memories/v013_architecture_analysis)
- [aashari/boilerplate-mcp-server](https://github.com/aashari/boilerplate-mcp-server) — Error pattern reference

---

*Specification Created: January 2026*
*Status: Draft — Awaiting Review*
