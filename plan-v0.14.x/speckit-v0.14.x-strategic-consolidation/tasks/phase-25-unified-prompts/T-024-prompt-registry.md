# T-024: Implement PromptRegistry

**Task ID**: T-024
**Phase**: 2.5 - Unified Prompts
**Priority**: P0 (Critical Path)
**Estimate**: 4 hours
**Owner**: @mcp-tool-builder
**Reviewer**: @architecture-advisor
**Dependencies**: None
**Blocks**: T-026 (UnifiedPromptBuilder)

---

## 1. Overview

### What

Create `PromptRegistry` - a singleton that:
- Registers domain-specific prompt generators
- Provides type-safe access to generators
- Lazy-loads generators for performance
- Supports runtime registration for extensions

### Why

Current prompt builders are:
- Instantiated independently with no shared registry
- Hard to discover available generators
- Difficult to extend with new domains
- No central configuration

### Target API

```typescript
// Registration (at startup)
promptRegistry.register('hierarchical', HierarchicalGenerator);
promptRegistry.register('security', SecurityGenerator);
promptRegistry.register('architecture', ArchitectureGenerator);

// Usage (in UnifiedPromptBuilder)
const generator = promptRegistry.get('hierarchical');
const sections = generator.generate(request);

// Discovery
const domains = promptRegistry.listDomains();
// ['hierarchical', 'security', 'architecture', ...]
```

---

## 2. Implementation Guide

### Step 2.1: Define Generator Interface

```typescript
// src/domain/prompts/types.ts

import type { z } from 'zod';

/**
 * Domain identifier for prompt generators.
 */
export type PromptDomain =
  | 'hierarchical'
  | 'security'
  | 'architecture'
  | 'code-analysis'
  | 'documentation'
  | 'debugging'
  | 'domain-neutral'
  | 'spark'
  | 'enterprise'
  | 'l9-engineer'
  | 'quick-prompts'
  | 'coverage-dashboard';

/**
 * Prompting technique that can be applied.
 */
export type PromptTechnique =
  | 'zero-shot'
  | 'few-shot'
  | 'chain-of-thought'
  | 'self-consistency'
  | 'tree-of-thoughts'
  | 'react'
  | 'rag'
  | 'meta-prompting';

/**
 * Output style for generated prompts.
 */
export type PromptStyle = 'markdown' | 'xml';

/**
 * Base request interface for all generators.
 */
export interface BasePromptRequest {
  /** Output style preference */
  style?: PromptStyle;

  /** Prompting techniques to apply */
  techniques?: PromptTechnique[];

  /** Include metadata section */
  includeMetadata?: boolean;

  /** Include references section */
  includeReferences?: boolean;

  /** Target LLM provider for optimization */
  provider?: string;
}

/**
 * Generated section of a prompt.
 */
export interface PromptSection {
  /** Section identifier */
  id: string;

  /** Section title (for display) */
  title: string;

  /** Section content */
  content: string;

  /** Whether section is required */
  required: boolean;

  /** Order for rendering */
  order: number;
}

/**
 * Result from a generator.
 */
export interface GeneratorResult {
  /** Generated sections */
  sections: PromptSection[];

  /** Metadata about generation */
  metadata: {
    domain: PromptDomain;
    generatedAt: Date;
    techniques: PromptTechnique[];
    tokenEstimate: number;
  };
}

/**
 * Interface that all prompt generators must implement.
 */
export interface PromptGenerator<TRequest extends BasePromptRequest = BasePromptRequest> {
  /** Domain this generator handles */
  readonly domain: PromptDomain;

  /** Generator version */
  readonly version: string;

  /** Human-readable description */
  readonly description: string;

  /** Zod schema for validating requests */
  readonly requestSchema: z.ZodSchema<TRequest>;

  /**
   * Generate prompt sections from a request.
   *
   * @param request - Validated request data
   * @returns Generated sections and metadata
   */
  generate(request: TRequest): GeneratorResult;
}

/**
 * Factory function type for lazy generator instantiation.
 */
export type GeneratorFactory<T extends BasePromptRequest = BasePromptRequest> =
  () => PromptGenerator<T>;
```

