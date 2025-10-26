// Design Assistant Constraint Consistency Enforcement Integration Test
import { beforeEach, describe, expect, it } from "vitest";
import { designAssistant } from "../../src/tools/design/index.ts";

describe("Design Assistant - Constraint Consistency Enforcement Integration", () => {
	beforeEach(async () => {
		await designAssistant.initialize();
	});

	it("should enforce consistency through design assistant API", async () => {
		// First, start a session
		const startResponse = await designAssistant.processRequest({
			action: "start-session",
			sessionId: "consistency-integration-001",
			config: {
				sessionId: "consistency-integration-001",
				context: "Cross-session constraint consistency integration test",
				goal: "Test enforcement through design assistant API",
				requirements: [
					"Validate constraint consistency enforcement",
					"Ensure Space 7 alignment",
					"Generate interactive validation prompts",
				],
				constraints: [],
				coverageThreshold: 85,
				enablePivots: true,
				templateRefs: ["Space 7 General Instructions"],
				outputFormats: ["markdown"],
				metadata: {},
			},
		});

		expect(startResponse.success).toBe(true);
		expect(startResponse.sessionId).toBe("consistency-integration-001");

		// Now test the enforce-consistency action
		const consistencyResponse = await designAssistant.processRequest({
			action: "enforce-consistency",
			sessionId: "consistency-integration-001",
			content:
				"Testing cross-session constraint consistency enforcement through design assistant",
		});

		expect(consistencyResponse.success).toBe(true);
		expect(consistencyResponse.sessionId).toBe("consistency-integration-001");
		expect(consistencyResponse.status).toMatch(/consistency/);
		expect(consistencyResponse.message).toContain("consistency");
		expect(consistencyResponse.recommendations).toBeInstanceOf(Array);
		expect(consistencyResponse.artifacts).toBeInstanceOf(Array);
		expect(consistencyResponse.consistencyEnforcement).toBeDefined();

		// Verify consistency enforcement result structure
		const enforcement = consistencyResponse.consistencyEnforcement;
		expect(enforcement?.success).toBeDefined();
		expect(enforcement?.consistencyScore).toBeGreaterThanOrEqual(0);
		expect(enforcement?.enforcementActions).toBeInstanceOf(Array);
		expect(enforcement?.generatedArtifacts).toBeInstanceOf(Array);
		expect(enforcement?.interactivePrompts).toBeInstanceOf(Array);
		expect(enforcement?.recommendations).toBeInstanceOf(Array);
		expect(enforcement?.historicalAlignments).toBeInstanceOf(Array);
	});

	it("should enforce consistency for specific constraint", async () => {
		// Start a session first
		await designAssistant.processRequest({
			action: "start-session",
			sessionId: "specific-constraint-001",
			config: {
				sessionId: "specific-constraint-001",
				context: "Specific constraint enforcement test",
				goal: "Test constraint-specific enforcement",
				requirements: ["Test specific constraint validation"],
				constraints: [],
				coverageThreshold: 85,
				enablePivots: false,
				templateRefs: [],
				outputFormats: ["markdown"],
				metadata: {},
			},
		});

		// Test enforcement for a specific constraint
		const response = await designAssistant.processRequest({
			action: "enforce-consistency",
			sessionId: "specific-constraint-001",
			constraintId: "architectural.modularity",
			content: "Testing specific constraint consistency enforcement",
		});

		expect(response.success).toBe(true);
		expect(response.consistencyEnforcement).toBeDefined();
		expect(
			response.consistencyEnforcement?.consistencyScore,
		).toBeGreaterThanOrEqual(0);
	});

	it("should enforce consistency for specific phase", async () => {
		// Start a session first
		await designAssistant.processRequest({
			action: "start-session",
			sessionId: "specific-phase-001",
			config: {
				sessionId: "specific-phase-001",
				context: "Specific phase enforcement test",
				goal: "Test phase-specific enforcement",
				requirements: ["Test phase-specific validation"],
				constraints: [],
				coverageThreshold: 85,
				enablePivots: false,
				templateRefs: [],
				outputFormats: ["markdown"],
				metadata: {},
			},
		});

		// Test enforcement for a specific phase
		const response = await designAssistant.processRequest({
			action: "enforce-consistency",
			sessionId: "specific-phase-001",
			phaseId: "requirements",
			content: "Testing requirements phase consistency enforcement",
		});

		expect(response.success).toBe(true);
		expect(response.consistencyEnforcement).toBeDefined();
		expect(
			response.consistencyEnforcement?.consistencyScore,
		).toBeGreaterThanOrEqual(0);
	});

	it("should handle missing session gracefully", async () => {
		const response = await designAssistant.processRequest({
			action: "enforce-consistency",
			sessionId: "non-existent-session",
			content: "Testing error handling for missing session",
		});

		expect(response.success).toBe(false);
		expect(response.status).toBe("error");
		expect(response.message).toContain("not found");
		expect(response.recommendations).toContain("Start a new session");
	});

	it("should work with multiple sessions for cross-session consistency", async () => {
		// Start first session
		const firstSession = await designAssistant.processRequest({
			action: "start-session",
			sessionId: "cross-session-first",
			config: {
				sessionId: "cross-session-first",
				context: "First session for cross-session testing",
				goal: "Establish constraint patterns",
				requirements: ["Define initial constraint usage patterns"],
				constraints: [],
				coverageThreshold: 85,
				enablePivots: false,
				templateRefs: [],
				outputFormats: ["markdown"],
				metadata: {},
			},
		});

		expect(firstSession.success).toBe(true);

		// Enforce consistency for first session
		const firstEnforcement = await designAssistant.processRequest({
			action: "enforce-consistency",
			sessionId: "cross-session-first",
			content: "Establishing initial constraint patterns",
		});

		expect(firstEnforcement.success).toBe(true);

		// Start second session
		const secondSession = await designAssistant.processRequest({
			action: "start-session",
			sessionId: "cross-session-second",
			config: {
				sessionId: "cross-session-second",
				context: "Second session for cross-session testing",
				goal: "Test consistency with previous session",
				requirements: ["Validate consistency with first session"],
				constraints: [],
				coverageThreshold: 85,
				enablePivots: false,
				templateRefs: [],
				outputFormats: ["markdown"],
				metadata: {},
			},
		});

		expect(secondSession.success).toBe(true);

		// Enforce consistency for second session (should check against first)
		const secondEnforcement = await designAssistant.processRequest({
			action: "enforce-consistency",
			sessionId: "cross-session-second",
			content: "Testing consistency against previous session patterns",
		});

		expect(secondEnforcement.success).toBe(true);
		expect(secondEnforcement.consistencyEnforcement).toBeDefined();
		expect(
			secondEnforcement.consistencyEnforcement?.consistencyScore,
		).toBeGreaterThanOrEqual(0);
	});

	it("should integrate with existing design assistant features", async () => {
		// Start a session
		const startResponse = await designAssistant.processRequest({
			action: "start-session",
			sessionId: "integration-test-001",
			config: {
				sessionId: "integration-test-001",
				context: "Integration test for all design assistant features",
				goal: "Test consistency enforcement with other features",
				requirements: [
					"Ensure consistency enforcement works with coverage enforcement",
					"Validate integration with phase validation",
				],
				constraints: [],
				coverageThreshold: 85,
				enablePivots: true,
				templateRefs: ["Space 7 General Instructions"],
				outputFormats: ["markdown", "mermaid"],
				metadata: {},
			},
		});

		expect(startResponse.success).toBe(true);

		// Test status retrieval
		const statusResponse = await designAssistant.processRequest({
			action: "get-status",
			sessionId: "integration-test-001",
		});

		expect(statusResponse.success).toBe(true);

		// Test consistency enforcement
		const consistencyResponse = await designAssistant.processRequest({
			action: "enforce-consistency",
			sessionId: "integration-test-001",
			content: "Integration test content with multiple features",
		});

		expect(consistencyResponse.success).toBe(true);
		expect(consistencyResponse.consistencyEnforcement).toBeDefined();

		// Test coverage enforcement (should work alongside consistency)
		const coverageResponse = await designAssistant.processRequest({
			action: "enforce-coverage",
			sessionId: "integration-test-001",
			content: "Integration test content for coverage enforcement",
		});

		expect(coverageResponse.success).toBeDefined(); // May pass or fail based on coverage, but should not error
	});
});
