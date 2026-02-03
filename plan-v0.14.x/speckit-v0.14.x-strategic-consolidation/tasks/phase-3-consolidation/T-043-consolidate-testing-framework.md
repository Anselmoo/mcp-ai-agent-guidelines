# T-043: Consolidate Testing Framework

**Task ID**: T-043
**Phase**: 3
**Priority**: P0
**Estimate**: 2h
**Owner**: @mcp-tool-builder
**Reviewer**: @code-reviewer
**Dependencies**: T-038

---

## 1. Overview

### What

Complete the 'Consolidate Testing Framework' work as specified in tasks.md and related issue templates.

### Why

- Aligns with the v0.14.x consolidation plan
- Ensures repeatable delivery across phases
- Reduces risk by documenting clear steps

### Deliverables

- Updated implementation for T-043
- Updated tests or validation evidence
- Documentation or notes as required

## 2. Context and Scope

### Current State

From spec.md baseline:
- `iterative-coverage-enhancer.ts` - Coverage gap analysis
- `coverage-dashboard-design-prompt-builder.ts` - Dashboard UI prompts
- Separate test utilities across multiple files

### Target State

Per ADR-005 Framework Consolidation:
- Single `TestingFramework` in `src/frameworks/testing/`
- Actions: `coverage-analysis`, `gap-detection`, `dashboard-design`, `test-generation`
- Unified coverage metrics and threshold management
- Shared test pattern recommendations

### Out of Scope

- Actual test execution (delegated to Vitest)
- Test file generation (suggestions only)

## 3. Prerequisites

### Dependencies

- T-038: Framework Router implemented

### Target Files

- `src/frameworks/testing/index.ts` (new)
- `src/frameworks/testing/handler.ts`
- `src/frameworks/testing/actions/` (4 actions)
- `src/frameworks/testing/schema.ts`
- `src/frameworks/testing/coverage-analyzer.ts`

### Tooling

- Node.js 22.x
- Vitest for test execution
- c8/istanbul for coverage data

## 4. Implementation Guide

### Step 4.1: Define Schema

**File**: `src/frameworks/testing/schema.ts`
```typescript
import { z } from 'zod';

export const testingFrameworkSchema = z.object({
  action: z.enum(['coverage-analysis', 'gap-detection', 'dashboard-design', 'test-generation']),
  coverageReport: z.string().optional(),
  targetFiles: z.array(z.string()).optional(),
  threshold: z.number().min(0).max(100).default(90),
  includeUncovered: z.boolean().default(true),
  outputFormat: z.enum(['markdown', 'json']).default('markdown'),
});

export type TestingFrameworkInput = z.infer<typeof testingFrameworkSchema>;
```

### Step 4.2: Implement Handler

**File**: `src/frameworks/testing/handler.ts`
```typescript
import { testingFrameworkSchema } from './schema.js';
import { coverageAnalysisAction } from './actions/coverage-analysis.js';
import { gapDetectionAction } from './actions/gap-detection.js';
import { dashboardDesignAction } from './actions/dashboard-design.js';
import { testGenerationAction } from './actions/test-generation.js';

const actionHandlers = {
  'coverage-analysis': coverageAnalysisAction,
  'gap-detection': gapDetectionAction,
  'dashboard-design': dashboardDesignAction,
  'test-generation': testGenerationAction,
};

export async function handleTesting(input: unknown) {
  const validated = testingFrameworkSchema.parse(input);
  const handler = actionHandlers[validated.action];
  return handler(validated);
}
```

### Step 4.3: Implement Coverage Analysis

**File**: `src/frameworks/testing/actions/coverage-analysis.ts`
```typescript
import { TestingFrameworkInput } from '../schema.js';
import { parseLcov } from '../coverage-analyzer.js';

export async function coverageAnalysisAction(input: TestingFrameworkInput) {
  const coverage = input.coverageReport
    ? await parseLcov(input.coverageReport)
    : await parseLcov('coverage/lcov.info');

  const summary = {
    statements: coverage.statements.pct,
    branches: coverage.branches.pct,
    functions: coverage.functions.pct,
    lines: coverage.lines.pct,
  };

  const meetsThreshold = Object.values(summary).every(v => v >= input.threshold);

  return {
    summary,
    threshold: input.threshold,
    passes: meetsThreshold,
    filesBelow: coverage.files.filter(f => f.pct < input.threshold),
  };
}
```

## 5. Testing Strategy

- Run `npm run test:vitest` for focused suites
- Generate coverage with `npm run test:coverage:vitest`
- Ensure expected error codes are asserted

## 6. Risks and Mitigations

- Risk: Scope creep beyond tasks.md
  - Mitigation: Validate against acceptance criteria
- Risk: Integration regressions
  - Mitigation: Run targeted tests and CI checks

## 7. Acceptance Criteria

| Criterion                   | Status | Verification |
| --------------------------- | ------ | ------------ |
| Core paths covered by tests | ⬜      | TBD          |
| Failure paths validated     | ⬜      | TBD          |
| Coverage thresholds met     | ⬜      | TBD          |

---

## 8. References

- [spec.md](../../spec.md)
- [tasks.md](../../tasks.md)

---

*Task: T-043 | Phase: 3 | Priority: P0*
