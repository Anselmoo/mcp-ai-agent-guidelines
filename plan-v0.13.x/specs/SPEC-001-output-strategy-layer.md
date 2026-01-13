# SPEC-001: Output Strategy Layer Implementation

> Technical specification for implementing the OutputStrategy pattern across all MCP tools

## 📋 Document Metadata

| Field         | Value                                                 |
| ------------- | ----------------------------------------------------- |
| Specification | SPEC-001                                              |
| Title         | Output Strategy Layer Implementation                  |
| Status        | Draft                                                 |
| Created       | January 2026                                          |
| Related ADR   | [ADR-001](../adrs/ADR-001-output-strategy-pattern.md) |
| Phase         | Phase 2 (Domain Extraction + Output Strategy)         |

---

## 1. Executive Summary

This specification defines the implementation details for the Output Strategy Layer, which separates domain logic from output formatting across all 30+ MCP tools. The layer supports 7 output approaches (chat, RFC, ADR, SDD, SpecKit, TOGAF, Enterprise) with cross-cutting capabilities (workflows, scripts, diagrams, configs).

## 2. Goals & Non-Goals

### 2.1 Goals

1. **Decouple domain logic from presentation** — Domain functions return structured data, never formatted strings
2. **Support 7+ output approaches** — Same analysis can produce chat response, RFC, ADR, spec.md, etc.
3. **Enable cross-cutting capabilities** — Workflows, scripts, diagrams can be added to ANY output approach
4. **Maintain backward compatibility** — Existing tool interfaces preserved during migration
5. **Enable gradual rollout** — Feature flags control new vs. legacy code paths

### 2.2 Non-Goals

- Complete rewrite of all tools in single release
- Breaking changes to public tool APIs
- New dependencies for templating engines
- External file I/O for output (handled separately)

---

## 3. Technical Architecture

### 3.1 Layer Responsibilities

```
┌─────────────────────────────────────────────────────────────────────┐
│                          MCP LAYER                                   │
│  src/index.ts → Tool Registration, Request/Response Serialization   │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      GATEWAY LAYER (NEW)                             │
│  src/gateway/polyglot-gateway.ts                                    │
│  - Route requests to domain services                                 │
│  - Select output strategy based on context/preference               │
│  - Apply cross-cutting concerns                                      │
└─────────────────────────────────────────────────────────────────────┘
                                  │
              ┌───────────────────┴───────────────────┐
              ▼                                       ▼
┌─────────────────────────────┐     ┌─────────────────────────────────┐
│       DOMAIN LAYER          │     │      OUTPUT STRATEGY LAYER      │
│  src/domain/                │     │  src/strategies/                │
│  - Pure business logic      │     │  - Format domain results        │
│  - No output formatting     │     │  - Cross-cutting capabilities   │
│  - Testable in isolation    │     │  - Template rendering           │
└─────────────────────────────┘     └─────────────────────────────────┘
```

### 3.2 Directory Structure

```
src/
├── gateway/
│   ├── polyglot-gateway.ts           # Central routing and orchestration
│   ├── output-selector.ts            # Strategy selection logic
│   └── types.ts                      # Gateway types
│
├── domain/
│   ├── prompting/
│   │   ├── hierarchical-builder.ts   # Pure prompt building logic
│   │   ├── hierarchy-selector.ts     # Level selection logic
│   │   ├── prompt-evaluator.ts       # Evaluation logic
│   │   └── types.ts                  # Domain types
│   ├── analysis/
│   │   ├── code-scorer.ts            # Clean code scoring
│   │   ├── hygiene-analyzer.ts       # Code hygiene analysis
│   │   ├── dependency-auditor.ts     # Dependency audit logic
│   │   └── types.ts
│   ├── design/
│   │   ├── session-manager.ts        # Design session logic
│   │   ├── phase-workflow.ts         # Phase progression
│   │   ├── artifact-generator.ts     # Artifact generation
│   │   └── types.ts
│   └── index.ts                      # Barrel exports
│
├── strategies/
│   ├── output-strategy.ts            # Base interface
│   ├── chat-strategy.ts              # Chat/Markdown output
│   ├── rfc-strategy.ts               # RFC document format
│   ├── adr-strategy.ts               # ADR format (Michael Nygard)
│   ├── sdd-strategy.ts               # Spec-Driven Development
│   ├── speckit-strategy.ts           # GitHub Spec Kit format
│   ├── togaf-strategy.ts             # TOGAF enterprise
│   ├── enterprise-strategy.ts        # Traditional docs (TDD, HLD, LLD)
│   ├── cross-cutting/
│   │   ├── manager.ts                # CrossCuttingManager
│   │   ├── workflow-capability.ts    # GitHub Actions, etc.
│   │   ├── script-capability.ts      # Shell scripts
│   │   ├── diagram-capability.ts     # Mermaid, PlantUML
│   │   └── config-capability.ts      # JSON/YAML configs
│   └── index.ts                      # Barrel exports
│
└── tools/                            # Existing tools (thin wrappers)
```

