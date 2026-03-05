/**
 * Coverage Dashboard Design Prompt Builder
 *
 * Generates comprehensive UI/UX design prompts for coverage reporting dashboards.
 * Inspired by design iteration methodology and Nielsen's usability heuristics,
 * this tool helps create intuitive, accessible, and responsive coverage dashboards.
 */

import { z } from "zod";
import { DEFAULT_MODEL, DEFAULT_MODEL_SLUG } from "../config/model-config.js";
import {
	buildDesignReferencesSection,
	buildProviderTipsSection,
	buildDisclaimer as buildSharedDisclaimer,
	buildTechniqueHintsSection,
	ProviderEnum,
	StyleEnum,
	TechniqueEnum,
} from "../shared/prompt-sections.js";
import {
	buildFrontmatterWithPolicy as buildFrontmatter,
	buildFurtherReadingSection,
	buildMetadataSection,
	slugify,
} from "../shared/prompt-utils.js";

// Shared default configuration constants
const DEFAULT_ACCESSIBILITY = {
	wcagLevel: "AA" as const,
	colorBlindSafe: true,
	keyboardNavigation: true,
	screenReaderOptimized: true,
	focusIndicators: true,
	highContrastMode: false,
};

const DEFAULT_RESPONSIVE = {
	mobileFirst: true,
	breakpoints: {
		mobile: "320px",
		tablet: "768px",
		desktop: "1024px",
		largeDesktop: "1440px",
	},
	touchOptimized: true,
	collapsibleNavigation: true,
};

const DEFAULT_INTERACTIVE = {
	filters: true,
	sorting: true,
	search: true,
	tooltips: true,
	expandCollapse: true,
	drillDown: true,
	exportOptions: ["PDF", "CSV", "JSON"] as string[],
	realTimeUpdates: false,
};

const DEFAULT_PERFORMANCE = {
	lazyLoading: true,
	virtualScrolling: true,
	dataCaching: true,
	skeletonLoaders: true,
	progressiveEnhancement: true,
};

const DEFAULT_ITERATION = {
	includeABTesting: false,
	includeAnalytics: true,
	includeFeedbackWidget: true,
	includeUsabilityMetrics: true,
};

// Schema for coverage metric card configuration
const CoverageMetricCardSchema = z.object({
	metricName: z
		.string()
		.describe("Coverage metric name (e.g., statements, branches, functions)"),
	displayFormat: z
		.enum(["percentage", "ratio", "trend", "badge"])
		.describe("How to display the metric value")
		.optional(),
	thresholds: z
		.object({
			critical: z
				.number()
				.describe("Critical threshold percentage")
				.min(0)
				.max(100)
				.optional(),
			warning: z
				.number()
				.describe("Warning threshold percentage")
				.min(0)
				.max(100)
				.optional(),
			good: z
				.number()
				.describe("Good coverage threshold percentage")
				.min(0)
				.max(100)
				.optional(),
		})
		.describe("Coverage threshold values for coloring")
		.optional(),
	showTrend: z
		.boolean()
		.describe("Whether to show coverage trend indicator")
		.optional(),
	priority: z
		.enum(["high", "medium", "low"])
		.describe("Display priority for the metric card")
		.optional(),
});

// Schema for dashboard section configuration
const DashboardSectionSchema = z.object({
	sectionId: z.string().describe("Unique identifier for the dashboard section"),
	title: z.string().describe("Section display title"),
	description: z.string().describe("Optional section description").optional(),
	collapsible: z
		.boolean()
		.describe("Whether the section can be collapsed")
		.optional(),
	defaultExpanded: z
		.boolean()
		.describe("Whether the section is expanded by default")
		.optional(),
	metrics: z
		.array(CoverageMetricCardSchema)
		.describe("Metric cards to display in this section")
		.optional(),
});

// Schema for accessibility configuration
const AccessibilityConfigSchema = z.object({
	wcagLevel: z
		.enum(["A", "AA", "AAA"])
		.describe("WCAG accessibility compliance level")
		.optional()
		.default(DEFAULT_ACCESSIBILITY.wcagLevel),
	colorBlindSafe: z
		.boolean()
		.describe("Use color-blind safe color palette")
		.optional()
		.default(DEFAULT_ACCESSIBILITY.colorBlindSafe),
	keyboardNavigation: z
		.boolean()
		.describe("Enable full keyboard navigation support")
		.optional()
		.default(DEFAULT_ACCESSIBILITY.keyboardNavigation),
	screenReaderOptimized: z
		.boolean()
		.describe("Optimize for screen reader compatibility")
		.optional()
		.default(DEFAULT_ACCESSIBILITY.screenReaderOptimized),
	focusIndicators: z
		.boolean()
		.describe("Show visible focus indicators for keyboard navigation")
		.optional()
		.default(DEFAULT_ACCESSIBILITY.focusIndicators),
	highContrastMode: z
		.boolean()
		.describe("Support high contrast display mode")
		.optional()
		.default(DEFAULT_ACCESSIBILITY.highContrastMode),
});

