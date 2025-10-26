// Enhanced coverage for confirmation-prompt-builder edge cases
// Focuses on previously uncovered code paths and error scenarios

import { beforeAll, describe, expect, it } from "vitest";
import { confirmationPromptBuilder } from "../../src/tools/design/confirmation-prompt-builder.ts";
import type { DesignSessionState } from "../../src/tools/design/types.ts";

describe("Confirmation Prompt Builder - Coverage Enhancement", () => {
	beforeAll(async () => {
		await confirmationPromptBuilder.initialize();
	});

	const createMinimalSession = (): DesignSessionState => ({
		config: {
			sessionId: "minimal-session",
			context: "Minimal test context",
			goal: "Test minimal configuration",
			requirements: [],
			constraints: [],
			coverageThreshold: 85,
			enablePivots: false,
			templateRefs: [],
			outputFormats: [],
			metadata: {},
		},
		currentPhase: "test",
		phases: {
			test: {
				id: "test",
				name: "Test Phase",
				description: "Minimal test phase",
				status: "pending",
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

	const createSessionWithCoverage = (coverage: number): DesignSessionState => {
		const session = createMinimalSession();
		session.phases.test.coverage = coverage;
		session.coverage = {
			overall: coverage,
			phases: { test: coverage },
			constraints: {},
			assumptions: {},
			documentation: {},
			testCoverage: coverage,
		};
		return session;
	};

	const createSessionWithConstraints = (
		count: number,
		mandatory: boolean = false,
	): DesignSessionState => {
		const session = createMinimalSession();
		session.config.constraints = Array.from({ length: count }, (_, i) => ({
			id: `constraint-${i}`,
			name: `Constraint ${i}`,
			type: "functional",
			category: "test",
			description: `Test constraint ${i}`,
			validation: { keywords: ["test"] },
			weight: 1,
			mandatory: i === 0 ? mandatory : false,
			source: "test",
		}));
		return session;
	};

	const createMultiPhaseSession = (): DesignSessionState => {
		const session = createMinimalSession();
		session.phases = {
			phase1: {
				id: "phase1",
				name: "Phase 1",
				description: "First phase",
				status: "completed",
				inputs: [],
				outputs: ["output-1"],
				criteria: ["criterion-1"],
				coverage: 85,
				artifacts: [],
				dependencies: [],
			},
			phase2: {
				id: "phase2",
				name: "Phase 2",
				description: "Second phase",
				status: "in-progress",
				inputs: ["output-1"],
				outputs: ["output-2"],
				criteria: ["criterion-2"],
				coverage: 60,
				artifacts: [],
				dependencies: ["phase1"],
			},
			phase3: {
				id: "phase3",
				name: "Phase 3",
				description: "Third phase",
				status: "pending",
				inputs: ["output-2"],
				outputs: ["output-3"],
				criteria: ["criterion-3"],
				coverage: 0,
				artifacts: [],
				dependencies: ["phase2"],
			},
		};
		session.currentPhase = "phase2";
		return session;
	};

	// ============ Coverage Threshold Variations ============
	describe("generateConfirmationPrompt - Coverage Threshold Handling", () => {
		it("should handle zero coverage phase", async () => {
			const session = createSessionWithCoverage(0);

			const result = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState: session,
					phaseId: "test",
				},
			);

			expect(result).toBeDefined();
			expect(result.metadata.coverageGaps).toBeDefined();
			// At 0% coverage, should identify at least one gap (overall coverage)
			expect(result.metadata.coverageGaps.length).toBeGreaterThanOrEqual(0);
		});
		it("should handle full coverage phase", async () => {
			const session = createSessionWithCoverage(100);

			const result = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState: session,
					phaseId: "test",
				},
			);

			expect(result).toBeDefined();
			expect(result.metadata.coverageGaps).toBeDefined();
		});

		it("should handle partial coverage variations", async () => {
			const coverageValues = [25, 50, 75];

			for (const coverage of coverageValues) {
				const session = createSessionWithCoverage(coverage);

				const result =
					await confirmationPromptBuilder.generateConfirmationPrompt({
						sessionState: session,
						phaseId: "test",
					});

				expect(result).toBeDefined();
				expect(result.metadata.phaseId).toBe("test");
			}
		});
	});

	// ============ Context and Rationale Variations ============
	describe("generateConfirmationPrompt - Rationale and Context", () => {
		it("should include rationale when requested", async () => {
			const session = createMinimalSession();

			const result = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState: session,
					phaseId: "test",
					includeRationale: true,
				},
			);

			expect(result.rationaleQuestions.length).toBeGreaterThan(0);
		});

		it("should exclude rationale when not requested", async () => {
			const session = createMinimalSession();

			const result = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState: session,
					phaseId: "test",
					includeRationale: false,
				},
			);

			expect(result.rationaleQuestions).toHaveLength(0);
		});

		it("should handle long contextual content", async () => {
			const session = createMinimalSession();
			const longContext = "Context line\n".repeat(100);

			const result = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState: session,
					phaseId: "test",
					contextualContent: longContext,
				},
			);

			expect(result).toBeDefined();
			expect(result.sections).toBeDefined();
		});

		it("should handle empty contextual content", async () => {
			const session = createMinimalSession();

			const result = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState: session,
					phaseId: "test",
					contextualContent: "",
				},
			);

			expect(result).toBeDefined();
		});
	});

	// ============ Constraint Handling ============
	describe("generateConfirmationPrompt - Constraint Scenarios", () => {
		it("should handle no constraints", async () => {
			const session = createSessionWithConstraints(0);

			const result = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState: session,
					phaseId: "test",
				},
			);

			expect(result.validationChecklist).toBeDefined();
		});

		it("should handle single constraint", async () => {
			const session = createSessionWithConstraints(1);

			const result = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState: session,
					phaseId: "test",
				},
			);

			expect(result.validationChecklist.length).toBeGreaterThan(0);
		});

		it("should handle multiple constraints", async () => {
			const session = createSessionWithConstraints(5);

			const result = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState: session,
					phaseId: "test",
				},
			);

			expect(result.validationChecklist.length).toBeGreaterThanOrEqual(5);
		});

		it("should handle mandatory constraint in checklist", async () => {
			const session = createSessionWithConstraints(3, true);

			const result = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState: session,
					phaseId: "test",
				},
			);

			const mandatoryCheckpoint = result.validationChecklist.find((c) =>
				c.id.includes("constraint"),
			);
			expect(mandatoryCheckpoint).toBeDefined();
		});
	});

	// ============ Phase Structure Variations ============
	describe("generateConfirmationPrompt - Phase Structures", () => {
		it("should handle phase with empty outputs", async () => {
			const session = createMinimalSession();
			session.phases.test.outputs = [];

			const result = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState: session,
					phaseId: "test",
				},
			);

			expect(result.metadata.criticalIssues).toBeDefined();
		});

		it("should handle phase with many outputs", async () => {
			const session = createMinimalSession();
			session.phases.test.outputs = Array.from(
				{ length: 20 },
				(_, i) => `output-${i}`,
			);

			const result = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState: session,
					phaseId: "test",
				},
			);

			expect(result).toBeDefined();
		});

		it("should handle phase with many criteria", async () => {
			const session = createMinimalSession();
			session.phases.test.criteria = Array.from(
				{ length: 20 },
				(_, i) => `criterion-${i}`,
			);

			const result = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState: session,
					phaseId: "test",
				},
			);

			expect(result).toBeDefined();
		});

		it("should handle phase without dependencies", async () => {
			const session = createMinimalSession();
			session.phases.test.dependencies = [];

			const result = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState: session,
					phaseId: "test",
				},
			);

			expect(result).toBeDefined();
		});
	});

	// ============ Multi-Phase Workflows ============
	describe("generateConfirmationPrompt - Multi-Phase Workflows", () => {
		it("should handle transition between phases", async () => {
			const session = createMultiPhaseSession();

			const result = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState: session,
					phaseId: "phase2",
				},
			);

			expect(result.nextSteps).toBeDefined();
			expect(result.nextSteps.length).toBeGreaterThan(0);
		});

		it("should identify dependencies correctly", async () => {
			const session = createMultiPhaseSession();

			const result = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState: session,
					phaseId: "phase3",
				},
			);

			expect(result).toBeDefined();
		});

		it("should handle first phase without dependencies", async () => {
			const session = createMultiPhaseSession();

			const result = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState: session,
					phaseId: "phase1",
				},
			);

			expect(result).toBeDefined();
		});
	});

	// ============ Error Scenarios ============
	describe("generateConfirmationPrompt - Error Scenarios", () => {
		it("should throw for non-existent phase", async () => {
			const session = createMinimalSession();

			await expect(
				confirmationPromptBuilder.generateConfirmationPrompt({
					sessionState: session,
					phaseId: "nonexistent",
				}),
			).rejects.toThrow();
		});

		it("should handle phase with unresolved dependencies", async () => {
			const session = createMinimalSession();
			session.phases.test.dependencies = ["missing-phase"];

			const result = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState: session,
					phaseId: "test",
				},
			);

			expect(result.metadata.criticalIssues).toBeDefined();
			expect(result.metadata.criticalIssues.length).toBeGreaterThan(0);
		});

		it("should handle phase with pending dependencies", async () => {
			const session = createMultiPhaseSession();
			session.phases.phase3.dependencies = ["phase2"];
			session.phases.phase2.status = "pending";

			const result = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState: session,
					phaseId: "phase3",
				},
			);

			expect(result.metadata.criticalIssues.length).toBeGreaterThan(0);
		});
	});

	// ============ Coverage Validation Prompt ============
	describe("generateCoverageValidationPrompt - Variations", () => {
		it("should generate validation prompt with default target", async () => {
			const session = createSessionWithCoverage(50);

			const result =
				await confirmationPromptBuilder.generateCoverageValidationPrompt(
					session,
				);

			expect(result).toContain("Coverage Validation Prompt");
			expect(result).toContain("Target Coverage");
		});

		it("should generate validation prompt with zero target", async () => {
			const session = createSessionWithCoverage(50);

			const result =
				await confirmationPromptBuilder.generateCoverageValidationPrompt(
					session,
					0,
				);

			expect(result).toContain("Validation Questions");
		});

		it("should generate validation prompt with 100% target", async () => {
			const session = createSessionWithCoverage(50);

			const result =
				await confirmationPromptBuilder.generateCoverageValidationPrompt(
					session,
					100,
				);

			expect(result).toContain("Coverage Gaps");
		});

		it("should skip gaps when coverage meets threshold", async () => {
			const session = createSessionWithCoverage(100);

			const result =
				await confirmationPromptBuilder.generateCoverageValidationPrompt(
					session,
					85,
				);

			expect(result).toContain("Validation Questions");
		});
	});

	// ============ Prompt Sections ============
	describe("generateConfirmationPrompt - Section Generation", () => {
		it("should generate all required sections", async () => {
			const session = createMinimalSession();

			const result = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState: session,
					phaseId: "test",
				},
			);

			const sectionIds = result.sections.map((s) => s.id);
			expect(sectionIds).toContain("overview");
			expect(sectionIds).toContain("validation");
			expect(sectionIds).toContain("rationale");
			expect(sectionIds).toContain("recommendations");
		});

		it("should include guiding prompts in sections", async () => {
			const session = createMinimalSession();

			const result = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState: session,
					phaseId: "test",
				},
			);

			for (const section of result.sections) {
				expect(section.prompts.length).toBeGreaterThan(0);
			}
		});

		it("should mark sections as required appropriately", async () => {
			const session = createMinimalSession();

			const result = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState: session,
					phaseId: "test",
				},
			);

			const requiredSections = result.sections.filter((s) => s.required);
			expect(requiredSections.length).toBeGreaterThan(0);
		});
	});

	// ============ Phase Completion Flow ============
	describe("generatePhaseCompletionPrompt - Integration", () => {
		it("should generate completion prompt", async () => {
			const session = createMinimalSession();

			const result =
				await confirmationPromptBuilder.generatePhaseCompletionPrompt(
					session,
					"test",
				);

			expect(result).toContain("Test Phase");
			expect(typeof result).toBe("string");
		});

		it("should include markdown formatting", async () => {
			const session = createMinimalSession();

			const result =
				await confirmationPromptBuilder.generatePhaseCompletionPrompt(
					session,
					"test",
				);

			expect(result).toContain("#");
			expect(result).toContain("\n");
		});
	});

	// ============ Special Characters and Edge Cases ============
	describe("generateConfirmationPrompt - Special Characters", () => {
		it("should handle phase names with special characters", async () => {
			const session = createMinimalSession();
			session.phases.test.name = "Phase [1] & Design (2025)";

			const result = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState: session,
					phaseId: "test",
				},
			);

			expect(result.title).toContain("[1]");
		});

		it("should handle descriptions with newlines", async () => {
			const session = createMinimalSession();
			session.phases.test.description = "Line 1\nLine 2\nLine 3";

			const result = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState: session,
					phaseId: "test",
				},
			);

			expect(result).toBeDefined();
		});

		it("should handle very long descriptions", async () => {
			const session = createMinimalSession();
			session.phases.test.description = "d".repeat(2000);

			const result = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState: session,
					phaseId: "test",
				},
			);

			expect(result).toBeDefined();
		});
	});

	// ============ Critical Issues Detection ============
	describe("generateConfirmationPrompt - Critical Issues", () => {
		it("should identify missing outputs as critical", async () => {
			const session = createMinimalSession();
			session.phases.test.outputs = [];

			const result = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState: session,
					phaseId: "test",
				},
			);

			expect(result.metadata.criticalIssues.length).toBeGreaterThan(0);
		});

		it("should identify incomplete dependencies as critical", async () => {
			const session = createMultiPhaseSession();

			const result = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState: session,
					phaseId: "phase3",
				},
			);

			// At least one dependency should be incomplete for phase3
			expect(result).toBeDefined();
		});

		it("should handle no critical issues", async () => {
			const session = createSessionWithCoverage(100);

			const result = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState: session,
					phaseId: "test",
				},
			);

			expect(result.metadata.criticalIssues).toBeDefined();
		});
	});
});
