# 🔧 P2-001: Create ErrorCode Enum [serial]

> **Parent**: [002-parent-phase2-domain-extraction.md](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/issues-draft/002-parent-phase2-domain-extraction.md)
> **Labels**: `phase-2`, `priority-high`, `serial`, `copilot-suitable`, `mcp-serena`
> **Milestone**: M3: Domain Layer
> **Estimate**: 3 hours
> **Blocks**: P2-002, P2-003, P2-004

## Context

The current error handling uses ad-hoc string messages, making it difficult to:
- Categorize errors programmatically
- Provide consistent error responses
- Enable retry logic based on error type

We need a centralized ErrorCode enum following a numbering convention for different error categories.

## Task Description

Create `src/tools/shared/error-codes.ts` with a comprehensive ErrorCode enum:

```typescript
/**
 * Centralized error codes following numbering convention:
 * - 1xxx: Validation Errors
 * - 2xxx: Domain Errors
 * - 3xxx: Session Errors
 * - 4xxx: External Errors
 * - 5xxx: Configuration Errors
 * - 9xxx: Internal Errors
 */
export enum ErrorCode {
  // 1xxx: Validation Errors
  VALIDATION_FAILED = 1000,
  MISSING_REQUIRED_FIELD = 1001,
  INVALID_FORMAT = 1002,
  SCHEMA_VIOLATION = 1003,
  OUT_OF_RANGE = 1004,

  // 2xxx: Domain Errors
  DOMAIN_ERROR = 2000,
  INVALID_STATE = 2001,
  CONSTRAINT_VIOLATION = 2002,
  BUSINESS_RULE_VIOLATION = 2003,

  // 3xxx: Session Errors
  SESSION_NOT_FOUND = 3000,
  SESSION_EXPIRED = 3001,
  INVALID_PHASE_TRANSITION = 3002,
  COVERAGE_NOT_MET = 3003,

  // 4xxx: External Errors
  FILE_NOT_FOUND = 4000,
  FILE_READ_ERROR = 4001,
  FILE_WRITE_ERROR = 4002,
  NETWORK_ERROR = 4003,

  // 5xxx: Configuration Errors
  CONFIG_NOT_FOUND = 5000,
  CONFIG_INVALID = 5001,
  MISSING_DEPENDENCY = 5002,

  // 9xxx: Internal Errors
  INTERNAL_ERROR = 9000,
  NOT_IMPLEMENTED = 9001,
  UNEXPECTED_STATE = 9002,
}

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.VALIDATION_FAILED]: 'Validation failed',
  [ErrorCode.MISSING_REQUIRED_FIELD]: 'Required field is missing',
  // ... all messages
};

export function isRetryable(code: ErrorCode): boolean {
  return code >= 4000 && code < 5000; // Only external errors are retryable
}
```

## Acceptance Criteria

- [ ] File created: `src/tools/shared/error-codes.ts`
- [ ] All error codes defined with descriptive names
- [ ] Numbering convention strictly followed (1xxx, 2xxx, etc.)
- [ ] `ERROR_MESSAGES` mapping for all codes
- [ ] `isRetryable()` helper function
- [ ] Exported from `src/tools/shared/index.ts` barrel
- [ ] Unit test: `tests/vitest/shared/error-codes.spec.ts`

## Files to Create

- `src/tools/shared/error-codes.ts`
- `tests/vitest/shared/error-codes.spec.ts`

## Files to Modify

- `src/tools/shared/index.ts` — add export

## Verification

```bash
npm run build && npm run test:vitest -- error-codes
```

## References

- [SPEC-003: Error Handling Refactor](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-003-error-handling-refactor.md)
- [ADR-004: Error Code Enum](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/adrs/ADR-004-error-code-enum.md)
- [TASKS Phase 2](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/tasks/TASKS-phase-2-domain-extraction.md) P2-001
