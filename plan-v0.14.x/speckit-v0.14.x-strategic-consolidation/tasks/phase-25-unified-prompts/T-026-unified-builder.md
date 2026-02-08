# T-026: Implement UnifiedPromptBuilder Core

**Task ID**: T-026
**Phase**: 2.5 - Unified Prompt Ecosystem
**Priority**: P0 (Critical Path)
**Estimate**: 8 hours
**Owner**: @mcp-tool-builder
**Reviewer**: @prompt-architect
**Dependencies**: T-024 (PromptRegistry), T-025 (TemplateEngine)
**Blocks**: T-027-T-031 (Domain Generators), T-032-T-033 (Legacy Facades)

---

## 1. Overview

### What

Implement `UnifiedPromptBuilder` as the single entry point for all prompt generation, replacing the 12+ disparate prompt builders (hierarchical, domain-neutral, spark, security, architecture, etc.) with a unified, extensible system.

### Why

Current codebase has 12+ prompt builders with:
- ~25% code duplication (shared sections, frontmatter, techniques)
- Inconsistent prompt structure across builders
- Hard to maintain and extend
- No unified interface for consumers

### Target Files

| File                                           | Purpose          |
| ---------------------------------------------- | ---------------- |
| `src/domain/prompts/unified-prompt-builder.ts` | Main class       |
| `src/domain/prompts/types.ts`                  | Type definitions |
| `src/domain/prompts/index.ts`                  | Barrel export    |

---

## 2. Prerequisites

### Dependencies

- **T-024**: PromptRegistry must be implemented
- **T-025**: TemplateEngine must be implemented

### Files to Review

| File                                                                                              | Purpose                           |
| ------------------------------------------------------------------------------------------------- | --------------------------------- |
| [hierarchical-prompt-builder.ts](../../../../src/tools/prompt/hierarchical-prompt-builder.ts)     | Current implementation to replace |
| [domain-neutral-prompt-builder.ts](../../../../src/tools/prompt/domain-neutral-prompt-builder.ts) | Another builder to consolidate    |
| [prompt-sections.ts](../../../../src/tools/shared/prompt-sections.ts)                             | Shared sections to reuse          |
| [prompt-utils.ts](../../../../src/tools/shared/prompt-utils.ts)                                   | Utilities to incorporate          |

### Environment Setup

```bash
# Ensure dependencies are built
npm run build

# Verify T-024 and T-025 are complete
ls src/domain/prompts/registry.ts
ls src/domain/prompts/template-engine.ts
```

---

## 3. Implementation Guide

### Step 3.1: Define Type System

