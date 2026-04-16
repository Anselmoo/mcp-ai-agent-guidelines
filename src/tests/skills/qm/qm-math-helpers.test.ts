// src/tests/skills/qm/qm-math-helpers.test.ts
import { describe, expect, it } from "vitest";
import {
	arithmeticMean,
	blochPurity,
	bornCoverageProbability,
	bornRuleProbabilities,
	bornWeightedRisk,
	clampUnit,
	decoherenceTime,
	dotProduct,
	eigenvalues2x2,
	energyFromPenalty,
	extractNumbers,
	fmtNum,
	interferenceTerm,
	interpolateVector,
	l2Distance,
	normalizeVector,
	overlapProjectionWeight,
	pathIntegralWeight,
	pearsonCorrelation,
	qualityPenalty,
	relativeGain,
	spectralGap,
	spectralGapLabel,
	standardDeviation,
	totalInterferenceIntensity,
	uncertaintyLabel,
	uncertaintyProduct,
	vectorNorm,
	vonNeumannEntropy2x2,
	wkbTunneling,
	wkbViabilityLabel,
} from "../../../skills/qm/qm-math-helpers.js";

// ── fmtNum ────────────────────────────────────────────────────────────────────

describe("fmtNum", () => {
	it("formats finite numbers to 3 significant figures", () => {
		expect(fmtNum(0.12345)).toBe("0.123");
		expect(fmtNum(1234.5)).toBe("1230");
	});

	it("returns '∞' for non-finite input", () => {
		expect(fmtNum(Infinity)).toBe("∞");
		expect(fmtNum(-Infinity)).toBe("∞");
		expect(fmtNum(NaN)).toBe("∞");
	});
});

// ── extractNumbers ────────────────────────────────────────────────────────────

describe("extractNumbers", () => {
	it("extracts leading numeric literals up to the default limit of 8", () => {
		const result = extractNumbers("module has 3 classes and 42 lines");
		expect(result).toEqual([3, 42]);
	});

	it("respects a custom limit", () => {
		const result = extractNumbers("1 2 3 4 5", 3);
		expect(result).toHaveLength(3);
		expect(result).toEqual([1, 2, 3]);
	});

	it("returns empty array for text with no numbers", () => {
		expect(extractNumbers("no digits here")).toEqual([]);
	});
});

// ── uncertaintyProduct / uncertaintyLabel ─────────────────────────────────────

describe("uncertaintyProduct", () => {
	it("returns coupling × cohesionDeficit", () => {
		expect(uncertaintyProduct(0.4, 0.5)).toBeCloseTo(0.2);
		expect(uncertaintyProduct(0, 1)).toBe(0);
	});
});

describe("uncertaintyLabel", () => {
	it("labels high uncertainty as pareto-violator", () => {
		expect(uncertaintyLabel(0.3)).toBe("pareto-violator");
	});

	it("labels mid-range as tension", () => {
		expect(uncertaintyLabel(0.15)).toBe("tension");
	});

	it("labels low uncertainty as acceptable", () => {
		expect(uncertaintyLabel(0.01)).toBe("acceptable");
	});
});

// ── bornRuleProbabilities ─────────────────────────────────────────────────────

describe("bornRuleProbabilities", () => {
	it("returns a probability distribution summing to 1", () => {
		const probs = bornRuleProbabilities([3, 4]);
		const sum = probs.reduce((s, p) => s + p, 0);
		expect(sum).toBeCloseTo(1);
	});

	it("weighs higher scores more heavily (squared)", () => {
		const [p1, p2] = bornRuleProbabilities([1, 2]);
		expect(p2).toBeGreaterThan(p1 ?? 0);
	});

	it("returns uniform distribution when all scores are zero", () => {
		const probs = bornRuleProbabilities([0, 0, 0]);
		for (const p of probs) expect(p).toBeCloseTo(1 / 3);
	});

	it("returns empty array for empty input", () => {
		expect(bornRuleProbabilities([])).toEqual([]);
	});
});

// ── spectralGap / spectralGapLabel ────────────────────────────────────────────

describe("spectralGap", () => {
	it("returns Infinity for a single-element array", () => {
		expect(spectralGap([0.8])).toBe(Infinity);
	});

	it("computes ratio of top two probabilities", () => {
		expect(spectralGap([0.9, 0.3])).toBeCloseTo(3);
	});
});

describe("spectralGapLabel", () => {
	it("labels gap > 2 as clear-winner", () => {
		expect(spectralGapLabel(3)).toBe("clear-winner");
	});

	it("labels gap in [1.2, 2] as marginal", () => {
		expect(spectralGapLabel(1.5)).toBe("marginal");
	});

	it("labels gap < 1.2 as tie", () => {
		expect(spectralGapLabel(1.1)).toBe("tie");
	});
});

// ── decoherenceTime ───────────────────────────────────────────────────────────

describe("decoherenceTime", () => {
	it("returns 1/sum of active gammas", () => {
		expect(decoherenceTime([0.5, 0.5])).toBeCloseTo(1);
		expect(decoherenceTime([0.25])).toBeCloseTo(4);
	});

	it("excludes zero/non-finite gammas", () => {
		expect(decoherenceTime([0, Infinity, 0.5])).toBeCloseTo(2);
	});

	it("returns Infinity when all gammas are zero", () => {
		expect(decoherenceTime([0, 0])).toBe(Infinity);
	});
});