### 3.3 Core Interfaces

```typescript
// src/strategies/output-strategy.ts

/**
 * Output approaches define the DOCUMENT FORMAT
 */
export type OutputApproach =
  | 'chat'       // Direct LLM response in markdown
  | 'rfc'        // Request for Comments document
  | 'adr'        // Architecture Decision Record
  | 'sdd'        // Spec-Driven Development artifacts
  | 'speckit'    // GitHub Spec Kit format
  | 'togaf'      // TOGAF enterprise deliverables
  | 'enterprise' // Traditional docs (TDD, HLD, LLD)
  | 'custom';    // User-defined format

/**
 * Cross-cutting capabilities are ADDITIVE to any approach
 */
export type CrossCuttingCapability =
  | 'workflow'     // CI/CD pipeline definitions
  | 'shell-script' // Automation scripts
  | 'diagram'      // Visual documentation
  | 'config'       // Configuration files
  | 'issues'       // Issue templates
  | 'pr-template'; // PR templates

/**
 * Output artifacts produced by a strategy
 */
export interface OutputArtifacts {
  /** Primary document in the chosen approach format */
  primary: Document;

  /** Cross-cutting artifacts generated */
  workflows?: WorkflowDefinition[];
  scripts?: ShellScript[];
  diagrams?: Diagram[];
  configs?: ConfigFile[];
  issues?: IssueTemplate[];
}

/**
 * Base interface all strategies must implement
 */
export interface OutputStrategy {
  readonly approach: OutputApproach;
  readonly crossCutting: CrossCuttingCapability[];

  /**
   * Render domain result to output artifacts
   */
  render(
    result: DomainResult,
    options: RenderOptions
  ): OutputArtifacts;

  /**
   * Check if this strategy supports a given intent
   */
  supports(intent: UserIntent): boolean;
}

/**
 * Options for rendering output
 */
export interface RenderOptions {
  /** Cross-cutting capabilities to include */
  crossCutting?: CrossCuttingCapability[];

  /** Options for cross-cutting capabilities */
  crossCuttingOptions?: CrossCuttingOptions;

  /** Include metadata section */
  includeMetadata?: boolean;

  /** Include references section */
  includeReferences?: boolean;

  /** Custom template overrides */
  templateOverrides?: Record<string, string>;
}
```

### 3.4 Strategy Selection

```typescript
// src/gateway/output-selector.ts

export interface OutputSelectionStrategy {
  /**
   * Recommend output approach based on context
   * LLM can recommend OR user can choose
   */
  recommendApproach(
    context: AnalysisContext,
    userPreference?: OutputApproach
  ): OutputApproach;

  /**
   * Recommend which cross-cutting capabilities to include
   */
  recommendCrossCutting(
    approach: OutputApproach,
    context: AnalysisContext
  ): CrossCuttingCapability[];
}

/**
 * Decision matrix for approach selection
 */
const APPROACH_SELECTION: Record<string, OutputApproach> = {
  'simple_query': 'chat',
  'team_alignment': 'rfc',
  'architectural_decision': 'adr',
  'feature_specification': 'sdd',
  'github_workflow': 'speckit',
  'enterprise_architecture': 'togaf',
  'traditional_documentation': 'enterprise',
};
```

---

## 4. Output Approach Templates

### 4.1 RFC Strategy Template

```typescript
// src/strategies/rfc-strategy.ts

export class RFCStrategy implements OutputStrategy {
  readonly approach = 'rfc' as const;
  readonly crossCutting: CrossCuttingCapability[] = [];

  render(result: DomainResult, options: RenderOptions): OutputArtifacts {
    const primary = this.renderRFC(result, options);
    const crossCutting = this.generateCrossCutting(result, options);

    return { primary, ...crossCutting };
  }

  private renderRFC(result: DomainResult, options: RenderOptions): Document {
    return {
      title: `RFC: ${result.title}`,
      content: `
# RFC: ${result.title}

## Summary
${result.summary}

## Scope
${result.scope || 'To be defined'}

## Participants
- **Author(s)**: ${result.authors?.join(', ') || 'TBD'}
- **Reviewers**: ${result.reviewers?.join(', ') || 'TBD'}
- **Approvers**: ${result.approvers?.join(', ') || 'TBD'}

## Status
Draft

## Proposal
${result.proposal}

## Pros and Cons

### Pros
${result.pros?.map(p => `- ${p}`).join('\n') || '- TBD'}

### Cons
${result.cons?.map(c => `- ${c}`).join('\n') || '- TBD'}

## Alternatives Considered
${result.alternatives || 'None documented'}

