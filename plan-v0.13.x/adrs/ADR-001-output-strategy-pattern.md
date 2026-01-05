# ADR-001: Output Strategy Pattern

## Status

**Proposed** — January 2026

## Context

The MCP AI Agent Guidelines currently has 30+ tools that produce output in a single format (chat/markdown). Research revealed that users need multiple output approaches:

1. **Chat Response** — Direct LLM response for simple queries
2. **RFC Document** — Formal proposals requiring team alignment
3. **ADR** — Architecture Decision Records for permanent documentation
4. **SDD** — Spec-Driven Development artifacts (spec.md, plan.md, tasks.md)
5. **SpecKit** — GitHub Spec Kit format for AI-assisted development
6. **TOGAF** — Enterprise architecture deliverables
7. **Enterprise** — Traditional documentation (TDD, HLD, LLD)

Additionally, **cross-cutting capabilities** (workflows, shell scripts, diagrams, configs) should be available in ANY output approach — they are not separate strategies but additive capabilities.

### Forces

1. **Flexibility**: Different contexts require different output formats
2. **Reusability**: Domain logic should not change based on output format
3. **Extensibility**: New output approaches should be easy to add
4. **Composability**: Cross-cutting artifacts can enhance any output

### Current State

```
Tool → Business Logic + Output Formatting (mixed)
     → Returns formatted markdown string
```

### Problems with Current State

- Cannot produce the same analysis as RFC, ADR, or SDD
- Output formatting is duplicated across tools
- Adding new output format requires modifying every tool
- Cross-cutting artifacts (workflows, scripts) not systematically supported

## Decision

We will implement the **Output Strategy Pattern** with the following architecture:

### Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DOMAIN LAYER                                 │
│                     (Pure Business Logic)                            │
│                                                                      │
│   buildPrompt() → PromptResult                                      │
│   scoreCode() → ScoreResult                                         │
│   analyzeGaps() → GapResult                                         │
│                          │                                           │
└──────────────────────────┼──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     OUTPUT STRATEGY LAYER                            │
│                                                                      │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                    OutputStrategy                            │   │
│   │   approach: OutputApproach                                   │   │
│   │   crossCutting: CrossCuttingCapability[]                    │   │
│   │   render(result, options): OutputArtifacts                  │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│   Implementations:                                                   │
│   ├── ChatStrategy      → Markdown for chat responses               │
│   ├── RFCStrategy       → RFC document structure                    │
│   ├── ADRStrategy       → Michael Nygard ADR template              │
│   ├── SDDStrategy       → spec.md, plan.md, tasks.md               │
│   ├── SpecKitStrategy   → .specify/ directory structure            │
│   ├── TOGAFStrategy     → Enterprise deliverables                  │
│   └── EnterpriseStrategy → TDD, HLD, LLD formats                   │
│                                                                      │
│   Cross-Cutting (additive to any strategy):                         │
│   ├── WorkflowCapability → GitHub Actions YAML                     │
│   ├── ShellScriptCapability → Bash/PowerShell automation          │
│   ├── DiagramCapability → Mermaid/PlantUML                        │
│   └── ConfigCapability → JSON/YAML configuration                   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Interface Definition

```typescript
// Core types
type OutputApproach =
  | 'chat'           // Direct LLM response
  | 'rfc'            // Request for Comments
  | 'adr'            // Architecture Decision Record
  | 'sdd'            // Spec-Driven Development
  | 'speckit'        // GitHub Spec Kit
  | 'togaf'          // TOGAF enterprise
  | 'enterprise'     // Traditional docs
  | 'custom';        // User-defined

type CrossCuttingCapability =
  | 'workflow'       // CI/CD automation
  | 'shell-script'   // Automation scripts
  | 'diagram'        // Visual documentation
  | 'config'         // Configuration files
  | 'issues'         // Issue templates
  | 'pr-template';   // PR templates

// Strategy interface
interface OutputStrategy {
  readonly approach: OutputApproach;
  readonly crossCutting: CrossCuttingCapability[];

  render(
    result: DomainResult,
    options: RenderOptions
  ): OutputArtifacts;

  supports(intent: UserIntent): boolean;
}

// Output artifacts
interface OutputArtifacts {
  primary: Document;              // Main document
  workflows?: WorkflowDefinition[];
  scripts?: ShellScript[];
  diagrams?: Diagram[];
  configs?: ConfigFile[];
  issues?: IssueTemplate[];
}
```

