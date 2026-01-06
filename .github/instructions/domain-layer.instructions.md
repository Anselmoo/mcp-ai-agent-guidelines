---
applyTo: "src/domain/**/*"
---

# Domain Layer Instructions

These instructions apply to the `src/domain/` directory, containing pure business logic extracted from tools.

## Why Domain Layer?

The domain layer addresses these epic issues:

| Issue | Goal | Domain Layer Impact |
|-------|------|-------------------|
| #696 | Domain Extraction | Core pattern for pure logic |
| #697 | Fix Broken Tools | Isolate bugs from framework |
| #698 | Spec-Kit Integration | Testable business rules |

### Benefits
- **Testability**: Pure functions = 100% testable
- **Reusability**: Logic shared across tools
- **Maintainability**: Changes isolated from MCP framework
- **Clarity**: Business logic visible without framework noise

## Core Principles

### 1. Pure Functions Only
- **No Side Effects**: Functions must be deterministic
- **No Framework Dependencies**: No MCP SDK, Express, or external libraries
- **No I/O Operations**: No file system, network, or database calls
- **Immutable Transforms**: Return new objects, don't mutate inputs

```typescript
// ✅ Correct - Pure function
export function calculateScore(metrics: Metrics): number {
  return metrics.hygiene * 0.3 + metrics.coverage * 0.25;
}

// ❌ Wrong - Side effect (logging)
export function calculateScore(metrics: Metrics): number {
  console.log('Calculating score...'); // Side effect!
  return metrics.hygiene * 0.3 + metrics.coverage * 0.25;
}

// ❌ Wrong - Mutates input
export function calculateScore(metrics: Metrics): number {
  metrics.total = metrics.hygiene * 0.3; // Mutation!
  return metrics.total;
}
```

### 2. Type Safety
- **Explicit Types**: All function signatures must have explicit types
- **No `any`**: Never use `any` type
- **Interface Definitions**: Define interfaces for all data structures
- **Discriminated Unions**: Use for variant types

```typescript
// ✅ Correct - Explicit types and interfaces
export interface PromptInput {
  context: string;
  goal: string;
  requirements: string[];
}

export interface PromptOutput {
  prompt: string;
  metadata: PromptMetadata;
}

export function buildPrompt(input: PromptInput): PromptOutput {
  // Implementation
}

// ❌ Wrong - Implicit any
export function buildPrompt(input) {
  return { prompt: input.context };
}
```

### 3. Error Handling
- **ErrorCode Enum**: Use typed error codes
- **McpToolError Class**: Throw typed errors with context
- **Error Recovery**: Document recovery strategies

```typescript
import { ErrorCode, McpToolError } from './errors.js';

export function validatePromptInput(input: unknown): PromptInput {
  if (!input || typeof input !== 'object') {
    throw new McpToolError(
      ErrorCode.VALIDATION_ERROR,
      'Input must be an object',
      { received: typeof input }
    );
  }

  const obj = input as Record<string, unknown>;

  if (typeof obj.context !== 'string' || obj.context.length === 0) {
    throw new McpToolError(
      ErrorCode.VALIDATION_ERROR,
      'Context is required and must be a non-empty string',
      { field: 'context', received: obj.context }
    );
  }

  // Continue validation...
}
```

## Directory Structure

```
src/domain/
├── errors.ts              # ErrorCode enum, McpToolError class
├── types.ts               # Shared domain types
├── prompt/                # Prompt building domain
│   ├── index.ts           # Public exports
│   ├── types.ts           # Prompt-specific types
│   ├── builder.ts         # Pure prompt building functions
│   └── validation.ts      # Input validation
├── analysis/              # Code analysis domain
│   ├── index.ts
│   ├── types.ts
│   ├── scorer.ts          # Scoring algorithms
│   └── patterns.ts        # Pattern detection
└── design/                # Design workflow domain
    ├── index.ts
    ├── types.ts
    ├── phases.ts          # Phase management
    └── constraints.ts     # Constraint validation
```

## ErrorCode Enum

