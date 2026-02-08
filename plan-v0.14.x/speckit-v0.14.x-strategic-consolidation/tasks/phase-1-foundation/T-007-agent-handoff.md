# T-007: Implement AgentHandoffCoordinator

**Task ID**: T-007
**Phase**: 1 - Foundation
**Priority**: P1 (High)
**Estimate**: 4 hours
**Owner**: @mcp-tool-builder
**Reviewer**: @architecture-advisor
**Dependencies**: T-003 (ExecutionTrace), T-005 (SummaryFeedbackCoordinator)
**Blocks**: T-042 (Multi-agent workflow)

---

## 1. Overview

### What

Create `AgentHandoffCoordinator` - a component that:
- Prepares context for agent-to-agent handoffs
- Packages execution traces for receiving agents
- Generates handoff instructions
- Supports inter-tool delegation

### Why

Current agent handoffs are:
- Ad-hoc with inconsistent context transfer
- Missing execution history from prior operations
- Not tracked for debugging
- Hard to chain across tools

### Target API

```typescript
// Create handoff from current operation
const handoff = AgentHandoffCoordinator.prepareHandoff({
  sourceAgent: 'speckit-generator',
  targetAgent: 'code-reviewer',
  trace: executionTrace,
  context: {
    generatedArtifacts: ['spec.md', 'plan.md'],
    sessionId: 'session-123',
  },
  instructions: 'Review the generated spec for completeness.',
});

// Serialize for MCP response
const serialized = handoff.toJSON();

// Receiving agent can parse
const received = AgentHandoffCoordinator.parseHandoff(serialized);
```

---

## 2. Implementation Guide

### Step 2.1: Define Handoff Types

```typescript
// src/domain/coordination/handoff-types.ts

import type { ExecutionTrace } from './execution-trace.js';

/**
 * Agent identifier type.
 */
export type AgentId =
  | 'speckit-generator'
  | 'code-reviewer'
  | 'security-auditor'
  | 'tdd-workflow'
  | 'documentation-generator'
  | 'architecture-advisor'
  | 'debugging-assistant'
  | 'mcp-tool-builder'
  | 'prompt-architect'
  | 'custom';

/**
 * Handoff priority level.
 */
export type HandoffPriority = 'immediate' | 'normal' | 'background';

/**
 * Handoff status.
 */
export type HandoffStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'completed'
  | 'expired';

/**
 * Context passed to receiving agent.
 */
export interface HandoffContext {
  /** Session identifier for correlation */
  sessionId?: string;

  /** Files generated or modified */
  artifacts?: string[];

  /** Working directory or scope */
  workingDirectory?: string;

  /** User's original request */
  userRequest?: string;

  /** Previous decisions made */
  decisions?: Array<{
    what: string;
    why: string;
    alternatives?: string[];
  }>;

  /** Custom context data */
  custom?: Record<string, unknown>;
}

/**
 * Instructions for receiving agent.
 */
export interface HandoffInstructions {
  /** Primary task description */
  task: string;

  /** Expected output format */
  expectedOutput?: string;

  /** Constraints to follow */
  constraints?: string[];

  /** Focus areas */
  focusAreas?: string[];

  /** Things to avoid */
  avoid?: string[];

  /** Deadline or urgency */
  deadline?: Date;
}

/**
 * Complete handoff package.
 */
export interface HandoffPackage {
  /** Unique handoff identifier */
  id: string;

  /** Version for compatibility */
  version: string;

  /** Source agent */
  sourceAgent: AgentId;

  /** Target agent */
  targetAgent: AgentId;

  /** Priority level */
  priority: HandoffPriority;

  /** Current status */
  status: HandoffStatus;

  /** Handoff context */
  context: HandoffContext;

  /** Instructions for target */
  instructions: HandoffInstructions;

  /** Execution trace from source */
  trace?: ExecutionTraceSnapshot;

  /** Creation timestamp */
  createdAt: Date;

  /** Expiration time */
  expiresAt?: Date;

  /** Metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Snapshot of execution trace for serialization.
 */
export interface ExecutionTraceSnapshot {
  /** Operation name */
  operation: string;

  /** Timestamp */
  timestamp: string;

  /** Duration in ms */
  durationMs: number;

  /** Key decisions */
  decisions: Array<{
    point: string;
    choice: string;
    reason: string;
  }>;

  /** Key metrics */
  metrics: Array<{
    name: string;
    value: number;
    unit?: string;
  }>;

  /** Errors encountered */
  errors: Array<{
    code: string;
    message: string;
  }>;

  /** Success status */
  success: boolean;
}

/**
 * Request to create a handoff.
 */
export interface CreateHandoffRequest {
  /** Source agent */
  sourceAgent: AgentId;

  /** Target agent */
  targetAgent: AgentId;

  /** Execution trace */
  trace?: ExecutionTrace;

  /** Context data */
  context: HandoffContext;

  /** Task instructions */
  instructions: string | HandoffInstructions;

  /** Priority level */
  priority?: HandoffPriority;

  /** Expiration duration in minutes */
  expirationMinutes?: number;

  /** Additional metadata */
  metadata?: Record<string, unknown>;
}
```

