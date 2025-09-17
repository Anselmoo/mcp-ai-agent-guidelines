// Cross-Session Constraint Consistency Enforcer Tests
import { beforeEach, describe, expect, it } from "vitest";
import { constraintConsistencyEnforcer } from "../../dist/tools/design/constraint-consistency-enforcer.js";
import { constraintManager } from "../../dist/tools/design/constraint-manager.js";
import type {
	ConsistencyEnforcementRequest,
	ConstraintRule,
	DesignSessionState,
} from "../../dist/tools/design/types.js";

describe("Constraint Consistency Enforcer", () => {
	beforeEach(async () => {
		await constraintConsistencyEnforcer.initialize();
		await constraintManager.loadConstraintsFromConfig({
			meta: {
				version: "1.0.0",
				updated: "2024-01-10",
				source: "Test Configuration",
				coverage_threshold: 85,
			},
			phases: {
				discovery: {
					name: "Discovery",
					description: "Discovery phase",
					min_coverage: 80,
					required_outputs: ["context"],
					criteria: ["Clear objectives"],
				},
				requirements: {
					name: "Requirements",
					description: "Requirements phase",
					min_coverage: 85,
					required_outputs: ["requirements"],
					criteria: ["Testable requirements"],
				},
			},
			constraints: {
				architectural: {
					modularity: {
						name: "Modular Design",
						description: "System must follow modular architecture",
						keywords: ["modular", "component"],
						weight: 15,
						mandatory: true,
						validation: { min_coverage: 85, keywords: ["module", "component"] },
						source: "Architecture Guidelines",
					},
				},
				technical: {
					testing: {
						name: "Testing Strategy",
						description: "Comprehensive testing required",
						keywords: ["test", "testing"],
						weight: 10,
						mandatory: true,
						validation: { min_coverage: 80, keywords: ["unit", "integration"] },
						source: "Testing Guidelines",
					},
				},
			},
			coverage_rules: {
				overall_minimum: 85,
				phase_minimum: 80,
				constraint_minimum: 70,
				documentation_minimum: 75,
				test_minimum: 80,
				pivot_thresholds: {
					complexity_threshold: 85,
					entropy_threshold: 75,
					coverage_drop_threshold: 20,
				},
			},
			template_references: {
				space7_instructions: "reference/space7.md",
				design_process: "reference/design.md",
			},
			micro_methods: {
				confirmation: ["validate_phase_completion"],
				coverage: ["calculate_phase_coverage"],
			},
			output_formats: {
				adr: {
					format: "markdown",
					template: "adr-template.md",
					sections: ["Status", "Context", "Decision"],
				},
			},
		});
	});

	const createTestSessionState = (sessionId: string): DesignSessionState => ({
		config: {
			sessionId,
			context: `Test session ${sessionId} for cross-session consistency`,
			goal: "Test constraint consistency enforcement",
			requirements: [
				"Ensure constraint consistency across sessions",
				"Validate Space 7 alignment",
				"Generate enforcement documentation",
			],
			constraints: [
				{
					id: "architectural.modularity",
					name: "Modular Design",
					type: "architectural",
					category: "architectural",
					description: "System must follow modular architecture",
					validation: { minCoverage: 85, keywords: ["module", "component"] },
					weight: 15,
					mandatory: true,
					source: "Architecture Guidelines",
				},
				{
					id: "technical.testing",
					name: "Testing Strategy",
					type: "technical",
					category: "technical",
					description: "Comprehensive testing required",
					validation: { minCoverage: 80, keywords: ["unit", "integration"] },
					weight: 10,
					mandatory: true,
					source: "Testing Guidelines",
				},
			],
			coverageThreshold: 85,
			enablePivots: true,
			templateRefs: ["Space 7 General Instructions"],
			outputFormats: ["markdown"],
			metadata: {},
		},
		currentPhase: "requirements",
		phases: {
			discovery: {
				id: "discovery",
				name: "Discovery",
				description: "Discovery phase",
				inputs: ["context"],
				outputs: ["objectives"],
				criteria: ["Clear objectives"],
				coverage: 90,
				status: "completed",
				artifacts: [],
				dependencies: [],
			},
			requirements: {
				id: "requirements",
				name: "Requirements",
				description: "Requirements phase",
				inputs: ["objectives"],
				outputs: ["requirements"],
				criteria: ["Testable requirements"],
				coverage: 85,
				status: "in-progress",
				artifacts: [],
				dependencies: ["discovery"],
			},
		},
		coverage: {
			overall: 87,
			phases: { discovery: 90, requirements: 85 },
			constraints: { "architectural.modularity": 90, "technical.testing": 85 },
			assumptions: {},
			documentation: { overall: 80 },
			testCoverage: 85,
		},
		artifacts: [],
		history: [],
		status: "active",
	});

	it("should initialize successfully", async () => {
		await expect(
			constraintConsistencyEnforcer.initialize(),
		).resolves.not.toThrow();
	});

	it("should enforce consistency for first-time constraint usage", async () => {
		const sessionState = createTestSessionState("first-session-001");
		const request: ConsistencyEnforcementRequest = {
			sessionState,
			context: "First time using modular architecture constraint",
		};

		const result =
			await constraintConsistencyEnforcer.enforceConsistency(request);

		expect(result.success).toBe(true);
		expect(result.consistencyScore).toBeGreaterThan(0);
		expect(result.recommendations).toBeInstanceOf(Array);
		expect(result.recommendations.length).toBeGreaterThan(0);
		expect(result.enforcementActions).toBeInstanceOf(Array);
		expect(result.generatedArtifacts).toBeInstanceOf(Array);
		expect(result.interactivePrompts).toBeInstanceOf(Array);
		expect(result.historicalAlignments).toBeInstanceOf(Array);
	});

	it("should enforce consistency for specific constraint", async () => {
		const sessionState = createTestSessionState("constraint-specific-001");
		const request: ConsistencyEnforcementRequest = {
			sessionState,
			constraintId: "architectural.modularity",
			context: "Specific constraint enforcement test",
		};

		const result =
			await constraintConsistencyEnforcer.enforceConsistency(request);

		expect(result.success).toBe(true);
		expect(result.consistencyScore).toBeGreaterThanOrEqual(0);
		expect(result.enforcementActions).toBeInstanceOf(Array);
		expect(result.recommendations).toBeInstanceOf(Array);
	});

	it("should enforce consistency for specific phase", async () => {
		const sessionState = createTestSessionState("phase-specific-001");
		const request: ConsistencyEnforcementRequest = {
			sessionState,
			phaseId: "requirements",
			context: "Requirements phase consistency check",
		};

		const result =
			await constraintConsistencyEnforcer.enforceConsistency(request);

		expect(result.success).toBe(true);
		expect(result.consistencyScore).toBeGreaterThanOrEqual(0);
		expect(result.enforcementActions).toBeInstanceOf(Array);
		expect(result.recommendations).toBeInstanceOf(Array);
	});

	it("should enforce consistency in strict mode", async () => {
		const sessionState = createTestSessionState("strict-mode-001");
		const request: ConsistencyEnforcementRequest = {
			sessionState,
			context: "Strict mode enforcement test",
			strictMode: true,
		};

		const result =
			await constraintConsistencyEnforcer.enforceConsistency(request);

		expect(result.success).toBe(true);
		expect(result.consistencyScore).toBeGreaterThanOrEqual(0);
		expect(result.enforcementActions).toBeInstanceOf(Array);
		expect(result.recommendations).toBeInstanceOf(Array);
	});

	it("should generate interactive prompts for low consistency scores", async () => {
		const sessionState = createTestSessionState("low-consistency-001");

		// Create a session with potential consistency issues
		sessionState.coverage.overall = 60; // Low overall coverage

		const request: ConsistencyEnforcementRequest = {
			sessionState,
			context: "Low consistency test scenario",
		};

		const result =
			await constraintConsistencyEnforcer.enforceConsistency(request);

		expect(result.interactivePrompts).toBeInstanceOf(Array);
		if (result.consistencyScore < 80) {
			expect(result.interactivePrompts.length).toBeGreaterThan(0);
			expect(
				result.interactivePrompts.some((prompt) =>
					prompt.includes("Space 7 Instructions Alignment Check"),
				),
			).toBe(true);
		}
	});

	it("should generate enforcement artifacts", async () => {
		const sessionState = createTestSessionState("artifacts-001");
		const request: ConsistencyEnforcementRequest = {
			sessionState,
			context: "Artifact generation test",
		};

		const result =
			await constraintConsistencyEnforcer.enforceConsistency(request);

		expect(result.generatedArtifacts).toBeInstanceOf(Array);
		// Check if any enforcement-related artifacts were generated
		if (
			result.enforcementActions.some((action) => action.type === "generate_adr")
		) {
			expect(result.generatedArtifacts.length).toBeGreaterThan(0);
		}
	});

	it("should provide historical alignments", async () => {
		const sessionState = createTestSessionState("historical-001");
		const request: ConsistencyEnforcementRequest = {
			sessionState,
			context: "Historical alignment test",
		};

		const result =
			await constraintConsistencyEnforcer.enforceConsistency(request);

		expect(result.historicalAlignments).toBeInstanceOf(Array);
		expect(result.recommendations).toBeInstanceOf(Array);
	});

	it("should validate cross-session consistency", async () => {
		const sessionState = createTestSessionState("cross-session-001");

		// First session enforcement to establish history
		const firstRequest: ConsistencyEnforcementRequest = {
			sessionState,
			context: "First session establishing constraint patterns",
		};

		const firstResult =
			await constraintConsistencyEnforcer.enforceConsistency(firstRequest);
		expect(firstResult.success).toBe(true);

		// Second session with potentially different approach
		const secondSessionState = createTestSessionState("cross-session-002");
		const secondRequest: ConsistencyEnforcementRequest = {
			sessionState: secondSessionState,
			context: "Second session testing cross-session consistency",
		};

		const secondResult =
			await constraintConsistencyEnforcer.enforceConsistency(secondRequest);

		expect(secondResult.success).toBe(true);
		expect(secondResult.consistencyScore).toBeGreaterThanOrEqual(0);
		expect(secondResult.enforcementActions).toBeInstanceOf(Array);
	});

	it("should handle missing session gracefully", async () => {
		// Create minimal session state that might be missing some data
		const minimalSessionState: DesignSessionState = {
			config: {
				sessionId: "minimal-001",
				context: "Minimal session test",
				goal: "Test error handling",
				requirements: [],
				constraints: [],
				coverageThreshold: 85,
				enablePivots: false,
				templateRefs: [],
				outputFormats: ["markdown"],
				metadata: {},
			},
			currentPhase: "discovery",
			phases: {},
			coverage: {
				overall: 0,
				phases: {},
				constraints: {},
				assumptions: {},
				documentation: {},
				testCoverage: 0,
			},
			artifacts: [],
			history: [],
			status: "initializing",
		};

		const request: ConsistencyEnforcementRequest = {
			sessionState: minimalSessionState,
			context: "Error handling test",
		};

		const result =
			await constraintConsistencyEnforcer.enforceConsistency(request);

		expect(result.success).toBe(true); // Should handle gracefully
		expect(result.consistencyScore).toBeGreaterThanOrEqual(0);
		expect(result.recommendations).toBeInstanceOf(Array);
	});

	it("should integrate with Space 7 instructions", async () => {
		const sessionState = createTestSessionState("space7-integration-001");
		const request: ConsistencyEnforcementRequest = {
			sessionState,
			context: "Space 7 integration test",
		};

		const result =
			await constraintConsistencyEnforcer.enforceConsistency(request);

		expect(result.success).toBe(true);
		expect(result.recommendations).toBeInstanceOf(Array);

		// Check for Space 7 related guidance in prompts or recommendations
		const hasSpace7Reference =
			result.interactivePrompts.some((prompt) => prompt.includes("Space 7")) ||
			result.recommendations.some((rec) => rec.includes("Space 7"));

		if (result.consistencyScore < 80) {
			expect(hasSpace7Reference).toBe(true);
		}
	});

	it("should provide context-driven enforcement prompts", async () => {
		const sessionState = createTestSessionState("context-driven-001");
		sessionState.currentPhase = "architecture"; // Set specific phase

		const request: ConsistencyEnforcementRequest = {
			sessionState,
			phaseId: "architecture",
			context: "Architecture phase constraint enforcement",
		};

		const result =
			await constraintConsistencyEnforcer.enforceConsistency(request);

		expect(result.success).toBe(true);
		expect(result.interactivePrompts).toBeInstanceOf(Array);

		// Check that prompts are context-aware
		if (result.interactivePrompts.length > 0) {
			const hasContextualContent = result.interactivePrompts.some(
				(prompt) =>
					prompt.includes("architecture") || prompt.includes("Architecture"),
			);
			expect(hasContextualContent).toBe(true);
		}
	});
});

describe("Constraint Consistency Enforcer Integration", () => {
	it("should work with the constraint manager", async () => {
		await constraintConsistencyEnforcer.initialize();

		const sessionState = {
			config: {
				sessionId: "integration-001",
				context: "Integration test",
				goal: "Test integration with constraint manager",
				requirements: [],
				constraints: [],
				coverageThreshold: 85,
				enablePivots: false,
				templateRefs: [],
				outputFormats: ["markdown"],
				metadata: {},
			},
			currentPhase: "discovery",
			phases: {},
			coverage: {
				overall: 75,
				phases: {},
				constraints: {},
				assumptions: {},
				documentation: {},
				testCoverage: 0,
			},
			artifacts: [],
			history: [],
			status: "active",
		} as DesignSessionState;

		const request: ConsistencyEnforcementRequest = {
			sessionState,
			context: "Integration test with constraint manager",
		};

		const result =
			await constraintConsistencyEnforcer.enforceConsistency(request);

		expect(result).toBeDefined();
		expect(result.success).toBeDefined();
		expect(result.consistencyScore).toBeGreaterThanOrEqual(0);
		expect(result.enforcementActions).toBeInstanceOf(Array);
		expect(result.recommendations).toBeInstanceOf(Array);
	});
});
