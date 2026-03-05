import { describe, expect, it } from "vitest";
import { visualizationFramework } from "../../../../src/frameworks/visualization/index.js";

describe("visualization framework", () => {
	it("exports a FrameworkDefinition with required fields", () => {
		expect(visualizationFramework.name).toBe("visualization");
		expect(typeof visualizationFramework.execute).toBe("function");
		expect(Array.isArray(visualizationFramework.actions)).toBe(true);
	});

	it("execute() — diagram with description and type", async () => {
		const result = await visualizationFramework.execute({
			action: "diagram",
			description: "A simple login flow",
			diagramType: "flowchart",
			direction: "TD",
		});
		expect(result).toBeTruthy();
	});

	it("execute() — diagram with ?? default (no diagramType)", async () => {
		const result = await visualizationFramework.execute({
			action: "diagram",
			description: "Process flow",
		});
		expect(result).toBeTruthy();
	});

	it("execute() — ui-card with title provided", async () => {
		const result = await visualizationFramework.execute({
			action: "ui-card",
			description: "A dashboard component",
			title: "Dashboard Card",
			complexityLevel: "high",
			designDirection: "bold",
			colorSchemeType: "dark",
		});
		expect(result).toBeTruthy();
	});

	it("execute() — ui-card with ?? defaults (no title, no overrides)", async () => {
		const result = await visualizationFramework.execute({
			action: "ui-card",
			description: "A simple card component",
		});
		expect(result).toBeTruthy();
	});

	it("execute() — rejects invalid action via zod", async () => {
		await expect(
			visualizationFramework.execute({
				action: "unknown",
				description: "test",
			}),
		).rejects.toThrow();
	});
});
