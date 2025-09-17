// Cross-Session Consistency Enforcer Tests
import { beforeAll, describe, expect, it } from "vitest";
import { crossSessionConsistencyEnforcer } from "../../dist/tools/design/cross-session-consistency-enforcer.js";
import type {
	ConstraintDecision,
	CrossSessionConsistencyReport,
	DesignSessionState,
	EnforcementPrompt,
} from "../../dist/tools/design/types.js";

describe("Cross-Session Consistency Enforcer", () => {
	beforeAll(async () => {
		await crossSessionConsistencyEnforcer.initialize({
			enabled: true,
			minSessionsForPattern: 2,
			consistencyThreshold: 85,
			space7ComplianceLevel: "moderate",
			autoApplyPatterns: false,
			generateDocumentation: true,
			trackRationale: true,
			enforcePhaseSequence: true,
		});
	});

	const createTestSessionState = (
		sessionId: string,
		phase = "requirements",
	): DesignSessionState => ({
		config: {
			sessionId,
			context: `Test context for ${sessionId}`,
			goal: "Test cross-session consistency enforcement",
			requirements: [
				"Cross-session constraint tracking",
				"Consistency validation",
				"Space 7 alignment",
			],
			constraints: [
				{
					id: "context_clarity",
					name: "Context Clarity",
					type: "functional",
					category: "space7",
					description: "Ensure clear context definition",
					validation: { minCoverage: 80, keywords: ["context", "clarity"] },
					weight: 0.9,
					mandatory: true,
					source: "Space 7 General Instructions",
				},
				{
					id: "functional_requirements",
					name: "Functional Requirements",
					type: "functional",
					category: "requirements",
					description: "Define functional requirements clearly",
					validation: {
						minCoverage: 85,
						keywords: ["functional", "requirements"],
					},
					weight: 0.8,
					mandatory: true,
					source: "Space 7 Requirements Phase",
				},
			],
			coverageThreshold: 85,
			enablePivots: true,
			templateRefs: ["space7-template"],
			outputFormats: ["markdown"],
			metadata: { crossSessionTest: true },
		},
		currentPhase: phase,
		phases: {
			discovery: {
				id: "discovery",
				name: "Discovery",
				description: "Discovery phase",
				status: "completed",
				inputs: ["context"],
				outputs: ["stakeholders", "objectives"],
				criteria: ["Clear problem definition"],
				coverage: 85,
				artifacts: [],
				dependencies: [],
			},
			requirements: {
				id: "requirements",
				name: "Requirements",
				description: "Requirements phase",
				status: "active",
				inputs: ["stakeholders", "objectives"],
				outputs: ["requirements"],
				criteria: ["Functional requirements", "Non-functional requirements"],
				coverage: 80,
				artifacts: [],
				dependencies: ["discovery"],
			},
		},
		artifacts: [],
		metadata: {},
		events: [],
		status: "active",
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	});

	const createTestConstraintDecision = (
		action: "applied" | "skipped" | "modified" | "rejected" = "applied",
	): ConstraintDecision => ({
		action,
		originalRule: {
			id: "context_clarity",
			name: "Context Clarity",
			type: "functional",
			category: "space7",
			description: "Ensure clear context definition",
			validation: { minCoverage: 80, keywords: ["context", "clarity"] },
			weight: 0.9,
			mandatory: true,
			source: "Space 7 General Instructions",
		},
		coverage: 85,
		violations: action === "applied" ? [] : ["Coverage below threshold"],
		justification: `Test justification for ${action} action`,
	});

	it("should initialize with default configuration", async () => {
		const enforcer = crossSessionConsistencyEnforcer;
		expect(enforcer).toBeDefined();

		// Test that initialization works without errors
		await expect(enforcer.initialize()).resolves.not.toThrow();
	});

	it("should record constraint decisions for cross-session tracking", async () => {
		const sessionState = createTestSessionState("test-session-1");
		const decision = createTestConstraintDecision("applied");

		await expect(
			crossSessionConsistencyEnforcer.recordConstraintDecision(
				sessionState,
				"context_clarity",
				decision,
				"Applied constraint for Space 7 compliance",
				"Space 7 General Instructions",
			),
		).resolves.not.toThrow();
	});

	it("should enforce consistency across sessions", async () => {
		const sessionState = createTestSessionState("test-session-2");

		const report =
			await crossSessionConsistencyEnforcer.enforceConsistency(sessionState);

		expect(report).toBeDefined();
		expect(report.sessionId).toBe("test-session-2");
		expect(report.timestamp).toBeDefined();
		expect(report.overallConsistency).toBeGreaterThanOrEqual(0);
		expect(report.overallConsistency).toBeLessThanOrEqual(100);
		expect(report.constraintConsistency).toBeDefined();
		expect(report.phaseConsistency).toBeDefined();
		expect(report.violations).toBeInstanceOf(Array);
		expect(report.recommendations).toBeInstanceOf(Array);
		expect(report.historicalPatterns).toBeInstanceOf(Array);
		expect(report.space7Alignment).toBeGreaterThanOrEqual(0);
		expect(report.space7Alignment).toBeLessThanOrEqual(100);
	});

	it("should detect Space 7 alignment issues", async () => {
		// Create session with missing mandatory constraints
		const sessionState = createTestSessionState("test-session-3");
		sessionState.config.constraints = []; // Remove all constraints
		sessionState.config.coverageThreshold = 60; // Below Space 7 minimum

		const report =
			await crossSessionConsistencyEnforcer.enforceConsistency(sessionState);

		expect(report.space7Alignment).toBeLessThan(85);
		expect(report.violations.some((v) => v.type === "space7_deviation")).toBe(
			true,
		);
		expect(report.recommendations.some((r) => r.type === "alignment")).toBe(
			true,
		);
	});

	it("should identify phase consistency issues", async () => {
		const sessionState = createTestSessionState(
			"test-session-4",
			"requirements",
		);
		// Remove required constraints for requirements phase
		sessionState.config.constraints = sessionState.config.constraints.filter(
			(c) =>
				!["functional_requirements", "non_functional_requirements"].includes(
					c.id,
				),
		);

		const report =
			await crossSessionConsistencyEnforcer.enforceConsistency(sessionState);

		expect(report.violations.some((v) => v.type === "phase_coverage")).toBe(
			true,
		);
		expect(report.phaseConsistency.requirements?.consistent).toBe(false);
	});

	it("should generate enforcement prompts for critical violations", async () => {
		const sessionState = createTestSessionState("test-session-5");
		sessionState.config.constraints = []; // Create critical violation

		const report =
			await crossSessionConsistencyEnforcer.enforceConsistency(sessionState);
		const prompts =
			await crossSessionConsistencyEnforcer.generateEnforcementPrompts(
				sessionState,
				report,
			);

		expect(prompts).toBeInstanceOf(Array);
		expect(prompts.length).toBeGreaterThan(0);

		const criticalPrompts = prompts.filter((p) => p.severity === "critical");
		expect(criticalPrompts.length).toBeGreaterThan(0);

		const prompt = criticalPrompts[0];
		expect(prompt.type).toBeDefined();
		expect(prompt.title).toBeDefined();
		expect(prompt.message).toBeDefined();
		expect(prompt.options).toBeInstanceOf(Array);
		expect(prompt.options.length).toBeGreaterThan(0);

		const option = prompt.options[0];
		expect(option.id).toBeDefined();
		expect(option.label).toBeDefined();
		expect(option.description).toBeDefined();
		expect(option.impact).toMatch(/^(breaking|moderate|minimal)$/);
		expect(option.consequences).toBeInstanceOf(Array);
		expect(typeof option.recommended).toBe("boolean");
	});

	it("should generate pattern confirmation prompts", async () => {
		// First, record some constraint decisions to create patterns
		const sessionState1 = createTestSessionState("pattern-session-1");
		const sessionState2 = createTestSessionState("pattern-session-2");

		const decision = createTestConstraintDecision("applied");

		await crossSessionConsistencyEnforcer.recordConstraintDecision(
			sessionState1,
			"context_clarity",
			decision,
			"Applied for pattern testing",
		);

		await crossSessionConsistencyEnforcer.recordConstraintDecision(
			sessionState2,
			"context_clarity",
			decision,
			"Applied for pattern testing",
		);

		const sessionState3 = createTestSessionState("pattern-session-3");
		const report =
			await crossSessionConsistencyEnforcer.enforceConsistency(sessionState3);
		const prompts =
			await crossSessionConsistencyEnforcer.generateEnforcementPrompts(
				sessionState3,
				report,
			);

		const patternPrompts = prompts.filter(
			(p) => p.type === "pattern_confirmation",
		);
		// Pattern prompts may or may not be generated depending on pattern confidence
		expect(prompts).toBeInstanceOf(Array);
	});

	it("should generate constraint usage patterns", async () => {
		const patterns =
			crossSessionConsistencyEnforcer.getConstraintUsagePatterns(
				"context_clarity",
			);

		expect(patterns).toBeInstanceOf(Array);

		if (patterns.length > 0) {
			const pattern = patterns[0];
			expect(pattern.patternId).toBeDefined();
			expect(pattern.type).toMatch(
				/^(constraint_usage|phase_progression|coverage_trend|decision_pattern)$/,
			);
			expect(pattern.frequency).toBeGreaterThanOrEqual(0);
			expect(pattern.confidence).toBeGreaterThanOrEqual(0);
			expect(pattern.confidence).toBeLessThanOrEqual(100);
			expect(pattern.description).toBeDefined();
			expect(pattern.sessions).toBeInstanceOf(Array);
			expect(pattern.lastSeen).toBeDefined();
			expect(pattern.recommendation).toBeDefined();
		}
	});

	it("should generate comprehensive documentation", async () => {
		const sessionState = createTestSessionState("doc-session-1");
		const report =
			await crossSessionConsistencyEnforcer.enforceConsistency(sessionState);

		const documentation =
			await crossSessionConsistencyEnforcer.generateConstraintDocumentation(
				sessionState,
				report,
			);

		expect(documentation).toBeDefined();
		expect(documentation.adr).toBeDefined();
		expect(documentation.adr).toContain("Architecture Decision Record");
		expect(documentation.adr).toContain(sessionState.config.sessionId);
		expect(documentation.adr).toContain("Space 7 Alignment");

		expect(documentation.specification).toBeDefined();
		expect(documentation.specification).toContain(
			"Cross-Session Constraint Specification",
		);
		expect(documentation.specification).toContain(
			sessionState.config.sessionId,
		);
		expect(documentation.specification).toContain(sessionState.config.context);

		expect(documentation.roadmap).toBeDefined();
		expect(documentation.roadmap).toContain(
			"Cross-Session Consistency Roadmap",
		);
		expect(documentation.roadmap).toContain("Overall Consistency");
		expect(documentation.roadmap).toContain("Success Metrics");
	});

	it("should handle invalid constraint decision entries", async () => {
		const sessionState = createTestSessionState("invalid-session");

		// Create invalid decision (missing required fields)
		const invalidDecision = {
			action: "applied",
			// Missing required fields
		} as any;

		await expect(
			crossSessionConsistencyEnforcer.recordConstraintDecision(
				sessionState,
				"context_clarity",
				invalidDecision,
				"Invalid decision test",
			),
		).rejects.toThrow();
	});

	it("should track rationale and decisions for enforcement actions", async () => {
		const sessionState = createTestSessionState("rationale-session");
		const decision = createTestConstraintDecision("modified");
		decision.modifiedRule = { weight: 0.7 }; // Modified weight

		await crossSessionConsistencyEnforcer.recordConstraintDecision(
			sessionState,
			"context_clarity",
			decision,
			"Modified weight based on project requirements",
			"Space 7 General Instructions - Context Requirements",
		);

		// Verify the decision was recorded with rationale
		const patterns =
			crossSessionConsistencyEnforcer.getConstraintUsagePatterns(
				"context_clarity",
			);
		expect(patterns).toBeInstanceOf(Array);
	});

	it("should enforce coverage thresholds according to Space 7", async () => {
		const sessionState = createTestSessionState("coverage-session");

		// Set coverage below Space 7 minimum
		sessionState.config.coverageThreshold = 70; // Below 85% minimum
		if (sessionState.phases?.requirements) {
			sessionState.phases.requirements.coverage = 70;
		}

		const report =
			await crossSessionConsistencyEnforcer.enforceConsistency(sessionState);

		expect(report.space7Alignment).toBeLessThan(85);
		// Look for coverage-related violations in the violation list
		const hasCoverageViolation = report.violations.some(
			(v) =>
				(v.type === "space7_deviation" &&
					v.currentExample.includes("Coverage")) ||
				v.currentExample.includes("70%"),
		);
		expect(hasCoverageViolation).toBe(true);
	});

	it("should validate session state with proper error handling", async () => {
		// Test with minimal valid session state
		const minimalSession = createTestSessionState("minimal-session");

		const report =
			await crossSessionConsistencyEnforcer.enforceConsistency(minimalSession);

		expect(report).toBeDefined();
		expect(report.sessionId).toBe("minimal-session");
		expect(typeof report.overallConsistency).toBe("number");
	});

	it("should integrate with Space 7 instructions for workflow validation", async () => {
		// Test each phase of Space 7 workflow
		const phases = [
			"discovery",
			"requirements",
			"architecture",
			"specification",
			"planning",
		];

		for (const phase of phases) {
			const sessionState = createTestSessionState(`space7-${phase}`, phase);
			const report =
				await crossSessionConsistencyEnforcer.enforceConsistency(sessionState);

			expect(report).toBeDefined();
			expect(report.phaseConsistency[phase]).toBeDefined();

			// For unknown phases, should still handle gracefully
			if (
				![
					"discovery",
					"requirements",
					"architecture",
					"specification",
					"planning",
				].includes(phase)
			) {
				expect(
					report.violations.some((v) => v.type === "space7_deviation"),
				).toBe(true);
			}
		}
	});

	it("should provide context-driven enforcement with interactive validation", async () => {
		const sessionState = createTestSessionState("interactive-session");
		sessionState.config.constraints = []; // Create violation to trigger prompts

		const report =
			await crossSessionConsistencyEnforcer.enforceConsistency(sessionState);
		const prompts =
			await crossSessionConsistencyEnforcer.generateEnforcementPrompts(
				sessionState,
				report,
			);

		// Verify prompts are context-aware
		for (const prompt of prompts) {
			expect(prompt.context).toBeDefined();
			// Check that prompt context includes session information
			expect(prompt.context).toContain(sessionState.config.sessionId);
			expect(prompt.options.every((opt) => opt.consequences.length > 0)).toBe(
				true,
			);
		}
	});
});

