# T-044: Consolidate Documentation Framework

**Task ID**: T-044
**Phase**: 3
**Priority**: P0
**Estimate**: 2h
**Owner**: @mcp-tool-builder
**Reviewer**: @code-reviewer
**Dependencies**: T-038

---

## 1. Overview

### What

Complete the 'Consolidate Documentation Framework' work as specified in tasks.md and related issue templates.

### Why

- Aligns with the v0.14.x consolidation plan
- Ensures repeatable delivery across phases
- Reduces risk by documenting clear steps

### Deliverables

- Updated implementation for T-044
- Updated tests or validation evidence
- Documentation or notes as required

## 2. Context and Scope

### Current State

From spec.md baseline:
- `documentation-generator-prompt-builder.ts` - Doc generation prompts
- `quick-prompts-builder.ts` - Quick reference generation
- Scattered documentation utilities

### Target State

Per ADR-005 Framework Consolidation:
- Single `DocumentationFramework` in `src/frameworks/documentation/`
- Actions: `api-reference`, `readme`, `migration-guide`, `quick-reference`
- Unified template engine and output formatting
- Shared JSDoc/TSDoc parsing

### Out of Scope

- Documentation hosting (just generation)
- Internationalization

## 3. Prerequisites

### Dependencies

- T-038: Framework Router implemented

### Target Files

- `src/frameworks/documentation/index.ts` (new)
- `src/frameworks/documentation/handler.ts`
- `src/frameworks/documentation/actions/` (4 actions)
- `src/frameworks/documentation/schema.ts`
- `src/frameworks/documentation/templates/`

### Tooling

- Node.js 22.x
- Handlebars for templates
- TypeScript Compiler API for JSDoc extraction

## 4. Implementation Guide

### Step 4.1: Define Schema

**File**: `src/frameworks/documentation/schema.ts`
```typescript
import { z } from 'zod';

export const documentationFrameworkSchema = z.object({
  action: z.enum(['api-reference', 'readme', 'migration-guide', 'quick-reference']),
  sourceFiles: z.array(z.string()).optional(),
  projectName: z.string().optional(),
  version: z.string().optional(),
  includeExamples: z.boolean().default(true),
  outputFormat: z.enum(['markdown', 'html', 'json']).default('markdown'),
});

export type DocumentationFrameworkInput = z.infer<typeof documentationFrameworkSchema>;
```

### Step 4.2: Implement Handler

**File**: `src/frameworks/documentation/handler.ts`
```typescript
import { documentationFrameworkSchema } from './schema.js';
import { apiReferenceAction } from './actions/api-reference.js';
import { readmeAction } from './actions/readme.js';
import { migrationGuideAction } from './actions/migration-guide.js';
import { quickReferenceAction } from './actions/quick-reference.js';

const actionHandlers = {
  'api-reference': apiReferenceAction,
  'readme': readmeAction,
  'migration-guide': migrationGuideAction,
  'quick-reference': quickReferenceAction,
};

export async function handleDocumentation(input: unknown) {
  const validated = documentationFrameworkSchema.parse(input);
  const handler = actionHandlers[validated.action];
  return handler(validated);
}
```

### Step 4.3: Implement API Reference Generator

**File**: `src/frameworks/documentation/actions/api-reference.ts`
```typescript
import { DocumentationFrameworkInput } from '../schema.js';
import { extractJSDoc } from '../jsdoc-extractor.js';
import { renderTemplate } from '../template-engine.js';

export async function apiReferenceAction(input: DocumentationFrameworkInput) {
  const docs = await extractJSDoc(input.sourceFiles ?? ['src/**/*.ts']);

  return renderTemplate('api-reference', {
    projectName: input.projectName ?? 'API Reference',
    version: input.version,
    modules: docs.modules,
    includeExamples: input.includeExamples,
  });
}
```

### Step 4.4: Create Templates

**File**: `src/frameworks/documentation/templates/api-reference.hbs`
```handlebars
# {{projectName}}{{#if version}} v{{version}}{{/if}}

{{#each modules}}
## {{name}}

{{description}}

{{#each functions}}
### `{{name}}({{params}})`

{{description}}

{{#if examples}}#### Examples
{{#each examples}}
```typescript
{{this}}
```
{{/each}}{{/if}}
{{/each}}
{{/each}}
```

## 5. Testing Strategy

- Validate code examples manually
- Ensure docs build (if applicable)
- Confirm links resolve

## 6. Risks and Mitigations

- Risk: Scope creep beyond tasks.md
  - Mitigation: Validate against acceptance criteria
- Risk: Integration regressions
  - Mitigation: Run targeted tests and CI checks

## 7. Acceptance Criteria

| Criterion                 | Status | Verification                                                    |
| ------------------------- | ------ | --------------------------------------------------------------- |
| Framework handler created | ⬜      | File exists at `src/frameworks/documentation/handler.ts`        |
| All 4 actions implemented | ⬜      | `api-reference`, `readme`, `migration-guide`, `quick-reference` |
| Templates created         | ⬜      | `src/frameworks/documentation/templates/` has `.hbs` files      |
| JSDoc extraction works    | ⬜      | `extractJSDoc` parses TypeScript files                          |
| Registered in router      | ⬜      | `frameworkRouter.get('documentation')` returns handler          |
| Unit tests pass           | ⬜      | `npm run test:vitest -- documentation`                          |

---

## 8. References

- [spec.md](../../spec.md) - Documentation requirements
- [adr.md](../../adr.md) - ADR-005 (Framework Consolidation)
- [T-038](./T-038-implement-framework-router.md) - Framework Router

---

*Task: T-044 | Phase: 3-Consolidation | Priority: P0*

---

## 8. References

- [spec.md](../../spec.md)
- [tasks.md](../../tasks.md)

---

*Task: T-044 | Phase: 3 | Priority: P0*