```typescript
// src/domain/prompts/types.ts

import type { z } from 'zod';

/**
 * Supported prompt domains.
 * Each domain has specific input requirements and output templates.
 */
export type PromptDomain =
  | 'hierarchical'
  | 'domain-neutral'
  | 'spark'
  | 'security'
  | 'architecture'
  | 'code-analysis'
  | 'debugging'
  | 'documentation'
  | 'enterprise'
  | 'l9-engineer';

/**
 * Prompting technique from 2025 research.
 */
export type PromptTechnique =
  | 'zero-shot'
  | 'few-shot'
  | 'chain-of-thought'
  | 'self-consistency'
  | 'tree-of-thoughts'
  | 'react'
  | 'art'
  | 'prompt-chaining'
  | 'meta-prompting'
  | 'rag';

/**
 * Provider-specific optimizations.
 */
export type PromptProvider =
  | 'gpt-4.1'
  | 'gpt-5'
  | 'claude-opus-4.1'
  | 'claude-sonnet-4'
  | 'gemini-2.5-pro'
  | 'other';

/**
 * Output format for generated prompts.
 */
export type PromptOutputFormat =
  | 'markdown'
  | 'json'
  | 'yaml'
  | 'prompt-md';

/**
 * Request to build a prompt.
 */
export interface PromptRequest<TContext = Record<string, unknown>> {
  /** Target domain for prompt generation */
  domain: PromptDomain;

  /** Domain-specific context */
  context: TContext;

  /** Prompting techniques to apply */
  techniques?: PromptTechnique[];

  /** Target LLM provider */
  provider?: PromptProvider;

  /** Output format */
  outputFormat?: PromptOutputFormat;

  /** Include YAML frontmatter */
  includeFrontmatter?: boolean;

  /** Include metadata section */
  includeMetadata?: boolean;

  /** Include technique hints */
  includeTechniqueHints?: boolean;

  /** Custom title override */
  title?: string;
}

/**
 * Generated prompt result.
 */
export interface PromptResult {
  /** Generated prompt content */
  content: string;

  /** Prompt metadata */
  metadata: PromptMetadata;

  /** Applied techniques */
  techniques: PromptTechnique[];

  /** Generation statistics */
  stats: PromptStats;
}

/**
 * Prompt metadata for reference.
 */
export interface PromptMetadata {
  /** Domain that generated the prompt */
  domain: PromptDomain;

  /** Target provider */
  provider: PromptProvider;

  /** Generation timestamp */
  generatedAt: string;

  /** Builder version */
  version: string;

  /** Custom title */
  title?: string;
}

/**
 * Generation statistics.
 */
export interface PromptStats {
  /** Estimated token count */
  estimatedTokens: number;

  /** Number of sections */
  sectionCount: number;

  /** Generation time in ms */
  generationTimeMs: number;
}

/**
 * Interface for domain-specific prompt generators.
 */
export interface PromptGenerator<TContext = Record<string, unknown>> {
  /** Domain this generator handles */
  readonly domain: PromptDomain;

  /** Generator version */
  readonly version: string;

  /** Zod schema for validating context */
  readonly contextSchema: z.ZodSchema<TContext>;

  /**
   * Generate prompt sections from context.
   * @param context - Validated domain context
   * @param options - Generation options
   * @returns Array of prompt sections
   */
  generate(
    context: TContext,
    options: GeneratorOptions
  ): Promise<PromptSection[]>;

  /**
   * Get technique recommendations for this domain.
   */
  recommendTechniques(context: TContext): PromptTechnique[];
}

/**
 * Options passed to generators.
 */
export interface GeneratorOptions {
  techniques: PromptTechnique[];
  provider: PromptProvider;
  includeTechniqueHints: boolean;
}

/**
 * A section of a prompt.
 */
export interface PromptSection {
  /** Section title (e.g., "Context", "Goal", "Constraints") */
  title: string;

  /** Section content */
  content: string;

  /** Section priority (higher = earlier in output) */
  priority: number;

  /** Whether this section is required */
  required: boolean;
}
```

### Step 3.2: Implement PromptRegistry (T-024 Reference)

```typescript
// src/domain/prompts/registry.ts

import type { PromptDomain, PromptGenerator } from './types.js';

/**
 * Registry for domain-specific prompt generators.
 *
 * Singleton pattern ensures consistent registration across the application.
 *
 * @example
 * ```typescript
 * const registry = PromptRegistry.getInstance();
 * registry.register(new HierarchicalGenerator());
 * const generator = registry.get('hierarchical');
 * ```
 */
export class PromptRegistry {
  private static instance: PromptRegistry | null = null;
  private generators: Map<PromptDomain, PromptGenerator> = new Map();

  private constructor() {}

  /**
   * Get the singleton registry instance.
   */
  static getInstance(): PromptRegistry {
    if (!PromptRegistry.instance) {
      PromptRegistry.instance = new PromptRegistry();
    }
    return PromptRegistry.instance;
  }

  /**
   * Reset the registry (for testing).
   */
  static resetInstance(): void {
    PromptRegistry.instance = null;
  }

  /**
   * Register a prompt generator for a domain.
   *
   * @param generator - Generator to register
   * @throws Error if domain already registered
   */
  register(generator: PromptGenerator): void {
    if (this.generators.has(generator.domain)) {
      throw new Error(
        `Generator for domain '${generator.domain}' is already registered. ` +
        `Use forceRegister() to override.`
      );
    }
    this.generators.set(generator.domain, generator);
  }

  /**
   * Force register a generator, overwriting existing.
   */
  forceRegister(generator: PromptGenerator): void {
    this.generators.set(generator.domain, generator);
  }

  /**
   * Get a generator by domain.
   *
   * @param domain - Domain to look up
   * @throws Error if domain not registered
   */
  get(domain: PromptDomain): PromptGenerator {
    const generator = this.generators.get(domain);
    if (!generator) {
      const available = this.list().join(', ');
      throw new Error(
        `No generator registered for domain '${domain}'. ` +
        `Available domains: ${available || 'none'}`
      );
    }
    return generator;
  }

  /**
   * Check if a domain is registered.
   */
  has(domain: PromptDomain): boolean {
    return this.generators.has(domain);
  }

  /**
   * List all registered domains.
   */
  list(): PromptDomain[] {
    return Array.from(this.generators.keys());
  }

  /**
   * Get count of registered generators.
   */
  get size(): number {
    return this.generators.size;
  }
}
```

