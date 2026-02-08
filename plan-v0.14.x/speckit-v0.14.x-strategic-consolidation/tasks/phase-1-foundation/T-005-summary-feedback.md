# T-005: Implement SummaryFeedbackCoordinator

**Task ID**: T-005
**Phase**: 1 - Foundation
**Priority**: P1
**Estimate**: 4 hours
**Owner**: @mcp-tool-builder
**Reviewer**: @architecture-advisor
**Dependencies**: T-003 (ExecutionTrace)
**Blocks**: T-037 (FrameworkRouter)

---

## 1. Overview

### What

Create `SummaryFeedbackCoordinator` - a component that:
- Collects execution summaries from multiple strategies
- Generates user-facing feedback (progress, warnings, suggestions)
- Provides structured output for MCP tool responses
- Enables "summary mode" for large outputs

### Why

Current MCP tools return raw output without:
- Progress indicators during long operations
- Aggregated warnings across sub-operations
- Token usage estimates
- Suggestions for next steps

### Target API

```typescript
const coordinator = new SummaryFeedbackCoordinator();

// Collect from multiple traces
coordinator.collect(specKitTrace);
coordinator.collect(diagramTrace);
coordinator.collect(validationTrace);

// Generate summary
const summary = coordinator.summarize({
maxLength: 500,
includeMetrics: true,
includeSuggestions: true,
});

// Output
// {
//   status: 'completed',
//   duration: '2.3s',
//   operations: 3,
//   warnings: ['Constitution validation skipped'],
//   suggestions: ['Consider adding acceptance criteria'],
//   metrics: { totalTokens: 12500, documentsGenerated: 7 }
// }
```

---

## 2. Implementation Guide

### Step 2.1: Define Types

```typescript
// src/domain/coordinators/types.ts

import type { ExecutionTraceData } from '../base-strategy/types.js';

/**
 * Status of an operation or the overall summary.
 */
export type OperationStatus =
| 'pending'
| 'in-progress'
| 'completed'
| 'failed'
| 'partial';

/**
 * Severity level for feedback items.
 */
export type FeedbackSeverity = 'info' | 'warning' | 'error';

/**
 * A single feedback item to show the user.
 */
export interface FeedbackItem {
severity: FeedbackSeverity;
message: string;
source?: string;
timestamp: Date;
}

/**
 * A suggestion for next steps.
 */
export interface Suggestion {
action: string;
reason: string;
priority: 'high' | 'medium' | 'low';
}

/**
 * Options for generating summaries.
 */
export interface SummaryOptions {
/** Maximum character length for text summary */
maxLength?: number;

/** Include numeric metrics */
includeMetrics?: boolean;

/** Include suggestions for next steps */
includeSuggestions?: boolean;

/** Include list of operations */
includeOperations?: boolean;

/** Verbosity level */
verbosity?: 'minimal' | 'normal' | 'verbose';
}

/**
 * Generated summary result.
 */
export interface SummaryResult {
/** Overall status */
status: OperationStatus;

/** Human-readable duration */
duration: string;

/** Number of operations performed */
operationCount: number;

/** List of operation names (if includeOperations) */
operations?: string[];

/** Warning messages */
warnings: string[];

/** Error messages */
errors: string[];

/** Suggestions for next steps */
suggestions?: Suggestion[];

/** Aggregated metrics */
metrics?: Record<string, number>;

/** Text summary for display */
text: string;

/** Markdown summary for rich display */
markdown: string;
}

/**
 * Collected operation info from a trace.
 */
export interface CollectedOperation {
name: string;
version: string;
status: OperationStatus;
duration: number;
trace: ExecutionTraceData;
}
```

### Step 2.2: Implement SummaryFeedbackCoordinator

