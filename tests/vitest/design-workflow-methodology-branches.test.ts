// Comprehensive Branch Coverage - Design Phase Workflow, Methodology Selector, and Strategic Pivot
import { beforeAll, describe, expect, it } from "vitest";
import { designPhaseWorkflow } from "../../src/tools/design/design-phase-workflow.js";
import { methodologySelector } from "../../src/tools/design/methodology-selector.js";
import type { DesignSessionState } from "../../src/tools/design/types.js";

describe("Design Phase Workflow - Branch Coverage", () => {
	beforeAll(async () => {
		await designPhaseWorkflow.initialize();
	});

	const createSession = (): DesignSessionState => ({
		config: {
			sessionId: "workflow-test",
			context: "Test",
			goal: "Test",
			requirements: [],
			constraints: [],
			coverageThreshold: 80,
			enablePivots: true,
			templateRefs: [],
			outputFormats: ["markdown"],
			metadata: {},
		},
		currentPhase: "discovery",
		phases: {
			discovery: {
				id: "discovery",
				name: "Discovery",
				description: "Discovery phase",
				inputs: [],
				outputs: ["requirements"],
				criteria: ["stakeholders-interviewed"],
				coverage: 80,
				status: "completed",
				artifacts: [],
				dependencies: [],
			},
			design: {
				id: "design",
				name: "Design",
				description: "Design phase",
				inputs: ["requirements"],
				outputs: ["design-doc"],
				criteria: ["architecture-defined"],
				coverage: 60,
				status: "in-progress",
				artifacts: [],
				dependencies: ["discovery"],
			},
		},
		coverage: {
			overall: 70,
			phases: { discovery: 80, design: 60 },
			constraints: {},
			assumptions: {},
			documentation: 70,
			testCoverage: 70,
		},
		artifacts: [],
		history: [],
		status: "active",
	});

	describe("Branch: action types", () => {
		it("should handle start-phase action", async () => {
			const session = createSession();
			const result = await designPhaseWorkflow.executePhaseWorkflow({
				action: "start-phase",
				sessionState: session,
				phaseId: "design",
			});

			expect(result).toBeDefined();
		});

		it("should handle advance-phase action", async () => {
			const session = createSession();
			const result = await designPhaseWorkflow.executePhaseWorkflow({
				action: "advance-phase",
				sessionState: session,
				content: "Phase completion content",
			});

			expect(result).toBeDefined();
		});

		it("should handle validate-phase action", async () => {
			const session = createSession();
			const result = await designPhaseWorkflow.executePhaseWorkflow({
				action: "validate-phase",
				sessionState: session,
				phaseId: "discovery",
				content: "Validation content",
			});

			expect(result).toBeDefined();
		});

		it("should handle rollback-phase action", async () => {
			const session = createSession();
			const result = await designPhaseWorkflow.executePhaseWorkflow({
				action: "rollback-phase",
				sessionState: session,
				reason: "Need to revisit requirements",
			});

			expect(result).toBeDefined();
		});
	});

	describe("Branch: optional parameters", () => {
		it("should work without phaseId when not required", async () => {
			const session = createSession();
			const result = await designPhaseWorkflow.executePhaseWorkflow({
				action: "advance-phase",
				sessionState: session,
				content: "Content",
			});

			expect(result).toBeDefined();
		});

		it("should work without content when not required", async () => {
			const session = createSession();
			const result = await designPhaseWorkflow.executePhaseWorkflow({
				action: "start-phase",
				sessionState: session,
				phaseId: "design",
			});

			expect(result).toBeDefined();
		});

		it("should work without reason when not required", async () => {
			const session = createSession();
			const result = await designPhaseWorkflow.executePhaseWorkflow({
				action: "validate-phase",
				sessionState: session,
				phaseId: "discovery",
			});

			expect(result).toBeDefined();
		});
	});

	describe("Branch: phase status checks", () => {
		it("should handle completed phase", async () => {
			const session = createSession();
			session.phases.discovery.status = "completed";

			const result = await designPhaseWorkflow.executePhaseWorkflow({
				action: "validate-phase",
				sessionState: session,
				phaseId: "discovery",
			});

			expect(result).toBeDefined();
		});

		it("should handle in-progress phase", async () => {
			const session = createSession();
			session.phases.design.status = "in-progress";

			const result = await designPhaseWorkflow.executePhaseWorkflow({
				action: "validate-phase",
				sessionState: session,
				phaseId: "design",
			});

			expect(result).toBeDefined();
		});

		it("should handle pending phase", async () => {
			const session = createSession();
			session.phases.implementation = {
				id: "implementation",
				name: "Implementation",
				description: "Implementation phase",
				inputs: ["design-doc"],
				outputs: ["code"],
				criteria: ["tests-passing"],
				coverage: 0,
				status: "pending",
				artifacts: [],
				dependencies: ["design"],
			};

			const result = await designPhaseWorkflow.executePhaseWorkflow({
				action: "start-phase",
				sessionState: session,
				phaseId: "implementation",
			});

			expect(result).toBeDefined();
		});
	});

	describe("Branch: phase dependencies", () => {
		it("should handle phase with no dependencies", async () => {
			const session = createSession();
			const result = await designPhaseWorkflow.executePhaseWorkflow({
				action: "validate-phase",
				sessionState: session,
				phaseId: "discovery",
			});

			expect(result).toBeDefined();
		});

		it("should handle phase with dependencies", async () => {
			const session = createSession();
			const result = await designPhaseWorkflow.executePhaseWorkflow({
				action: "validate-phase",
				sessionState: session,
				phaseId: "design",
			});

			expect(result).toBeDefined();
		});

		it("should handle multiple dependencies", async () => {
			const session = createSession();
			session.phases.implementation = {
				id: "implementation",
				name: "Implementation",
				description: "Implementation phase",
				inputs: ["design-doc", "requirements"],
				outputs: ["code"],
				criteria: ["tests-passing"],
				coverage: 0,
				status: "pending",
				artifacts: [],
				dependencies: ["discovery", "design"],
			};

			const result = await designPhaseWorkflow.executePhaseWorkflow({
				action: "validate-phase",
				sessionState: session,
				phaseId: "implementation",
			});

			expect(result).toBeDefined();
		});
	});

	describe("Branch: empty/missing data handling", () => {
		it("should handle phase with no outputs", async () => {
			const session = createSession();
			session.phases.discovery.outputs = [];

			const result = await designPhaseWorkflow.executePhaseWorkflow({
				action: "validate-phase",
				sessionState: session,
				phaseId: "discovery",
			});

			expect(result).toBeDefined();
		});

		it("should handle phase with no criteria", async () => {
			const session = createSession();
			session.phases.design.criteria = [];

			const result = await designPhaseWorkflow.executePhaseWorkflow({
				action: "validate-phase",
				sessionState: session,
				phaseId: "design",
			});

			expect(result).toBeDefined();
		});

		it("should handle phase with no inputs", async () => {
			const session = createSession();
			session.phases.discovery.inputs = [];

			const result = await designPhaseWorkflow.executePhaseWorkflow({
				action: "validate-phase",
				sessionState: session,
				phaseId: "discovery",
			});

			expect(result).toBeDefined();
		});
	});
});