### Selection Strategy

```typescript
interface OutputSelectionStrategy {
  recommendApproach(
    context: AnalysisContext,
    userPreference?: OutputApproach
  ): OutputApproach;

  recommendCrossCutting(
    approach: OutputApproach,
    context: AnalysisContext
  ): CrossCuttingCapability[];
}
```

### Usage Example

```typescript
// Domain layer (pure logic)
const analysisResult = await scoreCode(codeInput);

// Output strategy selection
const strategy = outputSelector.selectStrategy({
  approach: userPreference || 'chat',
  crossCutting: ['workflow', 'diagram']
});

// Render with cross-cutting capabilities
const output = strategy.render(analysisResult, {
  includeWorkflow: true,
  workflowType: 'github-actions',
  includeDiagram: true,
  diagramType: 'mermaid'
});

// output.primary = RFC document
// output.workflows = [GitHub Actions YAML]
// output.diagrams = [Mermaid diagram]
```

## Consequences

### Positive

1. **Separation of Concerns**: Domain logic is pure, testable in isolation
2. **Flexibility**: Same analysis can produce any output format
3. **Extensibility**: New strategies add no changes to domain layer
4. **Composability**: Cross-cutting capabilities work with any approach
5. **User Choice**: LLM recommends OR user chooses output format

### Negative

1. **Complexity**: Additional abstraction layer to maintain
2. **Migration Effort**: Existing tools need gradual refactoring
3. **Testing Overhead**: Each strategy needs its own test suite

### Neutral

1. **Learning Curve**: Team needs to understand strategy pattern
2. **Documentation**: More interfaces to document

## Implementation Notes

### Migration Strategy (Strangler Fig)

1. **Phase 1**: Create OutputStrategy interface, implement ChatStrategy
2. **Phase 2**: Add RFCStrategy, ADRStrategy alongside existing
3. **Phase 3**: Add SDDStrategy, SpecKitStrategy
4. **Phase 4**: Migrate tools to use OutputStrategy
5. **Phase 5**: Deprecate direct output formatting in tools
6. **Phase 6**: Remove legacy output code

### Directory Structure

```
src/strategies/
├── output-strategy.ts        # Interface + types
├── chat-strategy.ts          # Default chat output
├── rfc-strategy.ts           # RFC documents
├── adr-strategy.ts           # ADR records
├── sdd-strategy.ts           # SDD artifacts
├── speckit-strategy.ts       # Spec Kit format
├── togaf-strategy.ts         # TOGAF deliverables
├── enterprise-strategy.ts    # Traditional docs
├── cross-cutting/
│   ├── workflow.ts           # Workflow generation
│   ├── shell-script.ts       # Script generation
│   ├── diagram.ts            # Diagram generation
│   └── config.ts             # Config generation
└── index.ts                  # Barrel export
```

## Related ADRs

- ADR-003: Strangler Fig Migration (migration approach)
- ADR-005: Cross-Cutting Capabilities (detailed cross-cutting design)

## References

- [Martin Fowler - Strategy Pattern](https://refactoring.guru/design-patterns/strategy)
- [Tech World Milan - RFC/ADR Framework](https://techworld-with-milan.com)
- [TOGAF ADM Deliverables](https://togaf.visual-paradigm.com)
- [GitHub Spec Kit](https://github.com/github/spec-kit)

---

*ADR-001 Created: January 2026*
*Status: Proposed*
*Specification: SPEC-001-output-strategy-layer.md*