```typescript
// src/domain/coordinators/summary-feedback-coordinator.ts

import type { ExecutionTraceData } from '../base-strategy/types.js';
import type {
CollectedOperation,
FeedbackItem,
OperationStatus,
Suggestion,
SummaryOptions,
SummaryResult,
} from './types.js';

/**
 * SummaryFeedbackCoordinator - aggregates execution traces and generates user feedback.
 *
 * This coordinator:
 * - Collects traces from multiple strategy executions
 * - Aggregates metrics, warnings, and errors
 * - Generates human-readable summaries
 * - Provides suggestions for next steps
 *
 * @example
 * ```typescript
 * const coordinator = new SummaryFeedbackCoordinator();
 *
 * // Collect traces as operations complete
 * coordinator.collect(specKitResult.trace);
 * coordinator.collect(validationResult.trace);
 *
 * // Generate summary for user
 * const summary = coordinator.summarize({
 *   includeMetrics: true,
 *   includeSuggestions: true,
 * });
 *
 * console.log(summary.text);
 * // "Completed 2 operations in 1.5s. Generated 7 documents (12,500 tokens).
 * //  1 warning: Constitution validation was skipped."
 * ```
 */
export class SummaryFeedbackCoordinator {
private operations: CollectedOperation[] = [];
private feedback: FeedbackItem[] = [];
private customSuggestions: Suggestion[] = [];
private startTime: Date;

constructor() {
	this.startTime = new Date();
}

// ============================================
// Collection Methods
// ============================================

/**
 * Collect a trace from a completed operation.
 *
 * @param trace - Execution trace from a strategy
 * @param name - Optional override for operation name
 */
collect(trace: ExecutionTraceData, name?: string): void {
	const operation: CollectedOperation = {
		name: name ?? trace.strategyName,
		version: trace.strategyVersion,
		status: this.determineStatus(trace),
		duration: this.calculateDuration(trace),
		trace,
	};

	this.operations.push(operation);

	// Extract warnings from trace decisions
	for (const decision of trace.decisions) {
		if (decision.category === 'warning' || decision.description.toLowerCase().includes('warning')) {
			this.addWarning(decision.description, trace.strategyName);
		}
	}

	// Extract errors
	for (const error of trace.errors) {
		this.addError(error.message, trace.strategyName);
	}
}

/**
 * Add a manual feedback item.
 */
addFeedback(
	severity: 'info' | 'warning' | 'error',
	message: string,
	source?: string
): void {
	this.feedback.push({
		severity,
		message,
		source,
		timestamp: new Date(),
	});
}

/**
 * Add a warning message.
 */
addWarning(message: string, source?: string): void {
	this.addFeedback('warning', message, source);
}

/**
 * Add an error message.
 */
addError(message: string, source?: string): void {
	this.addFeedback('error', message, source);
}

/**
 * Add a suggestion for next steps.
 */
addSuggestion(
	action: string,
	reason: string,
	priority: 'high' | 'medium' | 'low' = 'medium'
): void {
	this.customSuggestions.push({ action, reason, priority });
}

// ============================================
// Summary Generation
// ============================================

/**
 * Generate a summary of all collected operations.
 *
 * @param options - Summary generation options
 * @returns Generated summary
 */
summarize(options: SummaryOptions = {}): SummaryResult {
	const {
		maxLength = 500,
		includeMetrics = true,
		includeSuggestions = true,
		includeOperations = false,
		verbosity = 'normal',
	} = options;

	const status = this.determineOverallStatus();
	const totalDuration = this.calculateTotalDuration();
	const metrics = this.aggregateMetrics();
	const warnings = this.getWarnings();
	const errors = this.getErrors();
	const suggestions = includeSuggestions
		? [...this.customSuggestions, ...this.generateAutoSuggestions()]
		: undefined;

	const text = this.generateTextSummary({
		status,
		totalDuration,
		metrics,
		warnings,
		errors,
		maxLength,
		verbosity,
	});

	const markdown = this.generateMarkdownSummary({
		status,
		totalDuration,
		metrics,
		warnings,
		errors,
		suggestions,
		includeMetrics,
		verbosity,
	});

	return {
		status,
		duration: this.formatDuration(totalDuration),
		operationCount: this.operations.length,
		operations: includeOperations
			? this.operations.map((op) => op.name)
			: undefined,
		warnings,
		errors,
		suggestions,
		metrics: includeMetrics ? metrics : undefined,
		text,
		markdown,
	};
}

/**
 * Reset the coordinator for reuse.
 */
reset(): void {
	this.operations = [];
	this.feedback = [];
	this.customSuggestions = [];
	this.startTime = new Date();
}

// ============================================
// Query Methods
// ============================================

/**
 * Check if any errors occurred.
 */
hasErrors(): boolean {
	return this.feedback.some((f) => f.severity === 'error');
}

/**
 * Check if any warnings occurred.
 */
hasWarnings(): boolean {
	return this.feedback.some((f) => f.severity === 'warning');
}

/**
 * Get number of collected operations.
 */
get operationCount(): number {
	return this.operations.length;
}

// ============================================
// Private Helpers
// ============================================

private determineStatus(trace: ExecutionTraceData): OperationStatus {
	if (trace.errors.length > 0) return 'failed';
	if (!trace.completedAt) return 'in-progress';
	return 'completed';
}

private calculateDuration(trace: ExecutionTraceData): number {
	if (!trace.completedAt) {
		return Date.now() - trace.startedAt.getTime();
	}
	return trace.completedAt.getTime() - trace.startedAt.getTime();
}

private determineOverallStatus(): OperationStatus {
	if (this.operations.length === 0) return 'pending';

	const hasErrors = this.operations.some((op) => op.status === 'failed');
	const hasInProgress = this.operations.some((op) => op.status === 'in-progress');
	const allCompleted = this.operations.every((op) => op.status === 'completed');

	if (hasErrors && !allCompleted) return 'partial';
	if (hasErrors) return 'failed';
	if (hasInProgress) return 'in-progress';
	return 'completed';
}

private calculateTotalDuration(): number {
	return Date.now() - this.startTime.getTime();
}

private aggregateMetrics(): Record<string, number> {
	const metrics: Record<string, number> = {};

	for (const op of this.operations) {
		for (const [key, value] of Object.entries(op.trace.metrics)) {
			metrics[key] = (metrics[key] ?? 0) + value;
		}
	}

	// Add computed metrics
	metrics.operationCount = this.operations.length;
	metrics.totalDurationMs = this.calculateTotalDuration();

	return metrics;
}

private getWarnings(): string[] {
	return this.feedback
		.filter((f) => f.severity === 'warning')
		.map((f) => f.message);
}

private getErrors(): string[] {
	return this.feedback
		.filter((f) => f.severity === 'error')
		.map((f) => f.message);
}

private generateAutoSuggestions(): Suggestion[] {
	const suggestions: Suggestion[] = [];
	const metrics = this.aggregateMetrics();

	// Suggest based on metrics
	if (metrics.totalTokens && metrics.totalTokens > 10000) {
		suggestions.push({
			action: 'Consider splitting into smaller documents',
			reason: `Output is ${metrics.totalTokens.toLocaleString()} tokens, which may exceed context limits`,
			priority: 'medium',
		});
	}

	// Suggest based on warnings
	if (this.hasWarnings()) {
		suggestions.push({
			action: 'Review and address warnings before proceeding',
			reason: `${this.getWarnings().length} warning(s) were generated`,
			priority: 'high',
		});
	}

	// Suggest based on missing validations
	const hasConstitution = this.operations.some((op) =>
		op.trace.decisions.some((d) => d.category === 'validation')
	);
	if (!hasConstitution) {
		suggestions.push({
			action: 'Add constitution validation for compliance checking',
			reason: 'No validation step was detected in the execution',
			priority: 'low',
		});
	}

	return suggestions;
}

private generateTextSummary(params: {
	status: OperationStatus;
	totalDuration: number;
	metrics: Record<string, number>;
	warnings: string[];
	errors: string[];
	maxLength: number;
	verbosity: 'minimal' | 'normal' | 'verbose';
}): string {
	const { status, totalDuration, metrics, warnings, errors, maxLength, verbosity } = params;
	const parts: string[] = [];

	// Status + duration
	const statusText = status === 'completed' ? 'Completed' : `Status: ${status}`;
	parts.push(`${statusText} ${this.operations.length} operation(s) in ${this.formatDuration(totalDuration)}.`);

	// Metrics (if normal or verbose)
	if (verbosity !== 'minimal') {
		if (metrics.documentsGenerated) {
			parts.push(`Generated ${metrics.documentsGenerated} document(s).`);
		}
		if (metrics.totalTokens) {
			parts.push(`Total tokens: ${metrics.totalTokens.toLocaleString()}.`);
		}
	}

	// Warnings
	if (warnings.length > 0) {
		parts.push(`${warnings.length} warning(s): ${warnings[0]}${warnings.length > 1 ? '...' : ''}`);
	}

	// Errors
	if (errors.length > 0) {
		parts.push(`${errors.length} error(s): ${errors[0]}${errors.length > 1 ? '...' : ''}`);
	}

	let result = parts.join(' ');
	if (result.length > maxLength) {
		result = result.substring(0, maxLength - 3) + '...';
	}

	return result;
}

private generateMarkdownSummary(params: {
	status: OperationStatus;
	totalDuration: number;
	metrics: Record<string, number>;
	warnings: string[];
	errors: string[];
	suggestions?: Suggestion[];
	includeMetrics: boolean;
	verbosity: 'minimal' | 'normal' | 'verbose';
}): string {
	const { status, totalDuration, metrics, warnings, errors, suggestions, includeMetrics, verbosity } = params;
	const lines: string[] = [];

	// Header
	const statusIcon = status === 'completed' ? '✅' : status === 'failed' ? '❌' : '⏳';
	lines.push(`## ${statusIcon} Execution Summary`);
	lines.push('');

	// Stats
	lines.push(`- **Status**: ${status}`);
	lines.push(`- **Duration**: ${this.formatDuration(totalDuration)}`);
	lines.push(`- **Operations**: ${this.operations.length}`);
	lines.push('');

	// Metrics
	if (includeMetrics && Object.keys(metrics).length > 0) {
		lines.push('### Metrics');
		lines.push('');
		lines.push('| Metric | Value |');
		lines.push('|--------|-------|');
		for (const [key, value] of Object.entries(metrics)) {
			const formattedKey = key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim();
			lines.push(`| ${formattedKey} | ${value.toLocaleString()} |`);
		}
		lines.push('');
	}

	// Warnings
	if (warnings.length > 0) {
		lines.push('### ⚠️ Warnings');
		lines.push('');
		for (const warning of warnings) {
			lines.push(`- ${warning}`);
		}
		lines.push('');
	}

	// Errors
	if (errors.length > 0) {
		lines.push('### ❌ Errors');
		lines.push('');
		for (const error of errors) {
			lines.push(`- ${error}`);
		}
		lines.push('');
	}

	// Suggestions
	if (suggestions && suggestions.length > 0) {
		lines.push('### 💡 Suggestions');
		lines.push('');
		const sorted = [...suggestions].sort((a, b) => {
			const order = { high: 0, medium: 1, low: 2 };
			return order[a.priority] - order[b.priority];
		});
		for (const suggestion of sorted) {
			const icon = suggestion.priority === 'high' ? '🔴' : suggestion.priority === 'medium' ? '🟡' : '🟢';
			lines.push(`- ${icon} **${suggestion.action}** - ${suggestion.reason}`);
		}
		lines.push('');
	}

	return lines.join('\n');
}

