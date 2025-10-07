// Comprehensive Coverage Improvement Test Suite
// Target: Increase coverage to 85% by testing uncovered functions

import { beforeEach, describe, expect, it } from "vitest";
import { adrGenerator } from "../../src/tools/design/adr-generator.js";
import { confirmationPromptBuilder } from "../../src/tools/design/confirmation-prompt-builder.js";
import { crossSessionConsistencyEnforcer } from "../../src/tools/design/cross-session-consistency-enforcer.js";
import { designAssistant } from "../../src/tools/design/design-assistant.js";
import { designPhaseWorkflow } from "../../src/tools/design/design-phase-workflow.js";
import { pivotModule } from "../../src/tools/design/pivot-module.js";
import type { DesignSessionState } from "../../src/tools/design/types.js";

describe("Coverage Improvement - Pivot Module", () => {
	beforeEach(async () => {
		await pivotModule.initialize();
	});

	const createSessionState = (coverage = 85): DesignSessionState => ({
		config: {
			sessionId: "coverage-test",
			context: "Test context with machine learning and real-time processing",
			goal: "Test goal with microservices architecture",
			requirements: ["req1"],
			constraints: [
				{
					id: "test-constraint",
					name: "Test Constraint",
					type: "functional",
					category: "testing",
					description: "Test constraint",
					validation: { minCoverage: 70 },
					weight: 1.0,
					mandatory: true,
					source: "Test",
				},
			],
			coverageThreshold: 85,
			enablePivots: true,
			templateRefs: [],
			outputFormats: [],
			metadata: {},
		},
		currentPhase: "validation",
		phases: {
			discovery: {
				id: "discovery",
				name: "Discovery",
				description: "Discovery phase",
				status: "completed",
				inputs: [],
				outputs: [],
				criteria: [],
				coverage: 85,
				artifacts: [
					{
						id: "artifact-1",
						name: "Test Artifact",
						type: "analysis",
						content:
							"Complex system with performance issues and integration challenges requiring machine learning algorithms",
						format: "markdown",
						timestamp: "2024-01-01T00:00:00Z",
						metadata: {
							complexity: "high",
							uncertainty: "high",
							keywords: ["machine learning", "performance", "integration"],
						},
					},
				],
				dependencies: [],
			},
		},
		coverage: {
			overall: coverage,
			phases: { discovery: 85 },
			constraints: { "test-constraint": 90 },
			assumptions: {},
			documentation: {},
			testCoverage: 70,
		},
		artifacts: [],
		history: [],
		status: "active",
		methodologySelection: {
			id: "test-methodology",
			name: "Test Methodology",
			type: "agile",
			phases: ["discovery"],
			reasoning: "Test reasoning",
		},
	});

	it("should generate pivot recommendations", async () => {
		const sessionState = createSessionState(60);
		const recommendations =
			await pivotModule.generateRecommendations(sessionState);

		expect(recommendations).toBeDefined();
		expect(Array.isArray(recommendations)).toBe(true);
		expect(recommendations.length).toBeGreaterThan(0);
	});

	it("should evaluate pivot with low coverage triggering recommendations", async () => {
		const sessionState = createSessionState(40);
		const result = await pivotModule.evaluatePivotNeed({
			sessionState,
			currentContent:
				"System with high complexity and low coverage requiring pivot decision",
			triggerReason: "low-coverage",
			forceEvaluation: false,
		});

		expect(result).toBeDefined();
		expect(result.alternatives).toBeDefined();
		expect(result.recommendation).toBeDefined();
	});
});

describe("Coverage Improvement - ADR Generator", () => {
	const createSessionState = (): DesignSessionState => ({
		config: {
			sessionId: "adr-test",
			context: "Architecture decision testing",
			goal: "Test ADR generation",
			requirements: ["Document decisions"],
			constraints: [
				{
					id: "arch-constraint",
					name: "Architecture Constraint",
					type: "technical",
					category: "architecture",
					description: "Architecture must be documented",
					validation: { minCoverage: 80 },
					weight: 1.0,
					mandatory: true,
					source: "Architecture Team",
				},
			],
			coverageThreshold: 85,
			enablePivots: true,
			templateRefs: [],
			outputFormats: [],
			metadata: {},
		},
		currentPhase: "implementation",
		phases: {
			discovery: {
				id: "discovery",
				name: "Discovery",
				description: "Discovery phase",
				status: "completed",
				inputs: [],
				outputs: [],
				criteria: [],
				coverage: 90,
				artifacts: [
					{
						id: "decision-1",
						name: "Database Choice",
						type: "decision",
						content:
							"Selected PostgreSQL for data persistence based on ACID compliance requirements",
						format: "markdown",
						timestamp: "2024-01-01T00:00:00Z",
						metadata: { category: "technical", decision: "database" },
					},
				],
				dependencies: [],
			},
		},
		coverage: {
			overall: 85,
			phases: { discovery: 90 },
			constraints: { "arch-constraint": 85 },
			assumptions: {},
			documentation: {},
			testCoverage: 80,
		},
		artifacts: [],
		history: [],
		status: "active",
		methodologySelection: {
			id: "waterfall",
			name: "Waterfall",
			type: "waterfall",
			phases: ["discovery"],
			reasoning: "Sequential approach",
		},
	});

	it("should generate ADR from request", async () => {
		const sessionState = createSessionState();
		const result = await adrGenerator.generateADR({
			sessionState,
			decision:
				"Use Microservices Architecture based on scalability requirements",
			phaseId: "discovery",
		});

		expect(result).toBeDefined();
		expect(result.artifact).toBeDefined();
		expect(result.markdown).toContain("Microservices");
	});

	it("should generate session ADRs", async () => {
		const sessionState = createSessionState();
		const artifacts = await adrGenerator.generateSessionADRs(sessionState);

		expect(artifacts).toBeDefined();
		expect(Array.isArray(artifacts)).toBe(true);
	});
});

