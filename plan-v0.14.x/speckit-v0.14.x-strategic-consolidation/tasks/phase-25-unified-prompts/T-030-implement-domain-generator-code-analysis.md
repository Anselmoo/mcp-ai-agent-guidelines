# T-030: Implement Domain Generator: Code Analysis

**Task ID**: T-030
**Phase**: 2.5
**Priority**: P0
**Estimate**: 3h
**Owner**: @mcp-tool-builder
**Reviewer**: @code-reviewer
**Dependencies**: T-026

---

## 1. Overview

### What

Complete the 'Implement Domain Generator: Code Analysis' work as specified in tasks.md and related issue templates.

### Why

- Aligns with the v0.14.x consolidation plan
- Ensures repeatable delivery across phases
- Reduces risk by documenting clear steps

### Deliverables

- Updated implementation for T-030
- Updated tests or validation evidence
- Documentation or notes as required

## 2. Context and Scope

### Current State

- Review existing modules and integrations
- Capture baseline behavior before changes

### Target State

- Implement Domain Generator: Code Analysis fully implemented per requirements
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

### Step 4.1: Create Code Analysis Domain Generator Template

Create `src/tools/templates/generators/code-analysis-domain.hbs`:

```handlebars
{{! Code Analysis Domain Generator Template }}
{{#with domain}}
// Code Analysis Domain: {{name}}
// Generated: {{../metadata.timestamp}}

import { z } from 'zod';
import type { AnalysisConfig, CodeMetric, QualityRule } from './types.js';

/**
 * {{description}}
 * Analysis Types: {{#each analysisTypes}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
 */

// Analysis Configuration Schema
export const analysisConfigSchema = z.object({
  target: z.string().describe('Target file or directory'),
  analysisTypes: z.array(z.enum(['complexity', 'coverage', 'dependencies', 'security', 'style'])),
  thresholds: z.object({
    complexity: z.number().optional().describe('Max cyclomatic complexity'),
    coverage: z.number().optional().describe('Min coverage percentage'),
    duplicateThreshold: z.number().optional().describe('Max duplicate lines'),
  }).optional(),
  ignorePatterns: z.array(z.string()).optional().describe('Glob patterns to ignore'),
});

// Code Metric Schema
export const codeMetricSchema = z.object({
  name: z.string().describe('Metric name'),
  value: z.number().describe('Metric value'),
  unit: z.string().optional().describe('Unit of measurement'),
  threshold: z.number().optional().describe('Threshold for warnings'),
  status: z.enum(['pass', 'warn', 'fail']).describe('Metric status'),
});

{{#each analyzers}}
// Analyzer: {{name}}
export interface {{pascalCase name}}Analyzer {
  {{#each properties}}
  /** {{description}} */
  {{name}}: {{type}};
  {{/each}}
  analyze(source: string): AnalysisResult;
}
{{/each}}

// Analysis Functions
{{#each functions}}
/**
 * {{description}}
 * @complexity {{complexity}}
 */
export function {{name}}({{#each params}}{{name}}: {{type}}{{#unless @last}}, {{/unless}}{{/each}}): {{returnType}} {
  // Analysis implementation
}
{{/each}}
{{/with}}
```

### Step 4.2: Create Code Analysis Generator Logic

Create `src/tools/templates/generators/code-analysis-generator.ts`:

```typescript
import Handlebars from 'handlebars';
import { z } from 'zod';
import type { GeneratorResult, CodeAnalysisDomainConfig } from '../types.js';

export const codeAnalysisDomainConfigSchema = z.object({
  name: z.string().min(1).describe('Analysis domain name'),
  description: z.string().describe('Domain description'),
  analysisTypes: z.array(z.enum([
    'complexity', 'coverage', 'dependencies', 'security',
    'style', 'duplication', 'documentation'
  ])).describe('Types of analysis to include'),
  analyzers: z.array(z.object({
    name: z.string(),
    properties: z.array(z.object({
      name: z.string(),
      type: z.string(),
      description: z.string(),
    })),
  })).optional(),
  functions: z.array(z.object({
    name: z.string(),
    description: z.string(),
    params: z.array(z.object({ name: z.string(), type: z.string() })),
    returnType: z.string(),
    complexity: z.string().optional(),
  })).optional(),
  thresholds: z.object({
    complexity: z.number().optional(),
    coverage: z.number().optional(),
    duplication: z.number().optional(),
  }).optional(),
});

export async function generateCodeAnalysisDomain(
  config: CodeAnalysisDomainConfig,
  templatePath: string
): Promise<GeneratorResult> {
  const validated = codeAnalysisDomainConfigSchema.parse(config);

  const context = {
    domain: validated,
    metadata: {
      timestamp: new Date().toISOString(),
      generator: 'code-analysis-domain-generator',
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
    analysisTypes: validated.analysisTypes,
  };
}
```

### Step 4.3: Register Code Analysis Generator

Update `src/tools/templates/generators/index.ts`:

```typescript
export { generateCodeAnalysisDomain, codeAnalysisDomainConfigSchema } from './code-analysis-generator.js';
```

### Step 4.4: Add Analysis-Specific Helpers

Update `src/tools/templates/helpers/analysis-helpers.ts`:

```typescript
import Handlebars from 'handlebars';

export function registerAnalysisHelpers(): void {
  Handlebars.registerHelper('metricStatus', (value: number, threshold: number) => {
    if (value <= threshold * 0.8) return 'pass';
    if (value <= threshold) return 'warn';
    return 'fail';
  });

  Handlebars.registerHelper('complexityGrade', (complexity: number) => {
    if (complexity <= 5) return 'A';
    if (complexity <= 10) return 'B';
    if (complexity <= 20) return 'C';
    return 'D';
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

- [spec.md](../../spec.md)
- [tasks.md](../../tasks.md)

---

*Task: T-030 | Phase: 2.5 | Priority: P0*
