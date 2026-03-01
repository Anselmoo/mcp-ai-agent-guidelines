import { describe, expect, it } from "vitest";
import { generatePlan } from "../../../../../src/domain/speckit/generators/plan-generator.js";
import { createInitialSessionState } from "../../../../../src/domain/speckit/types.js";

describe("generatePlan", () => {
	it("should generate a plan with dynamic timeline start date", () => {
		const state = createInitialSessionState({
			title: "Plan Test",
			overview: "Overview",
			objectives: [{ description: "Obj 1", priority: "high" }],
			requirements: [
				{ description: "Req 1", type: "functional", priority: "high" },
			],
			acceptanceCriteria: [],
			outOfScope: [],
			validateAgainstConstitution: false,
		});

		const result = generatePlan(state);
		const today = new Date().toISOString().split("T")[0];

		expect(result.title).toBe("plan.md");
		expect(result.content).toContain("## Timeline");
		expect(result.content).toContain(today);
		expect(result.content).not.toContain("2026-01-01");
	});
});
