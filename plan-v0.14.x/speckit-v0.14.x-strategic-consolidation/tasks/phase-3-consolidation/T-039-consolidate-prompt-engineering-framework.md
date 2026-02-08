# T-039: Consolidate Prompt Engineering Framework

**Task ID**: T-039
**Phase**: 3
**Priority**: P0
**Estimate**: 2h
**Owner**: @mcp-tool-builder
**Reviewer**: @code-reviewer
**Dependencies**: T-038

---

## 1. Overview

### What

Complete the 'Consolidate Prompt Engineering Framework' work as specified in tasks.md and related issue templates.

### Why

- Aligns with the v0.14.x consolidation plan
- Ensures repeatable delivery across phases
- Reduces risk by documenting clear steps

### Deliverables

- Updated implementation for T-039
- Updated tests or validation evidence
- Documentation or notes as required

## 2. Context and Scope

### Current State

- Review existing modules and integrations
- Capture baseline behavior before changes

### Target State

- Consolidate Prompt Engineering Framework fully implemented per requirements
- Supporting tests/validation in place

### Out of Scope

- Unrelated refactors or non-task enhancements

## 3. Prerequisites

### Dependencies

- T-038

### Target Files

- `TBD`

### Tooling

- Node.js 22.x
- npm scripts from the root package.json

## 4. Implementation Guide

### Step 4.1: Create Unified Prompt Engineering Interface

Create `src/tools/prompt/framework/prompt-framework.ts`:

```typescript
import { z } from 'zod';
import type { PromptConfig, PromptOutput, PromptTechnique } from './types.js';

/**
 * Unified Prompt Engineering Framework
 * Consolidates all prompt building patterns into a single coherent interface
 */

// Technique Registry Schema
export const techniqueSchema = z.enum([
  'zero-shot', 'few-shot', 'chain-of-thought', 'self-consistency',
  'in-context-learning', 'generate-knowledge', 'prompt-chaining',
  'tree-of-thoughts', 'meta-prompting', 'rag', 'react', 'art'
]).describe('Prompting technique');

// Unified Framework Config
export const promptFrameworkConfigSchema = z.object({
  // Core settings
  style: z.enum(['markdown', 'xml', 'json']).default('markdown'),
  provider: z.string().optional().describe('Target LLM provider'),
  model: z.string().optional().describe('Target model'),

  // Technique selection
  techniques: z.array(techniqueSchema).default(['zero-shot']),
  autoSelectTechniques: z.boolean().default(false),

  // Output settings
  includeFrontmatter: z.boolean().default(true),
  includeMetadata: z.boolean().default(true),
  includeReferences: z.boolean().default(false),
  includeTechniqueHints: z.boolean().default(true),

  // Content settings
  maxTokens: z.number().optional(),
  temperature: z.number().min(0).max(2).optional(),
});

export type PromptFrameworkConfig = z.infer<typeof promptFrameworkConfigSchema>;

// Framework Implementation
export class PromptFramework {
  constructor(private config: PromptFrameworkConfig) {}

  /**
   * Build a prompt using the configured techniques
   */
  async build(context: PromptBuildContext): Promise<PromptOutput> {
    const techniques = this.config.autoSelectTechniques
      ? this.selectTechniques(context)
      : this.config.techniques;

    const sections = await this.buildSections(context, techniques);
    return this.assemblePrompt(sections);
  }

  private selectTechniques(context: PromptBuildContext): PromptTechnique[] {
    const selected: PromptTechnique[] = [];

    if (context.examples && context.examples.length > 0) {
      selected.push('few-shot');
    }
    if (context.requiresReasoning) {
      selected.push('chain-of-thought');
    }
    if (context.hasKnowledgeBase) {
      selected.push('rag');
    }

    return selected.length > 0 ? selected : ['zero-shot'];
  }

  private async buildSections(
    context: PromptBuildContext,
    techniques: PromptTechnique[]
  ): Promise<PromptSection[]> {
    const sections: PromptSection[] = [];

    if (this.config.includeFrontmatter) {
      sections.push(this.buildFrontmatter(context));
    }

    sections.push(this.buildSystemSection(context));
    sections.push(this.buildTaskSection(context));

    for (const technique of techniques) {
      sections.push(await this.buildTechniqueSection(technique, context));
    }

    if (this.config.includeMetadata) {
      sections.push(this.buildMetadataSection());
    }

    return sections;
  }

  private assemblePrompt(sections: PromptSection[]): PromptOutput {
    const content = sections.map(s => s.content).join('\n\n');
    return {
      content,
      format: this.config.style,
      sections: sections.map(s => s.name),
      metadata: { timestamp: new Date().toISOString() },
    };
  }
}
```

