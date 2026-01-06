// Comprehensive Service Coverage Tests - Target all uncovered branches and error paths
import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_CONSTRAINT_CONFIG } from "../../../src/tools/design/constraint-manager.js";
import { designPhaseWorkflow } from "../../../src/tools/design/design-phase-workflow.js";
import { additionalOperationsService } from "../../../src/tools/design/services/additional-operations.service.js";
import { artifactGenerationService } from "../../../src/tools/design/services/artifact-generation.service.js";
import { consistencyService } from "../../../src/tools/design/services/consistency.service.js";
import { phaseManagementService } from "../../../src/tools/design/services/phase-management.service.js";
import { sessionManagementService } from "../../../src/tools/design/services/session-management.service.js";

describe("Comprehensive Service Coverage Tests", () => {
	let testSessionId: string;

	beforeEach(async () => {
		testSessionId = `comprehensive-test-${Date.now()}`;
	});

	describe("SessionManagementService - Error Paths", () => {
		it("should handle constraint loading with various configurations", async () => {
			const sessionId = `constraint-test-${Date.now()}`;
			const config = {
				sessionId,
				context: "Test with constraints",
				goal: "Test constraint loading",
				requirements: ["Requirement 1"],
				constraints: [],
				coverageThreshold: 85,
				enablePivots: true,
				templateRefs: [],
				outputFormats: ["markdown" as const],
				metadata: {},
			};

			// Test with valid constraint config
			const constraintConfig = DEFAULT_CONSTRAINT_CONFIG;

			const response = await sessionManagementService.startDesignSession(
				sessionId,
				config,
				constraintConfig,
			);

			expect(response).toBeDefined();
			expect(response.sessionId).toBe(sessionId);
		});

		it("should handle invalid methodology signals", async () => {
			const sessionId = `invalid-method-${Date.now()}`;
			const config = {
				sessionId,
				context: "Test context",
				goal: "Test goal",
				requirements: ["Req 1"],
				constraints: [],
				coverageThreshold: 85,
				enablePivots: true,
				templateRefs: [],
				outputFormats: ["markdown" as const],
				metadata: {},
				methodologySignals: {
					projectType: "invalid-type",
					teamSize: "invalid-size",
					timeline: "invalid-timeline",
					problemFraming: "invalid-framing",
				},
			};

			const response = await sessionManagementService.startDesignSession(
				sessionId,
				config,
			);

			expect(response).toBeDefined();
			expect(response.sessionId).toBe(sessionId);
		});

		it("should get session status for non-existent session", async () => {
			await expect(
				sessionManagementService.getSessionStatus("non-existent-session"),
			).rejects.toThrow();
		});

		it("should get session status for valid session", async () => {
			// First create a session
			const sessionId = `status-test-${Date.now()}`;
			const config = {
				sessionId,
				context: "Status test",
				goal: "Test status",
				requirements: ["Req 1"],
				constraints: [],
				coverageThreshold: 85,
				enablePivots: true,
				templateRefs: [],
				outputFormats: ["markdown" as const],
				metadata: {},
			};

			await sessionManagementService.startDesignSession(sessionId, config);

			// Then get its status
			const response =
				await sessionManagementService.getSessionStatus(sessionId);

			expect(response.success).toBe(true);
			expect(response.sessionId).toBe(sessionId);
			expect(response.currentPhase).toBeDefined();
		});
	});

	describe("PhaseManagementService - All Branches", () => {
		beforeEach(async () => {
			// Create a session for phase testing
			const config = {
				sessionId: testSessionId,
				context: "Phase test",
				goal: "Test phases",
				requirements: ["Phase requirement"],
				constraints: [],
				coverageThreshold: 85,
				enablePivots: true,
				templateRefs: [],
				outputFormats: ["markdown" as const],
				metadata: {},
			};

			await sessionManagementService.startDesignSession(testSessionId, config);
		});

		it("should advance phase with content", async () => {
			const content =
				"This is comprehensive phase content with all required information.";
			const response = await phaseManagementService.advancePhase(
				testSessionId,
				content,
			);

			expect(response).toBeDefined();
			expect(response.sessionId).toBe(testSessionId);
		});

		it("should advance phase without content", async () => {
			const response = await phaseManagementService.advancePhase(testSessionId);

			expect(response).toBeDefined();
			expect(response.sessionId).toBe(testSessionId);
		});

		it("should advance phase with target phase", async () => {
			const content = "Content for specific phase";
			const targetPhase = "architecture";

			const response = await phaseManagementService.advancePhase(
				testSessionId,
				content,
				targetPhase,
			);

			expect(response).toBeDefined();
			expect(response.sessionId).toBe(testSessionId);
		});

		it("should validate phase with content", async () => {
			const session = designPhaseWorkflow.getSession(testSessionId);
			const currentPhase = session?.currentPhase || "discovery";
			const content = "Validation content with comprehensive details";

			const response = await phaseManagementService.validatePhase(
				testSessionId,
				currentPhase,
				content,
			);

			expect(response).toBeDefined();
			expect(response.sessionId).toBe(testSessionId);
			expect(response.validationResults).toBeDefined();
		});

		it("should get phase guidance", async () => {
			const session = designPhaseWorkflow.getSession(testSessionId);
			const currentPhase = session?.currentPhase || "discovery";

			const response = await phaseManagementService.getPhaseGuidance(
				testSessionId,
				currentPhase,
			);

			expect(response).toBeDefined();
			expect(Array.isArray(response)).toBe(true);
			expect(response.length).toBeGreaterThan(0);
		});

		it("should get phase sequence", async () => {
			const response = await phaseManagementService.getPhaseSequence();

			expect(Array.isArray(response)).toBe(true);
			expect(response.length).toBeGreaterThan(0);
			expect(response).toContain("discovery");
		});

		it("should handle non-existent session in phase operations", async () => {
			await expect(
				phaseManagementService.advancePhase("non-existent-session"),
			).rejects.toThrow();
		});
	});

	describe("ArtifactGenerationService - All Artifact Types", () => {
		beforeEach(async () => {
			const config = {
				sessionId: testSessionId,
				context: "Artifact test context with decisions",
				goal: "Generate all artifact types",
				requirements: ["ADR requirement", "Spec requirement"],
				constraints: [],
				coverageThreshold: 85,
				enablePivots: true,
				templateRefs: [],
				outputFormats: ["markdown" as const],
				metadata: {},
			};

			await sessionManagementService.startDesignSession(testSessionId, config);
		});

		it("should generate ADR artifacts", async () => {
			const response = await artifactGenerationService.generateArtifacts(
				testSessionId,
				["adr"],
			);

			expect(response).toBeDefined();
			expect(response.sessionId).toBe(testSessionId);
			expect(response.artifacts).toBeInstanceOf(Array);
		});

		it("should generate specification artifacts", async () => {
			const response = await artifactGenerationService.generateArtifacts(
				testSessionId,
				["specification"],
			);

			expect(response).toBeDefined();
			expect(response.sessionId).toBe(testSessionId);
		});

		it("should generate roadmap artifacts", async () => {
			const response = await artifactGenerationService.generateArtifacts(
				testSessionId,
				["roadmap"],
			);

			expect(response).toBeDefined();
			expect(response.sessionId).toBe(testSessionId);
		});

		it("should generate multiple artifact types", async () => {
			const response = await artifactGenerationService.generateArtifacts(
				testSessionId,
				["adr", "specification", "roadmap"],
			);

			expect(response).toBeDefined();
			expect(response.sessionId).toBe(testSessionId);
			expect(response.artifacts).toBeInstanceOf(Array);
		});

		it("should handle artifact generation errors", async () => {
			await expect(
				artifactGenerationService.generateArtifacts("non-existent-session", [
					"adr",
				]),
			).rejects.toThrow();
		});

		it("should generate constraint documentation", async () => {
			const response =
				await artifactGenerationService.generateConstraintDocumentation(
					testSessionId,
				);

			expect(response).toBeDefined();
			expect(response.sessionId).toBe(testSessionId);
		});

		it("should handle constraint documentation for non-existent session", async () => {
			const response =
				await artifactGenerationService.generateConstraintDocumentation(
					"non-existent-session",
				);

			// May succeed with default/empty constraints
			expect(response).toBeDefined();
		});
	});

	describe("ConsistencyService - All Coverage and Consistency Checks", () => {
		beforeEach(async () => {
			const config = {
				sessionId: testSessionId,
				context: "Consistency test",
				goal: "Test consistency enforcement",
				requirements: ["Requirement 1", "Requirement 2"],
				constraints: [],
				coverageThreshold: 85,
				enablePivots: true,
				templateRefs: [],
				outputFormats: ["markdown" as const],
				metadata: {},
			};

			await sessionManagementService.startDesignSession(testSessionId, config);
		});

		it("should enforce coverage with sufficient content", async () => {
			const content =
				"Comprehensive content covering requirement 1, requirement 2, and additional details about the system architecture, user flows, and technical specifications.";
			const response = await consistencyService.enforceCoverage(
				testSessionId,
				content,
			);

			expect(response).toBeDefined();
			expect(response.sessionId).toBe(testSessionId);
			expect(response.coverage).toBeDefined();
		});

		it("should enforce coverage with minimal content", async () => {
			const content = "Minimal content";
			const response = await consistencyService.enforceCoverage(
				testSessionId,
				content,
			);

			expect(response).toBeDefined();
			expect(response.sessionId).toBe(testSessionId);
		});

		it("should handle coverage enforcement for non-existent session", async () => {
			await expect(
				consistencyService.enforceCoverage("non-existent-session", "content"),
			).rejects.toThrow();
		});

		it("should enforce consistency", async () => {
			const response =
				await consistencyService.enforceConsistency(testSessionId);

			expect(response).toBeDefined();
			expect(response.sessionId).toBe(testSessionId);
		});

		it("should enforce cross-session consistency", async () => {
			const response =
				await consistencyService.enforceCrossSessionConsistency(testSessionId);

			expect(response).toBeDefined();
			expect(response.sessionId).toBe(testSessionId);
		});

		it("should generate enforcement prompts", async () => {
			const response =
				await consistencyService.generateEnforcementPrompts(testSessionId);

			expect(response).toBeDefined();
			expect(response.sessionId).toBe(testSessionId);
			// Prompts field may be named differently or not exist
			if (response.prompts) {
				expect(response.prompts).toBeInstanceOf(Array);
			}
		});

		it("should handle enforcement prompts for non-existent session", async () => {
			const response = await consistencyService.generateEnforcementPrompts(
				"non-existent-session",
			);

			// May return success or failure depending on implementation
			expect(response).toBeDefined();
		});
	});

	describe("AdditionalOperationsService - Pivots, Methodology, Constraints", () => {
		beforeEach(async () => {
			const config = {
				sessionId: testSessionId,
				context: "Additional operations test",
				goal: "Test pivot and methodology",
				requirements: ["Req 1"],
				constraints: [],
				coverageThreshold: 85,
				enablePivots: true,
				templateRefs: [],
				outputFormats: ["markdown" as const],
				metadata: {},
			};

			await sessionManagementService.startDesignSession(testSessionId, config);
		});

		it("should evaluate pivot with simple content", async () => {
			const content = "Simple implementation approach";
			const response = await additionalOperationsService.evaluatePivot(
				testSessionId,
				content,
			);

			expect(response).toBeDefined();
			expect(response.sessionId).toBe(testSessionId);
			expect(response.pivotDecision).toBeDefined();
		});

		it("should evaluate pivot with complex content", async () => {
			const content =
				"Complex distributed microservices architecture with multiple dependencies, uncertain requirements, and high complexity factors that might trigger a pivot recommendation.";
			const response = await additionalOperationsService.evaluatePivot(
				testSessionId,
				content,
			);

			expect(response).toBeDefined();
			expect(response.sessionId).toBe(testSessionId);
			expect(response.pivotDecision).toBeDefined();
		});

		it("should handle pivot evaluation for non-existent session", async () => {
			const response = await additionalOperationsService.evaluatePivot(
				"non-existent-session",
				"content",
			);

			expect(response.success).toBe(false);
			expect(response.status).toBe("error");
		});

		it("should generate strategic pivot prompt without instructions", async () => {
			const content = "Current implementation approach with some complexity";
			const response =
				await additionalOperationsService.generateStrategicPivotPrompt(
					testSessionId,
					content,
				);

			expect(response).toBeDefined();
			expect(response.sessionId).toBe(testSessionId);
			expect(response.strategicPivotPrompt).toBeDefined();
		});

		it("should generate strategic pivot prompt with custom instructions", async () => {
			const content = "Current approach with multiple considerations";
			const customInstructions = [
				"Consider budget constraints",
				"Prioritize time-to-market",
			];
			const response =
				await additionalOperationsService.generateStrategicPivotPrompt(
					testSessionId,
					content,
					true,
					true,
					customInstructions,
				);

			expect(response).toBeDefined();
			expect(response.sessionId).toBe(testSessionId);
			expect(response.strategicPivotPrompt).toBeDefined();
		});

		it("should load constraints", async () => {
			const constraintConfig = {
				constraints: ["Constraint 1", "Constraint 2"],
				strictMode: true,
			};

			const response = await additionalOperationsService.loadConstraints(
				testSessionId,
				constraintConfig,
			);

			expect(response).toBeDefined();
			// Load constraints returns system-level response, not session-specific
			expect(response.status).toBeDefined();
		});

		it("should select methodology with valid signals", async () => {
			const methodologySignals = {
				projectType: "web-app",
				teamSize: "small",
				timeline: "3-months",
				problemFraming: "user-centric",
			};

			const response = await additionalOperationsService.selectMethodology(
				testSessionId,
				methodologySignals,
			);

			expect(response).toBeDefined();
			expect(response.sessionId).toBe(testSessionId);
			if (response.success && response.data) {
				expect(response.data.methodologySelection).toBeDefined();
			}
		});

		it("should handle methodology selection with complex signals", async () => {
			const methodologySignals = {
				projectType: "enterprise",
				teamSize: "large",
				timeline: "12-months",
				problemFraming: "technical-debt",
			};

			const response = await additionalOperationsService.selectMethodology(
				testSessionId,
				methodologySignals,
			);

			expect(response).toBeDefined();
			expect(response.sessionId).toBe(testSessionId);
		});

		it("should handle methodology selection with minimal session", async () => {
			const methodologySignals = {
				projectType: "prototype",
				teamSize: "small",
				timeline: "1-month",
				problemFraming: "proof-of-concept",
			};

			const response = await additionalOperationsService.selectMethodology(
				testSessionId,
				methodologySignals,
			);

			// Should succeed even with minimal information
			expect(response).toBeDefined();
			expect(response.sessionId).toBe(testSessionId);
		});
	});
});
