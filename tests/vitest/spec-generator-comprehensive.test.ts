// Comprehensive test coverage for spec-generator.ts
// Target: 29/30 uncovered functions
import { beforeEach, describe, expect, it } from "vitest";
import type { DesignSessionState } from "../../dist/tools/design/types.js";

describe("Spec Generator Comprehensive Function Coverage", () => {
	// Create comprehensive test session state
	const createTestSessionState = (
		phases: DesignPhase[] = [],
	): DesignSessionState => ({
		config: {
			sessionId: "test-session-spec",
			context: "E-commerce platform specification",
			goal: "Generate comprehensive technical specifications",
			requirements: [
				"Support 10,000 concurrent users",
				"Implement real-time inventory tracking",
				"Ensure payment security compliance",
				"Provide mobile-responsive interface",
			],
			constraints: [
				{
					id: "perf-001",
					name: "Performance Constraint",
					type: "non-functional",
					category: "performance",
					description: "Response time must be under 2 seconds",
					validation: { minCoverage: 90 },
					weight: 0.8,
					mandatory: true,
					source: "System Requirements",
				},
				{
					id: "sec-001",
					name: "Security Constraint",
					type: "non-functional",
					category: "security",
					description: "Must comply with PCI DSS standards",
					validation: { keywords: ["encryption", "authentication"] },
					weight: 1.0,
					mandatory: true,
					source: "Security Guidelines",
				},
			],
			coverageThreshold: 85,
			enablePivots: true,
			templateRefs: ["standard-spec", "api-spec"],
			outputFormats: ["markdown", "json"],
			metadata: { version: "1.0", priority: "high" },
			methodologySignals: {
				projectType: "large-refactor",
				problemFraming: "performance-first",
				riskLevel: "high",
				timelinePressure: "normal",
				stakeholderMode: "technical",
			},
		},
		currentPhase: "design",
		phases:
			phases.length > 0
				? phases.reduce((acc, phase) => ({ ...acc, [phase.id]: phase }), {})
				: {
						discovery: {
							id: "discovery",
							name: "Discovery",
							description: "Initial discovery phase",
							status: "completed",
							inputs: ["requirements", "constraints"],
							outputs: ["analysis", "specs"],
							criteria: ["completeness > 80%"],
							coverage: 85,
							artifacts: [],
							dependencies: [],
						},
						design: {
							id: "design",
							name: "Design",
							description: "System design phase",
							status: "active",
							inputs: ["discovery outputs"],
							outputs: ["architecture", "design docs"],
							criteria: ["design approved"],
							coverage: 75,
							artifacts: [
								{
									id: "arch-001",
									name: "System Architecture",
									type: "architecture",
									content: "Microservices architecture with event sourcing",
									format: "markdown",
									timestamp: "2024-01-16T10:00:00Z",
									metadata: { version: "1.0" },
								},
							],
							dependencies: ["discovery"],
						},
					},
		coverage: {
			overall: 85,
			phases: { discovery: 85, design: 75 },
			constraints: { "perf-001": 90, "sec-001": 95 },
			assumptions: { "load-assumption": 80 },
			documentation: { "api-docs": 70, "user-docs": 60 },
			testCoverage: 88,
		},
		artifacts: [],
		history: [
			{
				timestamp: "2024-01-16T10:00:00Z",
				type: "phase-start",
				phase: "design",
				description: "Started design phase",
			},
		],
		status: "active",
		methodologySelection: {
			id: "arch-decision-mapping",
			name: "Architecture Decision Mapping + Lightweight Iterative Loop",
			confidence: 100,
			rationale: "Perfect for large refactoring projects",
		},
		methodologyProfile: {
			strengths: ["systematic approach", "decision tracking"],
			considerations: ["documentation overhead"],
			adaptations: ["focus on performance metrics"],
		},
	});

	it("should generate technical specification with all features", async () => {
		const sessionState = createTestSessionState();

		const result = await specGenerator.generateSpecification({
			sessionState,
			title: "E-commerce Platform Technical Specification",
			type: "technical",
			includeMetrics: true,
			includeExamples: true,
			includeDiagrams: true,
			format: "markdown",
			metadata: { version: "1.0", priority: "high" },
		});

		expect(result).toBeDefined();
		expect(result.artifact).toBeDefined();
		expect(result.artifact.type).toBe("specification");
		expect(result.content).toContain("SPEC-");
		expect(result.sections).toBeDefined();
		expect(result.sections.length).toBeGreaterThan(0);
		expect(result.metrics).toBeDefined();
		expect(result.diagrams).toBeDefined();
		expect(result.recommendations).toBeDefined();
	});

	it("should generate functional specification", async () => {
		const sessionState = createTestSessionState();

		const result = await specGenerator.generateSpecification({
			sessionState,
			title: "User Management Functional Specification",
			type: "functional",
			includeMetrics: true,
			includeExamples: true,
			includeDiagrams: false,
			format: "markdown",
		});

		expect(result.artifact.type).toBe("specification");
		expect(result.content).toContain("Functional Specification");
		expect(result.sections.some((s) => s.title.includes("Requirements"))).toBe(
			true,
		);
		expect(result.diagrams).toEqual([]);
	});

	it("should generate API specification", async () => {
		const sessionState = createTestSessionState();

		const result = await specGenerator.generateSpecification({
			sessionState,
			title: "REST API Specification",
			type: "api",
			includeMetrics: false,
			includeExamples: true,
			includeDiagrams: true,
			format: "yaml",
		});

		expect(result.content).toContain("title: REST API Specification");
		expect(result.content).toContain("sections:");
		expect(result.metrics).toEqual([]);
		expect(result.sections.some((s) => s.title.includes("API"))).toBe(true);
	});

	it("should generate architecture specification", async () => {
		const sessionState = createTestSessionState();

		const result = await specGenerator.generateSpecification({
			sessionState,
			title: "System Architecture Specification",
			type: "architecture",
			includeMetrics: true,
			includeExamples: false,
			includeDiagrams: true,
			format: "json",
		});

		const parsedContent = JSON.parse(result.content);
		expect(parsedContent.title).toBe("System Architecture Specification");
		expect(parsedContent.type).toBe("architecture");
		expect(result.sections.some((s) => s.title.includes("Architecture"))).toBe(
			true,
		);
	});

	it("should generate implementation specification", async () => {
		const sessionState = createTestSessionState();

		const result = await specGenerator.generateSpecification({
			sessionState,
			title: "Implementation Guide",
			type: "implementation",
			includeMetrics: true,
			includeExamples: true,
			includeDiagrams: true,
			format: "markdown",
		});

		expect(result.content).toContain("Implementation");
		expect(
			result.sections.some((s) => s.title.includes("Implementation")),
		).toBe(true);
		expect(result.sections.some((s) => s.title.includes("Testing"))).toBe(true);
	});

	it("should generate specs with different phases and artifacts", async () => {
		const phasesWithArtifacts: DesignPhase[] = [
			{
				id: "analysis",
				name: "Analysis",
				description: "System analysis",
				status: "completed",
				inputs: ["business requirements"],
				outputs: ["technical analysis"],
				criteria: ["analysis complete"],
				coverage: 90,
				artifacts: [
					{
						id: "analysis-001",
						name: "Technical Analysis",
						type: "analysis",
						content: "Detailed technical analysis of current system",
						format: "markdown",
						timestamp: "2024-01-10T10:00:00Z",
						metadata: { complexity: "high" },
					},
					{
						id: "req-001",
						name: "Requirements Document",
						type: "requirements",
						content: "Functional and non-functional requirements",
						format: "markdown",
						timestamp: "2024-01-12T10:00:00Z",
						metadata: { priority: "critical" },
					},
				],
				dependencies: [],
			},
		];

		const sessionState = createTestSessionState(phasesWithArtifacts);

		const result = await specGenerator.generateSpecification({
			sessionState,
			title: "Comprehensive Specification",
			type: "technical",
			includeMetrics: true,
			includeExamples: true,
			includeDiagrams: true,
			format: "markdown",
		});

		expect(result.sections.length).toBeGreaterThan(3);
		expect(result.metrics.length).toBeGreaterThan(0);
		expect(result.content).toContain("Technical Analysis");
		expect(result.recommendations.length).toBeGreaterThan(0);
	});

	it("should handle different metadata and generate appropriate recommendations", async () => {
		const sessionState = createTestSessionState();

		const result = await specGenerator.generateSpecification({
			sessionState,
			title: "Performance Specification",
			type: "technical",
			includeMetrics: true,
			includeExamples: true,
			includeDiagrams: true,
			format: "markdown",
			metadata: {
				performance: "critical",
				scalability: "high",
				security: "strict",
				compliance: "required",
			},
		});

		expect(result.recommendations.length).toBeGreaterThan(0);
		expect(
			result.recommendations.some(
				(r) => r.includes("performance") || r.includes("scalability"),
			),
		).toBe(true);
		expect(result.artifact.metadata).toMatchObject({
			performance: "critical",
			scalability: "high",
			security: "strict",
			compliance: "required",
		});
	});

	it("should generate specs with minimal configuration", async () => {
		const sessionState = createTestSessionState();

		const result = await specGenerator.generateSpecification({
			sessionState,
			title: "Basic Specification",
		});

		expect(result.artifact.type).toBe("specification");
		expect(result.content).toContain("Basic Specification");
		expect(result.sections).toBeDefined();
		expect(result.metrics).toBeDefined();
		expect(result.diagrams).toBeDefined();
	});

	it("should handle different quality attributes and constraints", async () => {
		const sessionStateWithConstraints = createTestSessionState();
		// Add some constraints to the session state
		sessionStateWithConstraints.config.coverage = 99;

		const result = await specGenerator.generateSpecification({
			sessionState: sessionStateWithConstraints,
			title: "High Quality Specification",
			type: "architecture",
			includeMetrics: true,
			includeExamples: true,
			includeDiagrams: true,
			format: "markdown",
		});

		expect(result.content).toContain("Quality Attributes");
		expect(result.content).toContain("Constraints");
		expect(result.sections.some((s) => s.completeness > 80)).toBe(true);
		expect(result.metrics.some((m) => m.priority === "high")).toBe(true);
	});

	it("should generate comprehensive JSON specification with all components", async () => {
		const sessionState = createTestSessionState();

		const result = await specGenerator.generateSpecification({
			sessionState,
			title: "Complete JSON Specification",
			type: "api",
			includeMetrics: true,
			includeExamples: true,
			includeDiagrams: true,
			format: "json",
			metadata: {
				apiVersion: "v2",
				authentication: "oauth2",
				rateLimit: "1000/hour",
			},
		});

		const parsedContent = JSON.parse(result.content);
		expect(parsedContent.sections).toBeDefined();
		expect(parsedContent.metrics).toBeDefined();
		expect(parsedContent.metadata.apiVersion).toBe("v2");
		expect(result.sections.some((s) => s.title.includes("Components"))).toBe(
			true,
		);
		expect(result.sections.some((s) => s.title.includes("Interfaces"))).toBe(
			true,
		);
	});
});
