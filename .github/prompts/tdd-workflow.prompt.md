---
agent: TDD-Workflow
description: Test-Driven Development prompt with Red-Green-Refactor cycle
---

# TDD Workflow Prompt

## Context
You are following Test-Driven Development for the **MCP AI Agent Guidelines** project. Use the Red-Green-Refactor cycle rigorously.

## TDD Cycle

```
   RED        GREEN      REFACTOR
    │          │           │
    ▼          ▼           ▼
  Write     Write       Improve
Failing    Minimal       Code
  Test      Code       Quality
    │          │           │
    └──────────┴───────────┘
         Repeat
```

## Phase 2 Testing Focus

### Domain Layer (`src/domain/`)
**Target: 100% coverage**

```typescript
// Test pure functions exhaustively
describe('buildPrompt', () => {
  describe('valid inputs', () => {
    it('should build prompt with all fields', () => { });
    it('should handle optional fields', () => { });
    it('should use default values', () => { });
  });

  describe('invalid inputs', () => {
    it('should throw VALIDATION_ERROR for missing context', () => { });
    it('should throw VALIDATION_ERROR for empty goal', () => { });
    it('should throw INVALID_FORMAT for malformed input', () => { });
  });

  describe('edge cases', () => {
    it('should handle empty requirements array', () => { });
    it('should handle maximum length input', () => { });
    it('should handle special characters', () => { });
  });
});
```

### Tool Layer (`src/tools/`)
**Target: 90% coverage**

```typescript
// Test integration with domain layer
describe('handleHierarchicalPromptBuilder', () => {
  it('should call domain function with validated input', () => {
    const spy = vi.spyOn(domain, 'buildPrompt');
    // ...
    expect(spy).toHaveBeenCalledWith(expectedInput);
  });

  it('should format output using OutputStrategy', () => {
    // ...
  });

  it('should propagate McpToolError', () => {
    // ...
  });
});
```

## Test Patterns

### 1. Arrange-Act-Assert
```typescript
it('should calculate correct score', () => {
  // Arrange
  const metrics = { hygiene: 25, coverage: 90 };

  // Act
  const score = calculateScore(metrics);

  // Assert
  expect(score).toBe(85);
});
```

### 2. Spy Pattern
```typescript
it('should log error on failure', () => {
  const logSpy = vi.spyOn(logger, 'error');

  // Trigger error
  expect(() => processInvalid()).toThrow();

  // Verify logging
  expect(logSpy).toHaveBeenCalledWith(
    expect.stringContaining('validation failed')
  );
});
```

### 3. Error Testing
```typescript
it('should throw McpToolError with correct code', () => {
  const invalidInput = { context: '' };

  try {
    validateInput(invalidInput);
    fail('Should have thrown');
  } catch (error) {
    expect(error).toBeInstanceOf(McpToolError);
    expect((error as McpToolError).code).toBe(ErrorCode.VALIDATION_ERROR);
    expect((error as McpToolError).context).toEqual({ field: 'context' });
  }
});
```

## Coverage Commands

```bash
# Run tests with coverage
npm run test:coverage:vitest

# Check coverage threshold
npm run check:coverage-threshold --threshold=90

# View coverage report
open coverage/lcov-report/index.html
```

## File Structure

Mirror `src/` in `tests/vitest/`:

```
src/domain/prompt/builder.ts
 → tests/vitest/domain/prompt/builder.spec.ts

src/tools/prompt/hierarchical-prompt-builder.ts
 → tests/vitest/tools/prompt/hierarchical-prompt-builder.spec.ts
```

## Handoff Triggers

- Implementation needed → MCP-Tool-Builder
- Quality review → Code-Reviewer
- Test debugging → Debugging-Assistant
- Security tests → Security-Auditor

## Quality Checklist

- [ ] All tests follow AAA pattern
- [ ] Edge cases covered
- [ ] Error paths tested
- [ ] Coverage ≥ target (90% or 100%)
- [ ] Tests are isolated (no shared state)
- [ ] Mocks cleaned up in beforeEach/afterEach
