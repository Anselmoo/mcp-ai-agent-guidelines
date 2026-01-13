---
applyTo: "src/tools/shared/**/*,src/schemas/**/*"
---

# Shared Utilities Instructions

These instructions apply to shared utilities in `src/tools/shared/` and schemas in `src/schemas/`.

## Shared Utilities Overview

| File | Purpose |
|------|---------|
| `logger.ts` | Structured logging |
| `errors.ts` | Error classes (legacy) |
| `prompt-utils.ts` | Prompt building utilities |
| `prompt-sections.ts` | Prompt section builders |
| `constants.ts` | Shared constants |

## Logger Usage

### Import

```typescript
import { logger } from './shared/logger.js';
```

### Log Levels

```typescript
// Debug - detailed debugging info
logger.debug('Processing input', { inputSize: data.length });

// Info - normal operations
logger.info('Request completed', { duration: 150 });

// Warn - potential issues
logger.warn('Deprecated parameter used', { param: 'oldParam' });

// Error - failures
logger.error('Operation failed', { error: error.message, stack: error.stack });
```

### Best Practices

```typescript
// ✅ Structured logging with context
logger.info('Processing tool request', {
  tool: 'hierarchical-prompt-builder',
  action: 'build',
  inputSize: args.requirements?.length,
});

// ❌ Never use console.log
console.log('Processing...'); // Wrong!

// ❌ Avoid string concatenation
logger.info('Processing ' + toolName); // Wrong!

// ✅ Use structured data
logger.info('Processing', { toolName }); // Correct!
```

## Error Handling

### Domain Errors (Preferred)

Use errors from `src/domain/errors.ts`:

```typescript
import { ErrorCode, McpToolError } from '../domain/errors.js';

throw new McpToolError(
  ErrorCode.VALIDATION_ERROR,
  'Invalid input format',
  { field: 'context', received: typeof input.context }
);
```

### ErrorCode Enum

```typescript
export enum ErrorCode {
  // Validation (4xx)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',

  // Configuration
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  MISSING_CONFIGURATION = 'MISSING_CONFIGURATION',

  // Operation (5xx)
  OPERATION_ERROR = 'OPERATION_ERROR',
  PROCESSING_FAILED = 'PROCESSING_FAILED',
  TIMEOUT = 'TIMEOUT',

  // Domain-specific
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',
  PHASE_INVALID = 'PHASE_INVALID',
  COVERAGE_INSUFFICIENT = 'COVERAGE_INSUFFICIENT',
}
```

### Legacy Errors (Deprecating)

Errors in `src/tools/shared/errors.ts` are being migrated to domain layer:

```typescript
// Legacy - still works but prefer domain errors
import { ValidationError, ConfigurationError } from './shared/errors.js';

// New - preferred approach
import { McpToolError, ErrorCode } from '../domain/errors.js';
```

## Prompt Utilities

### Building Sections

```typescript
import { buildSection, buildList, buildCodeBlock } from './shared/prompt-utils.js';

// Build a section
const section = buildSection('Context', 'Your context description here');

// Build a list
const list = buildList(['Item 1', 'Item 2', 'Item 3']);

// Build a code block
const code = buildCodeBlock('typescript', 'const x = 1;');
```

### Prompt Sections

```typescript
import {
  buildContextSection,
  buildGoalSection,
  buildRequirementsSection,
  buildTechniquesSection,
} from './shared/prompt-sections.js';

const sections = [
  buildContextSection(input.context),
  buildGoalSection(input.goal),
  buildRequirementsSection(input.requirements),
  buildTechniquesSection(input.techniques),
].join('\n\n');
```

## Schema Patterns

### Zod Schema Location

Schemas live in `src/schemas/` for MCP request validation:

```typescript
// src/schemas/hierarchical-prompt-schema.ts
import { z } from 'zod';

export const HierarchicalPromptSchema = z.object({
  context: z.string().min(1, 'Context is required'),
  goal: z.string().min(1, 'Goal is required'),
  requirements: z.array(z.string()).optional().default([]),
  techniques: z.array(z.enum([
    'zero-shot',
    'few-shot',
    'chain-of-thought',
  ])).optional(),
  options: z.object({
    includeReferences: z.boolean().default(true),
    format: z.enum(['markdown', 'json']).default('markdown'),
  }).optional(),
});

export type HierarchicalPromptInput = z.infer<typeof HierarchicalPromptSchema>;
```

### Schema Best Practices

```typescript
// Use descriptive error messages
z.string().min(1, 'Field name is required');

// Use defaults for optional fields
z.boolean().default(false);

// Use enums for fixed values
z.enum(['option1', 'option2', 'option3']);

// Use refinements for complex validation
z.object({
  start: z.number(),
  end: z.number(),
}).refine(d => d.end > d.start, 'End must be greater than start');

// Export inferred types
export type InputType = z.infer<typeof InputSchema>;
```

## Constants

### Defining Constants

```typescript
// src/tools/shared/constants.ts

// Use const assertions for type safety
export const PROMPT_TECHNIQUES = [
  'zero-shot',
  'few-shot',
  'chain-of-thought',
  'self-consistency',
] as const;

export type PromptTechnique = typeof PROMPT_TECHNIQUES[number];

// Use enums for related constants
export enum OutputFormat {
  MARKDOWN = 'markdown',
  JSON = 'json',
  XML = 'xml',
}

// Use readonly objects for configuration
export const DEFAULT_CONFIG = {
  maxTokens: 4096,
  temperature: 0.7,
  format: OutputFormat.MARKDOWN,
} as const;
```

## Quality Checklist

Before modifying shared utilities:

- [ ] Logger used instead of console.log
- [ ] Errors use ErrorCode enum
- [ ] Schemas have descriptive error messages
- [ ] Types exported with schemas
- [ ] Constants use const assertions
- [ ] Backward compatibility maintained
- [ ] Tests updated for changes
- [ ] Documentation updated
