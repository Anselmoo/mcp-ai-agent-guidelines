import { describe, expect, it } from "vitest";
import { sparkPromptBuilder } from "../../src/tools/prompt/spark-prompt-builder";

describe("spark-prompt-builder", () => {
	it("renders a comprehensive spark prompt with design and animation details", async () => {
		const res = await sparkPromptBuilder({
			title: "Design System",
			summary: "Build a modern UI system",
			complexityLevel: "medium",
			designDirection: "Minimal, clean, accessible",
			colorSchemeType: "Neutral + Accent",
			colorPurpose: "Clarity and focus",
			primaryColor: "Indigo oklch(0.60 0.15 290)",
			primaryColorPurpose: "Primary actions",
			accentColor: "Emerald oklch(0.67 0.18 150)",
			accentColorPurpose: "Highlights",
			fontFamily: "Inter",
			fontIntention: "Readable",
			fontReasoning: "Modern geometric sans",
			animationPhilosophy: "Subtle motion",
			animationRestraint: "Avoid distraction",
			animationPurpose: "Guide attention",
			animationHierarchy: "Page > Section > Element",
			spacingRule: "8px grid",
			spacingContext: "components and sections",
			mobileLayout: "Responsive, adaptive",
			includeTechniqueHints: true,
			techniques: ["rag"],
		});
		const text = res.content[0].text;
		expect(text).toMatch(/Spark Prompt Template/);
		expect(text).toMatch(/## Essential Features/);
		expect(text).toMatch(/## Color Selection/);
		expect(text).toMatch(/## Font Selection/);
		expect(text).toMatch(/## Animations/);
		expect(text).toMatch(/Technique Hints/);
		expect(text).toMatch(/Model-Specific Tips/);
	});
});
