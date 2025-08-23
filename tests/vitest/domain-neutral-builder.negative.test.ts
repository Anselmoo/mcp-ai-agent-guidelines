import { describe, expect, it } from "vitest";
import { domainNeutralPromptBuilder } from "../../src/tools/domain-neutral-prompt-builder";

describe("domainNeutralPromptBuilder (negative)", () => {
	it("rejects when title is missing", async () => {
		await expect(domainNeutralPromptBuilder({ summary: "S" })).rejects.toThrow(
			/ZodError|Required/i,
		);
	});

	it("rejects when summary is missing", async () => {
		await expect(domainNeutralPromptBuilder({ title: "T" })).rejects.toThrow(
			/ZodError|Required/i,
		);
	});
});