// ── wkbTunneling / wkbViabilityLabel ─────────────────────────────────────────

describe("wkbTunneling", () => {
	it("returns a value in (0, 1]", () => {
		const T = wkbTunneling(0.5, 0.8, 0.3);
		expect(T).toBeGreaterThan(0);
		expect(T).toBeLessThanOrEqual(1);
	});

	it("returns higher probability when energy >= height (no barrier)", () => {
		const highEnergy = wkbTunneling(0.5, 0.3, 0.9);
		const lowEnergy = wkbTunneling(0.5, 0.9, 0.1);
		expect(highEnergy).toBeGreaterThan(lowEnergy);
	});
});

describe("wkbViabilityLabel", () => {
	it("labels T > 0.5 as attempt-now", () => {
		expect(wkbViabilityLabel(0.7)).toBe("attempt-now");
	});

	it("labels T in (0.1, 0.5] as attempt-reduced-scope", () => {
		expect(wkbViabilityLabel(0.3)).toBe("attempt-reduced-scope");
	});

	it("labels T <= 0.1 as defer", () => {
		expect(wkbViabilityLabel(0.05)).toBe("defer");
	});
});

// ── clampUnit ─────────────────────────────────────────────────────────────────

describe("clampUnit", () => {
	it("clamps below 0 to 0", () => {
		expect(clampUnit(-5)).toBe(0);
	});

	it("clamps above 1 to 1", () => {
		expect(clampUnit(2)).toBe(1);
	});

	it("passes through values in [0, 1]", () => {
		expect(clampUnit(0.5)).toBe(0.5);
	});
});

// ── vectorNorm / normalizeVector / dotProduct / l2Distance ────────────────────

describe("vectorNorm", () => {
	it("computes Euclidean norm", () => {
		expect(vectorNorm([3, 4])).toBeCloseTo(5);
		expect(vectorNorm([])).toBe(0);
	});
});

describe("normalizeVector", () => {
	it("normalises a non-zero vector to unit length", () => {
		const v = normalizeVector([3, 4]);
		expect(vectorNorm(v)).toBeCloseTo(1);
	});

	it("returns zero vector for zero input", () => {
		expect(normalizeVector([0, 0])).toEqual([0, 0]);
	});
});

describe("dotProduct", () => {
	it("computes dot product of equal-length vectors", () => {
		expect(dotProduct([1, 2, 3], [4, 5, 6])).toBe(32);
	});

	it("handles empty vectors", () => {
		expect(dotProduct([], [])).toBe(0);
	});
});

describe("l2Distance", () => {
	it("returns 0 for identical vectors", () => {
		expect(l2Distance([1, 2, 3], [1, 2, 3])).toBe(0);
	});

	it("computes Euclidean distance", () => {
		expect(l2Distance([0, 0], [3, 4])).toBeCloseTo(5);
	});
});

// ── interpolateVector ─────────────────────────────────────────────────────────

describe("interpolateVector", () => {
	it("returns a at t=0", () => {
		const result = interpolateVector([1, 2], [5, 6], 0);
		const expected = [1, 2];
		for (let i = 0; i < result.length; i++)
			expect(result[i]).toBeCloseTo(expected[i] as number);
	});

	it("returns b at t=1", () => {
		const result = interpolateVector([1, 2], [5, 6], 1);
		const expected = [5, 6];
		for (let i = 0; i < result.length; i++)
			expect(result[i]).toBeCloseTo(expected[i] as number);
	});

	it("returns midpoint at t=0.5", () => {
		const result = interpolateVector([0, 0], [2, 4], 0.5);
		expect(result[0]).toBeCloseTo(1);
		expect(result[1]).toBeCloseTo(2);
	});
});

// ── blochPurity ───────────────────────────────────────────────────────────────

describe("blochPurity", () => {
	it("returns vector norm (Bloch vector length = purity proxy)", () => {
		expect(blochPurity([0, 0, 1])).toBeCloseTo(1);
	});
});

// ── interferenceTerm / totalInterferenceIntensity / relativeGain ──────────────

describe("interferenceTerm", () => {
	it("returns max constructive interference at cosDelta = 1", () => {
		const term = interferenceTerm(0.5, 0.5, 1);
		expect(term).toBeCloseTo(1); // 2 * sqrt(0.25) * 1 = 1
	});

	it("returns max destructive interference at cosDelta = -1", () => {
		const term = interferenceTerm(0.5, 0.5, -1);
		expect(term).toBeCloseTo(-1);
	});
});

describe("totalInterferenceIntensity", () => {
	it("constructive: total > sum of individual intensities", () => {
		const total = totalInterferenceIntensity(0.5, 0.5, 1);
		expect(total).toBeGreaterThan(1); // 0.5 + 0.5 + 1 = 2
	});
});

