import { describe, expect, it } from "vitest";
import { domainNeutralPromptBuilder } from "../../src/tools/prompt/domain-neutral-prompt-builder";

// Tiny smoke test to ensure Vitest can import TS and run

describe("vitest smoke", () => {
	it("generates domain-neutral prompt text", async () => {
		const res = await domainNeutralPromptBuilder({
			title: "Vitest Smoke",
			summary: "check",
			includeFrontmatter: false,
			includeMetadata: false,
		});
		const text = res.content[0].text;
		expect(text).toMatch(/Domain-Neutral Prompt/i);
	});
});