private formatDuration(ms: number): string {
	if (ms < 1000) return `${ms}ms`;
	if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
	const minutes = Math.floor(ms / 60000);
	const seconds = Math.floor((ms % 60000) / 1000);
	return `${minutes}m ${seconds}s`;
}
}
```

### Step 2.3: Create Barrel Export

```typescript
// src/domain/coordinators/index.ts

export type {
OperationStatus,
FeedbackSeverity,
FeedbackItem,
Suggestion,
SummaryOptions,
SummaryResult,
CollectedOperation,
} from './types.js';

export { SummaryFeedbackCoordinator } from './summary-feedback-coordinator.js';
```

---

## 3. Test Coverage

```typescript
// tests/vitest/domain/coordinators/summary-feedback-coordinator.spec.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { SummaryFeedbackCoordinator } from '../../../../src/domain/coordinators/summary-feedback-coordinator.js';
import type { ExecutionTraceData } from '../../../../src/domain/base-strategy/types.js';

function createMockTrace(overrides: Partial<ExecutionTraceData> = {}): ExecutionTraceData {
return {
	executionId: 'test-123',
	strategyName: 'test-strategy',
	strategyVersion: '1.0.0',
	startedAt: new Date(Date.now() - 1000),
	completedAt: new Date(),
	decisions: [],
	metrics: {},
	errors: [],
	...overrides,
};
}

