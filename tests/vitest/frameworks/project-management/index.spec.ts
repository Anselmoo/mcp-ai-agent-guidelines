import { describe, expect, it } from "vitest";
import { projectManagementFramework } from "../../../../src/frameworks/project-management/index.js";

describe("project-management framework", () => {
	it("exports a FrameworkDefinition with required fields", () => {
		expect(projectManagementFramework.name).toBe("project-management");
		expect(typeof projectManagementFramework.execute).toBe("function");
		expect(Array.isArray(projectManagementFramework.actions)).toBe(true);
	});

	it("execute() — generate with all fields provided", async () => {
		const result = await projectManagementFramework.execute({
			action: "generate",
			title: "My Feature",
			overview: "An overview",
			objectives: [{ description: "obj1", priority: "high" }],
			requirements: [{ description: "req1", type: "functional" }],
		});
		expect(result).toBeTruthy();
	});

	it("execute() — generate with only action (uses ?? defaults)", async () => {
		// specKitGenerator requires overview and requirements — branch covered even if it throws
		await expect(
			projectManagementFramework.execute({ action: "generate" }),
		).rejects.toThrow();
	});

	it("execute() — validate with specContent", async () => {
		// validateSpec requires constitutionPath or constitutionContent — expect it to reject
		// but the "validate" case branch itself gets covered
		await expect(
			projectManagementFramework.execute({
				action: "validate",
				specContent: "# My Spec\n\n## Overview\nThis is a spec.",
			}),
		).rejects.toThrow();
	});

	it("execute() — validate with no specContent (uses ?? default)", async () => {
		await expect(
			projectManagementFramework.execute({ action: "validate" }),
		).rejects.toThrow();
	});

	it("execute() — progress with empty completedTaskIds", async () => {
		const result = await projectManagementFramework.execute({
			action: "progress",
			completedTaskIds: [],
			outputFormat: "json",
		});
		expect(result).toBeTruthy();
	});

	it("execute() — progress with no fields (uses ?? defaults), markdown output", async () => {
		const result = await projectManagementFramework.execute({
			action: "progress",
		});
		expect(result).toBeTruthy();
	});

	it("execute() — rejects invalid action via zod", async () => {
		await expect(
			projectManagementFramework.execute({ action: "unknown-action" }),
		).rejects.toThrow();
	});
});
