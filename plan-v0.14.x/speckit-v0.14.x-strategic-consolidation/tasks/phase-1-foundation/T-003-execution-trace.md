# T-003: Implement Execution Trace

**Task ID**: T-003
**Phase**: 1 - Foundation
**Priority**: P0 (Critical Path)
**Estimate**: 4 hours
**Owner**: @mcp-tool-builder
**Reviewer**: @code-reviewer
**Dependencies**: None
**Blocks**: T-001 (BaseStrategy), T-011 (SpecKit Migration)

---

## 1. Overview

### What

Implement `ExecutionTrace` - a lightweight, immutable decision logging system that records:
- Strategic decisions made during execution
- Metrics (timing, counts, sizes)
- Errors with context
- Markdown export for debugging

### Why

Current strategies have no visibility into:
- Why certain decisions were made
- Where time is spent
- What went wrong and why
- How to debug production issues

### Design Principles

1. **Immutable**: Each record creates a new entry, no mutations
2. **Lightweight**: Minimal overhead (~1KB per decision)
3. **Exportable**: JSON for machines, Markdown for humans
4. **Typed**: Full TypeScript support with discriminated unions

---

## 2. Implementation Guide

### Step 2.1: Define Trace Types

```typescript
// src/domain/base-strategy/types.ts

/**
 * A single decision recorded during execution.
 *
 * Decisions capture the "why" of execution - what choice was made,
 * why it was made, and what context influenced it.
 */
export interface Decision {
  /** Unique identifier for this decision */
  readonly id: string;

  /** When the decision was made */
  readonly timestamp: Date;

  /** Decision category for filtering */
  readonly category: string;

  /** Human-readable description */
  readonly description: string;

  /** Additional context (must be JSON-serializable) */
  readonly context: Record<string, unknown>;
}

/**
 * An error recorded during execution.
 *
 * Errors capture failures with full context for debugging.
 */
export interface TracedError {
  /** When the error occurred */
  readonly timestamp: Date;

  /** Error category */
  readonly category: string;

  /** Error message */
  readonly message: string;

  /** Original error stack trace */
  readonly stack?: string;

  /** Context at time of error */
  readonly context: Record<string, unknown>;
}

/**
 * Execution trace - immutable log of strategy execution.
 *
 * Contains all decisions, metrics, and errors from a single execution.
 */
export interface ExecutionTraceData {
  /** Unique execution ID */
  readonly executionId: string;

  /** Strategy name */
  readonly strategyName: string;

  /** Strategy version */
  readonly strategyVersion: string;

  /** When execution started */
  readonly startedAt: Date;

  /** When execution completed (if finished) */
  readonly completedAt: Date | null;

  /** All decisions made */
  readonly decisions: readonly Decision[];

  /** All metrics recorded */
  readonly metrics: Readonly<Record<string, number>>;

  /** All errors encountered */
  readonly errors: readonly TracedError[];
}
```

### Step 2.2: Implement ExecutionTrace Class

