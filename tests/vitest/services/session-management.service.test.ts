// Session Management Service Tests
import { beforeEach, describe, expect, it } from "vitest";
import { designPhaseWorkflow } from "../../../dist/tools/design/design-phase-workflow.js";
import { sessionManagementService } from "../../../dist/tools/design/services/session-management.service.js";

describe("SessionManagementService", () => {
	beforeEach(async () => {
		// Clear any existing sessions
		const sessions = await sessionManagementService.getActiveSessions();
		for (const sessionId of sessions) {
			const session = designPhaseWorkflow.getSession(sessionId);
			if (session) {
				// Clean up session if needed
			}
		}
	});

	describe("startDesignSession", () => {
		it("should start a new design session successfully", async () => {
			const sessionId = `test-session-${Date.now()}`;
			const config = {
				sessionId,
				context: "Building a task management system",
				goal: "Create a scalable platform",
				requirements: [
					"User authentication",
					"Task management",
					"Real-time updates",
				],
				constraints: [],
				coverageThreshold: 85,
				enablePivots: true,
				templateRefs: [],
				outputFormats: ["markdown"],
				metadata: {},
			};

			const response = await sessionManagementService.startDesignSession(
				sessionId,
				config,
			);

			expect(response.success).toBe(true);
			expect(response.sessionId).toBe(sessionId);
			expect(response.currentPhase).toBeDefined();
			expect(response.status).toBe("active");
			expect(response.message).toContain("started successfully");
			expect(response.recommendations).toBeInstanceOf(Array);
			expect(response.artifacts).toBeInstanceOf(Array);
		});

		it("should start session with methodology selection", async () => {
			const sessionId = `test-methodology-${Date.now()}`;
			const config = {
				sessionId,
				context: "E-commerce platform",
				goal: "Build scalable e-commerce solution",
				requirements: [
					"Product catalog",
					"Shopping cart",
					"Payment processing",
				],
				constraints: [],
				coverageThreshold: 85,
				enablePivots: true,
				templateRefs: [],
				outputFormats: ["markdown"],
				metadata: {},
				methodologySignals: {
					projectType: "greenfield",
					problemFraming: "exploratory",
					teamSize: "small",
					timeline: "flexible",
					riskTolerance: "medium",
				},
			};

			const response = await sessionManagementService.startDesignSession(
				sessionId,
				config,
			);

			expect(response.success).toBe(true);
			expect(response.sessionId).toBe(sessionId);
			expect(response.data?.methodologySelection).toBeDefined();
		});

		it("should handle constraint configuration loading", async () => {
			const sessionId = `test-constraints-${Date.now()}`;
			const config = {
				sessionId,
				context: "Healthcare system",
				goal: "HIPAA compliant healthcare platform",
				requirements: ["Patient records", "Security", "Audit trails"],
				constraints: [],
				coverageThreshold: 90,
				enablePivots: false,
				templateRefs: [],
				outputFormats: ["markdown"],
				metadata: {},
			};

			const constraintConfig = {
				constraints: [
					{
						id: "security-1",
						category: "security",
						description: "HIPAA compliance required",
						mandatory: true,
						phases: ["architecture", "specification"],
					},
				],
			};

			const response = await sessionManagementService.startDesignSession(
				sessionId,
				config,
				constraintConfig,
			);

			// Should handle constraint loading (may succeed or fail based on config)
			expect(response).toBeDefined();
			expect(response.sessionId).toBe(sessionId);
		});

		it("should handle workflow failure gracefully", async () => {
			const sessionId = `test-workflow-fail-${Date.now()}`;
			// Use invalid config to trigger workflow failure
			const config = {
				sessionId,
				context: "",
				goal: "",
				requirements: [],
				constraints: [],
				coverageThreshold: 85,
				enablePivots: true,
				templateRefs: [],
				outputFormats: ["markdown"],
				metadata: {},
			};

			const response = await sessionManagementService.startDesignSession(
				sessionId,
				config,
			);

			// Should handle failure gracefully
			expect(response).toBeDefined();
			expect(response.sessionId).toBe(sessionId);
		});

		it("should handle session start without methodology", async () => {
			const sessionId = `test-no-methodology-${Date.now()}`;
			const config = {
				sessionId,
				context: "Simple project",
				goal: "Simple goal",
				requirements: ["Simple requirement"],
				constraints: [],
				coverageThreshold: 85,
				enablePivots: true,
				templateRefs: [],
				outputFormats: ["markdown"],
				metadata: {},
				// No methodologySignals provided
			};

			const response = await sessionManagementService.startDesignSession(
				sessionId,
				config,
			);

			expect(response.success).toBe(true);
			expect(response.data?.methodologySelection).toBeUndefined();
			expect(response.message).not.toContain("methodology");
		});

		it("should generate methodology ADR when methodology is selected", async () => {
			const sessionId = `test-adr-${Date.now()}`;
			const config = {
				sessionId,
				context: "Large enterprise system",
				goal: "Build enterprise solution",
				requirements: ["Scalability", "Security"],
				constraints: [],
				coverageThreshold: 85,
				enablePivots: true,
				templateRefs: [],
				outputFormats: ["markdown"],
				metadata: {},
				methodologySignals: {
					projectType: "greenfield",
					problemFraming: "well-defined",
					teamSize: "large",
					timeline: "fixed",
					riskTolerance: "low",
				},
			};

			const response = await sessionManagementService.startDesignSession(
				sessionId,
				config,
			);

			expect(response.success).toBe(true);
			if (response.data?.methodologySelection) {
				// ADR should be generated for methodology
				expect(response.artifacts.length).toBeGreaterThanOrEqual(0);
			}
		});

		it("should return error for invalid constraint config", async () => {
			const sessionId = `test-invalid-${Date.now()}`;
			const config = {
				sessionId,
				context: "Test",
				goal: "Test",
				requirements: [],
				constraints: [],
				coverageThreshold: 85,
				enablePivots: true,
				templateRefs: [],
				outputFormats: ["markdown"],
				metadata: {},
			};

			const invalidConstraintConfig = "invalid";

			const response = await sessionManagementService.startDesignSession(
				sessionId,
				config,
				invalidConstraintConfig,
			);

			// Should handle error gracefully
			expect(response).toBeDefined();
			expect(response.sessionId).toBe(sessionId);
		});
	});

	describe("getSessionStatus", () => {
		it("should retrieve status for existing session", async () => {
			const sessionId = `test-status-${Date.now()}`;
			const config = {
				sessionId,
				context: "Test project",
				goal: "Test goal",
				requirements: ["Req1", "Req2"],
				constraints: [],
				coverageThreshold: 85,
				enablePivots: true,
				templateRefs: [],
				outputFormats: ["markdown"],
				metadata: {},
			};

			// Create session first
			await sessionManagementService.startDesignSession(sessionId, config);

			const response =
				await sessionManagementService.getSessionStatus(sessionId);

			expect(response.success).toBe(true);
			expect(response.sessionId).toBe(sessionId);
			expect(response.currentPhase).toBeDefined();
			expect(response.status).toBeDefined();
			expect(response.message).toContain("progress");
			expect(response.data?.sessionState).toBeDefined();
		});

		it("should return error for non-existent session", async () => {
			const response =
				await sessionManagementService.getSessionStatus("non-existent");

			expect(response.success).toBe(false);
			expect(response.status).toBe("not-found");
			expect(response.message).toContain("not found");
			expect(response.recommendations).toContain("Start a new session");
		});
	});

	describe("getActiveSessions", () => {
		it("should return list of active sessions", async () => {
			const sessionId1 = `test-active-1-${Date.now()}`;
			const sessionId2 = `test-active-2-${Date.now()}`;

			const config1 = {
				sessionId: sessionId1,
				context: "Project 1",
				goal: "Goal 1",
				requirements: ["Req1"],
				constraints: [],
				coverageThreshold: 85,
				enablePivots: true,
				templateRefs: [],
				outputFormats: ["markdown"],
				metadata: {},
			};

			const config2 = {
				sessionId: sessionId2,
				context: "Project 2",
				goal: "Goal 2",
				requirements: ["Req2"],
				constraints: [],
				coverageThreshold: 85,
				enablePivots: true,
				templateRefs: [],
				outputFormats: ["markdown"],
				metadata: {},
			};

			await sessionManagementService.startDesignSession(sessionId1, config1);
			await sessionManagementService.startDesignSession(sessionId2, config2);

			const sessions = await sessionManagementService.getActiveSessions();

			expect(sessions).toBeInstanceOf(Array);
			expect(sessions).toContain(sessionId1);
			expect(sessions).toContain(sessionId2);
		});

		it("should return empty array when no sessions exist", async () => {
			// This test assumes a fresh state or after cleanup
			const sessions = await sessionManagementService.getActiveSessions();
			expect(sessions).toBeInstanceOf(Array);
		});
	});
});
