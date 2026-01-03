# 🔧 P2-015: Create OutputStrategy Interface [serial]

> **Parent**: #TBD
> **Labels**: `phase-2`, `priority-high`, `serial`, `copilot-suitable`, `mcp-serena`
> **Milestone**: M3: Domain Layer
> **Estimate**: 3 hours
> **Depends On**: P2-005
> **Blocks**: P2-016, P2-017, P2-018, P2-019, P2-020, P2-021, P2-022

## Context

The OutputStrategy layer enables the same domain result to be rendered in different formats. This task creates the foundational interfaces and enums.

## Task Description

Create base OutputStrategy interface and types:

**Create `src/strategies/output-strategy.ts`:**
```typescript
/**
 * The 7 output approaches as defined in SPEC-001
 */
export enum OutputApproach {
  CHAT = 'chat',
  RFC = 'rfc',
  ADR = 'adr',
  SDD = 'sdd',
  TOGAF = 'togaf',
  ENTERPRISE = 'enterprise',
  SPECKIT = 'speckit',
}

/**
 * Cross-cutting capabilities that can be added to any output
 */
export enum CrossCuttingCapability {
  WORKFLOW = 'workflow',
  SHELL_SCRIPT = 'shell-script',
  DIAGRAM = 'diagram',
  CONFIG = 'config',
  ISSUES = 'issues',
  PR_TEMPLATE = 'pr-template',
}

/**
 * Generated artifacts from an output strategy
 */
export interface OutputArtifacts {
  primary: OutputDocument;
  secondary?: OutputDocument[];
  crossCutting?: CrossCuttingArtifact[];
}

export interface OutputDocument {
  name: string;
  content: string;
  format: 'markdown' | 'yaml' | 'json' | 'shell';
}

export interface CrossCuttingArtifact {
  type: CrossCuttingCapability;
  name: string;
  content: string;
}

/**
 * Options for rendering output
 */
export interface RenderOptions {
  approach: OutputApproach;
  crossCutting?: CrossCuttingCapability[];
  includeMetadata?: boolean;
  verbosity?: 'minimal' | 'standard' | 'verbose';
}

/**
 * Base interface for all output strategies
 */
export interface OutputStrategy<TDomainResult> {
  readonly approach: OutputApproach;

  render(result: TDomainResult, options?: Partial<RenderOptions>): OutputArtifacts;

  supports(domainType: string): boolean;
}
```

**Create `src/strategies/index.ts`:**
```typescript
export * from './output-strategy.js';
```

## Acceptance Criteria

- [ ] File created: `src/strategies/output-strategy.ts`
- [ ] `OutputApproach` enum with 7 values
- [ ] `CrossCuttingCapability` enum with 6 values
- [ ] `OutputArtifacts` interface
- [ ] `RenderOptions` interface
- [ ] `OutputStrategy` generic interface
- [ ] JSDoc documentation for all types
- [ ] Barrel export at `src/strategies/index.ts`

## Files to Create

- `src/strategies/output-strategy.ts`
- `src/strategies/index.ts`

## Verification

```bash
npm run build
```

## References

- [SPEC-001: Output Strategy Layer](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-001-output-strategy-layer.md) §3
- [ADR-001: Output Strategy Pattern](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/adrs/ADR-001-output-strategy-pattern.md)
- [TASKS Phase 2](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/tasks/TASKS-phase-2-domain-extraction.md) P2-015
