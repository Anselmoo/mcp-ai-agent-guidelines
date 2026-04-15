/**
 * model-routing.test.ts  — W2 #74
 *
 * Structural contract tests for src/contracts/model-routing.ts.
 * Verifies shape invariants, type guards, and discriminant coverage.
 */

import { describe, expect, it } from "vitest";
import type {
	LaneExecutionRecord,
	ModelRoutingDecision,
	ModelRoutingResult,
	PatternExecutionResult,
} from "../../contracts/model-routing.js";
import {
	isDirectResult,
	isLaneExecutionRecord,
	isPatternResult,
} from "../../contracts/model-routing.js";
import type { ModelProfile } from "../../contracts/runtime.js";

// ─── Fixture helpers ──────────────────────────────────────────────────────────

const FREE_PROFILE: ModelProfile = {
	id: "gpt-5.1-mini",
	label: "GPT-5.1-mini",
	modelClass: "free",
	strengths: ["speed"],
	maxContextWindow: "medium",
	costTier: "free",
};

function makeDecision(
	overrides: Partial<ModelRoutingDecision> = {},
): ModelRoutingDecision {
	return {
		selectedModelId: "gpt-5.1-mini",
		selectedProfile: FREE_PROFILE,
		rationale: "free tier sufficient for this task",
		...overrides,
	};
}

function makeLane(
	overrides: Partial<LaneExecutionRecord> = {},
): LaneExecutionRecord {
	return {
		modelId: "gpt-5.1-mini",
		output: "Draft response",
		latencyMs: 80,
		...overrides,
	};
}

function makePatternResult(
	overrides: Partial<PatternExecutionResult> = {},
): PatternExecutionResult {
	return {
		finalOutput: "Synthesised output",
		lanes: [makeLane(), makeLane({ modelId: "gpt-4.1" })],
		patternName: "tripleParallelSynthesis",
		...overrides,
	};
}

function makeRoutingResult(
	overrides: Partial<ModelRoutingResult> = {},
): ModelRoutingResult {
	return {
		decision: makeDecision(),
		totalDurationMs: 300,
		...overrides,
	};
}

// ─── ModelRoutingDecision ─────────────────────────────────────────────────────

describe("ModelRoutingDecision — contract shape", () => {
	it("has required selectedModelId, selectedProfile, and rationale", () => {
		const d = makeDecision();
		expect(d.selectedModelId).toBe("gpt-5.1-mini");
		expect(d.selectedProfile.costTier).toBe("free");
		expect(typeof d.rationale).toBe("string");
	});

	it("fallbackModelId is optional and absent by default", () => {
		expect(makeDecision().fallbackModelId).toBeUndefined();
	});

	it("fallbackModelId is present when a substitution occurred", () => {
		const d = makeDecision({ fallbackModelId: "gpt-4.1" });
		expect(d.fallbackModelId).toBe("gpt-4.1");
	});
});

// ─── LaneExecutionRecord ──────────────────────────────────────────────────────

describe("LaneExecutionRecord — contract shape", () => {
	it("has modelId, output, and latencyMs", () => {
		const lane = makeLane();
		expect(typeof lane.modelId).toBe("string");
		expect(typeof lane.output).toBe("string");
		expect(typeof lane.latencyMs).toBe("number");
	});

	it("latencyMs is a non-negative integer", () => {
		expect(makeLane({ latencyMs: 0 }).latencyMs).toBeGreaterThanOrEqual(0);
	});
});

// ─── PatternExecutionResult ───────────────────────────────────────────────────

describe("PatternExecutionResult — contract shape", () => {
	it("covers all five pattern names", () => {
		const names: PatternExecutionResult["patternName"][] = [
			"tripleParallelSynthesis",
			"adversarialCritique",
			"draftReviewChain",
			"majorityVote",
			"cascadeFallback",
		];
		expect(names).toHaveLength(5);
		for (const name of names) {
			const r = makePatternResult({ patternName: name });
			expect(r.patternName).toBe(name);
		}
	});

	it("lanes is a non-empty array of LaneExecutionRecords", () => {
		const r = makePatternResult();
		expect(r.lanes.length).toBeGreaterThan(0);
		for (const lane of r.lanes) {
			expect(isLaneExecutionRecord(lane)).toBe(true);
		}
	});
});

// ─── ModelRoutingResult ───────────────────────────────────────────────────────

describe("ModelRoutingResult — contract shape", () => {
	it("pattern variant carries patternResult", () => {
		const r = makeRoutingResult({ patternResult: makePatternResult() });
		expect(isPatternResult(r)).toBe(true);
		expect(isDirectResult(r)).toBe(false);
	});

	it("direct variant carries directOutput string", () => {
		const r = makeRoutingResult({ directOutput: "Direct model output" });
		expect(isDirectResult(r)).toBe(true);
		expect(isPatternResult(r)).toBe(false);
	});

	it("totalDurationMs is a non-negative number", () => {
		const r = makeRoutingResult({ totalDurationMs: 0 });
		expect(r.totalDurationMs).toBeGreaterThanOrEqual(0);
	});
});

// ─── isLaneExecutionRecord type guard ─────────────────────────────────────────

describe("isLaneExecutionRecord", () => {
	it("returns true for a valid lane record", () => {
		expect(isLaneExecutionRecord(makeLane())).toBe(true);
	});

	it("returns false for null", () => {
		expect(isLaneExecutionRecord(null)).toBe(false);
	});

	it("returns false when modelId is missing", () => {
		const { modelId: _omit, ...noId } = makeLane();
		expect(isLaneExecutionRecord(noId)).toBe(false);
	});

	it("returns false when output is not a string", () => {
		expect(isLaneExecutionRecord({ ...makeLane(), output: 42 })).toBe(false);
	});

	it("returns false when latencyMs is not a number", () => {
		expect(isLaneExecutionRecord({ ...makeLane(), latencyMs: "fast" })).toBe(
			false,
		);
	});
});