### Step 2.2: Implement AgentHandoffCoordinator

```typescript
// src/domain/coordination/agent-handoff-coordinator.ts

import { randomUUID } from 'node:crypto';
import type {
  AgentId,
  HandoffPackage,
  HandoffContext,
  HandoffInstructions,
  HandoffStatus,
  HandoffPriority,
  CreateHandoffRequest,
  ExecutionTraceSnapshot,
} from './handoff-types.js';
import type { ExecutionTrace } from './execution-trace.js';

/**
 * Current handoff protocol version.
 */
const HANDOFF_VERSION = '1.0.0';

/**
 * Default expiration in minutes.
 */
const DEFAULT_EXPIRATION_MINUTES = 60;

/**
 * AgentHandoffCoordinator - manages agent-to-agent handoffs.
 *
 * Features:
 * - Packages execution context for handoffs
 * - Generates structured instructions
 * - Supports serialization for MCP transport
 * - Tracks handoff lifecycle
 *
 * @example
 * ```typescript
 * const handoff = AgentHandoffCoordinator.prepareHandoff({
 *   sourceAgent: 'speckit-generator',
 *   targetAgent: 'code-reviewer',
 *   trace: executionTrace,
 *   context: { artifacts: ['spec.md'] },
 *   instructions: 'Review the spec for completeness.',
 * });
 *
 * // Serialize for transport
 * const json = handoff.toJSON();
 *
 * // Parse on receiving side
 * const received = AgentHandoffCoordinator.parseHandoff(json);
 * ```
 */
export class AgentHandoffCoordinator {
  // ============================================
  // Static Factory Methods
  // ============================================

  /**
   * Prepare a handoff package.
   */
  static prepareHandoff(request: CreateHandoffRequest): HandoffPackage {
    const now = new Date();
    const expirationMinutes = request.expirationMinutes ?? DEFAULT_EXPIRATION_MINUTES;

    // Normalize instructions
    const instructions = typeof request.instructions === 'string'
      ? { task: request.instructions }
      : request.instructions;

    // Create trace snapshot if provided
    const traceSnapshot = request.trace
      ? AgentHandoffCoordinator.createTraceSnapshot(request.trace)
      : undefined;

    return {
      id: randomUUID(),
      version: HANDOFF_VERSION,
      sourceAgent: request.sourceAgent,
      targetAgent: request.targetAgent,
      priority: request.priority ?? 'normal',
      status: 'pending' as HandoffStatus,
      context: request.context,
      instructions,
      trace: traceSnapshot,
      createdAt: now,
      expiresAt: new Date(now.getTime() + expirationMinutes * 60 * 1000),
      metadata: request.metadata,
    };
  }

  /**
   * Parse a serialized handoff.
   */
  static parseHandoff(json: string | object): HandoffPackage {
    const data = typeof json === 'string' ? JSON.parse(json) : json;

    // Validate version compatibility
    if (!data.version) {
      throw new Error('Invalid handoff: missing version');
    }

    const [major] = data.version.split('.');
    const [currentMajor] = HANDOFF_VERSION.split('.');

    if (major !== currentMajor) {
      throw new Error(
        `Incompatible handoff version: ${data.version} (expected ${HANDOFF_VERSION})`
      );
    }

    // Restore dates
    return {
      ...data,
      createdAt: new Date(data.createdAt),
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
    };
  }

  // ============================================
  // Instance Methods
  // ============================================

  private handoffs = new Map<string, HandoffPackage>();

  /**
   * Register a handoff.
   */
  register(handoff: HandoffPackage): void {
    this.handoffs.set(handoff.id, handoff);
  }

  /**
   * Get a handoff by ID.
   */
  get(id: string): HandoffPackage | undefined {
    return this.handoffs.get(id);
  }

  /**
   * Update handoff status.
   */
  updateStatus(id: string, status: HandoffStatus): boolean {
    const handoff = this.handoffs.get(id);
    if (!handoff) return false;

    handoff.status = status;
    return true;
  }

  /**
   * Check if handoff is expired.
   */
  isExpired(handoff: HandoffPackage): boolean {
    if (!handoff.expiresAt) return false;
    return new Date() > handoff.expiresAt;
  }

  /**
   * List pending handoffs for an agent.
   */
  listPendingForAgent(agentId: AgentId): HandoffPackage[] {
    return Array.from(this.handoffs.values())
      .filter(h =>
        h.targetAgent === agentId &&
        h.status === 'pending' &&
        !this.isExpired(h)
      )
      .sort((a, b) => {
        // Sort by priority, then by creation time
        const priorityOrder: Record<HandoffPriority, number> = {
          immediate: 0,
          normal: 1,
          background: 2,
        };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return a.createdAt.getTime() - b.createdAt.getTime();
      });
  }

  /**
   * Clear expired handoffs.
   */
  clearExpired(): number {
    let cleared = 0;

    for (const [id, handoff] of this.handoffs) {
      if (this.isExpired(handoff)) {
        this.handoffs.delete(id);
        cleared++;
      }
    }

    return cleared;
  }

  // ============================================
  // Trace Snapshot
  // ============================================

  /**
   * Create a serializable snapshot from an execution trace.
   */
  static createTraceSnapshot(trace: ExecutionTrace): ExecutionTraceSnapshot {
    const data = trace.toJSON();

    return {
      operation: data.operation,
      timestamp: data.timestamp,
      durationMs: data.durationMs,
      decisions: data.decisions.map(d => ({
        point: d.point,
        choice: d.choice,
        reason: d.reason,
      })),
      metrics: data.metrics.map(m => ({
        name: m.name,
        value: m.value,
        unit: m.unit,
      })),
      errors: data.errors.map(e => ({
        code: e.code,
        message: e.message,
      })),
      success: data.success,
    };
  }

  // ============================================
  // Serialization Helpers
  // ============================================

  /**
   * Convert handoff to JSON string.
   */
  static toJSON(handoff: HandoffPackage): string {
    return JSON.stringify(handoff, null, 2);
  }

  /**
   * Generate markdown summary of handoff.
   */
  static toMarkdown(handoff: HandoffPackage): string {
    const lines: string[] = [];

    lines.push(`# Agent Handoff: ${handoff.sourceAgent} → ${handoff.targetAgent}`);
    lines.push('');
    lines.push(`**ID**: \`${handoff.id}\``);
    lines.push(`**Status**: ${handoff.status}`);
    lines.push(`**Priority**: ${handoff.priority}`);
    lines.push(`**Created**: ${handoff.createdAt.toISOString()}`);
    if (handoff.expiresAt) {
      lines.push(`**Expires**: ${handoff.expiresAt.toISOString()}`);
    }
    lines.push('');

    // Instructions
    lines.push('## Instructions');
    lines.push('');
    lines.push(`**Task**: ${handoff.instructions.task}`);

    if (handoff.instructions.constraints?.length) {
      lines.push('');
      lines.push('**Constraints**:');
      for (const c of handoff.instructions.constraints) {
        lines.push(`- ${c}`);
      }
    }

    if (handoff.instructions.focusAreas?.length) {
      lines.push('');
      lines.push('**Focus Areas**:');
      for (const f of handoff.instructions.focusAreas) {
        lines.push(`- ${f}`);
      }
    }

    // Context
    if (handoff.context.artifacts?.length) {
      lines.push('');
      lines.push('## Artifacts');
      lines.push('');
      for (const a of handoff.context.artifacts) {
        lines.push(`- \`${a}\``);
      }
    }

    if (handoff.context.decisions?.length) {
      lines.push('');
      lines.push('## Prior Decisions');
      lines.push('');
      for (const d of handoff.context.decisions) {
        lines.push(`- **${d.what}**: ${d.why}`);
      }
    }

    // Trace summary
    if (handoff.trace) {
      lines.push('');
      lines.push('## Execution Trace Summary');
      lines.push('');
      lines.push(`- **Operation**: ${handoff.trace.operation}`);
      lines.push(`- **Duration**: ${handoff.trace.durationMs}ms`);
      lines.push(`- **Success**: ${handoff.trace.success ? '✅' : '❌'}`);
      lines.push(`- **Decisions**: ${handoff.trace.decisions.length}`);
      lines.push(`- **Errors**: ${handoff.trace.errors.length}`);
    }

    return lines.join('\n');
  }
}

