# T-032: Implement Legacy Facades

**Task ID**: T-032
**Phase**: 3 - Consolidation
**Priority**: P1 (High)
**Estimate**: 4 hours
**Owner**: @mcp-tool-builder
**Reviewer**: @code-reviewer
**Dependencies**: T-026 (UnifiedPromptBuilder), T-037 (FrameworkRouter)
**Blocks**: T-034 (API deprecation)

---

## 1. Overview

### What

Create `LegacyFacade` pattern to:
- Wrap new unified builders with old API signatures
- Emit deprecation warnings
- Provide migration guidance
- Enable incremental migration

### Why

Existing tools have established APIs that:
- Cannot change without breaking consumers
- Need gradual migration path
- Should guide users to new APIs
- Must maintain backward compatibility during transition

### Target API

```typescript
// Old API (preserved for compatibility)
import { buildHierarchicalPrompt } from './legacy/hierarchical-prompt-builder.js';

const result = buildHierarchicalPrompt({
  context: 'Building auth system',
  goal: 'Implement OAuth2',
  // ... old options
});

// Console shows:
// ⚠️  DEPRECATION: buildHierarchicalPrompt() is deprecated.
//    Use UnifiedPromptBuilder.build({ domain: 'hierarchical', ... }) instead.
//    Migration guide: https://docs.example.com/migrate-prompts

// New API (recommended)
import { unifiedPromptBuilder } from './domain/prompts/index.js';

const result = unifiedPromptBuilder.build({
  domain: 'hierarchical',
  request: {
    context: 'Building auth system',
    goal: 'Implement OAuth2',
  },
});
```

---

## 2. Implementation Guide

### Step 2.1: Define Facade Types

```typescript
// src/legacy/facade-types.ts

/**
 * Deprecation warning configuration.
 */
export interface DeprecationConfig {
  /** Old function/method name */
  oldName: string;

  /** New replacement recommendation */
  newName: string;

  /** Migration guide URL */
  migrationUrl?: string;

  /** Version when deprecated */
  deprecatedIn: string;

  /** Version when will be removed */
  removeIn?: string;

  /** Additional migration instructions */
  instructions?: string[];

  /** Only warn once per session */
  warnOnce?: boolean;
}

/**
 * Facade options for wrapping new implementations.
 */
export interface FacadeOptions<TNewRequest, TOldRequest> {
  /** Deprecation configuration */
  deprecation: DeprecationConfig;

  /** Transform old request to new format */
  transformRequest: (oldRequest: TOldRequest) => TNewRequest;

  /** Transform new response to old format (if needed) */
  transformResponse?: (newResponse: unknown) => unknown;

  /** Custom validation for old request format */
  validateOldRequest?: (request: TOldRequest) => string | null;
}

/**
 * Registry for tracking deprecation warnings.
 */
export interface DeprecationRegistry {
  /** Check if warning was already shown */
  hasWarned(key: string): boolean;

  /** Mark warning as shown */
  markWarned(key: string): void;

  /** Clear all warnings (for testing) */
  clear(): void;
}
```

### Step 2.2: Implement Deprecation Logger

