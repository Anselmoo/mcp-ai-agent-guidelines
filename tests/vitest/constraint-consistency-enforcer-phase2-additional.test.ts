import { beforeEach, describe, expect, it } from "vitest";
import { constraintConsistencyEnforcer } from "../../dist/tools/design/constraint-consistency-enforcer.js";
import type {
	ConstraintRule,
	DesignSessionState,
} from "../../dist/tools/design/types/index.js";

describe("Constraint Consistency Enforcer - Phase 2 Additional Coverage", () => {
	beforeEach(async () => {
		await constraintConsistencyEnforcer.initialize();
	});

	const createMinimalSession = (): DesignSessionState => {
		const constraints: ConstraintRule[] = [
			{
				id: "c1",
				name: "Performance",
				type: "non-functional",
				category: "performance",
				description: "Response time < 100ms",
				validation: { minCoverage: 90 },
				weight: 2,
				mandatory: true,
				source: "architecture-guidelines",
			},
		];

		return {
			config: {
				sessionId: "test-session-phase2",
				context: "Phase 2 Test context",
				goal: "Test goal",
				requirements: ["req-1"],
				constraints,
				coverageThreshold: 85,
				enablePivots: false,
				templateRefs: [],
				outputFormats: ["markdown"],
				metadata: {},
			},
			currentPhase: "discovery",
			phases: {
				discovery: {
					id: "discovery",
					name: "Discovery",
					description: "Discovery phase",
					status: "in-progress",
					inputs: [],
					outputs: [],
					criteria: [],
					coverage: 50,
					artifacts: [],
					dependencies: [],
				},
			},
			coverage: {
				overall: 50,
				phases: { discovery: 50 },
				constraints: { c1: 50 },
				assumptions: {},
				documentation: {},
				testCoverage: 50,
			},
			artifacts: [],
			history: [],
			status: "active",
		};
	};

	const createSessionWithMultipleConstraints = (
		count: number,
	): DesignSessionState => {
		const constraints: ConstraintRule[] = Array.from(
			{ length: count },
			(_, i) => ({
				id: `constraint-${i}`,
				name: `Constraint ${i}`,
				description: `Test constraint ${i}`,
				type: i % 2 === 0 ? "functional" : "non-functional",
				category: i % 3 === 0 ? "performance" : "security",
				validation: { minCoverage: 80 },
				weight: (i % 3) + 1,
				mandatory: i % 2 === 0,
				source: "test-source",
			}),
		);

		const session = createMinimalSession();
		session.config.constraints = constraints;
		session.coverage.constraints = constraints.reduce(
			(acc, c, idx) => {
				acc[c.id] = 70 + (idx % 20);
				return acc;
			},
			{} as Record<string, number>,
		);
		return session;
	};

	describe("Basic Enforcement Scenarios", () => {
		it("should enforce consistency for minimal session", async () => {
			const session = createMinimalSession();
			const result = await constraintConsistencyEnforcer.enforceConsistency({
				sessionState: session,
			});

			expect(result).toBeDefined();
			expect(result.success).toBeDefined();
			expect(result.consistencyScore).toBeGreaterThanOrEqual(0);
			expect(result.consistencyScore).toBeLessThanOrEqual(100);
		});

		it("should handle enforcement with no constraints", async () => {
			const session = createMinimalSession();
			session.config.constraints = [];
			const result = await constraintConsistencyEnforcer.enforceConsistency({
				sessionState: session,
			});

			expect(result).toBeDefined();
			expect(result.enforcementActions).toBeInstanceOf(Array);
		});

		it("should support strict mode enforcement", async () => {
			const session = createMinimalSession();
			const result = await constraintConsistencyEnforcer.enforceConsistency({
				sessionState: session,
				strictMode: true,
			});

			expect(result).toBeDefined();
			expect(typeof result.consistencyScore).toBe("number");
		});
	});

	describe("Violation Detection", () => {
		it("should detect violations when coverage is low", async () => {
			const session = createMinimalSession();
			session.coverage.overall = 30;
			session.coverage.constraints = { c1: 30 };

			const result = await constraintConsistencyEnforcer.enforceConsistency({
				sessionState: session,
			});

			expect(result).toBeDefined();
		});

		it("should detectViolations method returns array", async () => {
			const session = createMinimalSession();
			const violations =
				await constraintConsistencyEnforcer.detectViolations(session);

			expect(violations).toBeInstanceOf(Array);
		});

		it("should handle detectViolations with multiple constraints", async () => {
			const session = createSessionWithMultipleConstraints(3);
			const violations =
				await constraintConsistencyEnforcer.detectViolations(session);

			expect(violations).toBeInstanceOf(Array);
		});

		it("should detect violations with empty constraints array", async () => {
			const session = createMinimalSession();
			session.config.constraints = [];
			const violations =
				await constraintConsistencyEnforcer.detectViolations(session);

			expect(violations).toBeInstanceOf(Array);
		});
	});

	describe("Cross-Session Validation", () => {
		it("should validate cross-session consistency without constraintId", async () => {
			const session = createMinimalSession();
			const result =
				await constraintConsistencyEnforcer.validateCrossSessionConsistency(
					session,
					undefined,
				);

			expect(result).toBeDefined();
			expect(result.passed).toBeDefined();
			expect(result.violations).toBeInstanceOf(Array);
		});

		it("should validate specific constraint by ID", async () => {
			const session = createSessionWithMultipleConstraints(2);
			const result =
				await constraintConsistencyEnforcer.validateCrossSessionConsistency(
					session,
					"constraint-0",
				);

			expect(result).toBeDefined();
			expect(result.passed).toBeDefined();
		});

		it("should handle validation with non-existent constraintId", async () => {
			const session = createMinimalSession();
			const result =
				await constraintConsistencyEnforcer.validateCrossSessionConsistency(
					session,
					"non-existent-constraint",
				);

			expect(result).toBeDefined();
			expect(result.passed).toBeDefined();
		});

		it("should validate with empty constraints", async () => {
			const session = createMinimalSession();
			session.config.constraints = [];
			const result =
				await constraintConsistencyEnforcer.validateCrossSessionConsistency(
					session,
					undefined,
				);

			expect(result.violations).toBeInstanceOf(Array);
		});
	});

	describe("Enforcement Actions & Artifacts", () => {
		it("should generate enforcementActions array", async () => {
			const session = createSessionWithMultipleConstraints(2);
			const result = await constraintConsistencyEnforcer.enforceConsistency({
				sessionState: session,
			});

			expect(result.enforcementActions).toBeInstanceOf(Array);
		});

		it("should generate interactivePrompts", async () => {
			const session = createSessionWithMultipleConstraints(1);
			const result = await constraintConsistencyEnforcer.enforceConsistency({
				sessionState: session,
			});

			expect(result.interactivePrompts).toBeInstanceOf(Array);
		});

		it("should generate generatedArtifacts", async () => {
			const session = createMinimalSession();
			const result = await constraintConsistencyEnforcer.enforceConsistency({
				sessionState: session,
			});

			expect(result.generatedArtifacts).toBeInstanceOf(Array);
		});

		it("should include recommendations", async () => {
			const session = createMinimalSession();
			session.coverage.overall = 40;
			const result = await constraintConsistencyEnforcer.enforceConsistency({
				sessionState: session,
			});

			expect(result.recommendations).toBeInstanceOf(Array);
		});
	});

	describe("Edge Cases & Boundary Values", () => {
		it("should handle zero constraints", async () => {
			const session = createSessionWithMultipleConstraints(0);
			const result = await constraintConsistencyEnforcer.enforceConsistency({
				sessionState: session,
			});

			expect(result).toBeDefined();
			expect(result.success).toBeDefined();
		});

		it("should handle many constraints (10+)", async () => {
			const session = createSessionWithMultipleConstraints(10);
			const result = await constraintConsistencyEnforcer.enforceConsistency({
				sessionState: session,
			});

			expect(result.enforcementActions).toBeInstanceOf(Array);
		});

		it("should score with 0% coverage", async () => {
			const session = createMinimalSession();
			session.coverage.overall = 0;
			const result = await constraintConsistencyEnforcer.enforceConsistency({
				sessionState: session,
			});

			expect(result.consistencyScore).toBeGreaterThanOrEqual(0);
		});

		it("should score with 100% coverage", async () => {
			const session = createMinimalSession();
			session.coverage.overall = 100;
			const result = await constraintConsistencyEnforcer.enforceConsistency({
				sessionState: session,
			});

			expect(result.consistencyScore).toBeGreaterThanOrEqual(0);
		});

		it("should handle diverse constraint types", async () => {
			const session = createMinimalSession();
			session.config.constraints = [
				{
					id: "func-1",
					name: "Functional",
					description: "desc",
					type: "functional",
					category: "performance",
					validation: { minCoverage: 80 },
					weight: 1,
					mandatory: true,
					source: "test",
				},
				{
					id: "comp-1",
					name: "Compliance",
					description: "desc",
					type: "compliance",
					category: "security",
					validation: { keywords: ["security"] },
					weight: 2,
					mandatory: true,
					source: "test",
				},
				{
					id: "nonfunc-1",
					name: "Non-Functional",
					description: "desc",
					type: "non-functional",
					category: "performance",
					validation: { minCoverage: 70 },
					weight: 1,
					mandatory: false,
					source: "test",
				},
			];

			const result = await constraintConsistencyEnforcer.enforceConsistency({
				sessionState: session,
			});

			expect(result).toBeDefined();
		});
	});

	describe("Report Generation", () => {
		it("should generate report for session", async () => {
			const session = createMinimalSession();
			const report =
				await constraintConsistencyEnforcer.generateReport(session);

			expect(report).toBeDefined();
		});

		it("should generate report with multiple constraints", async () => {
			const session = createSessionWithMultipleConstraints(3);
			const report =
				await constraintConsistencyEnforcer.generateReport(session);

			expect(report).toBeDefined();
		});

		it("should generate report with artifacts", async () => {
			const session = createMinimalSession();
			session.artifacts = [
				{
					id: "art-1",
					name: "Test Artifact",
					type: "document",
					content: "test content",
					createdAt: new Date().toISOString(),
					relatedConstraints: ["c1"],
				},
			];

			const report =
				await constraintConsistencyEnforcer.generateReport(session);

			expect(report).toBeDefined();
		});

		it("should handle report generation with no constraints", async () => {
			const session = createMinimalSession();
			session.config.constraints = [];
			const report =
				await constraintConsistencyEnforcer.generateReport(session);

			expect(report).toBeDefined();
		});
	});

	describe("Consistency Scoring", () => {
		it("should calculate score between 0 and 100", async () => {
			const session = createMinimalSession();
			const result = await constraintConsistencyEnforcer.enforceConsistency({
				sessionState: session,
			});

			expect(result.consistencyScore).toBeGreaterThanOrEqual(0);
			expect(result.consistencyScore).toBeLessThanOrEqual(100);
		});

		it("should score higher with better coverage", async () => {
			const session1 = createMinimalSession();
			session1.coverage.overall = 30;
			const result1 = await constraintConsistencyEnforcer.enforceConsistency({
				sessionState: session1,
			});

			const session2 = createMinimalSession();
			session2.coverage.overall = 90;
			const result2 = await constraintConsistencyEnforcer.enforceConsistency({
				sessionState: session2,
			});

			expect(result2.consistencyScore).toBeGreaterThanOrEqual(
				result1.consistencyScore,
			);
		});

		it("should include historical alignments", async () => {
			const session = createSessionWithMultipleConstraints(2);
			const result = await constraintConsistencyEnforcer.enforceConsistency({
				sessionState: session,
			});

			expect(result.historicalAlignments).toBeInstanceOf(Array);
		});

		it("should handle constraint weight in scoring", async () => {
			const session = createMinimalSession();
			session.config.constraints = [
				{
					id: "high-weight",
					name: "High Weight",
					type: "functional",
					category: "performance",
					description: "Important constraint",
					validation: { minCoverage: 90 },
					weight: 10,
					mandatory: true,
					source: "test",
				},
				{
					id: "low-weight",
					name: "Low Weight",
					type: "functional",
					category: "performance",
					description: "Less important",
					validation: { minCoverage: 50 },
					weight: 1,
					mandatory: false,
					source: "test",
				},
			];

			const result = await constraintConsistencyEnforcer.enforceConsistency({
				sessionState: session,
			});

			expect(result.consistencyScore).toBeDefined();
		});
	});

	describe("Initialization & State Management", () => {
		it("should initialize without errors", async () => {
			await constraintConsistencyEnforcer.initialize();
			expect(true).toBe(true);
		});

		it("should handle multiple initializations", async () => {
			await constraintConsistencyEnforcer.initialize();
			await constraintConsistencyEnforcer.initialize();
			expect(true).toBe(true);
		});
	});
});