/**
 * Default coordinator instance.
 */
export const agentHandoffCoordinator = new AgentHandoffCoordinator();
```

### Step 2.3: Create Barrel Export

```typescript
// src/domain/coordination/index.ts

// Types
export type {
  AgentId,
  HandoffPriority,
  HandoffStatus,
  HandoffContext,
  HandoffInstructions,
  HandoffPackage,
  ExecutionTraceSnapshot,
  CreateHandoffRequest,
} from './handoff-types.js';

// Execution Trace (from T-003)
export { ExecutionTrace } from './execution-trace.js';
export type {
  TraceDecision,
  TraceMetric,
  TraceError,
  TraceExportData
} from './execution-trace.js';

// Summary Feedback (from T-005)
export { SummaryFeedbackCoordinator } from './summary-feedback-coordinator.js';
export type {
  OperationStatus,
  FeedbackItem,
  Suggestion,
  SummaryResult,
} from './summary-feedback-coordinator.js';

// Agent Handoff
export {
  AgentHandoffCoordinator,
  agentHandoffCoordinator,
} from './agent-handoff-coordinator.js';
```

---

## 3. Test Coverage

```typescript
// tests/vitest/domain/coordination/agent-handoff-coordinator.spec.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  AgentHandoffCoordinator,
  agentHandoffCoordinator,
} from '../../../../src/domain/coordination/agent-handoff-coordinator.js';
import { ExecutionTrace } from '../../../../src/domain/coordination/execution-trace.js';
import type { CreateHandoffRequest } from '../../../../src/domain/coordination/handoff-types.js';

