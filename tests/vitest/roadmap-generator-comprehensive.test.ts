// Comprehensive test suite for roadmap-generator.ts to maximize function coverage
import { describe, expect, it } from "vitest";
import { roadmapGenerator } from "../../src/tools/design/roadmap-generator.ts";
import type {
	DesignPhase,
	DesignSessionState,
} from "../../src/tools/design/types.ts";

describe("Roadmap Generator Comprehensive Function Coverage", () => {
	const createTestSessionState = (): DesignSessionState => ({
		config: {
			sessionId: "test-roadmap-session",
			context: "Mobile app development roadmap",
			goal: "Create comprehensive development roadmap",
			requirements: [
				"Develop cross-platform mobile app",
				"Implement offline functionality",
				"Support real-time synchronization",
				"Ensure data security and privacy",
			],
			constraints: [
				{
					id: "time-001",
					name: "Timeline Constraint",
					type: "business",
					category: "timeline",
					description: "Must launch within 6 months",
					validation: { minCoverage: 80 },
					weight: 0.9,
					mandatory: true,
					source: "Business Requirements",
				},
				{
					id: "budget-001",
					name: "Budget Constraint",
					type: "business",
					category: "budget",
					description: "Development budget capped at $500k",
					validation: {},
					weight: 0.8,
					mandatory: false,
					source: "Financial Planning",
				},
			],
			coverageThreshold: 85,
			enablePivots: true,
			templateRefs: ["roadmap-template"],
			outputFormats: ["markdown", "mermaid"],
			metadata: { team: "mobile-dev", budget: "$500k" },
			methodologySignals: {
				projectType: "interactive-feature",
				problemFraming: "empathy-focused",
				riskLevel: "medium",
				timelinePressure: "urgent",
				stakeholderMode: "business",
			},
		},
		currentPhase: "development",
		phases: {
			planning: {
				id: "planning",
				name: "Planning",
				description: "Project planning phase",
				status: "completed",
				inputs: ["business requirements", "user research"],
				outputs: ["project plan", "resource allocation"],
				criteria: ["plan approved", "resources assigned"],
				coverage: 92,
				artifacts: [
					{
						id: "plan-001",
						name: "Project Plan",
						type: "plan",
						content: "Detailed project plan with timelines",
						format: "markdown",
						timestamp: "2024-01-01T10:00:00Z",
						metadata: { complexity: "medium" },
					},
				],
				dependencies: [],
			},
			development: {
				id: "development",
				name: "Development",
				description: "Core development phase",
				status: "active",
				inputs: ["project plan", "design specs"],
				outputs: ["working software", "test results"],
				criteria: ["feature complete", "tests passing"],
				coverage: 78,
				artifacts: [],
				dependencies: ["planning"],
			},
			deployment: {
				id: "deployment",
				name: "Deployment",
				description: "Production deployment",
				status: "pending",
				inputs: ["tested software", "deployment plan"],
				outputs: ["live system", "monitoring setup"],
				criteria: ["system stable", "monitoring active"],
				coverage: 0,
				artifacts: [],
				dependencies: ["development"],
			},
		},
		coverage: {
			overall: 78,
			phases: { planning: 92, development: 78, deployment: 0 },
			constraints: { "time-001": 85, "budget-001": 90 },
			assumptions: { "user-adoption": 70 },
			documentation: { "api-docs": 60, "user-guide": 40 },
			testCoverage: 82,
		},
		artifacts: [],
		history: [
			{
				timestamp: "2024-01-16T10:00:00Z",
				type: "phase-start",
				phase: "development",
				description: "Started development phase",
			},
		],
		status: "active",
		methodologySelection: {
			id: "design-thinking",
			name: "Design Thinking (Empathy-Focused)",
			confidence: 95,
			rationale: "Perfect for user-facing features",
		},
		methodologyProfile: {
			strengths: ["user focus", "iterative approach"],
			considerations: ["time intensive"],
			adaptations: ["rapid prototyping"],
		},
	});

	it("should generate comprehensive development roadmap with markdown format", async () => {
		const sessionState = createTestSessionState();

		const result = await roadmapGenerator.generateRoadmap({
			sessionState,
			title: "Mobile App Development Roadmap",
			timeframe: "6 months",
			includeRisks: true,
			includeDependencies: true,
			includeResources: true,
			format: "markdown",
			granularity: "high",
			metadata: { team: "mobile-dev", budget: "$500k" },
		});

		expect(result).toBeDefined();
		expect(result.artifact.type).toBe("roadmap");
		expect(result.content).toContain("ROADMAP-");
		expect(result.milestones.length).toBeGreaterThan(0);
		expect(result.timeline.length).toBeGreaterThan(0);
		expect(result.risks.length).toBeGreaterThan(0);
		expect(result.dependencies.length).toBeGreaterThan(0);
		expect(result.recommendations.length).toBeGreaterThan(0);
	});

	it("should generate strategic roadmap with different priority", async () => {
		const sessionState = createTestSessionState();

		const result = await roadmapGenerator.generateRoadmap({
			sessionState,
			title: "Strategic Platform Roadmap",
			timeframe: "12 months",
			includeRisks: true,
			includeDependencies: false,
			includeResources: true,
			format: "markdown",
			granularity: "medium",
			metadata: { type: "strategic" },
		});

		expect(result.artifact.type).toBe("roadmap");
		expect(result.content).toContain("Strategic Platform Roadmap");
		expect(result.dependencies).toEqual([]);
		expect(result.milestones.length).toBeGreaterThan(0);
		expect(result.milestones[0].name).toContain("Complete");
	});

	it("should generate tactical roadmap with mermaid format", async () => {
		const sessionState = createTestSessionState();

		const result = await roadmapGenerator.generateRoadmap({
			sessionState,
			title: "Tactical Implementation Roadmap",
			timeframe: "3 months",
			includeRisks: false,
			includeDependencies: true,
			includeResources: false,
			format: "mermaid",
			granularity: "high",
			metadata: { type: "tactical" },
		});

		expect(result.content).toContain("gantt");
		expect(result.content).toContain("title");
		expect(result.risks).toEqual([]);
		expect(result.timeline.length).toBeGreaterThan(0);
		expect(result.milestones.length).toBeGreaterThan(0);
	});

	it("should generate operational roadmap with JSON format", async () => {
		const sessionState = createTestSessionState();

		const result = await roadmapGenerator.generateRoadmap({
			sessionState,
			title: "Operational Roadmap",
			timeframe: "1 month",
			includeRisks: true,
			includeDependencies: true,
			includeResources: true,
			format: "json",
			granularity: "high",
			metadata: {
				type: "operational",
				environment: "production",
				criticality: "high",
				owner: "ops-team",
			},
		});

		expect(result.artifact.format).toBe("json");
		expect(result.content).toContain("Operational Roadmap");
		expect(result.content).toContain("milestones");
		expect(result.milestones.length).toBeGreaterThan(0);
		expect(result.artifact.metadata.environment).toBe("production");
	});

	it("should handle different timeframes and calculate effort correctly", async () => {
		const sessionState = createTestSessionState();

		const shortTermResult = await roadmapGenerator.generateRoadmap({
			sessionState,
			title: "Short Term Roadmap",
			timeframe: "2 weeks",
			includeRisks: true,
			includeDependencies: true,
			includeResources: true,
			format: "markdown",
			granularity: "high",
		});

		const longTermResult = await roadmapGenerator.generateRoadmap({
			sessionState,
			title: "Long Term Roadmap",
			timeframe: "24 months",
			includeRisks: true,
			includeDependencies: true,
			includeResources: true,
			format: "markdown",
			granularity: "low",
		});

		expect(shortTermResult.milestones.length).toBeGreaterThan(0);
		expect(longTermResult.milestones.length).toBeGreaterThan(0);
		expect(longTermResult.timeline.length).toBeGreaterThan(0);
		expect(shortTermResult.timeline.length).toBeGreaterThan(0);
	});

	it("should generate roadmaps with complex phase dependencies", async () => {
		const complexSessionState = createTestSessionState();
		complexSessionState.phases["testing"] = {
			id: "testing",
			name: "Testing",
			description: "Comprehensive testing phase",
			status: "pending",
			inputs: ["developed features"],
			outputs: ["test reports", "quality metrics"],
			criteria: ["all tests pass", "performance acceptable"],
			coverage: 0,
			artifacts: [],
			dependencies: ["development"],
		};
		complexSessionState.phases["maintenance"] = {
			id: "maintenance",
			name: "Maintenance",
			description: "Ongoing maintenance phase",
			status: "pending",
			inputs: ["live system"],
			outputs: ["updates", "bug fixes"],
			criteria: ["system maintained"],
			coverage: 0,
			artifacts: [],
			dependencies: ["deployment", "testing"],
		};

		const result = await roadmapGenerator.generateRoadmap({
			sessionState: complexSessionState,
			title: "Complex Dependencies Roadmap",
			timeframe: "12 months",
			includeRisks: true,
			includeDependencies: true,
			includeResources: true,
			format: "markdown",
			granularity: "medium",
		});

		expect(result.dependencies.length).toBeGreaterThan(0);
		expect(result.timeline.length).toBeGreaterThan(0);
		expect(result.risks.length).toBeGreaterThan(0);
		expect(result.milestones.length).toBeGreaterThan(0);
	});

	it("should generate implementation milestones with proper deliverables", async () => {
		const sessionState = createTestSessionState();

		const result = await roadmapGenerator.generateRoadmap({
			sessionState,
			title: "Implementation Focused Roadmap",
			timeframe: "6 months",
			includeRisks: true,
			includeDependencies: true,
			includeResources: true,
			format: "markdown",
			granularity: "medium",
			metadata: { focus: "implementation", track: "fast" },
		});

		expect(
			result.milestones.some(
				(m) => m.deliverables && m.deliverables.length > 0,
			),
		).toBe(true);
		expect(
			result.milestones.some(
				(m) => m.successCriteria && m.successCriteria.length > 0,
			),
		).toBe(true);
		expect(result.milestones.length).toBeGreaterThan(0);
	});

	it("should handle risk assessment and mitigation", async () => {
		const highRiskSessionState = createTestSessionState();
		// Make the development phase higher risk with lower coverage
		highRiskSessionState.phases["development"].coverage = 45;
		highRiskSessionState.coverage.overall = 55;
		highRiskSessionState.coverage.phases["development"] = 45;

		const result = await roadmapGenerator.generateRoadmap({
			sessionState: highRiskSessionState,
			title: "High Risk Project Roadmap",
			timeframe: "9 months",
			includeRisks: true,
			includeDependencies: true,
			includeResources: true,
			format: "markdown",
			granularity: "high",
		});

		expect(result.risks.length).toBeGreaterThan(0);
		expect(
			result.risks.some((r) => r.mitigation && r.mitigation.length > 0),
		).toBe(true);
		expect(result.recommendations.length).toBeGreaterThan(0);
	});

	it("should generate comprehensive recommendations", async () => {
		const sessionState = createTestSessionState();
		sessionState.coverage.overall = 60; // Lower coverage to trigger recommendations
		sessionState.coverage.phases["development"] = 50;

		const result = await roadmapGenerator.generateRoadmap({
			sessionState,
			title: "Needs Improvement Roadmap",
			timeframe: "4 months",
			includeRisks: true,
			includeDependencies: true,
			includeResources: true,
			format: "markdown",
			granularity: "medium",
		});

		expect(result.recommendations.length).toBeGreaterThan(0);
		expect(result.recommendations.length).toBeGreaterThanOrEqual(1);
	});

	it("should handle minimal configuration with defaults", async () => {
		const sessionState = createTestSessionState();

		const result = await roadmapGenerator.generateRoadmap({
			sessionState,
			title: "Basic Roadmap",
		});

		expect(result.artifact.type).toBe("roadmap");
		expect(result.content).toContain("Basic Roadmap");
		expect(result.milestones).toBeDefined();
		expect(result.timeline).toBeDefined();
		expect(result.risks).toBeDefined();
		expect(result.dependencies).toBeDefined();
	});
});
