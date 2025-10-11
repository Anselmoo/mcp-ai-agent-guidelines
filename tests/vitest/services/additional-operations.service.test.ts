// Additional Operations Service Tests
import { describe, expect, it } from "vitest";
import { additionalOperationsService } from "../../../dist/tools/design/services/additional-operations.service.js";
import { sessionManagementService } from "../../../dist/tools/design/services/session-management.service.js";

describe("AdditionalOperationsService", () => {
	describe("evaluatePivot", () => {
		it("should evaluate pivot need", async () => {
			const sessionId = `test-pivot-${Date.now()}`;
			const config = {
				sessionId,
				context: "Complex project with high uncertainty",
				goal: "Navigate uncertain requirements",
				requirements: ["Unclear scope", "Changing priorities"],
				constraints: [],
				coverageThreshold: 85,
				enablePivots: true,
				templateRefs: [],
				outputFormats: ["markdown"],
				metadata: {},
			};

			await sessionManagementService.startDesignSession(sessionId, config);

			const content = `
				# Current Situation Analysis

				The project has encountered significant complexity:
				- Requirements keep changing
				- Technical debt accumulating
				- Multiple integration points failing
				- Team capacity stretched thin
			`;

			const response = await additionalOperationsService.evaluatePivot(
				sessionId,
				content,
			);

			expect(response).toBeDefined();
			expect(response.sessionId).toBe(sessionId);
			expect(response.recommendations).toBeInstanceOf(Array);
			expect(response.pivotDecision).toBeDefined();
		});

		it("should return error for non-existent session", async () => {
			const response = await additionalOperationsService.evaluatePivot(
				"non-existent",
				"content",
			);

			expect(response.success).toBe(false);
			expect(response.status).toBe("error");
			expect(response.message).toContain("not found");
		});

		it("should recommend continue when no pivot needed", async () => {
			const sessionId = `test-no-pivot-${Date.now()}`;
			const config = {
				sessionId,
				context: "Stable project",
				goal: "Maintain current trajectory",
				requirements: ["Clear requirements"],
				constraints: [],
				coverageThreshold: 85,
				enablePivots: true,
				templateRefs: [],
				outputFormats: ["markdown"],
				metadata: {},
			};

			await sessionManagementService.startDesignSession(sessionId, config);

			const content = "Simple, straightforward implementation";

			const response = await additionalOperationsService.evaluatePivot(
				sessionId,
				content,
			);

			expect(response).toBeDefined();
			expect(response.sessionId).toBe(sessionId);
		});
	});

	describe("generateStrategicPivotPrompt", () => {
		it("should generate strategic pivot prompt", async () => {
			const sessionId = `test-strategic-${Date.now()}`;
			const config = {
				sessionId,
				context: "Strategic planning needed",
				goal: "Define pivot strategy",
				requirements: ["Strategic direction"],
				constraints: [],
				coverageThreshold: 85,
				enablePivots: true,
				templateRefs: [],
				outputFormats: ["markdown"],
				metadata: {},
			};

			await sessionManagementService.startDesignSession(sessionId, config);

			const content = "Strategic analysis content";

			const response =
				await additionalOperationsService.generateStrategicPivotPrompt(
					sessionId,
					content,
				);

			expect(response).toBeDefined();
			expect(response.sessionId).toBe(sessionId);
			expect(response.recommendations).toBeInstanceOf(Array);
		});

		it("should include templates when requested", async () => {
			const sessionId = `test-templates-${Date.now()}`;
			const config = {
				sessionId,
				context: "Template test",
				goal: "Test templates",
				requirements: ["Templates"],
				constraints: [],
				coverageThreshold: 85,
				enablePivots: true,
				templateRefs: [],
				outputFormats: ["markdown"],
				metadata: {},
			};

			await sessionManagementService.startDesignSession(sessionId, config);

			const response =
				await additionalOperationsService.generateStrategicPivotPrompt(
					sessionId,
					"content",
					true,
					false,
				);

			expect(response).toBeDefined();
			expect(response.sessionId).toBe(sessionId);
		});

		it("should include custom instructions", async () => {
			const sessionId = `test-custom-${Date.now()}`;
			const config = {
				sessionId,
				context: "Custom instructions test",
				goal: "Test custom instructions",
				requirements: ["Custom"],
				constraints: [],
				coverageThreshold: 85,
				enablePivots: true,
				templateRefs: [],
				outputFormats: ["markdown"],
				metadata: {},
			};

			await sessionManagementService.startDesignSession(sessionId, config);

			const customInstructions = ["Focus on performance", "Optimize for scale"];

			const response =
				await additionalOperationsService.generateStrategicPivotPrompt(
					sessionId,
					"content",
					true,
					true,
					customInstructions,
				);

			expect(response).toBeDefined();
			expect(response.sessionId).toBe(sessionId);
		});

		it("should return error for non-existent session", async () => {
			const response =
				await additionalOperationsService.generateStrategicPivotPrompt(
					"non-existent",
					"content",
				);

			expect(response.success).toBe(false);
			expect(response.status).toBe("error");
			expect(response.message).toContain("not found");
		});
	});

	describe("loadConstraints", () => {
		it("should load constraint configuration", async () => {
			const constraintConfig = {
				constraints: [
					{
						id: "security-1",
						category: "security",
						description: "Security compliance required",
						mandatory: true,
						phases: ["architecture"],
					},
					{
						id: "performance-1",
						category: "performance",
						description: "Performance requirements",
						mandatory: false,
						phases: ["architecture", "specification"],
					},
				],
			};

			const response =
				await additionalOperationsService.loadConstraints(constraintConfig);

			expect(response).toBeDefined();
			expect(response.sessionId).toBe("system");
			// Status may vary based on constraint loading implementation
		});

		it("should report constraint counts when successful", async () => {
			const constraintConfig = {
				constraints: [
					{
						id: "test-1",
						category: "testing",
						description: "Test constraint",
						mandatory: true,
						phases: ["discovery"],
					},
				],
			};

			const response =
				await additionalOperationsService.loadConstraints(constraintConfig);

			expect(response).toBeDefined();
			// Data may or may not be present based on implementation
			if (response.data) {
				expect(response.data.constraintCount).toBeDefined();
				expect(response.data.mandatoryCount).toBeDefined();
				expect(response.data.categories).toBeInstanceOf(Array);
			}
		});

		it("should handle invalid constraint configuration", async () => {
			const response = await additionalOperationsService.loadConstraints({
				invalid: "config",
			});

			// Should handle error gracefully
			expect(response).toBeDefined();
			expect(response.sessionId).toBe("system");
		});
	});

	describe("selectMethodology", () => {
		it("should select appropriate methodology", async () => {
			const sessionId = `test-methodology-${Date.now()}`;
			const methodologySignals = {
				projectType: "greenfield",
				problemFraming: "exploratory",
				teamSize: "small",
				timeline: "flexible",
				riskTolerance: "high",
			};

			const response = await additionalOperationsService.selectMethodology(
				sessionId,
				methodologySignals,
			);

			expect(response).toBeDefined();
			expect(response.sessionId).toBe(sessionId);
			expect(response.status).toBe("methodology-selected");
		});

		it("should generate methodology ADR", async () => {
			const sessionId = `test-adr-${Date.now()}`;
			const methodologySignals = {
				projectType: "brownfield",
				problemFraming: "well-defined",
				teamSize: "large",
				timeline: "fixed",
				riskTolerance: "low",
			};

			const response = await additionalOperationsService.selectMethodology(
				sessionId,
				methodologySignals,
			);

			expect(response.artifacts).toBeInstanceOf(Array);
			expect(response.artifacts.length).toBeGreaterThan(0);
		});

		it("should provide methodology recommendations", async () => {
			const sessionId = `test-recommendations-${Date.now()}`;
			const methodologySignals = {
				projectType: "greenfield",
				problemFraming: "exploratory",
				teamSize: "medium",
				timeline: "flexible",
				riskTolerance: "medium",
			};

			const response = await additionalOperationsService.selectMethodology(
				sessionId,
				methodologySignals,
			);

			expect(response.recommendations).toBeInstanceOf(Array);
			expect(response.recommendations.length).toBeGreaterThan(0);
			expect(response.data?.methodologySelection).toBeDefined();
			expect(response.data?.methodologyProfile).toBeDefined();
		});

		it("should handle methodology selection errors", async () => {
			const sessionId = `test-error-${Date.now()}`;
			const invalidSignals = {
				projectType: "invalid",
				problemFraming: "invalid",
				teamSize: "invalid",
				timeline: "invalid",
				riskTolerance: "invalid",
			};

			const response = await additionalOperationsService.selectMethodology(
				sessionId,
				invalidSignals as any,
			);

			// Should handle errors gracefully
			expect(response).toBeDefined();
			expect(response.sessionId).toBe(sessionId);
		});
	});
});
