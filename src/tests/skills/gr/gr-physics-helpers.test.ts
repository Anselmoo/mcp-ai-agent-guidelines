// src/tests/skills/gr/gr-physics-helpers.test.ts
import { describe, expect, it } from "vitest";
import {
	classifyCurvature,
	classifyEntropy,
	classifySchwarzschildZone,
	classifyTidal,
	curvatureScore,
	entropyRatio,
	extractNumbers,
	fmtNum,
	hawkingEntropy,
	schwarzschildRadius,
	tidalForce,
	timeDilationFactor,
} from "../../../skills/gr/gr-physics-helpers.js";

// ── fmtNum ────────────────────────────────────────────────────────────────────

describe("fmtNum", () => {
	it("formats finite numbers to 3 significant figures", () => {
		expect(fmtNum(Math.PI)).toBe("3.14");
		expect(fmtNum(1000)).toBe("1000");
	});

	it("returns '∞' for non-finite values", () => {
		expect(fmtNum(Infinity)).toBe("∞");
		expect(fmtNum(NaN)).toBe("∞");
	});
});

// ── extractNumbers ────────────────────────────────────────────────────────────

describe("extractNumbers", () => {
	it("extracts numeric literals up to default limit of 5", () => {
		expect(extractNumbers("module has 10 exports and 200 lines")).toEqual([
			10, 200,
		]);
	});

	it("respects a custom limit", () => {
		const result = extractNumbers("1 2 3 4 5 6", 3);
		expect(result).toHaveLength(3);
	});

	it("returns empty array when no numbers present", () => {
		expect(extractNumbers("no digits")).toEqual([]);
	});
});

// ── schwarzschildRadius / classifySchwarzschildZone ───────────────────────────

describe("schwarzschildRadius", () => {
	it("returns 2 × couplingMass", () => {
		expect(schwarzschildRadius(5)).toBe(10);
		expect(schwarzschildRadius(0)).toBe(0);
	});
});

describe("classifySchwarzschildZone", () => {
	it("returns 'inside_horizon' when r ≤ r_s", () => {
		expect(classifySchwarzschildZone(4, 5)).toBe("inside_horizon");
		expect(classifySchwarzschildZone(5, 5)).toBe("inside_horizon");
	});

	it("returns 'near_horizon' when r_s < r ≤ 1.5 × r_s", () => {
		expect(classifySchwarzschildZone(6, 5)).toBe("near_horizon");
		expect(classifySchwarzschildZone(7.5, 5)).toBe("near_horizon");
	});

	it("returns 'orbital' when 1.5 × r_s < r ≤ 3 × r_s", () => {
		expect(classifySchwarzschildZone(12, 5)).toBe("orbital");
	});

	it("returns 'free_space' when r > 3 × r_s", () => {
		expect(classifySchwarzschildZone(20, 5)).toBe("free_space");
	});
});

// ── timeDilationFactor ────────────────────────────────────────────────────────

describe("timeDilationFactor", () => {
	it("returns > 1 when r is close to r_s (development slowdown)", () => {
		const factor = timeDilationFactor(6, 5);
		expect(factor).toBeGreaterThan(1);
	});

	it("approaches 1 for large r relative to r_s", () => {
		const factor = timeDilationFactor(1_000_000, 1);
		expect(factor).toBeCloseTo(1, 3);
	});

	it("does not blow up at the horizon (clamped)", () => {
		const factor = timeDilationFactor(5, 5);
		expect(Number.isFinite(factor)).toBe(true);
	});
});

// ── curvatureScore / classifyCurvature ────────────────────────────────────────

describe("curvatureScore", () => {
	it("increases with higher coupling and complexity", () => {
		const low = curvatureScore(1, 1, 1);
		const high = curvatureScore(5, 5, 1);
		expect(high).toBeGreaterThan(low);
	});

	it("decreases as cohesion increases", () => {
		const lowCohesion = curvatureScore(3, 3, 0.1);
		const highCohesion = curvatureScore(3, 3, 10);
		expect(highCohesion).toBeLessThan(lowCohesion);
	});
});

describe("classifyCurvature", () => {
	it("classifies K > 10 as extreme", () => {
		expect(classifyCurvature(15)).toBe("extreme");
	});

	it("classifies K in (5, 10] as high", () => {
		expect(classifyCurvature(7)).toBe("high");
	});

	it("classifies K in (2, 5] as moderate", () => {
		expect(classifyCurvature(3)).toBe("moderate");
	});

	it("classifies K ≤ 2 as flat", () => {
		expect(classifyCurvature(1)).toBe("flat");
	});
});

// ── tidalForce / classifyTidal ────────────────────────────────────────────────

describe("tidalForce", () => {
	it("returns 0 when max and min coupling are equal", () => {
		expect(tidalForce(5, 5, 0.5)).toBeCloseTo(0);
	});

	it("increases with larger coupling differential", () => {
		const small = tidalForce(3, 2, 0.5);
		const large = tidalForce(10, 1, 0.5);
		expect(large).toBeGreaterThan(small);
	});
});

describe("classifyTidal", () => {
	it("classifies F > 5 as split_required", () => {
		expect(classifyTidal(6)).toBe("split_required");
	});

	it("classifies F in (2, 5] as high_tension", () => {
		expect(classifyTidal(3)).toBe("high_tension");
	});

	it("classifies F ≤ 2 as stable", () => {
		expect(classifyTidal(1)).toBe("stable");
	});
});

// ── hawkingEntropy / entropyRatio / classifyEntropy ──────────────────────────

describe("hawkingEntropy", () => {
	it("returns publicExports / 4", () => {
		expect(hawkingEntropy(20)).toBeCloseTo(5);
		expect(hawkingEntropy(0)).toBe(0);
	});
});

describe("entropyRatio", () => {
	it("returns entropy / (internalLines / 100 + 1)", () => {
		// 5 / (100/100 + 1) = 5 / 2 = 2.5
		expect(entropyRatio(5, 100)).toBeCloseTo(2.5);
	});
});

describe("classifyEntropy", () => {
	it("classifies ratio > 2 as critical (over-exposed)", () => {
		expect(classifyEntropy(3)).toBe("critical");
	});

	it("classifies ratio in (1, 2] as elevated", () => {
		expect(classifyEntropy(1.5)).toBe("elevated");
	});

	it("classifies ratio ≤ 1 as healthy", () => {
		expect(classifyEntropy(0.8)).toBe("healthy");
	});
});
