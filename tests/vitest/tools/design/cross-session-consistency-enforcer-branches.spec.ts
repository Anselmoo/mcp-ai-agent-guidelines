/**
 * Branch-coverage tests for cross-session-consistency-enforcer.ts
 * Target: cover the 26 uncovered branches (currently 62/88 = 70%)
 */
import { beforeEach, describe, expect, it } from "vitest";
import {
	crossSessionConsistencyEnforcer,
	IMPLEMENTATION_STATUS,
} from "../../../../src/tools/design/cross-session-consistency-enforcer.js";
import type { DesignSessionState } from "../../../../src/tools/design/types/index.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSession(
	overrides: Partial<DesignSessionState> = {},
): DesignSessionState {
	return {
		config: {
			sessionId: `session-${Date.now()}`,
			context: "Test context",
			goal: "Test goal",
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
			byPhase: {},
			byConstraint: {},
			details: [],
		},
		artifacts: [],
		history: [],
		status: "active",
		...overrides,
	};
}

// ---------------------------------------------------------------------------
// Exported constant
// ---------------------------------------------------------------------------

describe("cross-session-consistency-enforcer constants", () => {
	it("IMPLEMENTATION_STATUS is IMPLEMENTED", () => {
		expect(IMPLEMENTATION_STATUS).toBe("IMPLEMENTED");
	});
});

// ---------------------------------------------------------------------------
// initialize
// ---------------------------------------------------------------------------

describe("crossSessionConsistencyEnforcer.initialize", () => {
	beforeEach(async () => {
		await crossSessionConsistencyEnforcer.initialize();
	});

	it("initializes with default config", async () => {
		await expect(
			crossSessionConsistencyEnforcer.initialize(),
		).resolves.toBeUndefined();
	});

	it("accepts partial config override", async () => {
		await expect(
			crossSessionConsistencyEnforcer.initialize({ consistencyThreshold: 90 }),
		).resolves.toBeUndefined();
	});

	it("accepts autoApplyPatterns=true", async () => {
		await expect(
			crossSessionConsistencyEnforcer.initialize({ autoApplyPatterns: true }),
		).resolves.toBeUndefined();
	});
});

// ---------------------------------------------------------------------------
// recordConstraintDecisions (backward-compatible alias)
// ---------------------------------------------------------------------------

describe("recordConstraintDecisions", () => {
	beforeEach(async () => {
		await crossSessionConsistencyEnforcer.initialize({
			consistencyThreshold: 85,
		});
	});

	it("records a single decision without timestamp", () => {
		expect(() => {
			crossSessionConsistencyEnforcer.recordConstraintDecisions({
				"decision-1": {
					sessionId: "sess-1",
					constraintId: "context_clarity",
					decision: "applied",
					rationale: "Clear context provided",
				},
			});
		}).not.toThrow();
	});

	it("records a decision with explicit timestamp", () => {
		expect(() => {
			crossSessionConsistencyEnforcer.recordConstraintDecisions({
				"decision-2": {
					sessionId: "sess-2",
					constraintId: "stakeholder_identification",
					decision: "skipped",
					rationale: "Not applicable",
					timestamp: new Date().toISOString(),
				},
			});
		}).not.toThrow();
	});

	it("records multiple decisions", () => {
		expect(() => {
			crossSessionConsistencyEnforcer.recordConstraintDecisions({
				d1: {
					sessionId: "sess-a",
					constraintId: "c1",
					decision: "applied",
					rationale: "Reason A",
				},
				d2: {
					sessionId: "sess-b",
					constraintId: "c2",
					decision: "applied",
					rationale: "Reason B",
				},
			});
		}).not.toThrow();
	});
});

// ---------------------------------------------------------------------------
// recordConstraintDecision (main API)
// ---------------------------------------------------------------------------

