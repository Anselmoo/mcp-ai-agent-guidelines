import { describe, expect, it } from "vitest";
import { methodologySelector } from "../../../src/tools/design/methodology-selector";
import { pivotModule } from "../../../src/tools/design/pivot-module";
import { roadmapGenerator } from "../../../src/tools/design/roadmap-generator";

describe("Design SRC smoke tests", () => {
	it("methodology selector basic usage", async () => {
		const res = await methodologySelector.selectMethodology({
			projectType: "new-application",
		} as any);
		expect(res).toBeDefined();
		expect(res.methodology).toBeDefined();
	});

	it("pivot module returns suggested pivots", async () => {
		const out = await pivotModule.generateRecommendations({
			config: { context: "test", goal: "g" },
		} as any);
		expect(Array.isArray(out)).toBe(true);
	});

	it("roadmap generator basic call", async () => {
		const sessionState = {
			config: { goal: "MVP", context: "Test" },
			coverage: { overall: 85 },
		} as any;
		const road = await roadmapGenerator.generateRoadmap({
			sessionState,
			title: "MVP",
		} as any);
		expect(road).toBeTruthy();
	});
});