```typescript
// src/domain/errors.ts

export enum ErrorCode {
  // Validation errors (4xx equivalent)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',

  // Configuration errors
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  MISSING_CONFIGURATION = 'MISSING_CONFIGURATION',
  INVALID_CONFIGURATION = 'INVALID_CONFIGURATION',

  // Operation errors (5xx equivalent)
  OPERATION_ERROR = 'OPERATION_ERROR',
  PROCESSING_FAILED = 'PROCESSING_FAILED',
  TIMEOUT = 'TIMEOUT',

  // Domain-specific errors
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',
  PHASE_INVALID = 'PHASE_INVALID',
  COVERAGE_INSUFFICIENT = 'COVERAGE_INSUFFICIENT',
}

export class McpToolError extends Error {
  public readonly timestamp: Date;

  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'McpToolError';
    this.timestamp = new Date();
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
    };
  }
}
```

## Testing Domain Functions

Domain functions should have 100% test coverage:

```typescript
// tests/vitest/domain/prompt/builder.spec.ts
import { describe, it, expect } from 'vitest';
import { buildPrompt } from '../../../../src/domain/prompt/builder.js';
import { ErrorCode, McpToolError } from '../../../../src/domain/errors.js';

describe('buildPrompt', () => {
  describe('valid inputs', () => {
    it('should build prompt with context and goal', () => {
      const input = {
        context: 'E-commerce platform',
        goal: 'Implement checkout flow',
        requirements: ['Payment processing'],
      };

      const result = buildPrompt(input);

      expect(result.prompt).toContain('E-commerce platform');
      expect(result.prompt).toContain('checkout flow');
      expect(result.metadata.requirementCount).toBe(1);
    });
  });

  describe('invalid inputs', () => {
    it('should throw VALIDATION_ERROR for missing context', () => {
      const input = {
        context: '',
        goal: 'Some goal',
        requirements: [],
      };

      expect(() => buildPrompt(input)).toThrow(McpToolError);

      try {
        buildPrompt(input);
      } catch (error) {
        expect(error).toBeInstanceOf(McpToolError);
        expect((error as McpToolError).code).toBe(ErrorCode.VALIDATION_ERROR);
      }
    });
  });
});
```

## Barrel Exports

Each domain module must have an `index.ts` that exports its public API:

```typescript
// src/domain/prompt/index.ts

// Types
export type { PromptInput, PromptOutput, PromptMetadata } from './types.js';

// Functions
export { buildPrompt, buildHierarchicalPrompt } from './builder.js';
export { validatePromptInput } from './validation.js';

// Constants
export { PROMPT_TECHNIQUES, DEFAULT_TECHNIQUES } from './constants.js';
```

## Integration with Tool Layer

Domain functions are called from tool handlers:

```typescript
// src/tools/prompt/hierarchical-prompt-builder.ts
import { buildHierarchicalPrompt, validatePromptInput } from '../../domain/prompt/index.js';
import { McpToolError, ErrorCode } from '../../domain/errors.js';
import { outputStrategy } from '../../strategies/index.js';

export async function handleHierarchicalPromptBuilder(
  args: unknown
): Promise<string> {
  try {
    // Validate input (domain function)
    const validatedInput = validatePromptInput(args);

    // Process (domain function)
    const result = buildHierarchicalPrompt(validatedInput);

    // Format output (strategy)
    return outputStrategy.format(result);

  } catch (error) {
    if (error instanceof McpToolError) {
      // Re-throw domain errors
      throw error;
    }
    // Wrap unexpected errors
    throw new McpToolError(
      ErrorCode.OPERATION_ERROR,
      'Failed to build prompt',
      { originalError: String(error) }
    );
  }
}
```

## Quality Checklist

Before merging domain layer code:

- [ ] All functions are pure (no side effects)
- [ ] No framework dependencies imported
- [ ] All types explicitly defined
- [ ] ErrorCode enum used for all errors
- [ ] 100% test coverage
- [ ] JSDoc documentation complete
- [ ] Barrel exports updated in index.ts