describe("Coverage Improvement - Confirmation Prompt Builder", () => {
	beforeEach(async () => {
		await confirmationPromptBuilder.initialize();
	});

	const createSessionState = (): DesignSessionState => ({
		config: {
			sessionId: "confirmation-test",
			context: "Test context",
			goal: "Test confirmation prompts",
			requirements: ["Clear confirmation"],
			constraints: [
				{
					id: "test-constraint",
					name: "Test Constraint",
					type: "functional",
					category: "testing",
					description: "Test",
					validation: { minCoverage: 70 },
					weight: 1.0,
					mandatory: true,
					source: "Test",
				},
			],
			coverageThreshold: 85,
			enablePivots: true,
			templateRefs: [],
			outputFormats: [],
			metadata: {},
		},
		currentPhase: "validation",
		phases: {
			discovery: {
				id: "discovery",
				name: "Discovery",
				description: "Discovery",
				status: "completed",
				inputs: [],
				outputs: [],
				criteria: ["Complete research"],
				coverage: 85,
				artifacts: [],
				dependencies: [],
			},
		},
		coverage: {
			overall: 85,
			phases: { discovery: 85 },
			constraints: { "test-constraint": 90 },
			assumptions: {},
			documentation: {},
			testCoverage: 70,
		},
		artifacts: [],
		history: [],
		status: "active",
		methodologySelection: {
			id: "agile",
			name: "Agile",
			type: "agile",
			phases: ["discovery"],
			reasoning: "Iterative",
		},
	});

	it("should generate coverage validation prompt", async () => {
		const sessionState = createSessionState();
		const prompt =
			await confirmationPromptBuilder.generateCoverageValidationPrompt(
				sessionState,
				85,
			);

		expect(prompt).toBeDefined();
		expect(typeof prompt).toBe("string");
		expect(prompt).toContain("Coverage Validation");
	});

	it("should generate coverage validation prompt with low coverage", async () => {
		const sessionState = createSessionState();
		sessionState.coverage.overall = 60;
		const prompt =
			await confirmationPromptBuilder.generateCoverageValidationPrompt(
				sessionState,
				85,
			);

		expect(prompt).toBeDefined();
		expect(prompt).toContain("Coverage");
	});
});

describe("Coverage Improvement - Design Assistant", () => {
	beforeEach(async () => {
		await designAssistant.initialize();
	});

	it("should create session with minimal config", async () => {
		const session = await designAssistant.createSession({
			context: "Minimal test",
			goal: "Create minimal session",
			requirements: ["Simple requirement"],
		});

		expect(session).toBeDefined();
		expect(typeof session).toBe("object");
	});

	it("should get phase guidance", async () => {
		const session = await designAssistant.createSession({
			context: "Guidance test",
			goal: "Test guidance",
			requirements: ["req1"],
		});

		const guidance = await designAssistant.getPhaseGuidance(
			session,
			"implementation",
		);

		expect(guidance).toBeDefined();
		expect(typeof guidance).toBe("object");
	});

	it("should validate constraints", async () => {
		const session = await designAssistant.createSession({
			context: "Constraint test",
			goal: "Test constraints",
			requirements: ["req1"],
		});

		const result = await designAssistant.validateConstraints(session);

		expect(result).toBeDefined();
	});

	it("should generate workflow", async () => {
		const session = await designAssistant.createSession({
			context: "Workflow test",
			goal: "Test workflow",
			requirements: ["req1"],
		});

		const workflow = await designAssistant.generateWorkflow(session);

		expect(workflow).toBeDefined();
		expect(workflow.steps).toBeDefined();
		expect(Array.isArray(workflow.steps)).toBe(true);
	});

	it("should get active sessions", async () => {
		await designAssistant.createSession({
			context: "Session test",
			goal: "Test",
			requirements: ["req1"],
		});

		const sessions = await designAssistant.getActiveSessions();

		expect(sessions).toBeDefined();
		expect(Array.isArray(sessions)).toBe(true);
	});

	it("should get constraint summary", async () => {
		const summary = await designAssistant.getConstraintSummary();

		expect(summary).toBeDefined();
	});

	it("should get phase sequence", async () => {
		const sequence = await designAssistant.getPhaseSequence();

		expect(sequence).toBeDefined();
		expect(Array.isArray(sequence)).toBe(true);
	});
});
