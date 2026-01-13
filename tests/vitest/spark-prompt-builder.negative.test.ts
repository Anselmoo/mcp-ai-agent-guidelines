import { describe, expect, it } from "vitest";
import { sparkPromptBuilder } from "../../src/tools/prompt/spark-prompt-builder";

type ErrorResponse = { isError?: boolean; content: { text: string }[] };

describe("sparkPromptBuilder (negative)", () => {
	it("returns error when title is missing", async () => {
		// missing title
		const result = (await sparkPromptBuilder({
			summary: "UI for travel app",
			complexityLevel: "medium",
			designDirection: "Clean and modern",
			colorSchemeType: "light",
			colorPurpose: "readability",
			primaryColor: "Blue oklch(0.72 0.12 250)",
			primaryColorPurpose: "primary actions",
			accentColor: "Green oklch(0.7 0.18 130)",
			accentColorPurpose: "confirmations",
			fontFamily: "Inter",
			fontIntention: "friendly",
			fontReasoning: "high legibility",
			animationPhilosophy: "subtle",
			animationRestraint: "minimal",
			animationPurpose: "meaningful feedback",
			animationHierarchy: "content first",
			spacingRule: "8px grid",
			spacingContext: "components and sections",
			mobileLayout: "bottom nav with FAB",
		})) as ErrorResponse;
		expect(result.isError).toBe(true);
		expect(result.content[0].text).toMatch(/Required|title/i);
	});

	it("returns error when summary is missing", async () => {
		// missing summary
		const result = (await sparkPromptBuilder({
			title: "Travel App",
			complexityLevel: "medium",
			designDirection: "Clean and modern",
			colorSchemeType: "light",
			colorPurpose: "readability",
			primaryColor: "Blue oklch(0.72 0.12 250)",
			primaryColorPurpose: "primary actions",
			accentColor: "Green oklch(0.7 0.18 130)",
			accentColorPurpose: "confirmations",
			fontFamily: "Inter",
			fontIntention: "friendly",
			fontReasoning: "high legibility",
			animationPhilosophy: "subtle",
			animationRestraint: "minimal",
			animationPurpose: "meaningful feedback",
			animationHierarchy: "content first",
			spacingRule: "8px grid",
			spacingContext: "components and sections",
			mobileLayout: "bottom nav with FAB",
		})) as ErrorResponse;
		expect(result.isError).toBe(true);
		expect(result.content[0].text).toMatch(/Required|summary/i);
	});
});