// Schema for responsive design configuration
const ResponsiveConfigSchema = z.object({
	mobileFirst: z
		.boolean()
		.describe("Use mobile-first responsive design approach")
		.optional()
		.default(DEFAULT_RESPONSIVE.mobileFirst),
	breakpoints: z
		.object({
			mobile: z
				.string()
				.describe("Mobile breakpoint (e.g., 768px)")
				.optional()
				.default(DEFAULT_RESPONSIVE.breakpoints.mobile),
			tablet: z
				.string()
				.describe("Tablet breakpoint (e.g., 1024px)")
				.optional()
				.default(DEFAULT_RESPONSIVE.breakpoints.tablet),
			desktop: z
				.string()
				.describe("Desktop breakpoint (e.g., 1280px)")
				.optional()
				.default(DEFAULT_RESPONSIVE.breakpoints.desktop),
			largeDesktop: z
				.string()
				.describe("Large desktop breakpoint (e.g., 1920px)")
				.optional()
				.default(DEFAULT_RESPONSIVE.breakpoints.largeDesktop),
		})
		.describe("Responsive breakpoint values")
		.optional(),
	touchOptimized: z
		.boolean()
		.describe("Optimize touch targets for mobile devices")
		.optional()
		.default(DEFAULT_RESPONSIVE.touchOptimized),
	collapsibleNavigation: z
		.boolean()
		.describe("Use collapsible navigation on smaller screens")
		.optional()
		.default(DEFAULT_RESPONSIVE.collapsibleNavigation),
});

// Schema for interactive features configuration
const InteractiveFeaturesSchema = z.object({
	filters: z
		.boolean()
		.describe("Enable filtering capabilities")
		.optional()
		.default(DEFAULT_INTERACTIVE.filters),
	sorting: z
		.boolean()
		.describe("Enable column/row sorting")
		.optional()
		.default(DEFAULT_INTERACTIVE.sorting),
	search: z
		.boolean()
		.describe("Enable search functionality")
		.optional()
		.default(DEFAULT_INTERACTIVE.search),
	tooltips: z
		.boolean()
		.describe("Show tooltips on hover")
		.optional()
		.default(DEFAULT_INTERACTIVE.tooltips),
	expandCollapse: z
		.boolean()
		.describe("Enable expand/collapse for nested data")
		.optional()
		.default(DEFAULT_INTERACTIVE.expandCollapse),
	drillDown: z
		.boolean()
		.describe("Enable drill-down into coverage details")
		.optional()
		.default(DEFAULT_INTERACTIVE.drillDown),
	exportOptions: z
		.array(z.string())
		.describe("Available export formats (e.g., csv, pdf, png)")
		.optional()
		.default(DEFAULT_INTERACTIVE.exportOptions),
	realTimeUpdates: z
		.boolean()
		.describe("Enable real-time data updates")
		.optional()
		.default(DEFAULT_INTERACTIVE.realTimeUpdates),
});

// Schema for performance optimization configuration
const PerformanceConfigSchema = z.object({
	lazyLoading: z
		.boolean()
		.describe("Lazy load dashboard sections and components")
		.optional()
		.default(DEFAULT_PERFORMANCE.lazyLoading),
	virtualScrolling: z
		.boolean()
		.describe("Use virtual scrolling for large data sets")
		.optional()
		.default(DEFAULT_PERFORMANCE.virtualScrolling),
	dataCaching: z
		.boolean()
		.describe("Cache coverage data for faster reloads")
		.optional()
		.default(DEFAULT_PERFORMANCE.dataCaching),
	skeletonLoaders: z
		.boolean()
		.describe("Show skeleton loaders while data is fetching")
		.optional()
		.default(DEFAULT_PERFORMANCE.skeletonLoaders),
	progressiveEnhancement: z
		.boolean()
		.describe("Use progressive enhancement for broader browser support")
		.optional()
		.default(DEFAULT_PERFORMANCE.progressiveEnhancement),
});

