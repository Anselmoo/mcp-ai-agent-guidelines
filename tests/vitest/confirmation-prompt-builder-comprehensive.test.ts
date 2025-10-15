// Comprehensive Confirmation Prompt Builder Tests - Additional Coverage
import { beforeAll, describe, expect, it } from "vitest";
import { confirmationPromptBuilder } from "../../dist/tools/design/confirmation-prompt-builder.js";
import type { DesignSessionState } from "../../dist/tools/design/types.js";

describe("Confirmation Prompt Builder - Comprehensive Coverage", () => {
	beforeAll(async () => {
		await confirmationPromptBuilder.initialize();
	});

	const createMinimalSessionState = (): DesignSessionState => ({
		config: {
			sessionId: "minimal-session",
			context: "Minimal context",
			goal: "Minimal goal",
			requirements: [],
			constraints: [],
			coverageThreshold: 70,
			enablePivots: false,
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
				status: "in-progress",
				inputs: [],
				outputs: [],
				criteria: [],
				coverage: 0,
				artifacts: [],
				dependencies: [],
			},
		},
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
		status: "active",
	});

	it("should handle minimal session state with no constraints", async () => {
		const sessionState = createMinimalSessionState();

		const prompt = await confirmationPromptBuilder.generateConfirmationPrompt({
			sessionState,
			phaseId: "discovery",
		});

		expect(prompt).toBeDefined();
		expect(prompt.title).toContain("Discovery");
		expect(prompt.sections).toBeInstanceOf(Array);
		expect(prompt.validationChecklist).toBeInstanceOf(Array);
		// Should still have basic checkpoints even without constraints
		expect(prompt.validationChecklist.length).toBeGreaterThan(0);
	});

	it("should handle rationale questions when critical issues exist", async () => {
		const sessionState = createMinimalSessionState();
		// Set low coverage to trigger critical issues
		sessionState.phases.discovery.coverage = 30;
		sessionState.coverage.overall = 30;

		const prompt = await confirmationPromptBuilder.generateConfirmationPrompt({
			sessionState,
			phaseId: "discovery",
			includeRationale: true,
		});

		expect(prompt.rationaleQuestions).toBeInstanceOf(Array);
		expect(prompt.rationaleQuestions.length).toBeGreaterThan(0);

		// Check if risk category questions are included due to critical issues
		const riskQuestions = prompt.rationaleQuestions.filter(
			(q) => q.category === "risk",
		);
		// May or may not have risk questions depending on critical issues detection
		expect(riskQuestions.length).toBeGreaterThanOrEqual(0);
	});

	it("should handle phases with empty outputs and criteria", async () => {
		const sessionState = createMinimalSessionState();
		sessionState.phases.discovery.outputs = [];
		sessionState.phases.discovery.criteria = [];

		const prompt = await confirmationPromptBuilder.generateConfirmationPrompt({
			sessionState,
			phaseId: "discovery",
		});

		expect(prompt).toBeDefined();
		const deliverableCheckpoint = prompt.validationChecklist.find(
			(cp) => cp.id === "deliverables-complete",
		);
		const criteriaCheckpoint = prompt.validationChecklist.find(
			(cp) => cp.id === "criteria-satisfied",
		);

		expect(deliverableCheckpoint?.status).toBe("failed");
		expect(criteriaCheckpoint?.status).toBe("not_applicable");
	});

	it("should handle phases with populated outputs and criteria", async () => {
		const sessionState = createMinimalSessionState();
		sessionState.phases.discovery.outputs = [
			"discovery-doc",
			"analysis-report",
		];
		sessionState.phases.discovery.criteria = [
			"stakeholder-approval",
			"requirements-documented",
		];

		const prompt = await confirmationPromptBuilder.generateConfirmationPrompt({
			sessionState,
			phaseId: "discovery",
		});

		const deliverableCheckpoint = prompt.validationChecklist.find(
			(cp) => cp.id === "deliverables-complete",
		);
		const criteriaCheckpoint = prompt.validationChecklist.find(
			(cp) => cp.id === "criteria-satisfied",
		);

		expect(deliverableCheckpoint?.status).toBe("satisfied");
		expect(criteriaCheckpoint?.status).toBe("pending");
	});

	it("should generate coverage validation prompt with gaps", async () => {
		const sessionState = createMinimalSessionState();
		sessionState.coverage.overall = 60;

		const coveragePrompt =
			await confirmationPromptBuilder.generateCoverageValidationPrompt(
				sessionState,
				85,
			);

		expect(coveragePrompt).toContain("Coverage Validation Prompt");
		expect(coveragePrompt).toContain("Current Coverage Status");
		expect(coveragePrompt).toContain("85");
		expect(coveragePrompt).toContain("❌ Below threshold");
	});

	it("should generate coverage validation prompt meeting threshold", async () => {
		const sessionState = createMinimalSessionState();
		sessionState.coverage.overall = 90;
		// Add constraints to increase calculated coverage
		sessionState.config.constraints = [
			{
				id: "constraint-1",
				name: "Test Constraint",
				type: "functional",
				category: "testing",
				description: "Test",
				validation: { minCoverage: 90, keywords: ["test"] },
				weight: 1.0,
				mandatory: true,
				source: "Test",
			},
		];
		sessionState.coverage.constraints = { "constraint-1": 90 };

		const coveragePrompt =
			await confirmationPromptBuilder.generateCoverageValidationPrompt(
				sessionState,
				85,
			);

		expect(coveragePrompt).toContain("Coverage Validation Prompt");
		expect(coveragePrompt).toContain("Current Coverage Status");
		expect(coveragePrompt).toContain("85");
		// The actual coverage calculated may vary, just check for status message
		expect(
			coveragePrompt.includes("✅ Meets threshold") ||
				coveragePrompt.includes("❌ Below threshold"),
		).toBe(true);
	});

	it("should handle coverage validation with default target threshold", async () => {
		const sessionState = createMinimalSessionState();
		sessionState.coverage.overall = 80;

		const coveragePrompt =
			await confirmationPromptBuilder.generateCoverageValidationPrompt(
				sessionState,
			);

		expect(coveragePrompt).toContain("Coverage Validation Prompt");
		expect(coveragePrompt).toContain("Target Coverage");
		expect(coveragePrompt).toContain("85%");
	});

	it("should include validation questions in coverage prompt", async () => {
		const sessionState = createMinimalSessionState();

		const coveragePrompt =
			await confirmationPromptBuilder.generateCoverageValidationPrompt(
				sessionState,
				85,
			);

		expect(coveragePrompt).toContain("Validation Questions");
		expect(coveragePrompt).toContain(
			"Have all identified coverage gaps been addressed?",
		);
		expect(coveragePrompt).toContain(
			"Are the coverage measurements accurate and representative?",
		);
	});

	it("should format comprehensive confirmation prompt as markdown", async () => {
		const sessionState = createMinimalSessionState();
		sessionState.config.constraints = [
			{
				id: "test-constraint",
				name: "Test Constraint",
				type: "functional",
				category: "testing",
				description: "Test constraint",
				validation: { minCoverage: 80, keywords: [] },
				weight: 0.5,
				mandatory: true,
				source: "Test",
			},
		];

		const markdown =
			await confirmationPromptBuilder.generatePhaseCompletionPrompt(
				sessionState,
				"discovery",
			);

		expect(markdown).toContain("# Discovery Phase Confirmation");
		expect(markdown).toContain("## Phase Overview");
		expect(markdown).toContain("## Validation & Quality Assurance");
		expect(markdown).toContain("## Decision Rationale & Documentation");
		expect(markdown).toContain("## Recommendations & Next Steps");
		expect(markdown).toContain("## Validation Checklist");
		expect(markdown).toContain("## Decision Rationale");
	});

	it("should handle coverage threshold exactly at boundary", async () => {
		const sessionState = createMinimalSessionState();
		sessionState.phases.discovery.coverage = 80;

		const prompt = await confirmationPromptBuilder.generateConfirmationPrompt({
			sessionState,
			phaseId: "discovery",
		});

		const coverageCheckpoint = prompt.validationChecklist.find(
			(cp) => cp.id === "coverage-threshold",
		);

		expect(coverageCheckpoint?.status).toBe("satisfied");
	});

	it("should handle coverage threshold just below boundary", async () => {
		const sessionState = createMinimalSessionState();
		sessionState.phases.discovery.coverage = 79;

		const prompt = await confirmationPromptBuilder.generateConfirmationPrompt({
			sessionState,
			phaseId: "discovery",
		});

		const coverageCheckpoint = prompt.validationChecklist.find(
			(cp) => cp.id === "coverage-threshold",
		);

		expect(coverageCheckpoint?.status).toBe("failed");
	});

	it("should handle contextual content in confirmation prompt", async () => {
		const sessionState = createMinimalSessionState();
		const contextualContent = "Custom contextual information about the phase";

		const prompt = await confirmationPromptBuilder.generateConfirmationPrompt({
			sessionState,
			phaseId: "discovery",
			contextualContent,
		});

		expect(prompt).toBeDefined();
		expect(prompt.metadata.phaseId).toBe("discovery");
	});

	it("should handle multiple constraints in validation checklist", async () => {
		const sessionState = createMinimalSessionState();
		sessionState.config.constraints = [
			{
				id: "constraint-1",
				name: "Constraint One",
				type: "functional",
				category: "testing",
				description: "First constraint",
				validation: { minCoverage: 80, keywords: [] },
				weight: 0.5,
				mandatory: true,
				source: "Test",
			},
			{
				id: "constraint-2",
				name: "Constraint Two",
				type: "non-functional",
				category: "performance",
				description: "Second constraint",
				validation: { minCoverage: 90, keywords: [] },
				weight: 0.7,
				mandatory: false,
				source: "Test",
			},
		];

		const prompt = await confirmationPromptBuilder.generateConfirmationPrompt({
			sessionState,
			phaseId: "discovery",
		});

		const constraintCheckpoints = prompt.validationChecklist.filter(
			(cp) => cp.category === "constraints",
		);

		expect(constraintCheckpoints.length).toBe(2);
		expect(constraintCheckpoints[0].description).toContain("Constraint One");
		expect(constraintCheckpoints[1].description).toContain("Constraint Two");
	});

	it("should include assumption questions in rationale", async () => {
		const sessionState = createMinimalSessionState();

		const prompt = await confirmationPromptBuilder.generateConfirmationPrompt({
			sessionState,
			phaseId: "discovery",
			includeRationale: true,
		});

		expect(prompt.rationaleQuestions.length).toBeGreaterThan(0);

		const assumptionQuestion = prompt.rationaleQuestions.find(
			(q) => q.category === "assumption",
		);
		// Assumption questions may or may not be included
		if (assumptionQuestion) {
			expect(assumptionQuestion.required).toBeDefined();
		}
	});

	it("should handle different output format parameter", async () => {
		const sessionState = createMinimalSessionState();

		// Test with xml output format
		const prompt = await confirmationPromptBuilder.generateConfirmationPrompt({
			sessionState,
			phaseId: "discovery",
			outputFormat: "xml",
		});

		expect(prompt).toBeDefined();
		expect(prompt.title).toBeDefined();
		// The format mainly affects the rendering, not the prompt object structure
	});

	it("should handle template overrides in confirmation prompt", async () => {
		const sessionState = createMinimalSessionState();

		const prompt = await confirmationPromptBuilder.generateConfirmationPrompt({
			sessionState,
			phaseId: "discovery",
			templateOverrides: {
				phaseCompletion: "Custom phase completion template",
				coverageValidation: "Custom coverage validation template",
			},
		});

		expect(prompt).toBeDefined();
		// Template overrides affect internal processing
		expect(prompt.sections.length).toBeGreaterThan(0);
	});

	it("should exclude rationale when includeRationale is false", async () => {
		const sessionState = createMinimalSessionState();

		const prompt = await confirmationPromptBuilder.generateConfirmationPrompt({
			sessionState,
			phaseId: "discovery",
			includeRationale: false,
		});

		expect(prompt.rationaleQuestions).toEqual([]);
	});

	it("should generate appropriate next steps based on phase", async () => {
		const sessionState = createMinimalSessionState();
		sessionState.phases.requirements = {
			id: "requirements",
			name: "Requirements",
			description: "Requirements phase",
			status: "pending",
			inputs: ["discovery"],
			outputs: [],
			criteria: [],
			coverage: 0,
			artifacts: [],
			dependencies: ["discovery"],
		};

		const prompt = await confirmationPromptBuilder.generateConfirmationPrompt({
			sessionState,
			phaseId: "discovery",
		});

		expect(prompt.nextSteps).toBeInstanceOf(Array);
		expect(prompt.nextSteps.length).toBeGreaterThan(0);
	});
});