### Step 3.3: Implement TemplateEngine (T-025 Reference)

```typescript
// src/domain/prompts/template-engine.ts

import type { PromptOutputFormat, PromptSection, PromptMetadata } from './types.js';

/**
 * Template rendering options.
 */
export interface RenderOptions {
  format: PromptOutputFormat;
  includeFrontmatter: boolean;
  includeMetadata: boolean;
}

/**
 * Engine for rendering prompt sections into final output.
 *
 * Handles:
 * - Section ordering by priority
 * - Frontmatter generation
 * - Format-specific rendering
 *
 * @example
 * ```typescript
 * const engine = new TemplateEngine();
 * const content = engine.render(sections, metadata, {
 *   format: 'prompt-md',
 *   includeFrontmatter: true,
 *   includeMetadata: true,
 * });
 * ```
 */
export class TemplateEngine {
  /**
   * Render sections into final prompt output.
   *
   * @param sections - Prompt sections to render
   * @param metadata - Prompt metadata
   * @param options - Rendering options
   * @returns Rendered prompt string
   */
  render(
    sections: PromptSection[],
    metadata: PromptMetadata,
    options: RenderOptions
  ): string {
    // Sort sections by priority (higher first)
    const sorted = [...sections].sort((a, b) => b.priority - a.priority);

    switch (options.format) {
      case 'json':
        return this.renderJson(sorted, metadata);
      case 'yaml':
        return this.renderYaml(sorted, metadata);
      case 'prompt-md':
        return this.renderPromptMd(sorted, metadata, options);
      case 'markdown':
      default:
        return this.renderMarkdown(sorted, metadata, options);
    }
  }

  /**
   * Estimate token count for content.
   * Uses rough approximation of 4 characters per token.
   */
  estimateTokens(content: string): number {
    return Math.ceil(content.length / 4);
  }

  private renderMarkdown(
    sections: PromptSection[],
    metadata: PromptMetadata,
    options: RenderOptions
  ): string {
    const parts: string[] = [];

    // Title
    if (metadata.title) {
      parts.push(`# ${metadata.title}\n`);
    }

    // Sections
    for (const section of sections) {
      parts.push(`## ${section.title}\n`);
      parts.push(section.content);
      parts.push('');
    }

    // Metadata footer
    if (options.includeMetadata) {
      parts.push('---');
      parts.push(`*Generated by UnifiedPromptBuilder v${metadata.version}*`);
      parts.push(`*Domain: ${metadata.domain} | Provider: ${metadata.provider}*`);
      parts.push(`*Generated: ${metadata.generatedAt}*`);
    }

    return parts.join('\n');
  }

  private renderPromptMd(
    sections: PromptSection[],
    metadata: PromptMetadata,
    options: RenderOptions
  ): string {
    const parts: string[] = [];

    // YAML frontmatter
    if (options.includeFrontmatter) {
      parts.push('---');
      parts.push(`mode: agent`);
      parts.push(`model: ${this.getModelFromProvider(metadata.provider)}`);
      parts.push(`tools: [githubRepo, codebase, editFiles]`);
      parts.push(`description: "${metadata.title || 'Generated prompt'}"`);
      parts.push('---');
      parts.push('');
    }

    // Add markdown content
    parts.push(this.renderMarkdown(sections, metadata, { ...options, includeMetadata: false }));

    return parts.join('\n');
  }

  private renderJson(sections: PromptSection[], metadata: PromptMetadata): string {
    return JSON.stringify(
      {
        metadata,
        sections: sections.map(s => ({
          title: s.title,
          content: s.content,
        })),
      },
      null,
      2
    );
  }

  private renderYaml(sections: PromptSection[], metadata: PromptMetadata): string {
    const lines = [
      'metadata:',
      `  domain: ${metadata.domain}`,
      `  provider: ${metadata.provider}`,
      `  version: ${metadata.version}`,
      `  generatedAt: ${metadata.generatedAt}`,
      '',
      'sections:',
    ];

    for (const section of sections) {
      lines.push(`  - title: "${section.title}"`);
      lines.push(`    content: |`);
      for (const line of section.content.split('\n')) {
        lines.push(`      ${line}`);
      }
    }

    return lines.join('\n');
  }

  private getModelFromProvider(provider: string): string {
    const modelMap: Record<string, string> = {
      'gpt-4.1': 'gpt-4.1',
      'gpt-5': 'gpt-5',
      'claude-opus-4.1': 'claude-opus-4.1',
      'claude-sonnet-4': 'claude-sonnet-4',
      'gemini-2.5-pro': 'gemini-2.5-pro',
      'other': 'gpt-4.1',
    };
    return modelMap[provider] || 'gpt-4.1';
  }
}
```

### Step 3.4: Implement UnifiedPromptBuilder

```typescript
// src/domain/prompts/unified-prompt-builder.ts