```typescript
// src/legacy/deprecation-logger.ts

import type { DeprecationConfig, DeprecationRegistry } from './facade-types.js';

/**
 * Default deprecation registry (tracks warnings per session).
 */
class DefaultDeprecationRegistry implements DeprecationRegistry {
  private readonly warned = new Set<string>();

  hasWarned(key: string): boolean {
    return this.warned.has(key);
  }

  markWarned(key: string): void {
    this.warned.add(key);
  }

  clear(): void {
    this.warned.clear();
  }
}

/**
 * Global deprecation registry singleton.
 */
const deprecationRegistry = new DefaultDeprecationRegistry();

/**
 * Format deprecation warning message.
 */
function formatDeprecationWarning(config: DeprecationConfig): string {
  const lines: string[] = [];

  lines.push(`⚠️  DEPRECATION: ${config.oldName} is deprecated.`);
  lines.push(`   Use ${config.newName} instead.`);

  if (config.migrationUrl) {
    lines.push(`   Migration guide: ${config.migrationUrl}`);
  }

  lines.push(`   Deprecated in: v${config.deprecatedIn}`);

  if (config.removeIn) {
    lines.push(`   Will be removed in: v${config.removeIn}`);
  }

  if (config.instructions?.length) {
    lines.push('');
    lines.push('   Migration steps:');
    for (const instruction of config.instructions) {
      lines.push(`   • ${instruction}`);
    }
  }

  return lines.join('\n');
}

/**
 * Emit a deprecation warning.
 */
export function emitDeprecationWarning(config: DeprecationConfig): void {
  const key = `${config.oldName}:${config.newName}`;

  // Check if we should warn
  if (config.warnOnce && deprecationRegistry.hasWarned(key)) {
    return;
  }

  // Emit warning
  console.warn(formatDeprecationWarning(config));

  // Mark as warned
  if (config.warnOnce) {
    deprecationRegistry.markWarned(key);
  }
}

/**
 * Reset deprecation warnings (for testing).
 */
export function resetDeprecationWarnings(): void {
  deprecationRegistry.clear();
}

/**
 * Create a deprecation decorator for methods.
 */
export function deprecated(config: DeprecationConfig) {
  return function <T extends (...args: unknown[]) => unknown>(
    target: T
  ): T {
    const wrapper = function (this: unknown, ...args: unknown[]): unknown {
      emitDeprecationWarning(config);
      return target.apply(this, args);
    };

    // Preserve function name
    Object.defineProperty(wrapper, 'name', {
      value: target.name,
      configurable: true,
    });

    return wrapper as T;
  };
}
```

### Step 2.3: Implement Legacy Facade Factory

```typescript
// src/legacy/facade-factory.ts

import type { FacadeOptions } from './facade-types.js';
import { emitDeprecationWarning } from './deprecation-logger.js';

/**
 * Create a legacy facade that wraps a new implementation.
 *
 * @example
 * ```typescript
 * const buildHierarchicalPrompt = createLegacyFacade(
 *   (req) => unifiedPromptBuilder.build({ domain: 'hierarchical', request: req }),
 *   {
 *     deprecation: {
 *       oldName: 'buildHierarchicalPrompt()',
 *       newName: 'UnifiedPromptBuilder.build({ domain: "hierarchical", ... })',
 *       deprecatedIn: '0.14.0',
 *       removeIn: '0.15.0',
 *       warnOnce: true,
 *     },
 *     transformRequest: (old) => ({
 *       context: old.context,
 *       goal: old.goal,
 *       // ... map old fields to new
 *     }),
 *   }
 * );
 * ```
 */
export function createLegacyFacade<
  TNewRequest,
  TOldRequest,
  TResult
>(
  implementation: (request: TNewRequest) => TResult,
  options: FacadeOptions<TNewRequest, TOldRequest>
): (request: TOldRequest) => TResult {
  return function legacyFacade(oldRequest: TOldRequest): TResult {
    // Emit deprecation warning
    emitDeprecationWarning(options.deprecation);

    // Validate old request if validator provided
    if (options.validateOldRequest) {
      const error = options.validateOldRequest(oldRequest);
      if (error) {
        throw new Error(`Invalid request: ${error}`);
      }
    }

    // Transform to new format
    const newRequest = options.transformRequest(oldRequest);

    // Call new implementation
    const result = implementation(newRequest);

    // Transform response if needed
    if (options.transformResponse) {
      return options.transformResponse(result) as TResult;
    }

    return result;
  };
}

/**
 * Create an async legacy facade.
 */
export function createAsyncLegacyFacade<
  TNewRequest,
  TOldRequest,
  TResult
>(
  implementation: (request: TNewRequest) => Promise<TResult>,
  options: FacadeOptions<TNewRequest, TOldRequest>
): (request: TOldRequest) => Promise<TResult> {
  return async function asyncLegacyFacade(oldRequest: TOldRequest): Promise<TResult> {
    // Emit deprecation warning
    emitDeprecationWarning(options.deprecation);

    // Validate old request if validator provided
    if (options.validateOldRequest) {
      const error = options.validateOldRequest(oldRequest);
      if (error) {
        throw new Error(`Invalid request: ${error}`);
      }
    }

    // Transform to new format
    const newRequest = options.transformRequest(oldRequest);

    // Call new implementation
    const result = await implementation(newRequest);

    // Transform response if needed
    if (options.transformResponse) {
      return options.transformResponse(result) as TResult;
    }

    return result;
  };
}
```

### Step 2.4: Implement Specific Facades