```typescript
// src/domain/base-strategy/execution-trace.ts

import { v4 as uuidv4 } from 'uuid';
import type { Decision, TracedError, ExecutionTraceData } from './types.js';

/**
 * Execution Trace - records decisions, metrics, and errors during strategy execution.
 *
 * The trace is mutable during execution but provides immutable snapshots for export.
 *
 * @example
 * ```typescript
 * const trace = new ExecutionTrace('my-strategy', '1.0.0');
 *
 * trace.recordDecision(
 *   'select-template',
 *   'Selected enterprise template based on input size',
 *   { inputSize: 1500, threshold: 1000 }
 * );
 *
 * trace.recordMetric('generation_time_ms', 250);
 *
 * try {
 *   // operation
 * } catch (error) {
 *   trace.recordError(error, { operation: 'template-render' });
 * }
 *
 * // Export for debugging
 * console.log(trace.toMarkdown());
 * ```
 */
export class ExecutionTrace {
  private readonly executionId: string;
  private readonly startedAt: Date;
  private completedAt: Date | null = null;

  private readonly _decisions: Decision[] = [];
  private readonly _metrics: Record<string, number> = {};
  private readonly _errors: TracedError[] = [];

  constructor(
    private readonly strategyName: string,
    private readonly strategyVersion: string
  ) {
    this.executionId = uuidv4();
    this.startedAt = new Date();
  }

  // ============================================
  // Recording Methods
  // ============================================

  /**
   * Record a decision made during execution.
   *
   * @param category - Decision category (e.g., 'validation', 'generation', 'selection')
   * @param description - Human-readable description of the decision
   * @param context - Additional context (must be JSON-serializable)
   * @returns The recorded decision
   */
  recordDecision(
    category: string,
    description: string,
    context: Record<string, unknown> = {}
  ): Decision {
    const decision: Decision = {
      id: uuidv4(),
      timestamp: new Date(),
      category,
      description,
      context: this.sanitizeContext(context),
    };

    this._decisions.push(decision);
    return decision;
  }

  /**
   * Record a numeric metric.
   *
   * @param name - Metric name (e.g., 'generation_time_ms', 'token_count')
   * @param value - Metric value
   */
  recordMetric(name: string, value: number): void {
    this._metrics[name] = value;
  }

  /**
   * Increment a counter metric.
   *
   * @param name - Counter name
   * @param increment - Amount to increment (default: 1)
   */
  incrementMetric(name: string, increment = 1): void {
    this._metrics[name] = (this._metrics[name] ?? 0) + increment;
  }

  /**
   * Record an error with context.
   *
   * @param error - The error that occurred
   * @param context - Additional context at time of error
   */
  recordError(
    error: Error,
    context: Record<string, unknown> = {}
  ): void {
    this._errors.push({
      timestamp: new Date(),
      category: error.name || 'Error',
      message: error.message,
      stack: error.stack,
      context: this.sanitizeContext(context),
    });
  }

  /**
   * Mark the trace as complete.
   */
  complete(): void {
    this.completedAt = new Date();
    this.recordMetric('total_duration_ms', this.durationMs);
  }

  // ============================================
  // Query Methods
  // ============================================

  /**
   * Get all recorded decisions.
   */
  get decisions(): readonly Decision[] {
    return [...this._decisions];
  }

  /**
   * Get all recorded metrics.
   */
  get metrics(): Readonly<Record<string, number>> {
    return { ...this._metrics };
  }

  /**
   * Get all recorded errors.
   */
  get errors(): readonly TracedError[] {
    return [...this._errors];
  }

  /**
   * Get current duration in milliseconds.
   */
  get durationMs(): number {
    const endTime = this.completedAt ?? new Date();
    return endTime.getTime() - this.startedAt.getTime();
  }

  /**
   * Check if any errors were recorded.
   */
  get hasErrors(): boolean {
    return this._errors.length > 0;
  }

  /**
   * Get decisions filtered by category.
   */
  getDecisionsByCategory(category: string): readonly Decision[] {
    return this._decisions.filter(d => d.category === category);
  }

  // ============================================
  // Export Methods
  // ============================================

  /**
   * Export trace as immutable data object.
   */
  toData(): ExecutionTraceData {
    return {
      executionId: this.executionId,
      strategyName: this.strategyName,
      strategyVersion: this.strategyVersion,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
      decisions: [...this._decisions],
      metrics: { ...this._metrics },
      errors: [...this._errors],
    };
  }

  /**
   * Export trace as JSON string.
   */
  toJSON(): string {
    return JSON.stringify(this.toData(), null, 2);
  }

  /**
   * Export trace as Markdown for human-readable debugging.
   */
  toMarkdown(): string {
    const lines: string[] = [];

    // Header
    lines.push(`# Execution Trace: ${this.strategyName} v${this.strategyVersion}`);
    lines.push('');
    lines.push(`**Execution ID**: \`${this.executionId}\``);
    lines.push(`**Started**: ${this.startedAt.toISOString()}`);
    if (this.completedAt) {
      lines.push(`**Completed**: ${this.completedAt.toISOString()}`);
    }
    lines.push(`**Duration**: ${this.durationMs}ms`);
    lines.push('');

    // Metrics
    if (Object.keys(this._metrics).length > 0) {
      lines.push('## Metrics');
      lines.push('');
      lines.push('| Metric | Value |');
      lines.push('|--------|-------|');
      for (const [name, value] of Object.entries(this._metrics)) {
        lines.push(`| ${name} | ${value} |`);
      }
      lines.push('');
    }

    // Decisions
    if (this._decisions.length > 0) {
      lines.push('## Decisions');
      lines.push('');

      for (const decision of this._decisions) {
        lines.push(`### ${decision.category}`);
        lines.push('');
        lines.push(`**Time**: ${decision.timestamp.toISOString()}`);
        lines.push('');
        lines.push(decision.description);
        lines.push('');

        if (Object.keys(decision.context).length > 0) {
          lines.push('**Context**:');
          lines.push('```json');
          lines.push(JSON.stringify(decision.context, null, 2));
          lines.push('```');
          lines.push('');
        }
      }
    }

    // Errors
    if (this._errors.length > 0) {
      lines.push('## Errors');
      lines.push('');

      for (const error of this._errors) {
        lines.push(`### ${error.category}`);
        lines.push('');
        lines.push(`**Time**: ${error.timestamp.toISOString()}`);
        lines.push(`**Message**: ${error.message}`);
        lines.push('');

        if (error.stack) {
          lines.push('**Stack**:');
          lines.push('```');
          lines.push(error.stack);
          lines.push('```');
          lines.push('');
        }

        if (Object.keys(error.context).length > 0) {
          lines.push('**Context**:');
          lines.push('```json');
          lines.push(JSON.stringify(error.context, null, 2));
          lines.push('```');
          lines.push('');
        }
      }
    }

    return lines.join('\n');
  }

  // ============================================
  // Private Helpers
  // ============================================

  /**
   * Sanitize context to ensure it's JSON-serializable.
   */
  private sanitizeContext(context: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(context)) {
      try {
        // Test if value is serializable
        JSON.stringify(value);
        result[key] = value;
      } catch {
        // Convert non-serializable values to strings
        result[key] = String(value);
      }
    }

    return result;
  }
}
```

### Step 2.3: Create Factory and Utilities

```typescript
// src/domain/base-strategy/trace-utils.ts

