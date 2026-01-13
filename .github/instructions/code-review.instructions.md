---
applyTo: "src/**/*"
---
# Code Review Instructions for src/**/*

These instructions apply to all code in the `src/` directory. Follow these guidelines when reviewing or modifying code.

## Architecture Requirements

### Domain Layer (`src/domain/`)
- **Pure Functions Only**: No framework dependencies (MCP SDK, Express, etc.)
- **Type Safety**: Use TypeScript strict mode with explicit types
- **Error Handling**: Use `ErrorCode` enum with `McpToolError` class
- **Testing**: 100% coverage for domain logic
- **No Side Effects**: Functions should be deterministic

### Tool Layer (`src/tools/`)
- **Thin Handlers**: MCP tool handlers should delegate to domain logic
- **Validation**: All inputs validated with Zod schemas
- **OutputStrategy**: Use strategy pattern for response formats
- **Logging**: Use `shared/logger.ts`, never `console.log`

### Gateway Layer (`src/gateway/` - planned)
- **Request Routing**: Handle MCP protocol details
- **Error Mapping**: Convert domain errors to MCP responses
- **Rate Limiting**: Apply rate limiting policies

## Code Quality Metrics

Use the project's `clean-code-scorer` for quality assessment:

| Metric | Weight | Target |
|--------|--------|--------|
| Hygiene | 30% | > 25/30 |
| Test Coverage | 25% | ≥ 90% |
| TypeScript Strict | 20% | 20/20 |
| Documentation | 15% | > 12/15 |
| Security | 10% | 10/10 |

**Minimum Score**: 85/100 for approval

## TypeScript Requirements

### ESM Imports
```typescript
// ✅ Correct - use .js extensions
import { validateInput } from './validation.js';
import { ErrorCode } from '../domain/errors.js';

// ❌ Wrong - missing .js extension
import { validateInput } from './validation';
```

### Strict Mode Compliance
```typescript
// ✅ Correct - explicit types
function processData(input: InputType): OutputType {
  return { result: input.value };
}

// ❌ Wrong - implicit any
function processData(input) {
  return { result: input.value };
}
```

### Error Handling
```typescript
// ✅ Correct - typed errors
import { ErrorCode, McpToolError } from '../domain/errors.js';

function validate(input: unknown): ValidatedInput {
  if (!isValid(input)) {
    throw new McpToolError(
      ErrorCode.VALIDATION_ERROR,
      'Invalid input format',
      { input }
    );
  }
  return input as ValidatedInput;
}

// ❌ Wrong - generic errors
function validate(input: unknown): ValidatedInput {
  if (!isValid(input)) {
    throw new Error('Invalid input');
  }
}
```

## Zod Validation

All tool inputs MUST be validated with Zod:

```typescript
import { z } from 'zod';

export const ToolInputSchema = z.object({
  action: z.enum(['create', 'update', 'delete']),
  data: z.object({
    name: z.string().min(1),
    value: z.number().positive(),
  }),
  options: z.object({
    verbose: z.boolean().default(false),
  }).optional(),
});

export type ToolInput = z.infer<typeof ToolInputSchema>;
```

## Testing Requirements

### Test File Location
Mirror `src/` structure in `tests/vitest/`:
```
src/tools/prompt/hierarchical-prompt-builder.ts
 → tests/vitest/tools/prompt/hierarchical-prompt-builder.spec.ts
```

### Test Patterns
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processFeature } from './feature.js';

describe('processFeature', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return expected output for valid input', () => {
    const input = { /* valid input */ };
    const result = processFeature(input);
    expect(result).toEqual({ /* expected output */ });
  });

  it('should throw McpToolError for invalid input', () => {
    const invalidInput = { /* invalid */ };
    expect(() => processFeature(invalidInput))
      .toThrow(McpToolError);
  });
});
```

### Coverage Requirements
- **Domain Layer**: 100% coverage (pure functions)
- **Tool Layer**: 90% coverage
- **Integration Tests**: Critical paths covered

## Documentation Requirements

### JSDoc for Public APIs
```typescript
/**
 * Processes hierarchical prompts with specified techniques.
 *
 * @param input - The prompt configuration
 * @param input.context - Broad context or domain
 * @param input.goal - Specific objective
 * @param input.requirements - Detailed requirements
 * @returns Structured prompt output
 * @throws {McpToolError} If validation fails
 *
 * @example
 * ```typescript
 * const result = processPrompt({
 *   context: 'E-commerce platform',
 *   goal: 'Implement checkout flow',
 *   requirements: ['Payment processing', 'Cart validation'],
 * });
 * ```
 */
export function processPrompt(input: PromptInput): PromptOutput {
  // Implementation
}
```

## Security Checklist

Before approving code changes:

- [ ] No hardcoded secrets or credentials
- [ ] Input validation on all external data
- [ ] No SQL injection vectors (if applicable)
- [ ] No path traversal vulnerabilities
- [ ] Dependencies checked for CVEs
- [ ] Sensitive data not logged

## Review Workflow

1. **Automated Checks** (must pass):
   - `npm run quality` (type-check + lint)
   - `npm run test:vitest`

2. **Manual Review**:
   - Code follows project patterns
   - Domain logic properly extracted
   - Tests are meaningful (not just coverage)
   - Documentation is accurate

3. **Handoff Decision**:
   - Security concerns → Security-Auditor
   - Performance issues → Performance-Optimizer
   - Architecture questions → Architecture-Advisor
   - Documentation gaps → Documentation-Generator
