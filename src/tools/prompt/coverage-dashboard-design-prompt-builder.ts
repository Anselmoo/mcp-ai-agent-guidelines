/**
 * Coverage Dashboard Design Prompt Builder
 *
 * Generates comprehensive UI/UX design prompts for coverage reporting dashboards.
 * Inspired by design iteration methodology and Nielsen's usability heuristics,
 * this tool helps create intuitive, accessible, and responsive coverage dashboards.
 */

import { z } from "zod";
import { DEFAULT_MODEL } from "../config/model-config.js";
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

// Schema for coverage metric card configuration
const CoverageMetricCardSchema = z.object({
	metricName: z.string(),
	displayFormat: z.enum(["percentage", "ratio", "trend", "badge"]).optional(),
	thresholds: z
		.object({
			critical: z.number().min(0).max(100).optional(),
			warning: z.number().min(0).max(100).optional(),
			good: z.number().min(0).max(100).optional(),
		})
		.optional(),
	showTrend: z.boolean().optional(),
	priority: z.enum(["high", "medium", "low"]).optional(),
});

// Schema for dashboard section configuration
const DashboardSectionSchema = z.object({
	sectionId: z.string(),
	title: z.string(),
	description: z.string().optional(),
	collapsible: z.boolean().optional(),
	defaultExpanded: z.boolean().optional(),
	metrics: z.array(CoverageMetricCardSchema).optional(),
});

// Schema for accessibility configuration
const AccessibilityConfigSchema = z.object({
	wcagLevel: z.enum(["A", "AA", "AAA"]).optional().default("AA"),
	colorBlindSafe: z.boolean().optional().default(true),
	keyboardNavigation: z.boolean().optional().default(true),
	screenReaderOptimized: z.boolean().optional().default(true),
	focusIndicators: z.boolean().optional().default(true),
	highContrastMode: z.boolean().optional().default(false),
});

// Schema for responsive design configuration
const ResponsiveConfigSchema = z.object({
	mobileFirst: z.boolean().optional().default(true),
	breakpoints: z
		.object({
			mobile: z.string().optional().default("320px"),
			tablet: z.string().optional().default("768px"),
			desktop: z.string().optional().default("1024px"),
			largeDesktop: z.string().optional().default("1440px"),
		})
		.optional(),
	touchOptimized: z.boolean().optional().default(true),
	collapsibleNavigation: z.boolean().optional().default(true),
});

// Schema for interactive features configuration
const InteractiveFeaturesSchema = z.object({
	filters: z.boolean().optional().default(true),
	sorting: z.boolean().optional().default(true),
	search: z.boolean().optional().default(true),
	tooltips: z.boolean().optional().default(true),
	expandCollapse: z.boolean().optional().default(true),
	drillDown: z.boolean().optional().default(true),
	exportOptions: z.array(z.string()).optional().default(["PDF", "CSV", "JSON"]),
	realTimeUpdates: z.boolean().optional().default(false),
});

// Schema for performance optimization configuration
const PerformanceConfigSchema = z.object({
	lazyLoading: z.boolean().optional().default(true),
	virtualScrolling: z.boolean().optional().default(true),
	dataCaching: z.boolean().optional().default(true),
	skeletonLoaders: z.boolean().optional().default(true),
	progressiveEnhancement: z.boolean().optional().default(true),
});

