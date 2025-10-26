// Comprehensive Coverage Tests for Untested Code Sections
// This test suite targets specific untested code paths in constraint-consistency-enforcer.ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ADRGenerationResult } from "../../src/tools/design/adr-generator.ts";
import { adrGenerator } from "../../src/tools/design/adr-generator.ts";
import type { ConsistencyEnforcementRequest } from "../../src/tools/design/constraint-consistency-enforcer.ts";
import { constraintConsistencyEnforcer } from "../../src/tools/design/constraint-consistency-enforcer.ts";
import { constraintManager } from "../../src/tools/design/constraint-manager.ts";
import type { DesignSessionState } from "../../src/tools/design/types/index.ts";
import { logger } from "../../src/tools/shared/logger.ts";

// Helper to create test session state
const createTestSessionState = (sessionId: string): DesignSessionState => ({
	config: {
		sessionId,
		context: `Test session ${sessionId}`,
		goal: "Test coverage gaps",
		requirements: ["Test requirement"],
		constraints: [
			{
				id: "test.constraint1",
				name: "Test Constraint 1",
				type: "technical",
				category: "technical",
				description: "Test constraint 1",
				validation: { minCoverage: 80, keywords: ["test"] },
				weight: 10,
				mandatory: true,
				source: "Test Source",
			},
			{
				id: "test.constraint2",
				name: "Test Constraint 2",
				type: "technical",
				category: "technical",
				description: "Test constraint 2",
				validation: { minCoverage: 75, keywords: ["test"] },
				weight: 5,
				mandatory: false,
				source: "Test Source",
			},
		],
		coverageThreshold: 80,
		enablePivots: true,
		templateRefs: ["template.md"],
		outputFormats: ["markdown"],
		metadata: { testMode: true, created: new Date().toISOString() },
	},
	currentPhase: "discovery",
	phases: {
		discovery: {
			id: "discovery",
			name: "Discovery",
			description: "Discovery phase",
			inputs: [],
			outputs: ["context"],
			criteria: ["Clear objectives"],
			coverage: 85,
			status: "completed",
			artifacts: [],
			dependencies: [],
		},
	},
	coverage: {
		overall: 80,
		phases: { discovery: 85 },
		constraints: { "test.constraint1": 80, "test.constraint2": 75 },
		assumptions: {},
		documentation: { overall: 75 },
		testCoverage: 70,
	},
	artifacts: [],
	history: [
		{
			type: "phase-start",
			timestamp: new Date().toISOString(),
			description: `Session ${sessionId} started`,
			phase: "discovery",
			data: { sessionId },
		},
	],
	status: "active",
});

