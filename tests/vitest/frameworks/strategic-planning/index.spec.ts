import { describe, expect, it } from "vitest";
import { strategicPlanningFramework } from "../../../../src/frameworks/strategic-planning/index.js";

describe("strategic-planning framework", () => {
	it("exports a FrameworkDefinition with required fields", () => {
		expect(strategicPlanningFramework.name).toBe("strategic-planning");
		expect(typeof strategicPlanningFramework.execute).toBe("function");
		expect(Array.isArray(strategicPlanningFramework.actions)).toBe(true);
	});

	it("execute() — swot analysis", async () => {
		const result = await strategicPlanningFramework.execute({
			action: "swot",
			context: "A SaaS startup",
		});
		expect(result).toBeTruthy();
	});

	it("execute() — vrio analysis", async () => {
		const result = await strategicPlanningFramework.execute({
			action: "vrio",
			context: "Technology firm",
		});
		expect(result).toBeTruthy();
	});

	it("execute() — bsc analysis", async () => {
		const result = await strategicPlanningFramework.execute({
			action: "bsc",
			context: "Enterprise company",
		});
		expect(result).toBeTruthy();
	});

	it("execute() — gap analysis", async () => {
		const result = await strategicPlanningFramework.execute({
			action: "gap",
			currentState: "Manual processes",
			desiredState: "Automated workflows",
			context: "Operations team",
		});
		expect(result).toBeTruthy();
	});

	it("execute() — gap analysis with ?? defaults (no fields)", async () => {
		const result = await strategicPlanningFramework.execute({ action: "gap" });
		expect(result).toBeTruthy();
	});

	it("execute() — sprint timeline", async () => {
		const result = await strategicPlanningFramework.execute({
			action: "sprint",
			tasks: [{ id: "t1", title: "Task 1", storyPoints: 3 }],
			teamSize: 4,
			velocity: 20,
		});
		expect(result).toBeTruthy();
	});

	it("execute() — sprint with ?? defaults (no tasks)", async () => {
		const result = await strategicPlanningFramework.execute({
			action: "sprint",
		});
		expect(result).toBeTruthy();
	});

	it("execute() — rejects invalid action via zod", async () => {
		await expect(
			strategicPlanningFramework.execute({ action: "unknown" }),
		).rejects.toThrow();
	});
});