// Main schema for the coverage dashboard design prompt builder
const CoverageDashboardDesignSchema = z.object({
	// Basic info
	title: z
		.string()
		.describe("Dashboard title")
		.default("Coverage Dashboard Design"),
	projectContext: z
		.string()
		.describe("Project context or description for the dashboard")
		.optional(),
	targetUsers: z
		.array(z.string())
		.describe("Target user personas (e.g., developers, qa-engineers, managers)")
		.optional()
		.default(["developers", "qa-engineers", "managers"]),

	// Dashboard configuration
	dashboardStyle: z
		.enum(["card-based", "table-heavy", "hybrid", "minimal"])
		.describe("Dashboard layout style")
		.optional()
		.default("card-based"),
	primaryMetrics: z
		.array(z.string())
		.describe("Primary coverage metrics to display")
		.optional()
		.default(["statements", "branches", "functions", "lines"]),
	sections: z
		.array(DashboardSectionSchema)
		.describe("Custom dashboard sections")
		.optional(),

	// Visual design
	colorScheme: z
		.enum([
			"light",
			"dark",
			"auto",
			"high-contrast",
			"colorblind-safe",
			"custom",
		])
		.describe("Color scheme preference")
		.optional()
		.default("auto"),
	primaryColor: z
		.string()
		.describe("Primary color in OKLCH format")
		.optional()
		.default("oklch(0.55 0.15 240)"),
	successColor: z
		.string()
		.describe("Color for good/passing coverage")
		.optional()
		.default("oklch(0.65 0.18 145)"),
	warningColor: z
		.string()
		.describe("Color for warning-level coverage")
		.optional()
		.default("oklch(0.70 0.20 85)"),
	dangerColor: z
		.string()
		.describe("Color for critical/failing coverage")
		.optional()
		.default("oklch(0.55 0.22 25)"),
	useGradients: z
		.boolean()
		.describe("Use gradient visual indicators")
		.optional()
		.default(true),
	visualIndicators: z
		.array(z.string())
		.describe(
			"Visual indicator types (e.g., progress-bars, badges, sparklines, heat-maps)",
		)
		.optional()
		.default(["progress-bars", "badges", "sparklines", "heat-maps"]),

	// Typography
	fontFamily: z
		.string()
		.describe("UI font family")
		.optional()
		.default("Inter, system-ui, sans-serif"),
	codeFont: z
		.string()
		.describe("Code font family for file paths and identifiers")
		.optional()
		.default("JetBrains Mono, monospace"),

	// Accessibility
	accessibility: AccessibilityConfigSchema.describe(
		"Accessibility configuration",
	).optional(),

	// Responsive design
	responsive: ResponsiveConfigSchema.describe(
		"Responsive design configuration",
	).optional(),

	// Interactive features
	interactiveFeatures: InteractiveFeaturesSchema.describe(
		"Interactive feature configuration",
	).optional(),

	// Performance
	performance: PerformanceConfigSchema.describe(
		"Performance optimization settings",
	).optional(),

	// UX patterns based on Nielsen's heuristics
	heuristicsCompliance: z
		.object({
			visibilityOfSystemStatus: z
				.boolean()
				.describe("Keep users informed about system status")
				.optional()
				.default(true),
			matchWithRealWorld: z
				.boolean()
				.describe("Use real-world language and conventions")
				.optional()
				.default(true),
			userControlAndFreedom: z
				.boolean()
				.describe("Support undo and redo")
				.optional()
				.default(true),
			consistencyAndStandards: z
				.boolean()
				.describe("Follow platform conventions")
				.optional()
				.default(true),
			errorPrevention: z
				.boolean()
				.describe("Prevent errors before they occur")
				.optional()
				.default(true),
			recognitionOverRecall: z
				.boolean()
				.describe("Minimize user memory load")
				.optional()
				.default(true),
			flexibilityAndEfficiency: z
				.boolean()
				.describe("Support both novice and expert users")
				.optional()
				.default(true),
			aestheticAndMinimalist: z
				.boolean()
				.describe("Show only relevant information")
				.optional()
				.default(true),
			helpUsersRecognizeErrors: z
				.boolean()
				.describe("Provide clear error messages")
				.optional()
				.default(true),
			helpAndDocumentation: z
				.boolean()
				.describe("Provide searchable help documentation")
				.optional()
				.default(true),
		})
		.describe("Nielsen's usability heuristics compliance settings")
		.optional(),

	// Iteration and feedback
	iterationCycle: z
		.object({
			includeABTesting: z
				.boolean()
				.describe("Include A/B testing support")
				.optional()
				.default(false),
			includeAnalytics: z
				.boolean()
				.describe("Include usage analytics")
				.optional()
				.default(true),
			includeFeedbackWidget: z
				.boolean()
				.describe("Include user feedback widget")
				.optional()
				.default(true),
			includeUsabilityMetrics: z
				.boolean()
				.describe("Include usability metrics tracking")
				.optional()
				.default(true),
		})
		.describe("Design iteration and feedback cycle configuration")
		.optional(),

	// Framework preferences
	framework: z
		.enum(["react", "vue", "angular", "svelte", "static", "any"])
		.describe("Preferred frontend framework")
		.optional()
		.default("any"),
	componentLibrary: z
		.string()
		.describe("Preferred component library (e.g., MUI, Shadcn)")
		.optional(),

	// Output configuration
	mode: z
		.string()
		.describe("Execution mode for the generated prompt")
		.optional()
		.default("agent"),
	model: z
		.string()
		.describe("AI model identifier to use for generation")
		.optional()
		.default(DEFAULT_MODEL),
	tools: z
		.array(z.string())
		.describe("List of tools available to the agent")
		.optional()
		.default(["githubRepo", "codebase", "editFiles"]),
	includeFrontmatter: z
		.boolean()
		.describe("Whether to include YAML frontmatter in output")
		.optional()
		.default(true),
	includeDisclaimer: z
		.boolean()
		.describe("Whether to include a disclaimer section")
		.optional()
		.default(true),
	includeReferences: z
		.boolean()
		.describe("Whether to include reference links")
		.optional()
		.default(true),
	includeMetadata: z
		.boolean()
		.describe("Whether to include metadata section")
		.optional()
		.default(true),
	inputFile: z.string().describe("Input file path for reference").optional(),
	forcePromptMdStyle: z
		.boolean()
		.describe("Force *.prompt.md file style with frontmatter")
		.optional()
		.default(true),

	// Prompting technique configuration
	techniques: z
		.array(TechniqueEnum)
		.describe("Prompting techniques to apply")
		.optional(),
	includeTechniqueHints: z
		.boolean()
		.describe("Whether to include technique hint annotations")
		.optional()
		.default(false),
	autoSelectTechniques: z
		.boolean()
		.describe("Automatically select appropriate techniques based on context")
		.optional()
		.default(false),
	provider: ProviderEnum.describe("AI provider family for tailored tips")
		.optional()
		.default(DEFAULT_MODEL_SLUG),
	style: StyleEnum.describe("Preferred prompt formatting style").optional(),
});