describe('AgentHandoffCoordinator', () => {
  let coordinator: AgentHandoffCoordinator;

  beforeEach(() => {
    coordinator = new AgentHandoffCoordinator();
  });

  // ============================================
  // prepareHandoff
  // ============================================

  describe('prepareHandoff', () => {
    it('should create handoff package with required fields', () => {
      const handoff = AgentHandoffCoordinator.prepareHandoff({
        sourceAgent: 'speckit-generator',
        targetAgent: 'code-reviewer',
        context: { artifacts: ['spec.md'] },
        instructions: 'Review the spec.',
      });

      expect(handoff.id).toBeDefined();
      expect(handoff.version).toBe('1.0.0');
      expect(handoff.sourceAgent).toBe('speckit-generator');
      expect(handoff.targetAgent).toBe('code-reviewer');
      expect(handoff.status).toBe('pending');
      expect(handoff.instructions.task).toBe('Review the spec.');
    });

    it('should set default priority to normal', () => {
      const handoff = AgentHandoffCoordinator.prepareHandoff({
        sourceAgent: 'speckit-generator',
        targetAgent: 'code-reviewer',
        context: {},
        instructions: 'Test',
      });

      expect(handoff.priority).toBe('normal');
    });

    it('should accept priority override', () => {
      const handoff = AgentHandoffCoordinator.prepareHandoff({
        sourceAgent: 'speckit-generator',
        targetAgent: 'security-auditor',
        context: {},
        instructions: 'Urgent security review',
        priority: 'immediate',
      });

      expect(handoff.priority).toBe('immediate');
    });

    it('should set expiration time', () => {
      const handoff = AgentHandoffCoordinator.prepareHandoff({
        sourceAgent: 'speckit-generator',
        targetAgent: 'code-reviewer',
        context: {},
        instructions: 'Test',
        expirationMinutes: 30,
      });

      const expectedExpiry = handoff.createdAt.getTime() + 30 * 60 * 1000;
      expect(handoff.expiresAt?.getTime()).toBe(expectedExpiry);
    });

    it('should include execution trace snapshot', () => {
      const trace = new ExecutionTrace('test-operation');
      trace.recordDecision('validation', 'passed', 'All inputs valid');
      trace.recordMetric('duration', 100, 'ms');
      trace.complete(true);

      const handoff = AgentHandoffCoordinator.prepareHandoff({
        sourceAgent: 'speckit-generator',
        targetAgent: 'code-reviewer',
        context: {},
        instructions: 'Test',
        trace,
      });

      expect(handoff.trace).toBeDefined();
      expect(handoff.trace?.operation).toBe('test-operation');
      expect(handoff.trace?.decisions).toHaveLength(1);
      expect(handoff.trace?.success).toBe(true);
    });

    it('should accept detailed instructions object', () => {
      const handoff = AgentHandoffCoordinator.prepareHandoff({
        sourceAgent: 'speckit-generator',
        targetAgent: 'code-reviewer',
        context: {},
        instructions: {
          task: 'Review the generated spec',
          constraints: ['Focus on completeness', 'Check for ambiguity'],
          focusAreas: ['Requirements section', 'Acceptance criteria'],
          avoid: ['Implementation details'],
        },
      });

      expect(handoff.instructions.task).toBe('Review the generated spec');
      expect(handoff.instructions.constraints).toHaveLength(2);
      expect(handoff.instructions.focusAreas).toHaveLength(2);
    });
  });

  // ============================================
  // parseHandoff
  // ============================================

  describe('parseHandoff', () => {
    it('should parse JSON string', () => {
      const original = AgentHandoffCoordinator.prepareHandoff({
        sourceAgent: 'speckit-generator',
        targetAgent: 'code-reviewer',
        context: { artifacts: ['test.md'] },
        instructions: 'Test',
      });

      const json = JSON.stringify(original);
      const parsed = AgentHandoffCoordinator.parseHandoff(json);

      expect(parsed.id).toBe(original.id);
      expect(parsed.sourceAgent).toBe(original.sourceAgent);
      expect(parsed.context.artifacts).toEqual(['test.md']);
    });

    it('should parse object directly', () => {
      const original = AgentHandoffCoordinator.prepareHandoff({
        sourceAgent: 'speckit-generator',
        targetAgent: 'code-reviewer',
        context: {},
        instructions: 'Test',
      });

      const parsed = AgentHandoffCoordinator.parseHandoff(original);

      expect(parsed.id).toBe(original.id);
    });

    it('should restore Date objects', () => {
      const original = AgentHandoffCoordinator.prepareHandoff({
        sourceAgent: 'speckit-generator',
        targetAgent: 'code-reviewer',
        context: {},
        instructions: 'Test',
      });

      const json = JSON.stringify(original);
      const parsed = AgentHandoffCoordinator.parseHandoff(json);

      expect(parsed.createdAt).toBeInstanceOf(Date);
      expect(parsed.expiresAt).toBeInstanceOf(Date);
    });

    it('should throw on missing version', () => {
      expect(() => {
        AgentHandoffCoordinator.parseHandoff({ sourceAgent: 'test' });
      }).toThrow('missing version');
    });

    it('should throw on incompatible version', () => {
      expect(() => {
        AgentHandoffCoordinator.parseHandoff({ version: '2.0.0' });
      }).toThrow('Incompatible handoff version');
    });
  });

  // ============================================
  // Instance Management
  // ============================================

  describe('instance management', () => {
    it('should register and retrieve handoff', () => {
      const handoff = AgentHandoffCoordinator.prepareHandoff({
        sourceAgent: 'speckit-generator',
        targetAgent: 'code-reviewer',
        context: {},
        instructions: 'Test',
      });

      coordinator.register(handoff);
      const retrieved = coordinator.get(handoff.id);

      expect(retrieved).toBe(handoff);
    });

    it('should update handoff status', () => {
      const handoff = AgentHandoffCoordinator.prepareHandoff({
        sourceAgent: 'speckit-generator',
        targetAgent: 'code-reviewer',
        context: {},
        instructions: 'Test',
      });

      coordinator.register(handoff);
      const updated = coordinator.updateStatus(handoff.id, 'accepted');

      expect(updated).toBe(true);
      expect(coordinator.get(handoff.id)?.status).toBe('accepted');
    });

    it('should return false for unknown handoff update', () => {
      const updated = coordinator.updateStatus('unknown-id', 'accepted');
      expect(updated).toBe(false);
    });
  });

  // ============================================
  // Expiration
  // ============================================

  describe('expiration', () => {
    it('should detect expired handoff', () => {
      const handoff = AgentHandoffCoordinator.prepareHandoff({
        sourceAgent: 'speckit-generator',
        targetAgent: 'code-reviewer',
        context: {},
        instructions: 'Test',
        expirationMinutes: 0, // Immediately expired
      });

      // Wait a tick
      vi.useFakeTimers();
      vi.advanceTimersByTime(1);

      expect(coordinator.isExpired(handoff)).toBe(true);

      vi.useRealTimers();
    });

    it('should clear expired handoffs', () => {
      vi.useFakeTimers();

      const handoff1 = AgentHandoffCoordinator.prepareHandoff({
        sourceAgent: 'speckit-generator',
        targetAgent: 'code-reviewer',
        context: {},
        instructions: 'Test 1',
        expirationMinutes: 1,
      });

      const handoff2 = AgentHandoffCoordinator.prepareHandoff({
        sourceAgent: 'speckit-generator',
        targetAgent: 'code-reviewer',
        context: {},
        instructions: 'Test 2',
        expirationMinutes: 60,
      });

      coordinator.register(handoff1);
      coordinator.register(handoff2);

      // Advance time past first handoff expiration
      vi.advanceTimersByTime(2 * 60 * 1000);

      const cleared = coordinator.clearExpired();

      expect(cleared).toBe(1);
      expect(coordinator.get(handoff1.id)).toBeUndefined();
      expect(coordinator.get(handoff2.id)).toBeDefined();

      vi.useRealTimers();
    });
  });

  // ============================================
  // Listing
  // ============================================

  describe('listPendingForAgent', () => {
    it('should list pending handoffs for agent', () => {
      const handoff1 = AgentHandoffCoordinator.prepareHandoff({
        sourceAgent: 'speckit-generator',
        targetAgent: 'code-reviewer',
        context: {},
        instructions: 'Test 1',
      });

      const handoff2 = AgentHandoffCoordinator.prepareHandoff({
        sourceAgent: 'speckit-generator',
        targetAgent: 'security-auditor',
        context: {},
        instructions: 'Test 2',
      });

      coordinator.register(handoff1);
      coordinator.register(handoff2);

      const pending = coordinator.listPendingForAgent('code-reviewer');

      expect(pending).toHaveLength(1);
      expect(pending[0].id).toBe(handoff1.id);
    });

    it('should sort by priority then creation time', () => {
      vi.useFakeTimers();

      const handoff1 = AgentHandoffCoordinator.prepareHandoff({
        sourceAgent: 'speckit-generator',
        targetAgent: 'code-reviewer',
        context: {},
        instructions: 'Normal 1',
        priority: 'normal',
      });

      vi.advanceTimersByTime(1000);

      const handoff2 = AgentHandoffCoordinator.prepareHandoff({
        sourceAgent: 'speckit-generator',
        targetAgent: 'code-reviewer',
        context: {},
        instructions: 'Immediate',
        priority: 'immediate',
      });

      vi.advanceTimersByTime(1000);

      const handoff3 = AgentHandoffCoordinator.prepareHandoff({
        sourceAgent: 'speckit-generator',
        targetAgent: 'code-reviewer',
        context: {},
        instructions: 'Normal 2',
        priority: 'normal',
      });

      coordinator.register(handoff1);
      coordinator.register(handoff2);
      coordinator.register(handoff3);

      const pending = coordinator.listPendingForAgent('code-reviewer');

      expect(pending[0].id).toBe(handoff2.id); // Immediate first
      expect(pending[1].id).toBe(handoff1.id); // Normal, earlier
      expect(pending[2].id).toBe(handoff3.id); // Normal, later

      vi.useRealTimers();
    });
  });

  // ============================================
  // Serialization
  // ============================================

  describe('toMarkdown', () => {
    it('should generate markdown summary', () => {
      const trace = new ExecutionTrace('test-operation');
      trace.recordDecision('validation', 'passed', 'All inputs valid');
      trace.complete(true);

      const handoff = AgentHandoffCoordinator.prepareHandoff({
        sourceAgent: 'speckit-generator',
        targetAgent: 'code-reviewer',
        context: {
          artifacts: ['spec.md', 'plan.md'],
          decisions: [
            { what: 'Template', why: 'Using standard format' },
          ],
        },
        instructions: {
          task: 'Review for completeness',
          constraints: ['Focus on requirements'],
        },
        trace,
      });

      const markdown = AgentHandoffCoordinator.toMarkdown(handoff);

      expect(markdown).toContain('speckit-generator → code-reviewer');
      expect(markdown).toContain('Review for completeness');
      expect(markdown).toContain('spec.md');
      expect(markdown).toContain('Focus on requirements');
      expect(markdown).toContain('Execution Trace Summary');
    });
  });
});
```

---

## 4. Acceptance Criteria

| Criterion                           | Status | Verification    |
| ----------------------------------- | ------ | --------------- |
| Create handoff with required fields | ⬜      | Creation test   |
| Support priority levels             | ⬜      | Priority test   |
| Handle expiration                   | ⬜      | Expiration test |
| Include execution trace             | ⬜      | Trace test      |
| Parse serialized handoff            | ⬜      | Parse test      |
| Version compatibility check         | ⬜      | Version test    |
| List pending handoffs by agent      | ⬜      | Listing test    |
| Generate markdown summary           | ⬜      | Markdown test   |
| 100% test coverage                  | ⬜      | Coverage report |

---

## 5. Usage Examples

### Creating a Handoff After SpecKit Generation

```typescript
import {
  AgentHandoffCoordinator
} from './domain/coordination/index.js';
import { ExecutionTrace } from './domain/coordination/index.js';

