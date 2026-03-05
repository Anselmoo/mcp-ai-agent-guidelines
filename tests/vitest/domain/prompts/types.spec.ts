import { describe, expect, it } from "vitest";
import type {
	PromptDomain,
	PromptSection,
	PromptTechnique,
} from "../../../../src/domain/prompts/types.js";

describe("domain/prompts/types", () => {
	it("PromptSection has required shape", () => {
		const section: PromptSection = {
			id: "intro",
			title: "Introduction",
			content: "Hello world",
			required: true,
			order: 1,
		};
		expect(section.id).toBe("intro");
		expect(section.order).toBe(1);
	});

	it("PromptDomain is a valid string union", () => {
		const domain: PromptDomain = "hierarchical";
		expect(domain).toBe("hierarchical");
	});

	it("PromptTechnique is a valid string union", () => {
		const technique: PromptTechnique = "chain-of-thought";
		expect(technique).toBe("chain-of-thought");
	});
});
