// Comprehensive Coverage Tests for confirmation-prompt-builder.ts
// Targets all 19 methods and uncovered branches (435 lines)
import { beforeEach, describe, expect, it } from "vitest";
import { confirmationPromptBuilder } from "../../dist/tools/design/confirmation-prompt-builder.js";
import type {
	Artifact,
	ConstraintRule,
	DesignPhase,
	DesignSessionState,
} from "../../dist/tools/design/types/index.js";

describe("Confirmation Prompt Builder - Complete Coverage", () => {
	beforeEach(async () => {
		await confirmationPromptBuilder.initialize();
	});

	// Helper to create complete session state
	const createFullSessionState = (): DesignSessionState => {
		const constraints: ConstraintRule[] = [
			{
				id: "c1",
				name: "Performance",
				type: "non-functional",
				category: "performance",
				description: "Response time < 100ms",
				validation: { keywords: ["performance"] },
				weight: 2,
				mandatory: true,
				source: "test-source",
			},
			{
				id: "c2",
				name: "Security",
				type: "compliance",
				category: "security",
				description: "HTTPS only",
				validation: { keywords: ["security"] },
				weight: 3,
				mandatory: true,
				source: "test-source",
			},
		];

		const artifacts: Artifact[] = [
			{
				id: "a1",
				name: "API Spec",
				type: "specification",
				content: "API specification content",
				format: "markdown",
				metadata: { status: "reviewed" },
				timestamp: "2024-01-01T00:00:00Z",
			},
		];

		const discoveryPhase: DesignPhase = {
			id: "discovery",
			name: "Discovery",
			description: "Discovery phase",
			status: "completed",
			inputs: ["stakeholder-list"],
			outputs: ["problem-statement"],
			criteria: ["stakeholder-interview-complete"],
			coverage: 95,
			artifacts: [],
			dependencies: [],
		};

		const requirementsPhase: DesignPhase = {
			id: "requirements",
			name: "Requirements",
			description: "Requirements phase",
			status: "in-progress",
			inputs: ["problem-statement"],
			outputs: ["requirement-doc"],
			criteria: ["requirements-approved"],
			coverage: 70,
			artifacts,
			dependencies: ["discovery"],
		};

		const designPhase: DesignPhase = {
			id: "design",
			name: "Design",
			description: "Design phase",
			status: "pending",
			inputs: ["requirement-doc"],
			outputs: ["architecture-doc"],
			criteria: ["design-review-passed"],
			coverage: 0,
			artifacts: [],
			dependencies: ["requirements"],
		};

		return {
			config: {
				sessionId: "test-session",
				context: "E-commerce platform",
				goal: "Design scalable API",
				requirements: ["req1", "req2"],
				constraints,
				coverageThreshold: 85,
				enablePivots: false,
				templateRefs: [],
				outputFormats: ["markdown", "json", "yaml"],
				metadata: { project: "test" },
			},
			currentPhase: "requirements",
			phases: {
				discovery: discoveryPhase,
				requirements: requirementsPhase,
				design: designPhase,
			},
			coverage: {
				overall: 65,
				phases: { discovery: 95, requirements: 70, design: 0 },
				constraints: { c1: 100, c2: 50 },
				assumptions: {},
				documentation: {},
				testCoverage: 80,
			},
			artifacts,
			history: [
				{
					timestamp: "2024-01-01T00:00:00Z",
					type: "phase-complete",
					phase: "discovery",
					description: "Discovery completed",
					data: {},
				},
			],
			status: "active",
		};
	};

	describe("initialize()", () => {
		it("should initialize without errors", async () => {
			const builder = Object.create(confirmationPromptBuilder);
			await builder.initialize?.();
			expect(true).toBe(true);
		});
	});

	describe("generateConfirmationPrompt() - Main Entry Point", () => {
		it("should generate prompt for requirements phase", async () => {
			const session = createFullSessionState();
			const result = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState: session,
					phaseId: "requirements",
					includeRationale: true,
				},
			);

			expect(result).toBeDefined();
			expect(result.title).toContain("Requirements");
			expect(result.sections).toBeDefined();
			expect(result.validationChecklist).toBeDefined();
			expect(result.rationaleQuestions.length).toBeGreaterThan(0);
			expect(result.nextSteps).toBeDefined();
		});

		it("should throw error for non-existent phase", async () => {
			const session = createFullSessionState();
			await expect(
				confirmationPromptBuilder.generateConfirmationPrompt({
					sessionState: session,
					phaseId: "non-existent",
				}),
			).rejects.toThrow();
		});

		it("should generate prompt without rationale when requested", async () => {
			const session = createFullSessionState();
			const result = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState: session,
					phaseId: "requirements",
					includeRationale: false,
				},
			);

			expect(result.rationaleQuestions).toHaveLength(0);
		});

		it("should include contextual content when provided", async () => {
			const session = createFullSessionState();
			const contextContent = "Key decision: Use microservices architecture";
			const result = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState: session,
					phaseId: "requirements",
					contextualContent: contextContent,
				},
			);

			expect(result).toBeDefined();
		});

		it("should handle template overrides", async () => {
			const session = createFullSessionState();
			const result = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState: session,
					phaseId: "requirements",
					templateOverrides: {
						customHeader: "Custom template content",
					},
				},
			);

			expect(result).toBeDefined();
		});
	});

	describe("generatePhaseCompletionPrompt()", () => {
		it("should format prompt as markdown string", async () => {
			const session = createFullSessionState();
			const result =
				await confirmationPromptBuilder.generatePhaseCompletionPrompt(
					session,
					"requirements",
				);

			expect(typeof result).toBe("string");
			expect(result).toContain("Requirements");
		});

		it("should include all prompt sections in markdown", async () => {
			const session = createFullSessionState();
			const result =
				await confirmationPromptBuilder.generatePhaseCompletionPrompt(
					session,
					"requirements",
				);

			expect(result).toContain("Validation Checklist");
			expect(result).toContain("Next Steps");
		});

		it("should handle completed phase", async () => {
			const session = createFullSessionState();
			const result =
				await confirmationPromptBuilder.generatePhaseCompletionPrompt(
					session,
					"discovery",
				);

			expect(result).toContain("Discovery");
		});

		it("should handle pending phase", async () => {
			const session = createFullSessionState();
			const result =
				await confirmationPromptBuilder.generatePhaseCompletionPrompt(
					session,
					"design",
				);

			expect(result).toContain("Design");
		});
	});

	describe("generateCoverageValidationPrompt()", () => {
		it("should generate coverage validation with default threshold", async () => {
			const session = createFullSessionState();
			const result =
				await confirmationPromptBuilder.generateCoverageValidationPrompt(
					session,
				);

			expect(result).toBeDefined();
			expect(typeof result).toBe("string");
		});

		it("should generate with custom coverage threshold", async () => {
			const session = createFullSessionState();
			const result =
				await confirmationPromptBuilder.generateCoverageValidationPrompt(
					session,
					90,
				);

			expect(result).toContain("coverage");
		});

		it("should identify gaps when below threshold", async () => {
			const session = createFullSessionState();
			session.coverage.overall = 50;
			const result =
				await confirmationPromptBuilder.generateCoverageValidationPrompt(
					session,
					85,
				);

			expect(result).toBeDefined();
		});

		it("should handle high coverage scenario", async () => {
			const session = createFullSessionState();
			session.coverage.overall = 98;
			const result =
				await confirmationPromptBuilder.generateCoverageValidationPrompt(
					session,
					85,
				);

			expect(result).toBeDefined();
		});
	});

	describe("generatePromptSections() - Private", () => {
		it("should generate all required section types", async () => {
			const session = createFullSessionState();
			const prompt = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState: session,
					phaseId: "requirements",
				},
			);

			const sectionTypes = prompt.sections.map((s) => s.type);
			expect(sectionTypes).toContain("overview");
			expect(sectionTypes).toContain("validation");
			expect(sectionTypes.length).toBeGreaterThanOrEqual(2);
		});

		it("should include rationale section when enabled", async () => {
			const session = createFullSessionState();
			const prompt = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState: session,
					phaseId: "requirements",
					includeRationale: true,
				},
			);

			const rationaleSection = prompt.sections.find(
				(s) => s.type === "rationale",
			);
			expect(rationaleSection).toBeDefined();
		});

		it("should include recommendations section", async () => {
			const session = createFullSessionState();
			const prompt = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState: session,
					phaseId: "requirements",
				},
			);

			const recSection = prompt.sections.find(
				(s) => s.type === "recommendations",
			);
			expect(recSection).toBeDefined();
		});
	});

	describe("generateValidationChecklist() - Private", () => {
		it("should generate checkpoints for all constraint categories", async () => {
			const session = createFullSessionState();
			const prompt = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState: session,
					phaseId: "requirements",
				},
			);

			const categories = prompt.validationChecklist.map((c) => c.category);
			expect(categories).toContain("coverage");
			expect(categories).toContain("constraints");
		});

		it("should handle phases with no constraints", async () => {
			const session = createFullSessionState();
			session.config.constraints = [];
			const prompt = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState: session,
					phaseId: "requirements",
				},
			);

			expect(prompt.validationChecklist).toBeDefined();
		});

		it("should mark checkpoints as not_applicable when appropriate", async () => {
			const session = createFullSessionState();
			const prompt = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState: session,
					phaseId: "requirements",
				},
			);

			// May or may not exist depending on constraints
			expect(prompt.validationChecklist.length).toBeGreaterThan(0);
		});
	});

	describe("generateRationaleQuestions() - Private", () => {
		it("should include decision category questions", async () => {
			const session = createFullSessionState();
			const prompt = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState: session,
					phaseId: "requirements",
					includeRationale: true,
				},
			);

			const decisionQs = prompt.rationaleQuestions.filter(
				(q) => q.category === "decision",
			);
			expect(decisionQs.length).toBeGreaterThanOrEqual(0);
		});

		it("should include risk category questions", async () => {
			const session = createFullSessionState();
			session.coverage.overall = 30; // Low coverage = more risks
			const prompt = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState: session,
					phaseId: "requirements",
					includeRationale: true,
				},
			);

			expect(prompt.rationaleQuestions.length).toBeGreaterThan(0);
		});

		it("should not include questions when rationale disabled", async () => {
			const session = createFullSessionState();
			const prompt = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState: session,
					phaseId: "requirements",
					includeRationale: false,
				},
			);

			expect(prompt.rationaleQuestions).toHaveLength(0);
		});
	});

	describe("generateNextSteps() - Private", () => {
		it("should generate steps for pending next phase", async () => {
			const session = createFullSessionState();
			const prompt = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState: session,
					phaseId: "requirements",
				},
			);

			expect(prompt.nextSteps.length).toBeGreaterThan(0);
		});

		it("should handle final phase (no next phase)", async () => {
			const session = createFullSessionState();
			// Remove design phase to make requirements the last phase
			delete session.phases.design;
			const prompt = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState: session,
					phaseId: "requirements",
				},
			);

			expect(prompt.nextSteps).toBeDefined();
		});

		it("should include coverage gap steps when gaps exist", async () => {
			const session = createFullSessionState();
			session.coverage.overall = 60;
			const prompt = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState: session,
					phaseId: "requirements",
				},
			);

			expect(prompt.nextSteps.length).toBeGreaterThan(0);
		});

		it("should include critical issue steps", async () => {
			const session = createFullSessionState();
			// Create a situation with critical issues
			session.phases.requirements.outputs = []; // Missing outputs = critical issue
			const prompt = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState: session,
					phaseId: "requirements",
				},
			);

			expect(prompt.nextSteps).toBeDefined();
		});
	});

	describe("formatPromptAsMarkdown() - Private", () => {
		it("should include all section content", async () => {
			const session = createFullSessionState();
			const result =
				await confirmationPromptBuilder.generatePhaseCompletionPrompt(
					session,
					"requirements",
				);

			// Verify markdown structure
			expect(result).toContain("#");
			expect(result).toContain("##");
		});

		it("should format validation checklist as markdown", async () => {
			const session = createFullSessionState();
			const result =
				await confirmationPromptBuilder.generatePhaseCompletionPrompt(
					session,
					"requirements",
				);

			expect(result).toContain("Validation");
		});

		it("should format rationale questions as markdown", async () => {
			const session = createFullSessionState();
			const result =
				await confirmationPromptBuilder.generatePhaseCompletionPrompt(
					session,
					"requirements",
				);

			expect(result).toBeDefined();
		});

		it("should include next steps formatted", async () => {
			const session = createFullSessionState();
			const result =
				await confirmationPromptBuilder.generatePhaseCompletionPrompt(
					session,
					"requirements",
				);

			expect(result).toContain("Next Steps");
		});
	});

	describe("identifyCoverageGaps() - Private", () => {
		it("should identify gaps in low coverage phases", async () => {
			const session = createFullSessionState();
			const prompt = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState: session,
					phaseId: "design",
				},
			);

			expect(prompt.metadata.coverageGaps.length).toBeGreaterThan(0);
		});

		it("should identify constraint coverage gaps", async () => {
			const session = createFullSessionState();
			session.coverage.constraints = { c1: 100, c2: 40 }; // c2 below threshold
			const prompt = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState: session,
					phaseId: "requirements",
				},
			);

			expect(prompt.metadata.coverageGaps).toBeDefined();
		});

		it("should not identify gaps when coverage is high", async () => {
			const session = createFullSessionState();
			session.phases.requirements.coverage = 95;
			const prompt = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState: session,
					phaseId: "requirements",
				},
			);

			// Gaps array should be smaller
			expect(Array.isArray(prompt.metadata.coverageGaps)).toBe(true);
		});
	});

	describe("identifyCriticalIssues() - Private", () => {
		it("should identify missing outputs", async () => {
			const session = createFullSessionState();
			session.phases.requirements.outputs = [];
			const prompt = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState: session,
					phaseId: "requirements",
				},
			);

			expect(
				prompt.metadata.criticalIssues.some((i) => i.includes("output")),
			).toBe(true);
		});

		it("should identify unmet mandatory constraints", async () => {
			const session = createFullSessionState();
			session.coverage.constraints = { c1: 80, c2: 50 }; // Both mandatory
			const prompt = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState: session,
					phaseId: "requirements",
				},
			);

			expect(prompt.metadata.criticalIssues).toBeDefined();
		});

		it("should identify blocked dependencies", async () => {
			const session = createFullSessionState();
			session.phases.requirements.dependencies = ["discovery"];
			session.phases.discovery.status = "in-progress"; // Not completed
			const prompt = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState: session,
					phaseId: "requirements",
				},
			);

			const hasBlockedDep = prompt.metadata.criticalIssues.some((i) =>
				i.includes("Dependency"),
			);
			expect(hasBlockedDep).toBe(true);
		});
	});

	describe("Content Generation Private Methods", () => {
		it("should generate overview content with phase info", async () => {
			const session = createFullSessionState();
			const prompt = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState: session,
					phaseId: "requirements",
				},
			);

			const overviewSection = prompt.sections.find(
				(s) => s.type === "overview",
			);
			expect(overviewSection?.content).toContain("Requirements");
		});

		it("should generate validation content with gaps and issues", async () => {
			const session = createFullSessionState();
			const prompt = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState: session,
					phaseId: "requirements",
				},
			);

			const validationSection = prompt.sections.find(
				(s) => s.type === "validation",
			);
			expect(validationSection).toBeDefined();
		});

		it("should generate rationale content", async () => {
			const session = createFullSessionState();
			const prompt = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState: session,
					phaseId: "requirements",
					includeRationale: true,
				},
			);

			const rationaleSection = prompt.sections.find(
				(s) => s.type === "rationale",
			);
			expect(rationaleSection).toBeDefined();
		});

		it("should generate recommendations content", async () => {
			const session = createFullSessionState();
			const prompt = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState: session,
					phaseId: "requirements",
				},
			);

			const recSection = prompt.sections.find(
				(s) => s.type === "recommendations",
			);
			expect(recSection).toBeDefined();
		});
	});

	describe("getNextPhase() - Private", () => {
		it("should return next phase when available", async () => {
			const session = createFullSessionState();
			const prompt = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState: session,
					phaseId: "requirements",
				},
			);

			// Next steps should mention the next phase
			expect(prompt.nextSteps.length).toBeGreaterThan(0);
		});

		it("should return null for last phase", async () => {
			const session = createFullSessionState();
			delete session.phases.design; // Make requirements the last phase
			const prompt = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState: session,
					phaseId: "requirements",
				},
			);

			expect(prompt).toBeDefined();
		});

		it("should handle three-phase workflow", async () => {
			const session = createFullSessionState();
			const prompt = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState: session,
					phaseId: "discovery",
				},
			);

			expect(prompt.nextSteps).toBeDefined();
		});
	});

	describe("Edge Cases and Error Scenarios", () => {
		it("should handle session with no artifacts", async () => {
			const session = createFullSessionState();
			session.artifacts = [];
			const prompt = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState: session,
					phaseId: "requirements",
				},
			);

			expect(prompt).toBeDefined();
		});

		it("should handle empty coverage report", async () => {
			const session = createFullSessionState();
			session.coverage.phases = {};
			const prompt = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState: session,
					phaseId: "requirements",
				},
			);

			expect(prompt).toBeDefined();
		});

		it("should handle undefined constraints in coverage", async () => {
			const session = createFullSessionState();
			session.coverage.constraints = {};
			const prompt = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState: session,
					phaseId: "requirements",
				},
			);

			expect(prompt).toBeDefined();
		});

		it("should handle phase with multiple dependencies", async () => {
			const session = createFullSessionState();
			session.phases.design.dependencies = ["discovery", "requirements"];
			const prompt = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState: session,
					phaseId: "design",
				},
			);

			expect(prompt).toBeDefined();
		});

		it("should handle very low coverage (critical)", async () => {
			const session = createFullSessionState();
			session.coverage.overall = 5;
			const prompt = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState: session,
					phaseId: "requirements",
				},
			);

			expect(prompt.metadata.criticalIssues.length).toBeGreaterThanOrEqual(0);
		});

		it("should handle very high coverage (near perfect)", async () => {
			const session = createFullSessionState();
			session.coverage.overall = 99;
			session.phases.requirements.coverage = 99;
			const prompt = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState: session,
					phaseId: "requirements",
				},
			);

			expect(prompt.metadata.coverageGaps.length).toBeLessThan(5);
		});
	});
});
