# T-011: Migrate SpecKit Strategy to BaseStrategy

**Task ID**: T-011
**Phase**: 2 - Migration
**Priority**: P0 (Critical Path)
**Estimate**: 6 hours
**Owner**: @mcp-tool-builder
**Reviewer**: @code-reviewer
**Dependencies**: T-001 (BaseStrategy), T-003 (ExecutionTrace)
**Blocks**: T-012 (TOGAF), T-013 (ADR), T-014 (RFC)

---

## 1. Overview

### What

Migrate the existing 2181-line `speckit-strategy.ts` to extend `BaseStrategy<T>`, extracting pure business logic into the domain layer while keeping MCP-specific orchestration in the strategy.

### Why

Current SpecKit implementation:
- 2181 lines in a single file
- Mixed concerns (business logic + MCP orchestration)
- No execution tracing
- Difficult to test in isolation
- No reusable patterns for other strategies

### Target State

```
src/strategies/speckit/
├── speckit-strategy.ts    (~400 lines - orchestration only)
├── index.ts               (barrel export)
└── ...existing files...

src/domain/speckit/
├── types.ts               (SessionState, OutputArtifacts, etc.)
├── generators/
│   ├── spec-generator.ts  (generateSpec pure function)
│   ├── plan-generator.ts  (generatePlan pure function)
│   ├── tasks-generator.ts (generateTasks pure function)
│   └── index.ts
├── validators/
│   ├── constitution-validator.ts
│   └── index.ts
└── index.ts               (barrel)
```

---

## 2. Current State Analysis

### Current File Structure

```typescript
// src/strategies/speckit-strategy.ts (2181 lines)

export interface SessionState {
  title: string;
  overview: string;
  objectives: Objective[];
  requirements: Requirement[];
  // ... many more fields
}

export interface OutputArtifacts {
  readme?: string;
  spec?: string;
  plan?: string;
  tasks?: string;
  progress?: string;
  adr?: string;
  roadmap?: string;
}

export class SpecKitStrategy implements OutputStrategy {
  // 1700+ lines of mixed concerns:
  // - Input validation
  // - Session state management
  // - Document generation (spec, plan, tasks, etc.)
  // - Constitution validation
  // - Error handling
}
```

### Issues to Address

| Issue             | Lines | Solution                                   |
| ----------------- | ----- | ------------------------------------------ |
| Giant class       | 2181  | Split into BaseStrategy + domain functions |
| No tracing        | -     | Add ExecutionTrace via BaseStrategy        |
| Mixed concerns    | ~1200 | Extract generators to domain layer         |
| Inline validation | ~300  | Extract to validators/                     |
| No typing         | -     | Add proper generics                        |

---

## 3. Implementation Guide

### Step 3.1: Extract Types to Domain Layer