export type CoverageDashboardDesignInput = z.infer<
	typeof CoverageDashboardDesignSchema
>;

function buildDashboardFrontmatter(
	input: CoverageDashboardDesignInput,
): string {
	const desc =
		input.projectContext ||
		input.title ||
		"Coverage Dashboard Design Prompt Template";
	return buildFrontmatter({
		mode: input.mode,
		model: input.model,
		tools: input.tools,
		description: desc,
	});
}

export async function coverageDashboardDesignPromptBuilder(args: unknown) {
	const input = CoverageDashboardDesignSchema.parse(args);

	const enforce = input.forcePromptMdStyle ?? true;
	const effectiveIncludeFrontmatter = enforce ? true : input.includeFrontmatter;
	const effectiveIncludeMetadata = enforce ? true : input.includeMetadata;

	const prompt = buildDashboardDesignPrompt(input);
	const frontmatter = effectiveIncludeFrontmatter
		? `${buildDashboardFrontmatter(input)}\n`
		: "";
	const disclaimer = input.includeDisclaimer ? buildSharedDisclaimer() : "";
	const references = input.includeReferences
		? buildCoverageDashboardReferences()
		: "";
	const filenameHint = `${slugify(input.title || "coverage-dashboard-design")}.prompt.md`;
	const metadata = effectiveIncludeMetadata
		? buildMetadataSection({
				sourceTool:
					"mcp_ai-agent-guid_coverage-dashboard-design-prompt-builder",
				inputFile: input.inputFile,
				filenameHint,
			})
		: "";

	return {
		content: [
			{
				type: "text",
				text: `${frontmatter}## 📊 Coverage Dashboard Design Prompt\n\n${metadata}\n${prompt}\n\n${input.includeTechniqueHints ? `${buildTechniqueHintsSection({ techniques: input.techniques, autoSelectTechniques: input.autoSelectTechniques })}\n\n` : ""}${buildProviderTipsSection(input.provider, input.style)}\n${references ? `${references}\n` : ""}${disclaimer}`,
			},
		],
	};
}