### Step 2.2: Implement PromptRegistry

```typescript
// src/domain/prompts/registry.ts

import type {
  PromptDomain,
  PromptGenerator,
  GeneratorFactory,
  BasePromptRequest,
} from './types.js';

/**
 * Registry entry with metadata.
 */
interface RegistryEntry<T extends BasePromptRequest = BasePromptRequest> {
  factory: GeneratorFactory<T>;
  version: string;
  description: string;
  instance?: PromptGenerator<T>;
}

/**
 * PromptRegistry - singleton registry for prompt generators.
 *
 * Features:
 * - Lazy instantiation of generators
 * - Type-safe access with generics
 * - Runtime registration for extensions
 * - Domain discovery
 *
 * @example
 * ```typescript
 * // At startup
 * import { promptRegistry } from './registry.js';
 * import { HierarchicalGenerator } from './domains/hierarchical.js';
 *
 * promptRegistry.register(
 *   'hierarchical',
 *   () => new HierarchicalGenerator(),
 *   { version: '2.0.0', description: 'Hierarchical prompt generation' }
 * );
 *
 * // Usage
 * const generator = promptRegistry.get('hierarchical');
 * const result = generator.generate(request);
 * ```
 */
export class PromptRegistry {
  private readonly generators = new Map<PromptDomain, RegistryEntry>();
  private static instance: PromptRegistry | null = null;

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get the singleton instance.
   */
  static getInstance(): PromptRegistry {
    if (!PromptRegistry.instance) {
      PromptRegistry.instance = new PromptRegistry();
    }
    return PromptRegistry.instance;
  }

  /**
   * Reset the singleton (for testing).
   */
  static resetInstance(): void {
    PromptRegistry.instance = null;
  }

  // ============================================
  // Registration
  // ============================================

  /**
   * Register a generator factory for a domain.
   *
   * @param domain - Domain identifier
   * @param factory - Factory function to create generator
   * @param options - Registration options
   */
  register<T extends BasePromptRequest>(
    domain: PromptDomain,
    factory: GeneratorFactory<T>,
    options: {
      version: string;
      description: string;
    }
  ): void {
    if (this.generators.has(domain)) {
      throw new Error(`Generator already registered for domain: ${domain}`);
    }

    this.generators.set(domain, {
      factory: factory as GeneratorFactory,
      version: options.version,
      description: options.description,
    });
  }

  /**
   * Register a generator instance directly.
   *
   * @param generator - Generator instance
   */
  registerInstance<T extends BasePromptRequest>(
    generator: PromptGenerator<T>
  ): void {
    this.register(
      generator.domain,
      () => generator,
      {
        version: generator.version,
        description: generator.description,
      }
    );
  }

  /**
   * Override an existing registration.
   *
   * Use with caution - primarily for testing.
   */
  override<T extends BasePromptRequest>(
    domain: PromptDomain,
    factory: GeneratorFactory<T>,
    options: { version: string; description: string }
  ): void {
    this.generators.set(domain, {
      factory: factory as GeneratorFactory,
      version: options.version,
      description: options.description,
    });
  }

  // ============================================
  // Access
  // ============================================

  /**
   * Get a generator for a domain.
   *
   * Generator is lazily instantiated on first access.
   *
   * @param domain - Domain identifier
   * @returns Generator instance
   * @throws If no generator registered for domain
   */
  get<T extends BasePromptRequest>(domain: PromptDomain): PromptGenerator<T> {
    const entry = this.generators.get(domain);

    if (!entry) {
      throw new Error(
        `No generator registered for domain: ${domain}. ` +
        `Available domains: ${this.listDomains().join(', ')}`
      );
    }

    // Lazy instantiation
    if (!entry.instance) {
      entry.instance = entry.factory();
    }

    return entry.instance as PromptGenerator<T>;
  }

  /**
   * Check if a domain has a registered generator.
   */
  has(domain: PromptDomain): boolean {
    return this.generators.has(domain);
  }

  /**
   * Get metadata for a domain without instantiating.
   */
  getMetadata(domain: PromptDomain): { version: string; description: string } | undefined {
    const entry = this.generators.get(domain);
    if (!entry) return undefined;

    return {
      version: entry.version,
      description: entry.description,
    };
  }

  // ============================================
  // Discovery
  // ============================================

  /**
   * List all registered domains.
   */
  listDomains(): PromptDomain[] {
    return Array.from(this.generators.keys());
  }

  /**
   * List all registered generators with metadata.
   */
  listGenerators(): Array<{
    domain: PromptDomain;
    version: string;
    description: string;
    instantiated: boolean;
  }> {
    return Array.from(this.generators.entries()).map(([domain, entry]) => ({
      domain,
      version: entry.version,
      description: entry.description,
      instantiated: !!entry.instance,
    }));
  }

  /**
   * Get count of registered generators.
   */
  get size(): number {
    return this.generators.size;
  }

  // ============================================
  // Cleanup
  // ============================================

  /**
   * Clear all registrations.
   *
   * Use with caution - primarily for testing.
   */
  clear(): void {
    this.generators.clear();
  }

  /**
   * Unregister a specific domain.
   */
  unregister(domain: PromptDomain): boolean {
    return this.generators.delete(domain);
  }
}

/**
 * Default singleton instance.
 */
export const promptRegistry = PromptRegistry.getInstance();
```

