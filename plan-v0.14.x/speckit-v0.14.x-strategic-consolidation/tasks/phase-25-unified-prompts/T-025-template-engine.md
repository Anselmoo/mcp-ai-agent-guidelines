# T-025: Implement TemplateEngine

**Task ID**: T-025
**Phase**: 2.5 - Unified Prompts
**Priority**: P0 (Critical Path)
**Estimate**: 5 hours
**Owner**: @mcp-tool-builder
**Reviewer**: @architecture-advisor
**Dependencies**: T-024 (PromptRegistry)
**Blocks**: T-026 (UnifiedPromptBuilder)

---

## 1. Overview

### What

Create `TemplateEngine` - a composable prompt assembly system that:
- Composes sections from multiple generators
- Applies rendering templates (markdown, XML)
- Handles section ordering and deduplication
- Supports conditional sections based on config

### Why

Current prompt builders have:
- Duplicate section rendering logic
- Inconsistent frontmatter/metadata handling
- No shared template system
- Hard-coded output formats

### Target API

```typescript
const engine = new TemplateEngine();

// Compose sections from multiple sources
const prompt = engine.compose({
  sections: [
    ...hierarchicalResult.sections,
    ...securityResult.sections,
  ],
  style: 'markdown',
  options: {
    includeFrontmatter: true,
    includeMetadata: true,
    includeReferences: true,
    includeDisclaimer: false,
  },
});

// Output is fully rendered markdown/XML
console.log(prompt);
```

---

## 2. Implementation Guide

### Step 2.1: Define Template Types

```typescript
// src/domain/prompts/template-types.ts

import type { PromptSection, PromptStyle } from './types.js';

/**
 * Options for prompt composition.
 */
export interface CompositionOptions {
  /** Include YAML frontmatter */
  includeFrontmatter?: boolean;

  /** Include metadata section */
  includeMetadata?: boolean;

  /** Include references section */
  includeReferences?: boolean;

  /** Include disclaimer section */
  includeDisclaimer?: boolean;

  /** Custom frontmatter fields */
  frontmatter?: Record<string, unknown>;

  /** Custom metadata fields */
  metadata?: Record<string, unknown>;

  /** Reference links to include */
  references?: ReferenceLink[];

  /** Disclaimer text */
  disclaimerText?: string;
}

/**
 * Reference link for references section.
 */
export interface ReferenceLink {
  title: string;
  url: string;
  description?: string;
}

/**
 * Request to compose a prompt.
 */
export interface ComposeRequest {
  /** Sections to compose */
  sections: PromptSection[];

  /** Output style */
  style: PromptStyle;

  /** Composition options */
  options?: CompositionOptions;

  /** Title for the prompt */
  title?: string;

  /** Description for frontmatter */
  description?: string;
}

/**
 * Result from composition.
 */
export interface ComposeResult {
  /** Rendered prompt content */
  content: string;

  /** Sections that were rendered */
  renderedSections: string[];

  /** Token estimate for the prompt */
  tokenEstimate: number;

  /** Warnings during composition */
  warnings: string[];
}

/**
 * Renderer interface for different output styles.
 */
export interface SectionRenderer {
  /** Render a single section */
  renderSection(section: PromptSection): string;

  /** Render frontmatter */
  renderFrontmatter(data: Record<string, unknown>): string;

  /** Render metadata section */
  renderMetadata(metadata: Record<string, unknown>): string;

  /** Render references section */
  renderReferences(references: ReferenceLink[]): string;

  /** Render disclaimer */
  renderDisclaimer(text: string): string;

  /** Join rendered parts */
  join(parts: string[]): string;
}
```

### Step 2.2: Implement Markdown Renderer

