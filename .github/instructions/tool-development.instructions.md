---
applyTo: "src/tools/**/*"
---

# Tool Development Instructions

These instructions apply to all MCP tool implementations in `src/tools/`.

## Tool Architecture

### Layer Separation

```
┌─────────────────────────────────────────┐
│ MCP Protocol Layer (src/index.ts)       │
│ - Request routing, schema validation    │
├─────────────────────────────────────────┤
│ Tool Layer (src/tools/)                 │
│ - Thin handlers, orchestration          │
│ - Zod validation, OutputStrategy        │
├─────────────────────────────────────────┤
│ Domain Layer (src/domain/)              │
│ - Pure business logic                   │
│ - No framework dependencies             │
└─────────────────────────────────────────┘
```

## Tool Categories

| Category | Path | Purpose |
|----------|------|---------|
| Prompt Builders | `src/tools/prompt/` | Generate structured prompts |
| Analysis Tools | `src/tools/analysis/` | Code quality, patterns |
| Design Workflow | `src/tools/design/` | Multi-phase design sessions |
| Shared Utilities | `src/tools/shared/` | Logging, errors, helpers |
| Configuration | `src/tools/config/` | Model/guidelines config |
| Bridge Services | `src/tools/bridge/` | External integrations |

## Creating a New Tool

### 1. Define Schema (Zod)

```typescript
// src/tools/my-feature/schema.ts
import { z } from 'zod';

export const MyFeatureInputSchema = z.object({
  action: z.enum(['create', 'update', 'delete']),
  data: z.object({
    name: z.string().min(1, 'Name is required'),
    value: z.number().positive('Value must be positive'),
  }),
  options: z.object({
    verbose: z.boolean().default(false),
    format: z.enum(['markdown', 'json']).default('markdown'),
  }).optional(),
});

export type MyFeatureInput = z.infer<typeof MyFeatureInputSchema>;
```

### 2. Implement Handler

```typescript
// src/tools/my-feature/handler.ts
import { MyFeatureInputSchema, type MyFeatureInput } from './schema.js';
import { processMyFeature } from '../../domain/my-feature/index.js';
import { McpToolError, ErrorCode } from '../../domain/errors.js';
import { logger } from '../shared/logger.js';

export async function handleMyFeature(args: unknown): Promise<string> {
  // Validate input
  const parseResult = MyFeatureInputSchema.safeParse(args);
  if (!parseResult.success) {
    throw new McpToolError(
      ErrorCode.VALIDATION_ERROR,
      'Invalid input',
      { errors: parseResult.error.flatten() }
    );
  }

  const input = parseResult.data;
  logger.info(`Processing ${input.action} action`);

  try {
    // Call domain logic
    const result = processMyFeature(input);

    // Format output
    return formatOutput(result, input.options?.format ?? 'markdown');
  } catch (error) {
    if (error instanceof McpToolError) {
      throw error;
    }
    throw new McpToolError(
      ErrorCode.OPERATION_ERROR,
      'Failed to process feature',
      { originalError: String(error) }
    );
  }
}
```

### 3. Register Tool

```typescript
// src/index.ts
import { handleMyFeature } from './tools/my-feature/handler.js';

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'my-feature':
      return { content: [{ type: 'text', text: await handleMyFeature(args) }] };
    // ... other tools
  }
});
```

### 4. Export from Barrel

```typescript
// src/tools/my-feature/index.ts
export { handleMyFeature } from './handler.js';
export { MyFeatureInputSchema, type MyFeatureInput } from './schema.js';
```

## Input Validation

### Zod Best Practices

```typescript
// Use descriptive error messages
z.string().min(1, 'Context is required');

// Use transforms for normalization
z.string().transform(s => s.trim().toLowerCase());

// Use refinements for complex validation
z.object({
  start: z.number(),
  end: z.number(),
}).refine(data => data.end > data.start, {
  message: 'End must be greater than start',
});

// Use safeParse for error handling
const result = schema.safeParse(input);
if (!result.success) {
  throw new McpToolError(ErrorCode.VALIDATION_ERROR, 'Invalid input', {
    errors: result.error.flatten(),
  });
}
```

## OutputStrategy Pattern

```typescript
// src/tools/shared/output-strategy.ts
export interface OutputStrategy {
  format(data: unknown): string;
}

export class MarkdownStrategy implements OutputStrategy {
  format(data: OutputData): string {
    return `# ${data.title}\n\n${data.content}`;
  }
}

export class JsonStrategy implements OutputStrategy {
  format(data: unknown): string {
    return JSON.stringify(data, null, 2);
  }
}

// Usage in handler
const strategy = format === 'json' ? new JsonStrategy() : new MarkdownStrategy();
return strategy.format(result);
```

## Logging

```typescript
import { logger } from '../shared/logger.js';

// ✅ Use structured logging
logger.info('Processing request', { action, userId });
logger.error('Operation failed', { error: error.message, context });

// ❌ Never use console.log
console.log('Processing...'); // Wrong!
```

## Error Handling

```typescript
import { McpToolError, ErrorCode } from '../../domain/errors.js';

// Validation errors
throw new McpToolError(
  ErrorCode.VALIDATION_ERROR,
  'Missing required field: context',
  { field: 'context' }
);

// Configuration errors
throw new McpToolError(
  ErrorCode.CONFIGURATION_ERROR,
  'Invalid configuration file',
  { file: configPath }
);

// Operation errors
throw new McpToolError(
  ErrorCode.OPERATION_ERROR,
  'Failed to process request',
  { originalError: String(error) }
);
```

## Testing Tools

```typescript
// tests/vitest/tools/my-feature/handler.spec.ts
import { describe, it, expect, vi } from 'vitest';
import { handleMyFeature } from '../../../../src/tools/my-feature/handler.js';
import { ErrorCode, McpToolError } from '../../../../src/domain/errors.js';

describe('handleMyFeature', () => {
  it('should process valid input', async () => {
    const input = { action: 'create', data: { name: 'test', value: 10 } };

    const result = await handleMyFeature(input);

    expect(result).toContain('test');
  });

  it('should throw VALIDATION_ERROR for invalid input', async () => {
    const invalid = { action: 'invalid' };

    await expect(handleMyFeature(invalid)).rejects.toThrow(McpToolError);
  });
});
```

## Quality Checklist

Before committing tool code:

- [ ] Input validated with Zod schema
- [ ] Domain logic extracted to `src/domain/`
- [ ] Uses `logger` from `shared/logger.js`
- [ ] Errors use `McpToolError` with `ErrorCode`
- [ ] Tests cover happy path and error cases
- [ ] Barrel exports updated in `index.ts`
- [ ] Tool registered in `src/index.ts`
- [ ] JSDoc documentation complete
