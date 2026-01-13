import { describe, expect, it } from "vitest";
import { domainNeutralPromptBuilder } from "../../src/tools/prompt/domain-neutral-prompt-builder";

describe("domainNeutralPromptBuilder (negative)", () => {
	it("rejects when title is missing", async () => {
		const result = (await domainNeutralPromptBuilder({ summary: "S" })) as {
			isError?: boolean;
			content: { text: string }[];
		};
		expect(result.isError).toBe(true);
		expect(result.content[0].text).toMatch(/Required|title/i);
	});

	it("rejects when summary is missing", async () => {
		const result = (await domainNeutralPromptBuilder({ title: "T" })) as {
			isError?: boolean;
			content: { text: string }[];
		};
		expect(result.isError).toBe(true);
		expect(result.content[0].text).toMatch(/Required|summary/i);
	});
});