describe('SummaryFeedbackCoordinator', () => {
let coordinator: SummaryFeedbackCoordinator;

beforeEach(() => {
	coordinator = new SummaryFeedbackCoordinator();
});

describe('collect', () => {
	it('should collect a trace', () => {
		const trace = createMockTrace();
		coordinator.collect(trace);

		expect(coordinator.operationCount).toBe(1);
	});

	it('should extract warnings from decisions', () => {
		const trace = createMockTrace({
			decisions: [
				{
					id: '1',
					timestamp: new Date(),
					category: 'warning',
					description: 'Constitution validation skipped',
					context: {},
				},
			],
		});

		coordinator.collect(trace);
		const summary = coordinator.summarize();

		expect(summary.warnings).toContain('Constitution validation skipped');
	});

	it('should extract errors from trace', () => {
		const trace = createMockTrace({
			errors: [
				{
					timestamp: new Date(),
					category: 'Error',
					message: 'File not found',
					context: {},
				},
			],
		});

		coordinator.collect(trace);

		expect(coordinator.hasErrors()).toBe(true);
	});
});

describe('addFeedback', () => {
	it('should add warning feedback', () => {
		coordinator.addWarning('Test warning', 'test-source');

		expect(coordinator.hasWarnings()).toBe(true);
	});

	it('should add error feedback', () => {
		coordinator.addError('Test error');

		expect(coordinator.hasErrors()).toBe(true);
	});
});

describe('summarize', () => {
	it('should generate summary with status', () => {
		const trace = createMockTrace();
		coordinator.collect(trace);

		const summary = coordinator.summarize();

		expect(summary.status).toBe('completed');
		expect(summary.operationCount).toBe(1);
	});

	it('should aggregate metrics from multiple traces', () => {
		coordinator.collect(createMockTrace({
			strategyName: 'strategy-1',
			metrics: { documentsGenerated: 3, totalTokens: 5000 },
		}));
		coordinator.collect(createMockTrace({
			strategyName: 'strategy-2',
			metrics: { documentsGenerated: 2, totalTokens: 3000 },
		}));

		const summary = coordinator.summarize({ includeMetrics: true });

		expect(summary.metrics?.documentsGenerated).toBe(5);
		expect(summary.metrics?.totalTokens).toBe(8000);
	});

	it('should generate text summary', () => {
		coordinator.collect(createMockTrace({ metrics: { documentsGenerated: 7 } }));

		const summary = coordinator.summarize();

		expect(summary.text).toContain('Completed');
		expect(summary.text).toContain('1 operation');
	});

	it('should generate markdown summary', () => {
		coordinator.collect(createMockTrace());

		const summary = coordinator.summarize();

		expect(summary.markdown).toContain('## ✅ Execution Summary');
		expect(summary.markdown).toContain('**Status**: completed');
	});

	it('should respect maxLength option', () => {
		coordinator.collect(createMockTrace());
		coordinator.addWarning('Very long warning message that goes on and on');

		const summary = coordinator.summarize({ maxLength: 50 });

		expect(summary.text.length).toBeLessThanOrEqual(50);
	});

	it('should include operations list when requested', () => {
		coordinator.collect(createMockTrace({ strategyName: 'speckit' }));
		coordinator.collect(createMockTrace({ strategyName: 'validation' }));

		const summary = coordinator.summarize({ includeOperations: true });

		expect(summary.operations).toContain('speckit');
		expect(summary.operations).toContain('validation');
	});
});

describe('addSuggestion', () => {
	it('should include custom suggestions', () => {
		coordinator.addSuggestion(
			'Run validation',
			'No validation was performed',
			'high'
		);

		const summary = coordinator.summarize({ includeSuggestions: true });

		expect(summary.suggestions).toHaveLength(1);
		expect(summary.suggestions?.[0].action).toBe('Run validation');
		expect(summary.suggestions?.[0].priority).toBe('high');
	});
});

describe('reset', () => {
	it('should clear all state', () => {
		coordinator.collect(createMockTrace());
		coordinator.addWarning('Test');
		coordinator.addSuggestion('Test', 'Test');

		coordinator.reset();

		expect(coordinator.operationCount).toBe(0);
		expect(coordinator.hasWarnings()).toBe(false);
	});
});

describe('overall status', () => {
	it('should be pending when no operations', () => {
		const summary = coordinator.summarize();
		expect(summary.status).toBe('pending');
	});

	it('should be failed when any operation failed', () => {
		coordinator.collect(createMockTrace({
			errors: [{ timestamp: new Date(), category: 'Error', message: 'Failed', context: {} }],
		}));

		const summary = coordinator.summarize();
		expect(summary.status).toBe('failed');
	});

	it('should be partial when some failed and some completed', () => {
		coordinator.collect(createMockTrace({ strategyName: 'good' }));
		coordinator.collect(createMockTrace({
			strategyName: 'bad',
			completedAt: null as any, // Still in progress or failed
			errors: [{ timestamp: new Date(), category: 'Error', message: 'Failed', context: {} }],
		}));

		const summary = coordinator.summarize();
		expect(summary.status).toBe('partial');
	});
});
});
```

---

## 4. Usage Examples

### Basic Usage

```typescript
import { SummaryFeedbackCoordinator } from '../domain/coordinators/index.js';

