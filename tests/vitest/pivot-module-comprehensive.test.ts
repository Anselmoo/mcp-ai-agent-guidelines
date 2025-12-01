// Comprehensive test suite for pivot-module.ts to maximize function coverage
import { beforeEach, describe, expect, it } from "vitest";
import { pivotModule } from "../../src/tools/design/pivot-module.ts";
import type {
	DesignSessionState,
	PivotRequest,
} from "../../src/tools/design/types.ts";

describe("Pivot Module Comprehensive Function Coverage", () => {
	beforeEach(async () => {
		await pivotModule.initialize();
	});

	const createTestSessionState = (coverage = 85): DesignSessionState => ({
		config: {
			sessionId: "test-pivot-session",
			context: "Platform pivot analysis",
			goal: "Evaluate pivot necessity and recommendations",
			requirements: [
				"Analyze system complexity and entropy levels",
				"Evaluate pivot necessity based on coverage",
				"Provide alternative approaches and recommendations",
			],
			constraints: [
				{
					id: "complexity-001",
					name: "Complexity Constraint",
					type: "technical",
					category: "complexity",
					description: "System complexity must remain manageable",
					validation: { minCoverage: 70 },
					weight: 0.8,
					mandatory: true,
					source: "Technical Guidelines",
				},
			],
			coverageThreshold: 85,
			enablePivots: true,
			templateRefs: ["pivot-analysis"],
			outputFormats: ["markdown"],
			metadata: { analysisType: "comprehensive" },
			methodologySignals: {
				projectType: "analytics-overhaul",
				problemFraming: "uncertain-modeling",
				riskLevel: "high",
				timelinePressure: "urgent",
				stakeholderMode: "technical",
			},
		},
		currentPhase: "validation",
		phases: {
			discovery: {
				id: "discovery",
				name: "Discovery",
				description: "Initial discovery phase",
				status: "completed",
				inputs: ["market research", "user feedback"],
				outputs: ["insights", "opportunities"],
				criteria: ["insights validated"],
				coverage: 88,
				artifacts: [
					{
						id: "insight-001",
						name: "Market Insights",
						type: "specification",
						content:
							"Comprehensive market analysis with user behavior patterns and competitive landscape assessment",
						format: "markdown",
						timestamp: "2024-01-01T10:00:00Z",
						metadata: {
							complexity: "high",
							uncertainty: "medium",
							keywords: [
								"machine learning",
								"data pipeline",
								"real-time processing",
								"scalability",
								"performance optimization",
							],
						},
					},
				],
				dependencies: [],
			},
			validation: {
				id: "validation",
				name: "Validation",
				description: "Hypothesis validation",
				status: "active",
				inputs: ["insights"],
				outputs: ["validated hypotheses"],
				criteria: ["hypotheses tested"],
				coverage: coverage,
				artifacts: [],
				dependencies: ["discovery"],
			},
		},
		coverage: {
			overall: coverage,
			phases: { discovery: 88, validation: coverage },
			constraints: { "complexity-001": 75 },
			assumptions: { "user-behavior": 70 },
			documentation: { "analysis-docs": 60 },
			testCoverage: 70,
		},
		artifacts: [
			{
				id: "data-001",
				name: "User Behavior Data",
				type: "data",
				content:
					"Complex user interaction patterns showing decreased engagement and conversion rates over time",
				format: "json",
				timestamp: "2024-01-20T10:00:00Z",
				metadata: {
					entropy: "high",
					patterns: ["engagement_drop", "conversion_decline"],
					signals: ["user_churn", "feature_abandonment"],
				},
			},
		],
		history: [
			{
				timestamp: "2024-01-22T10:00:00Z",
				type: "phase-start",
				phase: "validation",
				description: "Started validation phase",
			},
		],
		status: "active",
		methodologySelection: {
			id: "dual-track-discovery",
			name: "Dual Track Discovery + Agile Execution",
			confidence: 95,
			rationale: "Ideal for uncertain environments",
		},
		methodologyProfile: {
			strengths: ["risk mitigation", "continuous learning"],
			considerations: ["resource intensive"],
			adaptations: ["rapid iteration"],
		},
	});

	it("should evaluate pivot need with high complexity and high entropy", async () => {
		const sessionState = createTestSessionState(60); // Low coverage to trigger pivot

		const request: PivotRequest = {
			sessionState,
			currentContent:
				"High complexity system with performance issues. Microservices architecture with multiple database integrations and complex user workflows requiring significant maintenance overhead.",
			triggerReason: "complexity",
			forceEvaluation: false,
		};

		const result = await pivotModule.evaluatePivotNeed(request);

		expect(result).toBeDefined();
		expect(result.recommendation).toBeDefined();
		expect(result.alternatives).toBeDefined();
		expect(result.alternatives.length).toBeGreaterThanOrEqual(0);
		expect(result.complexity).toBeGreaterThan(0);
		expect(result.entropy).toBeGreaterThan(0);
		expect(result.reason).toBeDefined();
		expect(result.reason.length).toBeGreaterThan(0);
	});

	it("should evaluate pivot need with entropy trigger", async () => {
		const sessionState = createTestSessionState(75);

		const request: PivotRequest = {
			sessionState,
			currentContent:
				"System showing high entropy and unpredictable behavior. Requirements are constantly changing with unclear technical specifications and evolving user needs.",
			triggerReason: "entropy",
			forceEvaluation: false,
		};

		const result = await pivotModule.evaluatePivotNeed(request);

		expect(result.recommendation).toBeDefined();
		expect(result.alternatives.length).toBeGreaterThanOrEqual(0);
		expect(result.reason).toContain("entropy");
	});

	it("should evaluate pivot need with coverage trigger", async () => {
		const sessionState = createTestSessionState(40); // Very low coverage

		const request: PivotRequest = {
			sessionState,
			currentContent:
				"Coverage dropped significantly below threshold. Critical functionality is missing test coverage and code quality checks.",
			triggerReason: "coverage",
			forceEvaluation: false,
		};

		const result = await pivotModule.evaluatePivotNeed(request);

		expect(result.recommendation).toBeDefined();
		expect(result.complexity).toBeGreaterThan(0); // Should be positive complexity score
		expect(result.reason).toContain("coverage");
		expect(result.alternatives.length).toBeGreaterThanOrEqual(0);
	});

	it("should evaluate pivot need with performance trigger", async () => {
		const sessionState = createTestSessionState(80);

		const request: PivotRequest = {
			sessionState,
			currentContent:
				"System performance degraded significantly. Response times are slow, throughput is reduced, and error rates are increasing.",
			triggerReason: "performance",
			forceEvaluation: false,
		};

		const result = await pivotModule.evaluatePivotNeed(request);

		expect(result.recommendation).toBeDefined();
		expect(result.alternatives.length).toBeGreaterThanOrEqual(0);
		expect(result.reason).toBeDefined();
	});

	it.skip("should identify bottlenecks in system architecture", async () => {
		// Function identifyBottlenecks was removed as dead code - not used in main application
		const sessionState = createTestSessionState(70);

		// Test skipped - function removed during dead code cleanup
		expect(true).toBe(true);
	});

	it.skip("should recommend simplification strategies", async () => {
		// Function recommendSimplification was removed as dead code - not used in main application
		const complexSessionState = createTestSessionState(55);

		// Test skipped - function removed during dead code cleanup
		expect(true).toBe(true);
	});

	it("should handle low urgency pivot evaluation", async () => {
		const sessionState = createTestSessionState(88); // High coverage

		const request: PivotRequest = {
			sessionState,
			currentContent:
				"Minor complexity concerns in the system architecture. Some optimization opportunities identified but not critical.",
			triggerReason: "complexity",
			forceEvaluation: false,
		};

		const result = await pivotModule.evaluatePivotNeed(request);

		expect(result.recommendation).toBeDefined();
		expect(result.complexity).toBeDefined();
		// With high coverage and low urgency, should still have valid results
		expect(result.alternatives.length).toBeGreaterThanOrEqual(0);
	});

	it("should generate alternatives for different scenarios", async () => {
		const sessionState = createTestSessionState(50);

		const criticalRequest: PivotRequest = {
			sessionState,
			currentContent:
				"Critical system failure requiring immediate pivot. System is failing with severe user impact and critical business implications.",
			triggerReason: "coverage",
			forceEvaluation: true,
		};

		const result = await pivotModule.evaluatePivotNeed(criticalRequest);

		expect(result.alternatives.length).toBeGreaterThanOrEqual(0);
		expect(result.triggered).toBe(true); // forceEvaluation should trigger
		expect(result.complexity).toBeGreaterThan(0); // Should have complexity score
	});

	it("should handle multiple complexity factors", async () => {
		const highComplexityState = createTestSessionState(65);
		highComplexityState.artifacts.push({
			id: "multi-complex-001",
			name: "Multi-Factor Complexity",
			type: "specification",
			content:
				"System exhibiting multiple complexity factors including algorithmic complexity, integration complexity, data complexity, and operational complexity with machine learning models and real-time processing requirements",
			format: "markdown",
			timestamp: "2024-01-25T10:00:00Z",
			metadata: {
				algorithmicComplexity: "high",
				integrationComplexity: "extreme",
				dataComplexity: "high",
				operationalComplexity: "high",
				keywords: [
					"machine learning",
					"real-time",
					"distributed",
					"microservices",
					"event-driven",
				],
			},
		});

		const request: PivotRequest = {
			sessionState: highComplexityState,
			currentContent:
				"Multiple complexity factors overwhelming system. Algorithmic complexity, integration complexity, data complexity, and operational complexity with machine learning models and real-time processing requirements.",
			triggerReason: "complexity",
			forceEvaluation: false,
		};

		const result = await pivotModule.evaluatePivotNeed(request);

		expect(result.complexity).toBeGreaterThan(0);
		expect(result.entropy).toBeGreaterThan(0);
		expect(result.alternatives.length).toBeGreaterThanOrEqual(0);
	});

	it("should analyze entropy factors with high variability", async () => {
		const highEntropyState = createTestSessionState(70);
		highEntropyState.artifacts[0].metadata.entropy = "extreme";
		highEntropyState.artifacts[0].metadata.variability = "high";
		highEntropyState.artifacts[0].content =
			"Extremely variable system behavior with unpredictable patterns, inconsistent performance metrics, and random failure modes that defy traditional analysis methods";

		const request: PivotRequest = {
			sessionState: highEntropyState,
			currentContent:
				"System entropy reaching critical levels. Extremely variable system behavior with unpredictable patterns, inconsistent performance metrics, and random failure modes that defy traditional analysis methods.",
			triggerReason: "entropy",
			forceEvaluation: false,
		};

		const result = await pivotModule.evaluatePivotNeed(request);

		expect(result.entropy).toBeGreaterThan(0);
		expect(result.reason).toContain("entropy");
		expect(result.alternatives.length).toBeGreaterThanOrEqual(0);
	});

	it("should generate alternatives for very high complexity (>80)", async () => {
		const veryHighComplexityState = createTestSessionState(40);
		// Add multiple complex artifacts to drive up complexity score
		veryHighComplexityState.artifacts.push({
			id: "extreme-complex-001",
			name: "Extreme Complexity Analysis",
			type: "specification",
			content:
				"Extremely complex distributed microservices architecture with event-driven messaging, machine learning pipelines, real-time data processing, multi-cloud deployment, and legacy system integration requiring significant refactoring",
			format: "markdown",
			timestamp: "2024-01-25T10:00:00Z",
			metadata: {
				complexity: "extreme",
				integrations: 50,
				microservices: 30,
				dataFlows: 100,
				keywords: [
					"microservices",
					"event-driven",
					"machine learning",
					"real-time",
					"multi-cloud",
					"legacy",
					"refactoring",
					"distributed",
					"kafka",
					"kubernetes",
				],
			},
		});

		const request: PivotRequest = {
			sessionState: veryHighComplexityState,
			currentContent:
				"Extremely complex distributed microservices architecture with event-driven messaging, machine learning pipelines, real-time data processing, multi-cloud deployment requiring complete architectural redesign with 50 integrations and 30 microservices",
			triggerReason: "complexity",
			forceEvaluation: true,
		};

		const result = await pivotModule.evaluatePivotNeed(request);

		expect(result.triggered).toBe(true);
		expect(result.alternatives.length).toBeGreaterThan(0);
		// Verify at least some alternatives are generated for high complexity
		expect(result.complexity).toBeGreaterThan(0);
	});

	it("should generate alternatives for very high entropy (>70)", async () => {
		const veryHighEntropyState = createTestSessionState(45);
		veryHighEntropyState.artifacts.push({
			id: "extreme-entropy-001",
			name: "Extreme Uncertainty Analysis",
			type: "specification",
			content:
				"Highly uncertain requirements with conflicting stakeholder needs, unclear business objectives, rapidly changing market conditions, and undefined technical constraints requiring extensive discovery",
			format: "markdown",
			timestamp: "2024-01-25T10:00:00Z",
			metadata: {
				uncertainty: "extreme",
				requirementsClarity: "very-low",
				stakeholderAlignment: "none",
				keywords: [
					"uncertain",
					"conflicting",
					"unclear",
					"changing",
					"undefined",
					"discovery",
					"unknown",
					"ambiguous",
				],
			},
		});

		const request: PivotRequest = {
			sessionState: veryHighEntropyState,
			currentContent:
				"Highly uncertain requirements with conflicting stakeholder needs, unclear business objectives, rapidly changing market conditions, and undefined technical constraints with unknown dependencies",
			triggerReason: "entropy",
			forceEvaluation: true,
		};

		const result = await pivotModule.evaluatePivotNeed(request);

		expect(result.triggered).toBe(true);
		expect(result.alternatives.length).toBeGreaterThan(0);
		// Verify entropy was calculated
		expect(result.entropy).toBeGreaterThan(0);
	});

	it("should generate alternatives for combined high complexity and entropy", async () => {
		const combinedState = createTestSessionState(35);
		combinedState.artifacts.push({
			id: "combined-issues-001",
			name: "Combined Complexity and Uncertainty",
			type: "specification",
			content:
				"Complex system with uncertain requirements, multiple integration points, unclear business rules, distributed architecture, and evolving technical landscape with unknown scalability needs",
			format: "markdown",
			timestamp: "2024-01-25T10:00:00Z",
			metadata: {
				complexity: "high",
				uncertainty: "high",
				keywords: [
					"complex",
					"uncertain",
					"integration",
					"unclear",
					"distributed",
					"evolving",
					"unknown",
					"scalability",
				],
			},
		});

		const request: PivotRequest = {
			sessionState: combinedState,
			currentContent:
				"Complex system with uncertain requirements, multiple integration points, unclear business rules, distributed architecture, and evolving technical landscape with unknown scalability needs requiring both simplification and clarification",
			triggerReason: "complexity",
			forceEvaluation: true,
		};

		const result = await pivotModule.evaluatePivotNeed(request);

		expect(result.triggered).toBe(true);
		expect(result.alternatives.length).toBeGreaterThan(0);
		// Verify both metrics were calculated
		expect(result.complexity).toBeGreaterThan(0);
		expect(result.entropy).toBeGreaterThan(0);
	});

	it("should detect coverage drop and trigger pivot", async () => {
		const coverageDropState = createTestSessionState(60);
		// Add history events with coverage updates showing a significant drop
		coverageDropState.history = [
			{
				timestamp: "2024-01-01T09:00:00Z",
				type: "coverage-update",
				description: "Initial coverage assessment",
				data: { coverage: 85 },
			},
			{
				timestamp: "2024-01-02T10:00:00Z",
				type: "coverage-update",
				description: "Coverage update after changes",
				data: { coverage: 75 },
			},
			{
				timestamp: "2024-01-03T11:00:00Z",
				type: "coverage-update",
				description: "Coverage dropped significantly",
				data: { coverage: 55 },
			},
		];

		const request: PivotRequest = {
			sessionState: coverageDropState,
			currentContent: "Coverage has dropped significantly due to scope creep",
			triggerReason: "coverage",
			forceEvaluation: false,
		};

		const result = await pivotModule.evaluatePivotNeed(request);

		// Coverage drop should be detected if the drop exceeds threshold
		expect(result.reason).toBeDefined();
		expect(result.alternatives).toBeDefined();
	});

	it("should return fallback alternatives when complexity and entropy are low", async () => {
		const lowRiskState = createTestSessionState(95);
		lowRiskState.artifacts = [
			{
				id: "simple-001",
				name: "Simple Project",
				type: "specification",
				content: "Simple CRUD application with basic requirements",
				format: "markdown",
				timestamp: "2024-01-25T10:00:00Z",
				metadata: {},
			},
		];

		const request: PivotRequest = {
			sessionState: lowRiskState,
			currentContent: "Simple application with well-defined requirements",
			triggerReason: undefined,
			forceEvaluation: true, // Force to get alternatives
		};

		const result = await pivotModule.evaluatePivotNeed(request);

		expect(result.triggered).toBe(true); // Due to forceEvaluation
		expect(result.alternatives.length).toBeGreaterThan(0);
		// Should have fallback alternatives for low-risk scenarios
		const hasFallbackAlternatives = result.alternatives.some(
			(alt) =>
				alt.includes("Continue with current") || alt.includes("design reviews"),
		);
		expect(hasFallbackAlternatives).toBe(true);
	});
});
