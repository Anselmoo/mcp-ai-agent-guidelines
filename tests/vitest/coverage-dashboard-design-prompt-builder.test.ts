import { describe, expect, it } from "vitest";
import { coverageDashboardDesignPromptBuilder } from "../../src/tools/prompt/coverage-dashboard-design-prompt-builder.js";

describe("Coverage Dashboard Design Prompt Builder", () => {
	it("should generate a comprehensive coverage dashboard design prompt with default settings", async () => {
		const result = await coverageDashboardDesignPromptBuilder({});

		expect(result).toBeDefined();
		expect(result.content).toHaveLength(1);
		expect(result.content[0].type).toBe("text");
		expect(result.content[0].text).toContain("Coverage Dashboard Design");
		expect(result.content[0].text).toContain("Target Users");
		expect(result.content[0].text).toContain("Dashboard Architecture");
		expect(result.content[0].text).toContain("Visual Design System");
		expect(result.content[0].text).toContain("Accessibility");
		expect(result.content[0].text).toContain("Responsive Design");
		expect(result.content[0].text).toContain("Interactive Features");
		expect(result.content[0].text).toContain("Performance Optimization");
		expect(result.content[0].text).toContain("Nielsen's 10");
		expect(result.content[0].text).toContain("Design Iteration");
	});

	it("should include custom title and project context", async () => {
		const result = await coverageDashboardDesignPromptBuilder({
			title: "My Custom Coverage Dashboard",
			projectContext: "A React-based enterprise testing platform",
		});

		expect(result.content[0].text).toContain("My Custom Coverage Dashboard");
		expect(result.content[0].text).toContain(
			"A React-based enterprise testing platform",
		);
	});

	it("should handle custom target users", async () => {
		const result = await coverageDashboardDesignPromptBuilder({
			targetUsers: ["developers", "managers", "qa-engineers"],
		});

		expect(result.content[0].text).toContain("Developers");
		expect(result.content[0].text).toContain("Managers");
		expect(result.content[0].text).toContain("QA Engineers");
	});

	it("should configure dashboard style options", async () => {
		const cardBasedResult = await coverageDashboardDesignPromptBuilder({
			dashboardStyle: "card-based",
		});
		expect(cardBasedResult.content[0].text).toContain("card-based");

		const tableHeavyResult = await coverageDashboardDesignPromptBuilder({
			dashboardStyle: "table-heavy",
		});
		expect(tableHeavyResult.content[0].text).toContain("table-heavy");

		const minimalResult = await coverageDashboardDesignPromptBuilder({
			dashboardStyle: "minimal",
		});
		expect(minimalResult.content[0].text).toContain("minimal");
	});

	it("should include custom color palette", async () => {
		const result = await coverageDashboardDesignPromptBuilder({
			primaryColor: "oklch(0.6 0.2 280)",
			successColor: "oklch(0.7 0.2 140)",
			warningColor: "oklch(0.8 0.15 80)",
			dangerColor: "oklch(0.5 0.25 30)",
		});

		expect(result.content[0].text).toContain("oklch(0.6 0.2 280)");
		expect(result.content[0].text).toContain("oklch(0.7 0.2 140)");
		expect(result.content[0].text).toContain("oklch(0.8 0.15 80)");
		expect(result.content[0].text).toContain("oklch(0.5 0.25 30)");
	});

	it("should configure accessibility options", async () => {
		const result = await coverageDashboardDesignPromptBuilder({
			accessibility: {
				wcagLevel: "AAA",
				colorBlindSafe: true,
				keyboardNavigation: true,
				screenReaderOptimized: true,
				focusIndicators: true,
				highContrastMode: true,
			},
		});

		expect(result.content[0].text).toContain("WCAG AAA");
		expect(result.content[0].text).toContain("Color-blind safe palette");
		expect(result.content[0].text).toContain("Keyboard navigation");
		expect(result.content[0].text).toContain("Screen reader optimization");
		expect(result.content[0].text).toContain("Focus indicators");
		expect(result.content[0].text).toContain("High contrast mode");
	});

	it("should configure responsive design options", async () => {
		const result = await coverageDashboardDesignPromptBuilder({
			responsive: {
				mobileFirst: true,
				touchOptimized: true,
				collapsibleNavigation: true,
			},
		});

		expect(result.content[0].text).toContain("Mobile-first");
		expect(result.content[0].text).toContain("Touch-optimized");
		expect(result.content[0].text).toContain("Navigation");
	});

	it("should configure interactive features", async () => {
		const result = await coverageDashboardDesignPromptBuilder({
			interactiveFeatures: {
				filters: true,
				sorting: true,
				search: true,
				tooltips: true,
				expandCollapse: true,
				drillDown: true,
				exportOptions: ["PDF", "CSV", "JSON", "PNG"],
				realTimeUpdates: true,
			},
		});

		expect(result.content[0].text).toContain("Filters");
		expect(result.content[0].text).toContain("Sorting");
		expect(result.content[0].text).toContain("Search");
		expect(result.content[0].text).toContain("Tooltips");
		expect(result.content[0].text).toContain("Expand/Collapse");
		expect(result.content[0].text).toContain("Drill-down");
		expect(result.content[0].text).toContain("PDF");
		expect(result.content[0].text).toContain("CSV");
		expect(result.content[0].text).toContain("JSON");
		expect(result.content[0].text).toContain("PNG");
		expect(result.content[0].text).toContain("Real-time Updates");
	});

	it("should configure performance optimizations", async () => {
		const result = await coverageDashboardDesignPromptBuilder({
			performance: {
				lazyLoading: true,
				virtualScrolling: true,
				dataCaching: true,
				skeletonLoaders: true,
				progressiveEnhancement: true,
			},
		});

		expect(result.content[0].text).toContain("Lazy Loading");
		expect(result.content[0].text).toContain("Virtual Scrolling");
		expect(result.content[0].text).toContain("Data Caching");
		expect(result.content[0].text).toContain("Skeleton Loaders");
		expect(result.content[0].text).toContain("Progressive Enhancement");
	});

	it("should include Nielsen's usability heuristics", async () => {
		const result = await coverageDashboardDesignPromptBuilder({});

		expect(result.content[0].text).toContain("Visibility of System Status");
		expect(result.content[0].text).toContain("Match with Real World");
		expect(result.content[0].text).toContain("User Control and Freedom");
		expect(result.content[0].text).toContain("Consistency and Standards");
		expect(result.content[0].text).toContain("Error Prevention");
		expect(result.content[0].text).toContain("Recognition over Recall");
		expect(result.content[0].text).toContain("Flexibility and Efficiency");
		expect(result.content[0].text).toContain("Aesthetic and Minimalist");
		expect(result.content[0].text).toContain("Help Users Recognize Errors");
		expect(result.content[0].text).toContain("Help and Documentation");
	});

	it("should configure iteration cycle options", async () => {
		const result = await coverageDashboardDesignPromptBuilder({
			iterationCycle: {
				includeABTesting: true,
				includeAnalytics: true,
				includeFeedbackWidget: true,
				includeUsabilityMetrics: true,
			},
		});

		expect(result.content[0].text).toContain("A/B Testing");
		expect(result.content[0].text).toContain("Analytics Integration");
		expect(result.content[0].text).toContain("Feedback Widget");
		expect(result.content[0].text).toContain("Usability Metrics");
	});

	it("should include framework preferences", async () => {
		const result = await coverageDashboardDesignPromptBuilder({
			framework: "react",
			componentLibrary: "shadcn/ui",
		});

		expect(result.content[0].text).toContain("react");
		expect(result.content[0].text).toContain("shadcn/ui");
	});

	it("should include references when enabled", async () => {
		const withReferences = await coverageDashboardDesignPromptBuilder({
			includeReferences: true,
		});
		expect(withReferences.content[0].text).toContain("Further Reading");
		expect(withReferences.content[0].text).toContain(
			"Nielsen's 10 Usability Heuristics",
		);
		expect(withReferences.content[0].text).toContain("WCAG");

		const withoutReferences = await coverageDashboardDesignPromptBuilder({
			includeReferences: false,
		});
		expect(withoutReferences.content[0].text).not.toContain(
			"Nielsen's 10 Usability Heuristics",
		);
	});

	it("should include disclaimer when enabled", async () => {
		const withDisclaimer = await coverageDashboardDesignPromptBuilder({
			includeDisclaimer: true,
		});
		expect(withDisclaimer.content[0].text).toContain("Disclaimer");

		const withoutDisclaimer = await coverageDashboardDesignPromptBuilder({
			includeDisclaimer: false,
		});
		expect(withoutDisclaimer.content[0].text).not.toContain("## Disclaimer");
	});

	it("should include metadata section", async () => {
		const result = await coverageDashboardDesignPromptBuilder({
			includeMetadata: true,
			inputFile: "my-config.yaml",
		});

		expect(result.content[0].text).toContain("### Metadata");
		expect(result.content[0].text).toContain("my-config.yaml");
		expect(result.content[0].text).toContain(
			"mcp_ai-agent-guid_coverage-dashboard-design-prompt-builder",
		);
	});

	it("should generate YAML frontmatter", async () => {
		const result = await coverageDashboardDesignPromptBuilder({
			includeFrontmatter: true,
			mode: "agent",
			model: "gpt-5",
		});

		expect(result.content[0].text).toContain("---");
		expect(result.content[0].text).toContain("mode:");
	});

	it("should include technique hints when enabled", async () => {
		const result = await coverageDashboardDesignPromptBuilder({
			includeTechniqueHints: true,
			techniques: ["chain-of-thought", "few-shot"],
		});

		expect(result.content[0].text).toContain("Technique Hints");
	});

	it("should include provider tips section", async () => {
		const result = await coverageDashboardDesignPromptBuilder({
			provider: "claude-opus-4.1",
		});

		expect(result.content[0].text).toContain("Model-Specific Tips");
	});

	it("should handle custom dashboard sections", async () => {
		const result = await coverageDashboardDesignPromptBuilder({
			sections: [
				{
					sectionId: "overview",
					title: "Project Overview",
					description: "High-level coverage summary",
					collapsible: true,
					defaultExpanded: true,
					metrics: [
						{
							metricName: "Total Coverage",
							displayFormat: "percentage",
							priority: "high",
						},
					],
				},
			],
		});

		expect(result.content[0].text).toContain("Project Overview");
		expect(result.content[0].text).toContain("High-level coverage summary");
		expect(result.content[0].text).toContain("Total Coverage");
	});

	it("should include visual indicators", async () => {
		const result = await coverageDashboardDesignPromptBuilder({
			visualIndicators: ["progress-bars", "badges", "sparklines", "heat-maps"],
		});

		expect(result.content[0].text).toContain("Progress bars");
		expect(result.content[0].text).toContain("Status badges");
		expect(result.content[0].text).toContain("Mini trend charts");
		expect(result.content[0].text).toContain("Heat maps");
	});

	it("should include CI/CD integration guidance", async () => {
		const result = await coverageDashboardDesignPromptBuilder({});

		expect(result.content[0].text).toContain("CI/CD Integration");
		expect(result.content[0].text).toContain("Design Iteration");
		expect(result.content[0].text).toContain("Lighthouse");
	});

	it("should include success criteria", async () => {
		const result = await coverageDashboardDesignPromptBuilder({});

		expect(result.content[0].text).toContain("Success Criteria");
		expect(result.content[0].text).toContain("80%");
		expect(result.content[0].text).toContain("30 seconds");
	});

	it("should include implementation guidance", async () => {
		const result = await coverageDashboardDesignPromptBuilder({});

		expect(result.content[0].text).toContain("Implementation Guidance");
		expect(result.content[0].text).toContain("Recommended Component Structure");
		expect(result.content[0].text).toContain("MetricCard");
		expect(result.content[0].text).toContain("CoverageChart");
		expect(result.content[0].text).toContain("FileTree");
	});

	it("should validate input schema for invalid values", async () => {
		// Test with invalid dashboard style - should use default
		const result = await coverageDashboardDesignPromptBuilder({
			dashboardStyle: "card-based",
			colorScheme: "auto",
		});
		expect(result).toBeDefined();
		expect(result.content[0].text).toContain("card-based");
	});

	it("should include primary coverage metrics", async () => {
		const result = await coverageDashboardDesignPromptBuilder({
			primaryMetrics: ["statements", "branches", "functions", "lines"],
		});

		expect(result.content[0].text).toContain("Statement Coverage");
		expect(result.content[0].text).toContain("Branch Coverage");
		expect(result.content[0].text).toContain("Function Coverage");
		expect(result.content[0].text).toContain("Line Coverage");
	});

	it("should configure typography settings", async () => {
		const result = await coverageDashboardDesignPromptBuilder({
			fontFamily: "Roboto, sans-serif",
			codeFont: "Fira Code, monospace",
		});

		expect(result.content[0].text).toContain("Roboto");
		expect(result.content[0].text).toContain("Fira Code");
	});

	it("should handle color scheme options", async () => {
		const darkResult = await coverageDashboardDesignPromptBuilder({
			colorScheme: "dark",
		});
		expect(darkResult.content[0].text).toContain("dark");

		const lightResult = await coverageDashboardDesignPromptBuilder({
			colorScheme: "light",
		});
		expect(lightResult.content[0].text).toContain("light");

		const highContrastResult = await coverageDashboardDesignPromptBuilder({
			colorScheme: "high-contrast",
		});
		expect(highContrastResult.content[0].text).toContain("high-contrast");
	});

	// Additional tests for improved coverage

	it("should handle forcePromptMdStyle: false to respect individual flags", async () => {
		const result = await coverageDashboardDesignPromptBuilder({
			forcePromptMdStyle: false,
			includeFrontmatter: false,
			includeMetadata: false,
		});

		// When forcePromptMdStyle is false and includeFrontmatter is false,
		// frontmatter should not be included
		expect(result.content[0].text).not.toMatch(/^---\n/);
		expect(result.content[0].text).not.toContain("### Metadata");
	});

	it("should handle custom user personas with fallback to default description", async () => {
		const result = await coverageDashboardDesignPromptBuilder({
			targetUsers: ["custom-persona", "another-custom"],
		});

		expect(result.content[0].text).toContain(
			"**custom-persona** - Custom user persona",
		);
		expect(result.content[0].text).toContain(
			"**another-custom** - Custom user persona",
		);
	});

	it("should handle team-leads and devops-engineers user personas", async () => {
		const result = await coverageDashboardDesignPromptBuilder({
			targetUsers: ["team-leads", "devops-engineers"],
		});

		expect(result.content[0].text).toContain("Team Leads");
		expect(result.content[0].text).toContain("DevOps Engineers");
	});

	it("should handle custom metrics with fallback to default icon/label", async () => {
		const result = await coverageDashboardDesignPromptBuilder({
			primaryMetrics: ["custom-metric", "another-metric"],
		});

		// Custom metrics should use the default icon and the metric name as label
		expect(result.content[0].text).toContain("📈 **custom-metric**");
		expect(result.content[0].text).toContain("📈 **another-metric**");
	});

	it("should handle custom visual indicators with fallback to raw value", async () => {
		const result = await coverageDashboardDesignPromptBuilder({
			visualIndicators: ["custom-indicator", "gauge-charts", "trend-arrows"],
		});

		// Custom indicator falls back to raw value, known ones get descriptions
		expect(result.content[0].text).toContain("custom-indicator");
		expect(result.content[0].text).toContain("Circular gauge charts");
		expect(result.content[0].text).toContain("Trend arrows");
	});

	it("should handle custom export formats with fallback to raw value", async () => {
		const result = await coverageDashboardDesignPromptBuilder({
			interactiveFeatures: {
				exportOptions: ["PDF", "XLSX", "custom-format"],
			},
		});

		expect(result.content[0].text).toContain("📄 PDF");
		expect(result.content[0].text).toContain("📁 XLSX");
		expect(result.content[0].text).toContain("📁 custom-format");
	});

	it("should handle HTML export format", async () => {
		const result = await coverageDashboardDesignPromptBuilder({
			interactiveFeatures: {
				exportOptions: ["HTML"],
			},
		});

		expect(result.content[0].text).toContain("🌐 HTML");
	});

	it("should handle accessibility options set to false", async () => {
		const result = await coverageDashboardDesignPromptBuilder({
			accessibility: {
				colorBlindSafe: false,
				keyboardNavigation: false,
				screenReaderOptimized: false,
				focusIndicators: false,
				highContrastMode: false,
			},
		});

		expect(result.content[0].text).toContain("Disabled");
		expect(result.content[0].text).toContain("Limited");
		expect(result.content[0].text).toContain("Basic");
		expect(result.content[0].text).toContain("Browser default");
		expect(result.content[0].text).toContain("Not included");
	});

	it("should handle responsive options set to false", async () => {
		const result = await coverageDashboardDesignPromptBuilder({
			responsive: {
				mobileFirst: false,
				touchOptimized: false,
				collapsibleNavigation: false,
			},
		});

		expect(result.content[0].text).toContain("Desktop-first");
		expect(result.content[0].text).toContain("Standard");
		expect(result.content[0].text).toContain("Fixed");
	});

	it("should handle interactive features set to false", async () => {
		const result = await coverageDashboardDesignPromptBuilder({
			interactiveFeatures: {
				filters: false,
				sorting: false,
				search: false,
				tooltips: false,
				expandCollapse: false,
				drillDown: false,
				exportOptions: [],
				realTimeUpdates: false,
			},
		});

		// When all features are false, these should not appear
		expect(result.content[0].text).not.toContain("🔍 **Filters**");
		expect(result.content[0].text).not.toContain("↕️ **Sorting**");
		expect(result.content[0].text).not.toContain("🔎 **Search**");
		expect(result.content[0].text).not.toContain("💬 **Tooltips**");
		expect(result.content[0].text).not.toContain("📂 **Expand/Collapse**");
		expect(result.content[0].text).not.toContain("🔬 **Drill-down**");
		expect(result.content[0].text).not.toContain("⚡ **Real-time Updates**");
		expect(result.content[0].text).not.toContain("### Export Options");
	});

	it("should handle performance options set to false", async () => {
		const result = await coverageDashboardDesignPromptBuilder({
			performance: {
				lazyLoading: false,
				virtualScrolling: false,
				dataCaching: false,
				skeletonLoaders: false,
				progressiveEnhancement: false,
			},
		});

		// When all performance options are false, these should not appear
		expect(result.content[0].text).not.toContain("⏳ **Lazy Loading**");
		expect(result.content[0].text).not.toContain("📜 **Virtual Scrolling**");
		expect(result.content[0].text).not.toContain("💾 **Data Caching**");
		expect(result.content[0].text).not.toContain("🦴 **Skeleton Loaders**");
		expect(result.content[0].text).not.toContain(
			"🔄 **Progressive Enhancement**",
		);
	});

	it("should handle heuristics compliance with some heuristics disabled", async () => {
		const result = await coverageDashboardDesignPromptBuilder({
			heuristicsCompliance: {
				visibilityOfSystemStatus: false,
				matchWithRealWorld: false,
				userControlAndFreedom: true,
				consistencyAndStandards: true,
				errorPrevention: false,
				recognitionOverRecall: true,
				flexibilityAndEfficiency: false,
				aestheticAndMinimalist: true,
				helpUsersRecognizeErrors: false,
				helpAndDocumentation: true,
			},
		});

		// Disabled heuristics should show unchecked box
		expect(result.content[0].text).toContain(
			"### ⬜ Visibility of System Status",
		);
		expect(result.content[0].text).toContain("### ⬜ Match with Real World");
		expect(result.content[0].text).toContain("### ⬜ Error Prevention");
		expect(result.content[0].text).toContain(
			"### ⬜ Flexibility and Efficiency",
		);
		expect(result.content[0].text).toContain(
			"### ⬜ Help Users Recognize Errors",
		);

		// Enabled heuristics should show checked box
		expect(result.content[0].text).toContain("### ✅ User Control and Freedom");
		expect(result.content[0].text).toContain(
			"### ✅ Consistency and Standards",
		);
		expect(result.content[0].text).toContain("### ✅ Recognition over Recall");
		expect(result.content[0].text).toContain("### ✅ Aesthetic and Minimalist");
		expect(result.content[0].text).toContain("### ✅ Help and Documentation");
	});

	it("should handle iteration cycle with all options disabled", async () => {
		const result = await coverageDashboardDesignPromptBuilder({
			iterationCycle: {
				includeABTesting: false,
				includeAnalytics: false,
				includeFeedbackWidget: false,
				includeUsabilityMetrics: false,
			},
		});

		// When all iteration features are disabled, they should not appear
		expect(result.content[0].text).not.toContain("🧪 **A/B Testing**");
		expect(result.content[0].text).not.toContain(
			"📊 **Analytics Integration**",
		);
		expect(result.content[0].text).not.toContain("💬 **Feedback Widget**");
		expect(result.content[0].text).not.toContain("📈 **Usability Metrics**");
	});

	it("should handle useGradients set to false", async () => {
		const result = await coverageDashboardDesignPromptBuilder({
			useGradients: false,
		});

		expect(result.content[0].text).toContain("No - flat color scheme");
	});

	it("should handle sections without description", async () => {
		const result = await coverageDashboardDesignPromptBuilder({
			sections: [
				{
					sectionId: "test-section",
					title: "Test Section",
					collapsible: false,
					defaultExpanded: false,
				},
			],
		});

		expect(result.content[0].text).toContain("Test Section");
		expect(result.content[0].text).toContain("Collapsible: No");
		expect(result.content[0].text).toContain("Default: Collapsed");
	});

	it("should handle sections with metrics without optional fields", async () => {
		const result = await coverageDashboardDesignPromptBuilder({
			sections: [
				{
					sectionId: "metrics-section",
					title: "Metrics Section",
					metrics: [
						{
							metricName: "Basic Metric",
						},
					],
				},
			],
		});

		expect(result.content[0].text).toContain("Basic Metric");
		expect(result.content[0].text).toContain("percentage");
		expect(result.content[0].text).toContain("medium");
	});

	it("should handle empty targetUsers array", async () => {
		const result = await coverageDashboardDesignPromptBuilder({
			targetUsers: [],
		});

		// Should still have the Target Users section header
		expect(result.content[0].text).toContain("## 👥 Target Users");
	});

	it("should handle empty primaryMetrics array", async () => {
		const result = await coverageDashboardDesignPromptBuilder({
			primaryMetrics: [],
		});

		// Should still have the Primary Metrics Display section header
		expect(result.content[0].text).toContain("### Primary Metrics Display");
	});

	it("should handle empty visualIndicators array", async () => {
		const result = await coverageDashboardDesignPromptBuilder({
			visualIndicators: [],
		});

		// Should still have the Visual Indicators section header
		expect(result.content[0].text).toContain("### Visual Indicators");
	});

	it("should use projectContext in frontmatter description", async () => {
		const result = await coverageDashboardDesignPromptBuilder({
			projectContext: "Custom project context for testing",
			title: "Test Dashboard",
		});

		// Project context should be used in the frontmatter description
		expect(result.content[0].text).toContain(
			"Custom project context for testing",
		);
	});

	it("should handle all framework options", async () => {
		const frameworks = ["vue", "angular", "svelte", "static"] as const;
		for (const framework of frameworks) {
			const result = await coverageDashboardDesignPromptBuilder({
				framework,
			});
			expect(result.content[0].text).toContain(framework);
		}
	});

	it("should handle responsive breakpoints configuration", async () => {
		const result = await coverageDashboardDesignPromptBuilder({
			responsive: {
				breakpoints: {
					mobile: "400px",
					tablet: "800px",
					desktop: "1200px",
					largeDesktop: "1600px",
				},
			},
		});

		expect(result.content[0].text).toContain("400px");
		expect(result.content[0].text).toContain("800px");
		expect(result.content[0].text).toContain("1200px");
		expect(result.content[0].text).toContain("1600px");
	});

	it("should handle WCAG level A", async () => {
		const result = await coverageDashboardDesignPromptBuilder({
			accessibility: {
				wcagLevel: "A",
			},
		});

		expect(result.content[0].text).toContain("WCAG A");
	});
});