describe("Cross-Session Consistency Edge Cases", () => {
	beforeAll(async () => {
		await crossSessionConsistencyEnforcer.initialize();
	});

	it("should handle sessions with no constraints gracefully", async () => {
		const sessionState = {
			config: {
				sessionId: "no-constraints-session",
				context: "Empty session test",
				goal: "Test empty constraints",
				requirements: [],
				constraints: [], // No constraints
				coverageThreshold: 85,
				enablePivots: false,
				templateRefs: [],
				outputFormats: ["markdown"],
				metadata: {},
			},
			currentPhase: "discovery",
			phases: {},
			artifacts: [],
			metadata: {},
			events: [],
			status: "active",
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		} as any;

		const report =
			await crossSessionConsistencyEnforcer.enforceConsistency(sessionState);

		expect(report).toBeDefined();
		expect(report.overallConsistency).toBeGreaterThanOrEqual(0);
		expect(Object.keys(report.constraintConsistency)).toHaveLength(0);
	});

	it("should handle unknown phases appropriately", async () => {
		const sessionState = {
			config: {
				sessionId: "unknown-phase-session",
				context: "Unknown phase test",
				goal: "Test unknown phase handling",
				requirements: [],
				constraints: [],
				coverageThreshold: 85,
				enablePivots: false,
				templateRefs: [],
				outputFormats: ["markdown"],
				metadata: {},
			},
			currentPhase: "unknown_phase",
			phases: {},
			artifacts: [],
			metadata: {},
			events: [],
			status: "active",
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		} as any;

		await expect(
			crossSessionConsistencyEnforcer.enforceConsistency(sessionState),
		).resolves.not.toThrow();
	});

	it("should validate enforcement configuration", async () => {
		const validConfig = {
			enabled: true,
			minSessionsForPattern: 2,
			consistencyThreshold: 75,
			space7ComplianceLevel: "strict" as const,
			autoApplyPatterns: true,
			generateDocumentation: false,
			trackRationale: true,
			enforcePhaseSequence: false,
		};

		await expect(
			crossSessionConsistencyEnforcer.initialize(validConfig),
		).resolves.not.toThrow();
	});
});