## Open Questions
${result.openQuestions?.map(q => `- ${q}`).join('\n') || '- None'}

## Conclusion
${result.conclusion || 'Pending team discussion'}
`.trim(),
      format: 'markdown',
    };
  }
}
```

### 4.2 ADR Strategy Template

```typescript
// src/strategies/adr-strategy.ts

export class ADRStrategy implements OutputStrategy {
  readonly approach = 'adr' as const;
  readonly crossCutting: CrossCuttingCapability[] = [];

  render(result: DomainResult, options: RenderOptions): OutputArtifacts {
    const primary = this.renderADR(result, options);
    return { primary };
  }

  private renderADR(result: DomainResult, options: RenderOptions): Document {
    return {
      title: `ADR-XXX: ${result.title}`,
      content: `
# ADR-XXX: ${result.title}

## Status

Proposed — ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}

## Context

${result.context}

## Decision

${result.decision}

## Consequences

### Positive
${result.positiveConsequences?.map(c => `- ${c}`).join('\n') || '- TBD'}

### Negative
${result.negativeConsequences?.map(c => `- ${c}`).join('\n') || '- TBD'}

### Neutral
${result.neutralConsequences?.map(c => `- ${c}`).join('\n') || '- TBD'}
`.trim(),
      format: 'markdown',
    };
  }
}
```

### 4.3 SDD Strategy Template

```typescript
// src/strategies/sdd-strategy.ts

export class SDDStrategy implements OutputStrategy {
  readonly approach = 'sdd' as const;
  readonly crossCutting: CrossCuttingCapability[] = [];

  render(result: DomainResult, options: RenderOptions): OutputArtifacts {
    return {
      primary: this.renderSpec(result),
      // SDD produces multiple artifacts
      additionalDocuments: [
        this.renderPlan(result),
        this.renderTasks(result),
      ],
    };
  }

  private renderSpec(result: DomainResult): Document {
    return {
      title: 'spec.md',
      content: `
# Specification: ${result.title}

## Overview
${result.overview}

## Requirements
${result.requirements?.map((r, i) => `${i + 1}. ${r}`).join('\n')}

## Acceptance Criteria
${result.acceptanceCriteria?.map(c => `- [ ] ${c}`).join('\n')}

## Constraints
${result.constraints?.map(c => `- ${c}`).join('\n') || 'None'}
`.trim(),
      format: 'markdown',
    };
  }

  private renderPlan(result: DomainResult): Document {
    return {
      title: 'plan.md',
      content: `
# Implementation Plan: ${result.title}

## Phases
${result.phases?.map((p, i) => `
### Phase ${i + 1}: ${p.name}
${p.description}

**Deliverables:**
${p.deliverables?.map(d => `- ${d}`).join('\n')}
`).join('\n')}
`.trim(),
      format: 'markdown',
    };
  }

  private renderTasks(result: DomainResult): Document {
    return {
      title: 'tasks.md',
      content: `
# Tasks: ${result.title}

${result.tasks?.map(t => `- [ ] ${t.title} (${t.estimate})`).join('\n')}
`.trim(),
      format: 'markdown',
    };
  }
}
```

---

## 5. Cross-Cutting Capabilities

### 5.1 CrossCuttingManager

```typescript
// src/strategies/cross-cutting/manager.ts

export class CrossCuttingManager {
  private capabilities: Map<CrossCuttingCapability, CapabilityHandler>;

  constructor() {
    this.capabilities = new Map([
      ['workflow', new WorkflowCapabilityHandler()],
      ['shell-script', new ShellScriptCapabilityHandler()],
      ['diagram', new DiagramCapabilityHandler()],
      ['config', new ConfigCapabilityHandler()],
      ['issues', new IssueCapabilityHandler()],
      ['pr-template', new PRTemplateCapabilityHandler()],
    ]);
  }

  generateArtifacts(
    domainResult: DomainResult,
    requestedCapabilities: CrossCuttingCapability[],
    options: CrossCuttingOptions
  ): CrossCuttingArtifacts {
    const artifacts: CrossCuttingArtifacts = {};

    for (const capability of requestedCapabilities) {
      const handler = this.capabilities.get(capability);
      if (handler) {
        artifacts[capability] = handler.generate(domainResult, options);
      }
    }

    return artifacts;
  }
}
```

### 5.2 Workflow Capability

```typescript
// src/strategies/cross-cutting/workflow-capability.ts

export interface WorkflowCapabilityHandler {
  generate(
    result: DomainResult,
    options: WorkflowOptions
  ): WorkflowDefinition[];
}

export class GitHubActionsWorkflowHandler implements WorkflowCapabilityHandler {
  generate(result: DomainResult, options: WorkflowOptions): WorkflowDefinition[] {
    // Generate GitHub Actions workflow YAML
    return [{
      filename: `.github/workflows/${result.workflowName || 'automation'}.yml`,
      content: this.buildWorkflowYAML(result, options),
      triggers: options.triggers || ['workflow_dispatch'],
      description: `Automation workflow for ${result.title}`,
    }];
  }

  private buildWorkflowYAML(result: DomainResult, options: WorkflowOptions): string {
    return `