// After generating spec
const trace = new ExecutionTrace('speckit-generate');
trace.recordDecision('template', 'standard', 'Using standard spec template');
trace.recordDecision('sections', 'all', 'Including all 7 sections');
trace.recordMetric('artifacts', 7, 'files');
trace.complete(true);

// Prepare handoff to code reviewer
const handoff = AgentHandoffCoordinator.prepareHandoff({
  sourceAgent: 'speckit-generator',
  targetAgent: 'code-reviewer',
  trace,
  context: {
    sessionId: 'session-123',
    artifacts: [
      'spec.md',
      'plan.md',
      'tasks.md',
      'progress.md',
      'adr.md',
      'roadmap.md',
      'README.md',
    ],
    userRequest: 'Generate comprehensive spec for auth system',
    decisions: [
      { what: 'Scope', why: 'Focused on OAuth2 implementation' },
      { what: 'Priority', why: 'Security features marked P0' },
    ],
  },
  instructions: {
    task: 'Review the generated specification for completeness and accuracy',
    focusAreas: [
      'Requirements coverage',
      'Acceptance criteria clarity',
      'Task dependencies',
    ],
    constraints: [
      'Ensure all security requirements are addressed',
      'Verify timeline is realistic',
    ],
    avoid: [
      'Implementation suggestions (that comes later)',
    ],
  },
  priority: 'normal',
});

// Serialize for MCP response
const serialized = AgentHandoffCoordinator.toJSON(handoff);

// Or generate markdown for user visibility
const summary = AgentHandoffCoordinator.toMarkdown(handoff);
```

---

## 6. References

| Document                               | Link                                                     |
| -------------------------------------- | -------------------------------------------------------- |
| T-003: ExecutionTrace                  | [T-003-execution-trace.md](./T-003-execution-trace.md)   |
| T-005: SummaryFeedbackCoordinator      | [T-005-summary-feedback.md](./T-005-summary-feedback.md) |
| ADR-001: Strategy Pattern Architecture | [adr.md](../../adr.md#adr-001)                           |
| AGENTS.md                              | [AGENTS.md](../../../../AGENTS.md)                       |

---

*Task: T-007 | Phase: 1 | Priority: P1*