async function executeWithFeedback(input: SpecKitInput) {
const coordinator = new SummaryFeedbackCoordinator();

// Execute strategy
const result = await specKitStrategy.execute(input);
coordinator.collect(result.trace);

// Execute validation
if (input.validateAgainstConstitution) {
	const validationResult = await validator.execute(result.output);
	coordinator.collect(validationResult.trace, 'constitution-validation');
}

// Generate summary
const summary = coordinator.summarize({
	includeMetrics: true,
	includeSuggestions: true,
});

return {
	output: result.output,
	summary,
};
}
```

### MCP Tool Response

```typescript
// In MCP tool handler
const { output, summary } = await executeWithFeedback(input);

return {
content: [
	{ type: 'text', text: output.artifacts.spec },
	{ type: 'text', text: '\n---\n' + summary.markdown },
],
isError: summary.status === 'failed',
};
```

---

## 5. Acceptance Criteria

| Criterion                               | Status | Verification     |
| --------------------------------------- | ------ | ---------------- |
| Collect traces from multiple operations | ⬜      | Unit test        |
| Aggregate metrics across traces         | ⬜      | Metrics test     |
| Extract warnings from decisions         | ⬜      | Warning test     |
| Generate text summary with length limit | ⬜      | maxLength test   |
| Generate markdown summary               | ⬜      | Markdown test    |
| Auto-generate suggestions               | ⬜      | Suggestions test |
| Determine overall status correctly      | ⬜      | Status tests     |
| 100% test coverage                      | ⬜      | Coverage report  |

---

## 6. References

| Document               | Link                                                                                                     |
| ---------------------- | -------------------------------------------------------------------------------------------------------- |
| T-003: ExecutionTrace  | [T-003-execution-trace.md](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/tasks/phase-1-foundation/T-003-execution-trace.md)                                                   |
| T-037: FrameworkRouter | [../phase-3-consolidation/T-037-framework-router.md](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/tasks/phase-3-consolidation/T-037-framework-router.md) |
| Spec REQ-009           | [spec.md](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/spec.md)                                                                                 |

---

*Task: T-005 | Phase: 1 | Priority: P1*
