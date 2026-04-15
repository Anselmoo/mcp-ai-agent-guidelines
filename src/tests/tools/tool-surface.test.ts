import { describe, expect, it } from "vitest";
import { InstructionRegistry } from "../../instructions/instruction-registry.js";
import { buildPublicToolSurface } from "../../tools/tool-surface.js";

describe("tool-surface", () => {
	it("builds public tools directly from the instruction registry", () => {
		const tools = buildPublicToolSurface(new InstructionRegistry());

		expect(tools.length).toBeGreaterThan(0);
		expect(tools.every((tool) => tool.inputSchema.type === "object")).toBe(
			true,
		);
		expect(tools.every((tool) => tool.annotations?.readOnlyHint === true)).toBe(
			true,
		);
		expect(tools.some((tool) => tool.name === "feature-implement")).toBe(true);
		expect(tools.some((tool) => tool.description.includes("Focus:"))).toBe(
			true,
		);
	});

	it("exposes preferredModelClass on every tool annotation", () => {
		const tools = buildPublicToolSurface(new InstructionRegistry());
		const validModelClasses = new Set(["free", "cheap", "strong", "reviewer"]);

		for (const tool of tools) {
			expect(
				tool.annotations,
				`Tool ${tool.name} should have annotations`,
			).toBeDefined();
			expect(
				tool.annotations?.preferredModelClass,
				`Tool ${tool.name} should have preferredModelClass annotation`,
			).toBeDefined();
			expect(
				validModelClasses.has(tool.annotations?.preferredModelClass as string),
				`Tool ${tool.name} preferredModelClass "${tool.annotations?.preferredModelClass}" is not a valid ModelClass`,
			).toBe(true);
		}
	});

	it("workflow tools carry surfaceCategory workflow and discovery tools carry surfaceCategory discovery", () => {
		const tools = buildPublicToolSurface(new InstructionRegistry());

		const workflowTools = tools.filter(
			(t) => t.annotations?.surfaceCategory === "workflow",
		);
		const discoveryTools = tools.filter(
			(t) => t.annotations?.surfaceCategory === "discovery",
		);

		// Both categories must be present
		expect(workflowTools.length).toBeGreaterThan(0);
		expect(discoveryTools.length).toBeGreaterThan(0);

		// Every tool must be in exactly one category
		expect(workflowTools.length + discoveryTools.length).toBe(tools.length);
	});
});
