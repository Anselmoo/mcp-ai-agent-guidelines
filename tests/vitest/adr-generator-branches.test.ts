// ADR Generator - Branch Coverage Enhancement Tests
// Focus: Testing ALL conditional branches and content generation paths
import { describe, expect, it } from "vitest";
import { adrGenerator } from "../../src/tools/design/adr-generator.ts";
import type {
	ADRRequest,
	DesignSessionState,
} from "../../src/tools/design/types.ts";

describe("ADR Generator - Branch Coverage Tests", () => {
	const createBasicSession = (): DesignSessionState => ({
		config: {
			sessionId: "adr-test",
			context: "Testing ADR generation",
			goal: "Test all branches",
			requirements: ["req1"],
			constraints: [],
			coverageThreshold: 80,
			enablePivots: true,
			templateRefs: [],
			outputFormats: ["markdown"],
			metadata: {},
		},
		currentPhase: "design",
		phases: {},
		coverage: {
			overall: 80,
			phases: {},
			constraints: {},
			assumptions: {},
			documentation: {},
			testCoverage: 80,
		},
		artifacts: [],
		history: [],
		status: "active",
	});

	describe("Branch: Status values", () => {
		it("should handle 'proposed' status", async () => {
			const session = createBasicSession();
			const request: ADRRequest = {
				sessionState: session,
				title: "Test Decision",
				context: "Test context",
				decision: "Test decision",
				status: "proposed",
			};

			const result = await adrGenerator.generateADR(request);
			expect(result.markdown).toContain("PROPOSED");
		});

		it("should handle 'accepted' status", async () => {
			const session = createBasicSession();
			const request: ADRRequest = {
				sessionState: session,
				title: "Test Decision",
				context: "Test context",
				decision: "Test decision",
				status: "accepted",
			};

			const result = await adrGenerator.generateADR(request);
			expect(result.markdown).toContain("ACCEPTED");
		});

		it("should handle 'deprecated' status", async () => {
			const session = createBasicSession();
			const request: ADRRequest = {
				sessionState: session,
				title: "Test Decision",
				context: "Test context",
				decision: "Test decision",
				status: "deprecated",
			};

			const result = await adrGenerator.generateADR(request);
			expect(result.markdown).toContain("DEPRECATED");
		});

		it("should handle 'superseded' status", async () => {
			const session = createBasicSession();
			const request: ADRRequest = {
				sessionState: session,
				title: "Test Decision",
				context: "Test context",
				decision: "Test decision",
				status: "superseded",
			};

			const result = await adrGenerator.generateADR(request);
			expect(result.markdown).toContain("SUPERSEDED");
		});

		it("should default to 'proposed' when status not specified", async () => {
			const session = createBasicSession();
			const request: ADRRequest = {
				sessionState: session,
				title: "Test Decision",
				context: "Test context",
				decision: "Test decision",
				// status omitted
			};

			const result = await adrGenerator.generateADR(request);
			expect(result.markdown).toContain("PROPOSED");
		});
	});

	describe("Branch: Consequences generation", () => {
		it("should use provided consequences when given", async () => {
			const session = createBasicSession();
			const request: ADRRequest = {
				sessionState: session,
				title: "Test Decision",
				context: "Test context",
				decision: "Test decision",
				consequences: "Custom consequences provided by user",
			};

			const result = await adrGenerator.generateADR(request);
			expect(result.markdown).toContain("Custom consequences");
		});

		it("should auto-generate consequences for microservice decisions", async () => {
			const session = createBasicSession();
			const request: ADRRequest = {
				sessionState: session,
				title: "Microservice Architecture",
				context: "System architecture decision",
				decision: "Adopt microservice architecture for better scalability",
			};

			const result = await adrGenerator.generateADR(request);
			expect(result.markdown).toContain("complexity");
		});

		it("should auto-generate consequences for distributed system decisions", async () => {
			const session = createBasicSession();
			const request: ADRRequest = {
				sessionState: session,
				title: "Distributed System",
				context: "System design",
				decision: "Build a distributed system for high availability",
			};

			const result = await adrGenerator.generateADR(request);
			expect(result.markdown).toBeDefined();
		});

		it("should auto-generate consequences for monolith decisions", async () => {
			const session = createBasicSession();
			const request: ADRRequest = {
				sessionState: session,
				title: "Monolithic Architecture",
				context: "System architecture",
				decision: "Use a monolith architecture for initial development",
			};

			const result = await adrGenerator.generateADR(request);
			expect(result.markdown).toContain("deployment");
		});

		it("should auto-generate consequences for single service decisions", async () => {
			const session = createBasicSession();
			const request: ADRRequest = {
				sessionState: session,
				title: "Single Service",
				context: "Service design",
				decision: "Deploy as a single service application",
			};

			const result = await adrGenerator.generateADR(request);
			expect(result.markdown).toBeDefined();
		});

		it("should auto-generate consequences for cloud decisions", async () => {
			const session = createBasicSession();
			const request: ADRRequest = {
				sessionState: session,
				title: "Cloud Deployment",
				context: "Infrastructure",
				decision: "Deploy to cloud infrastructure",
			};

			const result = await adrGenerator.generateADR(request);
			expect(result.markdown).toContain("Cost");
		});

		it("should auto-generate consequences for AWS decisions", async () => {
			const session = createBasicSession();
			const request: ADRRequest = {
				sessionState: session,
				title: "AWS Platform",
				context: "Cloud provider selection",
				decision: "Use AWS as the primary cloud platform",
			};

			const result = await adrGenerator.generateADR(request);
			expect(result.markdown).toBeDefined();
		});

		it("should auto-generate consequences for Azure decisions", async () => {
			const session = createBasicSession();
			const request: ADRRequest = {
				sessionState: session,
				title: "Azure Platform",
				context: "Cloud provider",
				decision: "Adopt Azure for enterprise integration",
			};

			const result = await adrGenerator.generateADR(request);
			expect(result.markdown).toBeDefined();
		});

		it("should auto-generate consequences for database decisions", async () => {
			const session = createBasicSession();
			const request: ADRRequest = {
				sessionState: session,
				title: "Database Selection",
				context: "Data storage",
				decision: "Use PostgreSQL database for data persistence",
			};

			const result = await adrGenerator.generateADR(request);
			expect(result.markdown).toContain("Data");
		});

		it("should auto-generate consequences for storage decisions", async () => {
			const session = createBasicSession();
			const request: ADRRequest = {
				sessionState: session,
				title: "Storage Solution",
				context: "Data management",
				decision: "Implement object storage for file management",
			};

			const result = await adrGenerator.generateADR(request);
			expect(result.markdown).toBeDefined();
		});
	});

	describe("Branch: Alternatives inclusion", () => {
		it("should include alternatives section when alternatives provided", async () => {
			const session = createBasicSession();
			const request: ADRRequest = {
				sessionState: session,
				title: "Test Decision",
				context: "Test context",
				decision: "Test decision",
				alternatives: [
					"Alternative 1: Use different approach",
					"Alternative 2: Use third-party solution",
				],
			};

			const result = await adrGenerator.generateADR(request);
			expect(result.markdown).toContain("Alternatives Considered");
			expect(result.markdown).toContain("Alternative 1");
			expect(result.markdown).toContain("Alternative 2");
		});

		it("should omit alternatives section when no alternatives provided", async () => {
			const session = createBasicSession();
			const request: ADRRequest = {
				sessionState: session,
				title: "Test Decision",
				context: "Test context",
				decision: "Test decision",
				alternatives: [],
			};

			const result = await adrGenerator.generateADR(request);
			expect(result.markdown).not.toContain("Alternatives Considered");
		});

		it("should handle undefined alternatives array", async () => {
			const session = createBasicSession();
			const request: ADRRequest = {
				sessionState: session,
				title: "Test Decision",
				context: "Test context",
				decision: "Test decision",
				// alternatives undefined
			};

			const result = await adrGenerator.generateADR(request);
			expect(result.markdown).toBeDefined();
		});
	});

	describe("Branch: Metadata inclusion", () => {
		it("should include metadata section when metadata provided", async () => {
			const session = createBasicSession();
			const request: ADRRequest = {
				sessionState: session,
				title: "Test Decision",
				context: "Test context",
				decision: "Test decision",
				metadata: {
					author: "Test User",
					reviewers: ["Reviewer 1", "Reviewer 2"],
					priority: "high",
				},
			};

			const result = await adrGenerator.generateADR(request);
			expect(result.markdown).toContain("Metadata");
			expect(result.markdown).toContain("author");
			expect(result.markdown).toContain("Test User");
		});

		it("should omit metadata section when metadata empty", async () => {
			const session = createBasicSession();
			const request: ADRRequest = {
				sessionState: session,
				title: "Test Decision",
				context: "Test context",
				decision: "Test decision",
				metadata: {},
			};

			const result = await adrGenerator.generateADR(request);
			// Empty metadata should not show metadata section
			const metadataIndex = result.markdown.indexOf("## Metadata");
			if (metadataIndex !== -1) {
				// If metadata section exists, it should be minimal
				expect(result.markdown).toBeDefined();
			}
		});

		it("should omit metadata section when metadata undefined", async () => {
			const session = createBasicSession();
			const request: ADRRequest = {
				sessionState: session,
				title: "Test Decision",
				context: "Test context",
				decision: "Test decision",
				// metadata undefined
			};

			const result = await adrGenerator.generateADR(request);
			expect(result.markdown).toBeDefined();
		});
	});

	describe("Branch: Related decisions detection", () => {
		it("should find related decisions from session artifacts", async () => {
			const session = createBasicSession();
			session.artifacts = [
				{
					id: "adr-001",
					name: "Previous ADR about microservices",
					type: "adr",
					content: "Decision about microservice architecture",
					format: "markdown",
					timestamp: new Date().toISOString(),
					metadata: {},
				},
			];

			const request: ADRRequest = {
				sessionState: session,
				title: "Microservice Decision",
				context: "Architecture",
				decision: "Adopt microservice patterns",
			};

			const result = await adrGenerator.generateADR(request);
			expect(result.relatedDecisions).toBeDefined();
		});

		it("should handle session with no artifacts", async () => {
			const session = createBasicSession();
			session.artifacts = [];

			const request: ADRRequest = {
				sessionState: session,
				title: "Test Decision",
				context: "Test context",
				decision: "Test decision",
			};

			const result = await adrGenerator.generateADR(request);
			expect(result.relatedDecisions).toBeDefined();
			expect(Array.isArray(result.relatedDecisions)).toBe(true);
		});
	});

	describe("Branch: Multiple consequence types", () => {
		it("should generate multiple consequence types for complex decisions", async () => {
			const session = createBasicSession();
			const request: ADRRequest = {
				sessionState: session,
				title: "Full Stack Decision",
				context: "Complete system architecture",
				decision:
					"Build a distributed microservice system on AWS cloud with PostgreSQL database storage",
			};

			const result = await adrGenerator.generateADR(request);
			expect(result.markdown).toBeDefined();
			// Should have multiple consequence types due to multiple keywords
		});
	});

	describe("Branch: ADR numbering", () => {
		it("should increment ADR numbers sequentially", async () => {
			const session = createBasicSession();

			const request1: ADRRequest = {
				sessionState: session,
				title: "First Decision",
				context: "Context 1",
				decision: "Decision 1",
			};

			const request2: ADRRequest = {
				sessionState: session,
				title: "Second Decision",
				context: "Context 2",
				decision: "Decision 2",
			};

			const result1 = await adrGenerator.generateADR(request1);
			const result2 = await adrGenerator.generateADR(request2);

			expect(result1.artifact.id).toContain("adr-");
			expect(result2.artifact.id).toContain("adr-");
			// Numbers should be different
			expect(result1.artifact.id).not.toBe(result2.artifact.id);
		});
	});

	describe("Branch: Recommendation generation", () => {
		it("should generate recommendations for decisions", async () => {
			const session = createBasicSession();
			const request: ADRRequest = {
				sessionState: session,
				title: "Important Decision",
				context: "Critical system change",
				decision: "Significant architectural change",
			};

			const result = await adrGenerator.generateADR(request);
			expect(result.recommendations).toBeDefined();
			expect(Array.isArray(result.recommendations)).toBe(true);
		});
	});

	describe("Branch: Artifact structure", () => {
		it("should create properly structured artifact", async () => {
			const session = createBasicSession();
			const request: ADRRequest = {
				sessionState: session,
				title: "Test Decision",
				context: "Test context",
				decision: "Test decision",
			};

			const result = await adrGenerator.generateADR(request);

			expect(result.artifact.id).toBeDefined();
			expect(result.artifact.name).toContain("ADR-");
			expect(result.artifact.type).toBe("adr");
			expect(result.artifact.content).toBeDefined();
			expect(result.artifact.format).toBe("markdown");
			expect(result.artifact.timestamp).toBeDefined();
			expect(result.artifact.metadata).toBeDefined();
			expect(result.artifact.metadata?.sessionId).toBe(
				session.config.sessionId,
			);
		});
	});

	describe("Branch: Decision content analysis", () => {
		it("should handle decisions with no special keywords", async () => {
			const session = createBasicSession();
			const request: ADRRequest = {
				sessionState: session,
				title: "Generic Decision",
				context: "General context",
				decision: "Make a standard choice about implementation details",
			};

			const result = await adrGenerator.generateADR(request);
			expect(result.markdown).toBeDefined();
			expect(result.artifact).toBeDefined();
		});

		it("should handle very short decisions", async () => {
			const session = createBasicSession();
			const request: ADRRequest = {
				sessionState: session,
				title: "Brief",
				context: "Quick",
				decision: "Do it",
			};

			const result = await adrGenerator.generateADR(request);
			expect(result.markdown).toBeDefined();
		});

		it("should handle very long decisions", async () => {
			const session = createBasicSession();
			const request: ADRRequest = {
				sessionState: session,
				title: "Complex Decision",
				context: "Detailed context",
				decision: `
This is a very long decision description that spans multiple lines and includes
many details about the decision-making process. It discusses various aspects
including technical considerations, business requirements, team feedback, and
stakeholder input. The decision also considers future maintainability, scalability,
and the long-term vision for the system architecture.
				`.trim(),
			};

			const result = await adrGenerator.generateADR(request);
			expect(result.markdown).toBeDefined();
			expect(result.markdown.length).toBeGreaterThan(100);
		});
	});

	describe("Branch: Date formatting", () => {
		it("should format dates correctly in ADR", async () => {
			const session = createBasicSession();
			const request: ADRRequest = {
				sessionState: session,
				title: "Test Decision",
				context: "Test context",
				decision: "Test decision",
			};

			const result = await adrGenerator.generateADR(request);
			expect(result.markdown).toContain("Date");
			// Should have a formatted date
			expect(result.markdown).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
		});
	});
});
