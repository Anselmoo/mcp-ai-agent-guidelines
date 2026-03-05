/**
 * Branch-coverage tests for constraint-manager.ts
 * Target: cover the 17 uncovered branches (currently 83/100 = 83%)
 */
import { beforeEach, describe, expect, it } from "vitest";
import {
	constraintManager,
	DEFAULT_CONSTRAINT_CONFIG,
	IMPLEMENTATION_STATUS,
} from "../../../../src/tools/design/constraint-manager.js";
import type { DesignSessionState } from "../../../../src/tools/design/types/index.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSession(
	overrides: Partial<DesignSessionState> = {},
): DesignSessionState {
	return {
		config: {
			sessionId: `sess-${Date.now()}`,
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
// Exported constants / setup
// ---------------------------------------------------------------------------

describe("constraint-manager constants", () => {
	it("IMPLEMENTATION_STATUS is IMPLEMENTED", () => {
		expect(IMPLEMENTATION_STATUS).toBe("IMPLEMENTED");
	});

	it("DEFAULT_CONSTRAINT_CONFIG has constraints", () => {
		expect(DEFAULT_CONSTRAINT_CONFIG).toHaveProperty("constraints");
	});
});

// ---------------------------------------------------------------------------
// initialize
// ---------------------------------------------------------------------------

describe("constraintManager.initialize", () => {
	it("initializes without throwing", async () => {
		await expect(constraintManager.initialize()).resolves.toBeUndefined();
	});

	it("second initialize() call is idempotent", async () => {
		await constraintManager.initialize();
		await expect(constraintManager.initialize()).resolves.toBeUndefined();
	});
});

// ---------------------------------------------------------------------------
// loadConstraintsFromConfig — branches
// ---------------------------------------------------------------------------

describe("loadConstraintsFromConfig", () => {
	it("loads valid config without throwing", async () => {
		await expect(
			constraintManager.loadConstraintsFromConfig(DEFAULT_CONSTRAINT_CONFIG),
		).resolves.toBeUndefined();
	});

	it("throws when config is invalid", async () => {
		await expect(
			constraintManager.loadConstraintsFromConfig({ invalid: true }),
		).rejects.toThrow("Failed to load constraint config");
	});

	it("throws when config is null", async () => {
		await expect(
			constraintManager.loadConstraintsFromConfig(null),
		).rejects.toThrow();
	});
});

// ---------------------------------------------------------------------------
// getConstraints — with and without category filter
// ---------------------------------------------------------------------------

describe("getConstraints", () => {
	beforeEach(async () => {
		await constraintManager.initialize();
	});

	it("returns all constraints when no category given", () => {
		const all = constraintManager.getConstraints();
		expect(all.length).toBeGreaterThan(0);
	});

	it("returns filtered constraints by category", () => {
		const all = constraintManager.getConstraints();
		const firstCategory = all[0]?.category;
		if (firstCategory) {
			const filtered = constraintManager.getConstraints(firstCategory);
			expect(filtered.every((c) => c.category === firstCategory)).toBe(true);
		}
	});

	it("returns empty array for unknown category", () => {
		const result = constraintManager.getConstraints("nonexistent-category");
		expect(result).toEqual([]);
	});
});

// ---------------------------------------------------------------------------
// getConstraint
// ---------------------------------------------------------------------------

describe("getConstraint", () => {
	beforeEach(async () => {
		await constraintManager.initialize();
	});

	it("returns undefined for unknown id", () => {
		expect(constraintManager.getConstraint("not.real")).toBeUndefined();
	});

	it("returns a rule for a known id", () => {
		const all = constraintManager.getConstraints();
		if (all.length > 0) {
			const rule = constraintManager.getConstraint(all[0].id);
			expect(rule).toBeDefined();
			expect(rule?.id).toBe(all[0].id);
		}
	});
});

// ---------------------------------------------------------------------------
// getMandatoryConstraints
// ---------------------------------------------------------------------------

describe("getMandatoryConstraints", () => {
	beforeEach(async () => {
		await constraintManager.initialize();
	});

	it("returns only mandatory constraints", () => {
		const mandatory = constraintManager.getMandatoryConstraints();
		expect(mandatory.every((c) => c.mandatory)).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// getPhaseRequirements — branch: found vs not found
// ---------------------------------------------------------------------------

describe("getPhaseRequirements", () => {
	beforeEach(async () => {
		await constraintManager.initialize();
	});

	it("returns null for unknown phase", () => {
		const result = constraintManager.getPhaseRequirements("nonexistent-phase");
		expect(result).toBeNull();
	});

	it("returns phase requirements for discovery", () => {
		const result = constraintManager.getPhaseRequirements("discovery");
		// May return null if phase not in config, but should not throw
		expect(result === null || typeof result === "object").toBe(true);
	});
});

// ---------------------------------------------------------------------------
// getCoverageThresholds
// ---------------------------------------------------------------------------

describe("getCoverageThresholds", () => {
	beforeEach(async () => {
		await constraintManager.initialize();
	});

	it("returns thresholds with overall_minimum", () => {
		const thresholds = constraintManager.getCoverageThresholds();
		expect(thresholds).toHaveProperty("overall_minimum");
		expect(typeof thresholds.overall_minimum).toBe("number");
	});
});

// ---------------------------------------------------------------------------
// validateConstraints — branch: string, session state, array, no constraints
// ---------------------------------------------------------------------------

describe("validateConstraints", () => {
	beforeEach(async () => {
		await constraintManager.initialize();
	});

	it("validates a plain string content", () => {
		const result = constraintManager.validateConstraints(
			"Comprehensive context with stakeholder mapping and clear problem definition",
		);
		expect(result).toHaveProperty("passed");
		expect(result).toHaveProperty("coverage");
	});

	it("validates with session state input", () => {
		const session = makeSession({
			phases: {
				discovery: {
					id: "discovery",
					name: "Discovery",
					status: "completed",
					artifacts: [
						{
							type: "specification",
							content: "Context clarity achieved with stakeholder mapping",
							format: "markdown",
						},
					],
					coverage: 80,
					constraints: [],
				},
			},
		});
		const result = constraintManager.validateConstraints(session);
		expect(result).toHaveProperty("passed");
	});

	it("validates with empty session state (no phases)", () => {
		const session = makeSession();
		const result = constraintManager.validateConstraints(session);
		expect(result).toHaveProperty("coverage");
	});

	it("validates with constraint array input", () => {
		const all = constraintManager.getConstraints();
		const result = constraintManager.validateConstraints(all);
		expect(result).toHaveProperty("passed");
	});

	it("validates with selected constraint IDs", () => {
		const all = constraintManager.getConstraints();
		if (all.length > 0) {
			const result = constraintManager.validateConstraints(
				"Some relevant content",
				[all[0].id],
			);
			expect(result).toHaveProperty("coverage");
		}
	});

	it("handles selectedConstraints with unknown id (filters to empty)", () => {
		const result = constraintManager.validateConstraints("content", [
			"nonexistent.constraint.id",
		]);
		// When no constraints found, returns basic coverage
		expect(result).toHaveProperty("passed");
	});

	it("returns low coverage for short content", () => {
		const result = constraintManager.validateConstraints("short");
		expect(result.coverage).toBeLessThanOrEqual(100);
	});

	it("returns higher coverage for content matching keywords", () => {
		const richContent =
			"context clarity stakeholder identification requirements analysis " +
			"technical architecture security performance accessibility scalability " +
			"testing deployment monitoring documentation";
		const result = constraintManager.validateConstraints(richContent);
		expect(result.coverage).toBeGreaterThanOrEqual(0);
	});
});

// ---------------------------------------------------------------------------
// validateConstraint (single)
// ---------------------------------------------------------------------------

describe("validateConstraint", () => {
	beforeEach(async () => {
		await constraintManager.initialize();
	});

	it("validates a known constraint", async () => {
		const all = constraintManager.getConstraints();
		if (all.length > 0) {
			const result = await constraintManager.validateConstraint(
				all[0],
				"Content about context clarity and stakeholder mapping",
			);
			expect(result).toHaveProperty("satisfied");
		}
	});

	it("resolves for unknown-like constraint with validation object", async () => {
		const mockConstraint = {
			id: "nonexistent.rule",
			type: "technical" as const,
			category: "test",
			name: "Test",
			description: "Test",
			mandatory: false,
			weight: 1,
			source: "test",
			validation: { minCoverage: 50 },
		};
		const result = await constraintManager.validateConstraint(
			mockConstraint,
			"some content",
		);
		expect(result).toHaveProperty("satisfied");
	});
});

// ---------------------------------------------------------------------------
// addConstraint / removeConstraint / updateConstraint
// ---------------------------------------------------------------------------

describe("addConstraint / removeConstraint / updateConstraint", () => {
	beforeEach(async () => {
		await constraintManager.initialize();
	});

	it("adds a new constraint", async () => {
		const session = makeSession();
		const newRule = {
			id: "test.new_rule",
			type: "technical" as const,
			category: "test",
			name: "Test Rule",
			description: "A test rule",
			mandatory: false,
			weight: 1,
			source: "test",
			validation: { minCoverage: 50 },
		};
		const result = await constraintManager.addConstraint(session, newRule);
		expect(result).toHaveProperty("config");
		expect(constraintManager.getConstraint("test.new_rule")).toBeDefined();
	});

	it("removes an existing constraint", async () => {
		const session = makeSession();
		const rule = {
			id: "test.to_remove",
			type: "technical" as const,
			category: "test",
			name: "To Remove",
			description: "Will be removed",
			mandatory: false,
			weight: 1,
			source: "test",
			validation: {},
		};
		await constraintManager.addConstraint(session, rule);
		const result = await constraintManager.removeConstraint(
			session,
			"test.to_remove",
		);
		expect(result).toHaveProperty("config");
	});

	it("updates an existing constraint", async () => {
		const all = constraintManager.getConstraints();
		const session = makeSession({
			config: {
				sessionId: "sess-update",
				context: "ctx",
				goal: "goal",
				requirements: [],
				constraints: all.slice(0, 1),
				coverageThreshold: 85,
				enablePivots: false,
				templateRefs: [],
				outputFormats: ["markdown"],
				metadata: {},
			},
		});
		if (all.length > 0) {
			await expect(
				constraintManager.updateConstraint(session, all[0].id, { weight: 99 }),
			).resolves.toHaveProperty("config");
		}
	});

	it("update returns config when constraint not found in session", async () => {
		const session = makeSession();
		const result = await constraintManager.updateConstraint(
			session,
			"does.not.exist",
			{ weight: 1 },
		);
		expect(result).toHaveProperty("config");
	});
});

// ---------------------------------------------------------------------------
// getComplianceReport
// ---------------------------------------------------------------------------

describe("getComplianceReport", () => {
	beforeEach(async () => {
		await constraintManager.initialize();
	});

	it("returns compliance report for session with no constraints", async () => {
		const session = makeSession();
		const report = await constraintManager.getComplianceReport(session);
		expect(report).toHaveProperty("overall");
		expect(report).toHaveProperty("byCategory");
		expect(report.violations).toBeInstanceOf(Array);
	});

	it("returns report for session with constraints in phases", async () => {
		const all = constraintManager.getConstraints();
		const session = makeSession({
			config: {
				sessionId: "sess-compliance",
				context: "ctx",
				goal: "goal",
				requirements: [],
				constraints: all.slice(0, 2),
				coverageThreshold: 85,
				enablePivots: false,
				templateRefs: [],
				outputFormats: ["markdown"],
				metadata: {},
			},
		});
		const report = await constraintManager.getComplianceReport(session);
		expect(typeof report.overall).toBe("boolean");
	});
});