```typescript
// src/domain/prompts/renderers/markdown-renderer.ts

import type {
  SectionRenderer,
  ReferenceLink
} from '../template-types.js';
import type { PromptSection } from '../types.js';

/**
 * Markdown renderer for prompt sections.
 */
export class MarkdownRenderer implements SectionRenderer {
  /**
   * Render a section as markdown.
   */
  renderSection(section: PromptSection): string {
    const lines: string[] = [];

    // Section header
    lines.push(`## ${section.title}`);
    lines.push('');

    // Section content
    lines.push(section.content);
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Render YAML frontmatter.
   */
  renderFrontmatter(data: Record<string, unknown>): string {
    const lines: string[] = ['---'];

    for (const [key, value] of Object.entries(data)) {
      lines.push(this.formatYamlLine(key, value));
    }

    lines.push('---');
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Render metadata section.
   */
  renderMetadata(metadata: Record<string, unknown>): string {
    const lines: string[] = [];

    lines.push('## Metadata');
    lines.push('');

    for (const [key, value] of Object.entries(metadata)) {
      lines.push(`- **${key}**: ${this.formatValue(value)}`);
    }

    lines.push('');

    return lines.join('\n');
  }

  /**
   * Render references section.
   */
  renderReferences(references: ReferenceLink[]): string {
    if (references.length === 0) {
      return '';
    }

    const lines: string[] = [];

    lines.push('## References');
    lines.push('');

    for (const ref of references) {
      if (ref.description) {
        lines.push(`- [${ref.title}](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/tasks/phase-25-unified-prompts/${ref.url}) - ${ref.description}`);
      } else {
        lines.push(`- [${ref.title}](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/tasks/phase-25-unified-prompts/${ref.url})`);
      }
    }

    lines.push('');

    return lines.join('\n');
  }

  /**
   * Render disclaimer section.
   */
  renderDisclaimer(text: string): string {
    const lines: string[] = [];

    lines.push('---');
    lines.push('');
    lines.push(`*${text}*`);
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Join rendered parts.
   */
  join(parts: string[]): string {
    return parts.filter(Boolean).join('\n');
  }

  // ============================================
  // Helpers
  // ============================================

  private formatYamlLine(key: string, value: unknown): string {
    if (Array.isArray(value)) {
      return `${key}:\n${value.map(v => `  - ${v}`).join('\n')}`;
    }
    if (typeof value === 'object' && value !== null) {
      return `${key}: ${JSON.stringify(value)}`;
    }
    if (typeof value === 'string' && value.includes('\n')) {
      return `${key}: |\n  ${value.split('\n').join('\n  ')}`;
    }
    return `${key}: ${value}`;
  }

  private formatValue(value: unknown): string {
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }
    return String(value);
  }
}
```

### Step 2.3: Implement XML Renderer

```typescript
// src/domain/prompts/renderers/xml-renderer.ts

import type {
  SectionRenderer,
  ReferenceLink
} from '../template-types.js';
import type { PromptSection } from '../types.js';

/**
 * XML renderer for prompt sections.
 *
 * Useful for Claude-style XML prompts.
 */
export class XmlRenderer implements SectionRenderer {
  /**
   * Render a section as XML.
   */
  renderSection(section: PromptSection): string {
    const tagName = this.toTagName(section.id);

    return `<${tagName}>
${this.escapeXml(section.content)}
</${tagName}>`;
  }

  /**
   * Render metadata as XML attributes.
   */
  renderFrontmatter(data: Record<string, unknown>): string {
    const attrs = Object.entries(data)
      .map(([k, v]) => `${k}="${this.escapeXml(String(v))}"`)
      .join(' ');

    return `<prompt ${attrs}>`;
  }

  /**
   * Render metadata section.
   */
  renderMetadata(metadata: Record<string, unknown>): string {
    const lines: string[] = ['<metadata>'];

    for (const [key, value] of Object.entries(metadata)) {
      lines.push(`  <${key}>${this.escapeXml(String(value))}</${key}>`);
    }

    lines.push('</metadata>');

    return lines.join('\n');
  }

  /**
   * Render references section.
   */
  renderReferences(references: ReferenceLink[]): string {
    if (references.length === 0) {
      return '';
    }

    const lines: string[] = ['<references>'];

    for (const ref of references) {
      lines.push(`  <reference url="${this.escapeXml(ref.url)}">`);
      lines.push(`    <title>${this.escapeXml(ref.title)}</title>`);
      if (ref.description) {
        lines.push(`    <description>${this.escapeXml(ref.description)}</description>`);
      }
      lines.push('  </reference>');
    }

    lines.push('</references>');

    return lines.join('\n');
  }

