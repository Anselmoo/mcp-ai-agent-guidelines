import { describe, expect, it } from "vitest";
import { ExecutionTrace as DomainExecutionTrace } from "../../../src/domain/base-strategy/execution-trace.js";
import { AgentHandoffCoordinator } from "../../../src/domain/coordination/agent-handoff-coordinator.js";
import { ExecutionTrace as HandoffExecutionTrace } from "../../../src/domain/coordination/execution-trace.js";
import { SummaryFeedbackCoordinator } from "../../../src/domain/coordinators/summary-feedback-coordinator.js";
import {
	OutputApproach,
	type OutputArtifacts,
	type OutputStrategy,
} from "../../../src/strategies/output-strategy.js";
import { BaseStrategy } from "../../../src/strategies/shared/base-strategy.js";
import type {
	StrategyResult,
	ValidationResult,
} from "../../../src/strategies/shared/types.js";

class NumericStrategy extends BaseStrategy<
	{ value: number },
	{ doubled: number }
> {
	protected readonly name = "NumericStrategy";
	protected readonly version = "1.0.0";

	validate(input: { value: number }): ValidationResult {
		if (input.value <= 0) {
			return {
				valid: false,
				errors: [
					{
						code: "VALIDATION_ERROR",
						message: "Value must be greater than zero",
						field: "value",
					},
				],
				warnings: [],
			};
		}

		return { valid: true, errors: [], warnings: [] };
	}

	async execute(input: { value: number }): Promise<{ doubled: number }> {
		return { doubled: input.value * 2 };
	}
}

class LifecycleOutputStrategy implements OutputStrategy<{ doubled: number }> {
	readonly approach = OutputApproach.CHAT;

	render(result: { doubled: number }): OutputArtifacts {
		return {
			primary: {
				name: "result.md",
				content: `Doubled value: ${result.doubled}`,
				format: "markdown",
			},
		};
	}

	supports(domainType: string): boolean {
		return domainType === "NumericResult";
	}

	validate(_result: { doubled: number }): ValidationResult {
		return { valid: true, errors: [], warnings: [] };
	}

	async execute(result: { doubled: number }): Promise<OutputArtifacts> {
		return this.render(result);
	}

	async run(result: {
		doubled: number;
	}): Promise<StrategyResult<OutputArtifacts>> {
		return {
			success: true,
			data: await this.execute(result),
			trace: {
				traceId: "phase1-foundation",
				startTime: new Date(0).toISOString(),
				endTime: new Date(0).toISOString(),
				entries: [],
				summary: {
					totalDecisions: 0,
					totalErrors: 0,
					totalWarnings: 0,
					durationMs: 0,
				},
			},
			durationMs: 0,
		};
	}
}

describe("Phase 1 foundation integration", () => {
	it("covers the primary path across phase 1 components", async () => {
		const strategy = new NumericStrategy();
		const outputStrategy = new LifecycleOutputStrategy();

		const strategyResult = await strategy.run({ value: 2 });
		expect(strategyResult.success).toBe(true);
		if (!strategyResult.success) {
			throw new Error("Expected strategy success");
		}

		const rendered = await outputStrategy.run(strategyResult.data);
		expect(rendered.success).toBe(true);
		if (!rendered.success) {
			throw new Error("Expected output strategy success");
		}
		expect(rendered.data.primary.content).toContain("Doubled value: 4");

		const domainTrace = new DomainExecutionTrace("NumericStrategy", "1.0.0");
		domainTrace.recordDecision(
			"validation",
			"Validation completed without warning",
		);
		domainTrace.recordMetric("documentsGenerated", 1);
		domainTrace.complete();

		const summaryCoordinator = new SummaryFeedbackCoordinator();
		summaryCoordinator.collect(domainTrace.toData());
		const summary = summaryCoordinator.summarize({ includeSuggestions: true });

		expect(summary.status).toBe("completed");
		expect(summary.errors).toHaveLength(0);
		expect(summary.metrics?.documentsGenerated).toBe(1);

		const handoffTrace = new HandoffExecutionTrace("phase-1-primary-path");
		handoffTrace.recordDecision("summary", "completed", "Ready for handoff");
		handoffTrace.complete(true);

		const handoff = AgentHandoffCoordinator.prepareHandoff({
			sourceAgent: "mcp-tool-builder",
			targetAgent: "code-reviewer",
			context: { artifacts: [rendered.data.primary.name] },
			instructions: "Review phase 1 output",
			trace: handoffTrace,
		});

		expect(handoff.trace?.success).toBe(true);
		expect(handoff.instructions.task).toBe("Review phase 1 output");
	});

	it("covers failure modes and escalates a handoff", async () => {
		const strategy = new NumericStrategy();
		const failedResult = await strategy.run({ value: 0 });

		expect(failedResult.success).toBe(false);
		if (failedResult.success) {
			throw new Error("Expected strategy failure");
		}
		expect(failedResult.errors[0].code).toBe("VALIDATION_ERROR");

		const domainTrace = new DomainExecutionTrace("NumericStrategy", "1.0.0");
		domainTrace.recordDecision(
			"warning",
			"Validation warning detected during execution",
		);
		domainTrace.recordError(new Error("Value must be greater than zero"));
		domainTrace.complete();

		const summaryCoordinator = new SummaryFeedbackCoordinator();
		summaryCoordinator.collect(domainTrace.toData(), "numeric-validation");
		const summary = summaryCoordinator.summarize({ includeSuggestions: true });

		expect(summary.status).toBe("failed");
		expect(summary.errors).toContain("Value must be greater than zero");
		expect(summary.warnings).toContain(
			"Validation warning detected during execution",
		);

		const handoffTrace = new HandoffExecutionTrace("phase-1-failure-path");
		handoffTrace.recordError(
			"VALIDATION_ERROR",
			"Value must be greater than zero",
		);
		handoffTrace.complete(false);

		const handoff = AgentHandoffCoordinator.prepareHandoff({
			sourceAgent: "mcp-tool-builder",
			targetAgent: "debugging-assistant",
			priority: "immediate",
			context: {
				decisions: [{ what: "Escalation", why: "Validation failed" }],
			},
			instructions: { task: "Investigate validation failure" },
			trace: handoffTrace,
		});

		const coordinator = new AgentHandoffCoordinator();
		coordinator.register(handoff);
		const pending = coordinator.listPendingForAgent("debugging-assistant");

		expect(pending.map((item) => item.id)).toContain(handoff.id);
		expect(AgentHandoffCoordinator.toMarkdown(handoff)).toContain(
			"**Success**: ❌",
		);
	});
});
