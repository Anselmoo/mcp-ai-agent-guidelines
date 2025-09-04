import { describe, expect, it } from "vitest";
import { sparkPromptBuilder } from "../../src/tools/prompt/spark-prompt-builder";

describe("sparkPromptBuilder (negative)", () => {
	it("rejects when title is missing", async () => {
		await expect(
			// missing title
			sparkPromptBuilder({
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
			}),
		).rejects.toThrow(/ZodError|Required/i);
	});

	it("rejects when summary is missing", async () => {
		await expect(
			// missing summary
			sparkPromptBuilder({
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
			}),
		).rejects.toThrow(/ZodError|Required/i);
	});
});
