# 🔧 P2-017: Implement RFCStrategy [parallel]

> **Parent**: [002-parent-phase2-domain-extraction.md](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/issues-draft/002-parent-phase2-domain-extraction.md)
> **Labels**: `phase-2`, `priority-high`, `parallel`, `copilot-suitable`, `mcp-serena`
> **Milestone**: M3: Domain Layer
> **Estimate**: 4 hours
> **Depends On**: P2-015
> **Blocks**: P2-025, P2-027

## Context

RFCStrategy generates Request for Comments documents with standard sections for formal technical proposals.

## Task Description

Implement RFCStrategy:

**Create `src/strategies/rfc-strategy.ts`:**
```typescript
import type { OutputStrategy, OutputArtifacts, OutputApproach } from './output-strategy.js';

export class RFCStrategy implements OutputStrategy<any> {
  readonly approach = OutputApproach.RFC;

  render(result: any): OutputArtifacts {
    const content = `# RFC: ${result.metadata?.title ?? 'Untitled Proposal'}

## Summary

${this.extractSummary(result)}

## Scope

${this.extractScope(result)}

## Participants

- **Author**: @copilot
- **Reviewers**: TBD
- **Stakeholders**: TBD

## Proposal

${this.extractProposal(result)}

## Pros

${this.extractPros(result)}

## Cons

${this.extractCons(result)}

## Alternatives Considered

${this.extractAlternatives(result)}

## Conclusion

${this.extractConclusion(result)}

---
*RFC generated: ${new Date().toISOString()}*
`;

    return {
      primary: {
        name: 'RFC.md',
        content,
        format: 'markdown',
      },
    };
  }

  supports(domainType: string): boolean {
    return ['PromptResult', 'SessionState'].includes(domainType);
  }

  private extractSummary(result: any): string {
    // Extract or generate summary from domain result
  }

  private extractScope(result: any): string {
    // Extract scope definition
  }

  // ... other extraction methods
}
```

## Acceptance Criteria

- [ ] File created: `src/strategies/rfc-strategy.ts`
- [ ] All RFC sections rendered (Summary, Scope, Participants, Proposal, Pros/Cons, Alternatives, Conclusion)
- [ ] Works with PromptResult and SessionState
- [ ] Unit tests

## Files to Create

- `src/strategies/rfc-strategy.ts`
- `tests/vitest/strategies/rfc-strategy.spec.ts`

## Files to Modify

- `src/strategies/index.ts`

## Verification

```bash
npm run build && npm run test:vitest -- rfc-strategy
```

## References

- [SPEC-001: Output Strategy Layer](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-001-output-strategy-layer.md) §4.2
- [TASKS Phase 2](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/tasks/TASKS-phase-2-domain-extraction.md) P2-017
