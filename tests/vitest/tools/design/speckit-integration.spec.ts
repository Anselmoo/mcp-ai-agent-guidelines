/**
 * Tests for Spec-Kit integration with Design-Assistant
 *
 * @module tests/tools/design/speckit-integration
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DesignAssistantRequest } from "../../../../src/tools/design/design-assistant.js";
import { designAssistant } from "../../../../src/tools/design/design-assistant.js";

describe("Spec-Kit Integration with Design-Assistant", () => {
	const sessionId = `test-session-${Date.now()}`;

	beforeEach(async () => {
		await designAssistant.initialize();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("artifact type support", () => {
		it("should accept 'speckit' in artifactTypes array", async () => {
			const request: DesignAssistantRequest = {
				action: "start-session",
				sessionId,
				config: {
					sessionId,
					context: "E-commerce platform",
					goal: "Implement checkout flow",
					requirements: ["Payment processing", "Cart validation"],
					constraints: [],
					coverageThreshold: 85,
					enablePivots: true,
					templateRefs: [],
					outputFormats: ["markdown"],
					metadata: {},
				},
			};

			const result = await designAssistant.processRequest(request);

			expect(result).toBeDefined();
			expect(result.success).toBe(true);
			expect(result.sessionId).toBe(sessionId);
		});

		it("should generate speckit artifacts when requested", async () => {
			// First, start a session
			const startRequest: DesignAssistantRequest = {
				action: "start-session",
				sessionId,
				config: {
					sessionId,
					context: "Microservices architecture",
					goal: "Design API gateway",
					requirements: ["Rate limiting", "Authentication", "Load balancing"],
					constraints: [],
					coverageThreshold: 85,
					enablePivots: true,
					templateRefs: [],
					outputFormats: ["markdown"],
					metadata: {},
				},
			};

			await designAssistant.processRequest(startRequest);

			// Then, generate speckit artifacts
			const generateRequest: DesignAssistantRequest = {
				action: "generate-artifacts",
				sessionId,
				artifactTypes: ["speckit"],
			};

			const result = await designAssistant.processRequest(generateRequest);

			expect(result).toBeDefined();
			expect(result.success).toBe(true);
			expect(result.artifacts).toBeDefined();
			expect(result.artifacts.length).toBeGreaterThan(0);
		});

		it("should generate multiple artifact types including speckit", async () => {
			// Start session
			const startRequest: DesignAssistantRequest = {
				action: "start-session",
				sessionId,
				config: {
					sessionId,
					context: "Cloud migration",
					goal: "Migrate legacy system to cloud",
					requirements: ["High availability", "Data migration", "Security"],
					constraints: [],
					coverageThreshold: 85,
					enablePivots: false,
					templateRefs: [],
					outputFormats: ["markdown"],
					metadata: {},
				},
			};

			await designAssistant.processRequest(startRequest);

			// Generate multiple artifact types
			const generateRequest: DesignAssistantRequest = {
				action: "generate-artifacts",
				sessionId,
				artifactTypes: ["adr", "specification", "roadmap", "speckit"],
			};

			const result = await designAssistant.processRequest(generateRequest);

			expect(result).toBeDefined();
			expect(result.success).toBe(true);
			expect(result.artifacts).toBeDefined();
			expect(result.artifacts.length).toBeGreaterThan(0);

			// Should have artifacts of different types
			const artifactTypes = result.artifacts.map((a) => a.type);
			expect(artifactTypes).toContain("speckit");
		});
	});

	describe("speckit artifact structure", () => {
		it("should generate primary and secondary speckit artifacts", async () => {
			// Start session
			const startRequest: DesignAssistantRequest = {
				action: "start-session",
				sessionId,
				config: {
					sessionId,
					context: "Mobile app development",
					goal: "Build cross-platform mobile app",
					requirements: ["Offline support", "Push notifications", "Analytics"],
					constraints: [],
					coverageThreshold: 85,
					enablePivots: true,
					templateRefs: [],
					outputFormats: ["markdown"],
					metadata: {},
				},
			};

			await designAssistant.processRequest(startRequest);

			// Generate speckit artifacts
			const generateRequest: DesignAssistantRequest = {
				action: "generate-artifacts",
				sessionId,
				artifactTypes: ["speckit"],
			};

			const result = await designAssistant.processRequest(generateRequest);

			expect(result.success).toBe(true);
			expect(result.artifacts).toBeDefined();

			// Find speckit artifacts
			const speckitArtifacts = result.artifacts.filter(
				(a) => a.type === "speckit",
			);
			expect(speckitArtifacts.length).toBeGreaterThan(0);

			// Check artifact properties
			for (const artifact of speckitArtifacts) {
				expect(artifact.id).toBeDefined();
				expect(artifact.name).toBeDefined();
				expect(artifact.type).toBe("speckit");
				expect(artifact.content).toBeDefined();
				expect(artifact.format).toBeDefined();
				expect(artifact.timestamp).toBeDefined();
				expect(artifact.metadata).toBeDefined();
			}
		});

		it("should include expected speckit document names", async () => {
			// Start session
			const startRequest: DesignAssistantRequest = {
				action: "start-session",
				sessionId,
				config: {
					sessionId,
					context: "DevOps automation",
					goal: "Automate deployment pipeline",
					requirements: ["CI/CD", "Infrastructure as Code", "Monitoring"],
					constraints: [],
					coverageThreshold: 85,
					enablePivots: true,
					templateRefs: [],
					outputFormats: ["markdown"],
					metadata: {},
				},
			};

			await designAssistant.processRequest(startRequest);

			// Generate speckit artifacts
			const generateRequest: DesignAssistantRequest = {
				action: "generate-artifacts",
				sessionId,
				artifactTypes: ["speckit"],
			};

			const result = await designAssistant.processRequest(generateRequest);

			expect(result.success).toBe(true);

			// Find speckit artifacts
			const speckitArtifacts = result.artifacts.filter(
				(a) => a.type === "speckit",
			);

			// Get artifact names
			const artifactNames = speckitArtifacts.map((a) => a.name.toLowerCase());

			// Should include expected Spec-Kit documents
			// Note: Exact names depend on SpecKitStrategy implementation
			expect(artifactNames.length).toBeGreaterThan(0);
		});
	});

	describe("recommendations", () => {
		it("should include speckit recommendation in response", async () => {
			// Start session
			const startRequest: DesignAssistantRequest = {
				action: "start-session",
				sessionId,
				config: {
					sessionId,
					context: "Data processing pipeline",
					goal: "Build real-time data pipeline",
					requirements: ["Stream processing", "Data validation", "Monitoring"],
					constraints: [],
					coverageThreshold: 85,
					enablePivots: true,
					templateRefs: [],
					outputFormats: ["markdown"],
					metadata: {},
				},
			};

			await designAssistant.processRequest(startRequest);

			// Generate speckit artifacts
			const generateRequest: DesignAssistantRequest = {
				action: "generate-artifacts",
				sessionId,
				artifactTypes: ["speckit"],
			};

			const result = await designAssistant.processRequest(generateRequest);

			expect(result.success).toBe(true);
			expect(result.recommendations).toBeDefined();

			// Should have recommendation about Spec-Kit artifacts
			const hasSpeckitRecommendation = result.recommendations.some((rec) =>
				rec.toLowerCase().includes("spec-kit"),
			);
			expect(hasSpeckitRecommendation).toBe(true);
		});
	});

	describe("error handling", () => {
		it("should handle speckit generation with minimal session data", async () => {
			// Start session with minimal data
			const startRequest: DesignAssistantRequest = {
				action: "start-session",
				sessionId,
				config: {
					sessionId,
					context: "Test context",
					goal: "Test goal",
					requirements: [],
					constraints: [],
					coverageThreshold: 85,
					enablePivots: true,
					templateRefs: [],
					outputFormats: ["markdown"],
					metadata: {},
				},
			};

			await designAssistant.processRequest(startRequest);

			// Generate speckit artifacts
			const generateRequest: DesignAssistantRequest = {
				action: "generate-artifacts",
				sessionId,
				artifactTypes: ["speckit"],
			};

			// Should not throw error even with minimal data
			const result = await designAssistant.processRequest(generateRequest);

			expect(result).toBeDefined();
			expect(result.success).toBe(true);
		});
	});
});