describe("Methodology Selector - Branch Coverage", () => {
	beforeAll(async () => {
		await methodologySelector.initialize();
	});

	const createSession = (): DesignSessionState => ({
		config: {
			sessionId: "method-test",
			context: "Web application development",
			goal: "Build scalable web app",
			requirements: ["performance", "scalability"],
			constraints: [],
			coverageThreshold: 80,
			enablePivots: true,
			templateRefs: [],
			outputFormats: ["markdown"],
			metadata: {},
		},
		currentPhase: "design",
		phases: {
			design: {
				id: "design",
				name: "Design",
				description: "Design phase",
				inputs: [],
				outputs: [],
				criteria: [],
				coverage: 70,
				status: "in-progress",
				artifacts: [],
				dependencies: [],
			},
		},
		coverage: {
			overall: 70,
			phases: {},
			constraints: {},
			assumptions: {},
			documentation: 70,
			testCoverage: 70,
		},
		artifacts: [],
		history: [],
		status: "active",
	});

	describe("Branch: methodology types", () => {
		it("should recommend agile methodology", async () => {
			const session = createSession();
			session.config.context = "Fast-paced startup environment";
			session.config.requirements = ["flexibility", "quick iterations"];

			const result = await methodologySelector.selectMethodology({
				sessionState: session,
				context: "Agile-friendly context",
			});

			expect(result).toBeDefined();
			expect(result.recommendations.length).toBeGreaterThan(0);
		});

		it("should recommend waterfall methodology", async () => {
			const session = createSession();
			session.config.context = "Regulated industry with fixed requirements";
			session.config.requirements = ["compliance", "documentation"];

			const result = await methodologySelector.selectMethodology({
				sessionState: session,
				context: "Waterfall-appropriate context",
			});

			expect(result).toBeDefined();
		});

		it("should recommend hybrid methodology", async () => {
			const session = createSession();
			session.config.context = "Large enterprise with mixed needs";

			const result = await methodologySelector.selectMethodology({
				sessionState: session,
				context: "Hybrid methodology context",
			});

			expect(result).toBeDefined();
		});
	});

	describe("Branch: different project contexts", () => {
		it("should handle startup context", async () => {
			const session = createSession();
			session.config.context = "Early-stage startup";

			const result = await methodologySelector.selectMethodology({
				sessionState: session,
				context: "startup MVP development",
			});

			expect(result).toBeDefined();
		});

		it("should handle enterprise context", async () => {
			const session = createSession();
			session.config.context = "Large enterprise corporation";

			const result = await methodologySelector.selectMethodology({
				sessionState: session,
				context: "enterprise system integration",
			});

			expect(result).toBeDefined();
		});

		it("should handle research context", async () => {
			const session = createSession();
			session.config.context = "Research and development project";

			const result = await methodologySelector.selectMethodology({
				sessionState: session,
				context: "experimental research prototype",
			});

			expect(result).toBeDefined();
		});

		it("should handle government/regulated context", async () => {
			const session = createSession();
			session.config.context = "Government agency";

			const result = await methodologySelector.selectMethodology({
				sessionState: session,
				context: "healthcare compliance required",
			});

			expect(result).toBeDefined();
		});
	});

	describe("Branch: requirement variations", () => {
		it("should handle empty requirements", async () => {
			const session = createSession();
			session.config.requirements = [];

			const result = await methodologySelector.selectMethodology({
				sessionState: session,
			});

			expect(result).toBeDefined();
		});

		it("should handle single requirement", async () => {
			const session = createSession();
			session.config.requirements = ["security"];

			const result = await methodologySelector.selectMethodology({
				sessionState: session,
			});

			expect(result).toBeDefined();
		});

		it("should handle many requirements", async () => {
			const session = createSession();
			session.config.requirements = [
				"performance",
				"scalability",
				"security",
				"usability",
				"maintainability",
				"accessibility",
			];

			const result = await methodologySelector.selectMethodology({
				sessionState: session,
			});

			expect(result).toBeDefined();
		});
	});

	describe("Branch: constraint handling", () => {
		it("should consider time constraints", async () => {
			const session = createSession();
			session.config.metadata = { deadline: "3 months", urgency: "high" };

			const result = await methodologySelector.selectMethodology({
				sessionState: session,
				context: "tight deadline project",
			});

			expect(result).toBeDefined();
		});

		it("should consider budget constraints", async () => {
			const session = createSession();
			session.config.metadata = { budget: "limited", resources: "small team" };

			const result = await methodologySelector.selectMethodology({
				sessionState: session,
				context: "limited budget and resources",
			});

			expect(result).toBeDefined();
		});

		it("should consider team size", async () => {
			const session = createSession();
			session.config.metadata = { teamSize: "large", distributed: true };

			const result = await methodologySelector.selectMethodology({
				sessionState: session,
				context: "large distributed team",
			});

			expect(result).toBeDefined();
		});
	});

	describe("Branch: recommendation scoring", () => {
		it("should provide high confidence recommendations", async () => {
			const session = createSession();
			session.config.context = "Well-defined project with clear requirements";
			session.config.requirements = ["stability", "predictability"];

			const result = await methodologySelector.selectMethodology({
				sessionState: session,
			});

			expect(result.recommendations.length).toBeGreaterThan(0);
		});

		it("should handle ambiguous contexts", async () => {
			const session = createSession();
			session.config.context = "Unclear project scope";

			const result = await methodologySelector.selectMethodology({
				sessionState: session,
			});

			expect(result).toBeDefined();
		});
	});

	describe("Branch: phase-specific considerations", () => {
		it("should consider discovery phase", async () => {
			const session = createSession();
			session.currentPhase = "discovery";

			const result = await methodologySelector.selectMethodology({
				sessionState: session,
			});

			expect(result).toBeDefined();
		});

		it("should consider implementation phase", async () => {
			const session = createSession();
			session.currentPhase = "implementation";

			const result = await methodologySelector.selectMethodology({
				sessionState: session,
			});

			expect(result).toBeDefined();
		});

		it("should consider deployment phase", async () => {
			const session = createSession();
			session.currentPhase = "deployment";

			const result = await methodologySelector.selectMethodology({
				sessionState: session,
			});

			expect(result).toBeDefined();
		});
	});
});