import { z } from 'zod';
import { PromptRegistry } from './registry.js';
import { TemplateEngine, type RenderOptions } from './template-engine.js';
import type {
  PromptDomain,
  PromptGenerator,
  GeneratorOptions,
  PromptOutputFormat,
  PromptProvider,
  PromptRequest,
  PromptResult,
  PromptSection,
  PromptTechnique,
} from './types.js';

/**
 * Default values for prompt building.
 */
const DEFAULTS = {
  provider: 'claude-sonnet-4' as PromptProvider,
  outputFormat: 'prompt-md' as PromptOutputFormat,
  includeFrontmatter: true,
  includeMetadata: true,
  includeTechniqueHints: true,
} as const;

/**
 * Builder version for tracking.
 */
const VERSION = '0.14.0';

/**
 * Unified entry point for all prompt generation.
 *
 * Replaces 12+ individual prompt builders with a single, extensible system.
 * Uses a registry pattern for domain-specific generators and a template
 * engine for consistent output rendering.
 *
 * @example
 * ```typescript
 * const builder = new UnifiedPromptBuilder();
 *
 * // Build a hierarchical prompt
 * const result = await builder.build({
 *   domain: 'hierarchical',
 *   context: {
 *     goal: 'Implement authentication',
 *     requirements: ['OAuth2 support', 'JWT tokens'],
 *   },
 *   techniques: ['chain-of-thought'],
 *   provider: 'claude-sonnet-4',
 * });
 *
 * console.log(result.content);
 * ```
 */
export class UnifiedPromptBuilder {
  private readonly registry: PromptRegistry;
  private readonly templateEngine: TemplateEngine;

  constructor(
    registry?: PromptRegistry,
    templateEngine?: TemplateEngine
  ) {
    this.registry = registry ?? PromptRegistry.getInstance();
    this.templateEngine = templateEngine ?? new TemplateEngine();
  }