```typescript
// src/domain/speckit/types.ts

import { z } from 'zod';

// ============================================
// Input Types (from MCP tool)
// ============================================

export const ObjectiveSchema = z.object({
  description: z.string().min(1),
  priority: z.enum(['high', 'medium', 'low']).optional().default('medium'),
});

export const RequirementSchema = z.object({
  description: z.string().min(1),
  type: z.enum(['functional', 'non-functional']).optional().default('functional'),
  priority: z.enum(['high', 'medium', 'low']).optional().default('medium'),
});

export const SpecKitInputSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  overview: z.string().min(1, 'Overview is required'),
  objectives: z.array(ObjectiveSchema).min(1, 'At least one objective required'),
  requirements: z.array(RequirementSchema).min(1, 'At least one requirement required'),
  acceptanceCriteria: z.array(z.string()).optional().default([]),
  outOfScope: z.array(z.string()).optional().default([]),
  constitutionPath: z.string().optional(),
  validateAgainstConstitution: z.boolean().optional().default(false),
});

export type SpecKitInput = z.infer<typeof SpecKitInputSchema>;
export type Objective = z.infer<typeof ObjectiveSchema>;
export type Requirement = z.infer<typeof RequirementSchema>;

// ============================================
// Session State (internal processing)
// ============================================

export interface SessionState {
  /** Parsed and validated input */
  input: SpecKitInput;

  /** Constitution constraints (if loaded) */
  constitution: ConstitutionConstraints | null;

  /** Generated document sections */
  sections: {
    readme: MarkdownSection | null;
    spec: MarkdownSection | null;
    plan: MarkdownSection | null;
    tasks: MarkdownSection | null;
    progress: MarkdownSection | null;
    adr: MarkdownSection | null;
    roadmap: MarkdownSection | null;
  };

  /** Processing metadata */
  metadata: {
    startedAt: Date;
    totalTokensEstimate: number;
    warnings: string[];
  };
}

export interface MarkdownSection {
  title: string;
  content: string;
  generatedAt: Date;
  tokenEstimate: number;
}

export interface ConstitutionConstraints {
  path: string;
  loadedAt: Date;
  rules: ConstitutionRule[];
}

export interface ConstitutionRule {
  id: string;
  description: string;
  severity: 'error' | 'warning';
  check: (state: SessionState) => boolean;
}

// ============================================
// Output Types
// ============================================

export interface SpecKitOutput {
  /** All generated documents as markdown strings */
  artifacts: OutputArtifacts;

  /** Validation results against constitution */
  validation: ValidationResult | null;

  /** Processing statistics */
  stats: ProcessingStats;
}

export interface OutputArtifacts {
  readme: string;
  spec: string;
  plan: string;
  tasks: string;
  progress: string;
  adr: string;
  roadmap: string;
}

export interface ProcessingStats {
  totalDuration: number;
  documentsGenerated: number;
  totalTokens: number;
  warnings: string[];
}

export interface ValidationResult {
  isValid: boolean;
  score: number;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  recommendations: string[];
}

export interface ValidationIssue {
  ruleId: string;
  message: string;
  severity: 'error' | 'warning';
  location?: string;
}

// ============================================
// Factory Functions
// ============================================

export function createInitialSessionState(input: SpecKitInput): SessionState {
  return {
    input,
    constitution: null,
    sections: {
      readme: null,
      spec: null,
      plan: null,
      tasks: null,
      progress: null,
      adr: null,
      roadmap: null,
    },
    metadata: {
      startedAt: new Date(),
      totalTokensEstimate: 0,
      warnings: [],
    },
  };
}

export function createDefaultOutput(): SpecKitOutput {
  return {
    artifacts: {
      readme: '',
      spec: '',
      plan: '',
      tasks: '',
      progress: '',
      adr: '',
      roadmap: '',
    },
    validation: null,
    stats: {
      totalDuration: 0,
      documentsGenerated: 0,
      totalTokens: 0,
      warnings: [],
    },
  };
}
```

### Step 3.2: Extract Pure Generators

```typescript
// src/domain/speckit/generators/spec-generator.ts

import type { SessionState, MarkdownSection, Requirement, Objective } from '../types.js';

/**
 * Generate the spec.md document from session state.
 *
 * Pure function - no side effects, no external dependencies.
 *
 * @param state - Current session state
 * @returns Generated spec section
 */
export function generateSpec(state: SessionState): MarkdownSection {
  const { input } = state;
  const startTime = Date.now();

  const sections: string[] = [];

  // Title section
  sections.push(`# ${input.title} - Specification`);
  sections.push('');

  // Overview
  sections.push('## Overview');
  sections.push('');
  sections.push(input.overview);
  sections.push('');

  // Objectives
  sections.push('## Objectives');
  sections.push('');
  sections.push(formatObjectives(input.objectives));
  sections.push('');

  // Requirements
  sections.push('## Requirements');
  sections.push('');
  sections.push('### Functional Requirements');
  sections.push('');
  sections.push(formatRequirements(input.requirements.filter(r => r.type === 'functional')));
  sections.push('');
  sections.push('### Non-Functional Requirements');
  sections.push('');
  sections.push(formatRequirements(input.requirements.filter(r => r.type === 'non-functional')));
  sections.push('');

  // Acceptance Criteria
  if (input.acceptanceCriteria.length > 0) {
    sections.push('## Acceptance Criteria');
    sections.push('');
    sections.push(formatAcceptanceCriteria(input.acceptanceCriteria));
    sections.push('');
  }

  // Out of Scope
  if (input.outOfScope.length > 0) {
    sections.push('## Out of Scope');
    sections.push('');
    sections.push(formatOutOfScope(input.outOfScope));
    sections.push('');
  }

  const content = sections.join('\n');

  return {
    title: 'spec.md',
    content,
    generatedAt: new Date(),
    tokenEstimate: estimateTokens(content),
  };
}

