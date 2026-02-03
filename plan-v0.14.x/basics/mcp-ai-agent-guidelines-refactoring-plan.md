# MCP AI Agent Guidelines v0.14.x: Comprehensive Refactoring Plan

**Status**: Active Planning
**Version**: 1.2.0
**Date**: 2026-01-30
**Total Duration**: 9 weeks (260 hours)
**Project**: Strategic Consolidation & Unified Architecture

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Project Scope & Objectives](#2-project-scope--objectives)
3. [Architecture Overview](#3-architecture-overview)
4. [Implementation Phases](#4-implementation-phases)
5. [Gap Remediation Workstreams](#5-gap-remediation-workstreams)
6. [Enforcement & Validation Layer](#6-enforcement--validation-layer)
7. [Dependencies & Constraints](#7-dependencies--constraints)
8. [Risk Management](#8-risk-management)
9. [Success Metrics](#9-success-metrics)
10. [Appendices](#10-appendices)

---

## 1. Executive Summary

### 1.1 Project Context

The MCP AI Agent Guidelines v0.14.x represents a strategic consolidation effort addressing architectural debt accumulated in v0.13.x while establishing patterns for the 2026 MCP ecosystem.

**Core Problem Statement**:
- Fragmented prompt builder tools (12+ implementations)
- Inconsistent tool annotations across 30+ tools
- Duplicated analysis frameworks (30+ → target: 11)
- Platform-specific code limiting portability
- Missing enforcement mechanisms for SpecKit compliance

### 1.2 Strategic Goals

| Goal | Description | Impact |
|------|-------------|--------|
| **Architectural Unification** | Consolidate fragmented systems into cohesive architecture | Reduced maintenance burden, improved consistency |
| **Developer Experience** | Standardize patterns, improve discoverability | Faster onboarding, clearer usage patterns |
| **Platform Independence** | Abstract platform-specific code via PAL | Windows/Linux/macOS support |
| **Quality Assurance** | Implement enforcement tools for compliance | Automated validation, reduced manual review |
| **Future-Proofing** | Establish patterns for v0.15.x+ | Scalable architecture, easier evolution |

### 1.3 Timeline Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        9-Week Implementation Timeline                    │
├─────────────────────────────────────────────────────────────────────────┤
│ Week 1-2  │ ████████ Phase 1: Core Infrastructure (BaseStrategy)        │
│ Week 2-3  │ ████████ Phase 2: Strategy Migration (7 strategies)         │
│ Week 3-4  │ ████████ Phase 2.5: Unified Prompt Ecosystem ★              │
│ Week 4-6  │ ████████████ Phase 3: Framework Consolidation (30→11)       │
│ Week 5-7  │ ████████████ Phase 4: Platform Abstraction (PAL)            │
│ Week 6-8  │ ████████████ Phase 5: CI/CD & Documentation                 │
│ Week 7-9  │ ████████████ Phase 6: Testing & Validation                  │
└─────────────────────────────────────────────────────────────────────────┘

★ Phase 2.5 is a BREAKING CHANGE phase with strict "no backward compatibility" policy
```

### 1.4 Effort Distribution

| Phase | Duration | Effort | Critical Path |
|-------|----------|--------|---------------|
| Phase 1: Core Infrastructure | 2 weeks | 24h | ✓ |
| Phase 2: Strategy Migration | 2 weeks | 36h | ✓ |
| **Phase 2.5: Unified Prompts** | **2 weeks** | **55h** | **✓** |
| Phase 3: Framework Consolidation | 2 weeks | 42h | ✓ |
| Phase 4: Platform Abstraction | 2 weeks | 29h | - |
| Phase 5: CI/CD & Documentation | 1.5 weeks | 24h | - |
| Phase 6: Testing & Validation | 2 weeks | 50h | ✓ |
| **Total** | **9 weeks** | **260h** | |

---

## 2. Project Scope & Objectives

### 2.1 In Scope

#### 2.1.1 Core Architecture Refactoring

- **BaseStrategy Pattern**: Abstract base class for all strategy implementations
- **ExecutionTrace System**: Decision logging and transparency framework
- **Coordinator Pattern**: Summary feedback and agent handoff coordination
- **Unified Prompt Ecosystem**: Single entry point for all prompt generation
- **Framework Consolidation**: Reduce from 30+ to 11 unified frameworks
- **Platform Abstraction Layer (PAL)**: Cross-platform file/path operations

#### 2.1.2 Gap Remediation (8 Identified Gaps)

| Gap ID | Title | Priority | Target Phase |
|--------|-------|----------|--------------|
| GAP-001 | Tool Annotations Standard (ADR-002) | P0 | Phase 2.5 |
| GAP-002 | Schema Examples for Zod | P0 | Phase 3 |
| GAP-003 | Unified Prompt Tool Design | P1 | Phase 2.5 |
| GAP-004 | Deprecation Warning Helpers | P0 | Phase 3 |
| GAP-005 | Description CSV Export | P1 | Phase 2.5 |
| GAP-006 | MCP Apps Research | P2 | v0.15.x (Deferred) |
| GAP-007 | RAG Integration Evaluation | P2 | v0.15.x (Deferred) |
| GAP-008 | Progress Standardization & Enforcement | P0 | Phase 3 |

#### 2.1.3 Enforcement Layer

- **validate_uniqueness**: Check tool description duplicates
- **validate_annotations**: Verify ToolAnnotations coverage
- **validate_schema_examples**: Check Zod .describe() coverage
- **enforce_planning**: Validate SpecKit compliance
- **validate_progress**: Normalize progress.md files

### 2.2 Out of Scope

- Full MCP Apps implementation (research only)
- Complete RAG pipeline (evaluation only)
- Breaking changes to MCP SDK itself
- Rewriting existing tool logic (beyond consolidation)
- Performance optimization (unless blocking)

### 2.3 Success Criteria

| Criterion | Target | Validation Method |
|-----------|--------|-------------------|
| Tool Annotation Coverage | 100% | Automated validation script |
| Schema Description Coverage | 80%+ | CI check on all Zod schemas |
| Framework Reduction | 30+ → 11 | Code audit + documentation |
| Test Coverage | ≥90% | Vitest coverage report |
| Cross-Platform Support | Windows + Linux + macOS | CI matrix testing |
| Zero Duplicate Descriptions | 0 | CSV export validation |
| SpecKit Compliance | 100% | enforce_planning tool |
| Documentation Completeness | All public APIs documented | Manual review + automation |

---

## 3. Architecture Overview

### 3.1 Current State (v0.13.x)

```
┌─────────────────────────────────────────────────────────────────┐
│                    Current Architecture (v0.13.x)                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────────┐  │
│  │ 12+ Prompt     │  │ 30+ Analysis   │  │ Platform-Specific│  │
│  │ Builders       │  │ Frameworks     │  │ Code (fs/path)   │  │
│  │ (Fragmented)   │  │ (Duplicated)   │  │ (Non-portable)   │  │
│  └────────────────┘  └────────────────┘  └──────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Issues:                                                     │ │
│  │ • No standard BaseStrategy pattern                         │ │
│  │ • Inconsistent tool annotations                            │ │
│  │ • Missing execution traces                                 │ │
│  │ • No enforcement mechanisms                                │ │
│  │ • Threshold arrays scattered                               │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Target State (v0.14.x)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       Target Architecture (v0.14.x)                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    Core Infrastructure Layer                      │   │
│  ├──────────────────────────────────────────────────────────────────┤   │
│  │ BaseStrategy<T>  │  ExecutionTrace  │  Coordinators              │   │
│  │ (Abstract Base)  │  (Decision Log)  │  (Feedback/Handoff)        │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    Unified Domain Layer                           │   │
│  ├──────────────────────────────────────────────────────────────────┤   │
│  │ ┌─────────────────┐  ┌──────────────┐  ┌────────────────────┐   │   │
│  │ │ UnifiedPrompt   │  │ 11 Analysis  │  │ Platform           │   │   │
│  │ │ Builder (Hub)   │  │ Frameworks   │  │ Abstraction Layer  │   │   │
│  │ │ • Registry      │  │ • Routing    │  │ • NodePAL          │   │   │
│  │ │ • Templates     │  │ • Strategies │  │ • MockPAL          │   │   │
│  │ └─────────────────┘  └──────────────┘  └────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    MCP Tool Layer (30+ Tools)                     │   │
│  ├──────────────────────────────────────────────────────────────────┤   │
│  │ All tools use:                                                    │   │
│  │ • ToolAnnotations (GAP-001)                                       │   │
│  │ • Zod schemas with .describe() (GAP-002)                          │   │
│  │ • BaseStrategy pattern                                            │   │
│  │ • ExecutionTrace logging                                          │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    Enforcement Layer (NEW)                        │   │
│  ├──────────────────────────────────────────────────────────────────┤   │
│  │ validate_uniqueness  │  validate_annotations  │  enforce_planning │   │
│  │ validate_progress    │  validate_schema_examples                  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Key Architectural Patterns

#### 3.3.1 BaseStrategy Pattern

```typescript
/**
 * Abstract base class for all strategy implementations
 * Enforces consistent interface and execution trace logging
 */
abstract class BaseStrategy<T> {
  protected trace: ExecutionTrace;

  abstract execute(input: T): Promise<StrategyResult>;
  abstract validate(input: T): ValidationResult;

  // Template method pattern
  async run(input: T): Promise<StrategyResult> {
    this.trace.recordStart();
    const validation = this.validate(input);
    if (!validation.valid) {
      this.trace.recordError(validation.errors);
      return this.handleValidationError(validation);
    }
    const result = await this.execute(input);
    this.trace.recordCompletion(result);
    return result;
  }
}
```

#### 3.3.2 ExecutionTrace Pattern

```typescript
/**
 * Decision logging for transparency and debugging
 */
class ExecutionTrace {
  private events: TraceEvent[] = [];

  recordDecision(decision: string, rationale: string): void;
  recordMetric(name: string, value: number): void;
  recordError(error: Error | ValidationError[]): void;

  // Export for analysis
  toJSON(): TraceExport;
  toMarkdown(): string;
}
```

#### 3.3.3 Unified Prompt Hub

```typescript
/**
 * Central registry and dispatcher for all prompt generation
 * Replaces 12+ fragmented prompt builders
 */
class UnifiedPromptBuilder {
  private registry: Map<string, PromptGenerator>;
  private templateEngine: TemplateEngine;

  register(domain: string, generator: PromptGenerator): void;
  build(request: PromptRequest): PromptResult;

  // Backward compatibility via facades
  buildHierarchical(input: HierarchicalInput): PromptResult;
  buildDomainNeutral(input: DomainNeutralInput): PromptResult;
}
```

### 3.4 File Structure (Target)

```
src/
├── domain/
│   ├── enforcement/              # NEW: Pure validation logic
│   │   ├── types.ts
│   │   ├── validation.ts
│   │   ├── progress.ts          # GAP-008 implementation
│   │   └── index.ts
│   ├── prompts/                 # NEW: Extracted prompt logic
│   │   ├── core/
│   │   │   ├── registry.ts
│   │   │   └── template-engine.ts
│   │   ├── domains/
│   │   │   ├── domain-neutral.ts
│   │   │   ├── spark.ts
│   │   │   ├── security.ts
│   │   │   ├── architecture.ts
│   │   │   └── code-analysis.ts
│   │   └── index.ts
│   └── strategies/
│       └── shared/
│           ├── base-strategy.ts  # NEW: Abstract base
│           └── execution-trace.ts # NEW: Decision logging
│
├── strategies/
│   ├── speckit-strategy.ts      # MIGRATED to BaseStrategy
│   ├── togaf-strategy.ts        # MIGRATED to BaseStrategy
│   ├── adr-strategy.ts          # MIGRATED to BaseStrategy
│   ├── rfc-strategy.ts          # MIGRATED to BaseStrategy
│   ├── enterprise-strategy.ts   # MIGRATED to BaseStrategy
│   ├── sdd-strategy.ts          # MIGRATED to BaseStrategy
│   └── chat-strategy.ts         # MIGRATED to BaseStrategy
│
├── frameworks/                   # CONSOLIDATED from 30+ to 11
│   ├── registry.ts              # NEW: Framework router
│   ├── analysis/
│   │   ├── gap-analysis.ts      # Consolidated
│   │   ├── swot.ts              # Consolidated
│   │   └── code-hygiene.ts      # Consolidated
│   └── shared/
│       └── framework-base.ts
│
├── tools/
│   ├── enforcement/             # NEW: Enforcement tools
│   │   ├── validate-uniqueness.ts
│   │   ├── validate-annotations.ts
│   │   ├── validate-schema-examples.ts
│   │   ├── enforce-planning.ts
│   │   ├── validate-progress.ts # GAP-008
│   │   └── index.ts
│   ├── prompts/
│   │   ├── unified-prompt-builder.ts  # NEW: Single entry point
│   │   └── legacy-facades/            # NEW: Backward compat
│   │       ├── hierarchical-facade.ts
│   │       ├── domain-neutral-facade.ts
│   │       └── index.ts
│   └── shared/
│       ├── tool-annotations.ts   # GAP-001
│       └── deprecation.ts        # GAP-004
│
├── platform/                     # NEW: Platform abstraction
│   ├── pal-interface.ts
│   ├── node-pal.ts
│   ├── mock-pal.ts
│   └── index.ts
│
└── index.ts                      # Tool registration

tests/vitest/
├── domain/
│   ├── enforcement/
│   │   ├── validation.spec.ts
│   │   └── progress.spec.ts
│   └── prompts/
│       └── unified-prompt.spec.ts
├── strategies/
│   └── base-strategy.spec.ts
├── frameworks/
│   └── registry.spec.ts
└── tools/
    ├── enforcement/
    │   ├── validate-uniqueness.spec.ts
    │   ├── validate-annotations.spec.ts
    │   ├── validate-schema-examples.spec.ts
    │   ├── enforce-planning.spec.ts
    │   └── validate-progress.spec.ts
    └── prompts/
        └── unified-prompt-builder.spec.ts

scripts/
├── export-descriptions.ts       # GAP-005
└── mcp-enforcement.sh          # Optional shell fallback

docs/
├── architecture/
│   ├── adr/
│   │   ├── ADR-001-basestrategy.md
│   │   ├── ADR-002-tool-annotations.md  # GAP-001
│   │   ├── ADR-003-unified-prompts.md   # GAP-003
│   │   └── ADR-008-progress-enforcement.md # GAP-008
│   └── patterns/
│       ├── execution-trace.md
│       └── platform-abstraction.md
├── migration-guide.md
└── contributing.md

artifacts/
└── tool-descriptions.csv        # GAP-005 output
```

---

## 4. Implementation Phases

### PHASE 1: Core Infrastructure (Weeks 1-2)

**Duration**: 2 weeks
**Effort**: 24 hours
**Critical Path**: ✓
**Priority**: P0

#### 4.1.1 Objectives

Establish foundational abstractions that all subsequent phases depend on:
- Abstract BaseStrategy pattern for all strategies
- ExecutionTrace system for decision logging
- Coordinator pattern for feedback and handoffs

#### 4.1.2 Detailed Tasks

##### T-001: Create BaseStrategy<T> Abstract Class
**Effort**: 4h | **Priority**: P0 | **Blocking**: T-011 through T-017

**Implementation**:
```typescript
// src/strategies/shared/base-strategy.ts
import { ExecutionTrace } from './execution-trace.js';

export interface StrategyResult<T = unknown> {
  success: boolean;
  data?: T;
  errors?: Error[];
  trace: ExecutionTrace;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

export abstract class BaseStrategy<TInput, TOutput> {
  protected trace: ExecutionTrace;

  constructor() {
    this.trace = new ExecutionTrace(this.constructor.name);
  }

  // Abstract methods that subclasses must implement
  abstract execute(input: TInput): Promise<TOutput>;
  abstract validate(input: TInput): ValidationResult;

  // Template method pattern - DO NOT OVERRIDE
  async run(input: TInput): Promise<StrategyResult<TOutput>> {
    this.trace.recordStart({ input });

    // Validation phase
    const validation = this.validate(input);
    if (!validation.valid) {
      this.trace.recordError(validation.errors);
      return {
        success: false,
        errors: validation.errors.map(e => new Error(e.message)),
        trace: this.trace
      };
    }

    // Execution phase
    try {
      const result = await this.execute(input);
      this.trace.recordSuccess({ output: result });
      return {
        success: true,
        data: result,
        trace: this.trace
      };
    } catch (error) {
      this.trace.recordError([error as Error]);
      return {
        success: false,
        errors: [error as Error],
        trace: this.trace
      };
    }
  }

  // Optional hooks for subclasses
  protected async beforeExecute(input: TInput): Promise<void> {}
  protected async afterExecute(output: TOutput): Promise<void> {}
}
```

**Testing Requirements**:
- Unit tests for template method flow
- Validation error handling
- Success/failure path coverage
- Trace recording verification

**Acceptance Criteria**:
- [ ] BaseStrategy class implemented with TypeScript strict mode
- [ ] Abstract methods defined
- [ ] Template method pattern enforced
- [ ] 100% unit test coverage
- [ ] Documentation with usage examples

---

##### T-002: Implement ExecutionTrace Class
**Effort**: 4h | **Priority**: P0 | **Blocking**: T-001, all tool implementations

**Implementation**:
```typescript
// src/strategies/shared/execution-trace.ts
export interface TraceEvent {
  timestamp: Date;
  type: 'start' | 'decision' | 'metric' | 'error' | 'success';
  data: unknown;
}

export class ExecutionTrace {
  private events: TraceEvent[] = [];
  private strategyName: string;

  constructor(strategyName: string) {
    this.strategyName = strategyName;
  }

  recordStart(data: unknown): void {
    this.events.push({
      timestamp: new Date(),
      type: 'start',
      data
    });
  }

  recordDecision(decision: string, rationale: string): void {
    this.events.push({
      timestamp: new Date(),
      type: 'decision',
      data: { decision, rationale }
    });
  }

  recordMetric(name: string, value: number): void {
    this.events.push({
      timestamp: new Date(),
      type: 'metric',
      data: { name, value }
    });
  }

  recordError(errors: Error[]): void {
    this.events.push({
      timestamp: new Date(),
      type: 'error',
      data: { errors: errors.map(e => e.message) }
    });
  }

  recordSuccess(data: unknown): void {
    this.events.push({
      timestamp: new Date(),
      type: 'success',
      data
    });
  }

  // Export methods
  toJSON(): TraceExport {
    return {
      strategy: this.strategyName,
      events: this.events,
      duration: this.getDuration()
    };
  }

  toMarkdown(): string {
    let md = `# Execution Trace: ${this.strategyName}\n\n`;
    md += `**Duration**: ${this.getDuration()}ms\n\n`;
    md += `## Events\n\n`;

    this.events.forEach((event, index) => {
      md += `### ${index + 1}. ${event.type.toUpperCase()}\n`;
      md += `**Time**: ${event.timestamp.toISOString()}\n`;
      md += `**Data**: \`\`\`json\n${JSON.stringify(event.data, null, 2)}\n\`\`\`\n\n`;
    });

    return md;
  }

  private getDuration(): number {
    if (this.events.length < 2) return 0;
    const start = this.events[0].timestamp.getTime();
    const end = this.events[this.events.length - 1].timestamp.getTime();
    return end - start;
  }
}
```

**Testing Requirements**:
- Record all event types
- JSON export format
- Markdown export format
- Duration calculation
- Thread safety (if applicable)

**Acceptance Criteria**:
- [ ] All event types supported
- [ ] Export to JSON validated
- [ ] Export to Markdown validated
- [ ] 100% unit test coverage
- [ ] Performance: <1ms overhead per trace operation

---

##### T-003: Implement SummaryFeedbackCoordinator
**Effort**: 4h | **Priority**: P0 | **Blocking**: Strategy migrations

**Implementation**:
```typescript
// src/strategies/shared/summary-feedback-coordinator.ts
import { z } from 'zod';

const FeedbackConfigSchema = z.object({
  requireSummary: z.boolean(),
  summaryMinLength: z.number().optional(),
  summaryMaxLength: z.number().optional(),
  requireFeedback: z.boolean(),
  feedbackPrompt: z.string().optional()
});

export type FeedbackConfig = z.infer<typeof FeedbackConfigSchema>;

export class SummaryFeedbackCoordinator {
  private config: FeedbackConfig;

  constructor(config: FeedbackConfig) {
    this.config = FeedbackConfigSchema.parse(config);
  }

  async requestSummary(
    context: unknown,
    trace: ExecutionTrace
  ): Promise<string | null> {
    if (!this.config.requireSummary) return null;

    // Implementation for requesting summary from LLM or user
    // This is a placeholder - actual implementation depends on MCP integration
    const summary = await this.generateSummary(context, trace);

    if (this.config.summaryMinLength && summary.length < this.config.summaryMinLength) {
      throw new Error(`Summary too short (min: ${this.config.summaryMinLength})`);
    }

    if (this.config.summaryMaxLength && summary.length > this.config.summaryMaxLength) {
      throw new Error(`Summary too long (max: ${this.config.summaryMaxLength})`);
    }

    return summary;
  }

  async requestFeedback(
    summary: string,
    trace: ExecutionTrace
  ): Promise<string | null> {
    if (!this.config.requireFeedback) return null;

    // Implementation for requesting feedback
    return await this.generateFeedback(summary, trace);
  }

  private async generateSummary(context: unknown, trace: ExecutionTrace): Promise<string> {
    // Placeholder - integrate with actual summary generation
    return `Summary of execution for ${trace.toJSON().strategy}`;
  }

  private async generateFeedback(summary: string, trace: ExecutionTrace): Promise<string> {
    // Placeholder - integrate with actual feedback mechanism
    return `Feedback on: ${summary}`;
  }
}
```

**Configuration YAML**:
```yaml
# config/summary-feedback.yml
default:
  requireSummary: true
  summaryMinLength: 50
  summaryMaxLength: 500
  requireFeedback: false

strategies:
  speckit:
    requireSummary: true
    summaryMinLength: 100
    requireFeedback: true
    feedbackPrompt: "Please review the generated SpecKit artifacts"

  adr:
    requireSummary: true
    summaryMinLength: 75
    requireFeedback: false
```

**Acceptance Criteria**:
- [ ] Config loaded from YAML
- [ ] Summary validation enforced
- [ ] Feedback collection implemented
- [ ] Integration with BaseStrategy
- [ ] Unit tests with 90%+ coverage

---

##### T-004: Implement AgentHandoffCoordinator
**Effort**: 4h | **Priority**: P0

**Implementation**:
```typescript
// src/strategies/shared/agent-handoff-coordinator.ts
export interface HandoffContext {
  fromAgent: string;
  toAgent: string;
  reason: string;
  data: unknown;
  trace: ExecutionTrace;
}

export interface HandoffAnchor {
  id: string;
  description: string;
  condition: (context: unknown) => boolean;
  targetAgent: string;
}

export class AgentHandoffCoordinator {
  private anchors: Map<string, HandoffAnchor> = new Map();

  registerAnchor(anchor: HandoffAnchor): void {
    this.anchors.set(anchor.id, anchor);
  }

  async evaluateHandoff(
    currentAgent: string,
    context: unknown,
    trace: ExecutionTrace
  ): Promise<HandoffContext | null> {
    for (const [id, anchor] of this.anchors) {
      if (anchor.condition(context)) {
        trace.recordDecision(
          `Handoff triggered: ${id}`,
          `Condition met: ${anchor.description}`
        );

        return {
          fromAgent: currentAgent,
          toAgent: anchor.targetAgent,
          reason: anchor.description,
          data: context,
          trace
        };
      }
    }

    return null;
  }

  async executeHandoff(handoff: HandoffContext): Promise<void> {
    // Implementation for actual agent handoff
    // This would integrate with MCP agent communication
    console.log(`Handing off from ${handoff.fromAgent} to ${handoff.toAgent}`);
  }
}
```

**Acceptance Criteria**:
- [ ] Anchor registration implemented
- [ ] Condition evaluation working
- [ ] Handoff execution framework
- [ ] Integration with ExecutionTrace
- [ ] Unit tests with 90%+ coverage

---

##### T-005: Update OutputStrategy to Use BaseStrategy
**Effort**: 3h | **Priority**: P0 | **Dependencies**: T-001

**Migration Steps**:
1. Identify current OutputStrategy implementation
2. Extract validation logic to `validate()` method
3. Extract execution logic to `execute()` method
4. Update to extend `BaseStrategy<TInput, TOutput>`
5. Update tests to verify trace recording

**Acceptance Criteria**:
- [ ] OutputStrategy extends BaseStrategy
- [ ] All validation logic in validate()
- [ ] All execution logic in execute()
- [ ] Tests verify trace recording
- [ ] No regression in functionality

---

##### T-006: Create Summary Feedback Configuration YAML
**Effort**: 2h | **Priority**: P1 | **Dependencies**: T-003

**Deliverable**: `config/summary-feedback.yml`

**Acceptance Criteria**:
- [ ] Default configuration defined
- [ ] Per-strategy overrides supported
- [ ] Configuration validation (Zod schema)
- [ ] Documentation with examples

---

##### T-007: Unit Tests for BaseStrategy
**Effort**: 2h | **Priority**: P0 | **Dependencies**: T-001

**Test Coverage**:
- Template method flow
- Validation error handling
- Success path
- Failure path
- Trace recording
- Hook invocation (beforeExecute, afterExecute)

**Acceptance Criteria**:
- [ ] 100% line coverage
- [ ] 100% branch coverage
- [ ] All edge cases tested

---

##### T-008: Unit Tests for Coordinators
**Effort**: 2h | **Priority**: P0 | **Dependencies**: T-003, T-004

**Test Coverage**:
- SummaryFeedbackCoordinator: Config validation, summary/feedback flow
- AgentHandoffCoordinator: Anchor registration, condition evaluation, handoff execution

**Acceptance Criteria**:
- [ ] 100% coverage for both coordinators
- [ ] Integration tests with BaseStrategy
- [ ] Mock LLM/agent interactions

---

##### T-009: Implement AgentHandoffCoordinator Anchor Points
**Effort**: 2h | **Priority**: P1 | **Dependencies**: T-004

**Common Anchor Points**:
```typescript
// Example anchor definitions
const COMMON_ANCHORS: HandoffAnchor[] = [
  {
    id: 'complexity-threshold',
    description: 'Task complexity exceeds threshold',
    condition: (ctx) => ctx.complexity > 8,
    targetAgent: 'l9-distinguished-engineer'
  },
  {
    id: 'security-concern',
    description: 'Security issue detected',
    condition: (ctx) => ctx.securityFlags.length > 0,
    targetAgent: 'security-hardening-expert'
  },
  {
    id: 'architecture-decision',
    description: 'Architecture decision required',
    condition: (ctx) => ctx.requiresArchitectureDecision,
    targetAgent: 'architecture-advisor'
  }
];
```

**Acceptance Criteria**:
- [ ] 5+ common anchors defined
- [ ] Documentation for each anchor
- [ ] Tests for anchor conditions
- [ ] Integration examples

---

##### T-010: Validate Infrastructure with Coverage Check
**Effort**: 1h | **Priority**: P0 | **Dependencies**: T-007, T-008

**Validation Steps**:
1. Run full test suite: `npm run test`
2. Generate coverage report: `npm run test:coverage`
3. Verify ≥90% coverage for all infrastructure files
4. Fix any coverage gaps
5. Document coverage metrics

**Acceptance Criteria**:
- [ ] ≥90% coverage for BaseStrategy
- [ ] ≥90% coverage for ExecutionTrace
- [ ] ≥90% coverage for Coordinators
- [ ] Coverage report committed
- [ ] No failing tests

---

#### 4.1.3 Phase 1 Deliverables

| Deliverable | File Path | Description |
|-------------|-----------|-------------|
| BaseStrategy | `src/strategies/shared/base-strategy.ts` | Abstract base class |
| ExecutionTrace | `src/strategies/shared/execution-trace.ts` | Decision logging |
| SummaryFeedbackCoordinator | `src/strategies/shared/summary-feedback-coordinator.ts` | Summary collection |
| AgentHandoffCoordinator | `src/strategies/shared/agent-handoff-coordinator.ts` | Agent handoff logic |
| Configuration | `config/summary-feedback.yml` | Feedback config |
| Tests | `tests/vitest/strategies/shared/` | Comprehensive tests |

#### 4.1.4 Phase 1 Exit Criteria

- [ ] All 10 tasks (T-001 to T-010) completed
- [ ] ≥90% test coverage on infrastructure
- [ ] Documentation complete
- [ ] No blocking bugs
- [ ] Code review approved
- [ ] CI pipeline green

---

### PHASE 2: Strategy Migration (Weeks 2-3)

**Duration**: 2 weeks
**Effort**: 36 hours
**Critical Path**: ✓
**Priority**: P0
**Dependencies**: Phase 1 complete

#### 4.2.1 Objectives

Migrate 7 strategy implementations to use BaseStrategy pattern and refactor threshold arrays for clean-code-scorer and code-hygiene-analyzer.

#### 4.2.2 Detailed Tasks

##### T-011: Migrate SpecKitStrategy
**Effort**: 4h | **Priority**: P0 | **Dependencies**: T-001

**Current Structure**:
```typescript
// src/strategies/speckit-strategy.ts (BEFORE)
export class SpecKitStrategy {
  async generate(input: SpecKitInput): Promise<SpecKitOutput> {
    // Validation mixed with execution
    if (!input.projectName) throw new Error('Missing projectName');

    // Execution logic
    const spec = await this.generateSpec(input);
    const plan = await this.generatePlan(spec);
    const tasks = await this.generateTasks(plan);

    return { spec, plan, tasks };
  }
}
```

**Target Structure**:
```typescript
// src/strategies/speckit-strategy.ts (AFTER)
import { BaseStrategy, StrategyResult, ValidationResult } from './shared/base-strategy.js';

export class SpecKitStrategy extends BaseStrategy<SpecKitInput, SpecKitOutput> {
  validate(input: SpecKitInput): ValidationResult {
    const errors: ValidationError[] = [];

    if (!input.projectName) {
      errors.push({ field: 'projectName', message: 'Project name is required' });
    }

    if (!input.description) {
      errors.push({ field: 'description', message: 'Description is required' });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings: []
    };
  }

  async execute(input: SpecKitInput): Promise<SpecKitOutput> {
    this.trace.recordDecision('Generating SpecKit artifacts', 'User requested SpecKit generation');

    const spec = await this.generateSpec(input);
    this.trace.recordMetric('spec_size_bytes', JSON.stringify(spec).length);

    const plan = await this.generatePlan(spec);
    this.trace.recordMetric('plan_phases', plan.phases.length);

    const tasks = await this.generateTasks(plan);
    this.trace.recordMetric('total_tasks', tasks.length);

    return { spec, plan, tasks };
  }

  private async generateSpec(input: SpecKitInput): Promise<Spec> {
    // Existing implementation
  }

  private async generatePlan(spec: Spec): Promise<Plan> {
    // Existing implementation
  }

  private async generateTasks(plan: Plan): Promise<Task[]> {
    // Existing implementation
  }
}
```

**Migration Checklist**:
- [ ] Extract validation to `validate()` method
- [ ] Extract execution to `execute()` method
- [ ] Add trace.recordDecision() calls for key decisions
- [ ] Add trace.recordMetric() calls for quantifiable metrics
- [ ] Update tests to verify trace recording
- [ ] Verify no regression in output quality

---

##### T-012 to T-017: Migrate Remaining Strategies

Follow the same pattern as T-011 for:
- **T-012**: TOGAFStrategy (4h)
- **T-013**: ADRStrategy (4h)
- **T-014**: RFCStrategy (4h)
- **T-015**: EnterpriseStrategy (4h)
- **T-016**: SDDStrategy (4h)
- **T-017**: ChatStrategy (4h)

Each migration includes:
1. Validation extraction
2. Execution extraction
3. Trace integration
4. Test updates
5. Regression verification

---

##### T-018: Refactor clean-code-scorer Thresholds
**Effort**: 4h | **Priority**: P0

**Current Structure**:
```typescript
// Scattered threshold constants
const LOW_COMPLEXITY_THRESHOLD = 5;
const MEDIUM_COMPLEXITY_THRESHOLD = 10;
const HIGH_COMPLEXITY_THRESHOLD = 15;

if (complexity < LOW_COMPLEXITY_THRESHOLD) {
  score = 100;
} else if (complexity < MEDIUM_COMPLEXITY_THRESHOLD) {
  score = 80;
} // ...
```

**Target Structure**:
```typescript
// src/tools/code-analysis/clean-code-scorer/thresholds.ts
export const COMPLEXITY_THRESHOLDS = [
  { max: 5, score: 100, label: 'Excellent' },
  { max: 10, score: 80, label: 'Good' },
  { max: 15, score: 60, label: 'Fair' },
  { max: 20, score: 40, label: 'Poor' },
  { max: Infinity, score: 20, label: 'Critical' }
] as const;

export const MAINTAINABILITY_THRESHOLDS = [
  { min: 90, label: 'Excellent', color: 'green' },
  { min: 70, label: 'Good', color: 'yellow' },
  { min: 50, label: 'Fair', color: 'orange' },
  { min: 0, label: 'Poor', color: 'red' }
] as const;

// Usage:
function scoreComplexity(complexity: number): number {
  const threshold = COMPLEXITY_THRESHOLDS.find(t => complexity <= t.max);
  return threshold?.score ?? 0;
}
```

**Benefits**:
- Single source of truth
- Easy to adjust thresholds
- Self-documenting
- Type-safe with `as const`

**Acceptance Criteria**:
- [ ] All thresholds extracted to arrays
- [ ] Type-safe threshold definitions
- [ ] Helper functions for threshold lookup
- [ ] Tests verify threshold logic
- [ ] Documentation updated

---

##### T-019: Refactor code-hygiene-analyzer Thresholds
**Effort**: 4h | **Priority**: P0

Similar pattern to T-018:
```typescript
// src/tools/code-analysis/code-hygiene-analyzer/thresholds.ts
export const HYGIENE_THRESHOLDS = [
  {
    category: 'naming',
    thresholds: [
      { max: 0, score: 100, label: 'Perfect' },
      { max: 3, score: 80, label: 'Good' },
      { max: 10, score: 60, label: 'Needs Improvement' },
      { max: Infinity, score: 40, label: 'Poor' }
    ]
  },
  {
    category: 'comments',
    thresholds: [
      { min: 15, max: 30, score: 100, label: 'Optimal' },
      { min: 10, max: 40, score: 80, label: 'Acceptable' },
      { min: 0, max: Infinity, score: 60, label: 'Suboptimal' }
    ]
  }
] as const;
```

**Acceptance Criteria**:
- [ ] All hygiene thresholds in arrays
- [ ] Category-based organization
- [ ] Helper functions implemented
- [ ] Tests updated
- [ ] No regression in scoring

---

##### T-020: Refactor validate-spec and update-progress Thresholds
**Effort**: 4h | **Priority**: P0

**Target Structure**:
```typescript
// src/tools/enforcement/thresholds.ts
export const SPEC_COMPLETENESS_THRESHOLDS = [
  { min: 90, label: 'Complete', status: 'pass' },
  { min: 70, label: 'Mostly Complete', status: 'warning' },
  { min: 50, label: 'Incomplete', status: 'fail' }
] as const;

export const PROGRESS_COMPLETION_THRESHOLDS = [
  { min: 100, label: 'Done', icon: '✅' },
  { min: 75, label: 'Nearly Done', icon: '🟢' },
  { min: 50, label: 'In Progress', icon: '🟡' },
  { min: 25, label: 'Started', icon: '🟠' },
  { min: 0, label: 'Not Started', icon: '🔵' }
] as const;
```

**Acceptance Criteria**:
- [ ] Spec validation thresholds extracted
- [ ] Progress thresholds extracted
- [ ] Icon/status mapping included
- [ ] Helper functions working
- [ ] Tests comprehensive

---

#### 4.2.3 Phase 2 Deliverables

| Deliverable | File Count | Description |
|-------------|------------|-------------|
| Migrated Strategies | 7 files | All extend BaseStrategy |
| Threshold Arrays | 3 files | Clean-code, hygiene, enforcement |
| Updated Tests | 10+ files | Trace verification added |
| Documentation | Updated | Migration notes |

#### 4.2.4 Phase 2 Exit Criteria

- [ ] All 10 tasks (T-011 to T-020) completed
- [ ] All strategies extend BaseStrategy
- [ ] All thresholds refactored to arrays
- [ ] ≥90% test coverage maintained
- [ ] No regressions in functionality
- [ ] Code review approved

---

### PHASE 2.5: Unified Prompt Ecosystem (Weeks 3-4) ★

**Duration**: 2 weeks
**Effort**: 55 hours
**Critical Path**: ✓
**Priority**: P0
**Dependencies**: Phase 2 complete

> **⚠️ BREAKING CHANGE PHASE**: This phase operates under strict "no backward compatibility" policy. Old prompt builder implementations will be deleted. Compatibility maintained ONLY via Legacy Facades.

#### 4.2.5.1 Objectives

Consolidate 12+ fragmented prompt builder tools into a single, unified architecture with domain-driven design.

**Current Fragmented State**:
- `hierarchical-prompt-builder` (3 levels: L1-L9)
- `domain-neutral-prompt-builder`
- `hierarchy-level-selector`
- `prompt-flow-builder`
- `spark-ux-prompt-builder`
- `security-prompt-builder` (OWASP, threat modeling)
- `code-analysis-prompt-builder`
- `architecture-design-prompt-builder`
- `prompt-chain-builder`
- ...and more

**Target Unified State**:
```
UnifiedPromptBuilder (Hub)
├── Registry (domain mappings)
├── Template Engine (slot injection)
└── Domain Modules
    ├── domain-neutral.ts
    ├── spark.ts
    ├── security.ts
    ├── architecture.ts
    ├── code-analysis.ts
    ├── hierarchical-base.ts
    ├── flow.ts
    └── chain.ts
```

#### 4.2.5.2 Detailed Tasks

##### T-021: [PROMPT-001] Implement UnifiedPromptBuilder Core Hub
**Effort**: 6h | **Priority**: P0

**Implementation**:
```typescript
// src/prompts/core/unified-prompt-builder.ts
import { z } from 'zod';
import { TemplateEngine } from './template-engine.js';
import type { PromptGenerator } from './types.js';

const PromptRequestSchema = z.object({
  domain: z.enum([
    'domain-neutral',
    'spark-ux',
    'security',
    'architecture',
    'code-analysis',
    'hierarchical',
    'flow',
    'chain'
  ]),
  context: z.string(),
  goal: z.string(),
  constraints: z.array(z.string()).optional(),
  options: z.record(z.unknown()).optional()
});

export type PromptRequest = z.infer<typeof PromptRequestSchema>;

export class UnifiedPromptBuilder {
  private registry: Map<string, PromptGenerator> = new Map();
  private templateEngine: TemplateEngine;

  constructor() {
    this.templateEngine = new TemplateEngine();
  }

  register(domain: string, generator: PromptGenerator): void {
    if (this.registry.has(domain)) {
      throw new Error(`Domain ${domain} already registered`);
    }
    this.registry.set(domain, generator);
  }

  async build(request: PromptRequest): Promise<PromptResult> {
    const validated = PromptRequestSchema.parse(request);

    const generator = this.registry.get(validated.domain);
    if (!generator) {
      throw new Error(`No generator registered for domain: ${validated.domain}`);
    }

    const rawPrompt = await generator.generate(validated);
    const finalPrompt = this.templateEngine.inject(rawPrompt, validated.options);

    return {
      prompt: finalPrompt,
      metadata: {
        domain: validated.domain,
        timestamp: new Date(),
        version: '1.0.0'
      }
    };
  }

  // Backward compatibility facades (delegate to domain generators)
  async buildHierarchical(input: HierarchicalInput): Promise<PromptResult> {
    return this.build({
      domain: 'hierarchical',
      context: input.context,
      goal: input.goal,
      options: {
        level: input.level,
        expertise: input.expertise
      }
    });
  }

  async buildDomainNeutral(input: DomainNeutralInput): Promise<PromptResult> {
    return this.build({
      domain: 'domain-neutral',
      context: input.context,
      goal: input.goal,
      options: input.options
    });
  }
}
```

**Acceptance Criteria**:
- [ ] Registry pattern implemented
- [ ] Domain validation via Zod
- [ ] Template engine integration
- [ ] Backward compat facades
- [ ] Error handling for unknown domains
- [ ] 100% unit test coverage

---

##### T-022: [PROMPT-002] Implement Template Engine
**Effort**: 4h | **Priority**: P0

**Implementation**:
```typescript
// src/prompts/core/template-engine.ts
export interface Slot {
  name: string;
  required: boolean;
  defaultValue?: string;
}

export class TemplateEngine {
  private slotPattern = /\{\{(\w+)(?:\|(required|optional))?\}\}/g;

  inject(template: string, values: Record<string, unknown> = {}): string {
    const slots = this.extractSlots(template);

    // Validate required slots
    const missing = slots
      .filter(s => s.required && !(s.name in values))
      .map(s => s.name);

    if (missing.length > 0) {
      throw new Error(`Missing required slots: ${missing.join(', ')}`);
    }

    // Inject values
    return template.replace(this.slotPattern, (match, name, modifier) => {
      const value = values[name];
      if (value !== undefined) {
        return String(value);
      }

      // Use default if provided
      const slot = slots.find(s => s.name === name);
      if (slot?.defaultValue) {
        return slot.defaultValue;
      }

      // Optional slots can be empty
      if (modifier === 'optional') {
        return '';
      }

      return match; // Keep original if no value
    });
  }

  private extractSlots(template: string): Slot[] {
    const slots: Slot[] = [];
    let match;

    while ((match = this.slotPattern.exec(template)) !== null) {
      const [, name, modifier] = match;
      slots.push({
        name,
        required: modifier !== 'optional',
        defaultValue: undefined
      });
    }

    return slots;
  }
}
```

**Template Example**:
```typescript
const template = `
You are a {{role|required}} with expertise in {{domain|required}}.

Context: {{context|required}}

Goal: {{goal|required}}

{{constraints|optional}}

Please provide a detailed analysis.
`;

const result = engine.inject(template, {
  role: 'L9 Distinguished Engineer',
  domain: 'distributed systems',
  context: 'Microservices architecture',
  goal: 'Design fault-tolerant system',
  constraints: 'Constraints: Must support 10M requests/day'
});
```

**Acceptance Criteria**:
- [ ] Slot extraction working
- [ ] Required slot validation
- [ ] Optional slot handling
- [ ] Default value support
- [ ] 100% test coverage

---

##### T-023 to T-031: Migrate Domain Logic to Modules

Each domain migration follows this pattern:

**T-023: [PROMPT-003] Migrate DomainNeutral Logic**
**Effort**: 3h | **Priority**: P0

```typescript
// src/domain/prompts/domains/domain-neutral.ts
import { PromptGenerator, PromptRequest, PromptResult } from '../types.js';

export class DomainNeutralGenerator implements PromptGenerator {
  async generate(request: PromptRequest): Promise<string> {
    return `
You are an AI assistant helping with: ${request.goal}

Context:
${request.context}

${request.constraints ? `Constraints:\n${request.constraints.join('\n')}` : ''}

Please provide a comprehensive response that:
1. Addresses the goal directly
2. Considers the provided context
3. Adheres to any constraints
4. Provides actionable recommendations
`;
  }
}
```

**Remaining Migrations** (same pattern):
- **T-024**: [PROMPT-004] Spark (UX/UI) - 3h
- **T-025**: [PROMPT-005] CodeAnalysis - 3h
- **T-026**: [PROMPT-006] ArchitectureDesign - 3h
- **T-027**: [PROMPT-007] Hierarchical Base - 4h
- **T-028**: [PROMPT-008] Hierarchy Strategies (L1-L9 variants) - 4h
- **T-029**: [PROMPT-009] Security (OWASP/Threat) - 4h
- **T-030**: [PROMPT-010] Flow (Sequential) - 3h
- **T-031**: [PROMPT-011] Chain (Dependency) - 3h

Each includes:
- Pure domain logic extraction
- Interface implementation
- Template definition
- Unit tests
- Documentation

---

##### T-032: [PROMPT-012] Apply GENERATOR_TOOL_ANNOTATIONS
**Effort**: 2h | **Priority**: P0 | **Related**: GAP-001

```typescript
// src/tools/shared/tool-annotations.ts
export const GENERATOR_TOOL_ANNOTATIONS: ToolAnnotations = {
  readOnlyHint: false,        // Generators create artifacts
  idempotentHint: false,      // Different prompts each time
  openWorldHint: false,       // Self-contained logic
  destructiveHint: false      // No deletion/overwrite
};

// Apply to all prompt tools
// src/tools/prompts/unified-prompt-builder.ts
const tool: Tool = {
  name: 'prompt.build',
  description: 'Unified prompt generation hub. BEST FOR: All prompt types. OUTPUTS: Tailored prompts.',
  inputSchema: zodToJsonSchema(PromptRequestSchema),
  annotations: GENERATOR_TOOL_ANNOTATIONS  // ← Applied
};
```

**Acceptance Criteria**:
- [ ] Annotations defined
- [ ] Applied to unified tool
- [ ] Applied to legacy facades
- [ ] Documented in ADR-002
- [ ] Validated via enforcement tool

---

##### T-033: [PROMPT-013] Implement Legacy Facade Layer
**Effort**: 6h | **Priority**: P0

**Purpose**: Maintain backward compatibility without preserving old implementation.

```typescript
// src/tools/prompts/legacy-facades/hierarchical-facade.ts
import { UnifiedPromptBuilder } from '../unified-prompt-builder.js';
import { warnDeprecated } from '../../shared/deprecation.js';

export class HierarchicalPromptBuilderFacade {
  private hub: UnifiedPromptBuilder;

  constructor(hub: UnifiedPromptBuilder) {
    this.hub = hub;
  }

  async build(input: HierarchicalInput): Promise<PromptResult> {
    warnDeprecated({
      oldName: 'hierarchical-prompt-builder',
      newName: 'prompt.build',
      removalVersion: '0.15.0'
    });

    return this.hub.buildHierarchical(input);
  }
}
```

**Facades Required**:
- HierarchicalPromptBuilderFacade
- DomainNeutralPromptBuilderFacade
- HierarchyLevelSelectorFacade
- PromptFlowBuilderFacade
- SparkUXPromptBuilderFacade
- SecurityPromptBuilderFacade
- CodeAnalysisPromptBuilderFacade
- ArchitectureDesignPromptBuilderFacade
- PromptChainBuilderFacade

**Acceptance Criteria**:
- [ ] All legacy tool names have facades
- [ ] Deprecation warnings shown
- [ ] Delegation to UnifiedPromptBuilder working
- [ ] MCP registration maintained
- [ ] Tests verify backward compat

---

##### T-034: [PROMPT-014] Cleanup/Delete Old Implementations
**Effort**: 3h | **Priority**: P1

**Deletion List**:
```bash
# Files to DELETE (after facades working)
src/tools/prompts/hierarchical-prompt-builder.ts
src/tools/prompts/domain-neutral-prompt-builder.ts
src/tools/prompts/hierarchy-level-selector.ts
src/tools/prompts/prompt-flow-builder.ts
src/tools/prompts/spark-ux-prompt-builder.ts
src/tools/prompts/security-prompt-builder.ts
src/tools/prompts/code-analysis-prompt-builder.ts
src/tools/prompts/architecture-design-prompt-builder.ts
src/tools/prompts/prompt-chain-builder.ts

# Total: ~3000 lines of code removed
```

**Process**:
1. Verify all facades working
2. Run full test suite
3. Delete old files
4. Update imports
5. Verify CI green
6. Commit with message: `refactor [T034]: delete legacy prompt implementations (replaced by unified hub)`

**Acceptance Criteria**:
- [ ] All legacy files deleted
- [ ] No broken imports
- [ ] All tests passing
- [ ] CI pipeline green
- [ ] Git history preserved

---

##### T-035: Comprehensive Integration Tests
**Effort**: 4h | **Priority**: P0

```typescript
// tests/vitest/tools/prompts/unified-integration.spec.ts
describe('UnifiedPromptBuilder Integration', () => {
  let hub: UnifiedPromptBuilder;

  beforeEach(() => {
    hub = new UnifiedPromptBuilder();
    // Register all domain generators
  });

  it('should handle all domain types', async () => {
    const domains = [
      'domain-neutral',
      'spark-ux',
      'security',
      'architecture',
      'code-analysis',
      'hierarchical',
      'flow',
      'chain'
    ];

    for (const domain of domains) {
      const result = await hub.build({
        domain,
        context: 'Test context',
        goal: 'Test goal'
      });

      expect(result.prompt).toBeTruthy();
      expect(result.metadata.domain).toBe(domain);
    }
  });

  it('should maintain backward compatibility via facades', async () => {
    const legacyResult = await hub.buildHierarchical({
      context: 'Legacy context',
      goal: 'Legacy goal',
      level: 'L9'
    });

    expect(legacyResult.prompt).toContain('L9');
  });

  it('should throw on unknown domain', async () => {
    await expect(hub.build({
      domain: 'unknown' as any,
      context: 'test',
      goal: 'test'
    })).rejects.toThrow('No generator registered');
  });
});
```

**Acceptance Criteria**:
- [ ] All domains tested
- [ ] Backward compat verified
- [ ] Error cases covered
- [ ] Performance benchmarks
- [ ] 90%+ coverage

---

##### T-036: Apply Annotations to Non-Prompt Tools (GAP-001 Remainder)
**Effort**: 3h | **Priority**: P1

Apply appropriate annotations to all 30+ tools:

```typescript
// Analysis tools
export const ANALYSIS_TOOL_ANNOTATIONS: ToolAnnotations = {
  readOnlyHint: true,
  idempotentHint: true,
  openWorldHint: false,
  destructiveHint: false
};

// Design tools
export const DESIGN_TOOL_ANNOTATIONS: ToolAnnotations = {
  readOnlyHint: false,
  idempotentHint: false,
  openWorldHint: true,
  destructiveHint: false
};

// Project tools (file system access)
export const PROJECT_TOOL_ANNOTATIONS: ToolAnnotations = {
  readOnlyHint: false,
  idempotentHint: false,
  openWorldHint: true,
  destructiveHint: false
};
```

**Tool Categorization**:
- **Analysis** (readOnly, idempotent): clean-code-scorer, code-hygiene-analyzer, semantic-analyzer
- **Design** (non-readonly): design-assistant, speckit-generator
- **Project** (open-world): project-onboarding, dependency-auditor
- **Generators** (covered in T-032): All prompt tools

**Acceptance Criteria**:
- [ ] All 30+ tools annotated
- [ ] Correct category applied
- [ ] Validation script passes
- [ ] ADR-002 updated
- [ ] CSV export includes annotations

---

##### T-037: Create UnifiedPromptBuilder Documentation
**Effort**: 3h | **Priority**: P1

**Deliverable**: `docs/tools/unified-prompt-builder.md`

**Content**:
1. Overview and motivation
2. Architecture diagram
3. Domain reference
   - Domain-neutral
   - Spark UX
   - Security
   - Architecture
   - Code Analysis
   - Hierarchical
   - Flow
   - Chain
4. Usage examples (all domains)
5. Migration guide from legacy tools
6. Template syntax reference
7. Extending with custom domains

**Acceptance Criteria**:
- [ ] All sections complete
- [ ] Code examples tested
- [ ] Migration paths documented
- [ ] Template syntax explained
- [ ] Reviewed and approved

---

##### T-038: Verify "No Backward Compatibility" Rule
**Effort**: 2h | **Priority**: P0

**Regression Test**:
```typescript
// tests/vitest/phase-2-5-verification.spec.ts
describe('Phase 2.5 Breaking Change Verification', () => {
  it('should have deleted all legacy implementations', () => {
    const legacyFiles = [
      'src/tools/prompts/hierarchical-prompt-builder.ts',
      'src/tools/prompts/domain-neutral-prompt-builder.ts',
      // ... all legacy files
    ];

    legacyFiles.forEach(file => {
      expect(fs.existsSync(file)).toBe(false);
    });
  });

  it('should have facades for backward compatibility', () => {
    const facades = [
      'src/tools/prompts/legacy-facades/hierarchical-facade.ts',
      'src/tools/prompts/legacy-facades/domain-neutral-facade.ts',
      // ... all facades
    ];

    facades.forEach(file => {
      expect(fs.existsSync(file)).toBe(true);
    });
  });

  it('should show deprecation warnings', async () => {
    const consoleSpy = jest.spyOn(console, 'warn');

    const facade = new HierarchicalPromptBuilderFacade(hub);
    await facade.build({ /* ... */ });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('hierarchical-prompt-builder is deprecated')
    );
  });
});
```

**Acceptance Criteria**:
- [ ] All legacy files verified deleted
- [ ] All facades verified present
- [ ] Deprecation warnings working
- [ ] No direct old implementations accessible
- [ ] Test suite validates breaking changes

---

#### 4.2.5.3 Phase 2.5 Deliverables

| Deliverable | File Count | LOC Impact | Description |
|-------------|------------|------------|-------------|
| UnifiedPromptBuilder | 1 | +300 | Central hub |
| TemplateEngine | 1 | +150 | Slot injection |
| Domain Modules | 8 | +800 | Pure logic |
| Legacy Facades | 9 | +450 | Backward compat |
| Deleted Files | 9 | -3000 | Old implementations |
| Tests | 12+ | +1200 | Comprehensive coverage |
| Documentation | 1 | +500 | Usage guide |
| **Net Impact** | **-** | **-600** | **Code reduction** |

#### 4.2.5.4 Phase 2.5 Exit Criteria

- [ ] All 18 tasks (T-021 to T-038) completed
- [ ] UnifiedPromptBuilder fully functional
- [ ] All 8 domains implemented
- [ ] Legacy facades working
- [ ] Old implementations deleted
- [ ] ≥90% test coverage
- [ ] ADR-003 documented
- [ ] Migration guide complete
- [ ] No breaking changes to MCP clients (via facades)
- [ ] CI pipeline green

---

### PHASE 3: Framework Consolidation (Weeks 4-6)

**Duration**: 2 weeks
**Effort**: 42 hours
**Critical Path**: ✓
**Priority**: P0
**Dependencies**: Phase 2.5 complete

#### 4.3.1 Objectives

Consolidate 30+ analysis frameworks into 11 unified frameworks with a registry-based routing system.

**Current State**: 30+ scattered framework implementations
**Target State**: 11 unified frameworks with FrameworkRegistry

#### 4.3.2 Framework Mapping

| Category | Current Frameworks (30+) | Target Framework | LOC Reduction |
|----------|-------------------------|------------------|---------------|
| Gap Analysis | 8 implementations | GapAnalysisFramework | ~2000 → 400 |
| Strategy Analysis | 7 implementations | StrategyFramework | ~1800 → 350 |
| Code Hygiene | 6 implementations | CodeHygieneFramework | ~1500 → 300 |
| Architecture | 5 implementations | ArchitectureFramework | ~1200 → 250 |
| Security | 4 implementations | SecurityFramework | ~1000 → 200 |

**Total Consolidation**: ~10,000 LOC → ~2,500 LOC (75% reduction)

#### 4.3.3 Detailed Tasks

##### T-039: Create AnalysisFrameworkRegistry
**Effort**: 4h | **Priority**: P1

```typescript
// src/frameworks/registry.ts
import { z } from 'zod';

const FrameworkRequestSchema = z.object({
  type: z.enum([
    'gap-analysis',
    'strategy',
    'code-hygiene',
    'architecture',
    'security',
    'performance',
    'maintainability',
    'testing',
    'documentation',
    'deployment',
    'monitoring'
  ]),
  context: z.string(),
  options: z.record(z.unknown()).optional()
});

export class AnalysisFrameworkRegistry {
  private frameworks: Map<string, FrameworkInterface> = new Map();

  register(type: string, framework: FrameworkInterface): void {
    this.frameworks.set(type, framework);
  }

  async analyze(request: FrameworkRequest): Promise<FrameworkResult> {
    const validated = FrameworkRequestSchema.parse(request);

    const framework = this.frameworks.get(validated.type);
    if (!framework) {
      throw new Error(`Unknown framework type: ${validated.type}`);
    }

    return framework.execute(validated);
  }

  listAvailable(): string[] {
    return Array.from(this.frameworks.keys());
  }
}
```

**Acceptance Criteria**:
- [ ] Registry pattern implemented
- [ ] Type validation via Zod
- [ ] Framework lookup working
- [ ] Error handling for unknown types
- [ ] Unit tests 90%+ coverage

---

##### T-040: Consolidate GapAnalysis Frameworks
**Effort**: 6h | **Priority**: P1

**Current Implementations** (8 files):
- gap-analysis-basic.ts
- gap-analysis-strategic.ts
- gap-analysis-technical.ts
- gap-analysis-process.ts
- gap-analysis-cultural.ts
- gap-analysis-comprehensive.ts
- gap-analysis-rapid.ts
- gap-analysis-detailed.ts

**Target Implementation** (1 file):
```typescript
// src/frameworks/analysis/gap-analysis.ts
export interface GapAnalysisOptions {
  depth: 'basic' | 'strategic' | 'technical' | 'comprehensive';
  focus?: 'process' | 'cultural' | 'all';
  speed?: 'rapid' | 'detailed';
}

export class GapAnalysisFramework implements FrameworkInterface {
  async execute(request: FrameworkRequest): Promise<FrameworkResult> {
    const options = this.parseOptions(request.options);

    const analyzer = this.getAnalyzer(options);
    const gaps = await analyzer.analyze(request.context);

    return {
      type: 'gap-analysis',
      result: gaps,
      metadata: {
        depth: options.depth,
        timestamp: new Date()
      }
    };
  }

  private getAnalyzer(options: GapAnalysisOptions): GapAnalyzer {
    // Factory pattern for different analyzer types
    switch (options.depth) {
      case 'basic':
        return new BasicGapAnalyzer();
      case 'strategic':
        return new StrategicGapAnalyzer();
      case 'technical':
        return new TechnicalGapAnalyzer();
      case 'comprehensive':
        return new ComprehensiveGapAnalyzer(options);
      default:
        return new BasicGapAnalyzer();
    }
  }
}
```

**Consolidation Strategy**:
1. Extract common logic (80% shared)
2. Parameterize differences via options
3. Use strategy pattern for variants
4. Delete 7 of 8 files
5. Update tests

**Acceptance Criteria**:
- [ ] Single unified implementation
- [ ] All 8 variants supported via options
- [ ] No functionality lost
- [ ] Tests migrated and passing
- [ ] ~1600 LOC reduction

---

##### T-041: Consolidate Strategy Frameworks (SWOT, etc.)
**Effort**: 6h | **Priority**: P1

Similar pattern to T-040:

**Current**: 7 framework files
**Target**: 1 unified StrategyFramework

```typescript
// src/frameworks/analysis/strategy.ts
export interface StrategyOptions {
  method: 'swot' | 'pestel' | 'porter' | 'vrio' | 'bcg' | 'ansoff' | 'okr';
  depth: 'summary' | 'detailed' | 'comprehensive';
}

export class StrategyFramework implements FrameworkInterface {
  async execute(request: FrameworkRequest): Promise<FrameworkResult> {
    const options = this.parseOptions(request.options);
    const analyzer = this.getStrategyAnalyzer(options.method);

    return analyzer.analyze(request.context, options.depth);
  }

  private getStrategyAnalyzer(method: string): StrategyAnalyzer {
    const analyzers = {
      'swot': new SWOTAnalyzer(),
      'pestel': new PESTELAnalyzer(),
      'porter': new PorterAnalyzer(),
      'vrio': new VRIOAnalyzer(),
      'bcg': new BCGMatrixAnalyzer(),
      'ansoff': new AnsoffAnalyzer(),
      'okr': new OKRAnalyzer()
    };

    return analyzers[method] || analyzers['swot'];
  }
}
```

**Acceptance Criteria**:
- [ ] 7 strategies consolidated
- [ ] All methods supported
- [ ] ~1450 LOC reduction
- [ ] Tests comprehensive
- [ ] Documentation updated

---

##### T-042: Consolidate CodeHygiene Frameworks
**Effort**: 5h | **Priority**: P1

**Target**:
```typescript
// src/frameworks/analysis/code-hygiene.ts
export interface CodeHygieneOptions {
  checks: ('naming' | 'comments' | 'complexity' | 'duplication' | 'style' | 'security')[];
  strictness: 'lenient' | 'moderate' | 'strict';
  language?: string;
}

export class CodeHygieneFramework implements FrameworkInterface {
  async execute(request: FrameworkRequest): Promise<FrameworkResult> {
    const options = this.parseOptions(request.options);
    const results: HygieneResult[] = [];

    for (const check of options.checks) {
      const checker = this.getChecker(check);
      const result = await checker.check(request.context, options.strictness);
      results.push(result);
    }

    return {
      type: 'code-hygiene',
      result: this.aggregate(results),
      metadata: { checks: options.checks }
    };
  }
}
```

**Acceptance Criteria**:
- [ ] 6 frameworks → 1
- [ ] All checks configurable
- [ ] ~1200 LOC reduction
- [ ] Integration with clean-code-scorer
- [ ] Tests passing

---

##### T-043: Implement warnDeprecated Helper (GAP-004)
**Effort**: 3h | **Priority**: P1

```typescript
// src/tools/shared/deprecation.ts
interface DeprecationWarning {
  oldName: string;
  newName: string;
  removalVersion: string;
  migrationUrl?: string;
}

const warnedTools: Set<string> = new Set();

export function warnDeprecated(warning: DeprecationWarning): void {
  // Warn only once per session per tool
  if (warnedTools.has(warning.oldName)) {
    return;
  }

  warnedTools.add(warning.oldName);

  const message = [
    `⚠️  DEPRECATION WARNING: '${warning.oldName}' is deprecated`,
    `   → Use '${warning.newName}' instead`,
    `   → Will be removed in version ${warning.removalVersion}`,
    warning.migrationUrl ? `   → Migration guide: ${warning.migrationUrl}` : null
  ].filter(Boolean).join('\n');

  console.warn(message);
}

// Registry of all deprecations
export const DEPRECATION_REGISTRY: DeprecationWarning[] = [
  {
    oldName: 'hierarchical-prompt-builder',
    newName: 'prompt.build',
    removalVersion: '0.15.0',
    migrationUrl: 'https://docs.example.com/migration/prompts'
  },
  {
    oldName: 'gap-analysis-strategic',
    newName: 'analysis.framework (type: gap-analysis, depth: strategic)',
    removalVersion: '0.15.0'
  }
  // ... all deprecations
];
```

**Acceptance Criteria**:
- [ ] Warn-once-per-session logic
- [ ] Deprecation registry
- [ ] Integration with facades
- [ ] Tests verify warning shown once
- [ ] Documentation complete

---

##### T-044: Apply warnDeprecated to Old Framework Entry Points
**Effort**: 2h | **Priority**: P1 | **Dependencies**: T-043

**Pattern**:
```typescript
// src/frameworks/legacy/gap-analysis-strategic.ts (facade)
import { AnalysisFrameworkRegistry } from '../registry.js';
import { warnDeprecated } from '../../tools/shared/deprecation.js';

export async function gapAnalysisStrategic(context: string): Promise<GapResult> {
  warnDeprecated({
    oldName: 'gap-analysis-strategic',
    newName: 'analysis.framework',
    removalVersion: '0.15.0'
  });

  const registry = new AnalysisFrameworkRegistry();
  return registry.analyze({
    type: 'gap-analysis',
    context,
    options: { depth: 'strategic' }
  });
}
```

**Apply to**:
- 8 gap analysis variants
- 7 strategy frameworks
- 6 code hygiene frameworks
- 5 architecture frameworks
- 4 security frameworks

**Acceptance Criteria**:
- [ ] All legacy entry points have facades
- [ ] Deprecation warnings shown
- [ ] Delegation working
- [ ] Tests verify behavior
- [ ] MCP registration maintained

---

##### T-045: Update Zod Schemas with .describe() Examples (GAP-002)
**Effort**: 5h | **Priority**: P0

**Pattern**:
```typescript
// BEFORE
const AnalysisSchema = z.object({
  projectPath: z.string(),
  depth: z.number(),
  includeTests: z.boolean()
});

// AFTER
const AnalysisSchema = z.object({
  projectPath: z.string()
    .describe('Absolute path to project directory. Example: /home/user/my-project'),
  depth: z.number()
    .min(1).max(5)
    .describe('Analysis depth level (1-5). Example: 3 for moderate depth'),
  includeTests: z.boolean()
    .describe('Whether to include test files in analysis. Example: true')
});
```

**Scope**:
- All tool input schemas
- All framework schemas
- All strategy schemas
- All domain schemas

**Target**: 80%+ coverage

**Acceptance Criteria**:
- [ ] All schemas have .describe()
- [ ] Examples follow format: "Description. Example: value"
- [ ] Validation script passes
- [ ] Coverage report generated
- [ ] Documentation updated

---

##### T-046: Test Schema Descriptions
**Effort**: 3h | **Priority**: P1 | **Dependencies**: T-045

```typescript
// tests/vitest/schemas/description-coverage.spec.ts
import { getAllSchemas } from '../helpers/schema-collector.js';

describe('Schema Description Coverage', () => {
  it('should have descriptions on all schema fields', () => {
    const schemas = getAllSchemas();
    const missing: string[] = [];

    for (const [name, schema] of schemas) {
      const fields = getSchemaFields(schema);
      for (const field of fields) {
        if (!field.description || !field.description.includes('Example:')) {
          missing.push(`${name}.${field.name}`);
        }
      }
    }

    expect(missing).toHaveLength(0);
  });

  it('should have valid example values in descriptions', () => {
    // Validate examples are well-formed
  });
});
```

**Acceptance Criteria**:
- [ ] Coverage test implemented
- [ ] All schemas validated
- [ ] Example format enforced
- [ ] CI integration
- [ ] Report generation

---

##### T-047: Remove Redundant Frameworks After Consolidation
**Effort**: 2h | **Priority**: P1

**Deletion Candidates**:
```bash
# Gap Analysis (delete 7, keep 1)
src/frameworks/gap-analysis-strategic.ts
src/frameworks/gap-analysis-technical.ts
src/frameworks/gap-analysis-process.ts
src/frameworks/gap-analysis-cultural.ts
src/frameworks/gap-analysis-comprehensive.ts
src/frameworks/gap-analysis-rapid.ts
src/frameworks/gap-analysis-detailed.ts

# Strategy (delete 6, keep 1)
src/frameworks/swot-analysis.ts
src/frameworks/pestel-analysis.ts
src/frameworks/porter-analysis.ts
src/frameworks/vrio-analysis.ts
src/frameworks/bcg-matrix.ts
src/frameworks/ansoff-matrix.ts

# Code Hygiene (delete 5, keep 1)
# ... and so on

# Total files deleted: ~25
# Total LOC removed: ~8,000
```

**Process**:
1. Verify all facades working
2. Run full test suite
3. Delete redundant files
4. Update imports
5. Verify CI green

**Acceptance Criteria**:
- [ ] ~25 files deleted
- [ ] ~8,000 LOC removed
- [ ] No broken references
- [ ] All tests passing
- [ ] CI pipeline green

---

##### T-048: Update clean-code-scorer to Use Consolidations
**Effort**: 4h | **Priority**: P1

**Integration**:
```typescript
// src/tools/code-analysis/clean-code-scorer.ts
import { AnalysisFrameworkRegistry } from '../../frameworks/registry.js';

export async function scoreProject(projectPath: string): Promise<ScoreResult> {
  const registry = new AnalysisFrameworkRegistry();

  // Use unified code hygiene framework
  const hygieneResult = await registry.analyze({
    type: 'code-hygiene',
    context: projectPath,
    options: {
      checks: ['naming', 'comments', 'complexity', 'duplication'],
      strictness: 'moderate'
    }
  });

  // Use unified architecture framework
  const archResult = await registry.analyze({
    type: 'architecture',
    context: projectPath,
    options: { depth: 'summary' }
  });

  return this.aggregateScores(hygieneResult, archResult);
}
```

**Acceptance Criteria**:
- [ ] Framework registry integrated
- [ ] All analysis types use consolidated frameworks
- [ ] Scoring logic updated
- [ ] No regression in scores
- [ ] Tests comprehensive

---

##### T-049: Refactor StrategyFrameworkBuilder to Use Registry
**Effort**: 3h | **Priority**: P1

**Target**:
```typescript
// src/tools/strategy/strategy-framework-builder.ts
import { AnalysisFrameworkRegistry } from '../../frameworks/registry.js';

export class StrategyFrameworkBuilder {
  private registry: AnalysisFrameworkRegistry;

  constructor() {
    this.registry = new AnalysisFrameworkRegistry();
    this.registerAllFrameworks();
  }

  async build(request: StrategyRequest): Promise<StrategyResult> {
    return this.registry.analyze({
      type: 'strategy',
      context: request.context,
      options: {
        method: request.method,
        depth: request.depth
      }
    });
  }

  private registerAllFrameworks(): void {
    this.registry.register('strategy', new StrategyFramework());
    this.registry.register('gap-analysis', new GapAnalysisFramework());
    // ... all frameworks
  }
}
```

**Acceptance Criteria**:
- [ ] Registry integration complete
- [ ] Framework registration working
- [ ] All strategy methods supported
- [ ] Tests passing
- [ ] Documentation updated

---

##### T-050: Verify Alignment with Strategy Migration
**Effort**: 2h | **Priority**: P1

**Verification Checklist**:
- [ ] All strategies use BaseStrategy pattern (Phase 2)
- [ ] All frameworks use FrameworkRegistry (Phase 3)
- [ ] ExecutionTrace integrated in both
- [ ] No circular dependencies
- [ ] Clean separation of concerns
- [ ] Integration tests pass

**Acceptance Criteria**:
- [ ] Architecture validation passed
- [ ] Dependency graph verified
- [ ] No conflicts detected
- [ ] Documentation alignment
- [ ] Final review approved

---

#### 4.3.4 Phase 3 Deliverables

| Deliverable | Impact | Description |
|-------------|--------|-------------|
| AnalysisFrameworkRegistry | +1 file, +200 LOC | Central router |
| Consolidated Frameworks | -25 files, -8000 LOC | 30+ → 11 |
| warnDeprecated Helper | +1 file, +100 LOC | Deprecation system |
| Schema Descriptions | ~80% coverage | GAP-002 completion |
| Updated Integration | Modified 5+ tools | Registry usage |
| Tests | +15 files, +1500 LOC | Comprehensive coverage |
| **Net Impact** | **-6,200 LOC** | **Massive reduction** |

#### 4.3.5 Phase 3 Exit Criteria

- [ ] All 12 tasks (T-039 to T-050) completed
- [ ] 30+ frameworks → 11 frameworks
- [ ] AnalysisFrameworkRegistry operational
- [ ] warnDeprecated implemented (GAP-004)
- [ ] Schema descriptions ≥80% (GAP-002)
- [ ] ~8,000 LOC removed
- [ ] ≥90% test coverage
- [ ] No regressions
- [ ] CI pipeline green
- [ ] Documentation complete

---

### PHASE 4: Platform Abstraction (Weeks 5-7)

**Duration**: 2 weeks
**Effort**: 29 hours
**Critical Path**: Non-critical (can run parallel with Phase 5)
**Priority**: P1
**Dependencies**: None (can start after Phase 1)

#### 4.4.1 Objectives

Abstract all platform-specific code (file system, paths, OS) behind a Platform Abstraction Layer (PAL) to enable cross-platform support (Windows, Linux, macOS).

**Problem**:
- Direct `fs` and `path` imports throughout codebase
- Platform-specific path separators (`/` vs `\`)
- Hardcoded Unix assumptions

**Solution**:
- PAL interface
- NodePAL implementation
- MockPAL for testing
- Systematic refactoring

#### 4.4.2 Detailed Tasks

##### T-051: Define PlatformAbstractionLayer Interface
**Effort**: 3h | **Priority**: P1

```typescript
// src/platform/pal-interface.ts
export interface FileInfo {
  path: string;
  name: string;
  size: number;
  isDirectory: boolean;
  isFile: boolean;
  modified: Date;
}

export interface PlatformAbstractionLayer {
  // File operations
  readFile(path: string, encoding?: BufferEncoding): Promise<string | Buffer>;
  writeFile(path: string, content: string | Buffer): Promise<void>;
  appendFile(path: string, content: string): Promise<void>;
  deleteFile(path: string): Promise<void>;

  // Directory operations
  readDirectory(path: string): Promise<string[]>;
  createDirectory(path: string, options?: { recursive: boolean }): Promise<void>;
  deleteDirectory(path: string, options?: { recursive: boolean }): Promise<void>;
  exists(path: string): Promise<boolean>;

  // File info
  getFileInfo(path: string): Promise<FileInfo>;

  // Path operations
  joinPath(...segments: string[]): string;
  resolvePath(...segments: string[]): string;
  normalizePath(path: string): string;
  dirname(path: string): string;
  basename(path: string, ext?: string): string;
  extname(path: string): string;

  // Platform info
  getPlatform(): 'win32' | 'darwin' | 'linux' | 'unknown';
  getPathSeparator(): string;
  getHomeDirectory(): string;
  getTempDirectory(): string;
}
```

**Acceptance Criteria**:
- [ ] Complete interface definition
- [ ] TypeScript strict mode compatible
- [ ] JSDoc comments on all methods
- [ ] Cross-platform considerations documented

---

##### T-052: Implement NodePAL
**Effort**: 5h | **Priority**: P1 | **Dependencies**: T-051

```typescript
// src/platform/node-pal.ts
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import type { PlatformAbstractionLayer, FileInfo } from './pal-interface.js';

export class NodePAL implements PlatformAbstractionLayer {
  async readFile(filePath: string, encoding: BufferEncoding = 'utf8'): Promise<string | Buffer> {
    return fs.readFile(filePath, encoding);
  }

  async writeFile(filePath: string, content: string | Buffer): Promise<void> {
    await fs.writeFile(filePath, content);
  }

  async appendFile(filePath: string, content: string): Promise<void> {
    await fs.appendFile(filePath, content);
  }

  async deleteFile(filePath: string): Promise<void> {
    await fs.unlink(filePath);
  }

  async readDirectory(dirPath: string): Promise<string[]> {
    return fs.readdir(dirPath);
  }

  async createDirectory(dirPath: string, options = { recursive: true }): Promise<void> {
    await fs.mkdir(dirPath, options);
  }

  async deleteDirectory(dirPath: string, options = { recursive: true }): Promise<void> {
    await fs.rm(dirPath, options);
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async getFileInfo(filePath: string): Promise<FileInfo> {
    const stats = await fs.stat(filePath);
    return {
      path: filePath,
      name: path.basename(filePath),
      size: stats.size,
      isDirectory: stats.isDirectory(),
      isFile: stats.isFile(),
      modified: stats.mtime
    };
  }

  joinPath(...segments: string[]): string {
    return path.join(...segments);
  }

  resolvePath(...segments: string[]): string {
    return path.resolve(...segments);
  }

  normalizePath(filePath: string): string {
    return path.normalize(filePath);
  }

  dirname(filePath: string): string {
    return path.dirname(filePath);
  }

  basename(filePath: string, ext?: string): string {
    return path.basename(filePath, ext);
  }

  extname(filePath: string): string {
    return path.extname(filePath);
  }

  getPlatform(): 'win32' | 'darwin' | 'linux' | 'unknown' {
    const platform = os.platform();
    if (platform === 'win32' || platform === 'darwin' || platform === 'linux') {
      return platform;
    }
    return 'unknown';
  }

  getPathSeparator(): string {
    return path.sep;
  }

  getHomeDirectory(): string {
    return os.homedir();
  }

  getTempDirectory(): string {
    return os.tmpdir();
  }
}
```

**Acceptance Criteria**:
- [ ] All interface methods implemented
- [ ] Error handling consistent
- [ ] Performance: No significant overhead
- [ ] Unit tests 100% coverage
- [ ] Integration tests on all platforms

---

##### T-053 to T-056: Refactor Tools to Use PAL

**Pattern** (same for all):
```typescript
// BEFORE
import fs from 'fs/promises';
import path from 'path';

async function analyzeProject(projectPath: string) {
  const files = await fs.readdir(projectPath);
  for (const file of files) {
    const fullPath = path.join(projectPath, file);
    const content = await fs.readFile(fullPath, 'utf8');
    // ...
  }
}

// AFTER
import type { PlatformAbstractionLayer } from '../../platform/pal-interface.js';

async function analyzeProject(
  projectPath: string,
  pal: PlatformAbstractionLayer
) {
  const files = await pal.readDirectory(projectPath);
  for (const file of files) {
    const fullPath = pal.joinPath(projectPath, file);
    const content = await pal.readFile(fullPath, 'utf8');
    // ...
  }
}
```

**Tasks**:
- **T-053**: project-onboarding (4h)
- **T-054**: dependency-auditor (3h)
- **T-055**: clean-code-scorer (4h)
- **T-056**: semantic-analyzer (3h)

Each task:
1. Replace direct `fs` imports with PAL
2. Replace direct `path` imports with PAL methods
3. Inject PAL via dependency injection
4. Update tests to use MockPAL
5. Verify on Windows + Linux

---

##### T-057: Create MockPAL for Testing
**Effort**: 3h | **Priority**: P1 | **Dependencies**: T-051

```typescript
// src/platform/mock-pal.ts
export class MockPAL implements PlatformAbstractionLayer {
  private files: Map<string, string | Buffer> = new Map();
  private directories: Set<string> = new Set();

  // Seed with test data
  seed(files: Record<string, string>): void {
    for (const [path, content] of Object.entries(files)) {
      this.files.set(path, content);

      // Create parent directories
      const parts = path.split('/');
      for (let i = 1; i < parts.length; i++) {
        this.directories.add(parts.slice(0, i).join('/'));
      }
    }
  }

  async readFile(path: string): Promise<string | Buffer> {
    const content = this.files.get(path);
    if (!content) {
      throw new Error(`ENOENT: ${path}`);
    }
    return content;
  }

  async writeFile(path: string, content: string | Buffer): Promise<void> {
    this.files.set(path, content);
  }

  // ... implement all methods with in-memory storage

  // Test helpers
  getWrittenFiles(): string[] {
    return Array.from(this.files.keys());
  }

  clear(): void {
    this.files.clear();
    this.directories.clear();
  }
}
```

**Acceptance Criteria**:
- [ ] All interface methods implemented
- [ ] In-memory file system
- [ ] Test helper methods
- [ ] Realistic error simulation
- [ ] Documentation with examples

---

##### T-058 to T-064: Platform Verification and Cleanup

**T-058**: Verify Cross-Platform Constraints (2h)
- Test on Windows with backslash paths
- Test on Linux with forward slash paths
- Test on macOS
- Document platform-specific quirks

**T-059**: Implement GlobalConfig for PAL Injection (2h)
```typescript
// src/platform/global-config.ts
let globalPAL: PlatformAbstractionLayer | null = null;

export function setPAL(pal: PlatformAbstractionLayer): void {
  globalPAL = pal;
}

export function getPAL(): PlatformAbstractionLayer {
  if (!globalPAL) {
    globalPAL = new NodePAL(); // Default
  }
  return globalPAL;
}
```

**T-060**: Integration Test for PAL Substitution (2h)
- Verify MockPAL can replace NodePAL
- Test all tools with MockPAL
- Verify no direct fs/path imports

**T-061**: Audit All Direct `fs` Imports (1h)
```bash
grep -r "from 'fs'" src/
grep -r "from 'fs/promises'" src/
grep -r "require('fs')" src/
```

**T-062**: Audit All Direct `path` Imports (1h)
```bash
grep -r "from 'path'" src/
grep -r "require('path')" src/
```

**T-063**: Remove `os` Specificity from Paths (1h)
- Replace hardcoded `/` with `pal.getPathSeparator()`
- Replace `~` with `pal.getHomeDirectory()`
- Replace `/tmp` with `pal.getTempDirectory()`

**T-064**: Final Cross-Platform Regression Test (1h)
- Run full test suite on Windows
- Run full test suite on Linux
- Run full test suite on macOS
- Document any remaining platform-specific issues

**Acceptance Criteria**:
- [ ] No direct fs/path/os imports in tools
- [ ] CI matrix testing (3 platforms)
- [ ] All tests passing on all platforms
- [ ] Documentation complete

---

#### 4.4.3 Phase 4 Deliverables

| Deliverable | Files | Description |
|-------------|-------|-------------|
| PAL Interface | 1 | Complete abstraction |
| NodePAL | 1 | Production implementation |
| MockPAL | 1 | Testing implementation |
| Refactored Tools | 4+ | PAL integrated |
| GlobalConfig | 1 | PAL injection |
| Tests | 10+ | Cross-platform verified |
| CI Matrix | Updated | 3 platforms |

#### 4.4.4 Phase 4 Exit Criteria

- [ ] All 14 tasks (T-051 to T-064) completed
- [ ] PAL interface complete
- [ ] NodePAL and MockPAL implemented
- [ ] All tools use PAL (no direct fs/path/os)
- [ ] CI matrix testing (Windows, Linux, macOS)
- [ ] ≥90% test coverage
- [ ] All tests passing on all platforms
- [ ] Documentation complete

---

### PHASE 5: CI/CD & Documentation (Weeks 6-8)

**Duration**: 1.5 weeks
**Effort**: 24 hours
**Critical Path**: Non-critical
**Priority**: P2
**Dependencies**: Phases 1-4 complete

#### 4.5.1 Objectives

Optimize CI pipeline, formalize release process, and complete comprehensive documentation.

#### 4.5.2 Detailed Tasks

##### T-065: Optimize CI Pipeline Caching
**Effort**: 3h | **Priority**: P2

**Current Issues**:
- No dependency caching
- Redundant npm installs
- Slow test execution

**Target Configuration**:
```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        node: [18, 20]

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Cache Vitest
        uses: actions/cache@v3
        with:
          path: .vitest-cache
          key: vitest-${{ runner.os }}-${{ hashFiles('**/package-lock.json') }}

      - name: Run tests
        run: npm test

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        if: matrix.os == 'ubuntu-latest' && matrix.node == '20'
```

**Optimizations**:
- npm cache: ~2min savings
- Vitest cache: ~1min savings
- Parallel jobs: ~5min savings
- **Total**: CI time 15min → 7min (53% reduction)

**Acceptance Criteria**:
- [ ] Dependency caching implemented
- [ ] Test cache working
- [ ] Matrix strategy optimal
- [ ] CI time <10 minutes
- [ ] Coverage upload working

---

##### T-066: Formalize release.yml Workflow
**Effort**: 3h | **Priority**: P2

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

      - name: Generate changelog
        run: npm run changelog:generate

      - name: Create GitHub Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ github.ref }}
          body_path: CHANGELOG.md
          draft: false
          prerelease: false

      - name: Publish to npm
        run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

**Acceptance Criteria**:
- [ ] Tag-triggered releases
- [ ] Automated testing
- [ ] Changelog generation
- [ ] GitHub release creation
- [ ] npm publish (if applicable)

---

##### T-067 to T-074: Documentation Tasks

**T-067**: Auto-generate Tool Documentation (4h)
```typescript
// scripts/generate-docs.ts
import { getAllTools } from '../src/index.js';

export async function generateToolDocs(): Promise<void> {
  const tools = getAllTools();

  let markdown = '# MCP Tools Reference\n\n';

  for (const tool of tools) {
    markdown += `## ${tool.name}\n\n`;
    markdown += `${tool.description}\n\n`;
    markdown += `### Input Schema\n\`\`\`json\n${JSON.stringify(tool.inputSchema, null, 2)}\n\`\`\`\n\n`;
    markdown += `### Annotations\n`;
    markdown += `- Read-only: ${tool.annotations.readOnlyHint}\n`;
    markdown += `- Idempotent: ${tool.annotations.idempotentHint}\n`;
    markdown += `- Open-world: ${tool.annotations.openWorldHint}\n`;
    markdown += `- Destructive: ${tool.annotations.destructiveHint}\n\n`;
  }

  await fs.writeFile('docs/tools/README.md', markdown);
}
```

**T-068**: Update clean-code-scorer Metrics Docs (2h)
- Document all threshold arrays
- Explain scoring algorithm
- Provide examples

**T-069**: Write Migration Guide for v0.14.x (4h)
```markdown
# Migration Guide: v0.13.x → v0.14.x

## Breaking Changes

### 1. Unified Prompt Builder
**Old**:
```typescript
import { hierarchicalPromptBuilder } from 'mcp-ai-agent-guidelines';
const result = await hierarchicalPromptBuilder.build({...});
```

**New**:
```typescript
import { UnifiedPromptBuilder } from 'mcp-ai-agent-guidelines';
const hub = new UnifiedPromptBuilder();
const result = await hub.build({ domain: 'hierarchical', ... });
```

### 2. Framework Consolidation
...

## Deprecation Timeline
...
```

**T-070**: Update ADR-002 (Annotations) (2h)
**T-071**: Update ADR-003 (Prompts) (2h)
**T-072**: Create CONTRIBUTING.md Update (2h)
**T-073**: Document UnifiedPromptBuilder Slot Usage (already in T-037)
**T-074**: Audit README.md for Accuracy (1h)

**T-075**: Verify Changelog Automation (1h)
**T-076**: Final Documentation Polish (2h)

---

#### 4.5.3 Phase 5 Deliverables

| Deliverable | Description |
|-------------|-------------|
| Optimized CI | 53% faster pipeline |
| Release Workflow | Automated releases |
| Tool Documentation | Auto-generated reference |
| Migration Guide | Comprehensive guide |
| Updated ADRs | ADR-002, ADR-003 |
| Contributing Guide | Updated patterns |
| README | Accurate and complete |

#### 4.5.4 Phase 5 Exit Criteria

- [ ] All 12 tasks (T-065 to T-076) completed
- [ ] CI pipeline <10 minutes
- [ ] Release workflow tested
- [ ] All documentation complete
- [ ] Migration guide reviewed
- [ ] ADRs updated
- [ ] No broken links
- [ ] Spell check passed

---

### PHASE 6: Testing & Validation (Weeks 7-9)

**Duration**: 2 weeks
**Effort**: 50 hours
**Critical Path**: ✓
**Priority**: P0
**Dependencies**: All phases complete

#### 4.6.1 Objectives

Achieve comprehensive test coverage, validate all integrations, and prepare for v0.14.x release.

#### 4.6.2 Detailed Tasks

##### T-077 to T-078: Coverage Targets

**T-077**: Achieve 90% Coverage on `domain/` (8h)
- Write missing unit tests
- Cover all edge cases
- Validate pure functions
- Boundary condition testing

**T-078**: Achieve 90% Coverage on `tools/` (8h)
- MCP tool integration tests
- Input validation tests
- Error handling tests
- Annotation verification

**Coverage Report**:
```bash
npm run test:coverage

# Target:
domain/: 90%+ (currently ~75%)
tools/: 90%+ (currently ~70%)
strategies/: 90%+ (currently ~80%)
frameworks/: 90%+ (currently ~65%)
platform/: 100% (new code)
```

---

##### T-079: Run Full Regression Suite
**Effort**: 6h | **Priority**: P0

**Test Suites**:
1. Unit tests (all phases)
2. Integration tests (cross-module)
3. End-to-end tests (real MCP scenarios)
4. Performance tests (latency benchmarks)
5. Cross-platform tests (3 OS)

**Regression Checks**:
- No functionality lost
- All tools produce same outputs
- Performance not degraded
- No new bugs introduced

**Acceptance Criteria**:
- [ ] All 500+ tests passing
- [ ] No flaky tests
- [ ] Performance benchmarks met
- [ ] Cross-platform verified

---

##### T-080 to T-089: Validation Tasks

**T-080**: Validate ExecutionTrace in Production-like Scenarios (4h)
- Simulate complex decision trees
- Verify trace export formats
- Test trace aggregation
- Validate performance impact

**T-081**: Validate UnifiedPromptBuilder with Complex Chains (5h)
- Test all 8 domains
- Test nested templates
- Test slot injection edge cases
- Validate legacy facade compatibility

**T-082**: 100% Type Check Pass (3h)
```bash
npm run typecheck -- --noEmit
# Target: 0 errors, 0 warnings
```

**T-083**: Final Security Audit (4h)
- Dependency vulnerability scan
- Code security review
- Secrets detection
- SAST analysis

**T-084**: Validate AgentHandoffCoordinator Scenarios (3h)
- Test all anchor points
- Verify handoff execution
- Test condition evaluation
- Validate trace integration

**T-085**: Verify ToolAnnotations at Runtime (2h)
```typescript
// tests/vitest/annotations/runtime-verification.spec.ts
describe('ToolAnnotations Runtime Verification', () => {
  it('should have annotations on all tools', () => {
    const tools = getAllTools();
    for (const tool of tools) {
      expect(tool.annotations).toBeDefined();
      expect(tool.annotations.readOnlyHint).toBeDefined();
      expect(tool.annotations.idempotentHint).toBeDefined();
      expect(tool.annotations.openWorldHint).toBeDefined();
      expect(tool.annotations.destructiveHint).toBeDefined();
    }
  });
});
```

**T-086**: Performance Test - Unified Prompt Generation (3h)
- Benchmark prompt generation latency
- Test with varying input sizes
- Compare to legacy implementations
- Target: <100ms p95

**T-087**: Stress Test - Large Design Sessions (3h)
- Simulate 100+ tool invocations
- Test trace accumulation
- Verify memory usage
- Target: <500MB memory

**T-088**: Verify No `any` Types (2h)
```bash
# No 'any' types allowed in production code
grep -r ": any" src/ --exclude="*.spec.ts"
# Expected: 0 matches
```

**T-089**: Final QA Sign-off (4h)
- Manual testing of critical paths
- UI/UX validation (if applicable)
- Documentation review
- Stakeholder approval

**T-090**: Release v0.14.x Candidate (1h)
- Tag release candidate
- Trigger release workflow
- Verify artifacts
- Announce RC for testing

---

#### 4.6.3 Phase 6 Deliverables

| Deliverable | Target |
|-------------|--------|
| Test Coverage | ≥90% across all modules |
| Regression Tests | All passing |
| Performance Benchmarks | All met |
| Security Audit | Clean report |
| Type Safety | 100% strict mode |
| Release Candidate | v0.14.0-rc.1 |

#### 4.6.4 Phase 6 Exit Criteria

- [ ] All 14 tasks (T-077 to T-090) completed
- [ ] ≥90% test coverage
- [ ] All regression tests passing
- [ ] No known critical bugs
- [ ] Performance benchmarks met
- [ ] Security audit clean
- [ ] 100% TypeScript strict mode
- [ ] No `any` types in production
- [ ] QA approval obtained
- [ ] Release candidate tagged
- [ ] **Ready for v0.14.0 release**

---

## 5. Gap Remediation Workstreams

All gap remediation work has been integrated into the main phases. Here's the mapping:

### 5.1 GAP-001: Tool Annotations Standard

**Status**: Integrated into Phase 2.5 (T-032, T-036)
**Effort**: 5h
**Priority**: P0

**Tasks**:
- T-032: Apply GENERATOR_TOOL_ANNOTATIONS to prompt tools
- T-036: Apply annotations to all 30+ tools

**Deliverables**:
- `src/tools/shared/tool-annotations.ts`
- Presets: ANALYSIS, DESIGN, PROJECT, GENERATOR
- 100% annotation coverage
- ADR-002 updated

**Validation**:
```typescript
// Enforcement check
const result = await validateAnnotations(allTools);
expect(result.coveragePercent).toBe(100);
```

---

### 5.2 GAP-002: Schema Examples for Zod

**Status**: Integrated into Phase 3 (T-045, T-046)
**Effort**: 8h
**Priority**: P0

**Tasks**:
- T-045: Update all Zod schemas with .describe()
- T-046: Create schema description coverage tests

**Pattern**:
```typescript
z.string().describe('Description text. Example: example-value')
```

**Target**: 80%+ coverage

**Validation**:
```typescript
const coverage = await validateSchemaExamples(allSchemas);
expect(coverage.exampleCoverage).toBeGreaterThanOrEqual(80);
```

---

### 5.3 GAP-003: Unified Prompt Tool Design

**Status**: Integrated into Phase 2.5 (T-021 to T-038)
**Effort**: 55h (entire Phase 2.5)
**Priority**: P1

**Deliverables**:
- UnifiedPromptBuilder hub
- Template engine
- 8 domain modules
- 9 legacy facades
- Deleted 12+ old implementations
- ADR-003 documented

---

### 5.4 GAP-004: Deprecation Warning Helpers

**Status**: Integrated into Phase 3 (T-043, T-044)
**Effort**: 5h
**Priority**: P0

**Deliverable**: `src/tools/shared/deprecation.ts`

**Features**:
- Warn-once-per-session
- Deprecation registry
- Migration URL support
- Integration with facades

**Usage**:
```typescript
warnDeprecated({
  oldName: 'old-tool',
  newName: 'new-tool',
  removalVersion: '0.15.0',
  migrationUrl: 'https://docs.example.com/migration'
});
```

---

### 5.5 GAP-005: Description CSV Export

**Status**: Integrated into Phase 5 (T-067)
**Effort**: 3h (part of T-067)
**Priority**: P1

**Deliverable**: `scripts/export-descriptions.ts`

**Output**: `artifacts/tool-descriptions.csv`

**Columns**:
- tool_name
- description
- category
- annotations (JSON)
- last_updated

**CI Integration**:
```yaml
- name: Validate CSV up-to-date
  run: |
    npm run export:descriptions
    git diff --exit-code artifacts/tool-descriptions.csv
```

---

### 5.6 GAP-006: MCP Apps Research

**Status**: Deferred to v0.15.x
**Effort**: 4h (research only)
**Priority**: P2

**Deliverable**: `docs/research/mcp-apps-2026.md`

**Research Topics**:
- MCP-UI specification review
- Interactive UI rendering patterns
- Integration with OutputStrategies
- Market analysis (2026 ecosystem)

**Not Implemented in v0.14.x**:
- Full MCP Apps UI
- Interactive components
- Client-side rendering

---

### 5.7 GAP-007: RAG Integration Evaluation

**Status**: Deferred to v0.15.x
**Effort**: 4h (research only)
**Priority**: P2

**Deliverable**: `docs/research/rag-integration-evaluation.md`

**Research Topics**:
- RAG pipeline architectures
- Vector database options (Pinecone, Weaviate, Chroma)
- Security considerations
- Integration with memory-context-optimizer

**Not Implemented in v0.14.x**:
- RAG pipeline
- Vector database integration
- Embedding generation

---

### 5.8 GAP-008: Progress Standardization & Enforcement

**Status**: Integrated into Enforcement Layer (see Section 6)
**Effort**: 17h (T-017 to T-020 in enforcement spec)
**Priority**: P0

**Deliverables**:
- `validate_progress` MCP tool
- `progress-standardization.spec.md`
- `progress-template.hbs`
- Context7 helper integration
- fetch_webpage comparator
- L9-generated ADR

---

## 6. Enforcement & Validation Layer

The enforcement layer is a NEW initiative integrated into v0.14.x as part of quality assurance.

### 6.1 Overview

**Purpose**: Automated validation of SpecKit compliance, tool quality, and project standards.

**Entry Point**: MCP tools (NOT shell scripts)

**Key Insight**: AI agents invoke enforcement tools via MCP and receive structured ValidationResult responses with actionable suggestions.

### 6.2 Enforcement Tools

#### 6.2.1 validate_uniqueness

**Purpose**: Check tool descriptions for duplicates and format quality

**Implementation**: See `enforcement-scripts/spec.md`

**Output**:
```typescript
interface UniquenessValidation {
  valid: boolean;
  toolCount: number;
  duplicates: { description: string; tools: string[] }[];
  similar: { firstFiveWords: string; tools: string[] }[];
  qualityIssues: { tool: string; issue: string }[];
  suggestions: string[];
}
```

**Success Metric**: Zero duplicates

---

#### 6.2.2 validate_annotations

**Purpose**: Check ToolAnnotations coverage

**Validation**:
- All tools have ToolAnnotations
- All 4 hints present (readOnlyHint, idempotentHint, openWorldHint, destructiveHint)
- Correct category applied

**Output**:
```typescript
interface AnnotationCoverage {
  valid: boolean;
  complete: string[];  // 100% coverage
  incomplete: { name: string; missing: string[] }[];
  missing: string[];   // No annotations
  coveragePercent: number;
  suggestions: string[];
}
```

**Success Metric**: 100% coverage

---

#### 6.2.3 validate_schema_examples

**Purpose**: Check Zod schemas have .describe() with examples

**Validation**:
- Count schemas with .describe()
- Verify "Example:" in description
- Calculate coverage percentage

**Output**:
```typescript
interface SchemaCoverage {
  valid: boolean;
  totalSchemas: number;
  withDescribe: number;
  withExamples: number;
  describeCoverage: number;
  exampleCoverage: number;
  suggestions: string[];
}
```

**Success Metric**: 80%+ example coverage

---

#### 6.2.4 enforce_planning

**Purpose**: Validate SpecKit planning compliance

**Validation**:
- Required documents exist (spec.md, plan.md, tasks.md)
- Required sections present
- Cross-references valid
- Task numbering consistent

**Output**:
```typescript
interface PlanningValidation {
  valid: boolean;
  documents: {
    name: string;
    exists: boolean;
    sections: { name: string; found: boolean }[];
    crossReferences: { target: string; found: boolean }[];
  }[];
  missingRequired: string[];
  suggestions: string[];
}
```

**Success Metric**: 100% spec-kit compliance

---

#### 6.2.5 validate_progress (GAP-008)

**Purpose**: Validate and normalize progress.md files

**Special Features**:
- Dry-run: Returns ValidationResult + patch
- `--apply`: Writes normalized file (or creates PR)
- Context7 integration: Embeds library doc snippets
- fetch_webpage: Compares remote progress files

**Implementation**: See `progress-enforcer_spec.md`

**Workflow**:
```
1. Parse progress.md (AST + fallback regex)
2. Validate task IDs, metrics, summary
3. Generate canonical via progress-template.hbs
4. Context7: Fetch library snippets (cached)
5. fetch_webpage: Compare to remote examples
6. Return ValidationResult with patch
7. If --apply: Write file + optionally create PR
```

**Success Metric**: All progress.md files canonical

---

### 6.3 Domain Layer (Pure Functions)

All enforcement logic is implemented as pure functions in `src/domain/enforcement/`:

```typescript
// src/domain/enforcement/validation.ts
export function validateUniqueness(records: ToolRecord[]): UniquenessValidation;
export function validateAnnotations(tools: ToolDefinition[]): AnnotationCoverage;
export function validateSchemaExamples(files: string[]): SchemaCoverage;
export function validatePlanning(dir: string): PlanningValidation;
export function validateProgress(dir: string, options?: ProgressOptions): ProgressValidation;
```

**Principles**:
- No side effects
- Fully testable
- 100% coverage target
- Type-safe

---

### 6.4 Enforcement Timeline

**Integrated into Phase 3**:
- Week 4-6: Implement enforcement tools
- Parallel with framework consolidation
- Use enforcement tools to validate consolidation

**Tasks**:
- T-001 to T-020 from `enforcement-scripts/tasks.md`
- Additional T-017 to T-020 for GAP-008 (progress enforcement)

**Total Effort**: 41h (enforcement) + 17h (progress) = 58h

---

### 6.5 Acceptance Criteria (Enforcement Layer)

- [ ] All 5 enforcement tools implemented
- [ ] Domain layer 100% test coverage
- [ ] MCP tool registration complete
- [ ] ToolAnnotations applied (idempotentHint=true, readOnlyHint=true)
- [ ] ValidationResult format standardized
- [ ] Shell fallback scripts (optional)
- [ ] Integration with CI (pre-commit hooks)
- [ ] Documentation complete

---

## 7. Dependencies & Constraints

### 7.1 Critical Path Dependencies

```
Phase 1 (Core Infrastructure)
  ↓
Phase 2 (Strategy Migration) ← depends on Phase 1
  ↓
Phase 2.5 (Unified Prompts) ← depends on Phase 2
  ↓
Phase 3 (Framework Consolidation) ← depends on Phase 2.5
  ↓
Phase 6 (Testing & Validation) ← depends on all phases
  ↓
v0.14.0 Release

Phase 4 (Platform Abstraction) ← can run parallel (non-critical)
Phase 5 (CI/CD & Docs) ← can run parallel (non-critical)
```

### 7.2 External Dependencies

| Dependency | Version | Notes |
|------------|---------|-------|
| Node.js | ≥18.0.0 | LTS required |
| TypeScript | ≥5.0.0 | Strict mode |
| Vitest | ≥1.0.0 | Testing framework |
| Zod | ≥3.22.0 | Schema validation |
| MCP SDK | ≥1.0.0 | Tool registration |

### 7.3 Constraints

#### 7.3.1 Technical Constraints

- **Backward Compatibility**: Phase 2.5 is BREAKING, but maintained via facades
- **TypeScript Strict Mode**: All code must pass strict type checking
- **ESM Only**: No CommonJS support
- **Test Coverage**: Minimum 90% on all modules
- **Performance**: No significant regression

#### 7.3.2 Resource Constraints

- **Total Effort**: 260 hours
- **Timeline**: 9 weeks
- **Team Size**: Assume 1-2 developers
- **Budget**: No external dependencies requiring payment

#### 7.3.3 Platform Constraints

- **Supported Platforms**: Windows, Linux, macOS
- **Node Versions**: 18, 20 (LTS)
- **CI/CD**: GitHub Actions only
- **Package Registry**: npm

---

## 8. Risk Management

### 8.1 High-Priority Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **RISK-001**: Phase 2.5 breaking changes cause adoption issues | High | High | Comprehensive facades + deprecation warnings + migration guide |
| **RISK-002**: Scope creep into general code quality analysis | Medium | High | Strict adherence to SpecKit/MCP compliance only |
| **RISK-003**: Test coverage drops during refactoring | Medium | High | Continuous coverage monitoring + pre-commit hooks |
| **RISK-004**: Performance degradation from abstraction layers | Low | Medium | Performance benchmarks + optimization pass |
| **RISK-005**: Cross-platform issues in PAL | Medium | Medium | Early testing on all platforms + CI matrix |

### 8.2 Mitigation Strategies

#### RISK-001 Mitigation

**Strategy**: Strangler Fig Pattern
- Keep old implementations as facades
- Gradual deprecation over 2 releases
- Clear migration path
- Automated migration tools

**Timeline**:
- v0.14.0: Facades + deprecation warnings
- v0.14.5: Announce removal timeline
- v0.15.0: Remove old implementations

---

#### RISK-002 Mitigation

**Strategy**: Clear Scope Definition
- Enforcement tools ONLY validate:
  - MCP tool compliance
  - SpecKit methodology
  - Project structure
- Do NOT analyze:
  - General code quality
  - Security vulnerabilities
  - Performance optimization

**Validation**: Review tasks against scope

---

#### RISK-003 Mitigation

**Strategy**: Coverage Gates
```yaml
# .github/workflows/ci.yml
- name: Coverage Gate
  run: |
    npm run test:coverage
    # Fail if coverage < 90%
    npx nyc check-coverage --lines 90 --functions 90 --branches 90
```

**Pre-commit Hook**:
```bash
#!/bin/sh
npm run test:coverage
# Block commit if coverage dropped
```

---

#### RISK-004 Mitigation

**Strategy**: Performance Benchmarks
```typescript
// tests/performance/benchmarks.spec.ts
describe('Performance Benchmarks', () => {
  it('should generate prompts in <100ms', async () => {
    const start = performance.now();
    await unifiedPromptBuilder.build({...});
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(100);
  });
});
```

**Baselines**: Establish v0.13.x baselines

---

#### RISK-005 Mitigation

**Strategy**: Early Cross-Platform Testing
- Set up CI matrix in Week 1
- Test PAL on all platforms immediately
- Document platform-specific quirks
- Provide platform-specific workarounds

---

### 8.3 Contingency Plans

#### If Phase 2.5 Takes Longer Than Expected

**Plan B**:
1. Reduce domain count from 8 to 5 (core domains only)
2. Defer flow/chain builders to v0.15.x
3. Keep hierarchical and domain-neutral as priority

**Impact**: Reduced scope but core functionality preserved

---

#### If Test Coverage Target Not Met

**Plan B**:
1. Focus on critical path coverage (Phases 1-3)
2. Accept 85% coverage for Phase 4 (PAL)
3. Commit to 90%+ in v0.14.1 patch

**Impact**: Delayed full coverage but release not blocked

---

## 9. Success Metrics

### 9.1 Quantitative Metrics

| Metric | Baseline (v0.13.x) | Target (v0.14.x) | Measurement |
|--------|-------------------|------------------|-------------|
| Lines of Code | ~25,000 | ~18,000 (-28%) | cloc |
| Tool Count | 30+ | 30+ (same) | Tool registration |
| Prompt Builders | 12 | 1 (unified) | File count |
| Analysis Frameworks | 30+ | 11 | File count |
| Test Coverage | ~70% | ≥90% | Vitest coverage |
| CI Pipeline Time | ~15min | <10min | GitHub Actions |
| Tool Annotation Coverage | 0% | 100% | Enforcement tool |
| Schema Description Coverage | 0% | 80%+ | Enforcement tool |
| TypeScript Errors | ~50 | 0 | tsc --noEmit |
| Duplicate Descriptions | Unknown | 0 | CSV validation |

### 9.2 Qualitative Metrics

| Metric | Assessment Method |
|--------|-------------------|
| Developer Experience | Survey + onboarding time |
| Documentation Quality | Review + feedback |
| Migration Ease | Migration guide usage |
| Code Maintainability | Cyclomatic complexity |
| Architecture Clarity | Dependency graph analysis |

### 9.3 Release Criteria

**v0.14.0 can be released when**:
- [ ] All 90 tasks completed
- [ ] Test coverage ≥90%
- [ ] All CI checks passing (3 platforms)
- [ ] Zero critical bugs
- [ ] Migration guide complete
- [ ] All ADRs updated
- [ ] Release notes drafted
- [ ] Stakeholder approval obtained
- [ ] Performance benchmarks met
- [ ] Security audit clean

---

## 10. Appendices

### 10.1 Glossary

| Term | Definition |
|------|------------|
| **ADR** | Architecture Decision Record |
| **BaseStrategy** | Abstract base class for all strategy implementations |
| **ExecutionTrace** | Decision logging system for transparency |
| **GAP** | Identified gap between v0.13.x and v0.14.x plans |
| **MCP** | Model Context Protocol (Anthropic's protocol for LLM tools) |
| **PAL** | Platform Abstraction Layer (cross-platform file/path operations) |
| **SpecKit** | Specification methodology for project documentation |
| **UnifiedPromptBuilder** | Central hub replacing 12+ fragmented prompt builders |

### 10.2 File Naming Conventions

| Pattern | Usage | Example |
|---------|-------|---------|
| `kebab-case.ts` | Source files | `unified-prompt-builder.ts` |
| `PascalCase` | Classes/interfaces | `BaseStrategy`, `PromptRequest` |
| `camelCase` | Functions/variables | `validateUniqueness`, `toolCount` |
| `UPPER_SNAKE_CASE` | Constants | `COMPLEXITY_THRESHOLDS` |
| `.spec.ts` | Test files | `validation.spec.ts` |

### 10.3 Commit Message Format

Following Conventional Commits:

```
<type> [<task-id>]: <description>

[optional body]

[optional footer]
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code restructuring
- `test`: Test additions/changes
- `docs`: Documentation
- `chore`: Maintenance tasks
- `perf`: Performance improvements

**Examples**:
```
feat [T021]: implement UnifiedPromptBuilder core hub

refactor [T034]: delete legacy prompt implementations

docs [T069]: add v0.14.x migration guide

test [T077]: achieve 90% coverage on domain layer
```

### 10.4 Branch Strategy

```
main
  ↓
develop (v0.14.x)
  ↓
feature/phase-1-infrastructure (T001-T010)
feature/phase-2-strategy-migration (T011-T020)
feature/phase-2.5-unified-prompts (T021-T038)
feature/phase-3-framework-consolidation (T039-T050)
feature/phase-4-platform-abstraction (T051-T064)
feature/phase-5-cicd-docs (T065-T076)
feature/phase-6-testing-validation (T077-T090)
```

**Merge Strategy**:
- Feature branches → develop (PR + review)
- develop → main (release)

### 10.5 Code Review Checklist

**For All PRs**:
- [ ] Tests added/updated
- [ ] Coverage ≥90%
- [ ] TypeScript strict mode passes
- [ ] No `any` types
- [ ] Documentation updated
- [ ] Commit messages follow convention
- [ ] No lint errors
- [ ] Performance impact assessed

**For Breaking Changes**:
- [ ] Facade/migration path provided
- [ ] Deprecation warning added
- [ ] Migration guide updated
- [ ] ADR documented
- [ ] Stakeholders notified

### 10.6 Testing Strategy

**Test Pyramid**:
```
        /\
       /E2E\      (10%) - End-to-end MCP scenarios
      /______\
     /        \
    /Integration\ (30%) - Cross-module integration
   /____________\
  /              \
 /  Unit Tests    \ (60%) - Pure functions, classes
/__________________\
```

**Coverage Targets**:
- Unit: 95%+
- Integration: 85%+
- E2E: 70%+
- Overall: 90%+

**Test Types**:
1. **Unit**: Pure functions, classes
2. **Integration**: Module interactions
3. **E2E**: MCP tool invocations
4. **Performance**: Latency benchmarks
5. **Cross-platform**: OS compatibility

### 10.7 Release Checklist

**Pre-release**:
- [ ] All tasks completed
- [ ] All tests passing
- [ ] Coverage targets met
- [ ] Documentation complete
- [ ] Migration guide reviewed
- [ ] Security audit clean
- [ ] Performance benchmarks met
- [ ] Breaking changes documented
- [ ] Changelog generated
- [ ] Release notes drafted

**Release**:
- [ ] Tag version (e.g., v0.14.0)
- [ ] Trigger release workflow
- [ ] Publish to npm (if applicable)
- [ ] Create GitHub release
- [ ] Update documentation site
- [ ] Announce on channels

**Post-release**:
- [ ] Monitor for issues
- [ ] Respond to feedback
- [ ] Plan v0.14.1 (hotfixes)
- [ ] Update roadmap for v0.15.x

---

## Summary

This comprehensive refactoring plan consolidates the MCP AI Agent Guidelines v0.14.x strategic consolidation into a structured, actionable roadmap spanning 9 weeks and 260 hours of effort across 6 main phases and 90 detailed tasks.

**Key Outcomes**:
- 28% code reduction (~7,000 LOC removed)
- 12 prompt builders → 1 unified hub
- 30+ frameworks → 11 consolidated
- 100% tool annotation coverage
- 80%+ schema description coverage
- Cross-platform support (Windows, Linux, macOS)
- ≥90% test coverage
- 5 new enforcement tools

**Critical Success Factors**:
1. Strict adherence to BaseStrategy pattern
2. Breaking change management via facades
3. Continuous integration and testing
4. Comprehensive documentation
5. Stakeholder communication

**Next Steps**:
1. Review and approve this plan
2. Set up project tracking (GitHub Projects)
3. Assign tasks to team members
4. Begin Phase 1 (Week 1)
5. Weekly status reviews

---

*End of Refactoring Plan*