  /**
   * Build a prompt for the specified domain.
   *
   * @param request - Prompt build request
   * @returns Generated prompt with metadata and stats
   * @throws Error if domain not registered or validation fails
   */
  async build<TContext extends Record<string, unknown>>(
    request: PromptRequest<TContext>
  ): Promise<PromptResult> {
    const startTime = Date.now();

    // Get generator for domain
    const generator = this.registry.get(request.domain);

    // Validate context against generator schema
    const validatedContext = this.validateContext(generator, request.context);

    // Determine techniques to apply
    const techniques = this.selectTechniques(generator, validatedContext, request);

    // Build generator options
    const options: GeneratorOptions = {
      techniques,
      provider: request.provider ?? DEFAULTS.provider,
      includeTechniqueHints: request.includeTechniqueHints ?? DEFAULTS.includeTechniqueHints,
    };

    // Generate sections
    const sections = await generator.generate(validatedContext, options);

    // Build metadata
    const metadata = {
      domain: request.domain,
      provider: options.provider,
      generatedAt: new Date().toISOString(),
      version: VERSION,
      title: request.title,
    };

    // Render to final output
    const renderOptions: RenderOptions = {
      format: request.outputFormat ?? DEFAULTS.outputFormat,
      includeFrontmatter: request.includeFrontmatter ?? DEFAULTS.includeFrontmatter,
      includeMetadata: request.includeMetadata ?? DEFAULTS.includeMetadata,
    };

    const content = this.templateEngine.render(sections, metadata, renderOptions);

    return {
      content,
      metadata,
      techniques,
      stats: {
        estimatedTokens: this.templateEngine.estimateTokens(content),
        sectionCount: sections.length,
        generationTimeMs: Date.now() - startTime,
      },
    };
  }

  /**
   * Build multiple prompts in batch.
   *
   * @param requests - Array of prompt requests
   * @returns Array of results (in same order as requests)
   */
  async buildBatch<TContext extends Record<string, unknown>>(
    requests: PromptRequest<TContext>[]
  ): Promise<PromptResult[]> {
    return Promise.all(requests.map(req => this.build(req)));
  }

  /**
   * Get list of available domains.
   */
  getAvailableDomains(): PromptDomain[] {
    return this.registry.list();
  }

  /**
   * Check if a domain is supported.
   */
  supportsDomain(domain: PromptDomain): boolean {
    return this.registry.has(domain);
  }

  /**
   * Get recommended techniques for a domain and context.
   */
  getRecommendedTechniques<TContext extends Record<string, unknown>>(
    domain: PromptDomain,
    context: TContext
  ): PromptTechnique[] {
    const generator = this.registry.get(domain);
    const validated = this.validateContext(generator, context);
    return generator.recommendTechniques(validated);
  }

  /**
   * Validate context against generator schema.
   */
  private validateContext<TContext>(
    generator: PromptGenerator,
    context: TContext
  ): TContext {
    try {
      return generator.contextSchema.parse(context) as TContext;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const issues = error.issues
          .map(i => `  - ${i.path.join('.')}: ${i.message}`)
          .join('\n');
        throw new Error(
          `Invalid context for domain '${generator.domain}':\n${issues}`
        );
      }
      throw error;
    }
  }

  /**
   * Select techniques based on request and generator recommendations.
   */
  private selectTechniques<TContext>(
    generator: PromptGenerator,
    context: TContext,
    request: PromptRequest
  ): PromptTechnique[] {
    // Use explicit techniques if provided
    if (request.techniques && request.techniques.length > 0) {
      return request.techniques;
    }

    // Otherwise, get recommendations from generator
    return generator.recommendTechniques(context);
  }
}

/**
 * Create a pre-configured UnifiedPromptBuilder.
 *
 * Convenience function that ensures the registry is populated
 * with all built-in generators.
 */
export function createPromptBuilder(): UnifiedPromptBuilder {
  // In production, this would register all built-in generators
  // For now, return a builder with the default registry
  return new UnifiedPromptBuilder();
}
```

### Step 3.5: Create Example Domain Generator

```typescript
// src/domain/prompts/generators/hierarchical.ts

