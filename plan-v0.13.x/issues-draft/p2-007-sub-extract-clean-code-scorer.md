# 🔧 P2-007: Extract Clean Code Scorer Domain Logic [serial]

> **Parent**: #696
> **Labels**: `phase-2`, `priority-high`, `serial`, `copilot-suitable`, `mcp-serena`
> **Milestone**: M3: Domain Layer
> **Estimate**: 4 hours
> **Depends On**: P2-005
> **Blocks**: P2-014

## Context

The `clean-code-scorer` tool calculates quality scores but returns formatted markdown. Extracting the scoring logic enables:
- Unit testing of scoring algorithms
- Different output formats (JSON, markdown tables, charts)
- Reuse in other analysis tools

## Task Description

Extract scoring logic from `clean-code-scorer`:

**Create `src/domain/analysis/code-scorer.ts`:**
```typescript
import type { ScoringResult, ScoreBreakdown } from './types.js';

export interface CodeScorerInput {
  hygieneMetrics?: HygieneMetrics;
  coverageMetrics?: CoverageMetrics;
  documentationMetrics?: DocumentationMetrics;
  securityMetrics?: SecurityMetrics;
}

export interface HygieneMetrics {
  outdatedPatterns: number;
  unusedDependencies: number;
  codeSmells: number;
}

export interface CoverageMetrics {
  lineCoverage: number;
  branchCoverage: number;
  functionCoverage: number;
}

export function calculateCleanCodeScore(input: CodeScorerInput): ScoringResult {
  const breakdown: ScoreBreakdown = {
    hygiene: calculateHygieneScore(input.hygieneMetrics),
    coverage: calculateCoverageScore(input.coverageMetrics),
    documentation: calculateDocumentationScore(input.documentationMetrics),
    security: calculateSecurityScore(input.securityMetrics),
  };

  const overallScore = weightedAverage(breakdown);
  const recommendations = generateRecommendations(breakdown);

  return { overallScore, breakdown, recommendations };
}

function calculateHygieneScore(metrics?: HygieneMetrics): number {
  if (!metrics) return 100;
  // Scoring logic...
}

function weightedAverage(breakdown: ScoreBreakdown): number {
  const weights = { hygiene: 0.25, coverage: 0.30, documentation: 0.20, security: 0.25 };
  // Calculation...
}

function generateRecommendations(breakdown: ScoreBreakdown): string[] {
  const recommendations: string[] = [];
  if (breakdown.coverage < 70) {
    recommendations.push('Increase test coverage to at least 70%');
  }
  // More recommendations...
  return recommendations;
}
```

## Acceptance Criteria

- [ ] Domain function created: `src/domain/analysis/code-scorer.ts`
- [ ] Returns `ScoringResult` with numeric scores and breakdown
- [ ] Scoring logic testable in isolation
- [ ] Original tool still works (calls domain then formats)
- [ ] Tests for domain function
- [ ] Scoring weights configurable

## Files to Create

- `src/domain/analysis/code-scorer.ts`
- `tests/vitest/domain/analysis/code-scorer.spec.ts`

## Files to Modify

- `src/tools/analysis/clean-code-scorer.ts`
- `src/domain/analysis/index.ts` — add export

## Verification

```bash
npm run build && npm run test:vitest -- code-scorer
```

## References

- [SPEC-001: Output Strategy Layer](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-001-output-strategy-layer.md)
- [TASKS Phase 2](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/tasks/TASKS-phase-2-domain-extraction.md) P2-007