name: ${result.workflowName || 'Automation'}

on:
${options.triggers?.map(t => `  ${t}:`).join('\n') || '  workflow_dispatch:'}

jobs:
  main:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
${result.steps?.map(s => `      - name: ${s.name}\n        run: ${s.command}`).join('\n') || ''}
`.trim();
  }
}
```

---

## 6. Migration Strategy (Strangler Fig)

### 6.1 Phase 1: Add Interface (Week 7)

1. Create `src/strategies/output-strategy.ts` with base interfaces
2. Create `ChatStrategy` as default implementation
3. Add `strategy?: OutputStrategy` parameter to existing tools
4. **Backward compatible**: Tools work without strategy parameter

```typescript
// Transitional API
export function buildHierarchicalPrompt(
  input: Input,
  strategy?: OutputStrategy  // NEW: Optional strategy
): string {
  const result = processInput(input);

  if (strategy) {
    return strategy.render(result).primary.content;  // New path
  }
  return formatMarkdown(result);  // Old path (preserved)
}
```

### 6.2 Phase 2: Extract Domain (Week 7-8)

1. Move pure logic to `src/domain/`
2. Keep tools as thin wrappers
3. Domain functions return `DomainResult`, not strings

### 6.3 Phase 3: Implement Strategies (Week 8)

1. Implement all 7 strategies
2. Add `CrossCuttingManager`
3. Wire to `PolyglotGateway`

### 6.4 Phase 4: Feature Flag Rollout (Week 9+)

```typescript
const FEATURE_FLAGS = {
  USE_OUTPUT_STRATEGY: process.env.USE_OUTPUT_STRATEGY === 'true',
};

// Tools check flag
export function handleRequest(input: Input): string {
  if (FEATURE_FLAGS.USE_OUTPUT_STRATEGY) {
    return newImplementation(input);
  }
  return legacyImplementation(input);
}
```

---

## 7. Testing Strategy

### 7.1 Unit Tests per Strategy

```typescript
// tests/vitest/strategies/rfc-strategy.spec.ts
describe('RFCStrategy', () => {
  it('renders RFC with all sections', () => {
    const strategy = new RFCStrategy();
    const result = strategy.render(mockDomainResult, {});

    expect(result.primary.content).toContain('# RFC:');
    expect(result.primary.content).toContain('## Proposal');
    expect(result.primary.content).toContain('## Pros and Cons');
  });

  it('includes workflow when requested', () => {
    const strategy = new RFCStrategy();
    const result = strategy.render(mockDomainResult, {
      crossCutting: ['workflow'],
    });

    expect(result.workflows).toHaveLength(1);
    expect(result.workflows[0].content).toContain('name:');
  });
});
```

### 7.2 Integration Tests

```typescript
// tests/vitest/integration/output-strategy.spec.ts
describe('OutputStrategy Integration', () => {
  it('same domain result renders to all approaches', () => {
    const domainResult = createMockAnalysisResult();

    const strategies = [
      new ChatStrategy(),
      new RFCStrategy(),
      new ADRStrategy(),
      new SDDStrategy(),
    ];

    for (const strategy of strategies) {
      const output = strategy.render(domainResult, {});
      expect(output.primary.content).toBeDefined();
      expect(output.primary.format).toBe('markdown');
    }
  });
});
```

---

## 8. Success Criteria

| Criterion                    | Target | Measurement                   |
| ---------------------------- | ------ | ----------------------------- |
| Domain functions are pure    | 100%   | No `string` returns in domain |
| Strategies implemented       | 7      | All approaches have class     |
| Cross-cutting works with all | 7 × 6  | Matrix test                   |
| Test coverage                | 95%+   | Vitest report                 |
| Backward compatible          | 100%   | Existing tool tests pass      |

---

## 9. Open Questions

1. **Template Customization**: Should users be able to override templates per strategy?
2. **Strategy Persistence**: Should selected strategy be remembered across tool calls?
3. **Hybrid Outputs**: Can a single request produce multiple approaches?

---

## 10. References

- [ADR-001: Output Strategy Pattern](../adrs/ADR-001-output-strategy-pattern.md)
- [ADR-005: Cross-Cutting Capabilities](../adrs/ADR-005-cross-cutting-capabilities.md)
- [Memory: v013_output_strategy_layer](serena://memories/v013_output_strategy_layer)
- [Martin Fowler - Strategy Pattern](https://refactoring.guru/design-patterns/strategy)

---

*Specification Created: January 2026*
*Status: Draft — Awaiting Review*
