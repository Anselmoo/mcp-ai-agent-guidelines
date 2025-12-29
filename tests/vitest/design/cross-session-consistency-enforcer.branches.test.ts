import { beforeEach, describe, expect, it } from "vitest";
import { crossSessionConsistencyEnforcer } from "../../../src/tools/design/cross-session-consistency-enforcer.js";
import type {
	ConstraintDecision,
	ConstraintRule,
} from "../../../src/tools/design/types/constraint.types.js";
import type { CoverageReport } from "../../../src/tools/design/types/coverage.types.js";
import type { DesignSessionState } from "../../../src/tools/design/types/session.types.js";

function makeSession(
	sessionId: string,
	overrides: Record<string, unknown> = {},
) {
	return {
		config: {
			sessionId,
			context: (overrides.context as string) || "test-context",
			goal: (overrides.goal as string) || "test-goal",
			requirements: (overrides.requirements as string[]) || [],
			constraints: (overrides.constraints as unknown as ConstraintRule[]) || [],
			coverageThreshold: (overrides.coverageThreshold as number) ?? 85,
			enablePivots: true,
			templateRefs: [],
			outputFormats: ["markdown" as const],
			metadata: {},
		},
		currentPhase: (overrides.currentPhase as string) || "unknown",
		phases: (overrides.phases as unknown as Record<string, unknown>) || {},
		coverage: (overrides.coverage as unknown as CoverageReport) || {
			overall: 100,
			phases: {},
			constraints: {},
			assumptions: {},
			documentation: {},
			testCoverage: 100,
		},
		artifacts: [],
		history: [],
		status: "active",
	} as unknown as DesignSessionState;
}

describe("cross-session-consistency-enforcer - branch coverage tests", () => {
	beforeEach(async () => {
		// reset history
		await crossSessionConsistencyEnforcer.initialize({});
	});

	it("detects constraint inconsistency when appliedCount < threshold", async () => {
		const cId = "constraint-1";

		// Create three past decisions: one applied, two skipped
		const sA = makeSession("sA");
		await crossSessionConsistencyEnforcer.recordConstraintDecision(
			sA,
			cId,
			{
				action: "applied",
				originalRule: {
					id: cId,
					name: cId,
					type: "technical",
					category: "general",
					description: "",
					validation: {},
					weight: 1,
					mandatory: false,
					source: "test",
				},
				coverage: 100,
				violations: [],
				justification: "ok",
			},
			"applied reason",
		);

		const sB = makeSession("sB");
		await crossSessionConsistencyEnforcer.recordConstraintDecision(
			sB,
			cId,
			{
				action: "skipped",
				originalRule: {
					id: cId,
					name: cId,
					type: "technical",
					category: "general",
					description: "",
					validation: {},
					weight: 1,
					mandatory: false,
					source: "test",
				},
				coverage: 0,
				violations: [],
				justification: "skip",
			},
			"skip reason",
		);

		const sC = makeSession("sC");
		await crossSessionConsistencyEnforcer.recordConstraintDecision(
			sC,
			cId,
			{
				action: "skipped",
				originalRule: {
					id: cId,
					name: cId,
					type: "technical",
					category: "general",
					description: "",
					validation: {},
					weight: 1,
					mandatory: false,
					source: "test",
				},
				coverage: 0,
				violations: [],
				justification: "skip",
			},
			"skip reason",
		);

		// Current session considers the same constraint
		const current = makeSession("current", {
			constraints: [
				{
					id: cId,
					name: cId,
					type: "technical",
					category: "general",
					description: "",
					validation: {},
					weight: 1,
					mandatory: false,
					source: "test",
				},
			],
		});

		const report = await crossSessionConsistencyEnforcer.enforceConsistency(
			current as any,
		);

		expect(report.constraintConsistency[cId].consistent).toBe(false);
		expect(
			report.violations.some((v) => v.type === "constraint_inconsistency"),
		).toBe(true);
	});

	it("adds phase coverage critical violation when required constraints missing", async () => {
		const current = makeSession("sess-2", {
			currentPhase: "specification",
			constraints: [],
		});

		const report = await crossSessionConsistencyEnforcer.enforceConsistency(
			current as any,
		);

		expect(report.phaseConsistency["specification"].consistent).toBe(false);
		expect(report.violations.some((v) => v.type === "phase_coverage")).toBe(
			true,
		);
	});

	it("detects Space 7 alignment issues (coverage threshold & unexpected phase)", async () => {
		const current = makeSession("sess-3", {
			currentPhase: "not-a-phase",
			coverage: { overall: 50 },
			constraints: [],
			coverageThreshold: 60,
		});

		const report = await crossSessionConsistencyEnforcer.enforceConsistency(
			current as any,
		);

		expect(report.space7Alignment).toBeLessThan(100);
		expect(report.violations.some((v) => v.type === "space7_deviation")).toBe(
			true,
		);
	});

	it("generates enforcement prompts for critical violations, patterns and space7 misalignment", async () => {
		const current = makeSession("sess-4", {
			currentPhase: "specification",
			constraints: [],
			coverage: { overall: 50 },
			coverageThreshold: 60,
		});

		const report = await crossSessionConsistencyEnforcer.enforceConsistency(
			current as DesignSessionState,
		);
		const prompts =
			await crossSessionConsistencyEnforcer.generateEnforcementPrompts(
				current as DesignSessionState,
				report,
			);

		expect(
			prompts.some(
				(p) => p.type === "consistency_check" || p.type === "space7_alignment",
			),
		).toBe(true);
	});

	it("generates documentation (ADR/spec/roadmap) including session id", async () => {
		const current = makeSession("sess-doc", {
			currentPhase: "specification",
			constraints: [],
		});

		const report = await crossSessionConsistencyEnforcer.enforceConsistency(
			current as DesignSessionState,
		);
		const docs =
			await crossSessionConsistencyEnforcer.generateConstraintDocumentation(
				current as DesignSessionState,
				report,
			);

		expect(docs.adr).toContain("Session: sess-doc");
		expect(docs.roadmap).toContain("Session: sess-doc");
	});

	it("returns usage patterns from history", async () => {
		// Add a few entries via recordConstraintDecision
		const cId = "usage-1";
		const s1 = makeSession("h1");
		const s2 = makeSession("h2");
		await crossSessionConsistencyEnforcer.recordConstraintDecision(
			s1 as DesignSessionState,
			cId,
			{
				action: "applied",
				originalRule: {
					id: cId,
					name: cId,
					type: "technical",
					category: "general",
					description: "",
					validation: {},
					weight: 1,
					mandatory: false,
					source: "test",
				},
				coverage: 100,
				violations: [],
				justification: "ok",
			} as ConstraintDecision,
			"r1",
		);
		await crossSessionConsistencyEnforcer.recordConstraintDecision(
			s2 as DesignSessionState,
			cId,
			{
				action: "applied",
				originalRule: {
					id: cId,
					name: cId,
					type: "technical",
					category: "general",
					description: "",
					validation: {},
					weight: 1,
					mandatory: false,
					source: "test",
				},
				coverage: 100,
				violations: [],
				justification: "ok",
			} as ConstraintDecision,
			"r2",
		);

		const patterns =
			crossSessionConsistencyEnforcer.getConstraintUsagePatterns(cId);
		expect(patterns.length).toBeGreaterThan(0);
	});
});
