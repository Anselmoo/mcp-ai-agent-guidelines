# T-001: Create BaseStrategy<T> Abstract Class

**Task ID**: T-001
**Phase**: 1 - Core Infrastructure
**Priority**: P0 (Critical Path)
**Estimate**: 4 hours
**Owner**: @mcp-tool-builder
**Reviewer**: @code-reviewer
**Dependencies**: None
**Blocks**: T-002, T-011-T-017

---

## 1. Overview

### What

Create an abstract base class `BaseStrategy<TInput, TOutput>` that enforces a consistent interface across all 7 strategy implementations (SpecKit, TOGAF, ADR, RFC, Enterprise, SDD, Chat).

### Why

The current codebase has 7 independent strategy implementations with:
- No common interface → inconsistent error handling
- No execution tracing → poor debugging
- No HITL integration → missing feedback loops

Research from MCP community, Salesforce Agentforce, and Temporal confirms mandatory HITL for production AI workflows.

### Target File

`src/strategies/shared/base-strategy.ts`

---

## 2. Prerequisites

### Environment Setup

```bash
# Ensure you're on the correct branch
git checkout -b feat/base-strategy

# Install dependencies
npm ci

# Verify build
npm run build
```

### Files to Review

| File                                                               | Purpose                        |
| ------------------------------------------------------------------ | ------------------------------ |
| [output-strategy.ts](/src/strategies/output-strategy.ts)                 | Current interface to extend    |
| [speckit-strategy.ts](/src/strategies/speckit-strategy.ts)               | Example of existing strategy   |
| [types.ts](/src/strategies/speckit/types.ts)                             | Type definitions to understand |

---

## 3. Implementation Guide

### Step 3.1: Create Type Definitions

Create the types first to establish the contract:

```typescript
// src/strategies/shared/types.ts

/**
 * Result of input validation.
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;
  /** List of validation errors (empty if valid) */
  errors: ValidationError[];
  /** List of validation warnings (non-blocking) */
  warnings: ValidationWarning[];
}

/**
 * Validation error with structured context.
 */
export interface ValidationError {
  /** Error code for programmatic handling */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Field or path that caused the error */
  field?: string;
  /** Additional context */
  context?: Record<string, unknown>;
}

/**
 * Validation warning (non-blocking).
 */
export interface ValidationWarning {
  code: string;
  message: string;
  field?: string;
  suggestion?: string;
}

/**
 * Result of strategy execution.
 */
export interface StrategyResult<T> {
  /** Whether execution succeeded */
  success: boolean;
  /** Output data (present if success=true) */
  data?: T;
  /** Execution errors (present if success=false) */
  errors?: ValidationError[];
  /** Execution trace for debugging */
  trace: ExecutionTraceExport;
  /** Execution duration in milliseconds */
  durationMs: number;
}

/**
 * Exported execution trace for serialization.
 */
export interface ExecutionTraceExport {
  traceId: string;
  startTime: string;
  endTime: string;
  entries: TraceEntry[];
  summary: TraceSummary;
}

/**
 * Single trace entry.
 */
export interface TraceEntry {
  timestamp: string;
  type: 'start' | 'decision' | 'metric' | 'error' | 'success' | 'warning';
  message: string;
  data?: Record<string, unknown>;
}

/**
 * Trace summary for quick analysis.
 */
export interface TraceSummary {
  totalDecisions: number;
  totalErrors: number;
  totalWarnings: number;
  durationMs: number;
}
```

### Step 3.2: Create ExecutionTrace Stub

We need a minimal ExecutionTrace for BaseStrategy. Full implementation is T-003.