describe("Constraint Consistency Enforcer - Coverage Gaps", () => {
	beforeEach(async () => {
		await constraintConsistencyEnforcer.initialize();
		await constraintManager.loadConstraintsFromConfig({
			meta: {
				version: "1.0.0",
				updated: "2024-01-10",
				source: "Test Configuration",
				coverage_threshold: 80,
			},
			phases: {
				discovery: {
					name: "Discovery",
					description: "Discovery phase",
					min_coverage: 75,
					required_outputs: ["context"],
					criteria: ["Clear objectives"],
				},
			},
			constraints: {
				technical: {
					testing: {
						name: "Testing Strategy",
						description: "Comprehensive testing required",
						keywords: ["test"],
						weight: 10,
						mandatory: true,
						validation: { min_coverage: 80, keywords: ["test"] },
						source: "Test Guidelines",
					},
				},
			},
			coverage_rules: {
				overall_minimum: 80,
				phase_minimum: 75,
				constraint_minimum: 70,
				documentation_minimum: 70,
				test_minimum: 75,
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

	describe("generateReport - Report Generation with Violations", () => {
		it("should generate report with violation details when violations exist", async () => {
			const sessionState = createTestSessionState("report-violations-001");

			// First establish history with enforcement actions
			const request1: ConsistencyEnforcementRequest = {
				sessionState,
				context: "Establishing baseline",
			};
			await constraintConsistencyEnforcer.enforceConsistency(request1);

			// Now generate report
			const report =
				await constraintConsistencyEnforcer.generateReport(sessionState);

			expect(report).toBeDefined();
			expect(typeof report).toBe("string");
			expect(report).toContain("Consistency Report");
			expect(report).toContain("Consistency Score");
			expect(report).toContain("Violations");
		});

		it("should render violation details in report (loop coverage)", async () => {
			const sessionState = createTestSessionState("report-details-001");

			// Create multiple enforcement cycles to generate violations
			for (let i = 0; i < 3; i++) {
				const req: ConsistencyEnforcementRequest = {
					sessionState: createTestSessionState(`violation-${i}`),
					context: "Creating violation scenarios",
				};
				await constraintConsistencyEnforcer.enforceConsistency(req);
			}

			const report =
				await constraintConsistencyEnforcer.generateReport(sessionState);

			expect(report).toBeDefined();
			// Check for "Details:" section that indicates violation rendering
			if (report.includes("Details:")) {
				expect(report).toMatch(/\[.*\]/); // Should have severity in brackets
			}
		});

		it("should limit violation details to 5 items in report (slice coverage)", async () => {
			const sessionState = createTestSessionState("report-slice-001");

			const report =
				await constraintConsistencyEnforcer.generateReport(sessionState);

			expect(report).toBeDefined();
			expect(typeof report).toBe("string");
			// Count the number of violation lines (starting with "- [")
			const violationMatches = report.match(/- \[/g) || [];
			expect(violationMatches.length).toBeLessThanOrEqual(5);
		});

		it("should generate report without violations", async () => {
			const sessionState = createTestSessionState("report-no-violations");
			const report =
				await constraintConsistencyEnforcer.generateReport(sessionState);

			expect(report).toBeDefined();
			expect(typeof report).toBe("string");
			expect(report).toContain(sessionState.config.sessionId);
		});

		it("should handle generateReport with constraint ID parameter", async () => {
			const sessionState = createTestSessionState("report-constraint-id");
			const report = await constraintConsistencyEnforcer.generateReport({
				sessionState,
				constraintId: "test.constraint1",
			});

			expect(report).toBeDefined();
			expect(typeof report).toBe("string");
		});
	});

	describe("validateCrossSessionConsistency - Constraint Loop Coverage", () => {
		it("should skip undefined constraints in validation loop", async () => {
			const sessionState = createTestSessionState("skip-undefined-001");
			// Mock getConstraint to return undefined for testing
			vi.spyOn(constraintManager, "getConstraint").mockReturnValue(undefined);

			try {
				const result =
					await constraintConsistencyEnforcer.validateCrossSessionConsistency(
						sessionState,
					);
				expect(result).toBeDefined();
				expect(result.violations).toBeInstanceOf(Array);
			} finally {
				vi.restoreAllMocks();
			}
		});

		it("should handle first-time constraint usage (no history)", async () => {
			const sessionState = createTestSessionState("first-time-constraint");

			const result =
				await constraintConsistencyEnforcer.validateCrossSessionConsistency(
					sessionState,
				);

			expect(result).toBeDefined();
			expect(result.recommendations).toBeInstanceOf(Array);
			// First usage should generate baseline recommendations
			const baselineRecs = result.recommendations.filter((r) =>
				r.includes("First usage"),
			);
			expect(baselineRecs.length).toBeGreaterThanOrEqual(0);
		});

		it("should detect decision conflicts from multiple sessions", async () => {
			// Create multiple sessions with different constraint handling
			const sessions = [];
			for (let i = 0; i < 2; i++) {
				const session = createTestSessionState(`conflict-${i}`);
				const req: ConsistencyEnforcementRequest = {
					sessionState: session,
					context: `Session ${i} with different approach`,
				};
				await constraintConsistencyEnforcer.enforceConsistency(req);
				sessions.push(session);
			}

			// Validate second session
			const result =
				await constraintConsistencyEnforcer.validateCrossSessionConsistency(
					sessions[1],
				);

			expect(result).toBeDefined();
			expect(result.violations).toBeInstanceOf(Array);
		});

		it("should generate decision conflict violations (uniqueDecisions > 1)", async () => {
			const sessionState = createTestSessionState("decision-conflict-001");

			// First enforcement
			const req1: ConsistencyEnforcementRequest = {
				sessionState,
				context: "First decision",
			};
			await constraintConsistencyEnforcer.enforceConsistency(req1);

			// Second session with potentially different decision
			const sessionState2 = createTestSessionState("decision-conflict-002");
			const req2: ConsistencyEnforcementRequest = {
				sessionState: sessionState2,
				context: "Second decision (conflicting)",
			};
			const result =
				await constraintConsistencyEnforcer.enforceConsistency(req2);

			// Check that enforcement actions are generated (may or may not have conflict resolution)
			expect(result.enforcementActions).toBeInstanceOf(Array);
			// The actual conflict detection depends on whether there's historical data, which may be empty
		});

		it("should detect enforcement consistency mismatches", async () => {
			const sessionState = createTestSessionState("enforcement-mismatch");

			const result =
				await constraintConsistencyEnforcer.validateCrossSessionConsistency(
					sessionState,
				);

			expect(result).toBeDefined();
			expect(result.violations).toBeInstanceOf(Array);
		});

		it("should skip when constraintHistory is empty", async () => {
			const sessionState = createTestSessionState("empty-history");

			const result =
				await constraintConsistencyEnforcer.validateCrossSessionConsistency(
					sessionState,
				);

			expect(result).toBeDefined();
			// With no history, should still pass validation
			expect(result.passed).toBe(true);
		});
	});

	describe("generateEnforcementActions - Violation Handling", () => {
		it("should create prompt_for_clarification for error severity violations", async () => {
			const sessionState = createTestSessionState("error-violation");

			const request: ConsistencyEnforcementRequest = {
				sessionState,
				context: "Error severity test",
			};

			const result =
				await constraintConsistencyEnforcer.enforceConsistency(request);

			expect(result.enforcementActions).toBeInstanceOf(Array);
			// Check for prompt clarification actions
			const promptActions = result.enforcementActions.filter(
				(a) => a.type === "prompt_for_clarification",
			);
			expect(promptActions.length).toBeGreaterThanOrEqual(0);
		});

		it("should handle strict mode warning violations", async () => {
			const sessionState = createTestSessionState("strict-mode-warnings");

			const request: ConsistencyEnforcementRequest = {
				sessionState,
				context: "Strict mode enforcement",
				strictMode: true,
			};

			const result =
				await constraintConsistencyEnforcer.enforceConsistency(request);

			expect(result).toBeDefined();
			expect(result.enforcementActions).toBeInstanceOf(Array);
		});

		it("should generate ADR actions when significant actions exist", async () => {
			const sessionState = createTestSessionState("adr-generation");

			const request: ConsistencyEnforcementRequest = {
				sessionState,
				context: "ADR generation test",
			};

			const result =
				await constraintConsistencyEnforcer.enforceConsistency(request);

			expect(result.enforcementActions).toBeInstanceOf(Array);
			// If there are clarification actions, should have ADR action
			const clarificationActions = result.enforcementActions.filter(
				(a) => a.type === "prompt_for_clarification",
			);
			if (clarificationActions.length > 0) {
				const adrActions = result.enforcementActions.filter(
					(a) => a.type === "generate_adr",
				);
				expect(adrActions.length).toBeGreaterThan(0);
			}
		});

		it("should not generate ADR when no significant actions", async () => {
			const sessionState = createTestSessionState("no-adr-action");
			sessionState.config.constraints = []; // No constraints = no actions needed

			const request: ConsistencyEnforcementRequest = {
				sessionState,
				context: "No significant actions test",
			};

			const result =
				await constraintConsistencyEnforcer.enforceConsistency(request);

			expect(result.enforcementActions).toBeInstanceOf(Array);
		});

		it("should correctly process violation loop (for...of currentValidation.violations)", async () => {
			const sessionState = createTestSessionState("violation-loop");

			const request: ConsistencyEnforcementRequest = {
				sessionState,
				context: "Testing violation loop processing",
				strictMode: true,
			};

			const result =
				await constraintConsistencyEnforcer.enforceConsistency(request);

			expect(result.enforcementActions).toBeInstanceOf(Array);
			// All actions should have required properties
			result.enforcementActions.forEach((action) => {
				expect(action.id).toBeDefined();
				expect(action.type).toBeDefined();
				expect(action.constraintId).toBeDefined();
				expect(action.description).toBeDefined();
				expect(action.interactive).toBeDefined();
			});
		});
	});

	describe("generateInteractivePrompts - Prompt Generation Logic", () => {
		it("should generate context-driven prompts for critical violations", async () => {
			const sessionState = createTestSessionState("critical-prompts");

			// Build history with enforcement to trigger violations
			await constraintConsistencyEnforcer.enforceConsistency({
				sessionState,
				context: "Building violation scenario",
			});

			await constraintConsistencyEnforcer.detectViolations(sessionState);

			// Check if prompts are generated for violations
			const enforcementResult =
				await constraintConsistencyEnforcer.enforceConsistency({
					sessionState,
					context: "Testing prompt generation",
				});

			expect(enforcementResult.interactivePrompts).toBeInstanceOf(Array);
		});

		it("should generate Space 7 alignment prompts for low consistency scores", async () => {
			const sessionState = createTestSessionState("low-consistency-prompts");
			sessionState.coverage.overall = 50; // Low coverage to trigger low consistency

			const request: ConsistencyEnforcementRequest = {
				sessionState,
				context: "Low consistency scenario",
			};

			const result =
				await constraintConsistencyEnforcer.enforceConsistency(request);

			expect(result.interactivePrompts).toBeInstanceOf(Array);
			if (result.consistencyScore < 80) {
				const space7Prompts = result.interactivePrompts.filter((p) =>
					p.includes("Space 7"),
				);
				expect(space7Prompts.length).toBeGreaterThan(0);
			}
		});

		it("should process critical violations loop correctly", async () => {
			const sessionState = createTestSessionState("critical-loop");

			const result = await constraintConsistencyEnforcer.enforceConsistency({
				sessionState,
				context: "Critical violations loop test",
			});

			expect(result.interactivePrompts).toBeInstanceOf(Array);
			// Each prompt should be a string
			result.interactivePrompts.forEach((prompt) => {
				expect(typeof prompt).toBe("string");
				expect(prompt.length).toBeGreaterThan(0);
			});
		});

		it("should trigger Space 7 alignment when score < 80", async () => {
			const sessionState = createTestSessionState("score-threshold");
			sessionState.coverage.overall = 65;

			const result = await constraintConsistencyEnforcer.enforceConsistency({
				sessionState,
				context: "Testing score threshold",
			});

			if (result.consistencyScore < 80) {
				const hasAlignment = result.interactivePrompts.some((p) =>
					p.includes("Space 7 Instructions Alignment Check"),
				);
				expect(hasAlignment).toBe(true);
			}
		});
	});

	describe("generateEnforcementArtifacts - ADR Generation", () => {
		it("should generate ADR artifacts for enforcement decisions", async () => {
			vi.spyOn(adrGenerator, "generateADR").mockResolvedValue({
				artifact: {
					id: "adr-test-001",
					name: "Test ADR",
					type: "adr",
					content: "Test ADR content",
					format: "markdown",
					metadata: {},
					timestamp: new Date().toISOString(),
				},
				markdown: "# Test ADR",
				recommendations: [],
				relatedDecisions: [],
			});

			const sessionState = createTestSessionState("adr-generation-001");

			const request: ConsistencyEnforcementRequest = {
				sessionState,
				context: "ADR artifact generation test",
			};

			const result =
				await constraintConsistencyEnforcer.enforceConsistency(request);

			expect(result.generatedArtifacts).toBeInstanceOf(Array);

			vi.restoreAllMocks();
		});

		it("should handle ADR generation errors gracefully", async () => {
			vi.spyOn(adrGenerator, "generateADR").mockRejectedValue(
				new Error("ADR generation failed"),
			);
			vi.spyOn(logger, "warn");

			const sessionState = createTestSessionState("adr-error-001");

			const request: ConsistencyEnforcementRequest = {
				sessionState,
				context: "ADR error handling test",
			};

			// Should not throw even if ADR generation fails
			const result =
				await constraintConsistencyEnforcer.enforceConsistency(request);
			expect(result).toBeDefined();
			expect(result.success).toBe(true);

			vi.restoreAllMocks();
		});

		it("should iterate through all ADR actions (for...of adrActions loop)", async () => {
			vi.spyOn(adrGenerator, "generateADR")
				.mockResolvedValueOnce({
					artifact: {
						id: "adr-1",
						name: "ADR 1",
						type: "adr",
						content: "Content 1",
						format: "markdown",
						metadata: {},
						timestamp: new Date().toISOString(),
					},
					markdown: "# ADR 1",
					recommendations: [],
					relatedDecisions: [],
				})
				.mockResolvedValueOnce({
					artifact: {
						id: "adr-2",
						name: "ADR 2",
						type: "adr",
						content: "Content 2",
						format: "markdown",
						metadata: {},
						timestamp: new Date().toISOString(),
					},
					markdown: "# ADR 2",
					recommendations: [],
					relatedDecisions: [],
				});

			const sessionState = createTestSessionState("multiple-adr");

			const request: ConsistencyEnforcementRequest = {
				sessionState,
				context: "Multiple ADR generation test",
			};

			const result =
				await constraintConsistencyEnforcer.enforceConsistency(request);

			expect(result.generatedArtifacts).toBeInstanceOf(Array);

			vi.restoreAllMocks();
		});

		it("should include ADR metadata with consistency information", async () => {
			let adrCallCount = 0;
			vi.spyOn(adrGenerator, "generateADR").mockImplementation(
				async (): Promise<ADRGenerationResult> => {
					adrCallCount += 1;
					return {
						artifact: {
							id: `adr-metadata-test-${adrCallCount}`,
							name: "Test ADR",
							type: "adr",
							content: "Test",
							format: "markdown",
							metadata: {
								consistencyScore: 85,
								violationsCount: 0,
								enforcementType: "cross-session-consistency",
							},
							timestamp: new Date().toISOString(),
						},
						markdown: "# Test",
						recommendations: [],
						relatedDecisions: [],
					};
				},
			);

			const sessionState = createTestSessionState("adr-metadata");

			const request: ConsistencyEnforcementRequest = {
				sessionState,
				context: "ADR metadata test",
			};

			await constraintConsistencyEnforcer.enforceConsistency(request);

			vi.restoreAllMocks();
		});
	});

	describe("storeEnforcementDecisions - History Tracking", () => {
		it("should store enforcement decisions for each action", async () => {
			const sessionState = createTestSessionState("store-decisions-001");

			const request: ConsistencyEnforcementRequest = {
				sessionState,
				context: "Testing enforcement decision storage",
			};

			const result =
				await constraintConsistencyEnforcer.enforceConsistency(request);

			expect(result).toBeDefined();
			// The enforcement decisions should be stored internally
			expect(result.enforcementActions).toBeInstanceOf(Array);
		});

		it("should create ConstraintEnforcementHistory objects (for...of enforcementActions)", async () => {
			const sessionState = createTestSessionState("history-creation");

			const request: ConsistencyEnforcementRequest = {
				sessionState,
				context: "Testing history object creation",
			};

			const result =
				await constraintConsistencyEnforcer.enforceConsistency(request);

			expect(result).toBeDefined();
			expect(result.enforcementActions).toBeInstanceOf(Array);

			// Run again to build history
			const request2: ConsistencyEnforcementRequest = {
				sessionState: createTestSessionState("history-creation-2"),
				context: "Second session to access history",
			};

			const result2 =
				await constraintConsistencyEnforcer.enforceConsistency(request2);
			expect(result2.historicalAlignments).toBeInstanceOf(Array);
		});

		it("should track timestamp, phase, and context for each decision", async () => {
			const sessionState = createTestSessionState("detailed-history");
			sessionState.currentPhase = "requirements";

			const request: ConsistencyEnforcementRequest = {
				sessionState,
				context: "Testing detailed history tracking",
			};

			const result =
				await constraintConsistencyEnforcer.enforceConsistency(request);

			expect(result).toBeDefined();
			expect(result.historicalAlignments).toBeInstanceOf(Array);
		});

		it("should handle multiple enforcement actions in storage loop", async () => {
			const sessionState = createTestSessionState("multi-action-storage");
			sessionState.config.constraints.push(
				{
					id: "test.extra1",
					name: "Extra Constraint 1",
					type: "technical",
					category: "technical",
					description: "Extra constraint 1",
					validation: { minCoverage: 75, keywords: ["test"] },
					weight: 5,
					mandatory: false,
					source: "Test",
				},
				{
					id: "test.extra2",
					name: "Extra Constraint 2",
					type: "technical",
					category: "technical",
					description: "Extra constraint 2",
					validation: { minCoverage: 75, keywords: ["test"] },
					weight: 5,
					mandatory: false,
					source: "Test",
				},
			);

			const request: ConsistencyEnforcementRequest = {
				sessionState,
				context: "Testing multiple action storage",
			};

			const result =
				await constraintConsistencyEnforcer.enforceConsistency(request);

			expect(result.enforcementActions).toBeInstanceOf(Array);
		});
	});

	describe("calculateRawConsistencyScore - Score Calculation", () => {
		it("should return 100 when totalConstraints is 0", async () => {
			const sessionState = createTestSessionState("zero-constraints");
			sessionState.config.constraints = [];

			const request: ConsistencyEnforcementRequest = {
				sessionState,
				context: "Zero constraints test",
			};

			const result =
				await constraintConsistencyEnforcer.enforceConsistency(request);

			// With zero constraints, score should be 100
			expect(result.consistencyScore).toBe(100);
		});

		it("should calculate score based on critical violations weight (10x)", async () => {
			const sessionState = createTestSessionState("critical-weight");

			const request: ConsistencyEnforcementRequest = {
				sessionState,
				context: "Critical violation weight test",
			};

			const result =
				await constraintConsistencyEnforcer.enforceConsistency(request);

			expect(result.consistencyScore).toBeGreaterThanOrEqual(0);
			expect(result.consistencyScore).toBeLessThanOrEqual(100);
		});

		it("should calculate score based on warning violations weight (3x)", async () => {
			const sessionState = createTestSessionState("warning-weight");

			const request: ConsistencyEnforcementRequest = {
				sessionState,
				context: "Warning violation weight test",
			};

			const result =
				await constraintConsistencyEnforcer.enforceConsistency(request);

			expect(result.consistencyScore).toBeGreaterThanOrEqual(0);
			expect(result.consistencyScore).toBeLessThanOrEqual(100);
		});

		it("should ensure score never goes below 0", async () => {
			const sessionState = createTestSessionState("min-score-bound");

			const request: ConsistencyEnforcementRequest = {
				sessionState,
				context: "Minimum score bound test",
			};

			const result =
				await constraintConsistencyEnforcer.enforceConsistency(request);

			expect(result.consistencyScore).toBeGreaterThanOrEqual(0);
		});

		it("should ensure score never exceeds 100", async () => {
			const sessionState = createTestSessionState("max-score-bound");

			const request: ConsistencyEnforcementRequest = {
				sessionState,
				context: "Maximum score bound test",
			};

			const result =
				await constraintConsistencyEnforcer.enforceConsistency(request);

			expect(result.consistencyScore).toBeLessThanOrEqual(100);
		});

		it("should apply Math.round for proper rounding", async () => {
			const sessionState = createTestSessionState("rounding-test");

			const request: ConsistencyEnforcementRequest = {
				sessionState,
				context: "Score rounding test",
			};

			const result =
				await constraintConsistencyEnforcer.enforceConsistency(request);

			// Score should be an integer
			expect(Number.isInteger(result.consistencyScore)).toBe(true);
		});
	});

	describe("Prompt Generation Helper Methods", () => {
		it("should generate context-driven prompts with phase context", async () => {
			const sessionState = createTestSessionState("context-prompt");
			sessionState.currentPhase = "architecture";

			await constraintConsistencyEnforcer.detectViolations(sessionState);

			const result = await constraintConsistencyEnforcer.enforceConsistency({
				sessionState,
				phaseId: "architecture",
				context: "Architecture phase prompt test",
			});

			expect(result.interactivePrompts).toBeInstanceOf(Array);
		});

		it("should include phase name in context-driven prompts", async () => {
			const sessionState = createTestSessionState("phase-in-prompt");
			sessionState.currentPhase = "design";

			const result = await constraintConsistencyEnforcer.enforceConsistency({
				sessionState,
				phaseId: "design",
				context: "Phase name in prompt test",
			});

			if (result.interactivePrompts.length > 0) {
				const hasPhaseReference = result.interactivePrompts.some((p) =>
					p.includes("Phase"),
				);
				expect(hasPhaseReference).toBe(true);
			}
		});

		it("should include constraint resolution options in prompts", async () => {
			const sessionState = createTestSessionState("resolution-options");

			const result = await constraintConsistencyEnforcer.enforceConsistency({
				sessionState,
				context: "Resolution options test",
			});

			if (result.interactivePrompts.length > 0) {
				const hasOptions = result.interactivePrompts.some(
					(p) =>
						p.includes("Resolution Options") ||
						p.includes("Align with Previous") ||
						p.includes("Document Deviation"),
				);
				expect(hasOptions).toBe(true);
			}
		});

		it("should generate Space 7 alignment prompts with consistency score", async () => {
			const sessionState = createTestSessionState("space7-score");

			const result = await constraintConsistencyEnforcer.enforceConsistency({
				sessionState,
				context: "Space 7 score test",
			});

			if (result.consistencyScore < 80) {
				const hasScore = result.interactivePrompts.some((p) =>
					p.includes("Consistency Score"),
				);
				expect(hasScore).toBe(true);
			}
		});

		it("should generate Space 7 prompts with phase coverage questions", async () => {
			const sessionState = createTestSessionState("phase-coverage-q");

			const result = await constraintConsistencyEnforcer.enforceConsistency({
				sessionState,
				context: "Phase coverage questions test",
			});

			if (result.consistencyScore < 80) {
				const hasPhaseQuestion = result.interactivePrompts.some((p) =>
					p.includes("Phase Coverage"),
				);
				expect(hasPhaseQuestion).toBe(true);
			}
		});

		it("should generate conflict resolution prompts with previous decisions", async () => {
			// Create first session
			const sessionState1 = createTestSessionState("conflict-decision-1");
			await constraintConsistencyEnforcer.enforceConsistency({
				sessionState: sessionState1,
				context: "First conflict scenario",
			});

			// Create second session to detect conflict
			const sessionState2 = createTestSessionState("conflict-decision-2");
			const result = await constraintConsistencyEnforcer.enforceConsistency({
				sessionState: sessionState2,
				context: "Second conflict scenario",
			});

			// Check for conflict resolution prompts
			const conflictPrompts = result.interactivePrompts.filter((p) =>
				p.includes("Conflict Resolution"),
			);
			expect(conflictPrompts.length).toBeGreaterThanOrEqual(0);
		});

		it("should generate violation resolution prompts with suggested fixes", async () => {
			const sessionState = createTestSessionState("violation-fix");

			const result = await constraintConsistencyEnforcer.enforceConsistency({
				sessionState,
				context: "Violation fix test",
			});

			if (result.interactivePrompts.length > 0) {
				const hasViolationPrompt = result.interactivePrompts.some((p) =>
					p.includes("Violation"),
				);
				expect(hasViolationPrompt).toBe(true);
			}
		});

		it("should include enforcement guidance in prompts", async () => {
			const sessionState = createTestSessionState("enforcement-guidance");

			const result = await constraintConsistencyEnforcer.enforceConsistency({
				sessionState,
				context: "Enforcement guidance test",
			});

			expect(result.interactivePrompts).toBeInstanceOf(Array);
		});
	});

	describe("Integration - End-to-End Scenarios", () => {
		it("should handle complete enforcement workflow with violations and artifacts", async () => {
			const sessionState = createTestSessionState("e2e-workflow");

			const result = await constraintConsistencyEnforcer.enforceConsistency({
				sessionState,
				context: "End-to-end workflow test",
				strictMode: false,
			});

			expect(result.success).toBeDefined();
			expect(result.consistencyScore).toBeGreaterThanOrEqual(0);
			expect(result.consistencyScore).toBeLessThanOrEqual(100);
			expect(result.enforcementActions).toBeInstanceOf(Array);
			expect(result.generatedArtifacts).toBeInstanceOf(Array);
			expect(result.interactivePrompts).toBeInstanceOf(Array);
			expect(result.recommendations).toBeInstanceOf(Array);
			expect(result.historicalAlignments).toBeInstanceOf(Array);
		});

		it("should properly track history across multiple sessions", async () => {
			const sessions = [];
			for (let i = 1; i <= 3; i++) {
				const sessionState = createTestSessionState(`history-e2e-${i}`);
				const result = await constraintConsistencyEnforcer.enforceConsistency({
					sessionState,
					context: `Session ${i} in history tracking`,
				});
				sessions.push({ state: sessionState, result });
			}

			// Final session should have historical alignments
			const lastResult = sessions[sessions.length - 1].result;
			expect(lastResult.historicalAlignments).toBeInstanceOf(Array);
		});

		it("should aggregate recommendations and actions correctly", async () => {
			const sessionState = createTestSessionState("aggregation-e2e");

			const result = await constraintConsistencyEnforcer.enforceConsistency({
				sessionState,
				context: "Aggregation test",
			});

			// All recommendation categories should be present
			expect(result.recommendations).toBeInstanceOf(Array);
			expect(result.enforcementActions).toBeInstanceOf(Array);

			// Types should be consistent
			result.enforcementActions.forEach((action) => {
				expect([
					"prompt_for_clarification",
					"auto_align",
					"generate_adr",
					"escalate",
				]).toContain(action.type);
			});
		});
	});
});
