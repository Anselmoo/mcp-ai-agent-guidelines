# 🔧 P2-019: Implement SDDStrategy [parallel]

> **Parent**: [002-parent-phase2-domain-extraction.md](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/issues-draft/002-parent-phase2-domain-extraction.md)
> **Labels**: `phase-2`, `priority-high`, `parallel`, `copilot-suitable`, `mcp-serena`
> **Milestone**: M3: Domain Layer
> **Estimate**: 4 hours
> **Depends On**: P2-015
> **Blocks**: P2-025, P2-027

## Context

SDDStrategy generates Spec-Driven Development documents — three interconnected files (spec.md, plan.md, tasks.md) that form a complete development specification.

## Task Description

Implement SDDStrategy:

**Create `src/strategies/sdd-strategy.ts`:**
```typescript
import type { OutputStrategy, OutputArtifacts, OutputApproach } from './output-strategy.js';

export class SDDStrategy implements OutputStrategy<any> {
  readonly approach = OutputApproach.SDD;

  render(result: any): OutputArtifacts {
    return {
      primary: this.generateSpec(result),
      secondary: [
        this.generatePlan(result),
        this.generateTasks(result),
      ],
    };
  }

  supports(domainType: string): boolean {
    return ['SessionState', 'PromptResult'].includes(domainType);
  }

  private generateSpec(result: any): OutputDocument {
    const content = `# Specification: ${result.metadata?.title ?? 'Feature'}

## Overview

${this.extractOverview(result)}

## Requirements

### Functional Requirements

${this.extractFunctionalRequirements(result)}

### Non-Functional Requirements

${this.extractNonFunctionalRequirements(result)}

## Constraints

${this.extractConstraints(result)}

## Success Criteria

${this.extractSuccessCriteria(result)}
`;

    return { name: 'spec.md', content, format: 'markdown' };
  }

  private generatePlan(result: any): OutputDocument {
    const content = `# Implementation Plan

## Phases

${this.extractPhases(result)}

## Timeline

${this.extractTimeline(result)}

## Dependencies

${this.extractDependencies(result)}

## Risks

${this.extractRisks(result)}
`;

    return { name: 'plan.md', content, format: 'markdown' };
  }

  private generateTasks(result: any): OutputDocument {
    const content = `# Tasks

## Task List

${this.extractTasks(result)}

## Dependencies Graph

\`\`\`mermaid
${this.generateDependencyGraph(result)}
\`\`\`
`;

    return { name: 'tasks.md', content, format: 'markdown' };
  }

  // ... extraction methods
}
```

## Acceptance Criteria

- [ ] File created: `src/strategies/sdd-strategy.ts`
- [ ] Generates 3 documents: spec.md, plan.md, tasks.md
- [ ] Documents are interconnected (cross-references)
- [ ] Mermaid dependency graph in tasks.md
- [ ] Unit tests

## Files to Create

- `src/strategies/sdd-strategy.ts`
- `tests/vitest/strategies/sdd-strategy.spec.ts`

## Files to Modify

- `src/strategies/index.ts`

## Verification

```bash
npm run build && npm run test:vitest -- sdd-strategy
```

## References

- [SPEC-001: Output Strategy Layer](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-001-output-strategy-layer.md) §4.4
- [TASKS Phase 2](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/tasks/TASKS-phase-2-domain-extraction.md) P2-019
