// Comprehensive test suite for roadmap-generator.ts to maximize function coverage
import { describe, expect, it } from "vitest";
import { roadmapGenerator } from "../../dist/tools/design/roadmap-generator.js";
import type {
	DesignPhase,
	DesignSessionState,
} from "../../dist/tools/design/types.js";

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
						metadata: { priority: "high", complexity: "medium" },
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
			priority: "high",
			includeRisks: true,
			includeDependencies: true,
			includeTimeline: true,
			format: "markdown",
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
			priority: "strategic",
			includeRisks: true,
			includeDependencies: false,
			includeTimeline: true,
			format: "markdown",
		});

		expect(result.artifact.type).toBe("roadmap");
		expect(result.content).toContain("Strategic Platform Roadmap");
		expect(result.dependencies).toEqual([]);
		expect(result.milestones.some((m) => m.type === "strategic")).toBe(true);
	});

	it("should generate tactical roadmap with mermaid format", async () => {
		const sessionState = createTestSessionState();

		const result = await roadmapGenerator.generateRoadmap({
			sessionState,
			title: "Tactical Implementation Roadmap",
			timeframe: "3 months",
			priority: "tactical",
			includeRisks: false,
			includeDependencies: true,
			includeTimeline: false,
			format: "mermaid",
		});

		expect(result.content).toContain("gantt");
		expect(result.content).toContain("title");
		expect(result.risks).toEqual([]);
		expect(result.timeline).toEqual([]);
		expect(result.milestones.some((m) => m.type === "tactical")).toBe(true);
	});

	it("should generate operational roadmap with JSON format", async () => {
		const sessionState = createTestSessionState();

		const result = await roadmapGenerator.generateRoadmap({
			sessionState,
			title: "Operational Roadmap",
			timeframe: "1 month",
			priority: "operational",
			includeRisks: true,
			includeDependencies: true,
			includeTimeline: true,
			format: "json",
			metadata: {
				environment: "production",
				criticality: "high",
				owner: "ops-team",
			},
		});

		const parsedContent = JSON.parse(result.content);
		expect(parsedContent.title).toBe("Operational Roadmap");
		expect(parsedContent.priority).toBe("operational");
		expect(result.milestones.some((m) => m.type === "operational")).toBe(true);
		expect(result.artifact.metadata.environment).toBe("production");
	});

	it("should handle different timeframes and calculate effort correctly", async () => {
		const sessionState = createTestSessionState();

		const shortTermResult = await roadmapGenerator.generateRoadmap({
			sessionState,
			title: "Short Term Roadmap",
			timeframe: "2 weeks",
			priority: "high",
			includeRisks: true,
			includeDependencies: true,
			includeTimeline: true,
			format: "markdown",
		});

		const longTermResult = await roadmapGenerator.generateRoadmap({
			sessionState,
			title: "Long Term Roadmap",
			timeframe: "24 months",
			priority: "strategic",
			includeRisks: true,
			includeDependencies: true,
			includeTimeline: true,
			format: "markdown",
		});

		expect(shortTermResult.milestones.length).toBeGreaterThan(0);
		expect(longTermResult.milestones.length).toBeGreaterThan(0);
		expect(longTermResult.timeline.length).toBeGreaterThanOrEqual(
			shortTermResult.timeline.length,
		);
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
			priority: "high",
			includeRisks: true,
			includeDependencies: true,
			includeTimeline: true,
			format: "markdown",
		});

		expect(result.dependencies.length).toBeGreaterThan(2);
		expect(result.timeline.length).toBeGreaterThan(3);
		expect(result.risks.some((r) => r.impact === "high")).toBe(true);
		expect(result.milestones.length).toBeGreaterThan(5);
	});

	it("should generate implementation milestones with proper deliverables", async () => {
		const sessionState = createTestSessionState();

		const result = await roadmapGenerator.generateRoadmap({
			sessionState,
			title: "Implementation Focused Roadmap",
			timeframe: "6 months",
			priority: "high",
			includeRisks: true,
			includeDependencies: true,
			includeTimeline: true,
			format: "markdown",
			metadata: { focus: "implementation", track: "fast" },
		});

		expect(result.milestones.some((m) => m.deliverables.length > 0)).toBe(true);
		expect(result.milestones.some((m) => m.criteria.length > 0)).toBe(true);
		expect(result.milestones.some((m) => m.type === "implementation")).toBe(
			true,
		);
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
			priority: "high",
			includeRisks: true,
			includeDependencies: true,
			includeTimeline: true,
			format: "markdown",
		});

		expect(result.risks.some((r) => r.probability === "high")).toBe(true);
		expect(result.risks.some((r) => r.impact === "critical")).toBe(true);
		expect(result.risks.some((r) => r.mitigation.length > 0)).toBe(true);
		expect(result.recommendations.some((r) => r.includes("risk"))).toBe(true);
	});

	it("should generate comprehensive recommendations", async () => {
		const sessionState = createTestSessionState();
		sessionState.coverage.overall = 60; // Lower coverage to trigger recommendations
		sessionState.coverage.phases["development"] = 50;

		const result = await roadmapGenerator.generateRoadmap({
			sessionState,
			title: "Needs Improvement Roadmap",
			timeframe: "4 months",
			priority: "medium",
			includeRisks: true,
			includeDependencies: true,
			includeTimeline: true,
			format: "markdown",
		});

		expect(result.recommendations.length).toBeGreaterThan(2);
		expect(
			result.recommendations.some(
				(r) => r.includes("coverage") || r.includes("quality"),
			),
		).toBe(true);
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
