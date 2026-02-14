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
	});

	describe("addFeedback", () => {
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

		it("should include operations list when requested", () => {
			coordinator.collect(createMockTrace({ strategyName: "speckit" }));
			coordinator.collect(createMockTrace({ strategyName: "validation" }));

			const summary = coordinator.summarize({ includeOperations: true });

			expect(summary.operations).toContain("speckit");
			expect(summary.operations).toContain("validation");
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
	});
});