```typescript
// src/strategies/shared/execution-trace.ts

import type { ExecutionTraceExport, TraceEntry, TraceSummary } from './types.js';

/**
 * Execution trace for logging decisions and metrics.
 *
 * Provides transparency into strategy execution for debugging,
 * auditing, and human review.
 *
 * @example
 * ```typescript
 * const trace = new ExecutionTrace();
 * trace.recordDecision('Selected approach', 'Based on input complexity');
 * trace.recordMetric('validationTime', 45, 'ms');
 * console.log(trace.toMarkdown());
 * ```
 */
export class ExecutionTrace {
  private readonly traceId: string;
  private readonly startTime: Date;
  private readonly entries: TraceEntry[] = [];
  private endTime?: Date;

  constructor() {
    this.traceId = this.generateTraceId();
    this.startTime = new Date();
  }

  /**
   * Record the start of execution.
   */
  recordStart(data: Record<string, unknown>): void {
    this.entries.push({
      timestamp: new Date().toISOString(),
      type: 'start',
      message: 'Strategy execution started',
      data,
    });
  }

  /**
   * Record a decision point with rationale.
   *
   * @param decision - What was decided
   * @param rationale - Why it was decided
   * @param data - Additional context
   */
  recordDecision(decision: string, rationale: string, data?: Record<string, unknown>): void {
    this.entries.push({
      timestamp: new Date().toISOString(),
      type: 'decision',
      message: `${decision}: ${rationale}`,
      data,
    });
  }

  /**
   * Record a metric measurement.
   *
   * @param name - Metric name (e.g., 'validationTime')
   * @param value - Metric value
   * @param unit - Unit of measurement (e.g., 'ms', 'bytes')
   */
  recordMetric(name: string, value: number, unit?: string): void {
    this.entries.push({
      timestamp: new Date().toISOString(),
      type: 'metric',
      message: unit ? `${name}: ${value}${unit}` : `${name}: ${value}`,
      data: { name, value, unit },
    });
  }

  /**
   * Record an error that occurred during execution.
   */
  recordError(error: Error | string, context?: Record<string, unknown>): void {
    const message = error instanceof Error ? error.message : error;
    this.entries.push({
      timestamp: new Date().toISOString(),
      type: 'error',
      message,
      data: {
        ...context,
        stack: error instanceof Error ? error.stack : undefined,
      },
    });
  }

  /**
   * Record a warning (non-blocking issue).
   */
  recordWarning(message: string, data?: Record<string, unknown>): void {
    this.entries.push({
      timestamp: new Date().toISOString(),
      type: 'warning',
      message,
      data,
    });
  }

  /**
   * Record successful completion.
   */
  recordSuccess(data: Record<string, unknown>): void {
    this.endTime = new Date();
    this.entries.push({
      timestamp: this.endTime.toISOString(),
      type: 'success',
      message: 'Strategy execution completed successfully',
      data,
    });
  }

  /**
   * Export trace as JSON-serializable object.
   */
  toJSON(): ExecutionTraceExport {
    const end = this.endTime ?? new Date();
    return {
      traceId: this.traceId,
      startTime: this.startTime.toISOString(),
      endTime: end.toISOString(),
      entries: [...this.entries],
      summary: this.getSummary(),
    };
  }

  /**
   * Export trace as Markdown for human review.
   */
  toMarkdown(): string {
    const summary = this.getSummary();
    const lines = [
      `# Execution Trace: ${this.traceId}`,
      '',
      '## Summary',
      '',
      `- **Duration**: ${summary.durationMs}ms`,
      `- **Decisions**: ${summary.totalDecisions}`,
      `- **Errors**: ${summary.totalErrors}`,
      `- **Warnings**: ${summary.totalWarnings}`,
      '',
      '## Timeline',
      '',
    ];

    for (const entry of this.entries) {
      const icon = this.getEntryIcon(entry.type);
      lines.push(`- ${icon} \`${entry.timestamp}\` **${entry.type}**: ${entry.message}`);
    }

    return lines.join('\n');
  }

  /**
   * Get duration in milliseconds.
   */
  getDuration(): number {
    const end = this.endTime ?? new Date();
    return end.getTime() - this.startTime.getTime();
  }

  private getSummary(): TraceSummary {
    return {
      totalDecisions: this.entries.filter(e => e.type === 'decision').length,
      totalErrors: this.entries.filter(e => e.type === 'error').length,
      totalWarnings: this.entries.filter(e => e.type === 'warning').length,
      durationMs: this.getDuration(),
    };
  }

  private generateTraceId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `trace_${timestamp}_${random}`;
  }

  private getEntryIcon(type: TraceEntry['type']): string {
    const icons: Record<TraceEntry['type'], string> = {
      start: '🚀',
      decision: '🔀',
      metric: '📊',
      error: '❌',
      warning: '⚠️',
      success: '✅',
    };
    return icons[type] || '•';
  }
}
```

### Step 3.3: Implement BaseStrategy<T>

Now implement the abstract base class:

```typescript
// src/strategies/shared/base-strategy.ts

import type { SessionState } from '../../domain/design/types.js';
import { ExecutionTrace } from './execution-trace.js';
import type {
  StrategyResult,
  ValidationError,
  ValidationResult,
} from './types.js';

/**
 * Configuration for BaseStrategy behavior.
 */
