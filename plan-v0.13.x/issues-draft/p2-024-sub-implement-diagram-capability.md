# 🔧 P2-024: Implement Diagram Capability Handler [parallel]

> **Parent**: [002-parent-phase2-domain-extraction.md](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/issues-draft/002-parent-phase2-domain-extraction.md)
> **Labels**: `phase-2`, `priority-medium`, `parallel`, `copilot-suitable`, `mcp-serena`
> **Milestone**: M3: Domain Layer
> **Estimate**: 4 hours
> **Depends On**: P2-020
> **Blocks**: P2-025

## Context

The diagram capability generates Mermaid diagrams (flowcharts, sequence diagrams, class diagrams, etc.) from domain results. This leverages the existing mermaid-diagram-generator tool.

## Task Description

Implement DiagramCapabilityHandler:

**Create `src/strategies/cross-cutting/diagram-handler.ts`:**
```typescript
import type { CapabilityHandler, CapabilityContext } from './types.js';
import type { CrossCuttingCapability, CrossCuttingArtifact } from '../output-strategy.js';
import { generateMermaidDiagram } from '../../tools/mermaid-diagram-generator.js';

export class DiagramCapabilityHandler implements CapabilityHandler {
  readonly capability = CrossCuttingCapability.DIAGRAM;

  generate(context: CapabilityContext): CrossCuttingArtifact | null {
    const { domainResult, metadata } = context;

    // Detect appropriate diagram type
    const diagramType = this.detectDiagramType(domainResult);
    const description = this.extractDiagramDescription(domainResult);

    if (!description) return null;

    const mermaidCode = this.generateDiagram(diagramType, description);

    return {
      type: this.capability,
      name: `diagrams/${diagramType}-diagram.md`,
      content: this.wrapInMarkdown(mermaidCode, diagramType),
    };
  }

  supports(domainType: string): boolean {
    return ['SessionState', 'ScoringResult', 'PromptResult'].includes(domainType);
  }

  private detectDiagramType(result: unknown): string {
    // Detect based on content
    // - Session state → flowchart (phases)
    // - Architecture → class/component
    // - Workflow → sequence
    return 'flowchart';
  }

  private extractDiagramDescription(result: unknown): string | null {
    // Extract relevant info for diagram
  }

  private generateDiagram(type: string, description: string): string {
    switch (type) {
      case 'flowchart':
        return this.generateFlowchart(description);
      case 'sequence':
        return this.generateSequence(description);
      case 'class':
        return this.generateClassDiagram(description);
      default:
        return this.generateFlowchart(description);
    }
  }

  private generateFlowchart(description: string): string {
    return `flowchart TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E
`;
  }

  private generateSequence(description: string): string {
    return `sequenceDiagram
    participant U as User
    participant S as System
    U->>S: Request
    S-->>U: Response
`;
  }

  private generateClassDiagram(description: string): string {
    return `classDiagram
    class Component {
        +method()
    }
`;
  }

  private wrapInMarkdown(mermaidCode: string, type: string): string {
    return `# ${type.charAt(0).toUpperCase() + type.slice(1)} Diagram

\`\`\`mermaid
${mermaidCode}
\`\`\`

---
*Generated diagram*
`;
  }
}
```

## Acceptance Criteria

- [ ] File: `src/strategies/cross-cutting/diagram-handler.ts`
- [ ] Generates valid Mermaid diagrams
- [ ] Multiple diagram types (flowchart, sequence, class)
- [ ] Detects appropriate type from context
- [ ] Integrates with mermaid-diagram-generator
- [ ] Unit tests

## Files to Create

- `src/strategies/cross-cutting/diagram-handler.ts`
- `tests/vitest/strategies/cross-cutting/diagram-handler.spec.ts`

## Files to Modify

- `src/strategies/cross-cutting/index.ts`

## Verification

```bash
npm run build && npm run test:vitest -- diagram-handler
```

## References

- [SPEC-001: Output Strategy Layer](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-001-output-strategy-layer.md) §5.3
- [Mermaid Documentation](https://mermaid.js.org/)
- [TASKS Phase 2](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/tasks/TASKS-phase-2-domain-extraction.md) P2-024