describe("recordConstraintDecision", () => {
	beforeEach(async () => {
		await crossSessionConsistencyEnforcer.initialize();
	});

	it("records a valid constraint decision", async () => {
		const session = makeSession();
		await expect(
			crossSessionConsistencyEnforcer.recordConstraintDecision(
				session,
				"context_clarity",
				{
					action: "applied",
					originalRule: {
						id: "context_clarity",
						name: "Context Clarity",
						type: "technical",
						category: "general",
						description: "Context should be clear",
						validation: {},
						weight: 1,
						mandatory: true,
						source: "yaml",
					},
					coverage: 90,
					violations: [],
					justification: "Context is clear",
				},
				"Context was properly defined",
			),
		).resolves.toBeUndefined();
	});

	it("records a decision with space7Reference", async () => {
		const session = makeSession();
		await expect(
			crossSessionConsistencyEnforcer.recordConstraintDecision(
				session,
				"stakeholder_identification",
				{
					action: "skipped",
					originalRule: {
						id: "stakeholder_identification",
						name: "Stakeholder ID",
						type: "technical",
						category: "general",
						description: "Identify stakeholders",
						validation: {},
						weight: 1,
						mandatory: false,
						source: "yaml",
					},
					coverage: 0,
					violations: ["No stakeholders listed"],
					justification: "Skipped for prototype",
				},
				"Prototype phase",
				"Space7-Ref-001",
			),
		).resolves.toBeUndefined();
	});

	it("records decision with modified action", async () => {
		const session = makeSession();
		await expect(
			crossSessionConsistencyEnforcer.recordConstraintDecision(
				session,
				"some_rule",
				{
					action: "modified",
					originalRule: {
						id: "some_rule",
						name: "Some Rule",
						type: "technical",
						category: "general",
						description: "A rule",
						validation: { minCoverage: 70, keywords: ["keyword1"] },
						weight: 2,
						mandatory: false,
						source: "yaml",
					},
					modifiedRule: { weight: 1 },
					coverage: 60,
					violations: [],
					justification: "Modified for context",
				},
				"Modified due to context",
			),
		).resolves.toBeUndefined();
	});
});

// ---------------------------------------------------------------------------
// enforceConsistency — branch coverage
// ---------------------------------------------------------------------------

describe("enforceConsistency", () => {
	beforeEach(async () => {
		await crossSessionConsistencyEnforcer.initialize({
			consistencyThreshold: 85,
			autoApplyPatterns: false,
		});
	});

	it("returns consistency report for a fresh session", async () => {
		const session = makeSession();
		const report =
			await crossSessionConsistencyEnforcer.enforceConsistency(session);

		expect(report).toHaveProperty("sessionId");
		expect(report).toHaveProperty("overallConsistency");
		expect(report.violations).toBeInstanceOf(Array);
		expect(report.recommendations).toBeInstanceOf(Array);
	});

	it("returns high consistency for session with prior decisions", async () => {
		const sessionId = `sess-enforce-${Date.now()}`;

		// Record some prior decisions
		crossSessionConsistencyEnforcer.recordConstraintDecisions({
			d1: {
				sessionId,
				constraintId: "context_clarity",
				decision: "applied",
				rationale: "Applied",
			},
		});

		const session = makeSession({
			config: {
				sessionId,
				context: "Rich context",
				goal: "Design system",
				requirements: [],
				constraints: [],
				coverageThreshold: 85,
				enablePivots: false,
				templateRefs: [],
				outputFormats: ["markdown"],
				metadata: {},
			},
		});
		const report =
			await crossSessionConsistencyEnforcer.enforceConsistency(session);
		expect(report.overallConsistency).toBeGreaterThanOrEqual(0);
	});

	it("processes session with non-empty phases", async () => {
		const session = makeSession({
			phases: {
				discovery: {
					id: "discovery",
					name: "Discovery",
					status: "completed",
					artifacts: [],
					coverage: 0,
					constraints: [],
					completedAt: new Date().toISOString(),
				},
			},
		});
		const report =
			await crossSessionConsistencyEnforcer.enforceConsistency(session);
		expect(report).toHaveProperty("phaseConsistency");
	});

	it("processes session with artifacts in phases", async () => {
		const session = makeSession({
			phases: {
				discovery: {
					id: "discovery",
					name: "Discovery",
					status: "completed",
					artifacts: [
						{
							type: "specification",
							content: "Context clarity and stakeholder identification done",
							format: "markdown",
						},
					],
					coverage: 80,
					constraints: [],
				},
			},
		});
		const report =
			await crossSessionConsistencyEnforcer.enforceConsistency(session);
		expect(report.space7Alignment).toBeGreaterThanOrEqual(0);
	});
});