import { z } from 'zod';
import type {
  GeneratorOptions,
  PromptGenerator,
  PromptSection,
  PromptTechnique,
} from '../types.js';

/**
 * Context schema for hierarchical prompts.
 */
const HierarchicalContextSchema = z.object({
  goal: z.string().min(1).describe('The primary goal or objective'),
  context: z.string().optional().describe('Background context'),
  requirements: z.array(z.string()).optional().describe('Specific requirements'),
  constraints: z.array(z.string()).optional().describe('Constraints to follow'),
  outputFormat: z.string().optional().describe('Expected output format'),
  audience: z.string().optional().describe('Target audience'),
});

type HierarchicalContext = z.infer<typeof HierarchicalContextSchema>;

/**
 * Generator for hierarchical prompts.
 *
 * Creates structured prompts with clear goal, context, requirements,
 * and constraints sections.
 */
export class HierarchicalGenerator implements PromptGenerator<HierarchicalContext> {
  readonly domain = 'hierarchical' as const;
  readonly version = '1.0.0';
  readonly contextSchema = HierarchicalContextSchema;

  async generate(
    context: HierarchicalContext,
    options: GeneratorOptions
  ): Promise<PromptSection[]> {
    const sections: PromptSection[] = [];

    // Goal section (highest priority)
    sections.push({
      title: 'Goal',
      content: context.goal,
      priority: 100,
      required: true,
    });

    // Context section
    if (context.context) {
      sections.push({
        title: 'Context',
        content: context.context,
        priority: 90,
        required: false,
      });
    }

    // Requirements section
    if (context.requirements && context.requirements.length > 0) {
      const reqList = context.requirements
        .map((r, i) => `${i + 1}. ${r}`)
        .join('\n');
      sections.push({
        title: 'Requirements',
        content: reqList,
        priority: 80,
        required: false,
      });
    }

    // Constraints section
    if (context.constraints && context.constraints.length > 0) {
      const conList = context.constraints.map(c => `- ${c}`).join('\n');
      sections.push({
        title: 'Constraints',
        content: conList,
        priority: 70,
        required: false,
      });
    }

    // Output format section
    if (context.outputFormat) {
      sections.push({
        title: 'Output Format',
        content: context.outputFormat,
        priority: 60,
        required: false,
      });
    }

    // Technique hints
    if (options.includeTechniqueHints && options.techniques.length > 0) {
      const hints = this.getTechniqueHints(options.techniques);
      if (hints) {
        sections.push({
          title: 'Approach Guidance',
          content: hints,
          priority: 50,
          required: false,
        });
      }
    }

    return sections;
  }

  recommendTechniques(context: HierarchicalContext): PromptTechnique[] {
    const techniques: PromptTechnique[] = [];

    // Complex goals benefit from chain-of-thought
    if (context.goal.length > 100 || context.requirements?.length! > 3) {
      techniques.push('chain-of-thought');
    }

    // Multiple constraints benefit from self-consistency
    if (context.constraints?.length! > 2) {
      techniques.push('self-consistency');
    }

    // Default to zero-shot if no specific recommendations
    if (techniques.length === 0) {
      techniques.push('zero-shot');
    }

    return techniques;
  }

  private getTechniqueHints(techniques: PromptTechnique[]): string | null {
    const hints: string[] = [];

    for (const technique of techniques) {
      switch (technique) {
        case 'chain-of-thought':
          hints.push('Think through this step by step, showing your reasoning.');
          break;
        case 'self-consistency':
          hints.push('Consider multiple approaches and verify consistency.');
          break;
        case 'tree-of-thoughts':
          hints.push('Explore different solution paths before committing.');
          break;
        case 'react':
          hints.push('Interleave reasoning and actions systematically.');
          break;
      }
    }

    return hints.length > 0 ? hints.join('\n') : null;
  }
}
```

### Step 3.6: Create Barrel Export

```typescript
// src/domain/prompts/index.ts

