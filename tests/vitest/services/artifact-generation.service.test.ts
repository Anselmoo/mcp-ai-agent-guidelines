// Artifact Generation Service Tests
import { describe, expect, it } from "vitest";
import { artifactGenerationService } from "../../../src/tools/design/services/artifact-generation.service.js";
import { sessionManagementService } from "../../../src/tools/design/services/session-management.service.js";

describe("ArtifactGenerationService", () => {
	describe("generateArtifacts", () => {
		it("should generate ADRs for session", async () => {
			const sessionId = `test-adr-${Date.now()}`;
			const config = {
				sessionId,
				context: "Building a distributed system",
				goal: "Create resilient architecture",
				requirements: ["Fault tolerance", "Scalability", "High availability"],
				constraints: [],
				coverageThreshold: 85,
				enablePivots: true,
				templateRefs: [],
				outputFormats: ["markdown"],
				metadata: {},
			};

			await sessionManagementService.startDesignSession(sessionId, config);

			const response = await artifactGenerationService.generateArtifacts(
				sessionId,
				["adr"],
			);

			expect(response).toBeDefined();
			expect(response.sessionId).toBe(sessionId);
			expect(response.artifacts).toBeInstanceOf(Array);
		});

		it("should generate specifications", async () => {
			const sessionId = `test-spec-${Date.now()}`;
			const config = {
				sessionId,
				context: "API Gateway project",
				goal: "Build API gateway",
				requirements: ["Routing", "Authentication", "Rate limiting"],
				constraints: [],
				coverageThreshold: 85,
				enablePivots: true,
				templateRefs: [],
				outputFormats: ["markdown"],
				metadata: {},
			};

			await sessionManagementService.startDesignSession(sessionId, config);

			const response = await artifactGenerationService.generateArtifacts(
				sessionId,
				["specification"],
			);

			expect(response).toBeDefined();
			expect(response.sessionId).toBe(sessionId);
			expect(response.artifacts).toBeInstanceOf(Array);
		});

		it("should generate roadmaps", async () => {
			const sessionId = `test-roadmap-${Date.now()}`;
			const config = {
				sessionId,
				context: "Product development",
				goal: "Launch new product",
				requirements: ["MVP features", "Beta release", "GA launch"],
				constraints: [],
				coverageThreshold: 85,
				enablePivots: true,
				templateRefs: [],
				outputFormats: ["markdown"],
				metadata: {},
			};

			await sessionManagementService.startDesignSession(sessionId, config);

			const response = await artifactGenerationService.generateArtifacts(
				sessionId,
				["roadmap"],
			);

			expect(response).toBeDefined();
			expect(response.sessionId).toBe(sessionId);
			expect(response.artifacts).toBeInstanceOf(Array);
		});

		it("should generate all artifact types", async () => {
			const sessionId = `test-all-${Date.now()}`;
			const config = {
				sessionId,
				context: "Full stack application",
				goal: "Build complete solution",
				requirements: ["Frontend", "Backend", "Database"],
				constraints: [],
				coverageThreshold: 85,
				enablePivots: true,
				templateRefs: [],
				outputFormats: ["markdown"],
				metadata: {},
			};

			await sessionManagementService.startDesignSession(sessionId, config);

			const response = await artifactGenerationService.generateArtifacts(
				sessionId,
				["adr", "specification", "roadmap"],
			);

			expect(response).toBeDefined();
			expect(response.sessionId).toBe(sessionId);
			expect(response.artifacts).toBeInstanceOf(Array);
			expect(response.recommendations).toBeInstanceOf(Array);
		});

		it("should return error for non-existent session", async () => {
			const response = await artifactGenerationService.generateArtifacts(
				"non-existent",
				["adr"],
			);

			expect(response.success).toBe(false);
			expect(response.status).toBe("error");
			expect(response.message).toContain("not found");
		});

		it("should handle generation errors gracefully", async () => {
			const sessionId = `test-error-${Date.now()}`;
			const config = {
				sessionId,
				context: "Error test",
				goal: "Test error handling",
				requirements: [],
				constraints: [],
				coverageThreshold: 85,
				enablePivots: true,
				templateRefs: [],
				outputFormats: ["markdown"],
				metadata: {},
			};

			await sessionManagementService.startDesignSession(sessionId, config);

			const response = await artifactGenerationService.generateArtifacts(
				sessionId,
				["adr", "specification", "roadmap"],
			);

			// Should handle gracefully even with minimal data
			expect(response).toBeDefined();
			expect(response.sessionId).toBe(sessionId);
		});
	});

	describe("generateConstraintDocumentation", () => {
		it("should generate constraint documentation", async () => {
			const sessionId = `test-doc-${Date.now()}`;

			const response =
				await artifactGenerationService.generateConstraintDocumentation(
					sessionId,
				);

			expect(response).toBeDefined();
			expect(response.sessionId).toBe(sessionId);
			expect(response.artifacts).toBeInstanceOf(Array);
		});

		it("should include ADR, specification, and roadmap", async () => {
			const sessionId = `test-complete-doc-${Date.now()}`;

			const response =
				await artifactGenerationService.generateConstraintDocumentation(
					sessionId,
				);

			expect(response.success).toBe(true);
			expect(response.artifacts.length).toBeGreaterThanOrEqual(3);
			expect(response.recommendations).toBeInstanceOf(Array);
		});

		it("should handle documentation generation errors", async () => {
			const sessionId = `test-doc-error-${Date.now()}`;

			const response =
				await artifactGenerationService.generateConstraintDocumentation(
					sessionId,
				);

			// Should handle any errors gracefully
			expect(response).toBeDefined();
			expect(response.sessionId).toBe(sessionId);
		});
	});
});
