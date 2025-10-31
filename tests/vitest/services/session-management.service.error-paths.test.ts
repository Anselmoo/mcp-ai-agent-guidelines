import { afterEach, describe, expect, it, vi } from "vitest";
import { adrGenerator } from "../../../src/tools/design/adr-generator.js";
import { constraintManager } from "../../../src/tools/design/constraint-manager.js";
import { designPhaseWorkflow } from "../../../src/tools/design/design-phase-workflow.js";
import { sessionManagementService } from "../../../src/tools/design/services/session-management.service.js";
import type {
	DesignSessionConfig,
	DesignSessionState,
} from "../../../src/tools/design/types/index.js";
import { ErrorReporter } from "../../../src/tools/shared/errors.js";

function createBaseConfig(sessionId: string): DesignSessionConfig {
	return {
		sessionId,
		context: "Service test context",
		goal: "Exercise error handling paths",
		requirements: ["Error resilience"],
		constraints: [],
		coverageThreshold: 85,
		enablePivots: true,
		templateRefs: [],
		outputFormats: ["markdown"],
		metadata: {},
	};
}

function createSessionState(config: DesignSessionConfig): DesignSessionState {
	return {
		config,
		currentPhase: "discovery",
		phases: {},
		coverage: {
			overall: 0,
			phases: {},
			constraints: {},
			assumptions: {},
			documentation: {},
			testCoverage: 0,
		},
		artifacts: [],
		history: [],
		status: "initializing",
	};
}

describe("SessionManagementService error scenarios", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("returns structured error when constraint loading fails", async () => {
		const sessionId = `constraint-error-${Date.now()}`;
		const config = createBaseConfig(sessionId);
		const constraintError = new Error("Constraint configuration invalid");

		vi.spyOn(
			constraintManager,
			"loadConstraintsFromConfig",
		).mockRejectedValueOnce(constraintError);

		const response = await sessionManagementService.startDesignSession(
			sessionId,
			config,
			{ custom: true },
		);

		expect(response.success).toBe(false);
		expect(response.status).toBe("error");
		expect(response.message).toBe("Constraint configuration invalid");
		expect(response.recommendations).toContain(
			"Check constraint configuration format",
		);
	});

	it("propagates workflow execution failure responses", async () => {
		const sessionId = `workflow-failure-${Date.now()}`;
		const config = createBaseConfig(sessionId);
		const sessionState = createSessionState(config);

		vi.spyOn(designPhaseWorkflow, "executeWorkflow").mockResolvedValueOnce({
			success: false,
			sessionState,
			currentPhase: "discovery",
			recommendations: ["Verify workflow configuration"],
			artifacts: [],
			message: "Workflow execution failed",
		});

		const response = await sessionManagementService.startDesignSession(
			sessionId,
			config,
		);

		expect(response.success).toBe(false);
		expect(response.status).toBe("failed");
		expect(response.message).toBe("Workflow execution failed");
		expect(response.recommendations).toEqual(["Verify workflow configuration"]);
	});

	it("logs warning and continues when ADR generation fails", async () => {
		const sessionId = `adr-warning-${Date.now()}`;
		const config: DesignSessionConfig = {
			...createBaseConfig(sessionId),
			methodologySignals: {
				projectType: "new-application",
				problemFraming: "innovation-driven",
				riskLevel: "medium",
				timelinePressure: "normal",
				stakeholderMode: "mixed",
			},
		};

		const warnSpy = vi.spyOn(ErrorReporter, "warn");
		vi.spyOn(adrGenerator, "generateADR").mockRejectedValueOnce(
			new Error("ADR generation failed"),
		);

		const response = await sessionManagementService.startDesignSession(
			sessionId,
			config,
		);

		expect(response.success).toBe(true);
		expect(response.artifacts).toHaveLength(0);
		expect(warnSpy).toHaveBeenCalledWith(
			expect.objectContaining({ message: "ADR generation failed" }),
			{
				sessionId,
				operation: "generate-methodology-adr",
			},
		);
	});
});