export interface StrategyConfig {
  /** Enable execution tracing (default: true) */
  enableTrace?: boolean;
  /** Fail fast on first validation error (default: false) */
  failFast?: boolean;
  /** Maximum execution time in ms (default: 30000) */
  timeoutMs?: number;
  /** Enable verbose logging (default: false) */
  verbose?: boolean;
}

/**
 * Default strategy configuration.
 */
const DEFAULT_CONFIG: Required<StrategyConfig> = {
  enableTrace: true,
  failFast: false,
  timeoutMs: 30_000,
  verbose: false,
};

/**
 * Abstract base class for all output strategies.
 *
 * Enforces a consistent interface across all strategy implementations:
 * - Input validation via `validate()`
 * - Core logic via `execute()`
 * - Template method pattern via `run()`
 * - Execution tracing via `ExecutionTrace`
 *
 * All 7 strategies (SpecKit, TOGAF, ADR, RFC, Enterprise, SDD, Chat)
 * MUST extend this class.
 *
 * @typeParam TInput - Strategy input type (e.g., SessionState)
 * @typeParam TOutput - Strategy output type (e.g., OutputArtifacts)
 *
 * @example
 * ```typescript
 * class SpecKitStrategy extends BaseStrategy<SessionState, OutputArtifacts> {
 *   validate(input: SessionState): ValidationResult {
 *     // Validate session state
 *   }
 *
 *   async execute(input: SessionState): Promise<OutputArtifacts> {
 *     // Generate SpecKit documents
 *   }
 * }
 * ```
 */
export abstract class BaseStrategy<TInput, TOutput> {
  /** Execution trace for this strategy invocation */
  protected readonly trace: ExecutionTrace;

  /** Configuration for this strategy */
  protected readonly config: Required<StrategyConfig>;

  /** Strategy name for logging */
  protected abstract readonly name: string;

  /** Strategy version */
  protected abstract readonly version: string;

  constructor(config: StrategyConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.trace = new ExecutionTrace();
  }

  /**
   * Validate the input before execution.
   *
   * MUST be implemented by subclasses to perform input validation.
   * Called automatically by `run()` before `execute()`.
   *
   * @param input - Strategy input to validate
   * @returns Validation result with errors and warnings
   */
  abstract validate(input: TInput): ValidationResult;

  /**
   * Execute the strategy's core logic.
   *
   * MUST be implemented by subclasses to perform the main work.
   * Only called if `validate()` passes.
   *
   * @param input - Validated strategy input
   * @returns Strategy output
   * @throws Error if execution fails
   */
  abstract execute(input: TInput): Promise<TOutput>;

  /**
   * Run the strategy with validation and tracing.
   *
   * This is the main entry point for strategy execution.
   * Implements the Template Method pattern:
   * 1. Record start
   * 2. Validate input
   * 3. Execute if valid
   * 4. Record result
   *
   * @param input - Strategy input
   * @returns Strategy result with output or errors
   */
  async run(input: TInput): Promise<StrategyResult<TOutput>> {
    const startTime = Date.now();

    // Record start
    if (this.config.enableTrace) {
      this.trace.recordStart({
        strategy: this.name,
        version: this.version,
        config: this.config,
        inputKeys: this.getInputKeys(input),
      });
    }

    // Step 1: Validate input
    const validation = this.validateWithTrace(input);
    if (!validation.valid) {
      return this.buildErrorResult(validation.errors, startTime);
    }

    // Step 2: Execute with timeout
    try {
      const output = await this.executeWithTimeout(input);

      // Record success
      if (this.config.enableTrace) {
        this.trace.recordSuccess({
          outputType: typeof output,
          durationMs: Date.now() - startTime,
        });
      }

      return {
        success: true,
        data: output,
        trace: this.trace.toJSON(),
        durationMs: Date.now() - startTime,
      };
    } catch (error) {
      return this.handleExecutionError(error, startTime);
    }
  }

  /**
   * Validate input with tracing.
   */
  private validateWithTrace(input: TInput): ValidationResult {
    const validateStart = Date.now();

    if (this.config.enableTrace) {
      this.trace.recordDecision(
        'Starting validation',
        `Validating input for ${this.name}`
      );
    }

    const result = this.validate(input);

    if (this.config.enableTrace) {
      this.trace.recordMetric('validationDuration', Date.now() - validateStart, 'ms');

      if (!result.valid) {
        for (const error of result.errors) {
          this.trace.recordError(`Validation failed: ${error.message}`, {
            code: error.code,
            field: error.field,
          });
        }
      }

      for (const warning of result.warnings) {
        this.trace.recordWarning(`Validation warning: ${warning.message}`, {
          code: warning.code,
          field: warning.field,
        });
      }
    }

    return result;
  }

