import type { ExecutionTraceData } from "../base-strategy/types.js";
import type {
	CollectedOperation,
	FeedbackItem,
	OperationStatus,
	Suggestion,
	SummaryOptions,
	SummaryResult,
} from "./types.js";

/**
 * SummaryFeedbackCoordinator - aggregates execution traces and generates user feedback.
 */
export class SummaryFeedbackCoordinator {
	private operations: CollectedOperation[] = [];
	private feedback: FeedbackItem[] = [];
	private customSuggestions: Suggestion[] = [];
	private startTime: Date;

	constructor() {
		this.startTime = new Date();
	}

	collect(trace: ExecutionTraceData, name?: string): void {
		const operation: CollectedOperation = {
			name: name ?? trace.strategyName,
			version: trace.strategyVersion,
			status: this.determineStatus(trace),
			duration: this.calculateDuration(trace),
			trace,
		};

		this.operations.push(operation);

		for (const decision of trace.decisions) {
			const category = decision.category.toLowerCase();
			if (
				category === "warning" ||
				decision.description.toLowerCase().includes("warning")
			) {
				this.addWarning(decision.description, trace.strategyName);
			}
		}

		for (const error of trace.errors) {
			this.addError(error.message, trace.strategyName);
		}
	}

	addFeedback(
		severity: "info" | "warning" | "error",
		message: string,
		source?: string,
	): void {
		this.feedback.push({
			severity,
			message,
			source,
			timestamp: new Date(),
		});
	}

	addWarning(message: string, source?: string): void {
		this.addFeedback("warning", message, source);
	}

	addError(message: string, source?: string): void {
		this.addFeedback("error", message, source);
	}

	addSuggestion(
		action: string,
		reason: string,
		priority: "high" | "medium" | "low" = "medium",
	): void {
		this.customSuggestions.push({ action, reason, priority });
	}