import { ExecutionTrace } from './execution-trace.js';
import type { ExecutionTraceData } from './types.js';

/**
 * Create a new execution trace for a strategy.
 *
 * @param strategyName - Name of the strategy
 * @param strategyVersion - Version of the strategy
 * @returns New ExecutionTrace instance
 */
export function createTrace(
  strategyName: string,
  strategyVersion: string
): ExecutionTrace {
  return new ExecutionTrace(strategyName, strategyVersion);
}

/**
 * Merge multiple traces into a summary.
 *
 * Useful for aggregating traces from sub-strategies or parallel execution.
 */
export function mergeTraces(traces: ExecutionTraceData[]): {
  totalDuration: number;
  totalDecisions: number;
  totalErrors: number;
  metrics: Record<string, number>;
} {
  let totalDuration = 0;
  let totalDecisions = 0;
  let totalErrors = 0;
  const metrics: Record<string, number> = {};

  for (const trace of traces) {
    totalDecisions += trace.decisions.length;
    totalErrors += trace.errors.length;

    if (trace.completedAt && trace.startedAt) {
      totalDuration += trace.completedAt.getTime() - trace.startedAt.getTime();
    }

    for (const [key, value] of Object.entries(trace.metrics)) {
      metrics[key] = (metrics[key] ?? 0) + value;
    }
  }

  return { totalDuration, totalDecisions, totalErrors, metrics };
}

/**
 * Create a timing helper for measuring durations.
 *
 * @param trace - Trace to record timing to
 * @param metricName - Name of the timing metric
 * @returns Function to call when operation completes
 *
 * @example
 * ```typescript
 * const endTiming = startTiming(trace, 'generation_time_ms');
 * await generateDocument();
 * endTiming(); // Records duration to trace
 * ```
 */
export function startTiming(
  trace: ExecutionTrace,
  metricName: string
): () => number {
  const startTime = Date.now();

  return () => {
    const duration = Date.now() - startTime;
    trace.recordMetric(metricName, duration);
    return duration;
  };
}

/**
 * Wrap an async operation with automatic error tracing.
 *
 * @param trace - Trace to record to
 * @param operation - Async operation to wrap
 * @param context - Context to include if error occurs
 *
 * @example
 * ```typescript
 * const result = await withErrorTracing(
 *   trace,
 *   () => fetchData(url),
 *   { url, operation: 'fetch-data' }
 * );
 * ```
 */