```typescript
// src/legacy/prompt-facades.ts

import { createLegacyFacade } from './facade-factory.js';
import { unifiedPromptBuilder } from '../domain/prompts/index.js';
import type {
  HierarchicalPromptRequest,
  SecurityPromptRequest,
  ArchitecturePromptRequest,
} from '../tools/prompt/types.js';

// ============================================
// Hierarchical Prompt Builder Facade
// ============================================

/**
 * Old hierarchical prompt request format.
 */
interface LegacyHierarchicalRequest {
  context: string;
  goal: string;
  requirements?: string[];
  audience?: string;
  outputFormat?: string;
  style?: 'markdown' | 'xml';
  includeFrontmatter?: boolean;
  includeMetadata?: boolean;
  includeReferences?: boolean;
}

/**
 * @deprecated Use UnifiedPromptBuilder.build() instead.
 */
export const buildHierarchicalPrompt = createLegacyFacade<
  { domain: 'hierarchical'; request: HierarchicalPromptRequest },
  LegacyHierarchicalRequest,
  string
>(
  (req) => unifiedPromptBuilder.build(req),
  {
    deprecation: {
      oldName: 'buildHierarchicalPrompt()',
      newName: 'UnifiedPromptBuilder.build({ domain: "hierarchical", ... })',
      deprecatedIn: '0.14.0',
      removeIn: '0.16.0',
      migrationUrl: 'https://github.com/mcp-ai-agent-guidelines/docs/migrate-prompts',
      warnOnce: true,
      instructions: [
        'Import UnifiedPromptBuilder from domain/prompts',
        'Replace buildHierarchicalPrompt(opts) with build({ domain: "hierarchical", request: opts })',
        'Update response handling if needed',
      ],
    },
    transformRequest: (old) => ({
      domain: 'hierarchical' as const,
      request: {
        context: old.context,
        goal: old.goal,
        requirements: old.requirements,
        audience: old.audience,
        outputFormat: old.outputFormat,
        style: old.style,
        includeFrontmatter: old.includeFrontmatter,
        includeMetadata: old.includeMetadata,
        includeReferences: old.includeReferences,
      },
    }),
  }
);

// ============================================
// Security Prompt Builder Facade
// ============================================

/**
 * Old security prompt request format.
 */
interface LegacySecurityRequest {
  projectName: string;
  securityDomain: string;
  threatModel?: string[];
  complianceFrameworks?: string[];
  // ... other old fields
}

/**
 * @deprecated Use UnifiedPromptBuilder.build() instead.
 */
export const buildSecurityPrompt = createLegacyFacade<
  { domain: 'security'; request: SecurityPromptRequest },
  LegacySecurityRequest,
  string
>(
  (req) => unifiedPromptBuilder.build(req),
  {
    deprecation: {
      oldName: 'buildSecurityPrompt()',
      newName: 'UnifiedPromptBuilder.build({ domain: "security", ... })',
      deprecatedIn: '0.14.0',
      removeIn: '0.16.0',
      warnOnce: true,
    },
    transformRequest: (old) => ({
      domain: 'security' as const,
      request: {
        projectName: old.projectName,
        securityDomain: old.securityDomain,
        threatModel: old.threatModel,
        complianceFrameworks: old.complianceFrameworks,
      },
    }),
  }
);

// ============================================
// Architecture Prompt Builder Facade
// ============================================

/**
 * Old architecture prompt request format.
 */
interface LegacyArchitectureRequest {
  projectName: string;
  systemDescription: string;
  architectureStyle?: string;
  qualityAttributes?: string[];
  // ... other old fields
}

/**
 * @deprecated Use UnifiedPromptBuilder.build() instead.
 */
export const buildArchitecturePrompt = createLegacyFacade<
  { domain: 'architecture'; request: ArchitecturePromptRequest },
  LegacyArchitectureRequest,
  string
>(
  (req) => unifiedPromptBuilder.build(req),
  {
    deprecation: {
      oldName: 'buildArchitecturePrompt()',
      newName: 'UnifiedPromptBuilder.build({ domain: "architecture", ... })',
      deprecatedIn: '0.14.0',
      removeIn: '0.16.0',
      warnOnce: true,
    },
    transformRequest: (old) => ({
      domain: 'architecture' as const,
      request: {
        projectName: old.projectName,
        systemDescription: old.systemDescription,
        architectureStyle: old.architectureStyle,
        qualityAttributes: old.qualityAttributes,
      },
    }),
  }
);
```