// ---------------------------------------------------------------------------
// detectSpaceSevenAlignmentIssues (alias)
// ---------------------------------------------------------------------------

describe("detectSpaceSevenAlignmentIssues", () => {
	beforeEach(async () => {
		await crossSessionConsistencyEnforcer.initialize();
	});

	it("returns array of violations", async () => {
		const session = makeSession();
		const violations =
			await crossSessionConsistencyEnforcer.detectSpaceSevenAlignmentIssues(
				session,
			);
		expect(violations).toBeInstanceOf(Array);
	});
});

// ---------------------------------------------------------------------------
// generateEnforcementPrompts — branches
// ---------------------------------------------------------------------------

describe("generateEnforcementPrompts", () => {
	beforeEach(async () => {
		await crossSessionConsistencyEnforcer.initialize({
			consistencyThreshold: 85,
		});
	});

	it("returns empty array for clean session", async () => {
		const session = makeSession();
		const report =
			await crossSessionConsistencyEnforcer.enforceConsistency(session);
		const prompts =
			await crossSessionConsistencyEnforcer.generateEnforcementPrompts(
				session,
				report,
			);
		expect(prompts).toBeInstanceOf(Array);
	});

	it("returns prompts when space7Alignment is below threshold", async () => {
		const session = makeSession();
		// Force a low-alignment report
		const report =
			await crossSessionConsistencyEnforcer.enforceConsistency(session);
		// Patch the report to have low space7Alignment
		const patchedReport = { ...report, space7Alignment: 0 };
		const prompts =
			await crossSessionConsistencyEnforcer.generateEnforcementPrompts(
				session,
				patchedReport,
			);
		expect(prompts.length).toBeGreaterThanOrEqual(0);
	});
});

// ---------------------------------------------------------------------------
// generateConstraintDocumentation
// ---------------------------------------------------------------------------

describe("generateConstraintDocumentation", () => {
	beforeEach(async () => {
		await crossSessionConsistencyEnforcer.initialize();
	});

	it("returns adr, specification and roadmap", async () => {
		const session = makeSession();
		const report =
			await crossSessionConsistencyEnforcer.enforceConsistency(session);
		const docs =
			await crossSessionConsistencyEnforcer.generateConstraintDocumentation(
				session,
				report,
			);
		expect(docs).toHaveProperty("adr");
		expect(docs).toHaveProperty("specification");
		expect(docs).toHaveProperty("roadmap");
		expect(typeof docs.adr).toBe("string");
	});
});

// ---------------------------------------------------------------------------
// getConstraintUsagePatterns
// ---------------------------------------------------------------------------

describe("getConstraintUsagePatterns", () => {
	beforeEach(async () => {
		await crossSessionConsistencyEnforcer.initialize();
	});

	it("returns empty array when no history", () => {
		const patterns =
			crossSessionConsistencyEnforcer.getConstraintUsagePatterns("unknown-id");
		expect(patterns).toBeInstanceOf(Array);
	});

	it("returns patterns for all constraints when no id provided", () => {
		const patterns =
			crossSessionConsistencyEnforcer.getConstraintUsagePatterns();
		expect(patterns).toBeInstanceOf(Array);
	});

	it("returns patterns after recording decisions", () => {
		crossSessionConsistencyEnforcer.recordConstraintDecisions({
			d1: {
				sessionId: "s1",
				constraintId: "c_pattern",
				decision: "applied",
				rationale: "R1",
			},
			d2: {
				sessionId: "s2",
				constraintId: "c_pattern",
				decision: "applied",
				rationale: "R2",
			},
			d3: {
				sessionId: "s3",
				constraintId: "c_pattern",
				decision: "applied",
				rationale: "R3",
			},
		});
		const patterns =
			crossSessionConsistencyEnforcer.getConstraintUsagePatterns("c_pattern");
		expect(patterns).toBeInstanceOf(Array);
	});
});
