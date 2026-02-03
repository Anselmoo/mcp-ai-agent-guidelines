# T-046: Implement GAP-002: Schema Examples for Zod

**Task ID**: T-046
**Phase**: 3
**Priority**: P0
**Estimate**: 6h
**Owner**: @mcp-tool-builder
**Reviewer**: @code-reviewer
**Dependencies**: None

---

## 1. Overview

### What

Add .describe() to all Zod schemas (≥80% coverage).

### Why

- Aligns with the v0.14.x consolidation plan
- Ensures repeatable delivery across phases
- Reduces risk by documenting clear steps

### Deliverables

- Updated implementation for T-046
- Updated tests or validation evidence
- Documentation or notes as required

## 2. Context and Scope

### Current State

- Review existing modules and integrations
- Capture baseline behavior before changes

### Target State

- Implement GAP-002: Schema Examples for Zod fully implemented per requirements
- Supporting tests/validation in place

### Out of Scope

- Unrelated refactors or non-task enhancements

## 3. Prerequisites

### Dependencies

- None

### Target Files

- `TBD`

### Tooling

- Node.js 22.x
- npm scripts from the root package.json

## 4. Implementation Guide

### Step 4.1: Create Schema Description Audit Script

Create `scripts/audit-schema-descriptions.ts`:

```typescript
import * as fs from 'node:fs';
import * as path from 'node:path';
import { glob } from 'glob';

interface SchemaAuditResult {
  file: string;
  totalSchemas: number;
  describedSchemas: number;
  undescribedSchemas: string[];
  coverage: number;
}

/**
 * Audit Zod schemas for .describe() usage
 * Identifies schemas missing descriptions for GAP-002 compliance
 */
export async function auditSchemaDescriptions(srcDir: string): Promise<SchemaAuditResult[]> {
  const files = await glob(`${srcDir}/**/*.ts`, { ignore: ['**/*.spec.ts', '**/*.test.ts'] });
  const results: SchemaAuditResult[] = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const result = analyzeFile(file, content);
    if (result.totalSchemas > 0) {
      results.push(result);
    }
  }

  return results;
}

function analyzeFile(filePath: string, content: string): SchemaAuditResult {
  // Pattern to match Zod schema definitions
  const schemaPattern = /z\.(string|number|boolean|array|object|enum|union|literal|optional|nullable)\s*\(/g;
  const describePattern = /\.describe\s*\(/g;

  const schemaMatches = content.match(schemaPattern) || [];
  const describeMatches = content.match(describePattern) || [];

  // Find undescribed schemas by line analysis
  const lines = content.split('\n');
  const undescribed: string[] = [];

  lines.forEach((line, index) => {
    if (schemaPattern.test(line) && !line.includes('.describe(')) {
      const varMatch = line.match(/(const|let)\s+(\w+)/);
      if (varMatch) {
        undescribed.push(`Line ${index + 1}: ${varMatch[2]}`);
      }
    }
  });

  return {
    file: filePath,
    totalSchemas: schemaMatches.length,
    describedSchemas: describeMatches.length,
    undescribedSchemas: undescribed,
    coverage: schemaMatches.length > 0
      ? (describeMatches.length / schemaMatches.length) * 100
      : 100,
  };
}
```

### Step 4.2: Add Descriptions to Existing Schemas

Update schema files to include `.describe()`. Example pattern:

```typescript
// Before (non-compliant)
export const sessionConfigSchema = z.object({
  sessionId: z.string(),
  goal: z.string(),
  requirements: z.array(z.string()),
});

// After (GAP-002 compliant)
export const sessionConfigSchema = z.object({
  sessionId: z.string()
    .min(1)
    .describe('Unique session identifier (e.g., "api-gateway-design-2024")'),
  goal: z.string()
    .describe('Primary design objective or problem statement'),
  requirements: z.array(z.string())
    .describe('List of functional and non-functional requirements'),
  coverageThreshold: z.number()
    .min(0)
    .max(100)
    .default(85)
    .describe('Minimum coverage percentage required (0-100)'),
  enablePivots: z.boolean()
    .default(true)
    .describe('Allow strategic pivots during design sessions'),
}).describe('Configuration for starting a new design session');
```

### Step 4.3: Create Automated Description Helper

Create `src/tools/shared/schema-utils.ts`:

```typescript
import { z } from 'zod';

/**
 * Helper to ensure all schema fields have descriptions
 * Throws if any field is missing a description
 */
export function describeSchema<T extends z.ZodRawShape>(
  shape: T,
  descriptions: Record<keyof T, string>
): z.ZodObject<T> {
  const described: Record<string, z.ZodTypeAny> = {};

  for (const [key, schema] of Object.entries(shape)) {
    const description = descriptions[key as keyof T];
    if (!description) {
      throw new Error(`Missing description for schema field: ${key}`);
    }
    described[key] = (schema as z.ZodTypeAny).describe(description);
  }

  return z.object(described as T);
}

// Usage example:
export const exampleSchema = describeSchema(
  {
    name: z.string(),
    count: z.number(),
  },
  {
    name: 'The name of the item',
    count: 'Number of items',
  }
);
```

### Step 4.4: Add npm Script and Coverage Check

Update `package.json`:

```json
{
  "scripts": {
    "audit:schemas": "tsx scripts/audit-schema-descriptions.ts src",
    "check:schema-coverage": "tsx scripts/audit-schema-descriptions.ts src --threshold=80"
  }
}
```

Create coverage enforcement in CI:

```yaml
# .github/workflows/quality.yml
- name: Check Schema Description Coverage
  run: npm run check:schema-coverage
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

*Task: T-046 | Phase: 3 | Priority: P0*