### Step 2.5: Create Barrel Export

```typescript
// src/legacy/index.ts

// Types
export type {
  DeprecationConfig,
  FacadeOptions,
  DeprecationRegistry,
} from './facade-types.js';

// Deprecation utilities
export {
  emitDeprecationWarning,
  resetDeprecationWarnings,
  deprecated,
} from './deprecation-logger.js';

// Facade factory
export {
  createLegacyFacade,
  createAsyncLegacyFacade,
} from './facade-factory.js';

// Specific facades (re-export for backward compatibility)
export {
  buildHierarchicalPrompt,
  buildSecurityPrompt,
  buildArchitecturePrompt,
} from './prompt-facades.js';
```

---

## 3. Test Coverage

```typescript
// tests/vitest/legacy/facade-factory.spec.ts

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  createLegacyFacade,
  createAsyncLegacyFacade,
} from '../../../src/legacy/facade-factory.js';
import { resetDeprecationWarnings } from '../../../src/legacy/deprecation-logger.js';

describe('createLegacyFacade', () => {
  beforeEach(() => {
    resetDeprecationWarnings();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should call implementation with transformed request', () => {
    const implementation = vi.fn().mockReturnValue('result');

    const facade = createLegacyFacade(implementation, {
      deprecation: {
        oldName: 'oldFn',
        newName: 'newFn',
        deprecatedIn: '0.14.0',
      },
      transformRequest: (old: { x: number }) => ({ y: old.x * 2 }),
    });

    const result = facade({ x: 5 });

    expect(implementation).toHaveBeenCalledWith({ y: 10 });
    expect(result).toBe('result');
  });

  it('should emit deprecation warning', () => {
    const implementation = vi.fn().mockReturnValue('result');

    const facade = createLegacyFacade(implementation, {
      deprecation: {
        oldName: 'oldFn()',
        newName: 'newFn()',
        deprecatedIn: '0.14.0',
      },
      transformRequest: (old: unknown) => old,
    });

    facade({});

    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('DEPRECATION')
    );
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('oldFn()')
    );
  });

  it('should only warn once when warnOnce is true', () => {
    const implementation = vi.fn().mockReturnValue('result');

    const facade = createLegacyFacade(implementation, {
      deprecation: {
        oldName: 'oldFn',
        newName: 'newFn',
        deprecatedIn: '0.14.0',
        warnOnce: true,
      },
      transformRequest: (old: unknown) => old,
    });

    facade({});
    facade({});
    facade({});

    expect(console.warn).toHaveBeenCalledTimes(1);
  });

  it('should transform response when transformer provided', () => {
    const implementation = vi.fn().mockReturnValue({ value: 42 });

    const facade = createLegacyFacade(implementation, {
      deprecation: {
        oldName: 'oldFn',
        newName: 'newFn',
        deprecatedIn: '0.14.0',
      },
      transformRequest: (old: unknown) => old,
      transformResponse: (res: { value: number }) => res.value.toString(),
    });

    const result = facade({});

    expect(result).toBe('42');
  });

  it('should validate old request when validator provided', () => {
    const implementation = vi.fn().mockReturnValue('result');

    const facade = createLegacyFacade(implementation, {
      deprecation: {
        oldName: 'oldFn',
        newName: 'newFn',
        deprecatedIn: '0.14.0',
      },
      transformRequest: (old: unknown) => old,
      validateOldRequest: (req: { required?: string }) =>
        req.required ? null : 'required field is missing',
    });

    expect(() => facade({})).toThrow('required field is missing');
    expect(implementation).not.toHaveBeenCalled();
  });
});

describe('createAsyncLegacyFacade', () => {
  beforeEach(() => {
    resetDeprecationWarnings();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should handle async implementation', async () => {
    const implementation = vi.fn().mockResolvedValue('async result');

    const facade = createAsyncLegacyFacade(implementation, {
      deprecation: {
        oldName: 'oldFn',
        newName: 'newFn',
        deprecatedIn: '0.14.0',
      },
      transformRequest: (old: unknown) => old,
    });

    const result = await facade({});

    expect(result).toBe('async result');
  });
});
```

### Step 3.2: Deprecation Logger Tests