### Step 2.3: Create Default Registrations

```typescript
// src/domain/prompts/register-defaults.ts

import { promptRegistry } from './registry.js';

// Import generators (these will be created in subsequent tasks)
import { HierarchicalGenerator } from './domains/hierarchical.js';
import { SecurityGenerator } from './domains/security.js';
import { ArchitectureGenerator } from './domains/architecture.js';
import { CodeAnalysisGenerator } from './domains/code-analysis.js';
import { DocumentationGenerator } from './domains/documentation.js';
import { DebuggingGenerator } from './domains/debugging.js';
import { DomainNeutralGenerator } from './domains/domain-neutral.js';
import { SparkGenerator } from './domains/spark.js';
import { EnterpriseGenerator } from './domains/enterprise.js';
import { L9EngineerGenerator } from './domains/l9-engineer.js';
import { QuickPromptsGenerator } from './domains/quick-prompts.js';
import { CoverageDashboardGenerator } from './domains/coverage-dashboard.js';

/**
 * Register all default prompt generators.
 *
 * Called once at application startup.
 */
export function registerDefaultGenerators(): void {
  promptRegistry.register('hierarchical', () => new HierarchicalGenerator(), {
    version: '2.0.0',
    description: 'Hierarchical prompt generation with context → goal → requirements',
  });

  promptRegistry.register('security', () => new SecurityGenerator(), {
    version: '2.0.0',
    description: 'Security-focused prompts with OWASP compliance',
  });

  promptRegistry.register('architecture', () => new ArchitectureGenerator(), {
    version: '2.0.0',
    description: 'Architecture design prompts for system design',
  });

  promptRegistry.register('code-analysis', () => new CodeAnalysisGenerator(), {
    version: '2.0.0',
    description: 'Code review and analysis prompts',
  });

  promptRegistry.register('documentation', () => new DocumentationGenerator(), {
    version: '2.0.0',
    description: 'Technical documentation generation prompts',
  });

  promptRegistry.register('debugging', () => new DebuggingGenerator(), {
    version: '2.0.0',
    description: 'Debugging assistant prompts with root cause analysis',
  });

  promptRegistry.register('domain-neutral', () => new DomainNeutralGenerator(), {
    version: '2.0.0',
    description: 'Domain-neutral prompts for cross-cutting concerns',
  });

  promptRegistry.register('spark', () => new SparkGenerator(), {
    version: '2.0.0',
    description: 'Spark UI/UX card generation prompts',
  });

  promptRegistry.register('enterprise', () => new EnterpriseGenerator(), {
    version: '2.0.0',
    description: 'Enterprise architecture strategy prompts',
  });

  promptRegistry.register('l9-engineer', () => new L9EngineerGenerator(), {
    version: '2.0.0',
    description: 'Distinguished engineer (L9) technical design prompts',
  });

  promptRegistry.register('quick-prompts', () => new QuickPromptsGenerator(), {
    version: '2.0.0',
    description: 'Quick developer prompts with checklists',
  });

  promptRegistry.register('coverage-dashboard', () => new CoverageDashboardGenerator(), {
    version: '2.0.0',
    description: 'Coverage dashboard UI design prompts',
  });
}
```

