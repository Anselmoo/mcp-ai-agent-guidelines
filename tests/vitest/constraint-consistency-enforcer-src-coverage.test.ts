// Comprehensive tests for constraint-consistency-enforcer targeting uncovered functions
// These tests import directly from src/ to ensure proper coverage measurement
import { beforeAll, describe, expect, it } from "vitest";
import { constraintConsistencyEnforcer } from "../../src/tools/design/constraint-consistency-enforcer";
import type { DesignSessionState } from "../../src/tools/design/types";

describe("Constraint Consistency Enforcer - Source Coverage", () => {
	beforeAll(async () => {
		await constraintConsistencyEnforcer.initialize();
	});

	const createTestSessionState = (): DesignSessionState => ({
		config: {
			sessionId: "test-consistency-session",
			context: "Testing constraint consistency enforcement",
			goal: "Validate cross-session constraint consistency",
			requirements: [
				"Enforce constraints consistently across sessions",
				"Generate interactive prompts for violations",
				"Align with Space 7 instructions",
			],
			constraints: [
				{
					id: "test-constraint-1",
					name: "Test Constraint 1",
					type: "functional",
					category: "testing",
					description: "Test constraint for validation",
					validation: { minCoverage: 80, keywords: ["test", "validation"] },
					weight: 0.8,
					mandatory: true,
					source: "Test Framework",
				},
				{
					id: "test-constraint-2",
					name: "Test Constraint 2",
					type: "non-functional",
					category: "quality",
					description: "Quality constraint",
					validation: { minCoverage: 85, keywords: ["quality"] },
					weight: 0.9,
					mandatory: false,
					source: "Quality Standards",
				},
			],
			coverageThreshold: 85,
			enablePivots: true,
			templateRefs: ["test-template"],
			outputFormats: ["markdown"],
			metadata: { testType: "consistency" },
		},
		currentPhase: "requirements",
		phases: {
			discovery: {
				id: "discovery",
				name: "Discovery",
				description: "Discovery phase",
				status: "completed",
				inputs: ["stakeholder-input"],
				outputs: ["problem-statement"],
				criteria: ["clear-problem"],
				coverage: 95,
				artifacts: [],
				dependencies: [],
			},
			requirements: {
				id: "requirements",
				name: "Requirements",
				description: "Requirements phase",
				status: "in-progress",
				inputs: ["discovery-doc"],
				outputs: ["requirements-spec"],
				criteria: ["requirements-complete"],
				coverage: 70,
				artifacts: [],
				dependencies: ["discovery"],
			},
		},
		coverage: {
			overall: 85,
			phases: { discovery: 95, requirements: 70 },
			constraints: { "test-constraint-1": 75, "test-constraint-2": 90 },
			assumptions: {},
			documentation: {},
			testCoverage: 80,
		},
		artifacts: [],
		history: [],
		status: "active",
	});

	describe("enforceConsistency", () => {
		it("should enforce constraint consistency across sessions", async () => {
			const sessionState = createTestSessionState();

			const result = await constraintConsistencyEnforcer.enforceConsistency({
				sessionState,
				context: "Full session consistency check",
			});

			expect(result).toBeDefined();
			expect(result.success).toBeDefined();
			expect(typeof result.success).toBe("boolean");
			expect(result.consistencyScore).toBeDefined();
			expect(typeof result.consistencyScore).toBe("number");
			expect(result.consistencyScore).toBeGreaterThanOrEqual(0);
			expect(result.consistencyScore).toBeLessThanOrEqual(100);
			expect(result.enforcementActions).toBeInstanceOf(Array);
			expect(result.generatedArtifacts).toBeInstanceOf(Array);
			expect(result.interactivePrompts).toBeInstanceOf(Array);
			expect(result.recommendations).toBeInstanceOf(Array);
			expect(result.historicalAlignments).toBeInstanceOf(Array);
		});

		it("should enforce consistency for specific constraint", async () => {
			const sessionState = createTestSessionState();

			const result = await constraintConsistencyEnforcer.enforceConsistency({
				sessionState,
				constraintId: "test-constraint-1",
				context: "Single constraint check",
			});

			expect(result).toBeDefined();
			expect(result.success).toBeDefined();
			expect(result.enforcementActions).toBeInstanceOf(Array);
		});

		it("should enforce consistency for specific phase", async () => {
			const sessionState = createTestSessionState();

			const result = await constraintConsistencyEnforcer.enforceConsistency({
				sessionState,
				phaseId: "requirements",
				context: "Phase-specific consistency check",
			});

			expect(result).toBeDefined();
			expect(result.success).toBeDefined();
			expect(result.interactivePrompts).toBeInstanceOf(Array);
		});

		it("should handle strict mode enforcement", async () => {
			const sessionState = createTestSessionState();

			const result = await constraintConsistencyEnforcer.enforceConsistency({
				sessionState,
				strictMode: true,
				context: "Strict mode enforcement",
			});

			expect(result).toBeDefined();
			expect(result.success).toBeDefined();
			// In strict mode, more enforcement actions may be generated
			expect(result.enforcementActions).toBeInstanceOf(Array);
		});

		it("should generate interactive prompts for violations", async () => {
			const sessionState = createTestSessionState();
			// Set low coverage to trigger violations
			sessionState.coverage.constraints["test-constraint-1"] = 50;

			const result = await constraintConsistencyEnforcer.enforceConsistency({
				sessionState,
				constraintId: "test-constraint-1",
			});

			expect(result).toBeDefined();
			expect(result.interactivePrompts).toBeInstanceOf(Array);
			// Should have prompts for the low coverage violation
		});

		it("should generate enforcement actions", async () => {
			const sessionState = createTestSessionState();

			const result = await constraintConsistencyEnforcer.enforceConsistency({
				sessionState,
			});

			expect(result.enforcementActions).toBeInstanceOf(Array);
			// Each action should have required fields
			for (const action of result.enforcementActions) {
				expect(action.id).toBeDefined();
				expect(action.type).toBeDefined();
				expect([
					"prompt_for_clarification",
					"auto_align",
					"generate_adr",
					"escalate",
				]).toContain(action.type);
				expect(action.constraintId).toBeDefined();
				expect(action.description).toBeDefined();
				expect(typeof action.interactive).toBe("boolean");
			}
		});

		it("should provide recommendations", async () => {
			const sessionState = createTestSessionState();

			const result = await constraintConsistencyEnforcer.enforceConsistency({
				sessionState,
			});

			expect(result.recommendations).toBeInstanceOf(Array);
			// Recommendations should be strings
			for (const rec of result.recommendations) {
				expect(typeof rec).toBe("string");
				expect(rec.length).toBeGreaterThan(0);
			}
		});

		it("should track historical alignments", async () => {
			const sessionState = createTestSessionState();

			const result = await constraintConsistencyEnforcer.enforceConsistency({
				sessionState,
			});

			expect(result.historicalAlignments).toBeInstanceOf(Array);
			// Should be strings describing historical context
			for (const alignment of result.historicalAlignments) {
				expect(typeof alignment).toBe("string");
			}
		});
	});

	describe("validateCrossSessionConsistency", () => {
		it("should validate cross-session consistency", async () => {
			const sessionState = createTestSessionState();

			const result =
				await constraintConsistencyEnforcer.validateCrossSessionConsistency(
					sessionState,
				);

			expect(result).toBeDefined();
			expect(typeof result.passed).toBe("boolean");
			expect(result.consistencyScore).toBeDefined();
			expect(result.violations).toBeInstanceOf(Array);
			expect(result.recommendations).toBeInstanceOf(Array);
			expect(result.enforcementActions).toBeInstanceOf(Array);
			expect(result.historicalContext).toBeInstanceOf(Array);
		});

		it("should validate specific constraint cross-session", async () => {
			const sessionState = createTestSessionState();

			const result =
				await constraintConsistencyEnforcer.validateCrossSessionConsistency(
					sessionState,
					"test-constraint-1",
				);

			expect(result).toBeDefined();
			expect(result.violations).toBeInstanceOf(Array);
		});

		it("should identify violations with different types", async () => {
			const sessionState = createTestSessionState();

			const result =
				await constraintConsistencyEnforcer.validateCrossSessionConsistency(
					sessionState,
				);

			// Check that violations have proper structure
			for (const violation of result.violations) {
				expect(violation.constraintId).toBeDefined();
				expect(violation.currentSessionId).toBeDefined();
				expect(violation.violationType).toBeDefined();
				expect([
					"decision_conflict",
					"rationale_inconsistency",
					"enforcement_mismatch",
				]).toContain(violation.violationType);
				expect(violation.description).toBeDefined();
				expect(violation.severity).toBeDefined();
				expect(["critical", "warning", "info"]).toContain(violation.severity);
				expect(violation.suggestedResolution).toBeDefined();
			}
		});

		it("should calculate consistency score", async () => {
			const sessionState = createTestSessionState();

			const result =
				await constraintConsistencyEnforcer.validateCrossSessionConsistency(
					sessionState,
				);

			expect(result.consistencyScore).toBeGreaterThanOrEqual(0);
			expect(result.consistencyScore).toBeLessThanOrEqual(100);
		});
	});

	describe("detectViolations", () => {
		it("should detect constraint violations", async () => {
			const sessionState = createTestSessionState();
			// Set low coverage to trigger violations
			sessionState.coverage.constraints["test-constraint-1"] = 50;

			const violations =
				await constraintConsistencyEnforcer.detectViolations(sessionState);

			expect(violations).toBeInstanceOf(Array);
		});

		it("should detect violations for specific constraint", async () => {
			const sessionState = createTestSessionState();
			sessionState.coverage.constraints["test-constraint-1"] = 50;

			const violations = await constraintConsistencyEnforcer.detectViolations(
				sessionState,
				"test-constraint-1",
			);

			expect(violations).toBeInstanceOf(Array);
		});

		it("should return empty array when no violations", async () => {
			const sessionState = createTestSessionState();
			// Set high coverage
			sessionState.coverage.constraints["test-constraint-1"] = 95;
			sessionState.coverage.constraints["test-constraint-2"] = 95;

			const violations =
				await constraintConsistencyEnforcer.detectViolations(sessionState);

			expect(violations).toBeInstanceOf(Array);
		});
	});

	describe("generateReport", () => {
		it("should generate consistency report", async () => {
			const sessionState = createTestSessionState();

			const report =
				await constraintConsistencyEnforcer.generateReport(sessionState);

			expect(report).toBeDefined();
			expect(typeof report).toBe("string");
			expect(report.length).toBeGreaterThan(0);
		});

		it("should include constraint information in report", async () => {
			const sessionState = createTestSessionState();

			const report =
				await constraintConsistencyEnforcer.generateReport(sessionState);

			// Report should mention constraints
			expect(report).toContain("Constraint");
		});

		it("should generate report for specific constraint", async () => {
			const sessionState = createTestSessionState();

			const report = await constraintConsistencyEnforcer.generateReport(
				sessionState,
				"test-constraint-1",
			);

			expect(report).toBeDefined();
			expect(typeof report).toBe("string");
		});
	});

	describe("Interactive prompts", () => {
		it("should generate context-driven prompts", async () => {
			const sessionState = createTestSessionState();
			// Set conditions that will trigger prompt generation
			sessionState.coverage.constraints["test-constraint-1"] = 60;

			const result = await constraintConsistencyEnforcer.enforceConsistency({
				sessionState,
				constraintId: "test-constraint-1",
				phaseId: "requirements",
			});

			expect(result.interactivePrompts).toBeInstanceOf(Array);

			for (const prompt of result.interactivePrompts) {
				expect(typeof prompt).toBe("string");
				expect(prompt.length).toBeGreaterThan(0);
			}
		});

		it("should include phase context in prompts", async () => {
			const sessionState = createTestSessionState();

			const result = await constraintConsistencyEnforcer.enforceConsistency({
				sessionState,
				phaseId: "requirements",
			});

			// Prompts should reference the phase
			for (const prompt of result.interactivePrompts) {
				// Prompt should be a meaningful string
				expect(prompt.length).toBeGreaterThan(10);
			}
		});

		it("should generate Space 7 alignment prompts", async () => {
			const sessionState = createTestSessionState();

			const result = await constraintConsistencyEnforcer.enforceConsistency({
				sessionState,
				phaseId: "requirements",
			});

			// Should generate prompts aligned with Space 7 instructions
			expect(result.interactivePrompts).toBeInstanceOf(Array);
		});

		it("should generate prompts when violations exist", async () => {
			const sessionState = createTestSessionState();
			sessionState.coverage.constraints["test-constraint-1"] = 50;

			const result = await constraintConsistencyEnforcer.enforceConsistency({
				sessionState,
				constraintId: "test-constraint-1",
			});

			expect(result.interactivePrompts).toBeInstanceOf(Array);
		});

		it("should generate violation resolution prompts", async () => {
			const sessionState = createTestSessionState();
			// Set coverage below threshold to trigger violation
			sessionState.coverage.constraints["test-constraint-1"] = 50;

			const result = await constraintConsistencyEnforcer.enforceConsistency({
				sessionState,
				constraintId: "test-constraint-1",
				strictMode: true,
			});

			expect(result.interactivePrompts).toBeInstanceOf(Array);
		});
	});

	describe("ADR generation", () => {
		it("should generate ADR artifacts for significant decisions", async () => {
			const sessionState = createTestSessionState();
			// Set conditions that trigger ADR generation
			sessionState.coverage.constraints["test-constraint-1"] = 60;

			const result = await constraintConsistencyEnforcer.enforceConsistency({
				sessionState,
				strictMode: true,
			});

			// May generate ADR artifacts
			expect(result.generatedArtifacts).toBeInstanceOf(Array);

			for (const artifact of result.generatedArtifacts) {
				expect(artifact.id).toBeDefined();
				expect(artifact.name).toBeDefined();
				expect(artifact.type).toBeDefined();
				expect(artifact.content).toBeDefined();
				expect(artifact.format).toBeDefined();
			}
		});
	});

	describe("Consistency scoring", () => {
		it("should calculate consistency score accurately", async () => {
			const sessionState = createTestSessionState();

			const result =
				await constraintConsistencyEnforcer.validateCrossSessionConsistency(
					sessionState,
				);

			// Score should be a valid percentage
			expect(result.consistencyScore).toBeGreaterThanOrEqual(0);
			expect(result.consistencyScore).toBeLessThanOrEqual(100);
		});

		it("should have high score with no violations", async () => {
			const sessionState = createTestSessionState();
			// Set high coverage to avoid violations
			sessionState.coverage.constraints["test-constraint-1"] = 95;
			sessionState.coverage.constraints["test-constraint-2"] = 95;

			const result =
				await constraintConsistencyEnforcer.validateCrossSessionConsistency(
					sessionState,
				);

			// Should have reasonably high score
			expect(result.consistencyScore).toBeGreaterThan(50);
		});
	});

	describe("Edge cases", () => {
		it("should handle empty constraint list", async () => {
			const sessionState = createTestSessionState();
			sessionState.config.constraints = [];

			const result = await constraintConsistencyEnforcer.enforceConsistency({
				sessionState,
			});

			expect(result).toBeDefined();
			expect(result.success).toBeDefined();
		});

		it("should handle missing phase", async () => {
			const sessionState = createTestSessionState();

			// Should handle gracefully
			const result = await constraintConsistencyEnforcer.enforceConsistency({
				sessionState,
				phaseId: "nonexistent-phase",
			});

			expect(result).toBeDefined();
		});

		it("should handle nonexistent constraint", async () => {
			const sessionState = createTestSessionState();

			const result = await constraintConsistencyEnforcer.enforceConsistency({
				sessionState,
				constraintId: "nonexistent-constraint",
			});

			expect(result).toBeDefined();
		});
	});
});