  /**
   * Render disclaimer section.
   */
  renderDisclaimer(text: string): string {
    return `<disclaimer>${this.escapeXml(text)}</disclaimer>`;
  }

  /**
   * Join rendered parts.
   */
  join(parts: string[]): string {
    return parts.filter(Boolean).join('\n\n');
  }

  // ============================================
  // Helpers
  // ============================================

  private toTagName(id: string): string {
    return id.toLowerCase().replace(/[^a-z0-9]/g, '-');
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
```

### Step 2.4: Implement TemplateEngine

```typescript
// src/domain/prompts/template-engine.ts

import type {
  ComposeRequest,
  ComposeResult,
  CompositionOptions,
  SectionRenderer,
} from './template-types.js';
import type { PromptSection, PromptStyle } from './types.js';
import { MarkdownRenderer } from './renderers/markdown-renderer.js';
import { XmlRenderer } from './renderers/xml-renderer.js';

/**
 * Default disclaimer text.
 */
const DEFAULT_DISCLAIMER =
  'This prompt was generated automatically. Review and adapt as needed.';

/**
 * TemplateEngine - composes prompt sections into final output.
 *
 * Features:
 * - Multiple output formats (markdown, XML)
 * - Section ordering and deduplication
 * - Optional frontmatter, metadata, references, disclaimer
 * - Token estimation
 *
 * @example
 * ```typescript
 * const engine = new TemplateEngine();
 *
 * const result = engine.compose({
 *   sections: [...],
 *   style: 'markdown',
 *   title: 'Code Review Prompt',
 *   options: {
 *     includeFrontmatter: true,
 *     includeReferences: true,
 *   },
 * });
 *
 * console.log(result.content);
 * ```
 */
export class TemplateEngine {
  private readonly renderers: Map<PromptStyle, SectionRenderer>;

  constructor() {
    this.renderers = new Map<PromptStyle, SectionRenderer>([
      ['markdown', new MarkdownRenderer()],
      ['xml', new XmlRenderer()],
    ]);
  }

  /**
   * Register a custom renderer.
   */
  registerRenderer(style: PromptStyle, renderer: SectionRenderer): void {
    this.renderers.set(style, renderer);
  }

  /**
   * Compose sections into a final prompt.
   */
  compose(request: ComposeRequest): ComposeResult {
    const {
      sections,
      style,
      options = {},
      title,
      description,
    } = request;

    const renderer = this.getRenderer(style);
    const warnings: string[] = [];

    // Deduplicate and sort sections
    const processedSections = this.processSections(sections, warnings);

    // Build parts
    const parts: string[] = [];

    // Frontmatter
    if (options.includeFrontmatter) {
      const frontmatterData = {
        title: title ?? 'Generated Prompt',
        description: description ?? '',
        generated: new Date().toISOString(),
        style,
        ...options.frontmatter,
      };
      parts.push(renderer.renderFrontmatter(frontmatterData));
    }

    // Title (for markdown without frontmatter)
    if (!options.includeFrontmatter && title && style === 'markdown') {
      parts.push(`# ${title}\n`);
    }

    // Main sections
    for (const section of processedSections) {
      parts.push(renderer.renderSection(section));
    }

    // Metadata
    if (options.includeMetadata) {
      const metadata = {
        sectionCount: processedSections.length,
        ...options.metadata,
      };
      parts.push(renderer.renderMetadata(metadata));
    }

    // References
    if (options.includeReferences && options.references?.length) {
      parts.push(renderer.renderReferences(options.references));
    }

    // Disclaimer
    if (options.includeDisclaimer) {
      const text = options.disclaimerText ?? DEFAULT_DISCLAIMER;
      parts.push(renderer.renderDisclaimer(text));
    }

    // Close XML wrapper if needed
    if (style === 'xml' && options.includeFrontmatter) {
      parts.push('</prompt>');
    }

    // Join and finalize
    const content = renderer.join(parts);

    return {
      content,
      renderedSections: processedSections.map(s => s.id),
      tokenEstimate: this.estimateTokens(content),
      warnings,
    };
  }

  // ============================================
  // Section Processing
  // ============================================

  /**
   * Deduplicate and sort sections by order.
   */
  private processSections(
    sections: PromptSection[],
    warnings: string[]
  ): PromptSection[] {
    const seen = new Map<string, PromptSection>();

    for (const section of sections) {
      if (seen.has(section.id)) {
        warnings.push(`Duplicate section "${section.id}" - keeping first occurrence`);
        continue;
      }
      seen.set(section.id, section);
    }

    // Sort by order
    return Array.from(seen.values()).sort((a, b) => a.order - b.order);
  }

  // ============================================
  // Helpers
  // ============================================

  private getRenderer(style: PromptStyle): SectionRenderer {
    const renderer = this.renderers.get(style);

    if (!renderer) {
      throw new Error(
        `No renderer for style: ${style}. ` +
        `Available: ${Array.from(this.renderers.keys()).join(', ')}`
      );
    }

    return renderer;
  }

  /**
   * Estimate token count.
   *
   * Uses simple heuristic: ~4 characters per token.
   */
  private estimateTokens(content: string): number {
    return Math.ceil(content.length / 4);
  }
}

/**
 * Default engine instance.
 */
export const templateEngine = new TemplateEngine();
```

### Step 2.5: Create Barrel Export

```typescript
// src/domain/prompts/index.ts

// Types
export type {
  PromptDomain,
  PromptTechnique,
  PromptStyle,
  BasePromptRequest,
  PromptSection,
  GeneratorResult,
  PromptGenerator,
  GeneratorFactory,
} from './types.js';

export type {
  CompositionOptions,
  ReferenceLink,
  ComposeRequest,
  ComposeResult,
  SectionRenderer,
} from './template-types.js';

// Registry
export { PromptRegistry, promptRegistry } from './registry.js';

// Template Engine
export { TemplateEngine, templateEngine } from './template-engine.js';

// Renderers
export { MarkdownRenderer } from './renderers/markdown-renderer.js';
export { XmlRenderer } from './renderers/xml-renderer.js';

// Registration
export { registerDefaultGenerators } from './register-defaults.js';
```

---

## 3. Test Coverage

```typescript
// tests/vitest/domain/prompts/template-engine.spec.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { TemplateEngine } from '../../../../src/domain/prompts/template-engine.js';
import type { PromptSection, PromptStyle } from '../../../../src/domain/prompts/types.js';

describe('TemplateEngine', () => {
  let engine: TemplateEngine;

  beforeEach(() => {
    engine = new TemplateEngine();
  });

  // ============================================
  // Basic Composition
  // ============================================

  describe('compose', () => {
    it('should compose sections into markdown', () => {
      const sections: PromptSection[] = [
        {
          id: 'context',
          title: 'Context',
          content: 'This is the context.',
          required: true,
          order: 1,
        },
        {
          id: 'goal',
          title: 'Goal',
          content: 'This is the goal.',
          required: true,
          order: 2,
        },
      ];

      const result = engine.compose({
        sections,
        style: 'markdown',
      });

      expect(result.content).toContain('## Context');
      expect(result.content).toContain('This is the context.');
      expect(result.content).toContain('## Goal');
      expect(result.content).toContain('This is the goal.');
    });

    it('should compose sections into XML', () => {
      const sections: PromptSection[] = [
        {
          id: 'context',
          title: 'Context',
          content: 'This is the context.',
          required: true,
          order: 1,
        },
      ];

      const result = engine.compose({
        sections,
        style: 'xml',
      });

      expect(result.content).toContain('<context>');
      expect(result.content).toContain('This is the context.');
      expect(result.content).toContain('</context>');
    });

    it('should sort sections by order', () => {
      const sections: PromptSection[] = [
        { id: 'c', title: 'C', content: 'C', required: true, order: 3 },
        { id: 'a', title: 'A', content: 'A', required: true, order: 1 },
        { id: 'b', title: 'B', content: 'B', required: true, order: 2 },
      ];

      const result = engine.compose({
        sections,
        style: 'markdown',
      });

      const aIndex = result.content.indexOf('## A');
      const bIndex = result.content.indexOf('## B');
      const cIndex = result.content.indexOf('## C');

      expect(aIndex).toBeLessThan(bIndex);
      expect(bIndex).toBeLessThan(cIndex);
    });
  });

  // ============================================
  // Deduplication
  // ============================================

  describe('deduplication', () => {
    it('should deduplicate sections with same id', () => {
      const sections: PromptSection[] = [
        { id: 'ctx', title: 'Context', content: 'First', required: true, order: 1 },
        { id: 'ctx', title: 'Context', content: 'Second', required: true, order: 1 },
      ];

      const result = engine.compose({
        sections,
        style: 'markdown',
      });

      expect(result.renderedSections).toHaveLength(1);
      expect(result.content).toContain('First');
      expect(result.content).not.toContain('Second');
    });

    it('should add warning for duplicates', () => {
      const sections: PromptSection[] = [
        { id: 'ctx', title: 'Context', content: 'First', required: true, order: 1 },
        { id: 'ctx', title: 'Context', content: 'Second', required: true, order: 1 },
      ];

      const result = engine.compose({
        sections,
        style: 'markdown',
      });

      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('Duplicate section');
    });
  });

  // ============================================
  // Options
  // ============================================

  describe('options', () => {
    const minimalSections: PromptSection[] = [
      { id: 'test', title: 'Test', content: 'Content', required: true, order: 1 },
    ];

    it('should include frontmatter when requested', () => {
      const result = engine.compose({
        sections: minimalSections,
        style: 'markdown',
        title: 'Test Prompt',
        options: {
          includeFrontmatter: true,
        },
      });

      expect(result.content).toContain('---');
      expect(result.content).toContain('title: Test Prompt');
    });

    it('should include references when provided', () => {
      const result = engine.compose({
        sections: minimalSections,
        style: 'markdown',
        options: {
          includeReferences: true,
          references: [
            { title: 'Doc', url: 'https://example.com' },
          ],
        },
      });

      expect(result.content).toContain('## References');
      expect(result.content).toContain('[Doc](https://example.com)');
    });

    it('should include disclaimer when requested', () => {
      const result = engine.compose({
        sections: minimalSections,
        style: 'markdown',
        options: {
          includeDisclaimer: true,
          disclaimerText: 'Custom disclaimer',
        },
      });

      expect(result.content).toContain('Custom disclaimer');
    });

    it('should include metadata when requested', () => {
      const result = engine.compose({
        sections: minimalSections,
        style: 'markdown',
        options: {
          includeMetadata: true,
          metadata: {
            version: '1.0.0',
            domain: 'test',
          },
        },
      });

      expect(result.content).toContain('## Metadata');
      expect(result.content).toContain('version');
    });
  });

  // ============================================
  // Token Estimation
  // ============================================

  describe('token estimation', () => {
    it('should estimate tokens', () => {
      const sections: PromptSection[] = [
        { id: 'test', title: 'Test', content: 'A'.repeat(1000), required: true, order: 1 },
      ];

      const result = engine.compose({
        sections,
        style: 'markdown',
      });

      // ~4 chars per token
      expect(result.tokenEstimate).toBeGreaterThan(250);
    });
  });

  // ============================================
  // Custom Renderer
  // ============================================

  describe('custom renderer', () => {
    it('should allow registering custom renderer', () => {
      const customRenderer = {
        renderSection: (s: PromptSection) => `CUSTOM: ${s.content}`,
        renderFrontmatter: () => '',
        renderMetadata: () => '',
        renderReferences: () => '',
        renderDisclaimer: () => '',
        join: (parts: string[]) => parts.join('|'),
      };

      engine.registerRenderer('markdown' as PromptStyle, customRenderer);

      const result = engine.compose({
        sections: [
          { id: 'test', title: 'Test', content: 'Hello', required: true, order: 1 },
        ],
        style: 'markdown',
      });

      expect(result.content).toContain('CUSTOM: Hello');
    });
  });
});
```

### Step 3.2: Renderer Tests

```typescript
// tests/vitest/domain/prompts/renderers/markdown-renderer.spec.ts

import { describe, it, expect } from 'vitest';
import { MarkdownRenderer } from '../../../../../src/domain/prompts/renderers/markdown-renderer.js';

describe('MarkdownRenderer', () => {
  const renderer = new MarkdownRenderer();

  describe('renderSection', () => {
    it('should render section with title', () => {
      const output = renderer.renderSection({
        id: 'context',
        title: 'Context',
        content: 'Test content',
        required: true,
        order: 1,
      });

      expect(output).toContain('## Context');
      expect(output).toContain('Test content');
    });
  });

  describe('renderFrontmatter', () => {
    it('should render YAML frontmatter', () => {
      const output = renderer.renderFrontmatter({
        title: 'Test',
        version: '1.0.0',
      });

      expect(output).toMatch(/^---/);
      expect(output).toContain('title: Test');
      expect(output).toContain('version: 1.0.0');
      expect(output).toMatch(/---$/m);
    });

    it('should handle array values', () => {
      const output = renderer.renderFrontmatter({
        tags: ['a', 'b', 'c'],
      });

      expect(output).toContain('tags:');
      expect(output).toContain('  - a');
    });
  });

  describe('renderReferences', () => {
    it('should render reference links', () => {
      const output = renderer.renderReferences([
        { title: 'Docs', url: 'https://example.com', description: 'Main docs' },
      ]);

      expect(output).toContain('## References');
      expect(output).toContain('[Docs](https://example.com) - Main docs');
    });

    it('should return empty for no references', () => {
      const output = renderer.renderReferences([]);
      expect(output).toBe('');
    });
  });
});
```

---

## 4. Acceptance Criteria

| Criterion               | Status | Verification         |
| ----------------------- | ------ | -------------------- |
| Markdown rendering      | ⬜      | Markdown test        |
| XML rendering           | ⬜      | XML test             |
| Section ordering        | ⬜      | Order test           |
| Section deduplication   | ⬜      | Dedup test           |
| Frontmatter support     | ⬜      | Frontmatter test     |
| Metadata support        | ⬜      | Metadata test        |
| References support      | ⬜      | References test      |
| Disclaimer support      | ⬜      | Disclaimer test      |
| Token estimation        | ⬜      | Token test           |
| Custom renderer support | ⬜      | Custom renderer test |
| 100% test coverage      | ⬜      | Coverage report      |

---

## 5. Usage Examples

### Basic Markdown Prompt

```typescript
import { templateEngine } from './domain/prompts/index.js';

const result = templateEngine.compose({
  sections: [
    {
      id: 'context',
      title: 'Context',
      content: 'Building a microservices authentication system.',
      required: true,
      order: 1,
    },
    {
      id: 'goal',
      title: 'Goal',
      content: 'Implement OAuth2 authorization flow with JWT tokens.',
      required: true,
      order: 2,
    },
    {
      id: 'requirements',
      title: 'Requirements',
      content: '- Support multiple providers\n- Token refresh\n- Secure storage',
      required: true,
      order: 3,
    },
  ],
  style: 'markdown',
  title: 'Authentication System Design',
  options: {
    includeFrontmatter: true,
    includeReferences: true,
    references: [
      { title: 'OAuth 2.0 Spec', url: 'https://oauth.net/2/' },
      { title: 'JWT RFC', url: 'https://tools.ietf.org/html/rfc7519' },
    ],
  },
});

console.log(result.content);
```

**Output:**

```markdown
---
title: Authentication System Design
description: ""
generated: 2025-01-15T10:30:00.000Z
style: markdown
---

## Context

Building a microservices authentication system.

## Goal

Implement OAuth2 authorization flow with JWT tokens.

## Requirements

- Support multiple providers
- Token refresh
- Secure storage

## References

- [OAuth 2.0 Spec](https://oauth.net/2/)
- [JWT RFC](https://tools.ietf.org/html/rfc7519)
```

---

## 6. References

| Document                          | Link                                                   |
| --------------------------------- | ------------------------------------------------------ |
| T-024: PromptRegistry             | [T-024-prompt-registry.md](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/tasks/phase-25-unified-prompts/T-024-prompt-registry.md) |
| T-026: UnifiedPromptBuilder       | [T-026-unified-builder.md](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/tasks/phase-25-unified-prompts/T-026-unified-builder.md) |
| ADR-003: Unified Prompt Ecosystem | [adr.md](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/adr.md#adr-003)                         |

---

*Task: T-025 | Phase: 2.5 | Priority: P0*