// Core classes
export { UnifiedPromptBuilder, createPromptBuilder } from './unified-prompt-builder.js';
export { PromptRegistry } from './registry.js';
export { TemplateEngine } from './template-engine.js';

// Types
export type {
  GeneratorOptions,
  PromptDomain,
  PromptGenerator,
  PromptMetadata,
  PromptOutputFormat,
  PromptProvider,
  PromptRequest,
  PromptResult,
  PromptSection,
  PromptStats,
  PromptTechnique,
} from './types.js';

// Generators
export { HierarchicalGenerator } from './generators/hierarchical.js';
```

---

## 4. Testing Strategy

### Step 4.1: Unit Tests

```typescript
// tests/vitest/domain/prompts/unified-prompt-builder.spec.ts

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  UnifiedPromptBuilder,
  PromptRegistry,
  TemplateEngine,
  HierarchicalGenerator,
} from '../../../../src/domain/prompts/index.js';

describe('UnifiedPromptBuilder', () => {
  let builder: UnifiedPromptBuilder;
  let registry: PromptRegistry;

  beforeEach(() => {
    // Reset registry to clean state
    PromptRegistry.resetInstance();
    registry = PromptRegistry.getInstance();

    // Register test generator
    registry.register(new HierarchicalGenerator());

    builder = new UnifiedPromptBuilder(registry);
  });

  afterEach(() => {
    PromptRegistry.resetInstance();
  });

  describe('build()', () => {
    it('should generate a hierarchical prompt', async () => {
      const result = await builder.build({
        domain: 'hierarchical',
        context: {
          goal: 'Implement user authentication',
          requirements: ['OAuth2 support', 'JWT tokens'],
        },
      });

      expect(result.content).toContain('# Goal');
      expect(result.content).toContain('Implement user authentication');
      expect(result.content).toContain('Requirements');
      expect(result.metadata.domain).toBe('hierarchical');
      expect(result.stats.estimatedTokens).toBeGreaterThan(0);
    });

    it('should apply requested techniques', async () => {
      const result = await builder.build({
        domain: 'hierarchical',
        context: {
          goal: 'Complex multi-step task',
        },
        techniques: ['chain-of-thought'],
        includeTechniqueHints: true,
      });

      expect(result.techniques).toContain('chain-of-thought');
      expect(result.content).toContain('step by step');
    });

    it('should auto-recommend techniques when not specified', async () => {
      const result = await builder.build({
        domain: 'hierarchical',
        context: {
          goal: 'A very long and complex goal that requires deep analysis and multiple considerations to solve effectively',
          requirements: ['req1', 'req2', 'req3', 'req4'],
        },
      });

      // Should auto-recommend chain-of-thought for complex goals
      expect(result.techniques).toContain('chain-of-thought');
    });

    it('should throw for unregistered domain', async () => {
      await expect(
        builder.build({
          domain: 'nonexistent' as any,
          context: {},
        })
      ).rejects.toThrow("No generator registered for domain 'nonexistent'");
    });

    it('should throw for invalid context', async () => {
      await expect(
        builder.build({
          domain: 'hierarchical',
          context: {
            // Missing required 'goal' field
          } as any,
        })
      ).rejects.toThrow("Invalid context for domain 'hierarchical'");
    });
  });

  describe('output formats', () => {
    const baseContext = { goal: 'Test goal' };

    it('should render markdown format', async () => {
      const result = await builder.build({
        domain: 'hierarchical',
        context: baseContext,
        outputFormat: 'markdown',
      });

      expect(result.content).toContain('## Goal');
      expect(result.content).not.toContain('---\nmode:');
    });

    it('should render prompt-md format with frontmatter', async () => {
      const result = await builder.build({
        domain: 'hierarchical',
        context: baseContext,
        outputFormat: 'prompt-md',
        includeFrontmatter: true,
      });

      expect(result.content).toContain('---');
      expect(result.content).toContain('mode: agent');
    });

    it('should render JSON format', async () => {
      const result = await builder.build({
        domain: 'hierarchical',
        context: baseContext,
        outputFormat: 'json',
      });

      const parsed = JSON.parse(result.content);
      expect(parsed.metadata.domain).toBe('hierarchical');
      expect(parsed.sections).toBeInstanceOf(Array);
    });
  });

  describe('getAvailableDomains()', () => {
    it('should list registered domains', () => {
      const domains = builder.getAvailableDomains();
      expect(domains).toContain('hierarchical');
    });
  });

  describe('supportsDomain()', () => {
    it('should return true for registered domain', () => {
      expect(builder.supportsDomain('hierarchical')).toBe(true);
    });

    it('should return false for unregistered domain', () => {
      expect(builder.supportsDomain('nonexistent' as any)).toBe(false);
    });
  });

  describe('buildBatch()', () => {
    it('should build multiple prompts', async () => {
      const results = await builder.buildBatch([
        { domain: 'hierarchical', context: { goal: 'Goal 1' } },
        { domain: 'hierarchical', context: { goal: 'Goal 2' } },
      ]);

      expect(results).toHaveLength(2);
      expect(results[0].content).toContain('Goal 1');
      expect(results[1].content).toContain('Goal 2');
    });
  });
});
```

### Step 4.2: Run Tests

```bash
# Run tests
npm run test:vitest -- tests/vitest/domain/prompts/