// Main schema for the coverage dashboard design prompt builder
const CoverageDashboardDesignSchema = z.object({
	// Basic info
	title: z.string().default("Coverage Dashboard Design"),
	projectContext: z.string().optional(),
	targetUsers: z
		.array(z.string())
		.optional()
		.default(["developers", "qa-engineers", "managers"]),

	// Dashboard configuration
	dashboardStyle: z
		.enum(["card-based", "table-heavy", "hybrid", "minimal"])
		.optional()
		.default("card-based"),
	primaryMetrics: z
		.array(z.string())
		.optional()
		.default(["statements", "branches", "functions", "lines"]),
	sections: z.array(DashboardSectionSchema).optional(),

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
		.optional()
		.default("auto"),
	primaryColor: z.string().optional().default("oklch(0.55 0.15 240)"), // Professional blue
	successColor: z.string().optional().default("oklch(0.65 0.18 145)"), // Green for good coverage
	warningColor: z.string().optional().default("oklch(0.70 0.20 85)"), // Yellow/amber for warnings
	dangerColor: z.string().optional().default("oklch(0.55 0.22 25)"), // Red for critical
	useGradients: z.boolean().optional().default(true),
	visualIndicators: z
		.array(z.string())
		.optional()
		.default(["progress-bars", "badges", "sparklines", "heat-maps"]),

	// Typography
	fontFamily: z.string().optional().default("Inter, system-ui, sans-serif"),
	codeFont: z.string().optional().default("JetBrains Mono, monospace"),

	// Accessibility
	accessibility: AccessibilityConfigSchema.optional(),

	// Responsive design
	responsive: ResponsiveConfigSchema.optional(),

	// Interactive features
	interactiveFeatures: InteractiveFeaturesSchema.optional(),

	// Performance
	performance: PerformanceConfigSchema.optional(),

	// UX patterns based on Nielsen's heuristics
	heuristicsCompliance: z
		.object({
			visibilityOfSystemStatus: z.boolean().optional().default(true),
			matchWithRealWorld: z.boolean().optional().default(true),
			userControlAndFreedom: z.boolean().optional().default(true),
			consistencyAndStandards: z.boolean().optional().default(true),
			errorPrevention: z.boolean().optional().default(true),
			recognitionOverRecall: z.boolean().optional().default(true),
			flexibilityAndEfficiency: z.boolean().optional().default(true),
			aestheticAndMinimalist: z.boolean().optional().default(true),
			helpUsersRecognizeErrors: z.boolean().optional().default(true),
			helpAndDocumentation: z.boolean().optional().default(true),
		})
		.optional(),

	// Iteration and feedback
	iterationCycle: z
		.object({
			includeABTesting: z.boolean().optional().default(false),
			includeAnalytics: z.boolean().optional().default(true),
			includeFeedbackWidget: z.boolean().optional().default(true),
			includeUsabilityMetrics: z.boolean().optional().default(true),
		})
		.optional(),

	// Framework preferences
	framework: z
		.enum(["react", "vue", "angular", "svelte", "static", "any"])
		.optional()
		.default("any"),
	componentLibrary: z.string().optional(),

	// Output configuration
	mode: z.string().optional().default("agent"),
	model: z.string().optional().default(DEFAULT_MODEL),
	tools: z
		.array(z.string())
		.optional()
		.default(["githubRepo", "codebase", "editFiles"]),
	includeFrontmatter: z.boolean().optional().default(true),
	includeDisclaimer: z.boolean().optional().default(true),
	includeReferences: z.boolean().optional().default(true),
	includeMetadata: z.boolean().optional().default(true),
	inputFile: z.string().optional(),
	forcePromptMdStyle: z.boolean().optional().default(true),

	// Prompting technique configuration
	techniques: z.array(TechniqueEnum).optional(),
	includeTechniqueHints: z.boolean().optional().default(false),
	autoSelectTechniques: z.boolean().optional().default(false),
	provider: ProviderEnum.optional().default("gpt-5"),
	style: StyleEnum.optional(),
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
		wcagLevel: "AA" as const,
		colorBlindSafe: true,
		keyboardNavigation: true,
		screenReaderOptimized: true,
		focusIndicators: true,
		highContrastMode: false,
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
		mobileFirst: true,
		breakpoints: {
			mobile: "320px",
			tablet: "768px",
			desktop: "1024px",
			largeDesktop: "1440px",
		},
		touchOptimized: true,
		collapsibleNavigation: true,
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
		filters: true,
		sorting: true,
		search: true,
		tooltips: true,
		expandCollapse: true,
		drillDown: true,
		exportOptions: ["PDF", "CSV", "JSON"] as string[],
		realTimeUpdates: false,
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
		lazyLoading: true,
		virtualScrolling: true,
		dataCaching: true,
		skeletonLoaders: true,
		progressiveEnhancement: true,
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
		includeABTesting: false,
		includeAnalytics: true,
		includeFeedbackWidget: true,
		includeUsabilityMetrics: true,
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
