import { beforeEach, describe, expect, it } from "vitest";
import type { ExecutionTraceData } from "../../../../src/domain/base-strategy/types.js";
import { SummaryFeedbackCoordinator } from "../../../../src/domain/coordinators/summary-feedback-coordinator.js";

function createMockTrace(
	overrides: Partial<ExecutionTraceData> = {},
): ExecutionTraceData {
	return {
		executionId: "test-123",
		strategyName: "test-strategy",
		strategyVersion: "1.0.0",
		startedAt: new Date(Date.now() - 1000),
		completedAt: new Date(),
		decisions: [],
		metrics: {},
		errors: [],
		...overrides,
	};
}

describe("SummaryFeedbackCoordinator", () => {
	let coordinator: SummaryFeedbackCoordinator;

	beforeEach(() => {
		coordinator = new SummaryFeedbackCoordinator();
	});

	describe("collect", () => {
		it("should collect a trace", () => {
			coordinator.collect(createMockTrace());

			expect(coordinator.operationCount).toBe(1);
		});

		it("should extract warnings from decisions", () => {
			coordinator.collect(
				createMockTrace({
					decisions: [
						{
							id: "1",
							timestamp: new Date(),
							category: "warning",
							description: "Constitution validation skipped",
							context: {},
						},
					],
				}),
			);

			const summary = coordinator.summarize();
			expect(summary.warnings).toContain("Constitution validation skipped");
		});

		it("should extract warnings from descriptions containing warning", () => {
			coordinator.collect(
				createMockTrace({
					decisions: [
						{
							id: "1",
							timestamp: new Date(),
							category: "info",
							description: "This is a warning about something",
							context: {},
						},
					],
				}),
			);

			const summary = coordinator.summarize();
			expect(summary.warnings).toContain("This is a warning about something");
		});

		it("should not extract warnings from non-warning decisions", () => {
			coordinator.collect(
				createMockTrace({
					decisions: [
						{
							id: "1",
							timestamp: new Date(),
							category: "info",
							description: "This is purely informational",
							context: {},
						},
					],
				}),
			);

			const summary = coordinator.summarize();
			expect(summary.warnings).toHaveLength(0);
		});

		it("should extract errors from trace", () => {
			coordinator.collect(
				createMockTrace({
					errors: [
						{
							timestamp: new Date(),
							category: "Error",
							message: "File not found",
							context: {},
						},
					],
				}),
			);

			expect(coordinator.hasErrors()).toBe(true);
		});

		it("should use custom name when provided", () => {
			const trace = createMockTrace({ strategyName: "original-strategy" });

			coordinator.collect(trace, "custom-name");
			const summary = coordinator.summarize({ includeOperations: true });

			expect(summary.operations).toContain("custom-name");
			expect(summary.operations).not.toContain("original-strategy");
		});
	});

	describe("addFeedback", () => {
		it("should add info feedback", () => {
			coordinator.collect(createMockTrace());
			coordinator.addFeedback("info", "Test info", "test-source");

			const summary = coordinator.summarize();
			expect(summary.status).toBe("completed");
		});

		it("should add warning feedback", () => {
			coordinator.addWarning("Test warning", "test-source");

			expect(coordinator.hasWarnings()).toBe(true);
		});

		it("should add error feedback", () => {
			coordinator.addError("Test error");

			expect(coordinator.hasErrors()).toBe(true);
		});
	});

	describe("summarize", () => {
		it("should generate summary with status", () => {
			coordinator.collect(createMockTrace());

			const summary = coordinator.summarize();

			expect(summary.status).toBe("completed");
			expect(summary.operationCount).toBe(1);
		});

		it("should aggregate metrics from multiple traces", () => {
			coordinator.collect(
				createMockTrace({
					strategyName: "strategy-1",
					metrics: { documentsGenerated: 3, totalTokens: 5000 },
				}),
			);
			coordinator.collect(
				createMockTrace({
					strategyName: "strategy-2",
					metrics: { documentsGenerated: 2, totalTokens: 3000 },
				}),
			);

			const summary = coordinator.summarize({ includeMetrics: true });

			expect(summary.metrics?.documentsGenerated).toBe(5);
			expect(summary.metrics?.totalTokens).toBe(8000);
		});

		it("should generate text summary", () => {
			coordinator.collect(
				createMockTrace({ metrics: { documentsGenerated: 7 } }),
			);

			const summary = coordinator.summarize();

			expect(summary.text).toContain("Completed");
			expect(summary.text).toContain("1 operation");
		});

		it("should generate markdown summary", () => {
			coordinator.collect(createMockTrace());

			const summary = coordinator.summarize();

			expect(summary.markdown).toContain("## ✅ Execution Summary");
			expect(summary.markdown).toContain("**Status**: completed");
		});

		it("should respect maxLength option", () => {
			coordinator.collect(createMockTrace());
			coordinator.addWarning("Very long warning message that goes on and on");

			const summary = coordinator.summarize({ maxLength: 50 });

			expect(summary.text.length).toBeLessThanOrEqual(50);
		});

		it("should handle maxLength 0 by returning an empty string", () => {
			coordinator.collect(createMockTrace());

			const summary = coordinator.summarize({ maxLength: 0 });

			expect(summary.text).toBe("");
		});

		it("should handle maxLength 1 by returning a single dot", () => {
			coordinator.collect(createMockTrace());

			const summary = coordinator.summarize({ maxLength: 1 });

			expect(summary.text).toBe(".");
		});

		it("should handle maxLength 3 by returning three dots", () => {
			coordinator.collect(createMockTrace());

			const summary = coordinator.summarize({ maxLength: 3 });

			expect(summary.text).toBe("...");
		});

		it("should handle maxLength 2 by returning two dots", () => {
			coordinator.collect(createMockTrace());

			const summary = coordinator.summarize({ maxLength: 2 });

			expect(summary.text).toBe("..");
		});

		it("should include operations list when requested", () => {
			coordinator.collect(createMockTrace({ strategyName: "speckit" }));
			coordinator.collect(createMockTrace({ strategyName: "validation" }));

			const summary = coordinator.summarize({ includeOperations: true });

			expect(summary.operations).toContain("speckit");
			expect(summary.operations).toContain("validation");
		});

		it("should exclude document and token metrics from text in minimal verbosity", () => {
			coordinator.collect(
				createMockTrace({
					metrics: {
						documentsGenerated: 3,
						totalTokens: 5000,
					},
				}),
			);

			const summary = coordinator.summarize({
				includeMetrics: true,
				verbosity: "minimal",
			});

			expect(summary.text).not.toMatch(/document/i);
			expect(summary.text).not.toMatch(/token/i);
		});

		it("should include document and token metrics in normal verbosity", () => {
			coordinator.collect(
				createMockTrace({
					metrics: {
						documentsGenerated: 4,
						totalTokens: 6000,
					},
				}),
			);

			const summary = coordinator.summarize({
				includeMetrics: true,
			});

			expect(summary.text).toMatch(/document/i);
			expect(summary.text).toMatch(/token/i);
		});

		it("should include more text details in verbose verbosity", () => {
			coordinator.collect(
				createMockTrace({
					strategyName: "detailed-strategy",
					metrics: {
						documentsGenerated: 2,
						totalTokens: 2000,
					},
				}),
			);
			coordinator.addWarning("Potential performance issue");

			const normalSummary = coordinator.summarize({
				includeMetrics: true,
				verbosity: "normal",
			});
			const verboseSummary = coordinator.summarize({
				includeMetrics: true,
				verbosity: "verbose",
			});

			expect(verboseSummary.text).toContain("Operations:");
			expect(verboseSummary.text.length).toBeGreaterThan(
				normalSummary.text.length,
			);
		});

		it("should exclude suggestions and metrics when disabled", () => {
			coordinator.addSuggestion(
				"Run validation",
				"No validation was performed",
			);
			coordinator.collect(
				createMockTrace({
					metrics: { totalTokens: 12000 },
				}),
			);

			const summary = coordinator.summarize({
				includeSuggestions: false,
				includeMetrics: false,
			});

			expect(summary.suggestions).toBeUndefined();
			expect(summary.metrics).toBeUndefined();
			expect(summary.markdown).not.toContain("### Metrics");
		});

		it("should summarize multiple warnings and errors with ellipsis", () => {
			coordinator.collect(createMockTrace());
			coordinator.addWarning("First warning");
			coordinator.addWarning("Second warning");
			coordinator.addError("First error");
			coordinator.addError("Second error");

			const summary = coordinator.summarize();

			expect(summary.text).toContain("2 warning(s): First warning...");
			expect(summary.text).toContain("2 error(s): First error...");
		});
	});

	describe("addSuggestion", () => {
		it("should include custom suggestions", () => {
			coordinator.addSuggestion(
				"Run validation",
				"No validation was performed",
				"high",
			);

			const summary = coordinator.summarize({ includeSuggestions: true });

			expect(summary.suggestions?.[0].action).toBe("Run validation");
			expect(summary.suggestions?.[0].priority).toBe("high");
		});

		it("should include auto-generated suggestions", () => {
			coordinator.collect(
				createMockTrace({
					metrics: { totalTokens: 12000 },
					decisions: [],
				}),
			);

			const summary = coordinator.summarize({ includeSuggestions: true });
			const actions = summary.suggestions?.map((s) => s.action) ?? [];

			expect(actions).toContain("Consider splitting into smaller documents");
			expect(actions).toContain(
				"Add constitution validation for compliance checking",
			);
		});

		it("should not suggest validation when no operations were collected", () => {
			const summary = coordinator.summarize({ includeSuggestions: true });
			const actions = summary.suggestions?.map((s) => s.action) ?? [];

			expect(actions).not.toContain(
				"Add constitution validation for compliance checking",
			);
		});
	});

	describe("reset", () => {
		it("should clear all state", () => {
			coordinator.collect(createMockTrace());
			coordinator.addWarning("Test");
			coordinator.addSuggestion("Test", "Test");

			coordinator.reset();

			expect(coordinator.operationCount).toBe(0);
			expect(coordinator.hasWarnings()).toBe(false);
		});
	});

	describe("overall status", () => {
		it("should be pending when no operations", () => {
			const summary = coordinator.summarize();
			expect(summary.status).toBe("pending");
			expect(summary.markdown).toContain("## ⏳ Execution Summary");
		});

		it("should be failed when any operation failed", () => {
			coordinator.collect(
				createMockTrace({
					errors: [
						{
							timestamp: new Date(),
							category: "Error",
							message: "Failed",
							context: {},
						},
					],
				}),
			);

			const summary = coordinator.summarize();
			expect(summary.status).toBe("failed");
		});

		it("should be partial when some failed and some completed", () => {
			coordinator.collect(createMockTrace({ strategyName: "good" }));
			coordinator.collect(
				createMockTrace({
					strategyName: "bad",
					errors: [
						{
							timestamp: new Date(),
							category: "Error",
							message: "Failed",
							context: {},
						},
					],
				}),
			);

			const summary = coordinator.summarize();
			expect(summary.status).toBe("partial");
		});

		it("should show in-progress icon for in-progress status", () => {
			coordinator.collect(
				createMockTrace({
					completedAt: null,
					errors: [],
				}),
			);

			const summary = coordinator.summarize();
			expect(summary.status).toBe("in-progress");
			expect(summary.markdown).toContain("## 🔄 Execution Summary");
		});
	});

	describe("time source", () => {
		it("should use injected clock for deterministic duration", () => {
			const now = new Date("2026-01-01T00:00:10.000Z");
			const deterministic = new SummaryFeedbackCoordinator({
				startTime: new Date("2026-01-01T00:00:00.000Z"),
				now: () => now,
			});

			deterministic.collect(
				createMockTrace({
					startedAt: new Date("2026-01-01T00:00:08.000Z"),
					completedAt: null,
				}),
			);

			const summary = deterministic.summarize();
			expect(summary.duration).toBe("10.0s");
		});

		it("should format duration in minutes and seconds when over one minute", () => {
			const deterministic = new SummaryFeedbackCoordinator({
				startTime: new Date("2026-01-01T00:00:00.000Z"),
				now: () => new Date("2026-01-01T00:02:35.000Z"),
			});

			const summary = deterministic.summarize();
			expect(summary.duration).toBe("2m 35s");
		});
	});
});
