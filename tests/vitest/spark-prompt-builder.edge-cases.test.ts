import { describe, expect, it } from "vitest";
import { sparkPromptBuilder } from "../../src/tools/prompt/spark-prompt-builder";

describe("spark-prompt-builder edge cases", () => {
	it("handles comprehensive configuration with all features", async () => {
		const result = await sparkPromptBuilder({
			title: "Advanced Travel Booking App",
			summary: "Comprehensive travel planning platform with AI recommendations",
			complexityLevel: "high",
			designDirection: "Modern minimalist with premium feel",
			colorSchemeType: "dark",
			colorPurpose: "Professional dark theme for power users",
			primaryColor: "oklch(0.7 0.15 220)",
			primaryColorPurpose: "Brand recognition and primary actions",
			accentColor: "oklch(0.8 0.12 45)",
			accentColorPurpose: "Highlighting important features and CTAs",
			secondaryColors: [
				{
					name: "Success Green",
					oklch: "oklch(0.7 0.14 130)",
					usage: "Confirmation states and positive feedback",
				},
				{
					name: "Warning Orange",
					oklch: "oklch(0.75 0.13 65)",
					usage: "Alerts and attention-requiring items",
				},
			],
			foregroundBackgroundPairings: [
				{
					container: "Card backgrounds",
					containerColor: "oklch(0.15 0.02 220)",
					textColor: "oklch(0.9 0.05 220)",
					ratio: "12:1",
				},
				{
					container: "Button surfaces",
					containerColor: "oklch(0.7 0.15 220)",
					textColor: "oklch(0.99 0.01 220)",
					ratio: "8:1",
				},
			],
			fontFamily: "Inter, system-ui, sans-serif",
			fontIntention: "Modern, highly readable typeface for complex data",
			fontReasoning: "Inter provides excellent readability at various sizes and weights",
			typography: [
				{
					usage: "Hero headings",
					font: "Inter",
					weight: "800",
					size: "clamp(2rem, 5vw, 4rem)",
					spacing: "-0.02em",
				},
				{
					usage: "Body text",
					font: "Inter",
					weight: "400",
					size: "1rem",
					spacing: "0",
				},
			],
			animationPhilosophy: "Purposeful motion that enhances user understanding",
			animationRestraint: "Subtle transitions under 300ms, respect reduced motion",
			animationPurpose: "Guide attention and provide feedback on interactions",
			animationHierarchy: "Critical feedback > navigation > decorative",
			spacingRule: "8px base unit with 1.5x scaling factor",
			spacingContext: "Consistent rhythm for complex booking interfaces",
			mobileLayout: "Progressive disclosure with collapsible sections",
			features: [
				{
					name: "AI Trip Planner",
					functionality: "Machine learning recommendations for destinations",
					purpose: "Personalized travel suggestions based on preferences",
					trigger: "User inputs travel preferences and dates",
					progression: [
						"Collect user preferences",
						"Analyze historical data",
						"Generate recommendations",
						"Present options with reasoning",
					],
					successCriteria: "User books recommended trip within 3 sessions",
				},
			],
			components: [
				{
					type: "date-picker",
					usage: "Trip date selection",
					styling: "Minimalist calendar with range selection",
					functionality: "Multi-date selection with availability",
					purpose: "Streamlined date selection for travel planning",
					state: "Default, focused, selected, disabled",
					variation: "Single date, date range, multiple dates",
				},
			],
			includeFrontmatter: true,
			includeMetadata: true,
			includeReferences: true,
			includeDisclaimer: true,
			forcePromptMdStyle: true,
		});

		const text = result.content[0].text;
		expect(text).toMatch(/Advanced Travel Booking App/);
		expect(text).toMatch(/travel planning platform/);
		expect(text).toMatch(/AI Trip Planner/);
		expect(text).toMatch(/date-picker/);
		expect(text).toMatch(/Success Green/);
		expect(text).toMatch(/Warning Orange/);
		expect(text).toMatch(/Inter.*system-ui/);
		expect(text).toMatch(/Hero headings/);
		expect(text).toMatch(/Purposeful motion/);
		expect(text).toMatch(/8px base unit/);
		expect(text).toMatch(/Progressive disclosure/);
	});

	it("handles minimal configuration", async () => {
		const result = await sparkPromptBuilder({
			title: "Simple App",
			summary: "Basic functionality app",
			complexityLevel: "low",
			designDirection: "Clean and simple",
			colorSchemeType: "light",
			colorPurpose: "Accessible and friendly",
			primaryColor: "oklch(0.5 0.1 200)",
			primaryColorPurpose: "Main brand color",
			accentColor: "oklch(0.6 0.12 160)",
			accentColorPurpose: "Accent elements",
			fontFamily: "system-ui",
			fontIntention: "System default",
			fontReasoning: "Fast loading and familiar",
			animationPhilosophy: "Minimal animations",
			animationRestraint: "Only essential feedback",
			animationPurpose: "User feedback",
			animationHierarchy: "Critical only",
			spacingRule: "8px grid",
			spacingContext: "Consistent spacing",
			mobileLayout: "Single column layout",
		});

		const text = result.content[0].text;
		expect(text).toMatch(/Simple App/);
		expect(text).toMatch(/Basic functionality/);
		expect(text).toMatch(/Clean and simple/);
		expect(text).toMatch(/system-ui/);
		expect(text).toMatch(/Minimal animations/);
	});

	it("handles complex color configurations", async () => {
		const result = await sparkPromptBuilder({
			title: "Colorful Design System",
			summary: "Rich color palette demonstration",
			complexityLevel: "medium",
			designDirection: "Vibrant and energetic",
			colorSchemeType: "custom",
			colorPurpose: "Brand differentiation through bold colors",
			primaryColor: "oklch(0.65 0.25 340)",
			primaryColorPurpose: "Strong brand presence",
			accentColor: "oklch(0.7 0.22 60)",
			accentColorPurpose: "Energy and attention",
			secondaryColors: [
				{
					name: "Success",
					oklch: "oklch(0.6 0.18 140)",
					usage: "Positive actions and feedback",
				},
				{
					name: "Warning",
					oklch: "oklch(0.7 0.2 80)",
					usage: "Caution and attention states",
				},
			],
			fontFamily: "Poppins, sans-serif",
			fontIntention: "Friendly and approachable",
			fontReasoning: "Rounded letterforms match vibrant brand personality",
			animationPhilosophy: "Playful but purposeful",
			animationRestraint: "Respect user preferences, under 500ms",
			animationPurpose: "Delight and guidance",
			animationHierarchy: "Feedback > navigation > decoration",
			spacingRule: "4px base with golden ratio scaling",
			spacingContext: "Rhythmic spacing for dynamic layouts",
			mobileLayout: "Adaptive grid with breakpoints",
		});

		const text = result.content[0].text;
		expect(text).toMatch(/Colorful Design System/);
		expect(text).toMatch(/Vibrant and energetic/);
		expect(text).toMatch(/Success.*oklch\(0\.6 0\.18 140\)/);
		expect(text).toMatch(/Warning.*oklch\(0\.7 0\.2 80\)/);
		expect(text).toMatch(/Poppins.*sans-serif/);
		expect(text).toMatch(/golden ratio scaling/);
	});

	it("validates required fields", async () => {
		await expect(
			sparkPromptBuilder({
				title: "",
				summary: "Valid summary",
			} as any),
		).rejects.toThrow();

		await expect(
			sparkPromptBuilder({
				title: "Valid Title",
				summary: "",
			} as any),
		).rejects.toThrow();
	});

	it("handles empty optional arrays gracefully", async () => {
		const result = await sparkPromptBuilder({
			title: "Minimal Design",
			summary: "Design with empty arrays",
			complexityLevel: "low",
			designDirection: "Simple",
			colorSchemeType: "light",
			colorPurpose: "Basic",
			primaryColor: "oklch(0.5 0.1 200)",
			primaryColorPurpose: "Primary",
			accentColor: "oklch(0.6 0.1 160)",
			accentColorPurpose: "Accent",
			fontFamily: "system-ui",
			fontIntention: "Default",
			fontReasoning: "System default",
			animationPhilosophy: "None",
			animationRestraint: "No animations",
			animationPurpose: "None",
			animationHierarchy: "None",
			spacingRule: "8px",
			spacingContext: "Basic",
			mobileLayout: "Simple",
			secondaryColors: [],
			foregroundBackgroundPairings: [],
			typography: [],
			features: [],
			components: [],
			states: [],
			experienceQualities: [],
			edgeCases: [],
			icons: [],
			tools: [],
		});

		const text = result.content[0].text;
		expect(text).toMatch(/Minimal Design/);
		expect(text).toMatch(/Design with empty arrays/);
		expect(text).not.toMatch(/undefined/);
		expect(text).not.toMatch(/\[object Object\]/);
	});
});