// ============================================
// Formatting Helpers (Pure Functions)
// ============================================

function formatObjectives(objectives: Objective[]): string {
  const byPriority = groupByPriority(objectives);
  const lines: string[] = [];

  for (const priority of ['high', 'medium', 'low'] as const) {
    const items = byPriority[priority];
    if (items.length === 0) continue;

    lines.push(`### Priority: ${capitalize(priority)}`);
    lines.push('');

    for (const obj of items) {
      lines.push(`- ${obj.description}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

function formatRequirements(requirements: Requirement[]): string {
  if (requirements.length === 0) {
    return '_No requirements specified._';
  }

  const lines: string[] = [];
  lines.push('| ID | Description | Priority |');
  lines.push('|----|-------------|----------|');

  requirements.forEach((req, index) => {
    const id = `REQ-${String(index + 1).padStart(3, '0')}`;
    lines.push(`| ${id} | ${req.description} | ${capitalize(req.priority ?? 'medium')} |`);
  });

  return lines.join('\n');
}

function formatAcceptanceCriteria(criteria: string[]): string {
  return criteria.map((c, i) => `- [ ] **AC-${i + 1}**: ${c}`).join('\n');
}

function formatOutOfScope(items: string[]): string {
  return items.map(item => `- ❌ ${item}`).join('\n');
}

function groupByPriority<T extends { priority?: string }>(
  items: T[]
): Record<string, T[]> {
  const result: Record<string, T[]> = { high: [], medium: [], low: [] };

  for (const item of items) {
    const priority = item.priority ?? 'medium';
    result[priority].push(item);
  }

  return result;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function estimateTokens(text: string): number {
  // Rough estimate: ~4 characters per token
  return Math.ceil(text.length / 4);
}
```

```typescript
// src/domain/speckit/generators/plan-generator.ts

import type { SessionState, MarkdownSection } from '../types.js';

/**
 * Generate the plan.md document from session state.
 *
 * Pure function - no side effects.
 */
export function generatePlan(state: SessionState): MarkdownSection {
  const { input } = state;
  const startTime = Date.now();

  const sections: string[] = [];

  sections.push(`# ${input.title} - Implementation Plan`);
  sections.push('');

  // Executive Summary
  sections.push('## Executive Summary');
  sections.push('');
  sections.push(input.overview);
  sections.push('');

  // Phases (derived from objectives)
  sections.push('## Phases');
  sections.push('');
  sections.push(generatePhases(input.objectives));
  sections.push('');

  // Timeline (Mermaid Gantt)
  sections.push('## Timeline');
  sections.push('');
  sections.push(generateGanttChart(input.objectives));
  sections.push('');

  // Risk Assessment
  sections.push('## Risks & Mitigations');
  sections.push('');
  sections.push(generateRiskAssessment(input.requirements));
  sections.push('');

  const content = sections.join('\n');

  return {
    title: 'plan.md',
    content,
    generatedAt: new Date(),
    tokenEstimate: estimateTokens(content),
  };
}

function generatePhases(objectives: Array<{ description: string; priority?: string }>): string {
  const highPriority = objectives.filter(o => o.priority === 'high');
  const mediumPriority = objectives.filter(o => o.priority === 'medium');
  const lowPriority = objectives.filter(o => o.priority === 'low');

  const lines: string[] = [];

  if (highPriority.length > 0) {
    lines.push('### Phase 1: Foundation (Weeks 1-2)');
    lines.push('');
    lines.push('**Focus**: High-priority objectives');
    lines.push('');
    highPriority.forEach((obj, i) => {
      lines.push(`${i + 1}. ${obj.description}`);
    });
    lines.push('');
  }

  if (mediumPriority.length > 0) {
    lines.push('### Phase 2: Core Implementation (Weeks 3-4)');
    lines.push('');
    lines.push('**Focus**: Medium-priority objectives');
    lines.push('');
    mediumPriority.forEach((obj, i) => {
      lines.push(`${i + 1}. ${obj.description}`);
    });
    lines.push('');
  }

  if (lowPriority.length > 0) {
    lines.push('### Phase 3: Enhancement (Weeks 5-6)');
    lines.push('');
    lines.push('**Focus**: Low-priority objectives');
    lines.push('');
    lowPriority.forEach((obj, i) => {
      lines.push(`${i + 1}. ${obj.description}`);
    });
    lines.push('');
  }

  return lines.join('\n');
}

function generateGanttChart(objectives: Array<{ description: string; priority?: string }>): string {
  const lines: string[] = [];

  lines.push('```mermaid');
  lines.push('gantt');
  lines.push('    title Implementation Timeline');
  lines.push('    dateFormat YYYY-MM-DD');
  lines.push('');

  const highPriority = objectives.filter(o => o.priority === 'high');
  const mediumPriority = objectives.filter(o => o.priority === 'medium');
  const lowPriority = objectives.filter(o => o.priority === 'low');

  if (highPriority.length > 0) {
    lines.push('    section Phase 1');
    highPriority.forEach((obj, i) => {
      const taskName = truncate(obj.description, 30);
      lines.push(`    ${taskName} :p1t${i + 1}, 2025-01-06, 1w`);
    });
  }

  if (mediumPriority.length > 0) {
    lines.push('    section Phase 2');
    mediumPriority.forEach((obj, i) => {
      const taskName = truncate(obj.description, 30);
      lines.push(`    ${taskName} :p2t${i + 1}, after p1t1, 1w`);
    });
  }

  if (lowPriority.length > 0) {
    lines.push('    section Phase 3');
    lowPriority.forEach((obj, i) => {
      const taskName = truncate(obj.description, 30);
      lines.push(`    ${taskName} :p3t${i + 1}, after p2t1, 1w`);
    });
  }

  lines.push('```');

  return lines.join('\n');
}

function generateRiskAssessment(requirements: Array<{ description: string; priority?: string }>): string {
  const lines: string[] = [];

  lines.push('| Risk | Probability | Impact | Mitigation |');
  lines.push('|------|-------------|--------|------------|');

  // Generate risks based on requirement count and types
  if (requirements.length > 20) {
    lines.push('| Scope creep | High | High | Strict change control process |');
  }

  const nfr = requirements.filter(r => r.type === 'non-functional');
  if (nfr.length > 5) {
    lines.push('| Performance constraints | Medium | High | Early performance testing |');
  }

  lines.push('| Technical complexity | Medium | Medium | Incremental implementation |');
  lines.push('| Resource availability | Low | Medium | Cross-training team members |');

  return lines.join('\n');
}

function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
```

### Step 3.3: Create Generators Barrel

```typescript
// src/domain/speckit/generators/index.ts

export { generateSpec } from './spec-generator.js';
export { generatePlan } from './plan-generator.js';
export { generateTasks } from './tasks-generator.js';
export { generateProgress } from './progress-generator.js';
export { generateReadme } from './readme-generator.js';
export { generateAdr } from './adr-generator.js';
export { generateRoadmap } from './roadmap-generator.js';
```

### Step 3.4: Create Domain Barrel

```typescript
// src/domain/speckit/index.ts

// Types
export type {
  SpecKitInput,
  SpecKitOutput,
  SessionState,
  OutputArtifacts,
  ValidationResult,
  Objective,
  Requirement,
} from './types.js';

export {
  SpecKitInputSchema,
  createInitialSessionState,
  createDefaultOutput,
} from './types.js';

// Generators
export * from './generators/index.js';

// Validators
export * from './validators/index.js';
```

### Step 3.5: Migrate Strategy to BaseStrategy

```typescript
// src/strategies/speckit/speckit-strategy.ts

import { BaseStrategy, type StrategyResult } from '../../domain/base-strategy/index.js';
import {
  type SpecKitInput,
  type SpecKitOutput,
  type SessionState,
  SpecKitInputSchema,
  createInitialSessionState,
  createDefaultOutput,
  generateSpec,
  generatePlan,
  generateTasks,
  generateProgress,
  generateReadme,
  generateAdr,
  generateRoadmap,
  validateAgainstConstitution,
} from '../../domain/speckit/index.js';

/**
 * SpecKit Strategy - Generates full project specification artifacts.
 *
 * Extends BaseStrategy to provide:
 * - Zod validation of inputs
 * - Execution tracing for debugging
 * - Consistent error handling
 * - Structured output format
 *
 * @example
 * ```typescript
 * const strategy = new SpecKitStrategy();
 * const result = await strategy.execute({
 *   title: 'My Project',
 *   overview: 'Project description...',
 *   objectives: [{ description: 'Build X', priority: 'high' }],
 *   requirements: [{ description: 'Must do Y', type: 'functional' }],
 * });
 *
 * if (result.success) {
 *   console.log(result.output.artifacts.spec);
 * }
 * ```
 */
export class SpecKitStrategy extends BaseStrategy<SpecKitInput, SpecKitOutput> {
  readonly name = 'speckit';
  readonly version = '2.0.0';

  constructor() {
    super(SpecKitInputSchema);
  }

  /**
   * Execute the SpecKit generation pipeline.
   *
   * Pipeline stages:
   * 1. Initialize session state
   * 2. Load constitution (if specified)
   * 3. Generate all documents in parallel
   * 4. Validate against constitution (if enabled)
   * 5. Compile final output
   */
  protected async executeStrategy(input: SpecKitInput): Promise<SpecKitOutput> {
    const startTime = Date.now();

    // Stage 1: Initialize
    this.trace.recordDecision(
      'initialize',
      'Creating session state from validated input',
      { title: input.title, objectiveCount: input.objectives.length }
    );
    const state = createInitialSessionState(input);

    // Stage 2: Load constitution (optional)
    if (input.constitutionPath) {
      this.trace.recordDecision(
        'load-constitution',
        `Loading constitution from ${input.constitutionPath}`,
        { path: input.constitutionPath }
      );
      state.constitution = await this.loadConstitution(input.constitutionPath);
    }

    // Stage 3: Generate documents
    this.trace.recordDecision(
      'generate-documents',
      'Generating all specification documents',
      { documentsToGenerate: 7 }
    );

    const generationStart = Date.now();

    // Generate in parallel for performance
    const [readme, spec, plan, tasks, progress, adr, roadmap] = await Promise.all([
      this.safeGenerate(() => generateReadme(state), 'readme'),
      this.safeGenerate(() => generateSpec(state), 'spec'),
      this.safeGenerate(() => generatePlan(state), 'plan'),
      this.safeGenerate(() => generateTasks(state), 'tasks'),
      this.safeGenerate(() => generateProgress(state), 'progress'),
      this.safeGenerate(() => generateAdr(state), 'adr'),
      this.safeGenerate(() => generateRoadmap(state), 'roadmap'),
    ]);

    const generationDuration = Date.now() - generationStart;
    this.trace.recordMetric('generation_duration_ms', generationDuration);

    // Stage 4: Validate (optional)
    let validation = null;
    if (input.validateAgainstConstitution && state.constitution) {
      this.trace.recordDecision(
        'validate-constitution',
        'Validating generated documents against constitution',
        { ruleCount: state.constitution.rules.length }
      );

      validation = await validateAgainstConstitution(
        { readme, spec, plan, tasks, progress, adr, roadmap },
        state.constitution
      );

      this.trace.recordMetric('validation_score', validation.score);

      if (!validation.isValid) {
        this.trace.recordError(
          new Error(`Constitution validation failed: ${validation.errors.length} errors`),
          { errors: validation.errors }
        );
      }
    }

    // Stage 5: Compile output
    const totalDuration = Date.now() - startTime;
    this.trace.recordMetric('total_duration_ms', totalDuration);

    const output: SpecKitOutput = {
      artifacts: {
        readme: readme?.content ?? '',
        spec: spec?.content ?? '',
        plan: plan?.content ?? '',
        tasks: tasks?.content ?? '',
        progress: progress?.content ?? '',
        adr: adr?.content ?? '',
        roadmap: roadmap?.content ?? '',
      },
      validation,
      stats: {
        totalDuration,
        documentsGenerated: [readme, spec, plan, tasks, progress, adr, roadmap].filter(Boolean).length,
        totalTokens: [readme, spec, plan, tasks, progress, adr, roadmap]
          .reduce((sum, doc) => sum + (doc?.tokenEstimate ?? 0), 0),
        warnings: state.metadata.warnings,
      },
    };

    return output;
  }

  /**
   * Wrap generator in error handling with trace logging.
   */
  private async safeGenerate<T>(
    generator: () => T,
    name: string
  ): Promise<T | null> {
    try {
      const result = generator();
      this.trace.recordDecision(
        `generate-${name}`,
        `Successfully generated ${name}`,
        {}
      );
      return result;
    } catch (error) {
      this.trace.recordError(
        error instanceof Error ? error : new Error(String(error)),
        { generator: name }
      );
      return null;
    }
  }

  /**
   * Load constitution from file path.
   */
  private async loadConstitution(path: string): Promise<SessionState['constitution']> {
    // Will use PAL in Phase 4, for now use fs directly
    const { promises: fs } = await import('node:fs');

    try {
      const content = await fs.readFile(path, 'utf-8');
      // Parse constitution (implementation in validators/)
      return {
        path,
        loadedAt: new Date(),
        rules: [], // TODO: Parse rules from content
      };
    } catch (error) {
      this.trace.recordError(
        error instanceof Error ? error : new Error(String(error)),
        { path }
      );
      return null;
    }
  }
}
```

---

## 4. Test Coverage

```typescript
// tests/vitest/domain/speckit/generators/spec-generator.spec.ts

import { describe, it, expect } from 'vitest';
import { generateSpec } from '../../../../../src/domain/speckit/generators/spec-generator.js';
import { createInitialSessionState } from '../../../../../src/domain/speckit/types.js';

describe('generateSpec', () => {
  const baseInput = {
    title: 'Test Project',
    overview: 'A test project for unit testing',
    objectives: [
      { description: 'Build feature A', priority: 'high' as const },
      { description: 'Build feature B', priority: 'medium' as const },
    ],
    requirements: [
      { description: 'Must do X', type: 'functional' as const, priority: 'high' as const },
      { description: 'Performance < 100ms', type: 'non-functional' as const, priority: 'medium' as const },
    ],
    acceptanceCriteria: ['System boots in < 5s', 'All tests pass'],
    outOfScope: ['Mobile support', 'i18n'],
  };

  it('should generate spec with all sections', () => {
    const state = createInitialSessionState(baseInput);
    const result = generateSpec(state);

    expect(result.title).toBe('spec.md');
    expect(result.content).toContain('# Test Project - Specification');
    expect(result.content).toContain('## Overview');
    expect(result.content).toContain('## Objectives');
    expect(result.content).toContain('## Requirements');
    expect(result.content).toContain('### Functional Requirements');
    expect(result.content).toContain('### Non-Functional Requirements');
    expect(result.content).toContain('## Acceptance Criteria');
    expect(result.content).toContain('## Out of Scope');
  });

  it('should format objectives by priority', () => {
    const state = createInitialSessionState(baseInput);
    const result = generateSpec(state);

    expect(result.content).toContain('### Priority: High');
    expect(result.content).toContain('### Priority: Medium');
    expect(result.content).toContain('Build feature A');
    expect(result.content).toContain('Build feature B');
  });

  it('should format requirements as table', () => {
    const state = createInitialSessionState(baseInput);
    const result = generateSpec(state);

    expect(result.content).toContain('| ID | Description | Priority |');
    expect(result.content).toContain('| REQ-001 |');
    expect(result.content).toContain('Must do X');
  });

  it('should estimate tokens', () => {
    const state = createInitialSessionState(baseInput);
    const result = generateSpec(state);

    expect(result.tokenEstimate).toBeGreaterThan(0);
    expect(result.tokenEstimate).toBe(Math.ceil(result.content.length / 4));
  });

  it('should skip optional sections if empty', () => {
    const input = {
      ...baseInput,
      acceptanceCriteria: [],
      outOfScope: [],
    };
    const state = createInitialSessionState(input);
    const result = generateSpec(state);

    expect(result.content).not.toContain('## Acceptance Criteria');
    expect(result.content).not.toContain('## Out of Scope');
  });
});
```

```typescript
// tests/vitest/strategies/speckit/speckit-strategy.spec.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SpecKitStrategy } from '../../../../src/strategies/speckit/speckit-strategy.js';

describe('SpecKitStrategy', () => {
  let strategy: SpecKitStrategy;

  beforeEach(() => {
    strategy = new SpecKitStrategy();
  });

  const validInput = {
    title: 'Test Project',
    overview: 'A test project',
    objectives: [{ description: 'Build feature', priority: 'high' as const }],
    requirements: [{ description: 'Must work', type: 'functional' as const }],
  };

  describe('execute', () => {
    it('should generate all artifacts', async () => {
      const result = await strategy.execute(validInput);

      expect(result.success).toBe(true);
      expect(result.output).toBeDefined();
      expect(result.output!.artifacts.readme).toBeTruthy();
      expect(result.output!.artifacts.spec).toBeTruthy();
      expect(result.output!.artifacts.plan).toBeTruthy();
      expect(result.output!.artifacts.tasks).toBeTruthy();
    });

    it('should include execution trace', async () => {
      const result = await strategy.execute(validInput);

      expect(result.trace).toBeDefined();
      expect(result.trace.decisions.length).toBeGreaterThan(0);
      expect(result.trace.metrics['total_duration_ms']).toBeDefined();
    });

    it('should record generation metrics', async () => {
      const result = await strategy.execute(validInput);

      expect(result.trace.metrics['generation_duration_ms']).toBeDefined();
      expect(result.output!.stats.documentsGenerated).toBe(7);
    });
  });

  describe('validation', () => {
    it('should reject missing title', async () => {
      const input = { ...validInput, title: '' };
      const result = await strategy.execute(input);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_ERROR');
    });

    it('should reject empty objectives', async () => {
      const input = { ...validInput, objectives: [] };
      const result = await strategy.execute(input);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('objective');
    });
  });
});
```

---

## 5. Acceptance Criteria

| Criterion                                                | Status | Verification               |
| -------------------------------------------------------- | ------ | -------------------------- |
| Types extracted to `src/domain/speckit/types.ts`         | ⬜      | File exists with all types |
| Generators extracted to `src/domain/speckit/generators/` | ⬜      | 7 generator files exist    |
| SpecKitStrategy extends BaseStrategy                     | ⬜      | Class compiles             |
| All generators are pure functions                        | ⬜      | No side effects in tests   |
| ExecutionTrace records all decisions                     | ⬜      | Trace has 5+ decisions     |
| Validation errors use ErrorCode                          | ⬜      | Error codes correct        |
| 90% test coverage                                        | ⬜      | Coverage report            |
| Existing behavior preserved                              | ⬜      | Integration tests pass     |

---

## 6. References

| Document                      | Link                                                                                 |
| ----------------------------- | ------------------------------------------------------------------------------------ |
| T-001: BaseStrategy           | [T-001-base-strategy.md](../phase-1-foundation/T-001-base-strategy.md)               |
| ADR-001: BaseStrategy Pattern | [adr.md](../../adr.md#adr-001)                                                       |
| Current speckit-strategy.ts   | [src/strategies/speckit-strategy.ts](../../../../src/strategies/speckit-strategy.ts) |

---

*Task: T-011 | Phase: 2 | Priority: P0*
