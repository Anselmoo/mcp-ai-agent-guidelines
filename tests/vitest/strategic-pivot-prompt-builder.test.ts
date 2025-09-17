// Comprehensive test suite for strategic-pivot-prompt-builder.ts
import { beforeEach, describe, expect, it } from "vitest";
import { strategicPivotPromptBuilder } from "../../dist/tools/design/strategic-pivot-prompt-builder.js";
import type {
	DesignSessionState,
	PivotDecision,
	StrategicPivotPromptRequest,
} from "../../dist/tools/design/types.js";

describe("Strategic Pivot Prompt Builder Comprehensive Coverage", () => {
	beforeEach(async () => {
		await strategicPivotPromptBuilder.initialize();
	});

	const createTestSessionState = (coverage = 85): DesignSessionState => ({
		config: {
			sessionId: "test-strategic-pivot-session",
			context: "Complex system requiring strategic pivot guidance",
			goal: "Design resilient architecture with adaptive capabilities",
			requirements: [
				"Handle complex data transformations",
				"Support real-time analytics",
				"Maintain scalability under load",
				"Ensure security and compliance",
			],
			constraints: [
				{
					id: "architectural-001",
					name: "Modular Architecture",
					type: "architectural",
					category: "design",
					description: "System must follow modular architecture principles",
					validation: {
						minCoverage: 85,
						keywords: ["module", "component", "interface"],
					},
					weight: 15,
					mandatory: true,
					source: "Space 7 Architecture Guidelines",
				},
				{
					id: "security-001",
					name: "Security by Design",
					type: "technical",
					category: "security",
					description:
						"Security considerations must be built into architecture",
					validation: {
						minCoverage: 90,
						keywords: ["secure", "auth", "privacy"],
					},
					weight: 15,
					mandatory: true,
					source: "Security Guidelines",
				},
			],
			coverageThreshold: 85,
			enablePivots: true,
			templateRefs: ["architecture-templates", "space7-instructions"],
			outputFormats: ["markdown", "mermaid"],
			metadata: { pivotType: "strategic", analysisDepth: "comprehensive" },
		},
		currentPhase: "architecture",
		phases: {
			discovery: {
				id: "discovery",
				name: "Discovery & Context",
				description: "Establish context and objectives",
				inputs: ["stakeholder-input", "business-requirements"],
				outputs: ["context-mapping", "stakeholder-analysis"],
				criteria: ["Clear problem definition", "Stakeholder identification"],
				coverage: 95,
				status: "completed",
				artifacts: [],
				dependencies: [],
			},
			requirements: {
				id: "requirements",
				name: "Requirements Analysis",
				description: "Define functional and non-functional requirements",
				inputs: ["context-mapping", "stakeholder-analysis"],
				outputs: ["functional-requirements", "non-functional-requirements"],
				criteria: ["Requirements are testable", "Priority levels assigned"],
				coverage: 88,
				status: "completed",
				artifacts: [],
				dependencies: ["discovery"],
			},
			architecture: {
				id: "architecture",
				name: "Architecture Design",
				description: "Design system architecture and components",
				inputs: ["requirements"],
				outputs: ["architecture-diagram", "component-specifications"],
				criteria: ["Scalability considerations", "Security by design"],
				coverage: coverage,
				status: "in-progress",
				artifacts: [],
				dependencies: ["requirements"],
			},
		},
		coverage: {
			overall: coverage,
			phases: { discovery: 95, requirements: 88, architecture: coverage },
			constraints: { "architectural-001": 82, "security-001": 78 },
			assumptions: {},
			documentation: {},
			testCoverage: 75,
		},
		artifacts: [
			{
				id: "context-map-001",
				name: "System Context Map",
				type: "diagram",
				content:
					"# System Context\n\nCore system boundaries and interactions...",
				format: "markdown",
				metadata: { phase: "discovery" },
				timestamp: "2024-01-10T10:00:00Z",
			},
		],
		history: [
			{
				timestamp: "2024-01-10T09:00:00Z",
				type: "phase-start",
				phase: "discovery",
				description: "Started discovery phase",
				data: { coverage: 0 },
			},
			{
				timestamp: "2024-01-10T10:30:00Z",
				type: "phase-complete",
				phase: "discovery",
				description: "Completed discovery phase",
				data: { coverage: 95 },
			},
		],
		status: "active",
	});

	const createTestPivotDecision = (
		triggered = true,
		complexity = 88,
		entropy = 75,
	): PivotDecision => ({
		triggered,
		reason: triggered
			? `High complexity score (${complexity}) exceeds threshold (85)`
			: "Complexity and entropy within acceptable bounds",
		complexity,
		entropy,
		threshold: 85,
		alternatives: triggered
			? [
					"Simplify architecture by reducing component complexity",
					"Adopt microservices pattern for better separation of concerns",
					"Consider off-the-shelf solutions instead of custom development",
					"Split into multiple independent projects",
				]
			: ["Continue with current approach while monitoring complexity"],
		recommendation: triggered
			? "Recommended pivot due to excessive complexity. Consider architectural simplification."
			: "Continue monitoring complexity and uncertainty levels.",
	});

	it("should initialize successfully", async () => {
		await strategicPivotPromptBuilder.initialize();
		expect(true).toBe(true); // Initialization should not throw
	});

	it("should generate comprehensive strategic pivot prompt when pivot is triggered", async () => {
		const sessionState = createTestSessionState(82);
		const pivotDecision = createTestPivotDecision(true, 88, 75);

		const request: StrategicPivotPromptRequest = {
			sessionState,
			pivotDecision,
			context:
				"Architecture phase showing high complexity with integration challenges",
			includeTemplates: true,
			includeSpace7Instructions: true,
			customInstructions: [
				"Focus on microservices transition",
				"Emphasize security considerations",
			],
		};

		const result =
			await strategicPivotPromptBuilder.generateStrategicPivotPrompt(request);

		expect(result.success).toBe(true);
		expect(result.prompt).toContain("🔄 Strategic Pivot Guidance");
		expect(result.prompt).toContain("Current Situation");
		expect(result.prompt).toContain("Pivot Analysis");
		expect(result.prompt).toContain("Strategic Guidance");
		expect(result.prompt).toContain("Implementation Steps");
		expect(result.prompt).toContain("Conversation Starters");

		// Check metadata
		expect(result.metadata.pivotReason).toContain("High complexity score");
		expect(result.metadata.complexityScore).toBe(88);
		expect(result.metadata.entropyLevel).toBe(75);
		expect(result.metadata.space7Integration).toBe(true);
		expect(result.metadata.templatesIncluded).toContain(
			"Design Process Template",
		);
		expect(result.metadata.estimatedImpact.timelineChange).toBeDefined();
		expect(result.metadata.estimatedImpact.riskLevel).toBeDefined();

		// Check suggested artifacts
		expect(result.suggestedArtifacts).toContain("adr");
		expect(result.suggestedArtifacts.length).toBeGreaterThan(0);

		// Check next steps
		expect(result.nextSteps).toContain(
			"Document current state and pivot rationale in ADR",
		);
		expect(result.nextSteps.length).toBeGreaterThan(5);

		// Check conversation starters
		expect(result.conversationStarters).toContain(
			"Pivot Necessity: What specific indicators suggest we need to change direction now?",
		);
		expect(result.conversationStarters.length).toBe(6);
	});

	it("should generate monitoring guidance when no pivot is needed", async () => {
		const sessionState = createTestSessionState(88);
		const pivotDecision = createTestPivotDecision(false, 45, 30); // Lower complexity to be in "Low" range

		const request: StrategicPivotPromptRequest = {
			sessionState,
			pivotDecision,
			context:
				"Architecture phase progressing normally with acceptable complexity",
		};

		const result =
			await strategicPivotPromptBuilder.generateStrategicPivotPrompt(request);

		expect(result.success).toBe(true);
		expect(result.prompt).toContain("🔄 Strategic Pivot Guidance");
		expect(result.prompt).toContain(
			"Low - Complexity is within acceptable bounds",
		);
		expect(result.prompt).toContain(
			"Continue with current approach** while maintaining vigilant monitoring",
		);

		expect(result.metadata.complexityScore).toBe(45);
		expect(result.metadata.entropyLevel).toBe(30);
		expect(result.metadata.estimatedImpact.timelineChange).toBe("minimal");
		expect(result.metadata.estimatedImpact.riskLevel).toBe("low");
		expect(result.suggestedArtifacts).toHaveLength(0); // No artifacts needed for monitoring
	});

	it("should handle critical complexity scenarios with comprehensive guidance", async () => {
		const sessionState = createTestSessionState(75);
		const pivotDecision = createTestPivotDecision(true, 95, 85);

		const request: StrategicPivotPromptRequest = {
			sessionState,
			pivotDecision,
			context:
				"Critical complexity threshold exceeded with architectural bottlenecks",
			includeTemplates: true,
			includeSpace7Instructions: true,
		};

		const result =
			await strategicPivotPromptBuilder.generateStrategicPivotPrompt(request);

		expect(result.success).toBe(true);
		expect(result.prompt).toContain(
			"Critical - System complexity is unmanageable",
		);
		expect(result.prompt).toContain(
			"Critical - Too much uncertainty to proceed confidently",
		);
		expect(result.prompt).toContain("**Timeline Impact**: major");
		expect(result.prompt).toContain("**Risk Level**: critical");

		expect(result.metadata.estimatedImpact.timelineChange).toBe("major");
		expect(result.metadata.estimatedImpact.resourcesRequired).toBe("critical");
		expect(result.metadata.estimatedImpact.riskLevel).toBe("critical");
		expect(result.metadata.estimatedImpact.confidenceLevel).toBe(15); // 100 - 85

		// Should suggest multiple artifacts for critical scenarios
		expect(result.suggestedArtifacts).toContain("adr");
		expect(result.suggestedArtifacts).toContain("specification");
		expect(result.suggestedArtifacts).toContain("roadmap");

		// Should include rollback plan for critical scenarios
		expect(result.prompt).toContain("Rollback Plan");
	});

	it("should customize output based on template inclusion preferences", async () => {
		const sessionState = createTestSessionState(82);
		const pivotDecision = createTestPivotDecision(true, 78, 68);

		// Test with templates excluded
		const requestWithoutTemplates: StrategicPivotPromptRequest = {
			sessionState,
			pivotDecision,
			includeTemplates: false,
			includeSpace7Instructions: false,
		};

		const resultWithoutTemplates =
			await strategicPivotPromptBuilder.generateStrategicPivotPrompt(
				requestWithoutTemplates,
			);

		expect(resultWithoutTemplates.prompt).not.toContain("Template References");
		expect(resultWithoutTemplates.prompt).not.toContain(
			"Space 7 General Instructions Integration",
		);
		expect(resultWithoutTemplates.metadata.templatesIncluded).toHaveLength(0);
		expect(resultWithoutTemplates.metadata.space7Integration).toBe(false);

		// Test with templates included
		const requestWithTemplates: StrategicPivotPromptRequest = {
			sessionState,
			pivotDecision,
			includeTemplates: true,
			includeSpace7Instructions: true,
		};

		const resultWithTemplates =
			await strategicPivotPromptBuilder.generateStrategicPivotPrompt(
				requestWithTemplates,
			);

		expect(resultWithTemplates.prompt).toContain("Template References");
		expect(resultWithTemplates.prompt).toContain(
			"Space 7 General Instructions Integration",
		);
		expect(
			resultWithTemplates.metadata.templatesIncluded.length,
		).toBeGreaterThan(0);
		expect(resultWithTemplates.metadata.space7Integration).toBe(true);
	});

	it("should incorporate custom instructions effectively", async () => {
		const sessionState = createTestSessionState(80);
		const pivotDecision = createTestPivotDecision(true, 82, 70);

		const customInstructions = [
			"Consider database migration complexities",
			"Account for third-party API limitations",
			"Prioritize backward compatibility",
		];

		const request: StrategicPivotPromptRequest = {
			sessionState,
			pivotDecision,
			customInstructions,
		};

		const result =
			await strategicPivotPromptBuilder.generateStrategicPivotPrompt(request);

		expect(result.success).toBe(true);
		// Custom instructions should influence the guidance (implementation detail)
		expect(result.prompt).toBeDefined();
		expect(result.nextSteps.length).toBeGreaterThan(5);
	});

	it("should generate appropriate impact assessments for different complexity levels", async () => {
		const testCases = [
			{
				complexity: 95,
				entropy: 85,
				expectedTimeline: "major",
				expectedRisk: "critical",
			},
			{
				complexity: 80,
				entropy: 70,
				expectedTimeline: "significant",
				expectedRisk: "high",
			},
			{
				complexity: 65,
				entropy: 50,
				expectedTimeline: "moderate",
				expectedRisk: "medium",
			},
			{
				complexity: 45,
				entropy: 30,
				expectedTimeline: "minimal",
				expectedRisk: "low",
			},
		];

		for (const testCase of testCases) {
			const sessionState = createTestSessionState(75);
			const pivotDecision = createTestPivotDecision(
				true,
				testCase.complexity,
				testCase.entropy,
			);

			const request: StrategicPivotPromptRequest = {
				sessionState,
				pivotDecision,
			};

			const result =
				await strategicPivotPromptBuilder.generateStrategicPivotPrompt(request);

			expect(result.metadata.estimatedImpact.timelineChange).toBe(
				testCase.expectedTimeline,
			);
			expect(result.metadata.estimatedImpact.riskLevel).toBe(
				testCase.expectedRisk,
			);
			expect(result.metadata.estimatedImpact.confidenceLevel).toBe(
				Math.max(0, 100 - testCase.entropy),
			);
		}
	});

	it("should generate context-aware conversation starters", async () => {
		const sessionState = createTestSessionState(78);
		const pivotDecision = createTestPivotDecision(true, 85, 72);

		const request: StrategicPivotPromptRequest = {
			sessionState,
			pivotDecision,
			context:
				"Team struggling with technical debt and architectural decisions",
		};

		const result =
			await strategicPivotPromptBuilder.generateStrategicPivotPrompt(request);

		expect(result.conversationStarters).toHaveLength(6);
		expect(result.conversationStarters[0]).toContain("Pivot Necessity");
		expect(result.conversationStarters[1]).toContain("Impact Assessment");
		expect(result.conversationStarters[2]).toContain("Resource Planning");
		expect(result.conversationStarters[3]).toContain("Stakeholder Alignment");
		expect(result.conversationStarters[4]).toContain("Success Metrics");
		expect(result.conversationStarters[5]).toContain("Risk Mitigation");
	});

	it("should handle edge cases and error conditions gracefully", async () => {
		const sessionState = createTestSessionState(85);
		const pivotDecision: PivotDecision = {
			triggered: true,
			reason: "Test edge case",
			complexity: 100,
			entropy: 100,
			threshold: 85,
			alternatives: [], // Empty alternatives
			recommendation: "Test recommendation",
		};

		const request: StrategicPivotPromptRequest = {
			sessionState,
			pivotDecision,
		};

		const result =
			await strategicPivotPromptBuilder.generateStrategicPivotPrompt(request);

		expect(result.success).toBe(true);
		expect(result.prompt).toContain("🔄 Strategic Pivot Guidance");
		expect(result.nextSteps.length).toBeGreaterThan(0);
		expect(result.conversationStarters.length).toBe(6);
	});

	it("should provide comprehensive trade-offs analysis", async () => {
		const sessionState = createTestSessionState(76);
		const pivotDecision = createTestPivotDecision(true, 87, 73);

		const request: StrategicPivotPromptRequest = {
			sessionState,
			pivotDecision,
			context: "Evaluating architectural pivot options",
		};

		const result =
			await strategicPivotPromptBuilder.generateStrategicPivotPrompt(request);

		expect(result.prompt).toContain("Trade-offs Analysis");
		expect(result.prompt).toContain("**Pros:**");
		expect(result.prompt).toContain("**Cons:**");
		expect(result.prompt).toContain("**Risks:**");
		expect(result.prompt).toContain("**Opportunities:**");
		expect(result.prompt).toContain("✅"); // Pros indicators
		expect(result.prompt).toContain("❌"); // Cons indicators
		expect(result.prompt).toContain("⚠️"); // Risk indicators
		expect(result.prompt).toContain("🚀"); // Opportunity indicators
	});
});