export async function withErrorTracing<T>(
  trace: ExecutionTrace,
  operation: () => Promise<T>,
  context: Record<string, unknown> = {}
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    trace.recordError(
      error instanceof Error ? error : new Error(String(error)),
      context
    );
    throw error;
  }
}
```

---

## 3. Test Coverage

```typescript
// tests/vitest/domain/base-strategy/execution-trace.spec.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExecutionTrace } from '../../../../src/domain/base-strategy/execution-trace.js';
import { startTiming, withErrorTracing, mergeTraces } from '../../../../src/domain/base-strategy/trace-utils.js';

describe('ExecutionTrace', () => {
  let trace: ExecutionTrace;

  beforeEach(() => {
    trace = new ExecutionTrace('test-strategy', '1.0.0');
  });

  describe('recordDecision', () => {
    it('should record a decision with all fields', () => {
      const decision = trace.recordDecision(
        'validation',
        'Input passed schema validation',
        { inputSize: 100 }
      );

      expect(decision.id).toBeDefined();
      expect(decision.category).toBe('validation');
      expect(decision.description).toBe('Input passed schema validation');
      expect(decision.context).toEqual({ inputSize: 100 });
      expect(decision.timestamp).toBeInstanceOf(Date);
    });

    it('should accumulate multiple decisions', () => {
      trace.recordDecision('step1', 'First step');
      trace.recordDecision('step2', 'Second step');
      trace.recordDecision('step3', 'Third step');

      expect(trace.decisions).toHaveLength(3);
    });

    it('should sanitize non-serializable context', () => {
      const decision = trace.recordDecision('test', 'Test', {
        fn: () => {}, // Function - not serializable
        circular: {}, // Will add circular reference
      });

      // Should convert function to string representation
      expect(typeof decision.context.fn).toBe('string');
    });
  });

  describe('recordMetric', () => {
    it('should record a metric', () => {
      trace.recordMetric('duration_ms', 150);

      expect(trace.metrics.duration_ms).toBe(150);
    });

    it('should overwrite existing metric', () => {
      trace.recordMetric('count', 10);
      trace.recordMetric('count', 20);

      expect(trace.metrics.count).toBe(20);
    });
  });

  describe('incrementMetric', () => {
    it('should increment from zero', () => {
      trace.incrementMetric('errors');

      expect(trace.metrics.errors).toBe(1);
    });

    it('should increment existing value', () => {
      trace.recordMetric('count', 5);
      trace.incrementMetric('count', 3);

      expect(trace.metrics.count).toBe(8);
    });
  });

  describe('recordError', () => {
    it('should record an error with context', () => {
      const error = new Error('Test error');
      trace.recordError(error, { operation: 'test' });

      expect(trace.errors).toHaveLength(1);
      expect(trace.errors[0].message).toBe('Test error');
      expect(trace.errors[0].context).toEqual({ operation: 'test' });
      expect(trace.hasErrors).toBe(true);
    });

    it('should capture stack trace', () => {
      const error = new Error('Stack test');
      trace.recordError(error);

      expect(trace.errors[0].stack).toContain('Stack test');
    });
  });

  describe('complete', () => {
    it('should set completedAt', () => {
      expect(trace.toData().completedAt).toBeNull();

      trace.complete();

      expect(trace.toData().completedAt).toBeInstanceOf(Date);
    });

    it('should record total duration metric', () => {
      trace.complete();

      expect(trace.metrics.total_duration_ms).toBeDefined();
      expect(trace.metrics.total_duration_ms).toBeGreaterThanOrEqual(0);
    });
  });

  describe('durationMs', () => {
    it('should calculate duration', async () => {
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(trace.durationMs).toBeGreaterThanOrEqual(50);
    });
  });

  describe('toJSON', () => {
    it('should serialize to valid JSON', () => {
      trace.recordDecision('test', 'Test decision');
      trace.recordMetric('count', 42);

      const json = trace.toJSON();
      const parsed = JSON.parse(json);

      expect(parsed.strategyName).toBe('test-strategy');
      expect(parsed.decisions).toHaveLength(1);
      expect(parsed.metrics.count).toBe(42);
    });
  });

  describe('toMarkdown', () => {
    it('should generate readable markdown', () => {
      trace.recordDecision('validation', 'Validated input');
      trace.recordMetric('duration_ms', 100);
      trace.recordError(new Error('Test error'));
      trace.complete();

      const md = trace.toMarkdown();

      expect(md).toContain('# Execution Trace: test-strategy');
      expect(md).toContain('## Metrics');
      expect(md).toContain('## Decisions');
      expect(md).toContain('## Errors');
      expect(md).toContain('validation');
      expect(md).toContain('Test error');
    });
  });

  describe('getDecisionsByCategory', () => {
    it('should filter decisions by category', () => {
      trace.recordDecision('validation', 'Step 1');
      trace.recordDecision('generation', 'Step 2');
      trace.recordDecision('validation', 'Step 3');

      const validationDecisions = trace.getDecisionsByCategory('validation');

      expect(validationDecisions).toHaveLength(2);
    });
  });
});

