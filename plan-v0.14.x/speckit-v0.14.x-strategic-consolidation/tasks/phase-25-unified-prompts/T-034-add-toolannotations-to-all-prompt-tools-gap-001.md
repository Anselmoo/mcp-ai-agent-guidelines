# T-034: Add ToolAnnotations to All Prompt Tools (GAP-001)

**Task ID**: T-034
**Phase**: 2.5
**Priority**: P0
**Estimate**: 6h
**Owner**: @mcp-tool-builder
**Reviewer**: @code-reviewer
**Dependencies**: T-026

---

## 1. Overview

### What

Complete the 'Add ToolAnnotations to All Prompt Tools (GAP-001)' work as specified in tasks.md and related issue templates.

### Why

- Aligns with the v0.14.x consolidation plan
- Ensures repeatable delivery across phases
- Reduces risk by documenting clear steps

### Deliverables

- Updated implementation for T-034
- Updated tests or validation evidence
- Documentation or notes as required

## 2. Context and Scope

### Current State

- Review existing modules and integrations
- Capture baseline behavior before changes

### Target State

- Add ToolAnnotations to All Prompt Tools (GAP-001) fully implemented per requirements
- Supporting tests/validation in place

### Out of Scope

- Unrelated refactors or non-task enhancements

## 3. Prerequisites

### Dependencies

- T-026

### Target Files

- `src/tools/shared/annotation-presets.ts`
- `src/index.ts`
- `src/schemas/flow-tool-schemas.ts`
- `scripts/validate-tool-annotations.ts`
- `package.json`

### Tooling

- Node.js 22.x
- npm scripts from the root package.json

## 4. Implementation Guide

### Step 4.1: Define ToolAnnotations Type

Create or update `src/tools/shared/tool-annotations.ts`:

```typescript
import { z } from 'zod';

/**
 * MCP 2025-03-26 ToolAnnotations for LLM hint behavior
 * @see https://spec.modelcontextprotocol.io/specification/2025-03-26/server/tools/
 */
export const toolAnnotationsSchema = z.object({
  /** Free-form hints for LLM behavior */
  title: z.string().optional().describe('Human-readable tool title'),
  readOnlyHint: z.boolean().optional().describe('Tool does not modify state'),
  destructiveHint: z.boolean().optional().describe('Tool may perform destructive operations'),
  idempotentHint: z.boolean().optional().describe('Repeated calls with same args have same effect'),
  openWorldHint: z.boolean().optional().describe('Tool interacts with external entities'),
}).describe('Hints for LLM behavior with this tool');

export type ToolAnnotations = z.infer<typeof toolAnnotationsSchema>;

// Predefined annotation sets for common tool types
export const READ_ONLY_ANNOTATIONS: ToolAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
};

export const GENERATOR_ANNOTATIONS: ToolAnnotations = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};

export const ANALYZER_ANNOTATIONS: ToolAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};
```

### Step 4.2: Update Prompt Tool Registration Pattern

Update each prompt tool in `src/index.ts` to include annotations:

```typescript
import { READ_ONLY_ANNOTATIONS, GENERATOR_ANNOTATIONS, ANALYZER_ANNOTATIONS } from './tools/shared/tool-annotations.js';

// Example: hierarchical-prompt-builder
server.tool(
  'hierarchical_prompt_builder',
  'Generate hierarchical prompts with multiple specificity levels',
  hierarchicalPromptBuilderSchema,
  {
    annotations: {
      ...GENERATOR_ANNOTATIONS,
      title: 'Hierarchical Prompt Builder',
    },
  },
  handleHierarchicalPromptBuilder
);

// Example: clean-code-scorer
server.tool(
  'clean_code_scorer',
  'Score code quality on a 0-100 scale',
  cleanCodeScorerSchema,
  {
    annotations: {
      ...ANALYZER_ANNOTATIONS,
      title: 'Clean Code Scorer',
    },
  },
  handleCleanCodeScorer
);

// Example: design-assistant
server.tool(
  'design_assistant',
  'Orchestrate multi-phase design workflows',
  designAssistantSchema,
  {
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false, // Sessions have state
      openWorldHint: false,
      title: 'Design Assistant',
    },
  },
  handleDesignAssistant
);
```

### Step 4.3: Validate All Tools Have Annotations

Create `scripts/validate-tool-annotations.ts`:

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { toolAnnotationsSchema, ToolAnnotations } from '../src/tools/shared/tool-annotations.js';

interface ToolValidationResult {
  toolName: string;
  hasAnnotations: boolean;
  annotations?: ToolAnnotations;
  errors?: string[];
}

export function validateToolAnnotations(server: Server): ToolValidationResult[] {
  const results: ToolValidationResult[] = [];

  for (const [name, tool] of server.getTools()) {
    const result: ToolValidationResult = {
      toolName: name,
      hasAnnotations: !!tool.annotations,
    };

    if (tool.annotations) {
      const parsed = toolAnnotationsSchema.safeParse(tool.annotations);
      if (parsed.success) {
        result.annotations = parsed.data;
      } else {
        result.errors = parsed.error.issues.map(i => i.message);
      }
    }

    results.push(result);
  }

  return results;
}
```

- Update barrel exports and registries
- Register new handler or service if required
- Add configuration entries where needed

### Step 4.4: Create Coverage Report

Add npm script to `package.json`:

```json
{
  "scripts": {
    "validate:annotations": "tsx scripts/validate-tool-annotations.ts"
  }
}
```

- Run unit tests for new logic
- Ensure TypeScript strict mode passes

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

*Task: T-034 | Phase: 2.5 | Priority: P0*
