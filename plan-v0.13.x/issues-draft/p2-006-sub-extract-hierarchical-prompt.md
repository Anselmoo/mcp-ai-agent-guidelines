# 🔧 P2-006: Extract Hierarchical Prompt Domain Logic [serial]

> **Parent**: #696
> **Labels**: `phase-2`, `priority-high`, `serial`, `copilot-suitable`, `mcp-serena`
> **Milestone**: M3: Domain Layer
> **Estimate**: 6 hours
> **Depends On**: P2-005
> **Blocks**: P2-014, P2-025

## Context

The `hierarchical-prompt-builder` tool currently mixes business logic (building prompts) with presentation (markdown formatting). Extracting the domain logic enables:
- Testing prompt building in isolation
- Outputting to different formats via OutputStrategy
- Reuse of logic across tools

## Task Description

Extract pure business logic from `hierarchical-prompt-builder` into domain layer:

**Create `src/domain/prompting/hierarchical-builder.ts`:**
```typescript
import type { PromptResult, PromptSection, PromptMetadata } from './types.js';

export interface HierarchicalPromptConfig {
  goal: string;
  context?: string;
  requirements?: string[];
  constraints?: string[];
  technique?: 'chain-of-thought' | 'few-shot' | 'zero-shot' | 'react';
  // ... other config from schema
}

export function buildHierarchicalPrompt(
  config: HierarchicalPromptConfig
): PromptResult {
  const sections: PromptSection[] = [];

  // Build context section
  if (config.context) {
    sections.push({
      name: 'Context',
      content: config.context,
      level: 1,
    });
  }

  // Build goal section
  sections.push({
    name: 'Goal',
    content: config.goal,
    level: 1,
  });

  // Build requirements section
  if (config.requirements?.length) {
    sections.push({
      name: 'Requirements',
      content: config.requirements.join('\n'),
      level: 2,
    });
  }

  // Calculate metadata
  const metadata: PromptMetadata = {
    technique: config.technique ?? 'zero-shot',
    complexity: calculateComplexity(config),
    estimatedTokens: estimateTokens(sections),
  };

  return { sections, metadata };
}

function calculateComplexity(config: HierarchicalPromptConfig): 'low' | 'medium' | 'high' {
  // Logic to determine complexity
}

function estimateTokens(sections: PromptSection[]): number {
  // Rough token estimation
}
```

**Update `src/tools/prompt/hierarchical-prompt-builder.ts`:**
```typescript
import { buildHierarchicalPrompt } from '../../domain/prompting/hierarchical-builder.js';

// Tool becomes thin wrapper:
export async function hierarchicalPromptBuilder(params: SchemaType) {
  // 1. Call domain function
  const result = buildHierarchicalPrompt(params);

  // 2. Format for current output (markdown)
  return formatAsMarkdown(result);
}

function formatAsMarkdown(result: PromptResult): string {
  // Convert PromptResult to markdown string
}
```

## Acceptance Criteria

- [ ] Domain function created: `src/domain/prompting/hierarchical-builder.ts`
- [ ] Returns `PromptResult` type (structured, not formatted)
- [ ] No markdown formatting in domain function
- [ ] Tool updated to call domain then format
- [ ] Original tool still works identically
- [ ] Tests for domain function
- [ ] No functionality regression

## Files to Create

- `src/domain/prompting/hierarchical-builder.ts`
- `tests/vitest/domain/prompting/hierarchical-builder.spec.ts`

## Files to Modify

- `src/tools/prompt/hierarchical-prompt-builder.ts`
- `src/domain/prompting/index.ts` — add export

## Verification

```bash
npm run build && npm run test:vitest && npm run test:integration
```

## References

- [SPEC-001: Output Strategy Layer](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-001-output-strategy-layer.md) §3.1
- [TASKS Phase 2](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/tasks/TASKS-phase-2-domain-extraction.md) P2-006
