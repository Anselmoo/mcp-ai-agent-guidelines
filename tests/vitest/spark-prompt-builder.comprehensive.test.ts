import { describe, expect, it } from "vitest";
import { sparkPromptBuilder } from "../../src/tools/prompt/spark-prompt-builder.js";

describe("spark-prompt-builder comprehensive coverage", () => {
	it("should handle complete configuration with all optional fields", async () => {
		const result = await sparkPromptBuilder({
			title: "Comprehensive Design System",
			summary: "A complete design system with all components",
			experienceQualities: [
				{ quality: "Intuitive", detail: "Easy to understand interface" },
				{ quality: "Performant", detail: "Fast loading and responsive" },
				{ quality: "Accessible", detail: "WCAG compliant design" },
			],
			complexityLevel: "High",
			complexityDescription: "Multi-faceted system with numerous integrations",
			primaryFocus: "User experience optimization",
			features: [
				{
					name: "Dashboard",
					functionality: "Data visualization and analytics",
					purpose: "Provide insights to users",
					trigger: "User login",
					progression: ["Authentication", "Data load", "Render charts"],
					successCriteria: "All widgets load within 2 seconds",
				},
				{
					name: "Settings Panel",
					functionality: "User preference management",
					purpose: "Allow customization",
					trigger: "Settings button click",
					progression: ["Panel open", "Category selection", "Option update"],
					successCriteria: "Changes persist across sessions",
				},
			],
			edgeCases: [
				{
					name: "Network failure",
					handling: "Show offline mode with cached data",
				},
				{
					name: "Large datasets",
					handling: "Implement pagination and virtualization",
				},
			],
			designDirection: "Modern minimalist with subtle animations",
			colorSchemeType: "Dark theme with light accent",
			colorPurpose: "Reduce eye strain for extended use",
			primaryColor: "oklch(25% 0.02 240)",
			primaryColorPurpose: "Main brand color for primary actions",
			secondaryColors: [
				{
					name: "Success Green",
					oklch: "oklch(65% 0.15 120)",
					usage: "Success states and confirmations",
				},
				{
					name: "Warning Orange",
					oklch: "oklch(70% 0.15 60)",
					usage: "Warning messages and alerts",
				},
				{
					name: "Error Red",
					oklch: "oklch(55% 0.15 15)",
					usage: "Error states and validation",
				},
			],
			accentColor: "oklch(80% 0.1 180)",
			accentColorPurpose: "Highlight important elements and calls-to-action",
			foregroundBackgroundPairings: [
				{
					container: "Primary buttons",
					containerColor: "oklch(25% 0.02 240)",
					textColor: "oklch(95% 0.01 240)",
					ratio: "4.5:1",
				},
				{
					container: "Card backgrounds",
					containerColor: "oklch(15% 0.01 240)",
					textColor: "oklch(85% 0.02 240)",
					ratio: "7:1",
				},
			],
			fontFamily: "Inter, system-ui, sans-serif",
			fontIntention: "Clean, readable typography for data-heavy interfaces",
			fontReasoning:
				"Inter provides excellent readability at small sizes and has extensive character support",
			typography: [
				{
					usage: "Headlines",
					font: "Inter",
					weight: "600",
					size: "2rem",
					spacing: "-0.02em",
				},
				{
					usage: "Body text",
					font: "Inter",
					weight: "400",
					size: "1rem",
					spacing: "0em",
				},
				{
					usage: "Captions",
					font: "Inter",
					weight: "500",
					size: "0.875rem",
					spacing: "0.01em",
				},
				{
					usage: "Code",
					font: "JetBrains Mono",
					weight: "400",
					size: "0.875rem",
					spacing: "0em",
				},
			],
			animationPhilosophy: "Subtle and purposeful motion that enhances UX",
			animationRestraint:
				"Respect prefers-reduced-motion and keep durations under 300ms",
			animationPurpose:
				"Guide attention, provide feedback, and improve perceived performance",
			animationHierarchy:
				"Primary actions > secondary actions > decorative elements",
			components: [
				{
					type: "Button",
					usage: "Primary and secondary actions",
					variation: "Primary, secondary, ghost, icon-only",
					styling: "Rounded corners, subtle shadows",
					state: "Default, hover, active, disabled, loading",
					functionality: "Trigger actions and navigate",
					purpose: "Enable user interactions",
				},
				{
					type: "Input",
					usage: "Data entry and search",
					variation: "Text, email, password, search, textarea",
					styling: "Clean borders with focus indicators",
					state: "Default, focus, error, disabled",
					functionality: "Capture user input",
					purpose: "Data collection and filtering",
				},
			],
			customizations: "Support theming API for white-label deployments",
			states: [
				{
					component: "Navigation",
					states: ["collapsed", "expanded", "mobile-drawer"],
					specialFeature: "Progressive disclosure based on user role",
				},
				{
					component: "Data Table",
					states: ["loading", "populated", "empty", "error"],
					specialFeature: "Virtual scrolling for large datasets",
				},
			],
			icons: ["Lucide", "Heroicons", "Custom dashboard icons"],
			spacingRule: "8px base unit with 1.5x scaling factor",
			spacingContext: "Consistent spacing that scales from mobile to desktop",
			mobileLayout:
				"Single column with collapsible sections and bottom navigation",
			mode: "design-system",
			model: "claude-3-5-sonnet",
			tools: ["figma", "tailwind", "storybook"],
			includeFrontmatter: true,
			includeDisclaimer: true,
			includeReferences: true,
			includeMetadata: true,
			inputFile: "design-system-spec.md",
			forcePromptMdStyle: true,
		});

		expect(result).toHaveProperty("content");
		const content = result.content[0].text;

		// Verify all major sections are included (more flexible checks)
		expect(content).toContain("Comprehensive Design System");
		expect(content).toContain("Experience Qualities");
		expect(content).toContain("Features");
		expect(content).toContain("Network failure"); // Check edge cases are included
		expect(content).toContain("Color Selection"); // Updated from "Color Scheme"
		expect(content).toContain("Typographic Hierarchy"); // Updated from "Typography"
		expect(content).toContain("Animation");
		expect(content).toContain("Components");
		expect(content).toContain("Spacing");
		expect(content).toContain("Mobile"); // Updated from "Mobile Layout"
		expect(content).toContain("## Metadata");
		expect(content).toContain("## Further Reading");
		expect(content).toContain("design-system-spec.md");
	});

	it("should handle empty arrays and undefined optional fields", async () => {
		const result = await sparkPromptBuilder({
			title: "Minimal Design",
			summary: "Basic design with minimal configuration",
			complexityLevel: "Low",
			designDirection: "Simple and clean",
			colorSchemeType: "Light",
			colorPurpose: "Clean and professional",
			primaryColor: "oklch(50% 0.1 240)",
			primaryColorPurpose: "Brand consistency",
			accentColor: "oklch(60% 0.1 180)",
			accentColorPurpose: "Accent elements",
			fontFamily: "Arial, sans-serif",
			fontIntention: "Simple and readable",
			fontReasoning: "Widely available system font",
			animationPhilosophy: "Minimal motion",
			animationRestraint: "No complex animations",
			animationPurpose: "Basic feedback only",
			animationHierarchy: "Essential only",
			spacingRule: "16px base unit",
			spacingContext: "Consistent spacing",
			mobileLayout: "Responsive design",
			// Empty arrays to test handling
			experienceQualities: [],
			features: [],
			edgeCases: [],
			secondaryColors: [],
			foregroundBackgroundPairings: [],
			typography: [],
			components: [],
			states: [],
			icons: [],
		});

		expect(result).toHaveProperty("content");
		expect(result.content[0].text).toContain("Minimal Design");
	});

	it("should handle all animation and color variations", async () => {
		const result = await sparkPromptBuilder({
			title: "Animation Test",
			summary: "Testing animation and color handling",
			complexityLevel: "Medium",
			designDirection: "Interactive and engaging",
			colorSchemeType: "High contrast",
			colorPurpose: "Accessibility focused",
			primaryColor: "oklch(20% 0.05 240)",
			primaryColorPurpose: "High contrast primary",
			accentColor: "oklch(70% 0.2 30)",
			accentColorPurpose: "Vibrant accents",
			fontFamily: "System UI",
			fontIntention: "Platform native",
			fontReasoning: "OS integration",
			animationPhilosophy: "Delightful and accessible",
			animationRestraint: "Respects accessibility preferences",
			animationPurpose: "Enhanced user feedback",
			animationHierarchy: "Critical > helpful > decorative",
			spacingRule: "12px base with golden ratio",
			spacingContext: "Mathematically pleasing proportions",
			mobileLayout: "Touch-first design with large targets",
			// Test all possible variations
			secondaryColors: [
				{
					name: "Info Blue",
					oklch: "oklch(60% 0.15 240)",
					usage: "Information states",
				},
				{
					name: "Neutral Gray",
					oklch: "oklch(50% 0.02 240)",
					usage: "Secondary text",
				},
			],
			foregroundBackgroundPairings: [
				{
					container: "Interactive elements",
					containerColor: "oklch(20% 0.05 240)",
					textColor: "oklch(95% 0.02 240)",
					ratio: "8:1",
				},
			],
			components: [
				{
					type: "Animation Test",
					usage: "Testing component animation states",
					variation: "Multiple animation types",
					styling: "Motion-focused styling",
					state: "static, animated, transitioning",
					functionality: "Visual feedback through motion",
					purpose: "User engagement and guidance",
				},
			],
		});

		expect(result).toHaveProperty("content");
		const content = result.content[0].text;
		expect(content).toContain("Animation Test");
		expect(content).toContain("High contrast");
		expect(content).toContain("Touch-first design");
	});

	it("should handle markdown frontmatter when forcePromptMdStyle is true", async () => {
		const result = await sparkPromptBuilder({
			title: "Frontmatter Test",
			summary: "Testing frontmatter generation",
			complexityLevel: "Low",
			designDirection: "Test",
			colorSchemeType: "Test",
			colorPurpose: "Test",
			primaryColor: "test",
			primaryColorPurpose: "test",
			accentColor: "test",
			accentColorPurpose: "test",
			fontFamily: "test",
			fontIntention: "test",
			fontReasoning: "test",
			animationPhilosophy: "test",
			animationRestraint: "test",
			animationPurpose: "test",
			animationHierarchy: "test",
			spacingRule: "test",
			spacingContext: "test",
			mobileLayout: "test",
			forcePromptMdStyle: true,
			includeFrontmatter: true,
			mode: "test-mode",
			model: "test-model",
			tools: ["test-tool1", "test-tool2"],
		});

		const content = result.content[0].text;
		expect(content).toMatch(/^---/); // Should start with frontmatter delimiter
		expect(content).toContain("Frontmatter Test"); // Should contain the title
		expect(content).toContain("Testing frontmatter generation"); // Should contain the summary
	});
});
