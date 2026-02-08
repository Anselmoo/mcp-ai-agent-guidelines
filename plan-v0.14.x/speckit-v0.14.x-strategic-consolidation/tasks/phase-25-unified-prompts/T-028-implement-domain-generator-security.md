# T-028: Implement Domain Generator: Security

**Task ID**: T-028
**Phase**: 2.5
**Priority**: P0
**Estimate**: 3h
**Owner**: @mcp-tool-builder
**Reviewer**: @code-reviewer
**Dependencies**: T-026

---

## 1. Overview

### What

Complete the 'Implement Domain Generator: Security' work as specified in tasks.md and related issue templates.

### Why

- Aligns with the v0.14.x consolidation plan
- Ensures repeatable delivery across phases
- Reduces risk by documenting clear steps

### Deliverables

- Updated implementation for T-028
- Updated tests or validation evidence
- Documentation or notes as required

## 2. Context and Scope

### Current State

- Review existing modules and integrations
- Capture baseline behavior before changes

### Target State

- Implement Domain Generator: Security fully implemented per requirements
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

### Step 4.1: Create Security Domain Generator Template

Create `src/tools/templates/generators/security-domain.hbs`:

```handlebars
{{! Security Domain Generator Template }}
{{#with domain}}
// Security Domain: {{name}}
// Generated: {{../metadata.timestamp}}

import { z } from 'zod';
import type { SecurityConfig, ThreatModel, ComplianceFramework } from './types.js';

/**
 * {{description}}
 * Compliance: {{#each compliance}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
 */

// Security Schemas
export const threatModelSchema = z.object({
  threatId: z.string().describe('Unique threat identifier'),
  category: z.enum(['STRIDE', 'OWASP', 'CWE', 'CUSTOM']).describe('Threat category'),
  severity: z.enum(['critical', 'high', 'medium', 'low']).describe('Threat severity'),
  likelihood: z.enum(['certain', 'likely', 'possible', 'unlikely']).describe('Occurrence likelihood'),
  impact: z.string().describe('Impact description'),
  mitigation: z.string().describe('Mitigation strategy'),
});

export const securityConfigSchema = z.object({
  enableThreatModeling: z.boolean().default(true).describe('Enable threat modeling'),
  complianceFrameworks: z.array(z.string()).describe('Compliance frameworks'),
  securityLevel: z.enum(['basic', 'standard', 'strict']).default('standard'),
  auditLogging: z.boolean().default(true).describe('Enable audit logging'),
});

{{#each entities}}
// Security Entity: {{name}}
export interface {{pascalCase name}}Security {
  {{#each properties}}
  /** {{description}} */
  {{name}}: {{type}};
  {{/each}}
}
{{/each}}

// Security Functions
{{#each functions}}
/**
 * {{description}}
 * @security {{securityLevel}}
 */
export function {{name}}({{#each params}}{{name}}: {{type}}{{#unless @last}}, {{/unless}}{{/each}}): {{returnType}} {
  // Security validation
  {{#if requiresAudit}}
  auditLog('{{name}}', { params: arguments });
  {{/if}}
  // Implementation
}
{{/each}}
{{/with}}
```

### Step 4.2: Create Security Generator Logic

Create `src/tools/templates/generators/security-generator.ts`:

```typescript
import Handlebars from 'handlebars';
import { z } from 'zod';
import type { GeneratorResult, SecurityDomainConfig } from '../types.js';

export const securityDomainConfigSchema = z.object({
  name: z.string().min(1).describe('Security domain name'),
  description: z.string().describe('Domain description'),
  compliance: z.array(z.enum(['OWASP', 'SOC2', 'GDPR', 'HIPAA', 'PCI-DSS'])).describe('Compliance frameworks'),
  threatCategories: z.array(z.enum(['STRIDE', 'OWASP-Top10', 'CWE-Top25'])).optional(),
  securityLevel: z.enum(['basic', 'standard', 'strict']).default('standard'),
  entities: z.array(z.object({
    name: z.string(),
    properties: z.array(z.object({
      name: z.string(),
      type: z.string(),
      description: z.string(),
      sensitive: z.boolean().optional(),
    })),
  })).optional(),
  functions: z.array(z.object({
    name: z.string(),
    description: z.string(),
    params: z.array(z.object({ name: z.string(), type: z.string() })),
    returnType: z.string(),
    securityLevel: z.string(),
    requiresAudit: z.boolean().optional(),
  })).optional(),
});

export async function generateSecurityDomain(
  config: SecurityDomainConfig,
  templatePath: string
): Promise<GeneratorResult> {
  const validated = securityDomainConfigSchema.parse(config);

  const context = {
    domain: validated,
    metadata: {
      timestamp: new Date().toISOString(),
      generator: 'security-domain-generator',
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
    compliance: validated.compliance,
  };
}
```

### Step 4.3: Register Security Generator

Update `src/tools/templates/generators/index.ts`:

```typescript
export { generateSecurityDomain, securityDomainConfigSchema } from './security-generator.js';
```

### Step 4.4: Add Security-Specific Helpers

Update `src/tools/templates/helpers/security-helpers.ts`:

```typescript
import Handlebars from 'handlebars';

export function registerSecurityHelpers(): void {
  Handlebars.registerHelper('threatSeverityColor', (severity: string) => {
    const colors: Record<string, string> = {
      critical: 'red', high: 'orange', medium: 'yellow', low: 'green'
    };
    return colors[severity] || 'gray';
  });

  Handlebars.registerHelper('complianceBadge', (framework: string) => {
    return `[${framework}]`;
  });

  Handlebars.registerHelper('sensitiveField', (isSensitive: boolean) => {
    return isSensitive ? '@sensitive' : '';
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

*Task: T-028 | Phase: 2.5 | Priority: P0*
