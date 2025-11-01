# Error Handling

> **Best Practices for Robust Code**

[![MCP AI Agent Guidelines](https://img.shields.io/badge/MCP-AI_Agent_Guidelines-1a7f37?style=flat-square&logo=github)](../README.md)
[![Documentation](https://img.shields.io/badge/📚-Documentation-blue?style=flat-square)](./README.md)
[![Technical Guide](https://img.shields.io/badge/Type-Technical_Guide-purple?style=flat-square)](#)

<details>
<summary><strong>📍 Quick Navigation</strong></summary>

**Related Guides:**

- [Documentation Index](#documentation-index)
- [Code Quality Improvements](#code-quality-improvements)
- [Contributing](#contributing)

</details>

---

# Error Handling Guide

This document describes the centralized error handling patterns and best practices for the MCP AI Agent Guidelines project.

## Overview

The project implements a centralized error handling system using typed errors and an `ErrorReporter` utility to ensure consistent error handling, improved debugging, and better resilience across the codebase.

## Core Components

### 1. Typed Error Classes

All errors in the system extend from `OperationError`, which provides:

- `code`: Error code for categorization
- `context`: Structured context data for debugging
- `timestamp`: When the error occurred
- `stack`: Stack trace (inherited from `Error`)

#### Available Error Types

```typescript
// Base error class
class OperationError extends Error {
  code: string;
  context?: Record<string, unknown>;
  timestamp: Date;
}

// Specific error types
class ValidationError extends OperationError        // Input validation failures
class ConfigurationError extends OperationError     // Invalid/missing configuration
class SessionError extends OperationError          // Session-related issues
class PhaseError extends OperationError           // Design phase workflow issues
class GenerationError extends OperationError      // Artifact generation failures
class ConsistencyError extends OperationError     // Consistency enforcement failures
```

### 2. ErrorReporter Utility

The `ErrorReporter` class provides centralized error handling methods:

#### Methods

**`report(error, context?, options?)`**

- Reports and logs an error
- Optionally rethrows the error
- Returns an `OperationError` instance

```typescript
try {
  // ... operation
} catch (error) {
  ErrorReporter.report(
    error,
    { sessionId, operation: "generate-artifacts" },
    { rethrow: true }
  );
}
```

**`warn(error, context?, defaultMessage?)`**

- Logs non-critical errors as warnings
- Does not rethrow

```typescript
try {
  // ... non-critical operation
} catch (error) {
  ErrorReporter.warn(error, { sessionId, operation: "generate-adr" });
}
```

**`createErrorResponse(error, context?)`**

- Creates a standardized error response object
- Returns `{ success: false, error: { message, code, timestamp, context } }`

```typescript
try {
  // ... operation
} catch (error) {
  return ErrorReporter.createErrorResponse(error, { sessionId, action });
}
```

**`createFullErrorResponse(error, baseResponse)`**

- Creates a full error response matching API interfaces
- Includes `sessionId`, `status`, `message`, `recommendations`, `artifacts`

```typescript
try {
  // ... operation
} catch (error) {
  return ErrorReporter.createFullErrorResponse(error, {
    sessionId,
    status: "generation-failed",
    recommendations: ["Check session state and try again"],
    artifacts: [],
  });
}
```

## Best Practices

### 1. Use Typed Errors for Known Failure Cases

Instead of generic `Error`:

```typescript
// ❌ Don't
throw new Error(`Session ${sessionId} not found`);

// ✅ Do
throw new SessionError(`Session ${sessionId} not found`, { sessionId });
```

### 2. Include Context in Errors

Always provide context for debugging:

```typescript
throw new ConfigurationError(
  "Methodology signals are required for select-methodology action",
  { sessionId, action, availableSignals }
);
```

### 3. Use ErrorReporter for Consistent Error Handling

```typescript
try {
  const result = await someOperation();
  return result;
} catch (error) {
  // For API responses
  return ErrorReporter.createFullErrorResponse(error, {
    sessionId,
    status: "operation-failed",
    recommendations: ["Check inputs and try again"],
    artifacts: [],
  });
}
```

### 4. Log Non-Critical Errors as Warnings

For operations that fail but shouldn't stop execution:

```typescript
try {
  await generateOptionalArtifact();
} catch (error) {
  ErrorReporter.warn(error, {
    sessionId,
    operation: "generate-optional-artifact",
  });
}
```

### 5. Preserve Error Stack Traces

The ErrorReporter automatically preserves stack traces:

```typescript
// Stack trace is maintained through error conversion
const opError = ErrorReporter.report(new Error("Something failed"));
console.log(opError.stack); // Original stack trace is preserved
```

## Migration Guide

### Converting Existing Error Handling

#### Before:

```typescript
try {
  await operation();
} catch (error) {
  return {
    success: false,
    message: `Operation failed: ${
      error instanceof Error ? error.message : "Unknown error"
    }`,
    // ...
  };
}
```

#### After:

```typescript
try {
  await operation();
} catch (error) {
  return ErrorReporter.createFullErrorResponse(error, {
    sessionId,
    status: "operation-failed",
    recommendations: ["Check inputs"],
    artifacts: [],
  });
}
```

#### Before (throwing errors):

```typescript
if (!config) {
  throw new Error("Configuration is required");
}
```

#### After:

```typescript
if (!config) {
  throw new ConfigurationError("Configuration is required", {
    action,
    sessionId,
  });
}
```

## Error Response Structure

### Standard Error Response

```typescript
{
  success: false,
  error: {
    message: "Session not found",
    code: "SESSION_ERROR",
    timestamp: "2025-10-11T07:00:00.000Z",
    context: {
      sessionId: "session-123",
      operation: "advance-phase"
    }
  }
}
```

### Full Error Response (for API compatibility)

```typescript
{
  success: false,
  sessionId: "session-123",
  status: "operation-failed",
  message: "Session not found",
  recommendations: [
    "Check session ID",
    "Ensure session was created"
  ],
  artifacts: []
}
```

## Testing Error Handling

### Example Test Pattern

```typescript
import { describe, expect, it } from "vitest";
import { SessionError, ErrorReporter } from "../src/tools/shared/errors";

describe("Error Handling", () => {
  it("should create typed error with context", () => {
    const error = new SessionError("Session not found", {
      sessionId: "test-123",
    });

    expect(error).toBeInstanceOf(SessionError);
    expect(error.code).toBe("SESSION_ERROR");
    expect(error.context).toEqual({ sessionId: "test-123" });
  });

  it("should create error response", () => {
    const response = ErrorReporter.createErrorResponse(
      new Error("Test error"),
      { operation: "test" }
    );

    expect(response.success).toBe(false);
    expect(response.error.message).toBe("Test error");
    expect(response.error.context).toMatchObject({ operation: "test" });
  });
});
```

## Logging Integration

All errors are automatically logged using the structured logger:

```typescript
// ErrorReporter.report() automatically logs:
{
  timestamp: "2025-10-11T07:00:00.000Z",
  level: "error",
  message: "Session not found",
  context: {
    code: "SESSION_ERROR",
    context: { sessionId: "session-123" },
    stack: "SessionError: Session not found\n    at ..."
  }
}
```

## Files Modified

The following files have been updated to use the new error handling:

- `src/tools/design/design-assistant.ts` - All catch blocks updated
- `src/tools/design/design-phase-workflow.ts` - All error throws updated
- `src/tools/design/confirmation-prompt-builder.ts` - Error handling updated

## Future Enhancements

- [ ] Add error recovery strategies
- [ ] Implement retry logic with exponential backoff
- [ ] Add error rate monitoring
- [ ] Create error dashboards for production
- [ ] Add more specific error types as needed

<!-- AUTO-GENERATED FOOTER - DO NOT EDIT -->

---

<div align="center">

<!-- Navigation Grid -->
<table>
  <tr>
    <td align="center" width="33%">
      <strong>🛠️ Code Quality</strong><br/>
      <a href="./CLEAN_CODE_INITIATIVE.md">Clean Code 100/100</a><br/>
      <a href="./code-quality-improvements.md">Quality Improvements</a><br/>
      <a href="./ERROR_HANDLING.md">Error Patterns</a>
    </td>
    <td align="center" width="33%">
      <strong>🏗️ Architecture</strong><br/>
      <a href="./BRIDGE_CONNECTORS.md">Bridge Connectors</a><br/>
      <a href="./TECHNICAL_IMPROVEMENTS.md">Refactoring</a><br/>
      <a href="./design-module-status.md">Module Status</a>
    </td>
    <td align="center" width="33%">
      <strong>📚 Resources</strong><br/>
      <a href="../CONTRIBUTING.md">Contributing Guide</a><br/>
      <a href="./REFERENCES.md">References</a><br/>
      <a href="../.github/copilot-instructions.md">Copilot Guide</a>
    </td>
  </tr>
</table>

<details>
<summary><strong>📚 Related Documentation</strong></summary>

<br>

**Developer Resources:**

- [Clean Code Initiative](./CLEAN_CODE_INITIATIVE.md) - Quality standards
- [Bridge Connectors](./BRIDGE_CONNECTORS.md) - Architecture patterns
- [Contributing Guidelines](../CONTRIBUTING.md) - How to contribute

**Error Tools:**

- [Guidelines Validator](./tools/guidelines-validator.md) - Practice validation
- [Debugging Assistant](./tools/debugging-assistant-prompt-builder.md) - Systematic debugging

</details>

<div align="center">

<p>
  <a href="#top">⬆️ Back to Top</a>
</p>

<sub>
<sub>**MCP AI Agent Guidelines** • Licensed under [MIT](../LICENSE) • [Disclaimer](../DISCLAIMER.md) • [Contributing](../CONTRIBUTING.md)</sub>
