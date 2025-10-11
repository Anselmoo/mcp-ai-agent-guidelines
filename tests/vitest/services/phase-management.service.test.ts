// Phase Management Service Tests
import { describe, expect, it } from "vitest";
import { phaseManagementService } from "../../../dist/tools/design/services/phase-management.service.js";
import { sessionManagementService } from "../../../dist/tools/design/services/session-management.service.js";

describe("PhaseManagementService", () => {
	describe("advancePhase", () => {
		it("should advance to next phase successfully", async () => {
			const sessionId = `test-advance-${Date.now()}`;
			const config = {
				sessionId,
				context: "Building a microservices platform",
				goal: "Create scalable microservices",
				requirements: ["Service discovery", "Load balancing", "API gateway"],
				constraints: [],
				coverageThreshold: 85,
				enablePivots: true,
				templateRefs: [],
				outputFormats: ["markdown"],
				metadata: {},
			};

			// Create session first
			await sessionManagementService.startDesignSession(sessionId, config);

			const content = `
				# Discovery Phase Completed

				## Findings
				- Identified key stakeholders
				- Analyzed system requirements
				- Documented constraints
			`;

			const response = await phaseManagementService.advancePhase(
				sessionId,
				content,
			);

			expect(response).toBeDefined();
			expect(response.sessionId).toBe(sessionId);
			expect(response.recommendations).toBeInstanceOf(Array);
		});

		it("should return error for non-existent session", async () => {
			const response = await phaseManagementService.advancePhase(
				"non-existent",
				"content",
			);

			expect(response.success).toBe(false);
			expect(response.status).toBe("error");
			expect(response.message).toContain("not found");
		});

		it("should handle validation failure", async () => {
			const sessionId = `test-validation-${Date.now()}`;
			const config = {
				sessionId,
				context: "Test project",
				goal: "Test validation",
				requirements: ["Requirement 1"],
				constraints: [],
				coverageThreshold: 85,
				enablePivots: true,
				templateRefs: [],
				outputFormats: ["markdown"],
				metadata: {},
			};

			await sessionManagementService.startDesignSession(sessionId, config);

			// Try to advance with insufficient content
			const response = await phaseManagementService.advancePhase(
				sessionId,
				"insufficient content",
			);

			expect(response).toBeDefined();
			expect(response.sessionId).toBe(sessionId);
		});

		it("should advance to specific target phase", async () => {
			const sessionId = `test-target-${Date.now()}`;
			const config = {
				sessionId,
				context: "Target phase test",
				goal: "Test target phase advancement",
				requirements: ["Req1"],
				constraints: [],
				coverageThreshold: 85,
				enablePivots: true,
				templateRefs: [],
				outputFormats: ["markdown"],
				metadata: {},
			};

			await sessionManagementService.startDesignSession(sessionId, config);

			const content = "Phase content with sufficient detail";
			const targetPhase = "requirements";

			const response = await phaseManagementService.advancePhase(
				sessionId,
				content,
				targetPhase,
			);

			expect(response).toBeDefined();
			expect(response.sessionId).toBe(sessionId);
		});
	});

	describe("validatePhase", () => {
		it("should validate phase completion", async () => {
			const sessionId = `test-validate-${Date.now()}`;
			const config = {
				sessionId,
				context: "Validation test project",
				goal: "Test phase validation",
				requirements: ["Complete validation testing"],
				constraints: [],
				coverageThreshold: 85,
				enablePivots: true,
				templateRefs: [],
				outputFormats: ["markdown"],
				metadata: {},
			};

			await sessionManagementService.startDesignSession(sessionId, config);

			const content = `
				# Discovery Phase Validation

				## Requirements Captured
				- User stories documented
				- Technical constraints identified
				- Success criteria defined

				## Stakeholder Engagement
				- All stakeholders interviewed
				- Feedback incorporated
			`;

			const response = await phaseManagementService.validatePhase(
				sessionId,
				"discovery",
				content,
			);

			expect(response).toBeDefined();
			expect(response.sessionId).toBe(sessionId);
			expect(response.recommendations).toBeInstanceOf(Array);
		});

		it("should return error for non-existent session", async () => {
			const response = await phaseManagementService.validatePhase(
				"non-existent",
				"discovery",
				"content",
			);

			expect(response.success).toBe(false);
			expect(response.status).toBe("error");
			expect(response.message).toContain("not found");
		});

		it("should validate with coverage enforcement", async () => {
			const sessionId = `test-coverage-${Date.now()}`;
			const config = {
				sessionId,
				context: "Coverage test",
				goal: "Test coverage validation",
				requirements: ["High coverage"],
				constraints: [],
				coverageThreshold: 90,
				enablePivots: false,
				templateRefs: [],
				outputFormats: ["markdown"],
				metadata: {},
			};

			await sessionManagementService.startDesignSession(sessionId, config);

			const content = `
				# Comprehensive Phase Content

				This content covers all key criteria:
				- Requirement analysis complete
				- Architecture decisions documented
				- Risk assessment performed
				- Quality metrics defined
			`;

			const response = await phaseManagementService.validatePhase(
				sessionId,
				"discovery",
				content,
			);

			expect(response).toBeDefined();
			expect(response.coverage).toBeDefined();
		});
	});

	describe("getPhaseGuidance", () => {
		it("should return phase guidance", async () => {
			const guidance = await phaseManagementService.getPhaseGuidance(
				{},
				"discovery",
			);

			expect(guidance).toBeInstanceOf(Array);
			expect(guidance.length).toBeGreaterThan(0);
			expect(guidance[0]).toContain("discovery");
		});

		it("should return guidance for different phases", async () => {
			const phases = [
				"discovery",
				"requirements",
				"architecture",
				"specification",
			];

			for (const phase of phases) {
				const guidance = await phaseManagementService.getPhaseGuidance(
					{},
					phase,
				);
				expect(guidance).toBeInstanceOf(Array);
				expect(guidance.length).toBeGreaterThan(0);
			}
		});
	});

	describe("getPhaseSequence", () => {
		it("should return phase sequence", async () => {
			const sequence = await phaseManagementService.getPhaseSequence();

			expect(sequence).toBeInstanceOf(Array);
			expect(sequence.length).toBeGreaterThan(0);
			expect(sequence).toContain("discovery");
			expect(sequence).toContain("requirements");
		});
	});
});