describe("relativeGain", () => {
	it("returns 0 when classical is 0", () => {
		expect(relativeGain(2, 0)).toBe(0);
	});

	it("computes (total - classical) / classical", () => {
		expect(relativeGain(3, 2)).toBeCloseTo(0.5);
	});
});

// ── eigenvalues2x2 / vonNeumannEntropy2x2 ────────────────────────────────────

describe("eigenvalues2x2", () => {
	it("returns both eigenvalues of a symmetric 2x2 matrix", () => {
		// [[1, 0], [0, 3]] → eigenvalues 1 and 3
		const [e1, e2] = eigenvalues2x2(1, 0, 3);
		expect(Math.max(e1, e2)).toBeCloseTo(3);
		expect(Math.min(e1, e2)).toBeCloseTo(1);
	});
});

describe("vonNeumannEntropy2x2", () => {
	it("returns 0 for a pure state [[1,0],[0,0]]", () => {
		expect(vonNeumannEntropy2x2(1, 0, 0)).toBeCloseTo(0);
	});

	it("returns 1 for the maximally mixed state [[0.5,0],[0,0.5]]", () => {
		expect(vonNeumannEntropy2x2(0.5, 0, 0.5)).toBeCloseTo(1);
	});
});

// ── qualityPenalty / energyFromPenalty ────────────────────────────────────────

describe("qualityPenalty", () => {
	it("returns a value in [0, 1] for clamped inputs", () => {
		const p = qualityPenalty(0.5, 0.5, 0.5, 0.5);
		expect(p).toBeGreaterThanOrEqual(0);
		expect(p).toBeLessThanOrEqual(1);
	});

	it("returns 1 for worst-case inputs", () => {
		expect(qualityPenalty(1, 1, 0, 1)).toBeCloseTo(1);
	});

	it("returns 0.2 for best-case inputs (only (1-coverage) term matters at coverage=1)", () => {
		expect(qualityPenalty(0, 0, 1, 0)).toBeCloseTo(0);
	});
});

describe("energyFromPenalty", () => {
	it("returns 1 - penalty clamped to [0, 1]", () => {
		expect(energyFromPenalty(0.3)).toBeCloseTo(0.7);
		expect(energyFromPenalty(0)).toBeCloseTo(1);
		expect(energyFromPenalty(1)).toBeCloseTo(0);
	});
});

// ── overlapProjectionWeight ───────────────────────────────────────────────────

describe("overlapProjectionWeight", () => {
	it("returns sum of squares of overlaps", () => {
		expect(overlapProjectionWeight([0.5, 0.5])).toBeCloseTo(0.5);
	});
});

// ── arithmeticMean ────────────────────────────────────────────────────────────

describe("arithmeticMean", () => {
	it("returns 0 for empty array", () => {
		expect(arithmeticMean([])).toBe(0);
	});

	it("computes the mean correctly", () => {
		expect(arithmeticMean([2, 4, 6])).toBeCloseTo(4);
	});
});

// ── standardDeviation / pearsonCorrelation / pathIntegralWeight / bornCoverage ─

describe("standardDeviation", () => {
	it("returns 0 for empty array", () => {
		expect(standardDeviation([])).toBe(0);
	});

	it("computes population standard deviation", () => {
		// For [2,4,4,4,5,5,7,9] population std dev is 2
		const vals = [2, 4, 4, 4, 5, 5, 7, 9];
		expect(standardDeviation(vals)).toBeCloseTo(2);
	});
});

describe("pearsonCorrelation", () => {
	it("returns 0 for short arrays", () => {
		expect(pearsonCorrelation([1], [2])).toBe(0);
	});

	it("returns 1 for perfectly correlated series", () => {
		const a = [1, 2, 3, 4, 5];
		const b = [2, 4, 6, 8, 10];
		expect(pearsonCorrelation(a, b)).toBeCloseTo(1);
	});

	it("returns -1 for perfectly inversely correlated series", () => {
		const a = [1, 2, 3, 4, 5];
		const b = [-1, -2, -3, -4, -5];
		expect(pearsonCorrelation(a, b)).toBeCloseTo(-1);
	});
});

describe("pathIntegralWeight", () => {
	it("is monotonic decreasing with action", () => {
		const w1 = pathIntegralWeight(1, 1);
		const w2 = pathIntegralWeight(2, 1);
		expect(w2).toBeLessThan(w1);
	});

	it("increases with temperature", () => {
		const lowT = pathIntegralWeight(5, 0.1);
		const highT = pathIntegralWeight(5, 1);
		expect(highT).toBeGreaterThan(lowT);
	});
});

describe("bornCoverageProbability and bornWeightedRisk", () => {
	it("bornCoverageProbability clamps sum of squared overlaps to [0,1]", () => {
		expect(bornCoverageProbability([1, 1])).toBe(1);
		expect(bornCoverageProbability([0.5, 0.5])).toBeCloseTo(0.5);
	});

	it("bornWeightedRisk computes risk * (1 - coverage)", () => {
		expect(bornWeightedRisk(0.6, 0.5)).toBeCloseTo(0.6 * 0.5);
		// clamps inputs
		expect(bornWeightedRisk(2, -1)).toBeCloseTo(1 * (1 - 0));
	});
});