### Step 4.2: Create Technique Implementations

Create `src/tools/prompt/framework/techniques/index.ts`:

```typescript
import type { TechniqueBuilder, PromptBuildContext, PromptSection } from '../types.js';

export const techniqueBuilders: Record<string, TechniqueBuilder> = {
  'zero-shot': buildZeroShot,
  'few-shot': buildFewShot,
  'chain-of-thought': buildChainOfThought,
  'self-consistency': buildSelfConsistency,
  'rag': buildRAG,
  'react': buildReAct,
};

function buildZeroShot(context: PromptBuildContext): PromptSection {
  return {
    name: 'task',
    content: `## Task\n\n${context.task}`,
  };
}

function buildFewShot(context: PromptBuildContext): PromptSection {
  const examples = context.examples?.map((ex, i) =>
    `### Example ${i + 1}\n\n**Input:** ${ex.input}\n**Output:** ${ex.output}`
  ).join('\n\n');

  return {
    name: 'examples',
    content: `## Examples\n\n${examples}`,
  };
}

function buildChainOfThought(context: PromptBuildContext): PromptSection {
  return {
    name: 'reasoning',
    content: `## Reasoning Process\n\nThink through this step by step:\n1. First, analyze the input\n2. Consider relevant constraints\n3. Generate potential solutions\n4. Evaluate and select the best approach\n5. Provide your final answer`,
  };
}
```

### Step 4.3: Create Framework Factory

Create `src/tools/prompt/framework/factory.ts`:

```typescript
import { PromptFramework, promptFrameworkConfigSchema } from './prompt-framework.js';
import type { PromptFrameworkConfig } from './prompt-framework.js';

let instance: PromptFramework | null = null;

export function createPromptFramework(config: Partial<PromptFrameworkConfig> = {}): PromptFramework {
  const validated = promptFrameworkConfigSchema.parse(config);
  return new PromptFramework(validated);
}

export function getPromptFramework(): PromptFramework {
  if (!instance) {
    instance = createPromptFramework();
  }
  return instance;
}
```

### Step 4.4: Export from Barrel

Update `src/tools/prompt/index.ts`:

```typescript
export { PromptFramework, promptFrameworkConfigSchema } from './framework/prompt-framework.js';
export { createPromptFramework, getPromptFramework } from './framework/factory.js';
export { techniqueBuilders } from './framework/techniques/index.js';
```

## 5. Testing Strategy

- Add/update unit tests for new logic
- Cover error handling and edge cases
- Run `npm run quality` before finalizing

## 6. Risks and Mitigations

- Risk: Scope creep beyond tasks.md
  - Mitigation: Validate against acceptance criteria
- Risk: Integration regressions
  - Mitigation: Run targeted tests and CI checks

## 7. Acceptance Criteria

| Criterion                                 | Status | Verification |
| ----------------------------------------- | ------ | ------------ |
| Implementation completed per requirements | ⬜      | TBD          |
| Integration points wired and documented   | ⬜      | TBD          |
| Quality checks pass                       | ⬜      | TBD          |

---

## 8. References

- [spec.md](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/spec.md)
- [tasks.md](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/tasks.md)

---

*Task: T-039 | Phase: 3 | Priority: P0*