```typescript
// tests/vitest/legacy/deprecation-logger.spec.ts

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  emitDeprecationWarning,
  resetDeprecationWarnings,
  deprecated,
} from '../../../src/legacy/deprecation-logger.js';

describe('emitDeprecationWarning', () => {
  beforeEach(() => {
    resetDeprecationWarnings();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should emit formatted warning', () => {
    emitDeprecationWarning({
      oldName: 'oldFunction()',
      newName: 'newFunction()',
      deprecatedIn: '0.14.0',
    });

    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('⚠️  DEPRECATION')
    );
  });

  it('should include migration URL when provided', () => {
    emitDeprecationWarning({
      oldName: 'oldFunction()',
      newName: 'newFunction()',
      deprecatedIn: '0.14.0',
      migrationUrl: 'https://example.com/migrate',
    });

    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('https://example.com/migrate')
    );
  });

  it('should include removal version when provided', () => {
    emitDeprecationWarning({
      oldName: 'oldFunction()',
      newName: 'newFunction()',
      deprecatedIn: '0.14.0',
      removeIn: '0.16.0',
    });

    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('0.16.0')
    );
  });

  it('should include migration instructions when provided', () => {
    emitDeprecationWarning({
      oldName: 'oldFunction()',
      newName: 'newFunction()',
      deprecatedIn: '0.14.0',
      instructions: ['Step 1', 'Step 2'],
    });

    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('Step 1')
    );
  });
});

describe('deprecated decorator', () => {
  beforeEach(() => {
    resetDeprecationWarnings();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should wrap function and emit warning', () => {
    const original = (x: number) => x * 2;
    const wrapped = deprecated({
      oldName: 'original()',
      newName: 'newVersion()',
      deprecatedIn: '0.14.0',
    })(original);

    const result = wrapped(5);

    expect(result).toBe(10);
    expect(console.warn).toHaveBeenCalled();
  });

  it('should preserve function context', () => {
    const obj = {
      value: 10,
      getValue() {
        return this.value;
      },
    };

    const wrappedGetValue = deprecated({
      oldName: 'getValue()',
      newName: 'getNewValue()',
      deprecatedIn: '0.14.0',
    })(obj.getValue.bind(obj));

    expect(wrappedGetValue()).toBe(10);
  });
});
```

---

## 4. Acceptance Criteria

| Criterion                   | Status | Verification    |
| --------------------------- | ------ | --------------- |
| Legacy facade factory works | ⬜      | Facade test     |
| Request transformation      | ⬜      | Transform test  |
| Response transformation     | ⬜      | Response test   |
| Deprecation warning emitted | ⬜      | Warning test    |
| warnOnce works correctly    | ⬜      | warnOnce test   |
| Migration URL displayed     | ⬜      | URL test        |
| Async facade works          | ⬜      | Async test      |
| deprecated decorator works  | ⬜      | Decorator test  |
| 100% test coverage          | ⬜      | Coverage report |

---

## 5. Migration Guide

### Before (v0.13.x)

```typescript
import { buildHierarchicalPrompt } from './tools/prompt/hierarchical-prompt-builder.js';

const prompt = buildHierarchicalPrompt({
  context: 'Building auth system',
  goal: 'Implement OAuth2',
  requirements: ['JWT tokens', 'Refresh tokens'],
  style: 'markdown',
  includeFrontmatter: true,
});
```

### After (v0.14.x+)

```typescript
import { unifiedPromptBuilder } from './domain/prompts/index.js';

const prompt = unifiedPromptBuilder.build({
  domain: 'hierarchical',
  request: {
    context: 'Building auth system',
    goal: 'Implement OAuth2',
    requirements: ['JWT tokens', 'Refresh tokens'],
  },
  options: {
    style: 'markdown',
    includeFrontmatter: true,
  },
});
```

---

## 6. References

| Document                        | Link                                                                             |
| ------------------------------- | -------------------------------------------------------------------------------- |
| T-026: UnifiedPromptBuilder     | [T-026-unified-builder.md](../phase-25-unified-prompts/T-026-unified-builder.md) |
| T-037: FrameworkRouter          | [T-037-framework-router.md](./T-037-framework-router.md)                         |
| ADR-004: Backward Compatibility | [adr.md](../../adr.md#adr-004)                                                   |

---

*Task: T-032 | Phase: 3 | Priority: P1*