function buildDashboardDesignPrompt(
	input: CoverageDashboardDesignInput,
): string {
	const lines: string[] = [];

	// Header
	lines.push(`# ${input.title}`);
	lines.push("");
	if (input.projectContext) {
		lines.push(`**Project Context**: ${input.projectContext}`);
		lines.push("");
	}

	// Target Users
	lines.push("## 👥 Target Users");
	lines.push("");
	if (input.targetUsers?.length) {
		for (const user of input.targetUsers) {
			const userDescriptions: Record<string, string> = {
				developers:
					"🧑‍💻 **Developers** - Need quick access to file-level coverage and uncovered lines",
				"qa-engineers":
					"🧪 **QA Engineers** - Focus on test gaps and quality metrics over time",
				managers:
					"📊 **Managers** - Require high-level summaries and trend reports",
				"team-leads":
					"👨‍💼 **Team Leads** - Need module/team breakdown and actionable insights",
				"devops-engineers":
					"⚙️ **DevOps Engineers** - Focus on CI/CD integration and threshold enforcement",
			};
			lines.push(
				`- ${userDescriptions[user] || `**${user}** - Custom user persona`}`,
			);
		}
	}
	lines.push("");

	// Dashboard Architecture
	lines.push("## 🏗️ Dashboard Architecture");
	lines.push("");
	lines.push(`**Dashboard Style**: ${input.dashboardStyle}`);
	lines.push("");
	lines.push("### Primary Metrics Display");
	lines.push("");
	if (input.primaryMetrics?.length) {
		for (const metric of input.primaryMetrics) {
			const metricConfig = {
				statements: { icon: "📝", label: "Statement Coverage" },
				branches: { icon: "🔀", label: "Branch Coverage" },
				functions: { icon: "⚡", label: "Function Coverage" },
				lines: { icon: "📏", label: "Line Coverage" },
			};
			const config = metricConfig[metric as keyof typeof metricConfig] || {
				icon: "📈",
				label: metric,
			};
			lines.push(`- ${config.icon} **${config.label}**`);
		}
	}
	lines.push("");

	// Custom Sections
	if (input.sections?.length) {
		lines.push("### Custom Dashboard Sections");
		lines.push("");
		for (const section of input.sections) {
			lines.push(`#### ${section.title}`);
			if (section.description)
				lines.push(`- Description: ${section.description}`);
			lines.push(
				`- Collapsible: ${section.collapsible ? "Yes" : "No"} (Default: ${section.defaultExpanded ? "Expanded" : "Collapsed"})`,
			);
			if (section.metrics?.length) {
				lines.push("- Metrics:");
				for (const metric of section.metrics) {
					lines.push(
						`  - **${metric.metricName}** (${metric.displayFormat || "percentage"}, Priority: ${metric.priority || "medium"})`,
					);
				}
			}
			lines.push("");
		}
	}

	// Visual Design
	lines.push("## 🎨 Visual Design System");
	lines.push("");
	lines.push(`**Color Scheme**: ${input.colorScheme}`);
	lines.push("");
	lines.push("### Color Palette (OKLCH)");
	lines.push(`- **Primary**: ${input.primaryColor} - Navigation and actions`);
	lines.push(`- **Success**: ${input.successColor} - Good coverage (≥80%)`);
	lines.push(
		`- **Warning**: ${input.warningColor} - Warning coverage (60-79%)`,
	);
	lines.push(`- **Danger**: ${input.dangerColor} - Critical coverage (<60%)`);
	lines.push("");
	lines.push(
		`**Use Gradients**: ${input.useGradients ? "Yes - for progress bars and visual indicators" : "No - flat color scheme"}`,
	);
	lines.push("");

	// Visual Indicators
	lines.push("### Visual Indicators");
	if (input.visualIndicators?.length) {
		for (const indicator of input.visualIndicators) {
			const indicatorDescriptions: Record<string, string> = {
				"progress-bars": "📊 Progress bars with color-coded thresholds",
				badges: "🏷️ Status badges (Pass/Warn/Fail) with icons",
				sparklines: "📈 Mini trend charts showing coverage history",
				"heat-maps": "🗺️ Heat maps for file/directory coverage density",
				"gauge-charts": "⏱️ Circular gauge charts for overall metrics",
				"trend-arrows": "↗️ Trend arrows showing direction of change",
			};
			lines.push(`- ${indicatorDescriptions[indicator] || indicator}`);
		}
	}
	lines.push("");

	// Typography
	lines.push("### Typography");
	lines.push(`- **UI Font**: ${input.fontFamily}`);
	lines.push(`- **Code Font**: ${input.codeFont}`);
	lines.push("- **Hierarchy**:");
	lines.push("  - H1: Dashboard title (24-32px, bold)");
	lines.push("  - H2: Section headers (18-22px, semibold)");
	lines.push("  - Metric values: Large numbers (28-36px, bold)");
	lines.push("  - Labels: Small text (12-14px, regular)");
	lines.push("");

	// Accessibility
	lines.push("## ♿ Accessibility (WCAG Compliance)");
	lines.push("");
	const a11y = {
		...DEFAULT_ACCESSIBILITY,
		...input.accessibility,
	};
	lines.push(`**Target Level**: WCAG ${a11y.wcagLevel}`);
	lines.push("");
	lines.push("### Accessibility Features");
	lines.push(
		`- ✅ Color-blind safe palette: ${a11y.colorBlindSafe !== false ? "Enabled" : "Disabled"}`,
	);
	lines.push(
		`- ✅ Keyboard navigation: ${a11y.keyboardNavigation !== false ? "Full support" : "Limited"}`,
	);
	lines.push(
		`- ✅ Screen reader optimization: ${a11y.screenReaderOptimized !== false ? "ARIA labels and live regions" : "Basic"}`,
	);
	lines.push(
		`- ✅ Focus indicators: ${a11y.focusIndicators !== false ? "Visible focus rings" : "Browser default"}`,
	);
	lines.push(
		`- ✅ High contrast mode: ${a11y.highContrastMode ? "Available" : "Not included"}`,
	);
	lines.push("");
	lines.push("### Accessibility Best Practices");
	lines.push("- Use semantic HTML elements (`<main>`, `<nav>`, `<section>`)");
	lines.push("- Provide text alternatives for all visual indicators");
	lines.push("- Ensure minimum 4.5:1 contrast ratio for text");
	lines.push("- Support reduced motion preferences");
	lines.push("- Include skip navigation links");
	lines.push("");

	// Responsive Design
	lines.push("## 📱 Responsive Design");
	lines.push("");
	const responsive = {
		...DEFAULT_RESPONSIVE,
		...input.responsive,
	};
	lines.push(
		`**Approach**: ${responsive.mobileFirst !== false ? "Mobile-first" : "Desktop-first"}`,
	);
	lines.push("");
	lines.push("### Breakpoints");
	const bp = responsive.breakpoints || {};
	lines.push(
		`- 📱 Mobile: ${bp.mobile || "320px"} - Single column, stacked cards`,
	);
	lines.push(
		`- 📱 Tablet: ${bp.tablet || "768px"} - Two columns, collapsible sidebar`,
	);
	lines.push(
		`- 💻 Desktop: ${bp.desktop || "1024px"} - Full layout with sidebar`,
	);
	lines.push(
		`- 🖥️ Large Desktop: ${bp.largeDesktop || "1440px"} - Extended metrics view`,
	);
	lines.push("");
	lines.push("### Mobile Optimizations");
	lines.push(
		`- Touch-optimized: ${responsive.touchOptimized !== false ? "44px minimum touch targets" : "Standard"}`,
	);
	lines.push(
		`- Navigation: ${responsive.collapsibleNavigation !== false ? "Hamburger menu with slide-out" : "Fixed"}`,
	);
	lines.push("- Swipe gestures for metric cards");
	lines.push("- Pull-to-refresh for data updates");
	lines.push("");

	// Interactive Features
	lines.push("## 🔧 Interactive Features");
	lines.push("");
	const interactive = {
		...DEFAULT_INTERACTIVE,
		...input.interactiveFeatures,
	};
	lines.push("### User Controls");
	if (interactive.filters !== false)
		lines.push("- 🔍 **Filters**: By file type, coverage range, module, date");
	if (interactive.sorting !== false)
		lines.push("- ↕️ **Sorting**: By coverage %, file name, last modified");
	if (interactive.search !== false)
		lines.push("- 🔎 **Search**: Full-text search across files and metrics");
	if (interactive.tooltips !== false)
		lines.push("- 💬 **Tooltips**: Contextual information on hover/focus");
	if (interactive.expandCollapse !== false)
		lines.push("- 📂 **Expand/Collapse**: Drill into directories and files");
	if (interactive.drillDown !== false)
		lines.push("- 🔬 **Drill-down**: Click metrics to see detailed breakdown");
	if (interactive.realTimeUpdates)
		lines.push("- ⚡ **Real-time Updates**: Live coverage data via WebSocket");
	lines.push("");

	if (interactive.exportOptions?.length) {
		lines.push("### Export Options");
		for (const format of interactive.exportOptions) {
			const exportDescriptions: Record<string, string> = {
				PDF: "📄 PDF - Formatted report for sharing",
				CSV: "📊 CSV - Raw data for spreadsheet analysis",
				JSON: "📋 JSON - Structured data for integrations",
				PNG: "🖼️ PNG - Dashboard screenshot",
				HTML: "🌐 HTML - Standalone interactive report",
			};
			lines.push(`- ${exportDescriptions[format] || `📁 ${format}`}`);
		}
		lines.push("");
	}

	// Performance Optimization
	lines.push("## ⚡ Performance Optimization");
	lines.push("");
	const perf = {
		...DEFAULT_PERFORMANCE,
		...input.performance,
	};
	lines.push("### Loading Strategy");
	if (perf.lazyLoading !== false)
		lines.push("- ⏳ **Lazy Loading**: Load detailed data on demand");
	if (perf.virtualScrolling !== false)
		lines.push(
			"- 📜 **Virtual Scrolling**: Efficient rendering of large file lists",
		);
	if (perf.dataCaching !== false)
		lines.push("- 💾 **Data Caching**: Cache coverage data with TTL");
	if (perf.skeletonLoaders !== false)
		lines.push("- 🦴 **Skeleton Loaders**: Show placeholders during load");
	if (perf.progressiveEnhancement !== false)
		lines.push(
			"- 🔄 **Progressive Enhancement**: Core functionality without JS",
		);
	lines.push("");
	lines.push("### Performance Targets");
	lines.push("- First Contentful Paint: < 1.5s");
	lines.push("- Time to Interactive: < 3s");
	lines.push("- Lighthouse Performance Score: ≥ 90");
	lines.push("");

	// Nielsen's Heuristics
	lines.push("## 📐 UX Heuristics Compliance (Nielsen's 10)");
	lines.push("");
	const heuristics = input.heuristicsCompliance || {};
	const heuristicsList = [
		{
			key: "visibilityOfSystemStatus",
			name: "Visibility of System Status",
			implementation:
				"Loading states, progress indicators, last-updated timestamps",
		},
		{
			key: "matchWithRealWorld",
			name: "Match with Real World",
			implementation:
				"Developer-friendly terminology, familiar icons, intuitive metaphors",
		},
		{
			key: "userControlAndFreedom",
			name: "User Control and Freedom",
			implementation:
				"Undo filters, reset views, back navigation, bookmark states",
		},
		{
			key: "consistencyAndStandards",
			name: "Consistency and Standards",
			implementation:
				"Consistent color coding, predictable interactions, standard icons",
		},
		{
			key: "errorPrevention",
			name: "Error Prevention",
			implementation:
				"Validation on inputs, confirmation dialogs, safe defaults",
		},
		{
			key: "recognitionOverRecall",
			name: "Recognition over Recall",
			implementation: "Visible options, recent searches, quick actions menu",
		},
		{
			key: "flexibilityAndEfficiency",
			name: "Flexibility and Efficiency",
			implementation:
				"Keyboard shortcuts, customizable views, power-user features",
		},
		{
			key: "aestheticAndMinimalist",
			name: "Aesthetic and Minimalist",
			implementation: "Clean layout, progressive disclosure, focused content",
		},
		{
			key: "helpUsersRecognizeErrors",
			name: "Help Users Recognize Errors",
			implementation:
				"Clear error messages, actionable suggestions, visual indicators",
		},
		{
			key: "helpAndDocumentation",
			name: "Help and Documentation",
			implementation:
				"Contextual help, tooltips, onboarding tour, searchable docs",
		},
	];

	for (const h of heuristicsList) {
		const enabled = heuristics[h.key as keyof typeof heuristics] !== false;
		lines.push(`### ${enabled ? "✅" : "⬜"} ${h.name}`);
		if (enabled) {
			lines.push(`- ${h.implementation}`);
		}
		lines.push("");
	}

	// Design Iteration & Feedback
	lines.push("## 🔄 Design Iteration & Feedback Loop");
	lines.push("");
	const iteration = {
		...DEFAULT_ITERATION,
		...input.iterationCycle,
	};
	lines.push("### Iteration Features");
	if (iteration.includeABTesting)
		lines.push(
			"- 🧪 **A/B Testing**: Compare layout variations with user cohorts",
		);
	if (iteration.includeAnalytics !== false)
		lines.push(
			"- 📊 **Analytics Integration**: Track user behavior and engagement",
		);
	if (iteration.includeFeedbackWidget !== false)
		lines.push("- 💬 **Feedback Widget**: In-app feedback collection");
	if (iteration.includeUsabilityMetrics !== false)
		lines.push(
			"- 📈 **Usability Metrics**: Task completion rate, time-on-task",
		);
	lines.push("");
	lines.push("### Success Criteria");
	lines.push("- User satisfaction ≥ 80% in post-launch survey");
	lines.push("- 95% of users can identify low-coverage areas in < 30 seconds");
	lines.push("- Page load time < 2 seconds on mobile (3G)");
	lines.push("- Accessibility audit score ≥ 90%");
	lines.push("");

	// Framework & Implementation
	lines.push("## 🛠️ Implementation Guidance");
	lines.push("");
	lines.push(`**Preferred Framework**: ${input.framework}`);
	if (input.componentLibrary) {
		lines.push(`**Component Library**: ${input.componentLibrary}`);
	}
	lines.push("");
	lines.push("### Recommended Component Structure");
	lines.push("```");
	lines.push("coverage-dashboard/");
	lines.push("├── components/");
	lines.push("│   ├── MetricCard/          # Individual metric display");
	lines.push("│   ├── CoverageChart/       # Trend visualization");
	lines.push("│   ├── FileTree/            # Hierarchical file browser");
	lines.push("│   ├── FilterPanel/         # Search and filter controls");
	lines.push("│   ├── ExportMenu/          # Export functionality");
	lines.push("│   └── FeedbackWidget/      # User feedback collection");
	lines.push("├── hooks/");
	lines.push("│   ├── useCoverageData/     # Data fetching and caching");
	lines.push("│   ├── useFilters/          # Filter state management");
	lines.push("│   └── useAccessibility/    # A11y utilities");
	lines.push("├── utils/");
	lines.push("│   ├── thresholds.ts        # Coverage threshold logic");
	lines.push("│   ├── formatting.ts        # Number and date formatting");
	lines.push("│   └── colors.ts            # Color scale utilities");
	lines.push("└── styles/");
	lines.push("    ├── tokens.css           # Design tokens (CSS variables)");
	lines.push("    └── themes/              # Light/dark/high-contrast themes");
	lines.push("```");
	lines.push("");

	// CI/CD Integration
	lines.push("## 🔗 CI/CD Integration");
	lines.push("");
	lines.push("### Automated Design Iteration");
	lines.push("```yaml");
	lines.push("# .github/workflows/design-iterate.yml");
	lines.push("name: Design Iteration");
	lines.push("on:");
	lines.push("  schedule:");
	lines.push("    - cron: '0 0 * * 1'  # Weekly");
	lines.push("  workflow_dispatch:");
	lines.push("");
	lines.push("jobs:");
	lines.push("  design-review:");
	lines.push("    runs-on: ubuntu-latest");
	lines.push("    steps:");
	lines.push("      - uses: actions/checkout@v4");
	lines.push("      - name: Run Lighthouse Audit");
	lines.push("        run: npx lighthouse-ci");
	lines.push("      - name: Accessibility Audit");
	lines.push("        run: npx pa11y-ci");
	lines.push("      - name: Visual Regression Test");
	lines.push("        run: npm run test:visual");
	lines.push("      - name: Generate UX Report");
	lines.push("        run: npm run ux-metrics");
	lines.push("```");
	lines.push("");

	return lines.join("\n");
}

function buildCoverageDashboardReferences(): string {
	return (
		buildDesignReferencesSection() +
		"\n" +
		buildFurtherReadingSection([
			{
				title: "Nielsen's 10 Usability Heuristics",
				url: "https://www.nngroup.com/articles/ten-usability-heuristics/",
				description:
					"Foundation for user interface design evaluation and improvement",
			},
			{
				title: "WCAG 2.1 Guidelines",
				url: "https://www.w3.org/WAI/WCAG21/quickref/",
				description: "Web Content Accessibility Guidelines quick reference",
			},
			{
				title: "Responsive Design Patterns",
				url: "https://developers.google.com/web/fundamentals/design-and-ux/responsive/patterns",
				description: "Google's guide to responsive web design patterns",
			},
			{
				title: "Dashboard Design Best Practices",
				url: "https://www.uxpin.com/studio/blog/dashboard-design/",
				description: "Comprehensive guide to effective dashboard UX design",
			},
			{
				title: "Chart.js Documentation",
				url: "https://www.chartjs.org/docs/latest/",
				description: "Popular charting library for coverage visualizations",
			},
		])
	);
}
