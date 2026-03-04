import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PromptRegistry } from "../../../../../src/domain/prompts/registry.js";
import { domainNeutralFacade } from "../../../../../src/tools/prompt/facades/domain-neutral-facade.js";
import * as deprecation from "../../../../../src/tools/shared/deprecation.js";

describe("domainNeutralFacade", () => {
	beforeEach(() => {
		PromptRegistry.resetInstance();
		deprecation.resetDeprecationWarnings();
	});

	afterEach(() => {
		PromptRegistry.resetInstance();
		deprecation.resetDeprecationWarnings();
	});

	it("returns CallToolResult with text content", async () => {
		const result = await domainNeutralFacade({
			title: "My Prompt",
			summary: "A domain-neutral prompt",
			objectives: ["Obj 1"],
		});
		expect(result.content[0].type).toBe("text");
		expect(typeof (result.content[0] as { text: string }).text).toBe("string");
	});

	it("throws for invalid input (missing title)", async () => {
		await expect(
			domainNeutralFacade({ summary: "No title" }),
		).rejects.toThrow();
	});

	it("emits deprecation warning", async () => {
		const spy = vi.spyOn(deprecation, "emitDeprecationWarning");
		await domainNeutralFacade({ title: "T", summary: "S" });
		expect(spy).toHaveBeenCalledWith(
			expect.objectContaining({ tool: "domain-neutral-facade" }),
		);
	});

	it("content includes title", async () => {
		const result = await domainNeutralFacade({
			title: "Unique Title XYZ",
			summary: "Some summary",
		});
		const text = (result.content[0] as { text: string }).text;
		expect(text).toContain("Unique Title XYZ");
	});
});
