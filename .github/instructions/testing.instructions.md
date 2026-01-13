---
applyTo: "tests/**/*"
---

# Testing Instructions

These instructions apply to all test files in the `tests/` directory.

## Testing Framework

- **Primary**: Vitest (`tests/vitest/`)
- **Legacy**: Unit tests (`tests/unit/`)
- **Integration**: Server tests (`tests/test-server.js`)

## Directory Structure

Mirror `src/` structure in `tests/vitest/`:

```
src/tools/prompt/hierarchical-prompt-builder.ts
 → tests/vitest/tools/prompt/hierarchical-prompt-builder.spec.ts

src/domain/analysis/scorer.ts
 → tests/vitest/domain/analysis/scorer.spec.ts
```

## Coverage Requirements

| Layer | Target | Rationale |
|-------|--------|-----------|
| Domain (`src/domain/`) | 100% | Pure functions, critical logic |
| Tools (`src/tools/`) | 90% | MCP handlers, integration |
| Shared (`src/tools/shared/`) | 85% | Utilities, helpers |

## Test Patterns

### Arrange-Act-Assert (AAA)

```typescript
import { describe, it, expect } from 'vitest';

describe('calculateScore', () => {
  it('should return weighted score', () => {
    // Arrange
    const metrics = { hygiene: 25, coverage: 90 };

    // Act
    const result = calculateScore(metrics);

    // Assert
    expect(result).toBe(85);
  });
});
```

### Spy Pattern for Side Effects

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('logError', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call logger with error details', () => {
    const spy = vi.spyOn(logger, 'error');

    processWithError();

    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('failed')
    );
  });
});
```

### Error Testing with McpToolError

```typescript
import { ErrorCode, McpToolError } from '../../src/domain/errors.js';

describe('validateInput', () => {
  it('should throw VALIDATION_ERROR for invalid input', () => {
    const invalid = { context: '' };

    expect(() => validateInput(invalid)).toThrow(McpToolError);

    try {
      validateInput(invalid);
    } catch (error) {
      expect(error).toBeInstanceOf(McpToolError);
      expect((error as McpToolError).code).toBe(ErrorCode.VALIDATION_ERROR);
    }
  });
});
```

### Async Testing

```typescript
describe('fetchData', () => {
  it('should resolve with data', async () => {
    const result = await fetchData('valid-id');
    expect(result).toHaveProperty('data');
  });

  it('should reject with timeout', async () => {
    await expect(fetchData('slow-id')).rejects.toThrow('timeout');
  });
});
```

## TDD Workflow

### Red-Green-Refactor

1. **RED**: Write failing test first
2. **GREEN**: Write minimal code to pass
3. **REFACTOR**: Improve code quality

```typescript
// 1. RED - Write test first
it('should format output as markdown', () => {
  const result = formatOutput({ title: 'Test' });
  expect(result).toContain('# Test');
});

// 2. GREEN - Implement minimal solution
function formatOutput(data: { title: string }): string {
  return `# ${data.title}`;
}

// 3. REFACTOR - Improve implementation
function formatOutput(data: OutputData): string {
  return outputStrategy.markdown(data);
}
```

## Test Isolation

### Mock External Dependencies

```typescript
import { vi } from 'vitest';

vi.mock('../../src/tools/shared/logger.js', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));
```

### Clean Up State

```typescript
describe('statefulOperation', () => {
  beforeEach(() => {
    // Reset state before each test
    resetState();
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up after each test
    cleanup();
  });
});
```

## Running Tests

```bash
# All Vitest tests
npm run test:vitest

# With coverage
npm run test:coverage:vitest

# Specific file
npx vitest run tests/vitest/domain/analysis/scorer.spec.ts

# Watch mode
npx vitest watch

# All tests (unit + integration + demo)
npm run test:all
```

## Coverage Commands

```bash
# Generate coverage report
npm run test:coverage:vitest

# Check threshold (90% default)
npm run check:coverage-threshold --threshold=90

# View HTML report
open coverage/lcov-report/index.html
```

## Test Naming Conventions

```typescript
// File: feature.spec.ts
describe('FeatureName', () => {
  describe('methodName', () => {
    describe('when condition', () => {
      it('should expected behavior', () => { });
    });

    describe('error cases', () => {
      it('should throw ErrorCode for invalid input', () => { });
    });
  });
});
```

## Quality Checklist

Before committing test files:

- [ ] Tests follow AAA pattern
- [ ] Edge cases covered
- [ ] Error paths tested with correct ErrorCode
- [ ] Mocks cleaned up in beforeEach/afterEach
- [ ] No hardcoded paths or secrets
- [ ] Tests are isolated (no shared state)
- [ ] Descriptive test names
- [ ] Coverage meets target threshold
