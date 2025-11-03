# Error Handling

> Best practices for error handling, validation, and graceful degradation

## Overview

This MCP server uses typed errors, structured error handling, and comprehensive validation to provide clear, actionable error messages and graceful degradation.

## Error Hierarchy

### Base Error Classes

All errors extend from domain-specific base classes defined in `src/tools/shared/errors.ts`:

```typescript
class BaseError extends Error {
  code: string;
  context?: Record<string, unknown>;
  timestamp: Date;
}
```

### Error Types

#### 1. ValidationError

**When**: Input validation fails

**Example**:
```typescript
throw new ValidationError('Invalid input parameter', {
  code: 'INVALID_INPUT',
  context: { field: 'email', reason: 'Invalid format' }
});
```

#### 2. ConfigurationError

**When**: Configuration is invalid or missing

**Example**:
```typescript
throw new ConfigurationError('Missing required configuration', {
  code: 'MISSING_CONFIG',
  context: { requiredKey: 'API_KEY' }
});
```

#### 3. OperationError

**When**: Operation fails during execution

**Example**:
```typescript
throw new OperationError('Failed to process request', {
  code: 'OPERATION_FAILED',
  context: { operation: 'file-read', path: '/missing/file' }
});
```

## Validation Patterns

### Input Validation with Zod

All tool inputs are validated using Zod schemas:

```typescript
import { z } from 'zod';

const inputSchema = z.object({
  action: z.enum(['start', 'stop', 'status']),
  config: z.object({
    timeout: z.number().min(0).max(3600)
  }).optional()
});

function handleToolCall(input: unknown) {
  try {
    const validated = inputSchema.parse(input);
    // Process validated input
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid input', {
        code: 'VALIDATION_FAILED',
        context: { errors: error.errors }
      });
    }
    throw error;
  }
}
```

### Schema Patterns

```typescript
// Enum validation
z.enum(['option1', 'option2', 'option3'])

// Optional with default
z.string().optional().default('default-value')

// Number with constraints
z.number().min(0).max(100)

// Array validation
z.array(z.string()).min(1).max(10)

// Object with optional fields
z.object({
  required: z.string(),
  optional: z.string().optional()
})

// Union types
z.union([z.string(), z.number()])
```

## Error Handling Patterns

### Pattern 1: Try-Catch with Typed Errors

```typescript
try {
  const result = await operation();
  return result;
} catch (error) {
  if (error instanceof ValidationError) {
    logger.warn({ error, message: 'Validation failed' });
    return { error: 'Invalid input', details: error.context };
  } else if (error instanceof OperationError) {
    logger.error({ error, message: 'Operation failed' });
    return { error: 'Operation failed', canRetry: true };
  } else {
    logger.error({ error, message: 'Unexpected error' });
    throw error; // Re-throw unexpected errors
  }
}
```

### Pattern 2: Graceful Degradation

```typescript
async function analyzeCode(code: string) {
  try {
    // Attempt advanced analysis
    return await advancedAnalyzer.analyze(code);
  } catch (error) {
    logger.warn({ error, message: 'Advanced analyzer failed, using fallback' });

    try {
      // Fallback to basic analysis
      return await basicAnalyzer.analyze(code);
    } catch (fallbackError) {
      logger.error({ error: fallbackError, message: 'All analyzers failed' });

      // Return minimal result
      return {
        status: 'partial',
        message: 'Analysis completed with limited information',
        basicMetrics: extractBasicMetrics(code)
      };
    }
  }
}
```

### Pattern 3: Error Context Enrichment

```typescript
function enrichErrorContext(error: Error, additionalContext: Record<string, unknown>) {
  if (error instanceof BaseError) {
    error.context = {
      ...error.context,
      ...additionalContext
    };
  }
  return error;
}

// Usage
try {
  await processFile(filePath);
} catch (error) {
  throw enrichErrorContext(error as Error, {
    file: filePath,
    operation: 'process',
    timestamp: new Date()
  });
}
```

### Pattern 4: Retry Logic

```typescript
async function withRetry<T>(
  operation: () => Promise<T>,
  options = { maxAttempts: 3, backoff: 1000 }
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      logger.warn({
        attempt,
        maxAttempts: options.maxAttempts,
        error: lastError
      });

      if (attempt < options.maxAttempts) {
        // Exponential backoff
        await sleep(options.backoff * Math.pow(2, attempt - 1));
      }
    }
  }

  throw new OperationError('Operation failed after retries', {
    code: 'MAX_RETRIES_EXCEEDED',
    context: { attempts: options.maxAttempts, lastError }
  });
}
```

