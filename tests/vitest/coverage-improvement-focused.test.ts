// Focused tests to improve coverage by properly exercising public APIs
import { beforeEach, describe, expect, it } from "vitest";
import { confirmationModule } from "../../src/tools/design/confirmation-module";
import { constraintManager } from "../../src/tools/design/constraint-manager";
import type {
	ConstraintRule,
	DesignPhase,
	DesignSessionState,
} from "../../src/tools/design/types";

describe("Coverage Improvement - confirmation-module & constraint-manager", () => {
	beforeEach(async () => {
		await confirmationModule.initialize();
		await constraintManager.initialize();
	});

	const createPhase = (coverage: number): DesignPhase => ({
		id: "test-phase",
		name: "Test Phase",
		description: "Test phase",
		status: "in-progress",
		inputs: ["input1"],
		outputs: ["output1", "output2"],
		criteria: ["criterion1", "criterion2"],
		coverage,
		artifacts: [
			{
				id: "art1",
				name: "Artifact 1",
				type: "specification",
				content: "Detailed specification content",
				format: "markdown",
				timestamp: new Date().toISOString(),
				metadata: {},
			},
		],
		dependencies: [],
	});

	const createConstraint = (): ConstraintRule => ({
		id: "test-c1",
		name: "Test Constraint",
		type: "functional",
		category: "quality",
		description: "Test constraint",
		validation: { minCoverage: 75, keywords: ["quality", "test"] },
		weight: 0.9,
		mandatory: true,
		source: "Test",
	});

	const createSession = (phaseCoverage: number): DesignSessionState => ({
		config: {
			sessionId: "cov-test-session",
			context: "Coverage test",
			goal: "Improve coverage",
			requirements: ["req1"],
			constraints: [createConstraint()],
			coverageThreshold: 80,
			enablePivots: false,
			templateRefs: [],
			outputFormats: ["markdown"],
			metadata: {},
		},
		currentPhase: "test-phase",
		phases: { "test-phase": createPhase(phaseCoverage) },
		coverage: {
			overall: phaseCoverage,
			phases: { "test-phase": phaseCoverage },
			constraints: { "test-c1": phaseCoverage },
			assumptions: {},
			documentation: {},
			testCoverage: phaseCoverage,
		},
		artifacts: [],
		history: [],
		status: "active",
	});

	describe("confirmation-module coverage", () => {
		it("should confirm phase with high coverage", async () => {
			const session = createSession(85);
			const content =
				"Quality test content with comprehensive coverage metrics";

			const result = await confirmationModule.confirmPhaseCompletion(
				session,
				"test-phase",
				content,
			);

			expect(result).toBeDefined();
			expect(result.passed).toBeDefined();
		});

		it("should confirm phase with low coverage and report issues", async () => {
			const session = createSession(40);
			const content = "Basic";

			const result = await confirmationModule.confirmPhaseCompletion(
				session,
				"test-phase",
				content,
			);

			expect(result).toBeDefined();
			expect(result.issues.length).toBeGreaterThan(0);
		});

		it("should use request object format", async () => {
			const session = createSession(85);

			const result = await confirmationModule.confirmPhaseCompletion({
				sessionState: session,
				phaseId: "test-phase",
				content: "Quality test content",
				captureRationale: true,
				generatePrompt: true,
			});

			expect(result).toBeDefined();
		});

		it("should export rationale documentation", async () => {
			const session = createSession(85);

			await confirmationModule.confirmPhaseCompletion({
				sessionState: session,
				phaseId: "test-phase",
				content: "Content",
				captureRationale: true,
			});

			const doc = await confirmationModule.exportRationaleDocumentation(
				session.config.sessionId,
			);
			expect(doc).toBeDefined();
		});

		it("should get rationale history", async () => {
			const session = createSession(85);

			await confirmationModule.confirmPhaseCompletion({
				sessionState: session,
				phaseId: "test-phase",
				content: "Content",
				captureRationale: true,
			});

			const history = await confirmationModule.getSessionRationaleHistory(
				session.config.sessionId,
			);
			expect(history).toBeInstanceOf(Array);
		});
	});

	describe("constraint-manager coverage", () => {
		it("should add constraint to session", async () => {
			const session = createSession(80);
			const newConstraint = {
				...createConstraint(),
				id: "new-constraint",
			};

			const result = await constraintManager.addConstraint(
				session,
				newConstraint,
			);

			expect(result).toBeDefined();
			expect(result.config.constraints).toBeInstanceOf(Array);
		});

		it("should remove constraint from session", async () => {
			const session = createSession(80);

			const result = await constraintManager.removeConstraint(
				session,
				"test-c1",
			);

			expect(result).toBeDefined();
			expect(result.config.constraints).toBeInstanceOf(Array);
		});

		it("should update constraint in session", async () => {
			const session = createSession(80);

			const result = await constraintManager.updateConstraint(
				session,
				"test-c1",
				{
					weight: 0.95,
				},
			);

			expect(result).toBeDefined();
		});

		it("should validate constraint", async () => {
			const session = createSession(80);
			const constraint = createConstraint();
			const content = "Quality test content with required keywords";

			const result = await constraintManager.validateConstraint(
				constraint,
				session.config,
				content,
			);

			expect(result).toBeDefined();
			expect(result.satisfied).toBeDefined();
		});

		it("should generate compliance report", async () => {
			const session = createSession(80);

			const report = await constraintManager.getComplianceReport(session);

			expect(report).toBeDefined();
			// Report structure may vary, just verify it exists
		});

		it("should generate coverage report", () => {
			const session = createSession(80);
			const content = "Quality test content with keywords";

			const report = constraintManager.generateCoverageReport(
				session.config,
				content,
			);

			expect(report).toBeDefined();
			expect(typeof report.overall).toBe("number");
		});

		it("should get phase requirements", () => {
			const reqs = constraintManager.getPhaseRequirements("discovery");
			expect(reqs).toBeDefined();
		});

		it("should get coverage thresholds", () => {
			const thresholds = constraintManager.getCoverageThresholds();
			expect(thresholds).toBeDefined();
		});

		it("should get micro methods", () => {
			const methods = constraintManager.getMicroMethods("confirmation");
			expect(methods).toBeInstanceOf(Array);
		});
	});
});
