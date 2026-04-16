// src/tests/qm-math-helpers.extra.test.ts
import { describe, expect, it } from "vitest";
import {
	bornCoverageProbability,
	bornWeightedRisk,
	pathIntegralWeight,
	pearsonCorrelation,
	standardDeviation,
} from "../skills/qm/qm-math-helpers.js";

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
