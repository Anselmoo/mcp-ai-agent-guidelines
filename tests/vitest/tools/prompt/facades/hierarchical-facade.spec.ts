import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PromptRegistry } from "../../../../../src/domain/prompts/registry.js";
import { hierarchicalFacade } from "../../../../../src/tools/prompt/facades/hierarchical-facade.js";
import * as deprecation from "../../../../../src/tools/shared/deprecation.js";

describe("hierarchicalFacade", () => {
	beforeEach(() => {
		PromptRegistry.resetInstance();
		deprecation.resetDeprecationWarnings();
	});

	afterEach(() => {
		PromptRegistry.resetInstance();
		deprecation.resetDeprecationWarnings();
	});

	it("returns CallToolResult with text content", async () => {
		const result = await hierarchicalFacade({
			context: "E-commerce platform",
			goal: "Implement checkout flow",
		});
		expect(result.content[0].type).toBe("text");
		expect(typeof (result.content[0] as { text: string }).text).toBe("string");
	});

	it("throws for invalid input (missing goal)", async () => {
		await expect(
			hierarchicalFacade({ context: "Some context" }),
		).rejects.toThrow();
	});

	it("emits deprecation warning", async () => {
		const spy = vi.spyOn(deprecation, "emitDeprecationWarning");
		await hierarchicalFacade({ context: "Ctx", goal: "Goal" });
		expect(spy).toHaveBeenCalledWith(
			expect.objectContaining({ tool: "hierarchical-facade" }),
		);
	});

	it("content includes context", async () => {
		const result = await hierarchicalFacade({
			context: "Unique Context ABC",
			goal: "Build something",
		});
		const text = (result.content[0] as { text: string }).text;
		expect(text).toContain("Unique Context ABC");
	});
});