describe('trace-utils', () => {
  describe('startTiming', () => {
    it('should record timing metric', async () => {
      const trace = new ExecutionTrace('test', '1.0.0');

      const endTiming = startTiming(trace, 'operation_ms');
      await new Promise(resolve => setTimeout(resolve, 50));
      const duration = endTiming();

      expect(duration).toBeGreaterThanOrEqual(50);
      expect(trace.metrics.operation_ms).toBeGreaterThanOrEqual(50);
    });
  });

  describe('withErrorTracing', () => {
    it('should return result on success', async () => {
      const trace = new ExecutionTrace('test', '1.0.0');

      const result = await withErrorTracing(
        trace,
        async () => 'success',
        { operation: 'test' }
      );

      expect(result).toBe('success');
      expect(trace.hasErrors).toBe(false);
    });

    it('should record error and rethrow on failure', async () => {
      const trace = new ExecutionTrace('test', '1.0.0');

      await expect(
        withErrorTracing(
          trace,
          async () => { throw new Error('fail'); },
          { operation: 'test' }
        )
      ).rejects.toThrow('fail');

      expect(trace.hasErrors).toBe(true);
      expect(trace.errors[0].context).toEqual({ operation: 'test' });
    });
  });

  describe('mergeTraces', () => {
    it('should aggregate trace data', () => {
      const trace1 = new ExecutionTrace('strategy1', '1.0.0');
      trace1.recordDecision('step', 'Step 1');
      trace1.recordMetric('count', 10);
      trace1.complete();

      const trace2 = new ExecutionTrace('strategy2', '1.0.0');
      trace2.recordDecision('step', 'Step 2');
      trace2.recordDecision('step', 'Step 3');
      trace2.recordMetric('count', 5);
      trace2.recordError(new Error('Error'));
      trace2.complete();

      const summary = mergeTraces([trace1.toData(), trace2.toData()]);

      expect(summary.totalDecisions).toBe(3);
      expect(summary.totalErrors).toBe(1);
      expect(summary.metrics.count).toBe(15);
    });
  });
});
```

---

## 4. Acceptance Criteria

| Criterion                                       | Status | Verification          |
| ----------------------------------------------- | ------ | --------------------- |
| Decision recording with id, timestamp, category | ⬜      | Unit tests pass       |
| Metric recording and incrementing               | ⬜      | Unit tests pass       |
| Error recording with stack trace                | ⬜      | Unit tests pass       |
| Context sanitization for JSON serialization     | ⬜      | Circular ref test     |
| toJSON() produces valid JSON                    | ⬜      | Parse test passes     |
| toMarkdown() produces readable output           | ⬜      | Contains all sections |
| startTiming utility works                       | ⬜      | Timing test passes    |
| withErrorTracing captures errors                | ⬜      | Error test passes     |
| 100% test coverage                              | ⬜      | Coverage report       |

---

## 5. References

| Document                      | Link                                                         |
| ----------------------------- | ------------------------------------------------------------ |
| T-001: BaseStrategy           | [T-001-base-strategy.md](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/tasks/phase-1-foundation/T-001-base-strategy.md)           |
| ADR-001: BaseStrategy Pattern | [adr.md](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/adr.md#adr-001)                               |
| uuid package                  | [npmjs.com/package/uuid](https://www.npmjs.com/package/uuid) |

---

*Task: T-003 | Phase: 1 | Priority: P0*