# Run with coverage
npm run test:coverage:vitest -- --include="src/domain/prompts/**"

# Expected output: >90% coverage
```

---

## 5. Acceptance Criteria

| Criterion                                               | Status | Verification                   |
| ------------------------------------------------------- | ------ | ------------------------------ |
| Single entry point `UnifiedPromptBuilder`               | ⬜      | Class exported from barrel     |
| `PromptRegistry` for domain registration                | ⬜      | Singleton pattern works        |
| `TemplateEngine` for rendering                          | ⬜      | All formats render correctly   |
| Supports all output formats (md, json, yaml, prompt-md) | ⬜      | Unit tests pass                |
| Technique application                                   | ⬜      | Techniques appear in output    |
| Auto-recommendation of techniques                       | ⬜      | Generator recommendations work |
| Context validation with Zod                             | ⬜      | Invalid context throws         |
| 90% test coverage                                       | ⬜      | Coverage report confirms       |
| TypeScript strict mode                                  | ⬜      | `npm run type-check` passes    |

---

## 6. Migration Path

### Deprecating Old Builders

After UnifiedPromptBuilder is complete, old builders will be wrapped as facades:

```typescript
// src/tools/prompt/legacy-facades/hierarchical-facade.ts

import { emitDeprecationWarning } from '../../shared/deprecation.js';
import { UnifiedPromptBuilder } from '../../../domain/prompts/index.js';

/**
 * @deprecated Use UnifiedPromptBuilder instead
 */
export async function hierarchicalPromptBuilder(args: unknown) {
  emitDeprecationWarning({
    tool: 'hierarchical-prompt-builder',
    replacement: 'UnifiedPromptBuilder with domain: "hierarchical"',
    deprecatedIn: 'v0.14.0',
    removedIn: 'v0.15.0',
  });

  const builder = new UnifiedPromptBuilder();
  const result = await builder.build({
    domain: 'hierarchical',
    context: args as Record<string, unknown>,
  });

  return { content: [{ type: 'text', text: result.content }] };
}
```

---

## 7. References

| Document                            | Link                                                                                          |
| ----------------------------------- | --------------------------------------------------------------------------------------------- |
| ADR-003: Unified Prompt Ecosystem   | [adr.md](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/adr.md#adr-003)                                                                |
| Spec REQ-007, REQ-008, REQ-009      | [spec.md](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/spec.md)                                                                      |
| Current hierarchical-prompt-builder | [hierarchical-prompt-builder.ts](../../../../src/tools/prompt/hierarchical-prompt-builder.ts) |
| Prompt utilities                    | [prompt-utils.ts](../../../../src/tools/shared/prompt-utils.ts)                               |

---

*Task: T-026 | Phase: 2.5 | Priority: P0*