	summarize(options: SummaryOptions = {}): SummaryResult {
		const {
			maxLength = 500,
			includeMetrics = true,
			includeSuggestions = true,
			includeOperations = false,
			verbosity = "normal",
		} = options;

		const status = this.determineOverallStatus();
		const totalDuration = this.calculateTotalDuration();
		const metrics = this.aggregateMetrics(totalDuration);
		const warnings = this.getWarnings();
		const errors = this.getErrors();
		const suggestions = includeSuggestions
			? [...this.customSuggestions, ...this.generateAutoSuggestions(metrics)]
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
		});

		return {
			status,
			duration: this.formatDuration(totalDuration),
			operationCount: this.operations.length,
			operations: includeOperations
				? this.operations.map((operation) => operation.name)
				: undefined,
			warnings,
			errors,
			suggestions,
			metrics: includeMetrics ? metrics : undefined,
			text,
			markdown,
		};
	}

	reset(): void {
		this.operations = [];
		this.feedback = [];
		this.customSuggestions = [];
		this.startTime = new Date();
	}

	hasErrors(): boolean {
		return this.feedback.some((item) => item.severity === "error");
	}

	hasWarnings(): boolean {
		return this.feedback.some((item) => item.severity === "warning");
	}

	get operationCount(): number {
		return this.operations.length;
	}

	private determineStatus(trace: ExecutionTraceData): OperationStatus {
		if (trace.errors.length > 0) return "failed";
		if (!trace.completedAt) return "in-progress";
		return "completed";
	}

	private calculateDuration(trace: ExecutionTraceData): number {
		const endTime = trace.completedAt ?? new Date();
		return endTime.getTime() - trace.startedAt.getTime();
	}

	private determineOverallStatus(): OperationStatus {
		if (this.operations.length === 0) return "pending";

		const hasFailed = this.operations.some(
			(operation) => operation.status === "failed",
		);
		const hasCompleted = this.operations.some(
			(operation) => operation.status === "completed",
		);
		const hasInProgress = this.operations.some(
			(operation) => operation.status === "in-progress",
		);

		if (hasFailed && (hasCompleted || hasInProgress)) return "partial";
		if (hasFailed) return "failed";
		if (hasInProgress) return "in-progress";
		return "completed";
	}

	private calculateTotalDuration(): number {
		return Date.now() - this.startTime.getTime();
	}

	private aggregateMetrics(totalDuration: number): Record<string, number> {
		const metrics: Record<string, number> = {};

		for (const operation of this.operations) {
			for (const [key, value] of Object.entries(operation.trace.metrics)) {
				metrics[key] = (metrics[key] ?? 0) + value;
			}
		}

		metrics.operationCount = this.operations.length;
		metrics.totalDurationMs = totalDuration;

		return metrics;
	}

	private getWarnings(): string[] {
		return this.feedback
			.filter((item) => item.severity === "warning")
			.map((item) => item.message);
	}

	private getErrors(): string[] {
		return this.feedback
			.filter((item) => item.severity === "error")
			.map((item) => item.message);
	}

	private generateAutoSuggestions(
		metrics: Record<string, number>,
	): Suggestion[] {
		const suggestions: Suggestion[] = [];

		if (metrics.totalTokens && metrics.totalTokens > 10000) {
			suggestions.push({
				action: "Consider splitting into smaller documents",
				reason: `Output is ${metrics.totalTokens.toLocaleString()} tokens, which may exceed context limits`,
				priority: "medium",
			});
		}

		if (this.hasWarnings()) {
			suggestions.push({
				action: "Review and address warnings before proceeding",
				reason: `${this.getWarnings().length} warning(s) were generated`,
				priority: "high",
			});
		}

		const hasValidationDecision = this.operations.some((operation) =>
			operation.trace.decisions.some(
				(decision) => decision.category.toLowerCase() === "validation",
			),
		);

		if (!hasValidationDecision) {
			suggestions.push({
				action: "Add constitution validation for compliance checking",
				reason: "No validation step was detected in the execution",
				priority: "low",
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
		verbosity: "minimal" | "normal" | "verbose";
	}): string {
		const {
			status,
			totalDuration,
			metrics,
			warnings,
			errors,
			maxLength,
			verbosity,
		} = params;
		const parts: string[] = [];

		const statusText =
			status === "completed" ? "Completed" : `Status: ${status}`;
		parts.push(
			`${statusText} ${this.operations.length} operation(s) in ${this.formatDuration(totalDuration)}.`,
		);

		if (verbosity !== "minimal") {
			if (metrics.documentsGenerated) {
				parts.push(`Generated ${metrics.documentsGenerated} document(s).`);
			}
			if (metrics.totalTokens) {
				parts.push(`Total tokens: ${metrics.totalTokens.toLocaleString()}.`);
			}
		}

		if (warnings.length > 0) {
			parts.push(
				`${warnings.length} warning(s): ${warnings[0]}${warnings.length > 1 ? "..." : ""}`,
			);
		}

		if (errors.length > 0) {
			parts.push(
				`${errors.length} error(s): ${errors[0]}${errors.length > 1 ? "..." : ""}`,
			);
		}

		const result = parts.join(" ");
		return this.truncateText(result, maxLength);
	}

	private generateMarkdownSummary(params: {
		status: OperationStatus;
		totalDuration: number;
		metrics: Record<string, number>;
		warnings: string[];
		errors: string[];
		suggestions?: Suggestion[];
		includeMetrics: boolean;
	}): string {
		const {
			status,
			totalDuration,
			metrics,
			warnings,
			errors,
			suggestions,
			includeMetrics,
		} = params;
		const lines: string[] = [];

		const statusIcon =
			status === "completed"
				? "✅"
				: status === "failed"
					? "❌"
					: status === "partial"
						? "⚠️"
						: "⏳";
		lines.push(`## ${statusIcon} Execution Summary`);
		lines.push("");

		lines.push(`- **Status**: ${status}`);
		lines.push(`- **Duration**: ${this.formatDuration(totalDuration)}`);
		lines.push(`- **Operations**: ${this.operations.length}`);
		lines.push("");

		if (includeMetrics && Object.keys(metrics).length > 0) {
			lines.push("### Metrics");
			lines.push("");
			lines.push("| Metric | Value |");
			lines.push("|--------|-------|");
			for (const [key, value] of Object.entries(metrics)) {
				const formattedKey = key
					.replace(/_/g, " ")
					.replace(/([A-Z])/g, " $1")
					.trim();
				lines.push(`| ${formattedKey} | ${value.toLocaleString()} |`);
			}
			lines.push("");
		}

		if (warnings.length > 0) {
			lines.push("### ⚠️ Warnings");
			lines.push("");
			for (const warning of warnings) {
				lines.push(`- ${warning}`);
			}
			lines.push("");
		}

		if (errors.length > 0) {
			lines.push("### ❌ Errors");
			lines.push("");
			for (const error of errors) {
				lines.push(`- ${error}`);
			}
			lines.push("");
		}

		if (suggestions && suggestions.length > 0) {
			lines.push("### 💡 Suggestions");
			lines.push("");
			const sortedSuggestions = [...suggestions].sort((a, b) => {
				const order = { high: 0, medium: 1, low: 2 };
				return order[a.priority] - order[b.priority];
			});
			for (const suggestion of sortedSuggestions) {
				const icon =
					suggestion.priority === "high"
						? "🔴"
						: suggestion.priority === "medium"
							? "🟡"
							: "🟢";
				lines.push(`- ${icon} **${suggestion.action}** - ${suggestion.reason}`);
			}
			lines.push("");
		}

		return lines.join("\n");
	}

	private truncateText(text: string, maxLength: number): string {
		if (text.length <= maxLength) {
			return text;
		}
		if (maxLength <= 3) {
			return ".".repeat(Math.max(maxLength, 0));
		}
		return `${text.substring(0, maxLength - 3)}...`;
	}

	private formatDuration(ms: number): string {
		if (ms < 1000) return `${ms}ms`;
		if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
		const minutes = Math.floor(ms / 60000);
		const seconds = Math.floor((ms % 60000) / 1000);
		return `${minutes}m ${seconds}s`;
	}
}
