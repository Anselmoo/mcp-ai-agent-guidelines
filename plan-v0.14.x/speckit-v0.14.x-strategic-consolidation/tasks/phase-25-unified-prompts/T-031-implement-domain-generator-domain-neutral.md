# T-031: Implement Domain Generator: Domain Neutral

**Task ID**: T-031
**Phase**: 2.5
**Priority**: P0
**Estimate**: 3h
**Owner**: @mcp-tool-builder
**Reviewer**: @code-reviewer
**Dependencies**: T-026

---

## 1. Overview

### What

Complete the 'Implement Domain Generator: Domain Neutral' work as specified in tasks.md and related issue templates.

### Why

- Aligns with the v0.14.x consolidation plan
- Ensures repeatable delivery across phases
- Reduces risk by documenting clear steps

### Deliverables

- Updated implementation for T-031
- Updated tests or validation evidence
- Documentation or notes as required

## 2. Context and Scope

### Current State

- Review existing modules and integrations
- Capture baseline behavior before changes

### Target State

- Implement Domain Generator: Domain Neutral fully implemented per requirements
- Supporting tests/validation in place

### Out of Scope

- Unrelated refactors or non-task enhancements

## 3. Prerequisites

### Dependencies

- T-026

### Target Files

- `TBD`

### Tooling

- Node.js 22.x
- npm scripts from the root package.json

## 4. Implementation Guide

### Step 4.1: Create Domain-Neutral Generator Template

Create `src/tools/templates/generators/domain-neutral.hbs`:

```handlebars
{{! Domain-Neutral Generator Template }}
{{#with domain}}
// Domain: {{name}}
// Generated: {{../metadata.timestamp}}
// Purpose: {{purpose}}

import { z } from 'zod';

/**
 * {{description}}
 * Domain Type: {{domainType}}
 * Cross-Domain: {{crossDomain}}
 */

// Configuration Schema
export const {{camelCase name}}ConfigSchema = z.object({
  {{#each configFields}}
  {{name}}: {{zodType}}.describe('{{description}}'),
  {{/each}}
});

// Domain Types
{{#each types}}
export type {{name}} = {
  {{#each properties}}
  /** {{description}} */
  {{name}}: {{type}};
  {{/each}}
};
{{/each}}

// Domain Interfaces
{{#each interfaces}}
/**
 * {{description}}
 */
export interface {{name}} {
  {{#each methods}}
  /** {{description}} */
  {{name}}({{#each params}}{{name}}: {{type}}{{#unless @last}}, {{/unless}}{{/each}}): {{returnType}};
  {{/each}}
}
{{/each}}

// Domain Functions
{{#each functions}}
/**
 * {{description}}
{{#if domain}}
 * @domain {{domain}}
{{/if}}
 */
export function {{name}}({{#each params}}{{name}}: {{type}}{{#unless @last}}, {{/unless}}{{/each}}): {{returnType}} {
  // Domain-neutral implementation
}
{{/each}}
{{/with}}
```

### Step 4.2: Create Domain-Neutral Generator Logic

Create `src/tools/templates/generators/domain-neutral-generator.ts`:

```typescript
import Handlebars from 'handlebars';
import { z } from 'zod';
import type { GeneratorResult, DomainNeutralConfig } from '../types.js';

export const domainNeutralConfigSchema = z.object({
  name: z.string().min(1).describe('Domain name'),
  description: z.string().describe('Domain description'),
  purpose: z.string().describe('Primary purpose'),
  domainType: z.enum(['utility', 'workflow', 'integration', 'analysis', 'generation']),
  crossDomain: z.boolean().default(false).describe('Is cross-domain applicable'),
  configFields: z.array(z.object({
    name: z.string(),
    zodType: z.string(),
    description: z.string(),
  })).optional(),
  types: z.array(z.object({
    name: z.string(),
    properties: z.array(z.object({
      name: z.string(),
      type: z.string(),
      description: z.string(),
    })),
  })).optional(),
  interfaces: z.array(z.object({
    name: z.string(),
    description: z.string(),
    methods: z.array(z.object({
      name: z.string(),
      description: z.string(),
      params: z.array(z.object({ name: z.string(), type: z.string() })),
      returnType: z.string(),
    })),
  })).optional(),
  functions: z.array(z.object({
    name: z.string(),
    description: z.string(),
    params: z.array(z.object({ name: z.string(), type: z.string() })),
    returnType: z.string(),
    domain: z.string().optional(),
  })).optional(),
});

export async function generateDomainNeutral(
  config: DomainNeutralConfig,
  templatePath: string
): Promise<GeneratorResult> {
  const validated = domainNeutralConfigSchema.parse(config);

  const context = {
    domain: validated,
    metadata: {
      timestamp: new Date().toISOString(),
      generator: 'domain-neutral-generator',
      version: '0.14.0',
    },
  };

  const template = await loadTemplate(templatePath);
  const compiled = Handlebars.compile(template);
  const output = compiled(context);

  return {
    success: true,
    output,
    metadata: context.metadata,
    domainType: validated.domainType,
  };
}
```

### Step 4.3: Register Domain-Neutral Generator

Update `src/tools/templates/generators/index.ts`:

```typescript
export { generateDomainNeutral, domainNeutralConfigSchema } from './domain-neutral-generator.js';
```

### Step 4.4: Add Domain-Neutral Helpers

Update `src/tools/templates/helpers/domain-helpers.ts`:

```typescript
import Handlebars from 'handlebars';

export function registerDomainNeutralHelpers(): void {
  Handlebars.registerHelper('zodType', (type: string) => {
    const zodMap: Record<string, string> = {
      string: 'z.string()', number: 'z.number()', boolean: 'z.boolean()',
      array: 'z.array(z.unknown())', object: 'z.object({})',
    };
    return zodMap[type] || 'z.unknown()';
  });

  Handlebars.registerHelper('domainTag', (domainType: string) => {
    return `@domain-${domainType}`;
  });
}
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

*Task: T-031 | Phase: 2.5 | Priority: P0*