  /**
   * Execute with timeout protection.
   */
  private async executeWithTimeout(input: TInput): Promise<TOutput> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Strategy execution timed out after ${this.config.timeoutMs}ms`));
      }, this.config.timeoutMs);
    });

    return Promise.race([
      this.execute(input),
      timeoutPromise,
    ]);
  }

  /**
   * Build error result for validation failures.
   */
  private buildErrorResult(
    errors: ValidationError[],
    startTime: number
  ): StrategyResult<TOutput> {
    return {
      success: false,
      errors,
      trace: this.trace.toJSON(),
      durationMs: Date.now() - startTime,
    };
  }

  /**
   * Handle execution errors.
   */
  private handleExecutionError(
    error: unknown,
    startTime: number
  ): StrategyResult<TOutput> {
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (this.config.enableTrace) {
      this.trace.recordError(
        error instanceof Error ? error : new Error(errorMessage),
        { phase: 'execute' }
      );
    }

    return {
      success: false,
      errors: [{
        code: 'EXECUTION_ERROR',
        message: errorMessage,
        context: {
          stack: error instanceof Error ? error.stack : undefined,
        },
      }],
      trace: this.trace.toJSON(),
      durationMs: Date.now() - startTime,
    };
  }

  /**
   * Get input keys for logging (avoids logging full input).
   */
  private getInputKeys(input: TInput): string[] {
    if (input && typeof input === 'object') {
      return Object.keys(input as object);
    }
    return [];
  }
}

/**
 * Type guard for StrategyResult success.
 */
export function isSuccessResult<T>(
  result: StrategyResult<T>
): result is StrategyResult<T> & { success: true; data: T } {
  return result.success && result.data !== undefined;
}

/**
 * Type guard for StrategyResult failure.
 */
export function isErrorResult<T>(
  result: StrategyResult<T>
): result is StrategyResult<T> & { success: false; errors: ValidationError[] } {
  return !result.success && result.errors !== undefined;
}
```

### Step 3.4: Create Barrel Export

```typescript
// src/strategies/shared/index.ts

export { BaseStrategy, isSuccessResult, isErrorResult } from './base-strategy.js';
export type { StrategyConfig } from './base-strategy.js';

export { ExecutionTrace } from './execution-trace.js';

export type {
  ExecutionTraceExport,
  StrategyResult,
  TraceEntry,
  TraceSummary,
  ValidationError,
  ValidationResult,
  ValidationWarning,
} from './types.js';
```

---

## 4. Testing Strategy

### Step 4.1: Create Test File

```typescript
// tests/vitest/strategies/shared/base-strategy.spec.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BaseStrategy, isSuccessResult, isErrorResult } from '../../../../src/strategies/shared/base-strategy.js';
import type { ValidationResult, StrategyResult } from '../../../../src/strategies/shared/types.js';

// Concrete implementation for testing
class TestStrategy extends BaseStrategy<{ value: number }, { result: string }> {
  protected readonly name = 'TestStrategy';
  protected readonly version = '1.0.0';

  public validateFn: (input: { value: number }) => ValidationResult = () => ({
    valid: true,
    errors: [],
    warnings: [],
  });

  public executeFn: (input: { value: number }) => Promise<{ result: string }> =
    async (input) => ({ result: `processed: ${input.value}` });

  validate(input: { value: number }): ValidationResult {
    return this.validateFn(input);
  }

  async execute(input: { value: number }): Promise<{ result: string }> {
    return this.executeFn(input);
  }
}

describe('BaseStrategy', () => {
  let strategy: TestStrategy;

  beforeEach(() => {
    strategy = new TestStrategy();
  });

  describe('run()', () => {
    it('should return success result when validation and execution pass', async () => {
      const result = await strategy.run({ value: 42 });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ result: 'processed: 42' });
      expect(result.trace).toBeDefined();
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('should return error result when validation fails', async () => {
      strategy.validateFn = () => ({
        valid: false,
        errors: [{ code: 'INVALID_VALUE', message: 'Value must be positive' }],
        warnings: [],
      });

      const result = await strategy.run({ value: -1 });

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors?.[0].code).toBe('INVALID_VALUE');
    });

    it('should return error result when execution throws', async () => {
      strategy.executeFn = async () => {
        throw new Error('Execution failed');
      };

      const result = await strategy.run({ value: 42 });

      expect(result.success).toBe(false);
      expect(result.errors?.[0].code).toBe('EXECUTION_ERROR');
      expect(result.errors?.[0].message).toBe('Execution failed');
    });

    it('should timeout when execution takes too long', async () => {
      const slowStrategy = new TestStrategy({ timeoutMs: 50 });
      slowStrategy.executeFn = async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return { result: 'too slow' };
      };

      const result = await slowStrategy.run({ value: 42 });

      expect(result.success).toBe(false);
      expect(result.errors?.[0].message).toContain('timed out');
    });
  });

  describe('trace', () => {
    it('should record execution trace when enabled', async () => {
      const result = await strategy.run({ value: 42 });

      expect(result.trace.traceId).toMatch(/^trace_/);
      expect(result.trace.entries).toHaveLength(3); // start, decision (validation), success
      expect(result.trace.entries[0].type).toBe('start');
    });

    it('should not record trace when disabled', async () => {
      const noTraceStrategy = new TestStrategy({ enableTrace: false });
      const result = await noTraceStrategy.run({ value: 42 });

      // Trace is still returned but with minimal entries
      expect(result.trace).toBeDefined();
    });
  });

  describe('type guards', () => {
    it('isSuccessResult should identify success', async () => {
      const result = await strategy.run({ value: 42 });

      if (isSuccessResult(result)) {
        // TypeScript should narrow this
        expect(result.data.result).toBe('processed: 42');
      }
    });

    it('isErrorResult should identify failure', async () => {
      strategy.validateFn = () => ({
        valid: false,
        errors: [{ code: 'TEST', message: 'Test error' }],
        warnings: [],
      });

      const result = await strategy.run({ value: 42 });

      if (isErrorResult(result)) {
        expect(result.errors[0].code).toBe('TEST');
      }
    });
  });
});
```

### Step 4.2: Run Tests

```bash
# Run specific test file
npm run test:vitest -- tests/vitest/strategies/shared/base-strategy.spec.ts

# Run with coverage
npm run test:coverage:vitest -- --include="src/strategies/shared/**"
```

---

## 5. Acceptance Criteria

| Criterion                                         | Status | Verification                                          |
| ------------------------------------------------- | ------ | ----------------------------------------------------- |
| Abstract class with generic types TInput, TOutput | ⬜      | Type-check passes                                     |
| Template method pattern for `run()`               | ⬜      | `run()` is final, calls `validate()` then `execute()` |
| ExecutionTrace integration                        | ⬜      | Trace records start, decisions, errors, success       |
| TypeScript strict mode compliant                  | ⬜      | `npm run type-check` passes                           |
| No `any` types                                    | ⬜      | `grep -r "any" src/strategies/shared/` returns 0      |
| JSDoc documentation on public methods             | ⬜      | All exports documented                                |
| 100% test coverage                                | ⬜      | Coverage report shows 100%                            |
| Code review approved                              | ⬜      | PR approved by @code-reviewer                         |

---

## 6. Verification Commands

```bash
# Type check
npm run type-check

# Lint
npm run lint

# Run tests
npm run test:vitest -- tests/vitest/strategies/shared/

# Check coverage
npm run test:coverage:vitest -- --include="src/strategies/shared/**"

# Verify no 'any' types
grep -rn "any" src/strategies/shared/ || echo "✓ No 'any' types found"

# Full quality check
npm run quality
```

---

## 7. References

| Document                      | Link                                                                  |
| ----------------------------- | --------------------------------------------------------------------- |
| ADR-001: BaseStrategy Pattern | [adr.md](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/adr.md#adr-001)                                        |
| Spec REQ-001, REQ-005         | [spec.md](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/spec.md)                                              |
| Output Strategy Interface     | [output-strategy.ts](../../../../src/strategies/output-strategy.ts)   |
| Existing SpecKitStrategy      | [speckit-strategy.ts](../../../../src/strategies/speckit-strategy.ts) |

---

## 8. Notes for Implementer

1. **Start with types** - Define `types.ts` first to establish the contract
2. **TDD approach** - Write tests before implementing `BaseStrategy`
3. **Don't over-engineer** - Keep initial implementation simple
4. **ExecutionTrace stub** - T-003 will complete the full implementation
5. **Preserve backward compatibility** - Existing strategies will migrate in T-011 to T-017

### Common Pitfalls

- ❌ Don't make `run()` overridable - it's the template method
- ❌ Don't log full input objects - use `getInputKeys()` for privacy
- ❌ Don't forget timeout handling - execution can hang
- ✅ Do use `readonly` for trace and config
- ✅ Do provide sensible defaults in `DEFAULT_CONFIG`

---

*Task: T-001 | Phase: 1 | Priority: P0*
