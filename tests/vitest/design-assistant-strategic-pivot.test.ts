// Test for design assistant integration with strategic pivot prompt builder
import { beforeEach, describe, expect, it } from "vitest";
import { designAssistant } from "../../tools/design/design-assistant";
import type {
	DesignAssistantRequest,
	DesignSessionConfig,
} from "../../tools/design/types";

describe("Design Assistant Strategic Pivot Integration", () => {
	beforeEach(async () => {
		await designAssistant.initialize();
	});

	const createTestConfig = (): DesignSessionConfig => ({
		sessionId: "test-strategic-pivot-integration",
		context: "Integration test for strategic pivot prompt functionality",
		goal: "Test strategic pivot prompt generation in design assistant",
		requirements: [
			"Validate strategic pivot prompt integration",
			"Test end-to-end workflow",
			"Ensure proper error handling",
		],
		constraints: [
			{
				id: "test-constraint-001",
				name: "Test Constraint",
				type: "technical",
				category: "testing",
				description: "Test constraint for integration testing",
				validation: { minCoverage: 80 },
				weight: 10,
				mandatory: true,
				source: "Integration Test",
			},
		],
		coverageThreshold: 85,
		enablePivots: true,
		templateRefs: ["design-process"],
		outputFormats: ["markdown"],
		metadata: { testType: "integration" },
	});

	it("should successfully start a session and generate strategic pivot prompt", async () => {
		const config = createTestConfig();

		// Start a design session
		const startRequest: DesignAssistantRequest = {
			action: "start-session",
			sessionId: config.sessionId,
			config,
		};

		const startResponse = await designAssistant.processRequest(startRequest);
		expect(startResponse.success).toBe(true);
		expect(startResponse.sessionId).toBe(config.sessionId);

		// Generate strategic pivot prompt
		const pivotRequest: DesignAssistantRequest = {
			action: "generate-strategic-pivot-prompt",
			sessionId: config.sessionId,
			content:
				"Complex architectural design with high uncertainty and technical debt",
			includeTemplates: true,
			includeSpace7Instructions: true,
			customInstructions: [
				"Focus on technical debt reduction",
				"Consider microservices architecture",
			],
		};

		const pivotResponse = await designAssistant.processRequest(pivotRequest);

		expect(pivotResponse.success).toBe(true);
		expect(pivotResponse.sessionId).toBe(config.sessionId);
		expect(pivotResponse.status).toMatch(
			/strategic-pivot-prompt-generated|monitoring/,
		);
		expect(pivotResponse.strategicPivotPrompt).toBeDefined();

		// Validate the strategic pivot prompt structure
		const strategicPrompt = pivotResponse.strategicPivotPrompt!;
		expect(strategicPrompt.success).toBe(true);
		expect(strategicPrompt.prompt).toContain("🔄 Strategic Pivot Guidance");
		expect(strategicPrompt.metadata).toBeDefined();
		expect(strategicPrompt.metadata.complexityScore).toBeGreaterThanOrEqual(0);
		expect(strategicPrompt.metadata.entropyLevel).toBeGreaterThanOrEqual(0);
		expect(strategicPrompt.nextSteps).toBeDefined();
		expect(strategicPrompt.conversationStarters).toHaveLength(6);
	});

	it("should handle strategic pivot prompt generation for monitoring scenarios", async () => {
		const config = createTestConfig();

		// Start a design session
		const startRequest: DesignAssistantRequest = {
			action: "start-session",
			sessionId: config.sessionId,
			config,
		};

		const startResponse = await designAssistant.processRequest(startRequest);
		expect(startResponse.success).toBe(true);

		// Generate strategic pivot prompt with low complexity content
		const pivotRequest: DesignAssistantRequest = {
			action: "generate-strategic-pivot-prompt",
			sessionId: config.sessionId,
			content:
				"Simple, well-defined architecture with clear requirements and low complexity",
			includeTemplates: false,
			includeSpace7Instructions: false,
		};

		const pivotResponse = await designAssistant.processRequest(pivotRequest);

		expect(pivotResponse.success).toBe(true);
		expect(pivotResponse.strategicPivotPrompt).toBeDefined();

		const strategicPrompt = pivotResponse.strategicPivotPrompt!;
		expect(strategicPrompt.metadata.templatesIncluded).toHaveLength(0);
		expect(strategicPrompt.metadata.space7Integration).toBe(false);

		// Verify that the prompt was generated successfully
		expect(strategicPrompt.success).toBe(true);
		expect(strategicPrompt.prompt).toContain("🔄 Strategic Pivot Guidance");
		expect(strategicPrompt.nextSteps.length).toBeGreaterThan(0);

		// Low complexity should result in monitoring guidance
		expect(strategicPrompt.metadata.complexityScore).toBeLessThan(50);
		expect(strategicPrompt.metadata.entropyLevel).toBeLessThan(50);
	});

	it("should handle error cases gracefully", async () => {
		// Test with non-existent session
		const pivotRequest: DesignAssistantRequest = {
			action: "generate-strategic-pivot-prompt",
			sessionId: "non-existent-session",
			content: "Test content",
		};

		const pivotResponse = await designAssistant.processRequest(pivotRequest);

		expect(pivotResponse.success).toBe(false);
		expect(pivotResponse.status).toBe("error");
		expect(pivotResponse.message).toContain("not found");
	});

	it("should require content for strategic pivot prompt generation", async () => {
		const config = createTestConfig();

		// Start a design session
		const startRequest: DesignAssistantRequest = {
			action: "start-session",
			sessionId: config.sessionId,
			config,
		};

		await designAssistant.processRequest(startRequest);

		// Try to generate strategic pivot prompt without content
		const pivotRequest: DesignAssistantRequest = {
			action: "generate-strategic-pivot-prompt",
			sessionId: config.sessionId,
			// content is missing
		};

		const pivotResponse = await designAssistant.processRequest(pivotRequest);

		expect(pivotResponse.success).toBe(false);
		expect(pivotResponse.status).toBe("error");
		expect(pivotResponse.message).toContain("Content is required");
	});

	it("should provide appropriate recommendations based on pivot decision", async () => {
		const config = createTestConfig();

		// Start a design session
		const startRequest: DesignAssistantRequest = {
			action: "start-session",
			sessionId: config.sessionId,
			config,
		};

		await designAssistant.processRequest(startRequest);

		// Generate strategic pivot prompt with high complexity content to trigger recommendations
		const pivotRequest: DesignAssistantRequest = {
			action: "generate-strategic-pivot-prompt",
			sessionId: config.sessionId,
			content:
				"Extremely complex system with multiple integrations, high uncertainty, technical debt, and scalability challenges requiring immediate architectural changes",
			includeTemplates: true,
			includeSpace7Instructions: true,
		};

		const pivotResponse = await designAssistant.processRequest(pivotRequest);

		expect(pivotResponse.success).toBe(true);
		expect(pivotResponse.recommendations).toBeDefined();
		expect(pivotResponse.recommendations.length).toBeGreaterThan(0);

		// Should suggest artifact generation for high complexity scenarios
		const hasArtifactRecommendation = pivotResponse.recommendations.some(
			(rec) =>
				rec.includes("ADR") ||
				rec.includes("roadmap") ||
				rec.includes("specification"),
		);

		if (
			pivotResponse.strategicPivotPrompt?.metadata.complexityScore &&
			pivotResponse.strategicPivotPrompt.metadata.complexityScore > 75
		) {
			expect(hasArtifactRecommendation).toBe(true);
		}
	});
});
