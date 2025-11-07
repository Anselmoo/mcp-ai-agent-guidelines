import { describe, expect, it } from "vitest";
import type { Technique } from "../../src/tools/shared/prompt-sections";
import {
	buildDisclaimer,
	buildPitfallsSection,
	buildProviderTipsSection,
	buildTechniqueHintsSection,
	inferTechniquesFromText,
} from "../../src/tools/shared/prompt-sections";

describe("prompt-sections", () => {
	it("inferTechniquesFromText picks techniques based on keywords", () => {
		const t = inferTechniquesFromText(
			"Please cite sources and explain step by step",
		);
		expect(t).toContain("rag");
		expect(t).toContain("chain-of-thought");
	});

	it("buildTechniqueHintsSection respects explicit selection", () => {
		const techs: Technique[] = ["react", "art"];
		const text = buildTechniqueHintsSection({ techniques: techs });
		expect(text).toMatch(/ReAct/);
		expect(text).toMatch(/Automatic Reasoning and Tool-use/);
	});

	it("buildTechniqueHintsSection can auto-select from context", () => {
		const text = buildTechniqueHintsSection({
			autoSelectTechniques: true,
			contextText: "workflow then plan then analyze",
		});
		expect(text).toMatch(/Prompt Chaining/);
	});

	it("buildProviderTipsSection varies by provider and style", () => {
		const gpt = buildProviderTipsSection("gpt-4.1", "markdown");
		expect(gpt).toMatch(/Preferred Style: MARKDOWN/);
		const gpt5 = buildProviderTipsSection("gpt-5", "markdown");
		expect(gpt5).toMatch(/Preferred Style: MARKDOWN/);
		const claude = buildProviderTipsSection("claude-4");
		expect(claude).toMatch(/Preferred Style: XML/);
		const gemini = buildProviderTipsSection("gemini-2.5");
		expect(gemini).toMatch(/Preferred Style: MARKDOWN/);
	});

	it("buildProviderTipsSection uses gpt-5 as default", () => {
		const defaultTips = buildProviderTipsSection();
		expect(defaultTips).toMatch(/Model-Specific Tips/);
		expect(defaultTips).toMatch(/Preferred Style: MARKDOWN/);
	});

	it("buildProviderTipsSection handles falsy provider with fallback", () => {
		// Test the || "gpt-5" fallback by passing null (which bypasses default parameter)
		const fallbackTips = buildProviderTipsSection(null as any);
		expect(fallbackTips).toMatch(/Model-Specific Tips/);
		expect(fallbackTips).toMatch(/Preferred Style: MARKDOWN/);
		expect(fallbackTips).toMatch(/Prefer Markdown with clear headings/);
	});

	it("buildPitfallsSection and buildDisclaimer return expected headings", () => {
		expect(buildPitfallsSection()).toMatch(/Pitfalls to Avoid/);
		expect(buildDisclaimer()).toMatch(/Disclaimer/);
	});
});
