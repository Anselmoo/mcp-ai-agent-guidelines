# T-041: Consolidate Design & Architecture Framework

**Task ID**: T-041
**Phase**: 3
**Priority**: P0
**Estimate**: 2h
**Owner**: @mcp-tool-builder
**Reviewer**: @code-reviewer
**Dependencies**: T-038

---

## 1. Overview

### What

Complete the 'Consolidate Design & Architecture Framework' work as specified in tasks.md and related issue templates.

### Why

- Aligns with the v0.14.x consolidation plan
- Ensures repeatable delivery across phases
- Reduces risk by documenting clear steps

### Deliverables

- Updated implementation for T-041
- Updated tests or validation evidence
- Documentation or notes as required

## 2. Context and Scope

### Current State

From spec.md baseline:
- `architecture-design-prompt-builder.ts` - Architecture prompts
- `l9-distinguished-engineer-prompt-builder.ts` - L9 engineering prompts
- `digital-enterprise-architect-prompt-builder.ts` - Enterprise prompts
- ~35% code duplication between these tools

### Target State

Per ADR-005 Framework Consolidation:
- Single `DesignArchitectureFramework` in `src/frameworks/design-architecture/`
- Unified interface with action-based routing
- Actions: `architecture`, `l9-engineering`, `enterprise-architect`
- Shared validation, output formatting, and template rendering

### Out of Scope

- Prompt content changes (only structural consolidation)
- Breaking external API (facades maintain compatibility)

## 3. Prerequisites

### Dependencies

- T-038: Framework Router implemented

### Target Files

- `src/frameworks/design-architecture/index.ts` (new)
- `src/frameworks/design-architecture/handler.ts`
- `src/frameworks/design-architecture/actions/` (3 actions)
- `src/frameworks/design-architecture/schema.ts`
- `src/frameworks/design-architecture/types.ts`

### Tooling

- Node.js 22.x
- Zod for schema validation
- Handlebars for template rendering

## 4. Implementation Guide

### Step 4.1: Create Framework Structure

```bash
mkdir -p src/frameworks/design-architecture/actions
```

### Step 4.2: Define Schema

**File**: `src/frameworks/design-architecture/schema.ts`
```typescript
import { z } from 'zod';

export const designArchitectureSchema = z.object({
  action: z.enum(['architecture', 'l9-engineering', 'enterprise-architect']),
  projectContext: z.string().optional(),
  requirements: z.array(z.string()).optional(),
  constraints: z.array(z.string()).optional(),
  technicalStack: z.array(z.string()).optional(),
  outputFormat: z.enum(['markdown', 'json']).default('markdown'),
});

export type DesignArchitectureInput = z.infer<typeof designArchitectureSchema>;
```

### Step 4.3: Implement Handler

**File**: `src/frameworks/design-architecture/handler.ts`
```typescript
import { designArchitectureSchema, DesignArchitectureInput } from './schema.js';
import { architectureAction } from './actions/architecture.js';
import { l9EngineeringAction } from './actions/l9-engineering.js';
import { enterpriseArchitectAction } from './actions/enterprise-architect.js';

const actionHandlers = {
  'architecture': architectureAction,
  'l9-engineering': l9EngineeringAction,
  'enterprise-architect': enterpriseArchitectAction,
};

export async function handleDesignArchitecture(input: unknown) {
  const validated = designArchitectureSchema.parse(input);
  const handler = actionHandlers[validated.action];
  return handler(validated);
}
```

### Step 4.4: Implement Actions

**File**: `src/frameworks/design-architecture/actions/architecture.ts`
```typescript
import { DesignArchitectureInput } from '../schema.js';
import { formatOutput } from '../../shared/output-formatter.js';

export async function architectureAction(input: DesignArchitectureInput) {
  // Consolidate logic from architecture-design-prompt-builder.ts
  const prompt = buildArchitecturePrompt(input);
  return formatOutput(prompt, input.outputFormat);
}
```

### Step 4.5: Register in Framework Router

```typescript
// In src/frameworks/registry.ts
import { handleDesignArchitecture } from './design-architecture/handler.js';

frameworkRouter.register('design-architecture', handleDesignArchitecture);
```

## 5. Testing Strategy

- Confirm architecture review approval
- Align with spec requirements
- Ensure follow-on implementation tasks reference the design

## 6. Risks and Mitigations

- Risk: Scope creep beyond tasks.md
  - Mitigation: Validate against acceptance criteria
- Risk: Integration regressions
  - Mitigation: Run targeted tests and CI checks

## 7. Acceptance Criteria

| Criterion                            | Status | Verification                                                   |
| ------------------------------------ | ------ | -------------------------------------------------------------- |
| Framework handler created            | ⬜      | File exists at `src/frameworks/design-architecture/handler.ts` |
| All 3 actions implemented            | ⬜      | `architecture`, `l9-engineering`, `enterprise-architect`       |
| Schema validates inputs              | ⬜      | Zod schema with TypeScript inference                           |
| Registered in router                 | ⬜      | `frameworkRouter.get('design-architecture')` returns handler   |
| Unit tests pass                      | ⬜      | `npm run test:vitest -- design-architecture`                   |
| Legacy tools route through framework | ⬜      | Old tool calls redirect to new handler                         |

---

## 8. References

- [spec.md](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/spec.md) - Framework Consolidation requirements
- [adr.md](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/adr.md) - ADR-005 (Framework Consolidation)
- [T-038](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/tasks/phase-3-consolidation/T-038-implement-framework-router.md) - Framework Router

---

*Task: T-041 | Phase: 3-Consolidation | Priority: P0*

## 8. References

- [spec.md](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/spec.md)
- [tasks.md](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/tasks.md)

---

*Task: T-041 | Phase: 3 | Priority: P0*