---

## 3. Test Coverage

```typescript
// tests/vitest/domain/prompts/registry.spec.ts

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PromptRegistry } from '../../../../src/domain/prompts/registry.js';
import type { PromptGenerator, BasePromptRequest, GeneratorResult } from '../../../../src/domain/prompts/types.js';
import { z } from 'zod';

// Mock generator for testing
class MockGenerator implements PromptGenerator {
  static instanceCount = 0;

  readonly domain = 'hierarchical' as const;
  readonly version = '1.0.0';
  readonly description = 'Mock generator';
  readonly requestSchema = z.object({});

  constructor() {
    MockGenerator.instanceCount++;
  }

  generate(): GeneratorResult {
    return {
      sections: [],
      metadata: {
        domain: this.domain,
        generatedAt: new Date(),
        techniques: [],
        tokenEstimate: 0,
      },
    };
  }
}

describe('PromptRegistry', () => {
  let registry: PromptRegistry;

  beforeEach(() => {
    PromptRegistry.resetInstance();
    registry = PromptRegistry.getInstance();
    MockGenerator.instanceCount = 0;
  });

  afterEach(() => {
    PromptRegistry.resetInstance();
  });

  describe('singleton', () => {
    it('should return same instance', () => {
      const instance1 = PromptRegistry.getInstance();
      const instance2 = PromptRegistry.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should reset instance', () => {
      const instance1 = PromptRegistry.getInstance();
      PromptRegistry.resetInstance();
      const instance2 = PromptRegistry.getInstance();

      expect(instance1).not.toBe(instance2);
    });
  });

  describe('register', () => {
    it('should register a generator factory', () => {
      registry.register('hierarchical', () => new MockGenerator(), {
        version: '1.0.0',
        description: 'Test',
      });

      expect(registry.has('hierarchical')).toBe(true);
    });

    it('should throw on duplicate registration', () => {
      registry.register('hierarchical', () => new MockGenerator(), {
        version: '1.0.0',
        description: 'Test',
      });

      expect(() => {
        registry.register('hierarchical', () => new MockGenerator(), {
          version: '1.0.0',
          description: 'Test',
        });
      }).toThrow('already registered');
    });
  });

  describe('registerInstance', () => {
    it('should register a generator instance', () => {
      const generator = new MockGenerator();
      registry.registerInstance(generator);

      expect(registry.has('hierarchical')).toBe(true);
    });
  });

  describe('get', () => {
    it('should return registered generator', () => {
      registry.register('hierarchical', () => new MockGenerator(), {
        version: '1.0.0',
        description: 'Test',
      });

      const generator = registry.get('hierarchical');

      expect(generator.domain).toBe('hierarchical');
    });

    it('should lazily instantiate generator', () => {
      registry.register('hierarchical', () => new MockGenerator(), {
        version: '1.0.0',
        description: 'Test',
      });

      expect(MockGenerator.instanceCount).toBe(0);

      registry.get('hierarchical');

      expect(MockGenerator.instanceCount).toBe(1);
    });

    it('should cache generator instance', () => {
      registry.register('hierarchical', () => new MockGenerator(), {
        version: '1.0.0',
        description: 'Test',
      });

      registry.get('hierarchical');
      registry.get('hierarchical');
      registry.get('hierarchical');

      expect(MockGenerator.instanceCount).toBe(1);
    });

    it('should throw for unknown domain', () => {
      expect(() => {
        registry.get('unknown' as any);
      }).toThrow('No generator registered');
    });
  });

  describe('override', () => {
    it('should replace existing registration', () => {
      registry.register('hierarchical', () => new MockGenerator(), {
        version: '1.0.0',
        description: 'Original',
      });

      registry.override('hierarchical', () => new MockGenerator(), {
        version: '2.0.0',
        description: 'Overridden',
      });

      const metadata = registry.getMetadata('hierarchical');
      expect(metadata?.version).toBe('2.0.0');
    });
  });

  describe('listDomains', () => {
    it('should list all registered domains', () => {
      registry.register('hierarchical', () => new MockGenerator(), {
        version: '1.0.0',
        description: 'Test',
      });

      const domains = registry.listDomains();

      expect(domains).toContain('hierarchical');
    });
  });

  describe('listGenerators', () => {
    it('should list generators with metadata', () => {
      registry.register('hierarchical', () => new MockGenerator(), {
        version: '1.0.0',
        description: 'Test description',
      });

      const generators = registry.listGenerators();

      expect(generators).toHaveLength(1);
      expect(generators[0].domain).toBe('hierarchical');
      expect(generators[0].version).toBe('1.0.0');
      expect(generators[0].description).toBe('Test description');
      expect(generators[0].instantiated).toBe(false);
    });

    it('should track instantiation status', () => {
      registry.register('hierarchical', () => new MockGenerator(), {
        version: '1.0.0',
        description: 'Test',
      });

      registry.get('hierarchical');

      const generators = registry.listGenerators();
      expect(generators[0].instantiated).toBe(true);
    });
  });

  describe('clear', () => {
    it('should remove all registrations', () => {
      registry.register('hierarchical', () => new MockGenerator(), {
        version: '1.0.0',
        description: 'Test',
      });

      registry.clear();

      expect(registry.size).toBe(0);
    });
  });

  describe('unregister', () => {
    it('should remove specific domain', () => {
      registry.register('hierarchical', () => new MockGenerator(), {
        version: '1.0.0',
        description: 'Test',
      });

      const removed = registry.unregister('hierarchical');

      expect(removed).toBe(true);
      expect(registry.has('hierarchical')).toBe(false);
    });
  });
});
```

---

## 4. Acceptance Criteria

| Criterion                      | Status | Verification        |
| ------------------------------ | ------ | ------------------- |
| Singleton pattern implemented  | ⬜      | Singleton test      |
| Register generator factory     | ⬜      | Registration test   |
| Lazy instantiation             | ⬜      | Instance count test |
| Instance caching               | ⬜      | Cache test          |
| Type-safe generic access       | ⬜      | TypeScript compile  |
| Domain discovery (listDomains) | ⬜      | Discovery test      |
| Override for testing           | ⬜      | Override test       |
| 100% test coverage             | ⬜      | Coverage report     |

---

## 5. References

| Document                          | Link                                                   |
| --------------------------------- | ------------------------------------------------------ |
| T-026: UnifiedPromptBuilder       | [T-026-unified-builder.md](./T-026-unified-builder.md) |
| T-025: TemplateEngine             | [T-025-template-engine.md](./T-025-template-engine.md) |
| ADR-003: Unified Prompt Ecosystem | [adr.md](../../adr.md#adr-003)                         |

---

*Task: T-024 | Phase: 2.5 | Priority: P0*