## Best Practices

### 1. Use Typed Errors

```typescript
// ✅ Good: Typed error
throw new ValidationError('Invalid input', {
  code: 'INVALID_EMAIL',
  context: { field: 'email', value: invalidEmail }
});

// ❌ Bad: Generic error
throw new Error('Invalid input');
```

### 2. Provide Context

```typescript
// ✅ Good: Rich context
throw new OperationError('File read failed', {
  code: 'FILE_READ_ERROR',
  context: {
    path: filePath,
    permissions: filePermissions,
    exists: fileExists
  }
});

// ❌ Bad: No context
throw new Error('File read failed');
```

### 3. Log Appropriately

```typescript
// ✅ Good: Structured logging
logger.error({
  error,
  operation: 'file-processing',
  file: filePath,
  timestamp: new Date()
});

// ❌ Bad: Console.log
console.log('Error:', error);
```

### 4. Handle Errors Close to Source

```typescript
// ✅ Good: Handle where error occurs
async function readConfig() {
  try {
    return await fs.readFile('config.json', 'utf-8');
  } catch (error) {
    throw new ConfigurationError('Failed to read config', {
      code: 'CONFIG_READ_ERROR',
      context: { path: 'config.json', error }
    });
  }
}

// ❌ Bad: Let errors propagate unhandled
async function readConfig() {
  return await fs.readFile('config.json', 'utf-8'); // Raw error
}
```

### 5. Never Swallow Errors Silently

```typescript
// ✅ Good: Log and handle
try {
  await operation();
} catch (error) {
  logger.error({ error });
  return defaultValue;
}

// ❌ Bad: Silent failure
try {
  await operation();
} catch (error) {
  // Nothing
}
```

## Error Response Format

### Successful Response

```json
{
  "success": true,
  "data": { /* result */ },
  "metadata": {
    "duration": 123,
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Invalid input parameter",
    "context": {
      "field": "email",
      "reason": "Invalid format"
    },
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

## Testing Error Handling

### Testing Expected Errors

```typescript
describe('validation', () => {
  it('should throw ValidationError for invalid input', () => {
    expect(() => {
      validate({ email: 'not-an-email' });
    }).toThrow(ValidationError);
  });

  it('should include context in error', () => {
    try {
      validate({ email: 'not-an-email' });
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.context).toMatchObject({
        field: 'email'
      });
    }
  });
});
```

### Testing Error Recovery

```typescript
describe('error recovery', () => {
  it('should fallback to basic analyzer on failure', async () => {
    // Mock advanced analyzer to fail
    advancedAnalyzer.analyze.mockRejectedValue(new Error('Failed'));

    const result = await analyzeCode('test code');

    expect(result.status).toBe('partial');
    expect(basicAnalyzer.analyze).toHaveBeenCalled();
  });
});
```

## Common Error Scenarios

### Scenario 1: Invalid User Input

```typescript
function processUserInput(input: unknown) {
  const schema = z.object({
    name: z.string().min(1),
    age: z.number().min(0).max(150)
  });

  try {
    return schema.parse(input);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid user input', {
        code: 'INVALID_INPUT',
        context: { errors: error.errors }
      });
    }
    throw error;
  }
}
```

### Scenario 2: External API Failure

```typescript
async function callExternalAPI(url: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new OperationError('API request failed', {
        code: 'API_ERROR',
        context: { status: response.status, url }
      });
    }
    return await response.json();
  } catch (error) {
    if (error instanceof OperationError) throw error;

    throw new OperationError('Network error', {
      code: 'NETWORK_ERROR',
      context: { url, originalError: error }
    });
  }
}
```

### Scenario 3: Resource Not Found

```typescript
async function loadResource(id: string) {
  const resource = await db.findById(id);

  if (!resource) {
    throw new OperationError('Resource not found', {
      code: 'NOT_FOUND',
      context: { resourceId: id, resourceType: 'User' }
    });
  }

  return resource;
}
```

## Related Resources

- [Bridge Connectors](./BRIDGE_CONNECTORS.md) - Error handling in bridges
- [Code Quality](./CODE_QUALITY_IMPROVEMENTS.md) - Error handling best practices

## Conclusion

Proper error handling with typed errors, comprehensive validation, and graceful degradation ensures the MCP server provides clear, actionable feedback and maintains reliability even when things go wrong. Always validate inputs, provide context in errors, and handle failures gracefully.
