# 🔧 P2-022: Implement TOGAF/Enterprise Strategies [parallel]

> **Parent**: [002-parent-phase2-domain-extraction.md](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/issues-draft/002-parent-phase2-domain-extraction.md)
> **Labels**: `phase-2`, `priority-medium`, `parallel`, `copilot-suitable`, `mcp-serena`
> **Milestone**: M3: Domain Layer
> **Estimate**: 6 hours
> **Depends On**: P2-015
> **Blocks**: P2-025, P2-027

## Context

TOGAF and Enterprise strategies generate formal enterprise architecture documentation for large organizations. These are professional-grade outputs.

## Task Description

Implement TOGAFStrategy and EnterpriseStrategy:

**Create `src/strategies/togaf-strategy.ts`:**
```typescript
import type { OutputStrategy, OutputArtifacts, OutputApproach } from './output-strategy.js';

export class TOGAFStrategy implements OutputStrategy<any> {
  readonly approach = OutputApproach.TOGAF;

  render(result: any): OutputArtifacts {
    return {
      primary: this.generateArchitectureVision(result),
      secondary: [
        this.generateBusinessArchitecture(result),
        this.generateDataArchitecture(result),
        this.generateApplicationArchitecture(result),
        this.generateTechnologyArchitecture(result),
        this.generateMigrationPlan(result),
      ],
    };
  }

  supports(domainType: string): boolean {
    return ['SessionState'].includes(domainType);
  }

  private generateArchitectureVision(result: any): OutputDocument {
    const content = `# Architecture Vision Document

## Executive Summary

${this.extractExecutiveSummary(result)}

## Request for Architecture Work

${this.extractRequestForWork(result)}

## Business Goals and Drivers

${this.extractBusinessGoals(result)}

## Architecture Principles

${this.extractPrinciples(result)}

## Stakeholder Map

${this.extractStakeholders(result)}

## High-Level Architecture

${this.extractHighLevelArchitecture(result)}

## Risk Assessment

${this.extractRisks(result)}
`;

    return { name: 'architecture-vision.md', content, format: 'markdown' };
  }

  // ... other TOGAF phase documents
}
```

**Create `src/strategies/enterprise-strategy.ts`:**
```typescript
import type { OutputStrategy, OutputArtifacts, OutputApproach } from './output-strategy.js';

export class EnterpriseStrategy implements OutputStrategy<any> {
  readonly approach = OutputApproach.ENTERPRISE;

  render(result: any): OutputArtifacts {
    return {
      primary: this.generateExecutiveSummary(result),
      secondary: [
        this.generateBoardPresentation(result),
        this.generateDetailedAnalysis(result),
        this.generateImplementationRoadmap(result),
        this.generateBudgetEstimate(result),
      ],
    };
  }

  // ... enterprise-grade documents
}
```

## Acceptance Criteria

- [ ] `src/strategies/togaf-strategy.ts` with TOGAF ADM phases
- [ ] `src/strategies/enterprise-strategy.ts` with board-level docs
- [ ] TOGAF: Vision, BDAT architectures, Migration plan
- [ ] Enterprise: Executive summary, Board deck, Budget
- [ ] Unit tests for both strategies

## Files to Create

- `src/strategies/togaf-strategy.ts`
- `src/strategies/enterprise-strategy.ts`
- `tests/vitest/strategies/togaf-strategy.spec.ts`
- `tests/vitest/strategies/enterprise-strategy.spec.ts`

## Files to Modify

- `src/strategies/index.ts`

## Verification

```bash
npm run build && npm run test:vitest -- togaf enterprise
```

## References

- [SPEC-001: Output Strategy Layer](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-001-output-strategy-layer.md) §4.6-4.7
- [TOGAF Standard](https://www.opengroup.org/togaf)
- [TASKS Phase 2](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/tasks/TASKS-phase-2-domain-extraction.md) P2-022
