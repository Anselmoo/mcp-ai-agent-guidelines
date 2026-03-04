import { describe, expect, it } from "vitest";
import { generatePlan } from "../../../../../src/domain/speckit/generators/plan-generator.js";
import { createInitialSessionState } from "../../../../../src/domain/speckit/types.js";

const base = {
	overview: "Overview",
	acceptanceCriteria: [],
	outOfScope: [],
	validateAgainstConstitution: false as const,
};

describe("generatePlan", () => {
	it("should generate a plan with dynamic timeline start date", () => {
		const state = createInitialSessionState({
			...base,
			title: "Plan Test",
			objectives: [{ description: "Obj 1", priority: "high" as const }],
			requirements: [
				{
					description: "Req 1",
					type: "functional" as const,
					priority: "high" as const,
				},
			],
		});

		const result = generatePlan(state);
		const today = new Date().toISOString().split("T")[0];

		expect(result.title).toBe("plan.md");
		expect(result.content).toContain("## Timeline");
		expect(result.content).toContain(today);
		expect(result.content).not.toContain("2026-01-01");
	});

	it("should generate Phase 2 section for medium priority objectives", () => {
		const state = createInitialSessionState({
			...base,
			title: "Medium Plan",
			objectives: [
				{ description: "Core feature", priority: "medium" as const },
			],
			requirements: [
				{
					description: "Req",
					type: "functional" as const,
					priority: "medium" as const,
				},
			],
		});

		const result = generatePlan(state);
		expect(result.content).toContain("Phase 2: Core Implementation");
		expect(result.content).toContain("Core feature");
		expect(result.content).not.toContain("Phase 1: Foundation");
	});

	it("should generate Phase 3 section for low priority objectives", () => {
		const state = createInitialSessionState({
			...base,
			title: "Low Plan",
			objectives: [{ description: "Nice to have", priority: "low" as const }],
			requirements: [
				{
					description: "Req",
					type: "functional" as const,
					priority: "low" as const,
				},
			],
		});

		const result = generatePlan(state);
		expect(result.content).toContain("Phase 3: Enhancement");
		expect(result.content).toContain("Nice to have");
		expect(result.content).not.toContain("Phase 1: Foundation");
	});

	it("should generate all three phases for mixed priority objectives", () => {
		const state = createInitialSessionState({
			...base,
			title: "Mixed Plan",
			objectives: [
				{ description: "Critical feature", priority: "high" as const },
				{ description: "Standard feature", priority: "medium" as const },
				{ description: "Optional feature", priority: "low" as const },
			],
			requirements: [
				{
					description: "Req",
					type: "functional" as const,
					priority: "medium" as const,
				},
			],
		});

		const result = generatePlan(state);
		expect(result.content).toContain("Phase 1: Foundation");
		expect(result.content).toContain("Phase 2: Core Implementation");
		expect(result.content).toContain("Phase 3: Enhancement");
	});

	it("should add extra risk row when more than 3 non-functional requirements exist", () => {
		const state = createInitialSessionState({
			...base,
			title: "NFR Plan",
			objectives: [{ description: "Obj", priority: "high" as const }],
			requirements: [
				{
					description: "Perf",
					type: "non-functional" as const,
					priority: "high" as const,
				},
				{
					description: "Security",
					type: "non-functional" as const,
					priority: "high" as const,
				},
				{
					description: "Reliability",
					type: "non-functional" as const,
					priority: "medium" as const,
				},
				{
					description: "Scalability",
					type: "non-functional" as const,
					priority: "medium" as const,
				},
			],
		});

		const result = generatePlan(state);
		expect(result.content).toContain("Non-functional overload");
	});

	it("should not add extra risk row for 3 or fewer non-functional requirements", () => {
		const state = createInitialSessionState({
			...base,
			title: "Few NFR Plan",
			objectives: [{ description: "Obj", priority: "high" as const }],
			requirements: [
				{
					description: "Perf",
					type: "non-functional" as const,
					priority: "high" as const,
				},
				{
					description: "Security",
					type: "non-functional" as const,
					priority: "high" as const,
				},
			],
		});

		const result = generatePlan(state);
		expect(result.content).not.toContain("Non-functional overload");
	});
});
