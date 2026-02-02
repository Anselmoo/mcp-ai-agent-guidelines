# V-002: Verify Schema Description Coverage ≥80%

**Task ID**: V-002
**Phase**: Validation
**Priority**: P0 (Quality Gate)
**Estimate**: 1h
**Owner**: @mcp-tool-builder
**Reviewer**: @code-reviewer
**Dependencies**: T-046 (Schema Examples), T-063 (CI Integration)

---

## 1. Overview

### What

Validate that ≥80% of all Zod schema fields across the codebase have `.describe()` annotations. This ensures MCP tool inputs are self-documenting for LLM agents.

### Why

- **AC-002 Compliance**: Acceptance criteria requires ≥80% schema description coverage
- **LLM Discoverability**: Descriptions help AI agents understand tool parameters
- **NFR-001**: All Zod schemas must follow Pattern A with descriptions

### Deliverables

- Validation script execution with passing result
- Coverage report in `artifacts/schema-coverage-report.json`
- CI job green status

## 2. Context and Scope

### Current State

Zod schemas exist across 50+ files in `src/`. Many lack `.describe()` annotations:

```typescript
// BEFORE (no description)
z.object({
  title: z.string(),
  priority: z.enum(['high', 'medium', 'low']),
})

// AFTER (with descriptions)
z.object({
  title: z.string().describe('Document title'),
  priority: z.enum(['high', 'medium', 'low']).describe('Task priority level'),
})
```

### Target State

- All tool input schemas have ≥80% field coverage
- `validate_schema_examples` CI job passes
- Coverage report artifact generated

### Out of Scope

- Internal/private schemas (only public tool inputs)
- Runtime validation changes

## 3. Prerequisites

### Dependencies

| Task  | Status Required | Purpose                        |
| ----- | --------------- | ------------------------------ |
| T-046 | Complete        | Schema examples implementation |
| T-063 | Complete        | CI integration                 |

### Target Files

| File                                    | Purpose           |
| --------------------------------------- | ----------------- |
| `scripts/validate-schema-coverage.ts`   | Validation script |
| `artifacts/schema-coverage-report.json` | Output report     |
| `.github/workflows/ci.yml`              | CI job            |

## 4. Validation Guide

### Step 4.1: Run Validation Locally

```bash
# Execute schema coverage validation
npm run validate:schema-coverage

# Or directly with tsx
npx tsx scripts/validate-schema-coverage.ts
```

### Step 4.2: Interpret Results

```json
// artifacts/schema-coverage-report.json
{
  "timestamp": "2026-02-02T10:00:00Z",
  "summary": {
    "totalSchemas": 52,
    "totalFields": 487,
    "describedFields": 412,
    "coverage": 84.6,
    "threshold": 80,
    "passed": true
  },
  "files": [
    {
      "path": "src/tools/prompt/domain-neutral-prompt-builder.ts",
      "schema": "DomainNeutralSchema",
      "totalFields": 24,
      "describedFields": 22,
      "coverage": 91.7,
      "missingDescriptions": ["dataSchemas", "interfaces"]
    }
  ]
}
```

### Step 4.3: Fix Low-Coverage Schemas

If coverage < 80%:

```typescript
// Before
const MySchema = z.object({
  name: z.string(),
  count: z.number(),
});

// After
const MySchema = z.object({
  name: z.string().describe('Item name'),
  count: z.number().describe('Number of items'),
});
```

### Step 4.4: Verify CI Passes

```bash
# Trigger CI check
git push

# Or run locally
npm run quality
npm run validate:schema-coverage
```

## 5. Validation Script Reference

```typescript
// scripts/validate-schema-coverage.ts

import { globSync } from 'glob';
import * as ts from 'typescript';
import * as fs from 'fs';

interface CoverageResult {
  path: string;
  schema: string;
  totalFields: number;
  describedFields: number;
  coverage: number;
  missingDescriptions: string[];
}

function analyzeSchemaFile(filePath: string): CoverageResult[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true
  );

  const results: CoverageResult[] = [];
  // AST traversal to find z.object() calls and check for .describe()
  // ... implementation
  return results;
}

function main() {
  const files = globSync('src/**/*.ts');
  const allResults = files.flatMap(analyzeSchemaFile);

  const summary = {
    totalSchemas: allResults.length,
    totalFields: allResults.reduce((sum, r) => sum + r.totalFields, 0),
    describedFields: allResults.reduce((sum, r) => sum + r.describedFields, 0),
    coverage: 0,
    threshold: 80,
    passed: false,
  };

  summary.coverage = (summary.describedFields / summary.totalFields) * 100;
  summary.passed = summary.coverage >= summary.threshold;

  const report = { timestamp: new Date().toISOString(), summary, files: allResults };
  fs.writeFileSync('artifacts/schema-coverage-report.json', JSON.stringify(report, null, 2));

  console.log(`Schema Coverage: ${summary.coverage.toFixed(1)}%`);
  console.log(`Threshold: ${summary.threshold}%`);
  console.log(`Status: ${summary.passed ? 'PASSED ✅' : 'FAILED ❌'}`);

  process.exit(summary.passed ? 0 : 1);
}

main();
```

## 6. Risks and Mitigations

| Risk                   | Likelihood | Impact | Mitigation                       |
| ---------------------- | ---------- | ------ | -------------------------------- |
| False positives        | Medium     | Low    | Manual review of flagged schemas |
| Complex nested schemas | Medium     | Medium | Recursive field analysis         |
| Dynamic schemas        | Low        | Low    | Document exclusions              |

## 7. Acceptance Criteria

| Criterion        | Status | Verification                                   |
| ---------------- | ------ | ---------------------------------------------- |
| Coverage ≥80%    | ⬜      | `summary.passed === true`                      |
| Report generated | ⬜      | `artifacts/schema-coverage-report.json` exists |
| CI job passes    | ⬜      | GitHub Actions green                           |
| No regressions   | ⬜      | Coverage ≥ previous run                        |

---

## 8. References

- [spec.md - AC-002](../../spec.md)
- [T-046 Schema Examples](../phase-3-consolidation/T-046-schema-examples.md)
- [Zod .describe() docs](https://zod.dev/?id=describe)
- [NFR-001 Schema Pattern](../../spec.md#nfr-001)

---

*Task: V-002 | Phase: Validation | Priority: P0*
